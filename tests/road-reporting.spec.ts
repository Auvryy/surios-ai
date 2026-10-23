import { test, expect } from '@playwright/test';
import postgres from 'postgres';
import fs from 'node:fs/promises';
import { randomUUID, randomBytes } from 'node:crypto';
import { validateMedia } from '../src/lib/server/community-media';
import { verifyRoadSelection } from '../src/lib/server/roads';
import { recordHazardEvidence } from '../src/lib/server/hazard-reporting';
import { roadLength, selectRoadSegment, pointAlong, nearestRoadPoint, MAX_ROAD_METERS, type RoadWay } from '../src/lib/types/roads';
import { PHOTO_BYTES, VIDEO_BYTES } from '../src/lib/types/media';
import type { TriageAnalysis } from '../src/lib/types/triage';
const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const users = [randomUUID(), randomUUID()], token = randomBytes(32).toString('hex');
const reports = new Set<string>(), files: string[] = [];
const origin = 'http://127.0.0.1:5177';
const road: RoadWay = { id: '990001234567', name: 'Test Road', coordinates: [[32, 110], [32.002, 110], [32.004, 110.001]] };
const analysis: TriageAnalysis = { isValidInfrastructure: true, distressType: 'alligator_cracking', hazardSeverity: 5, riskLevel: 'MODERATE', vruLethality: 'LOW', vruDetails: 'Caution', recommendedAction: 'Inspect', materialsChecklist: [], estimatedDimensions: { depthEstimate: 'Unmeasured', surfaceAreaEstimate: 'Unmeasured' }, urgency: 'PRIORITY', summary: 'Test road section.' };
test.beforeAll(async () => { for (const id of users) await sql`insert into users(id,name,email,password_hash,role) values(${id},'Road test',${`${id}@example.test`},'unused','CITIZEN')`; await sql`insert into sessions(id,user_id,expires_at) values(${token},${users[0]},${new Date(Date.now()+3600000)})`; });
test.afterAll(async () => { await sql`delete from community_posts where user_id in ${sql(users)}`; if (reports.size) await sql`delete from reports where id in ${sql([...reports])}`; await sql`delete from users where id in ${sql(users)}`; await Promise.all(files.map(file=>fs.rm(file,{force:true}))); await sql.end(); });
test('server enforces 5 MiB images and 25 MiB common videos, including format signatures', async () => {
	for (const [type, bytes, signature, name] of [['image/jpeg',PHOTO_BYTES,Buffer.from([255,216,255]),'road.jpg'],['video/mp4',VIDEO_BYTES,Buffer.from('0000ftyp'),'road.mp4']] as const) {
		const data=Buffer.alloc(bytes); signature.copy(data);
		const [valid]=await validateMedia([new File([data],name,{type})]); expect(valid.buffer.length).toBe(bytes);
		await expect(validateMedia([new File([Buffer.concat([data,Buffer.from([0])])],name,{type})])).rejects.toMatchObject({status:413});
	}
	await expect(validateMedia([new File(['fake'],'road.jpg',{type:'image/jpeg'})])).rejects.toMatchObject({status:400});
	await expect(validateMedia([new File(['bad'],'road.exe',{type:'application/octet-stream'})])).rejects.toMatchObject({status:400});
});
test('road selection follows real geometry and server rejects forged or oversized offsets', async () => {
	const oldFetch = globalThis.fetch;
	globalThis.fetch = async () => new Response(JSON.stringify({elements:[...road.coordinates.map((point,index)=>({type:'node',id:index+1,lat:point[0],lon:point[1]})),{type:'way',id:Number(road.id),tags:{highway:'residential',name:road.name},nodes:[1,2,3]}]}),{headers:{'Content-Type':'application/json'}});
	try {
		const selected = await verifyRoadSelection({ id: road.id, start: 20, end: 420 }); expect(selected.length).toBe(400); expect(selected.coordinates.length).toBe(3);
		expect(nearestRoadPoint(road.coordinates,selected.coordinates[0]).distance).toBeLessThan(.01);
		await expect(verifyRoadSelection({id:road.id,start:0,end:MAX_ROAD_METERS+1})).rejects.toMatchObject({status:400});
		await expect(verifyRoadSelection({id:road.id,start:-1,end:30})).rejects.toMatchObject({status:400});
		await expect(verifyRoadSelection({id:road.id,start:roadLength(road.coordinates),end:roadLength(road.coordinates)+30})).rejects.toMatchObject({status:400});
	} finally { globalThis.fetch=oldFetch; }
});
async function evidence(index:number,start:number,end:number,photo='alligator-fatigue.jpg',severity=5) {
	const roadSegment=selectRoadSegment(road,start,end), center=pointAlong(roadSegment.coordinates,roadSegment.length/2),id=randomUUID(),filename=`static/uploads/community/${id}.jpg`;
	await fs.copyFile(`static/samples/${photo}`,filename);files.push(filename);
	return {sourceId:randomUUID(),userId:users[index],roadSegment,latitude:center[0],longitude:center[1],locationName:road.name,analysis:{...analysis,hazardSeverity:severity,riskLevel:severity>=8?'CRITICAL' as const:'MODERATE' as const},media:[{id,url:`/media/${id}.jpg`,name:photo,mimeType:'image/jpeg',kind:'photo' as const}]};
}
test('overlapping road sections link matching evidence across different pins, increase priority, and retain separate hazards',async({request})=>{
	const first=await recordHazardEvidence(await evidence(0,0,250)); reports.add(first.reportId);
	const second=await recordHazardEvidence(await evidence(1,100,450)); reports.add(second.reportId);
	expect(second.reportId).toBe(first.reportId); expect(second.support).toBe(2); expect(second.priority).toBeGreaterThan(first.priority);
	const stronger=await recordHazardEvidence(await evidence(1,100,450,'pothole-severe.jpg',8),async()=>({reportId:first.reportId,confidence:.96,reason:'Same matching pavement section.'}));reports.add(stronger.reportId);expect(stronger.severity).toBe(8);
	const postId=randomUUID(),mediaId=randomUUID();await sql`insert into community_posts(id,user_id,draft_id,report_id,title,body,location_name,latitude,longitude,media,cover_id,analysis) values(${postId},${users[0]},${randomUUID()},${first.reportId},${`road-shared-${postId}`},'Earlier milder source','Test Road',32,110,${sql.json([{id:mediaId,url:'/samples/alligator-fatigue.jpg',name:'source.jpg',mimeType:'image/jpeg',kind:'photo'}])},${mediaId},${sql.json(analysis)})`;
	const shared=await request.get(`/api/community/posts?q=${postId}&tab=critical&sort=severity`);const sharedData=await shared.json();expect(sharedData.posts).toHaveLength(1);expect(sharedData.posts[0].reportSeverity).toBe(8);expect(sharedData.posts[0].analysis.hazardSeverity).toBe(5);
	const different=await recordHazardEvidence(await evidence(0,300,500,'non-road-spam.jpg'),async()=>({reportId:null,confidence:.3,reason:'Different physical defect.'})); reports.add(different.reportId); expect(different.reportId).not.toBe(first.reportId);
});
test('feed media controls immediately open restricted file pickers; Orie road controls work on mobile',async({page,baseURL})=>{
	await page.context().addCookies([{name:'surios_session',value:token,url:baseURL!}]);await page.goto('/community');await page.waitForLoadState('networkidle');
	await expect(page.getByTitle('Switch demo persona')).toHaveCount(0);
	let chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Photos',exact:true}).click();let input=await chooser;expect(await input.element().getAttribute('accept')).toBe('image/jpeg,image/png,image/webp');
	await input.setFiles({name:'road.jpg',mimeType:'image/jpeg',buffer:await fs.readFile('static/samples/alligator-fatigue.jpg')});await expect(page.getByAltText('Selected cover',{exact:true})).toBeVisible();
	await page.getByRole('button',{name:'Close',exact:true}).click();
	chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Video',exact:true}).click();input=await chooser;expect(await input.element().getAttribute('accept')).toBe('video/mp4,video/webm,video/quicktime');await input.setFiles([]);
	await page.setViewportSize({width:375,height:812});await page.getByRole('button',{name:'What’s happening on your road?'}).click();await page.getByRole('button',{name:'Road section',exact:true}).click();
	const demo=JSON.parse(await fs.readFile('static/samples/demo-road.json','utf8')).road;
	await page.route('**/api/roads?*',route=>route.fulfill({json:{roads:[{...demo,coordinates:[[14.2813,121.4173],[14.285,121.4173]]}]}}));
	await page.getByRole('button',{name:'Drop Orie at map center'}).dragTo(page.getByRole('region',{name:'Hazard location picker'}));await expect(page.getByLabel('Road start',{exact:true})).toBeVisible();
	const end=page.getByLabel('Road end',{exact:true});await end.fill('400');await expect(page.getByText(/Pedro Guevarra Avenue · 400 m/)).toBeVisible();
	await expect(page.locator('.road-end')).toHaveCount(2);expect(await page.locator('[role="dialog"]').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
	await page.getByRole('button',{name:'Point pin',exact:true}).click();await expect(page.getByLabel('Latitude',{exact:true})).toBeVisible();
});
test('saved demo road has media/map and a live map line; likes are independent of hazard support',async({page,request,baseURL})=>{
	const [post]=await sql`select p.id,p.report_id from community_posts p join reports r on r.id=p.report_id where r.triage_payload->>'seedKey'='road-section-presentation-v1'`;
	expect(post).toBeTruthy();await page.context().addCookies([{name:'surios_session',value:token,url:baseURL!}]);
	const [before]=await sql`select community_confirmations,hazard_severity from reports where id=${post.report_id}`;
	await page.goto(`/community/post/${post.id}`);await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Like',exact:true}).first().click();await expect(page.getByRole('button',{name:'Liked',exact:true}).first()).toBeVisible();
	const [after]=await sql`select community_confirmations,hazard_severity from reports where id=${post.report_id}`;expect(after).toEqual(before);
	await page.getByRole('button',{name:/Show location map/}).click();await expect(page.getByRole('link',{name:'Open original report map'})).toBeVisible();
	await page.goto(`/map?report=${post.report_id}`);await expect(page.locator('.leaflet-overlay-pane canvas').first()).toBeVisible();await page.getByRole('button',{name:/View .* m road section/}).click();await expect(page.getByRole('region',{name:'Hazard details'})).toHaveCount(0);
	await page.goto('/liked');await expect(page).toHaveURL(/tab=liked/);await expect(page.locator(`#post-${post.id}`)).toBeVisible();
});

test('removed account switch cannot issue a session for another seeded account',async({request})=>{
	const response=await request.post('/profile?/switchPersona',{headers:{Origin:origin,Cookie:`surios_session=${token}`},form:{email:'engineer@surios.gov',redirectTo:'auto'},maxRedirects:0});
	expect(response.status()).toBe(404);const cookie=response.headers()['set-cookie']; if(cookie) expect(cookie).toContain(`surios_session=${token};`); const [session]=await sql`select user_id from sessions where id=${token}`; expect(session.user_id).toBe(users[0]);
});
