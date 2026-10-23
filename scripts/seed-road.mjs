import postgres from 'postgres';
import { randomUUID, createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
// Run explicitly. The source road is real OSM geometry; damage and assessment are labeled demo data.
const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const seedKey = 'road-section-presentation-v1';
let createdFile;
const metres = (a, b) => { const r = Math.PI / 180, h = Math.sin((b[0] - a[0]) * r / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin((b[1] - a[1]) * r / 2) ** 2; return 6371000 * 2 * Math.asin(Math.sqrt(h)); };
try {
	const { road } = JSON.parse(await readFile(new URL('../static/samples/demo-road.json', import.meta.url), 'utf8'));
	const coordinates = [road.coordinates[0]]; let length = 0;
	for (const point of road.coordinates.slice(1)) { const last = coordinates.at(-1), distance = metres(last, point); if (length + distance > 160) { const ratio = (160 - length) / distance; coordinates.push([last[0] + ratio * (point[0] - last[0]), last[1] + ratio * (point[1] - last[1])]); length = 160; break; } coordinates.push(point); length += distance; }
	const roadSegment = { ...road, coordinates, start: 0, end: length, length };
	const center = coordinates[Math.floor(coordinates.length / 2)], reportId = randomUUID(), sourceId = randomUUID(), mediaId = randomUUID();
	const photo = await readFile(new URL('../static/samples/alligator-fatigue.jpg', import.meta.url));
	const media = [{ id: mediaId, url: `/media/${mediaId}.jpg`, name: 'Demo road cracking photo.jpg', kind: 'photo', mimeType: 'image/jpeg' }];
	const title = 'Demo · Road-section cracking on Pedro Guevarra Avenue';
	const body = 'DEMONSTRATION ONLY. A sample road-section report to show Orie and the adjustable line. Road geometry is from OpenStreetMap; the photo, location of damage, and assessment are illustrative, not verified current road conditions.';
	const location = `Demo section · ${road.name}, Santa Cruz, Laguna`;
	const analysis = { isValidInfrastructure: true, rejectionReason: null, distressType: 'alligator_cracking', hazardSeverity: 5, riskLevel: 'MODERATE', vruLethality: 'MODERATE', vruDetails: 'Sample: uneven pavement can affect bicycle and motorcycle stability.', estimatedDimensions: { depthEstimate: 'Not measured', surfaceAreaEstimate: 'Not measured' }, recommendedAction: 'Inspect pavement base and drainage along the marked section before planning repairs.', materialsChecklist: ['Inspection equipment', 'Traffic cones'], urgency: 'PRIORITY', summary: 'Illustrative cracking along a mapped road section. Field inspection required; this is demo data.' };
	await sql.begin(async tx => {
		await tx`select pg_advisory_xact_lock(76489215)`;
		if ((await tx`select id from reports where triage_payload->>'seedKey' = ${seedKey}`).length) { console.log('Demo road-section post already exists; retained existing interactions.'); return; }
		const [author] = await tx`select id from users where email = 'citizen@surios.gov'`;
		if (!author) throw new Error('Seeded citizen account is required.');
		await mkdir(new URL('../static/uploads/community/', import.meta.url), { recursive: true });
		createdFile = new URL(`../static/uploads/community/${mediaId}.jpg`, import.meta.url); await writeFile(createdFile, photo, { flag: 'wx' });
		await tx`insert into reports(id,image_path,latitude,longitude,distress_type,hazard_severity,risk_level,vru_lethality,vru_details,recommended_action,materials_checklist,community_confirmations,triage_payload) values(${reportId},${media[0].url},${center[0]},${center[1]},${analysis.distressType},5,'MODERATE','MODERATE',${analysis.vruDetails},${analysis.recommendedAction},${tx.json(analysis.materialsChecklist)},1,${tx.json({...analysis,seedKey,headline:title,civicAddress:location,media,roadSegment,supportBaseline:0})})`;
		await tx`insert into community_posts(user_id,draft_id,report_id,title,body,location_name,latitude,longitude,media,cover_id,analysis,road_segment) values(${author.id},${sourceId},${reportId},${title},${body},${location},${center[0]},${center[1]},${tx.json(media)},${mediaId},${tx.json(analysis)},${tx.json(roadSegment)})`;
		await tx`insert into report_observations(report_id,source_id,user_id,observer_key,analysis,media,fingerprints,match) values(${reportId},${sourceId},${author.id},${`user:${author.id}`},${tx.json(analysis)},${tx.json(media)},${tx.json([createHash('sha256').update(photo).digest('hex')])},${tx.json({method:'new',confidence:1,reason:'Explicitly labeled demo road-section evidence.'})})`;
		console.log(`Seeded database road-section post with ${Math.round(length)}m OSM line and two endpoints.`);
	});
} catch (cause) { if (createdFile) await rm(createdFile, { force: true }); throw cause; } finally { await sql.end(); }
