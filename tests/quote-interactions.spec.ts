import { test, expect, type APIRequestContext } from '@playwright/test';
import postgres from 'postgres';
import { randomUUID, randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const marker = `quotegallery${randomUUID().replaceAll('-', '')}`;
const roles = ['ENGINEER', 'CITIZEN', 'OFFICER'];
const accounts = roles.map(role => ({ role, id: randomUUID(), token: randomBytes(32).toString('hex') }));
const report = randomUUID(), post = randomUUID(), photoId = randomUUID();
const evidenceUrls = new Set<string>();
let photo: Buffer;
const origin = 'http://127.0.0.1:5177';
const headers = (index = 0) => ({ Origin: origin, Cookie: `surios_session=${accounts[index].token}` });
const analysis = { isValidInfrastructure: true, distressType: 'pothole', hazardSeverity: 5, riskLevel: 'MODERATE', vruLethality: 'LOW', vruDetails: 'Test', summary: 'Test', recommendedAction: 'Inspect', materialsChecklist: [], estimatedDimensions: { depthEstimate: 'Unmeasured', surfaceAreaEstimate: 'Unmeasured' }, urgency: 'PRIORITY' };
let officialId = '';
async function upload(api: APIRequestContext, index = 0, name = 'repair.jpg') {
	const response = await api.post('/api/community/government-media', { headers: headers(index), multipart: { file: { name, mimeType: 'image/jpeg', buffer: photo } } });
	if (response.ok()) { const result = await response.json(); evidenceUrls.add(result.media.url); return result; }
	return { status: response.status() };
}
async function publish(api: APIRequestContext, ids: string[], id = randomUUID(), index = 0) {
	return api.post('/api/community/reposts', { headers: headers(index), multipart: { id, postId: post, body: `${marker} repair completed with public evidence.`, status: 'RESOLVED', budget: JSON.stringify([{ label: 'Materials', amount: 3000 }, { label: 'Labor', amount: 2000 }]), budgetType: 'ACTUAL', evidenceIds: JSON.stringify(ids) } });
}
async function makeOfficial(api: APIRequestContext) { const file = await upload(api); const result = await publish(api, [file.id]); expect(result.status()).toBe(201); officialId = (await result.json()).id; return officialId; }
async function baseline() { return (await sql`select hazard_severity, community_confirmations, (select count(*)::int from report_observations where report_id=${report}) observations from reports where id=${report}`)[0]; }

test.beforeAll(async () => {
	photo = await fs.readFile('static/samples/pothole-severe.jpg');
	await sql.begin(async tx => {
		for (const account of accounts) {
			await tx`insert into users(id,name,email,role,password_hash) values(${account.id},${`${marker} ${account.role}`},${`${account.id}@example.test`},${account.role},'unused')`;
			await tx`insert into sessions(id,user_id,expires_at) values(${account.token},${account.id},${new Date(Date.now()+86400000)})`;
		}
		await tx`insert into reports(id,image_path,latitude,longitude,distress_type,hazard_severity,risk_level,vru_lethality,recommended_action,community_confirmations,triage_payload) values(${report},'/samples/pothole-severe.jpg',14.28,121.42,'pothole',5,'MODERATE','LOW','Inspect',2,${tx.json(analysis)})`;
		await tx`insert into community_posts(id,user_id,draft_id,report_id,title,body,location_name,latitude,longitude,media,cover_id,analysis) values(${post},${accounts[1].id},${randomUUID()},${report},${marker},'Citizen source report.','Test Road',14.28,121.42,${tx.json([{id:photoId,url:'/samples/pothole-severe.jpg',kind:'photo',name:'original.jpg',mimeType:'image/jpeg'},{id:randomUUID(),url:'/samples/alligator-fatigue.jpg',kind:'photo',name:'second.jpg',mimeType:'image/jpeg'}])},${photoId},${tx.json(analysis)})`;
	});
});
test.afterAll(async () => {
	await sql`delete from community_posts where id=${post}`;
	await sql`delete from reports where id=${report}`;
	await sql`delete from users where id in ${sql(accounts.map(account=>account.id))}`;
	await sql.end();
	for(const url of evidenceUrls) await fs.rm(path.join('static/uploads/community',path.basename(url)),{force:true});
});

test('an official can publish nine photos with +5 overflow, inspect every photo, and see a compact original/map', async ({ page, baseURL }) => {
	await page.context().addCookies([{name:'surios_session',value:accounts[0].token,url:baseURL!}]);
	const before=await baseline();
	await page.goto(`/community/post/${post}`);await page.waitForLoadState('networkidle');
	await page.getByRole('button',{name:'Update',exact:true}).click();
	await page.getByLabel('Repost text',{exact:true}).fill(`${marker} repair completed. Evidence and budget attached.`);
	await page.getByLabel('Report status',{exact:true}).selectOption('RESOLVED');
	await page.getByLabel('Government evidence',{exact:true}).setInputFiles(Array.from({length:9},(_,i)=>({name:`work-${i+1}.jpg`,mimeType:'image/jpeg',buffer:photo})));
	await page.getByRole('button',{name:'Publish update',exact:true}).click();
	await expect(page).toHaveURL(/\?repost=/);officialId=new URL(page.url()).searchParams.get('repost')!;
	const quote=page.locator(`#repost-${officialId}`);
	await expect(quote.locator('[data-gallery-overflow]')).toContainText('+5');
	await expect(quote.locator('[data-government-status]')).toHaveText('Resolved');
	await expect(quote.locator('[data-government-status]')).toHaveClass(/bg-emerald-600/);
	await expect(quote.locator('[data-quoted-source] a > img')).toHaveCount(2);
	await expect(quote.getByRole('link',{name:'Open original report map',exact:true})).toBeVisible();
	await expect(quote.getByRole('img',{name:'Map of Test Road',exact:true})).toHaveClass(/leaflet-container/);
	const [saved]=await sql`select government_update from community_reposts where id=${officialId}`;expect(saved.government_update.attachments).toHaveLength(9);for(const media of saved.government_update.attachments)evidenceUrls.add(media.url);
	await quote.getByRole('link',{name:'View all 9 photos',exact:true}).click();
	for(let index=0;index<9;index++){await expect(quote.locator('[data-quote-gallery] > div > img')).toHaveAttribute('alt',`work-${index+1}.jpg`);if(index<8){ const next=quote.getByRole('link',{name:'Next government photo',exact:true}); await next.scrollIntoViewIfNeeded(); const beforeScroll=await page.evaluate(()=>window.scrollY); await next.click(); await expect(quote.locator('[data-quote-gallery] > div > img')).toHaveAttribute('alt',`work-${index+2}.jpg`); expect(Math.abs((await page.evaluate(()=>window.scrollY))-beforeScroll)).toBeLessThan(5); }}
	for(const width of [320,375,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);}
	await page.setViewportSize({width:375,height:900});await page.goto(`/community/post/${post}?repost=${officialId}`);await page.waitForLoadState('networkidle');await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'.svelte-kit/quote-gallery-mobile.png',fullPage:true});
	expect(await baseline()).toEqual(before);
});

