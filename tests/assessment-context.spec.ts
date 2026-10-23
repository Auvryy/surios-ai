import { test, expect, type APIRequestContext } from '@playwright/test';
import postgres from 'postgres';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const sql=postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios',{max:1});
const origin='http://127.0.0.1:5177';
const mock='http://127.0.0.1:5198';
const marker=`context${randomUUID().replaceAll('-','')}`;
let userId:string,token:string,otherId:string,otherToken:string;
let photo:Buffer;
const headers=(other=false)=>({Origin:origin,Cookie:`surios_session=${other?otherToken:token}`});
async function control(mode='valid',extra:Record<string,unknown>={}) {await fetch(mock+'/control',{method:'POST',body:JSON.stringify({mode,...extra})});}
async function assess(api:APIRequestContext,headline='Public heritage building beside the public footpath',caption='Residents report debris encroaching onto the public access route.',id=randomUUID()) {
	return api.post('/api/community/assess',{headers:{...headers(),'x-assessment-id':id},multipart:{headline,caption,media:{name:'asset.jpg',mimeType:'image/jpeg',buffer:photo}}});
}
async function clearDrafts() {
	const rows=await sql`select media from community_drafts where user_id=${userId}`;
	for(const row of rows)for(const item of row.media)await fs.rm('static/uploads/community/'+item.url.split('/').pop(),{force:true});
	await sql`delete from community_drafts where user_id=${userId}`;
}
test.beforeAll(async()=>{
	photo=await fs.readFile('static/samples/pothole-severe.jpg');
	for(const name of ['reporter','other']){
		const [user]=await sql`insert into users(name,email,password_hash) values(${marker+name},${marker+name+'@example.test'},'unused') returning id`;
		const session=randomUUID();await sql`insert into sessions(id,user_id,expires_at) values(${session},${user.id},now()+interval '1 day')`;
		if(name==='reporter'){userId=user.id;token=session;}else{otherId=user.id;otherToken=session;}
	}
});
test.beforeEach(async()=>{await control();await clearDrafts();});
test.afterAll(async()=>{await clearDrafts();await sql`delete from users where id in ${sql([userId,otherId])}`;await sql.end();});

test('headline and caption reach the AI as labeled context; public use is considered without overriding visual evidence',async({request})=>{
	const response=await assess(request);expect(response.status()).toBe(200);
	const data=await response.json();
	expect(data.context.headline).toContain('Public heritage');
	const calls=await(await fetch(mock+'/requests')).json();expect(calls).toHaveLength(1);
	expect(calls[0].texts[0]).toContain('Read the reporter\'s headline and caption BEFORE deciding relevance');
	expect(calls[0].texts[0]).toContain('Unknown ownership alone is NOT grounds for rejection');
	expect(calls[0].texts[0]).toContain('uncertain clearance or uncertain obstruction cannot support criticalDangerVisible');
	expect(calls[0].texts[0]).toContain('word public alone cannot make a selfie');
	expect(calls[0].texts[1]).toContain('"headline":"Public heritage');expect(calls[0].texts[1]).toContain('"caption":"Residents report');
	expect(calls[0].media).toHaveLength(1);
	const [draft]=await sql`select reporter_context from community_drafts where id=${data.draftId}`;expect(draft.reporter_context).toEqual(data.context);
	const stale=await request.post('/api/community/posts',{headers:headers(),data:{draftId:data.draftId,coverId:data.media[0].id,title:'Public bridge instead',body:data.context.caption,locationName:'Test public facility',latitude:35,longitude:115}});
	expect(stale.status()).toBe(409);expect(await stale.text()).toContain('headline or caption changed');
});

test('discard is owned and idempotent, removes files, retains quota and cannot publish a discarded draft',async({request})=>{
	const result=await(await assess(request)).json();
	expect((await request.delete('/api/community/drafts/'+result.draftId,{headers:headers(true)})).status()).toBe(204);
	expect((await request.get(result.media[0].url)).status()).toBe(200);
	for(let retry=0;retry<2;retry++)expect((await request.delete('/api/community/drafts/'+result.draftId,{headers:headers()})).status()).toBe(204);
	expect((await request.get(result.media[0].url)).status()).toBe(404);
	const [row]=await sql`select discarded_at,media from community_drafts where id=${result.draftId}`;expect(row.discarded_at).toBeTruthy();expect(row.media).toEqual([]);
	const response=await request.post('/api/community/posts',{headers:headers(),data:{draftId:result.draftId,coverId:result.media[0].id,title:result.context.headline,body:result.context.caption,locationName:'Test facility',latitude:35,longitude:115}});expect(response.status()).toBe(410);
	await sql`insert into community_drafts(user_id,media,analysis,expires_at,discarded_at) select ${userId},'[]'::jsonb,${sql.json(result.analysis)},now()+interval '1 day',now() from generate_series(1,11)`;
	expect((await assess(request)).status()).toBe(429);
});

