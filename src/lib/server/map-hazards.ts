import { desc, eq, inArray } from 'drizzle-orm';
import { db, reports, communityPosts, reportObservations, users } from './db';
import { TriageAnalysisSchema } from '$lib/types/triage';
import { normalizeSeverity, hazardPriority, type MapHazard } from '$lib/types/hazards';
export async function loadMapHazards(): Promise<{ hazards: MapHazard[]; asOf: string }> {
	const rows = await db.select().from(reports).orderBy(desc(reports.updatedAt)).limit(1000);
	if (!rows.length) return { hazards: [], asOf: new Date().toISOString() };
	const ids = rows.map((report) => report.id);
	const [posts, observations] = await Promise.all([
		db.select({ post: communityPosts, author: users.name }).from(communityPosts).innerJoin(users, eq(users.id, communityPosts.userId)).where(inArray(communityPosts.reportId, ids)).orderBy(desc(communityPosts.createdAt)),
		db.select().from(reportObservations).where(inArray(reportObservations.reportId, ids))
	]);
	return {
		asOf: new Date().toISOString(),
		hazards: rows.map((report) => {
			const metadata = report.triagePayload as Record<string, unknown> | null;
			const analysis = normalizeSeverity(TriageAnalysisSchema.parse({ ...metadata, isValidInfrastructure: true, distressType: report.distressType, hazardSeverity: report.hazardSeverity, riskLevel: report.riskLevel, vruLethality: report.vruLethality, vruDetails: report.vruDetails || '', recommendedAction: report.recommendedAction, materialsChecklist: report.materialsChecklist || [] }));
			const related = posts.filter(({ post }) => post.reportId === report.id);
			const evidence = observations.filter((observation) => observation.reportId === report.id);
			return {
				id: report.id, title: String(metadata?.headline || related[0]?.post.title || report.distressType.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())),
				location: String(metadata?.civicAddress || `${Number(report.latitude).toFixed(5)}, ${Number(report.longitude).toFixed(5)}`),
				latitude: Number(report.latitude), longitude: Number(report.longitude), distressType: report.distressType,
				severity: analysis.hazardSeverity, riskLevel: analysis.riskLevel, vruLethality: analysis.vruLethality, status: report.status,
				support: report.communityConfirmations, observations: evidence.length + (Number(metadata?.supportBaseline || 0) > 0 ? 1 : evidence.length ? 0 : 1), priority: hazardPriority(analysis.hazardSeverity, report.communityConfirmations),
				createdAt: report.createdAt.toISOString(), updatedAt: report.updatedAt.toISOString(), imageUrl: report.imagePath,
				mediaKind: /\.(mp4|webm|mov)$/i.test(report.imagePath) ? 'video' as const : 'photo' as const, analysis,
				posts: related.map(({ post, author }) => ({ id: post.id, title: post.title, author, createdAt: post.createdAt.toISOString(), match: evidence.find((observation) => observation.sourceId === post.draftId)?.match || null })),
				media: evidence.flatMap((observation) => observation.media)
			};
		})
	};
}