test('likes, comments, replies and comment likes belong to the government quote, persist, and leave hazard evidence unchanged', async ({page,request,baseURL})=>{
	const id=await makeOfficial(request);const before=await baseline();
	await page.context().addCookies([{name:'surios_session',value:accounts[1].token,url:baseURL!}]);
	await page.goto(`/community/post/${post}?repost=${id}`);await page.waitForLoadState('networkidle');const quote=page.locator(`#repost-${id}`);
	await quote.getByRole('button',{name:'Like',exact:true}).click();await expect(quote.getByRole('button',{name:'Liked',exact:true})).toHaveAttribute('aria-pressed','true');
	await quote.getByLabel(`Comment on update by ${marker} ENGINEER`,{exact:true}).fill('Thank you for the repair update.');await quote.getByRole('button',{name:'Send comment',exact:true}).click();
	await expect(quote.locator('[data-quote-comment-id]')).toHaveCount(1);
	await quote.getByRole('button',{name:'Reply',exact:true}).click();await quote.getByLabel(`Comment on update by ${marker} ENGINEER`,{exact:true}).fill('Could you confirm the reopening date?');await quote.getByRole('button',{name:'Send reply',exact:true}).click();
	await expect(quote.locator('[data-quote-comment-id]')).toHaveCount(2);
	await quote.getByRole('button',{name:`Like comment by ${marker} CITIZEN`,exact:true}).first().click();await expect(quote.getByRole('button',{name:`Like comment by ${marker} CITIZEN`,exact:true}).first()).toHaveAttribute('aria-pressed','true');
	await page.reload();await expect(quote.getByRole('button',{name:'Liked',exact:true})).toBeVisible();await expect(quote.locator('[data-quote-comment-id]')).toHaveCount(2);
	await page.goto(`/community?q=${id}`); // quote lookup verified through original-post query below
	await page.goto(`/community?q=${post}`);await expect(page.locator(`#repost-${id} [data-quote-comment-id]`)).toHaveCount(1);
	expect(await baseline()).toEqual(before);
	const [counts]=await sql`select (select count(*)::int from community_comments where post_id=${post}) original_comments, (select count(*)::int from community_quote_comments where repost_id=${id}) quote_comments`;expect(counts).toEqual({original_comments:0,quote_comments:2});
});

