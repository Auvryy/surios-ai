import { error, json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, communityDrafts, communityPosts, reports } from '$lib/server/db';
import { loadCommunityPosts, requireCommunityUser, communityFilters } from '$lib/server/community';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => json(await loadCommunityPosts(locals.user?.id, communityFilters(url)));
const postSchema = z.object({
	draftId: z.uuid(), coverId: z.uuid(), title: z.string().trim().min(3).max(120), body: z.string().trim().max(2000),
	locationName: z.string().trim().min(3).max(200), latitude: z.number().finite().min(-90).max(90), longitude: z.number().finite().min(-180).max(180)
});
export const POST: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	const parsed = postSchema.safeParse(await event.request.json().catch(() => null));
	if (!parsed.success) error(400, parsed.error.issues[0]?.message || 'Check your post details.');
	const input = parsed.data;
	const id = await db.transaction(async (tx) => {
		const [draft] = await tx.select().from(communityDrafts).where(and(eq(communityDrafts.id, input.draftId), eq(communityDrafts.userId, user.id))).for('update');
		if (!draft) error(404, 'Assessment not found. Assess your attachments again.');
		const [existing] = await tx.select({ id: communityPosts.id }).from(communityPosts).where(eq(communityPosts.draftId, draft.id));
		if (existing) return existing.id;
		if (draft.expiresAt < new Date()) error(410, 'This assessment expired. Assess your attachments again.');
		if (!draft.media.some((media) => media.id === input.coverId)) error(400, 'Choose a cover from your attachments.');
		const cover = draft.media.find((media) => media.id === input.coverId)!;
		const analysis = draft.analysis;
		const [report] = await tx.insert(reports).values({
			imagePath: (draft.media.find((media) => media.kind === 'photo') || cover).url,
			latitude: input.latitude.toFixed(8), longitude: input.longitude.toFixed(8),
			distressType: analysis.distressType, hazardSeverity: analysis.hazardSeverity, riskLevel: analysis.riskLevel,
			vruLethality: analysis.vruLethality, vruDetails: analysis.vruDetails, recommendedAction: analysis.recommendedAction,
			materialsChecklist: analysis.materialsChecklist, triagePayload: { ...analysis, civicAddress: input.locationName, media: draft.media }, communityConfirmations: 1
		}).returning({ id: reports.id });
		const [post] = await tx.insert(communityPosts).values({ ...input, userId: user.id, reportId: report.id, latitude: input.latitude.toFixed(8), longitude: input.longitude.toFixed(8), media: draft.media, analysis }).returning({ id: communityPosts.id });
		return post.id;
	});
	return json({ id }, { status: 201 });
};
