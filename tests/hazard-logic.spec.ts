import { test, expect } from '@playwright/test';
import postgres from 'postgres';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { recordHazardEvidence } from '../src/lib/server/hazard-reporting';
import { normalizeSeverity, hazardPriority, distanceMeters } from '../src/lib/types/hazards';
import type { TriageAnalysis } from '../src/lib/types/triage';

const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const createdReports = new Set<string>();
const createdFiles: string[] = [];
let users: string[];
let latitude = 30;
const base: TriageAnalysis = { isValidInfrastructure: true, rejectionReason: null, distressType: 'pothole', hazardSeverity: 5, riskLevel: 'MODERATE', vruLethality: 'LOW', vruDetails: 'Rider caution needed.', estimatedDimensions: { depthEstimate: 'Estimate only', surfaceAreaEstimate: 'Estimate only' }, recommendedAction: 'Inspect and patch.', materialsChecklist: ['Asphalt'], urgency: 'PRIORITY', summary: 'Road surface distress.' };
test.beforeAll(async () => { users = (await sql`select id from users order by created_at limit 2`).map((user) => user.id); });
test.afterAll(async () => { if (createdReports.size) await sql`delete from reports where id in ${sql([...createdReports])}`; await Promise.all(createdFiles.map((file) => fs.rm(file, { force: true }))); await sql.end(); });
async function evidence(userId: string | undefined, analysis = base, photo = 'pothole-severe.jpg', location = { latitude, longitude: 110 }) {
	const id = randomUUID(), filename = `static/uploads/community/${id}.jpg`;
	await fs.mkdir('static/uploads/community', { recursive: true }); await fs.copyFile(`static/samples/${photo}`, filename); createdFiles.push(filename);
	return { sourceId: randomUUID(), userId, analysis, media: [{ id, url: `/media/${id}.jpg`, kind: 'photo' as const, name: photo, mimeType: 'image/jpeg' }], ...location, locationName: 'Isolated hazard logic verification site' };
}
const noAI = async () => { throw new Error('AI should not be needed for this case.'); };
async function record(input: Awaited<ReturnType<typeof evidence>>, compare = noAI) {
	const result = await recordHazardEvidence(input, compare); createdReports.add(result.reportId); return result;
}

test('severity uses the observed score without risk-label inflation; support changes priority only', () => {
	expect(normalizeSeverity({ ...base, hazardSeverity: 1, riskLevel: 'LOW', vruLethality: 'CRITICAL' }).hazardSeverity).toBe(1);
	expect(normalizeSeverity({ ...base, hazardSeverity: 1, riskLevel: 'CRITICAL' }).riskLevel).toBe('LOW');
	expect(hazardPriority(5, 1)).toBe(5); expect(hazardPriority(5, 2)).toBe(5.25); expect(hazardPriority(5, 100)).toBe(7); expect(hazardPriority(9, 100)).toBe(10);
	expect(distanceMeters({ latitude: 14, longitude: 121 }, { latitude: 14, longitude: 121 })).toBe(0);
	expect(distanceMeters({ latitude: 14, longitude: 121 }, { latitude: 14.001, longitude: 121 })).toBeGreaterThan(100);
});

test('same media joins one hazard; reposts never inflate severity or unique support', async () => {
	latitude += .01;
	const first = await record(await evidence(users[0]));
	const repeated = await record(await evidence(users[0], { ...base, hazardSeverity: 10, riskLevel: 'CRITICAL' }));
	expect(repeated.reportId).toBe(first.reportId); expect(repeated.grouped).toBe(true); expect(repeated.severity).toBe(5); expect(repeated.support).toBe(1);
	const other = await record(await evidence(users[1])); expect(other.reportId).toBe(first.reportId); expect(other.support).toBe(2); expect(other.priority).toBe(5.25);
	const observations = await sql`select * from report_observations where report_id = ${first.reportId}`; expect(observations).toHaveLength(3);
});

test('different photo can join with a confident visual match and update severity from new evidence', async () => {
	latitude += .01;
	const first = await record(await evidence(users[0]));
	let compared = false;
	const result = await recordHazardEvidence(await evidence(users[1], { ...base, hazardSeverity: 9, riskLevel: 'CRITICAL', vruLethality: 'HIGH' }, 'alligator-fatigue.jpg'), async (_incoming, candidates) => {
		compared = true; expect(candidates[0].media).not.toBeNull(); return { reportId: first.reportId, confidence: .95, reason: 'Same markings, geometry, and road edge.' };
	});
	createdReports.add(result.reportId); expect(compared).toBe(true); expect(result.reportId).toBe(first.reportId); expect(result.match.method).toBe('ai'); expect(result.severity).toBe(9); expect(result.support).toBe(2);
});

test('distance, different damage type, resolved state, and uncertain AI keep reports separate', async () => {
	latitude += .01;
	const first = await record(await evidence(users[0]));
	const different = await record(await evidence(users[1], { ...base, distressType: 'alligator_cracking' })); expect(different.reportId).not.toBe(first.reportId);
	const distant = await record(await evidence(users[1], base, 'pothole-severe.jpg', { latitude: latitude + .001, longitude: 110 })); expect(distant.reportId).not.toBe(first.reportId);
	const uncertain = await recordHazardEvidence(await evidence(users[1], base, 'alligator-fatigue.jpg'), async () => ({ reportId: first.reportId, confidence: .7, reason: 'Similar damage but identity uncertain.' })); createdReports.add(uncertain.reportId); expect(uncertain.reportId).not.toBe(first.reportId);
	await sql`update reports set status = 'RESOLVED' where id = ${first.reportId}`;
	const renewed = await record(await evidence(users[0])); expect(renewed.reportId).not.toBe(first.reportId);
});

test('concurrent same-location publishes recheck candidates and do not create duplicate hazards', async () => {
	latitude += .01;
	const inputs = await Promise.all([evidence(users[0]), evidence(users[1])]);
	const [first, second] = await Promise.all(inputs.map((input) => record(input)));
	expect(first.reportId).toBe(second.reportId);
	const [report] = await sql`select community_confirmations from reports where id = ${first.reportId}`; expect(report.community_confirmations).toBe(2);
	const retry = await record(inputs[0]); expect(retry.reportId).toBe(first.reportId);
	const observations = await sql`select id from report_observations where report_id = ${first.reportId}`; expect(observations).toHaveLength(2);
});