test('reposting an official update preserves the government target, evidence and status without creating a new official action',async({page,request,baseURL})=>{
	const id=await makeOfficial(request);const before=await baseline();
	await page.context().addCookies([{name:'surios_session',value:accounts[1].token,url:baseURL!}]);await page.goto(`/community/post/${post}?repost=${id}`);await page.waitForLoadState('networkidle');
	await page.locator(`#repost-${id}`).getByRole('button',{name:'Repost',exact:true}).click();await expect(page.getByRole('heading',{name:'Repost',exact:true})).toBeVisible();await expect(page.getByLabel('Report status',{exact:true})).toHaveCount(0);
	await page.getByLabel('Repost text',{exact:true}).fill('Sharing the municipal completion update.');await page.getByRole('button',{name:'Publish repost',exact:true}).click();await expect(page).toHaveURL(url=>Boolean(url.searchParams.get('repost')) && url.searchParams.get('repost')!==id);
	const childId=new URL(page.url()).searchParams.get('repost')!;expect(childId).not.toBe(id);
	const [saved]=await sql`select quoted_repost_id,government_update from community_reposts where id=${childId}`;expect(saved.quoted_repost_id).toBe(id);expect(saved.government_update).toBeNull();
	await expect(page.locator(`#repost-${childId} [data-quoted-source]`)).toContainText(`${marker} ENGINEER`);
	await page.goto(`/community/post/${post}?repost=${id}`);await expect(page.locator(`#repost-${id}`).getByText(/1 reposts/)).toBeVisible();expect(await baseline()).toEqual(before);
});

test('staged files enforce ownership, expiry, single claiming and retry idempotency, with no four-photo limit',async({request})=>{
	const file=await upload(request);expect(file.id).toBeTruthy();
	const unauthorized=await publish(request,[file.id],randomUUID(),2);expect(unauthorized.status()).toBe(400);
	const duplicate=await publish(request,[file.id,file.id]);expect(duplicate.status()).toBe(400);
	const id=randomUUID();const results=await Promise.all([publish(request,[file.id],id),publish(request,[file.id],id)]);for(const response of results)expect(response.status()).toBe(201);
	const [count]=await sql`select count(*)::int n from community_reposts where id=${id}`;expect(count.n).toBe(1);
	expect((await publish(request,[file.id])).status()).toBe(400);
	expect((await request.delete(`/api/community/government-media?id=${file.id}`,{headers:headers()})).status()).toBe(404);
	const expired=await upload(request);await sql`update government_media set expires_at=now()-interval '1 second' where id=${expired.id}`;expect((await publish(request,[expired.id])).status()).toBe(400);
	const citizen=await upload(request,1);expect(citizen.status).toBe(403);
});

