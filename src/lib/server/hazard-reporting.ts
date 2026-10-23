import { and, between, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { db, reports, reportObservations, communityPosts, communityDrafts, communityConfirmations, type Report } from './db';
import { compareRoadEvidence } from './gemini';
import { distanceMeters, normalizeSeverity, hazardPriority, type MatchDecision } from '$lib/types/hazards';
import type { TriageAnalysis } from '$lib/types/triage';
import type { PostMedia } from '$lib/types/community';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export const REPORT_WRITE_LOCK = 76489215;
export async function lockReports(tx: Transaction) { await tx.execute(sql`select pg_advisory_xact_lock(${REPORT_WRITE_LOCK})`); }
export async function refreshReportSupport(tx: Transaction, reportId: string) {
	const [result] = await tx.execute<{ count: number }>(sql`
		select count(distinct supporter)::int as count from (
			select observer_key as supporter from report_observations where report_id = ${reportId}::uuid
			union all
			select 'user:' || c.user_id::text as supporter from community_confirmations c
			join community_posts p on p.id = c.post_id where p.report_id = ${reportId}::uuid
		) supporters`);
	const [report] = await tx.select().from(reports).where(eq(reports.id, reportId));
	const baseline = Number((report.triagePayload as Record<string, unknown> | null)?.supportBaseline || 0);
	const support = Math.max(1, baseline + result.count);
	await tx.update(reports).set({ communityConfirmations: support, updatedAt: new Date() }).where(eq(reports.id, reportId));
	return support;
}
interface EvidenceInput {
	sourceId: string;
	userId?: string;
	analysis: TriageAnalysis;
	media: PostMedia[];
	latitude: number;
	longitude: number;
	locationName: string;
	post?: { draftId: string; coverId: string; title: string; body: string };
}
async function mediaBytes(media: PostMedia) {
	let filename: string;
	if (/^\/media\/[0-9a-f-]{36}\.(jpg|png|webp|mp4|webm|mov)$/.test(media.url)) filename = path.resolve('static/uploads/community', path.basename(media.url));
	else if (/^\/uploads\/[a-zA-Z0-9_.-]+$/.test(media.url)) filename = path.resolve('static/uploads', path.basename(media.url));
	else return null;
	try { const stat = await fs.stat(filename); if (stat.size > 10 * 1024 * 1024) return null; return { buffer: await fs.readFile(filename), mimeType: media.mimeType }; }
	catch { return null; }
}
function reportMedia(report: Report): PostMedia[] {
	const stored = (report.triagePayload as { media?: PostMedia[] } | null)?.media;
	if (stored?.length) return stored;
	const ext = report.imagePath.split('.').pop()?.toLowerCase();
	const mimeType = ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' } as Record<string, string>)[ext || ''];
	return mimeType ? [{ id: report.id, url: report.imagePath, kind: mimeType.startsWith('video/') ? 'video' : 'photo', name: 'Existing road evidence', mimeType }] : [];
}
async function candidatesAt(input: EvidenceInput, tx: Transaction | typeof db = db) {
	const latitudeDelta = 25 / 111000;
	const longitudeDelta = latitudeDelta / Math.max(.001, Math.cos(input.latitude * Math.PI / 180));
	const rows = await tx.select().from(reports).where(and(
		ne(reports.status, 'RESOLVED'), eq(reports.distressType, input.analysis.distressType),
		between(reports.latitude, String(input.latitude - latitudeDelta), String(input.latitude + latitudeDelta)),
		between(reports.longitude, String(input.longitude - longitudeDelta), String(input.longitude + longitudeDelta))
	)).orderBy(desc(reports.updatedAt)).limit(50);
	return rows.map((report) => ({ report, distance: distanceMeters(input, { latitude: Number(report.latitude), longitude: Number(report.longitude) }) }))
		.filter((item) => item.distance <= 25).sort((a, b) => a.distance - b.distance || a.report.id.localeCompare(b.report.id)).slice(0, 3);
}
async function decideMatch(input: EvidenceInput, candidates: Awaited<ReturnType<typeof candidatesAt>>, fingerprints: string[], compare: typeof compareRoadEvidence) {
	if (!candidates.length) return { reportId: null, method: 'new', confidence: 1, reason: 'No open report of this damage type within 25 metres.' } as const;
	const observations = await db.select().from(reportObservations).where(inArray(reportObservations.reportId, candidates.map((item) => item.report.id)));
	const visualCandidates = [];
	let incomingBytes = null;
	for (const media of [...input.media.filter((media) => media.kind === 'photo'), ...input.media.filter((media) => media.kind === 'video')]) {
		incomingBytes = await mediaBytes(media); if (incomingBytes) break;
	}
	let bytes = incomingBytes?.buffer.length || 0;
	for (const item of candidates) {
		const storedHashes = observations.filter((observation) => observation.reportId === item.report.id).flatMap((observation) => observation.fingerprints);
		let evidence = null;
		for (const media of reportMedia(item.report)) { evidence = await mediaBytes(media); if (evidence) break; }
		if (evidence) storedHashes.push(crypto.createHash('sha256').update(evidence.buffer).digest('hex'));
		if (fingerprints.some((hash) => storedHashes.includes(hash))) return { reportId: item.report.id, method: 'exact', confidence: 1, newEvidence: fingerprints.some((hash) => !storedHashes.includes(hash)), reason: 'Shared evidence, same damage type, and a pin within 25 metres. Repeated media does not increase severity.' } as const;
		if (evidence && bytes + evidence.buffer.length <= 12 * 1024 * 1024) bytes += evidence.buffer.length; else evidence = null;
		visualCandidates.push({ id: item.report.id, distance: item.distance, distressType: item.report.distressType, summary: (item.report.triagePayload as { summary?: string } | null)?.summary || item.report.recommendedAction, media: evidence });
	}
	if (incomingBytes && visualCandidates.some((candidate) => candidate.media)) {
		try {
			const result = await compare(incomingBytes, visualCandidates);
			const accepted = visualCandidates.find((candidate) => candidate.id === result.reportId && candidate.media);
			if (accepted && result.confidence >= .85) return { ...result, reportId: accepted.id, method: 'ai' } as const;
			return { reportId: null, method: 'new', confidence: result.confidence, reason: result.reason || 'AI did not confidently identify the same physical defect.' } as const;
		} catch { /* Keep uncertain evidence as a separate hazard. */ }
	}
	return { reportId: null, method: 'unverified', confidence: 0, reason: 'Visual similarity was unavailable or uncertain; saved separately.' } as const;
}
export async function recordHazardEvidence(input: EvidenceInput, compare: typeof compareRoadEvidence = compareRoadEvidence) {
	// Reject expired drafts and answer retries before any optional AI comparison.
	const [existingObservation] = await db.select().from(reportObservations).where(eq(reportObservations.sourceId, input.sourceId));
	if (existingObservation) {
		if (input.post && existingObservation.userId !== input.userId) error(403, 'This assessment belongs to another account.');
		const [report] = await db.select().from(reports).where(eq(reports.id, existingObservation.reportId));
		const [post] = input.post ? await db.select({ id: communityPosts.id }).from(communityPosts).where(eq(communityPosts.draftId, input.post.draftId)) : [];
		return { id: post?.id, reportId: report.id, grouped: ['exact', 'ai'].includes(existingObservation.match.method), match: existingObservation.match, severity: report.hazardSeverity, support: report.communityConfirmations, priority: hazardPriority(report.hazardSeverity, report.communityConfirmations) };
	}
	if (input.post) {
		const [draft] = await db.select().from(communityDrafts).where(and(eq(communityDrafts.id, input.post.draftId), eq(communityDrafts.userId, input.userId!)));
		if (!draft) error(404, 'Assessment not found.');
		if (draft.expiresAt < new Date()) error(410, 'This assessment expired. Assess your attachments again.');
	}
	const analysis = normalizeSeverity(input.analysis);
	const fingerprints = (await Promise.all(input.media.map(mediaBytes))).filter((item) => item !== null).map((item) => crypto.createHash('sha256').update(item.buffer).digest('hex'));
	if (!fingerprints.length) error(410, 'Evidence files are unavailable. Attach and assess them again.');
	for (let attempt = 0; attempt < 3; attempt++) {
		const candidates = await candidatesAt(input);
		const decision = await decideMatch(input, candidates, fingerprints, compare);
		const result = await db.transaction(async (tx) => {
			await lockReports(tx);
			const [already] = await tx.select().from(reportObservations).where(eq(reportObservations.sourceId, input.sourceId));
			if (already) {
				const [report] = await tx.select().from(reports).where(eq(reports.id, already.reportId));
				const [post] = input.post ? await tx.select({ id: communityPosts.id }).from(communityPosts).where(eq(communityPosts.draftId, input.post.draftId)) : [];
				return { id: post?.id, reportId: report.id, grouped: ['exact', 'ai'].includes(already.match.method), match: already.match, severity: report.hazardSeverity, support: report.communityConfirmations, priority: hazardPriority(report.hazardSeverity, report.communityConfirmations) };
			}
			if (input.post) {
				const [draft] = await tx.select().from(communityDrafts).where(and(eq(communityDrafts.id, input.post.draftId), eq(communityDrafts.userId, input.userId!))).for('update');
				if (!draft) error(404, 'Assessment not found.');
				if (draft.expiresAt < new Date()) error(410, 'This assessment expired. Assess your attachments again.');
				const [existing] = await tx.select().from(communityPosts).where(eq(communityPosts.draftId, draft.id));
				if (existing) return { id: existing.id, reportId: existing.reportId, grouped: false, match: { method: 'legacy', confidence: 1, reason: 'Already published.' } as MatchDecision, severity: existing.analysis.hazardSeverity, support: 1, priority: existing.analysis.hazardSeverity };
			}
			const fresh = await candidatesAt(input, tx);
			if (fresh.map((item) => item.report.id).sort().join() !== candidates.map((item) => item.report.id).sort().join()) return null;
			const match = { method: decision.method, confidence: decision.confidence, reason: decision.reason, newEvidence: decision.method === 'exact' ? decision.newEvidence : true } satisfies MatchDecision;
			const chosen = decision.reportId ? fresh.find((item) => item.report.id === decision.reportId)?.report : null;
			let reportId: string;
			const imagePath = (input.media.find((media) => media.kind === 'photo') || input.media[0]).url;
			if (chosen) {
				reportId = chosen.id;
				const previous = normalizeSeverity({ ...analysis, hazardSeverity: chosen.hazardSeverity, riskLevel: chosen.riskLevel as TriageAnalysis['riskLevel'], vruLethality: chosen.vruLethality as TriageAnalysis['vruLethality'] });
				const mayUpdate = decision.method !== 'exact' || decision.newEvidence;
				const newer = mayUpdate && analysis.hazardSeverity >= previous.hazardSeverity;
				const canonical = newer ? analysis : { ...previous, ...(chosen.triagePayload as object || {}), hazardSeverity: previous.hazardSeverity, riskLevel: previous.riskLevel } as TriageAnalysis;
				const riderRanks = ['NONE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
				const rider = mayUpdate && riderRanks.indexOf(analysis.vruLethality) > riderRanks.indexOf(chosen.vruLethality) ? analysis.vruLethality : chosen.vruLethality;
				await tx.update(reports).set({ hazardSeverity: Math.max(previous.hazardSeverity, mayUpdate ? analysis.hazardSeverity : previous.hazardSeverity), riskLevel: canonical.riskLevel, vruLethality: rider, vruDetails: rider === analysis.vruLethality ? analysis.vruDetails : chosen.vruDetails,
					recommendedAction: newer ? analysis.recommendedAction : chosen.recommendedAction, materialsChecklist: newer ? analysis.materialsChecklist : chosen.materialsChecklist, imagePath: newer ? imagePath : chosen.imagePath,
					triagePayload: { ...(chosen.triagePayload as object || {}), ...canonical, vruLethality: rider, civicAddress: (chosen.triagePayload as { civicAddress?: string } | null)?.civicAddress || input.locationName, headline: (chosen.triagePayload as { headline?: string } | null)?.headline || input.post?.title, media: newer ? input.media : reportMedia(chosen) }
				}).where(eq(reports.id, reportId));
			} else {
				const [report] = await tx.insert(reports).values({ imagePath, latitude: input.latitude.toFixed(8), longitude: input.longitude.toFixed(8), distressType: analysis.distressType, hazardSeverity: analysis.hazardSeverity, riskLevel: analysis.riskLevel, vruLethality: analysis.vruLethality, vruDetails: analysis.vruDetails, recommendedAction: analysis.recommendedAction, materialsChecklist: analysis.materialsChecklist, communityConfirmations: 1, triagePayload: { ...analysis, civicAddress: input.locationName, headline: input.post?.title, media: input.media, supportBaseline: 0 } }).returning({ id: reports.id });
				reportId = report.id;
			}
			await tx.insert(reportObservations).values({ reportId, sourceId: input.sourceId, userId: input.userId, observerKey: input.userId ? `user:${input.userId}` : `media:${fingerprints.slice().sort().join(':')}`, analysis, media: input.media, fingerprints, match });
			let id: string | undefined;
			if (input.post) {
				const [post] = await tx.insert(communityPosts).values({ ...input.post, userId: input.userId!, reportId, locationName: input.locationName, latitude: input.latitude.toFixed(8), longitude: input.longitude.toFixed(8), media: input.media, analysis }).returning({ id: communityPosts.id });
				id = post.id;
			}
			const support = await refreshReportSupport(tx, reportId);
			const [report] = await tx.select().from(reports).where(eq(reports.id, reportId));
			return { id, reportId, grouped: !!chosen, match, severity: report.hazardSeverity, support, priority: hazardPriority(report.hazardSeverity, support) };
		});
		if (result) return result;
	}
	error(409, 'New evidence arrived nearby. Try publishing again to recheck the match.');
}