test('discard after publishing preserves evidence; changed caption and expired drafts cannot publish', async ({ request }) => {
	const result = await (await assess(request)).json();
	const payload = { draftId: result.draftId, coverId: result.media[0].id, title: result.context.headline, body: result.context.caption, locationName: 'Test public entrance', latitude: 35, longitude: 115 };
	const changed = await request.post('/api/community/posts', { headers: headers(), data: { ...payload, body: 'Changed caption' } });
	expect(changed.status()).toBe(409);
	const published = await request.post('/api/community/posts', { headers: headers(), data: payload });
	expect(published.status()).toBe(201);
	const post = await published.json();
	try {
		expect((await request.delete('/api/community/drafts/' + result.draftId, { headers: headers() })).status()).toBe(204);
		expect((await request.get(result.media[0].url)).status()).toBe(200);
		const [draft] = await sql`select discarded_at,media from community_drafts where id=${result.draftId}`;
		expect(draft.discarded_at).toBeNull();
		expect(draft.media).toEqual(result.media);
		expect((await request.get('/community/post/' + post.id)).status()).toBe(200);
	} finally {
		await sql`delete from community_posts where id=${post.id}`;
		await sql`delete from report_observations where source_id=${result.draftId}`;
		await sql`delete from reports where id=${post.reportId}`;
	}
	await sql`update community_drafts set expires_at=now()-interval '1 second' where id=${result.draftId}`;
	expect((await request.post('/api/community/posts', { headers: headers(), data: payload })).status()).toBe(410);
});

test('cancellation releases the current job and late results cannot recreate a cleared draft',async({request})=>{
	await control('valid',{delay:2000});const id=randomUUID();
	const pending=assess(request,'Public school entrance','Visible access concern.',id);
	await expect.poll(async()=>((await(await fetch(mock+'/requests')).json()) as unknown[]).length).toBe(1);
	expect((await request.delete('/api/community/drafts/'+id,{headers:headers()})).status()).toBe(204);
	expect((await pending).status()).toBe(409);
	expect(await sql`select id from community_drafts where id=${id}`).toHaveLength(0);
	await control();expect((await assess(request,'Public school entrance','A closer view.')).status()).toBe(200);
});

