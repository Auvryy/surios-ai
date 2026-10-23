import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, users } from './db';
import { communityFilters, loadCommunityPosts } from './community';

export async function loadProfile(id: string, viewerId: string | undefined, url: URL) {
	if (!z.uuid().safeParse(id).success) error(404, 'Profile not found.');
	const [profile] = await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, coverUrl: users.coverUrl }).from(users).where(eq(users.id, id));
	if (!profile) error(404, 'Profile not found.');
	const filters = { ...communityFilters(url), author: id, q: '', tab: '', media: '' };
	const feed = await loadCommunityPosts(viewerId, filters);
	return { profile, isOwner: id === viewerId, ...feed };
}
