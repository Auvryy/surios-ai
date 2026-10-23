import { error } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, users } from './db';
import { communityFilters, loadCommunityPosts } from './community';
import { isGovernment } from '$lib/types/community';

export async function loadProfile(id: string, viewerId: string | undefined, url: URL) {
	if (!z.uuid().safeParse(id).success) error(404, 'Profile not found.');
	const [profile] = await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, coverUrl: users.coverUrl, role: users.role, governmentProfile: users.governmentProfile }).from(users).where(eq(users.id, id));
	if (!profile) error(404, 'Profile not found.');
	const filters = { ...communityFilters(url), author: id, q: '', tab: '', media: '' };
	const feed = await loadCommunityPosts(viewerId, filters);
	let statistics: { inProgress: number; resolved: number; reports: number } | null = null;
	if (isGovernment(profile.role)) {
		// Attribute each report to its latest official update, including grouped posts.
		// Repeated quotes count once, and a later office update transfers attribution.
		const result = await db.execute(sql`
			with latest as (
				select distinct on (p.report_id) p.report_id, q.user_id
				from community_reposts q join community_posts p on p.id = q.post_id
				where q.government_update is not null order by p.report_id, q.created_at desc, q.id desc
			)
			select count(*)::int as reports,
				count(*) filter (where r.status in ('IN_REPAIR', 'DISPATCHED', 'AWAITING_REVIEW'))::int as "inProgress",
				count(*) filter (where r.status = 'RESOLVED')::int as resolved
			from latest l join reports r on r.id = l.report_id where l.user_id = ${id}
		`);
		statistics = result[0] as unknown as NonNullable<typeof statistics>;
	}
	return { profile, statistics, isOwner: id === viewerId, ...feed };
}