test('editing context or removing attachments discards saved assessment; no stale result remains after clearing and replacing media',async({page,baseURL})=>{
	await page.context().addCookies([{name:'surios_session',value:token,url:baseURL!}]);await page.goto('/community?compose=1');await page.waitForLoadState('networkidle');
	await page.getByLabel('Headline',{exact:true}).fill('Public school entrance');await page.getByLabel('What happened?',{exact:true}).fill('Damaged public steps beside the entrance.');
	await page.getByLabel('Attach media',{exact:true}).setInputFiles({name:'asset.jpg',mimeType:'image/jpeg',buffer:photo});
	await page.getByRole('button',{name:'Assess with AI',exact:true}).click();await expect(page.getByText('Severity 3/10',{exact:true})).toBeVisible();
	const [first]=await sql`select id from community_drafts where user_id=${userId}`;
	await page.getByLabel('Headline',{exact:true}).fill('Public clinic entrance');
	await expect(page.getByText('Severity 3/10',{exact:true})).toHaveCount(0);await expect(page.getByRole('status')).toContainText('Headline changed');
	await expect.poll(async()=>(await sql`select discarded_at from community_drafts where id=${first.id}`)[0].discarded_at).toBeTruthy();
	await page.getByRole('button',{name:'Assess with AI',exact:true}).click();await expect(page.getByText('Severity 3/10',{exact:true})).toBeVisible();
	await page.getByLabel('What happened?',{exact:true}).fill('Caption corrected to describe the clinic.');await expect(page.getByText('Severity 3/10',{exact:true})).toHaveCount(0);
	await page.getByRole('button',{name:'Assess with AI',exact:true}).click();await expect(page.getByText('Severity 3/10',{exact:true})).toBeVisible();
	await page.getByRole('button',{name:'Remove asset.jpg',exact:true}).click();await expect(page.getByAltText('Selected cover',{exact:true})).toHaveCount(0);
	await expect(page.getByRole('button',{name:'Assess with AI',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Publish infrastructure update',exact:true})).toBeDisabled();await expect(page.getByRole('alert')).toHaveCount(0);
	await page.getByLabel('Attach media',{exact:true}).setInputFiles({name:'asset.jpg',mimeType:'image/jpeg',buffer:photo});await page.getByRole('button',{name:'Assess with AI',exact:true}).click();await expect(page.getByText('Severity 3/10',{exact:true})).toBeVisible();
	await page.getByRole('button',{name:'Discard draft',exact:true}).click();await expect(page.getByLabel('Headline',{exact:true})).toHaveValue('');await expect(page.getByLabel('What happened?',{exact:true})).toHaveValue('');await expect(page.getByText('Severity 3/10',{exact:true})).toHaveCount(0);
});

test('cancel/clear during assessment prevents ghost errors and permits immediate reassessment',async({page,baseURL})=>{
	await page.context().addCookies([{name:'surios_session',value:token,url:baseURL!}]);await page.goto('/community?compose=1');await page.waitForLoadState('networkidle');
	await page.getByLabel('Headline',{exact:true}).fill('Public school entrance');await page.getByLabel('Attach media',{exact:true}).setInputFiles({name:'asset.jpg',mimeType:'image/jpeg',buffer:photo});
	await control('valid',{delay:2000});await page.getByRole('button',{name:'Assess with AI',exact:true}).click();
	await expect.poll(async()=>((await(await fetch(mock+'/requests')).json()) as unknown[]).length).toBe(1);
	await page.getByRole('button',{name:'Discard draft',exact:true}).click();await expect(page.getByRole('button',{name:'Assess with AI',exact:true})).toBeDisabled();await expect(page.getByText('Assessing your evidence…',{exact:true})).toHaveCount(0);
	await control();await page.getByLabel('Headline',{exact:true}).fill('Public clinic');await page.getByLabel('Attach media',{exact:true}).setInputFiles({name:'new.jpg',mimeType:'image/jpeg',buffer:photo});await page.getByRole('button',{name:'Assess with AI',exact:true}).click();await expect(page.getByText('Severity 3/10',{exact:true})).toBeVisible();await expect(page.getByRole('alert')).toHaveCount(0);
});

test('public wording does not bypass rejection or evidence requirements for critical severity',async({request})=>{
	await control('reject');expect((await assess(request,'Public public public','Public unrelated object.')).status()).toBe(422);
	expect(await sql`select id from community_drafts where user_id=${userId}`).toHaveLength(0);
	await control('valid',{overrides:{hazardSeverity:10}});expect((await assess(request,'Public danger','Reporter claims an emergency.')).status()).toBe(503);
	expect(await sql`select id from community_drafts where user_id=${userId}`).toHaveLength(0);
});

test('registration requires matching passwords on the server and both password eyes preserve values without submitting',async({page,request})=>{
	for(const confirmPassword of ['', 'WrongPassword123!']) {
		const response=await request.post('/register',{headers:{Accept:'text/html'},form:{name:'Password test',email:marker+'password@example.test',password:'PasswordTest123!',confirmPassword},maxRedirects:0});expect(response.status()).toBe(400);
	}
	expect(await sql`select id from users where email=${marker+'password@example.test'}`).toHaveLength(0);
	await page.setViewportSize({width:375,height:812});await page.goto('/register');await page.waitForLoadState('networkidle');await page.getByLabel('Password',{exact:true}).fill('PasswordTest123!');await page.getByLabel('Confirm password',{exact:true}).fill('PasswordTest123!');
	for(const [label,toggle]of [['Password','password'],['Confirm password','confirm password']]){
		await page.getByRole('button',{name:'Show '+toggle,exact:true}).click();await expect(page.getByLabel(label,{exact:true})).toHaveAttribute('type','text');await expect(page.getByLabel(label,{exact:true})).toHaveValue('PasswordTest123!');await page.getByRole('button',{name:'Hide '+toggle,exact:true}).click();await expect(page.getByLabel(label,{exact:true})).toHaveAttribute('type','password');
	}
	await expect(page).toHaveURL(/\/register$/);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('two new landing sections match the existing responsive design and retain the previous sections',async({page})=>{
	for(const width of [1440,375,320]) {
		await page.setViewportSize({width,height:900});await page.goto('/');
		for(const title of ['Report what you see.','Track the repair.','More than a road report.','One concern. A visible response.'])await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
		expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
	}
});