test('guest interactions, cross-origin reactions and cross-thread replies are refused',async({request})=>{
	const id=await makeOfficial(request);const other=await makeOfficial(request);
	const guest=await request.post(`/api/community/reposts/${id}`,{headers:{Origin:origin,Cookie:''},data:{action:'like',liked:true}});expect(guest.status()).toBe(401);
	const badOrigin=await request.post(`/api/community/reposts/${id}`,{headers:{...headers(1),Origin:'https://example.test'},data:{action:'like',liked:true}});expect(badOrigin.status()).toBe(403);
	const parent=await request.post(`/api/community/reposts/${id}`,{headers:headers(1),data:{action:'comment',body:'A quote-specific comment.'}});const commentId=(await parent.json()).id;
	const cross=await request.post(`/api/community/reposts/${other}`,{headers:headers(1),data:{action:'comment',body:'Wrong thread',parentId:commentId}});expect(cross.status()).toBe(400);
	const like=await request.post(`/api/community/reposts/${other}/comments/${commentId}`,{headers:headers(1),data:{liked:true}});expect(like.status()).toBe(404);
});

test('the shared Share dialog copies the government quote permalink, including its specific update',async({page,request,baseURL})=>{
	const id=await makeOfficial(request);
	await page.addInitScript(()=>{
		const state=window as typeof window & { quoteLinks:string[] };state.quoteLinks=[];
		Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
		Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text:string)=>{state.quoteLinks.push(text);}}});
	});
	await page.goto(`/community/post/${post}?repost=${id}`);await page.waitForLoadState('networkidle');
	await page.locator(`#repost-${id}`).getByRole('button',{name:'Share',exact:true}).click();
	const dialog=page.getByRole('dialog',{name:'Share post',exact:true});await expect(dialog).toBeVisible();
	await dialog.getByRole('button',{name:'Copy link',exact:true}).click();await expect(dialog.getByRole('status')).toHaveText('Link copied.');
	const expected=`${baseURL}/community/post/${post}?repost=${id}#repost-${id}`;
	expect(await page.evaluate(()=>(window as typeof window & {quoteLinks:string[]}).quoteLinks)).toEqual([expected]);
	const facebook=await dialog.getByRole('link',{name:'Facebook',exact:true}).getAttribute('href');expect(new URL(facebook!).searchParams.get('u')).toBe(expected);
});

test('Liked filter and Most liked sort use each quote’s own reactions, independently of its citizen source', async ({request})=>{
	const id=await makeOfficial(request);
	const response=await request.post(`/api/community/reposts/${id}`,{headers:headers(1),data:{action:'like',liked:true}});expect(response.status()).toBe(200);
	const liked=await request.get(`/api/community/posts?q=${marker}&tab=liked&sort=likes`,{headers:headers(1)});const result=await liked.json();
	expect(result.feed.some((item:any)=>item.kind==='repost'&&item.id===id)).toBe(true);
	expect(result.feed.some((item:any)=>item.kind==='post'&&item.id===post)).toBe(false);
	const sorted=await request.get(`/api/community/posts?q=${marker}&sort=likes`,{headers:headers(1)});expect((await sorted.json()).feed[0].id).toBe(id);
	const oldLink=await request.get(`/api/community/posts?q=${marker}&tab=confirmed`,{headers:headers(1)});expect((await oldLink.json()).filters.tab).toBe('liked');
});
