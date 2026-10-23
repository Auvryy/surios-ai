import postgres from 'postgres';
import { randomUUID, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';

// Explicit command only: never populate a live database on application startup.
const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const seedKey = 'community-presentation-v1';
const disclaimer = 'Demo dataset: sample photo, illustrative location and assessment. This is not a verified report of current road conditions.';
const createdFiles = [];

try {
	const photos = await Promise.all(['pothole-severe.jpg', 'alligator-fatigue.jpg'].map(async (name) => ({
		id: randomUUID(), url: `/samples/${name}`, name, kind: 'photo', mimeType: 'image/jpeg',
		hash: createHash('sha256').update(await readFile(new URL(`../static/samples/${name}`, import.meta.url))).digest('hex')
	})));
	await sql.begin(async (tx) => {
		await tx`select pg_advisory_xact_lock(76489215)`;
		const existing = await tx`select id from reports where triage_payload->>'seedKey' = ${seedKey}`;
		if (existing.length) {
			console.log('Presentation posts already exist; left existing posts and interactions unchanged.');
			return;
		}
		const users = await tx`select id, email from users where email in ('citizen@surios.gov', 'inspector@surios.gov')`;
		const citizen = users.find((user) => user.email === 'citizen@surios.gov');
		const inspector = users.find((user) => user.email === 'inspector@surios.gov');
		if (!citizen || !inspector) throw new Error('Start the app once to create its demo accounts before seeding.');
		await mkdir(new URL('../static/uploads/community/', import.meta.url), { recursive: true });
		for (const photo of photos) {
			const target = new URL(`../static/uploads/community/${photo.id}.jpg`, import.meta.url);
			createdFiles.push(target);
			await writeFile(target, await readFile(new URL(`../static/samples/${photo.name}`, import.meta.url)));
			photo.url = `/media/${photo.id}.jpg`;
		}
		const scenarios = [
			{ title: 'Demo · Pothole near the road edge', type: 'pothole', severity: 8, risk: 'CRITICAL', rider: 'HIGH', latitude: 14.2813, longitude: 121.4173, photo: photos[0], authors: [citizen, inspector], action: 'Inspect the defect and traffic exposure before specifying a patch repair.' },
			{ title: 'Demo · Fatigue cracking on the approach', type: 'alligator_cracking', severity: 5, risk: 'MODERATE', rider: 'MODERATE', latitude: 14.2852, longitude: 121.4211, photo: photos[1], authors: [citizen], action: 'Inspect the pavement base and drainage before selecting the repair.' }
		];
		for (const scenario of scenarios) {
			const reportId = randomUUID();
			const { hash, ...photo } = scenario.photo;
			const media = [photo];
			const location = 'Demo pin · Santa Cruz, Laguna';
			const analysis = {
				isValidInfrastructure: true, rejectionReason: null, distressType: scenario.type,
				hazardSeverity: scenario.severity, riskLevel: scenario.risk, vruLethality: scenario.rider,
				vruDetails: 'Illustrative rider-risk assessment for demonstration; field inspection required.',
				estimatedDimensions: { depthEstimate: 'Not measured', surfaceAreaEstimate: 'Not measured' },
				recommendedAction: scenario.action, materialsChecklist: ['Inspection equipment', 'Traffic cones'],
				urgency: 'PRIORITY', summary: disclaimer
			};
			const metadata = { ...analysis, seedKey, headline: scenario.title, civicAddress: location, supportBaseline: 0 };
			await tx`insert into reports (id, image_path, latitude, longitude, distress_type, hazard_severity, risk_level, vru_lethality, vru_details, recommended_action, materials_checklist, community_confirmations, triage_payload)
				values (${reportId}, ${photo.url}, ${scenario.latitude}, ${scenario.longitude}, ${scenario.type}, ${scenario.severity}, ${scenario.risk}, ${scenario.rider}, ${analysis.vruDetails}, ${scenario.action}, ${tx.json(analysis.materialsChecklist)}, ${scenario.authors.length}, ${tx.json(metadata)})`;
			for (const [index, author] of scenario.authors.entries()) {
				const sourceId = randomUUID();
				const title = index ? 'Demo · Another post about the same pothole' : scenario.title;
				const match = index
					? { method: 'exact', confidence: 1, newEvidence: false, reason: 'Demo: the same photo and nearby pin link to the original hazard. Repeated media does not increase severity.' }
					: { method: 'new', confidence: 1, reason: 'Demo: initial observation for this seeded hazard.' };
				await tx`insert into community_posts (user_id, draft_id, report_id, title, body, location_name, latitude, longitude, media, cover_id, analysis)
					values (${author.id}, ${sourceId}, ${reportId}, ${title}, ${disclaimer}, ${location}, ${scenario.latitude + index * .00001}, ${scenario.longitude}, ${tx.json(media)}, ${photo.id}, ${tx.json(analysis)})`;
				await tx`insert into report_observations (report_id, source_id, user_id, observer_key, analysis, media, fingerprints, match)
					values (${reportId}, ${sourceId}, ${author.id}, ${`user:${author.id}`}, ${tx.json(analysis)}, ${tx.json(media)}, ${tx.json([hash])}, ${tx.json(match)})`;
			}
		}
		console.log('Seeded 3 database posts, 3 source observations and 2 pinned hazards. Existing field reports were preserved.');
	});
} catch (error) {
	await Promise.all(createdFiles.map((file) => rm(file, { force: true })));
	throw error;
} finally {
	await sql.end();
}
