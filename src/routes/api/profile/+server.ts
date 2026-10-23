import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import fs from 'node:fs/promises';
import path from 'node:path';
import { db, users } from '$lib/server/db';
import { requireCommunityUser } from '$lib/server/community';
import { MEDIA_DIR, readUploadForm, validateMedia, removeMedia } from '$lib/server/community-media';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	const form = await readUploadForm(event.request);
	const name = String(form.get('name') || '').trim();
	if (name.length < 2 || name.length > 80) error(400, 'Use a name between 2 and 80 characters.');
	const uploads: { key: 'avatarUrl' | 'coverUrl'; file: File }[] = [];
	for (const [field, key] of [['avatar', 'avatarUrl'], ['cover', 'coverUrl']] as const) {
		const file = form.get(field);
		if (file instanceof File && file.size) {
			if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) error(400, 'Profile photos must be JPEG, PNG, or WebP.');
			if (file.size > 4 * 1024 * 1024) error(413, 'Each profile photo must be 4 MB or less.');
			uploads.push({ key, file });
		}
	}
	const files = uploads.length ? await validateMedia(uploads.map(({ file }) => file)) : [];
	const saved: typeof files = [];
	try {
		await fs.mkdir(MEDIA_DIR, { recursive: true });
		for (const file of files) { saved.push(file); await fs.writeFile(path.join(MEDIA_DIR, file.filename), file.buffer, { flag: 'wx' }); }
		const changes: { name: string; updatedAt: Date; avatarUrl?: string | null; coverUrl?: string | null } = { name, updatedAt: new Date() };
		if (form.get('removeAvatar') === 'true') changes.avatarUrl = null;
		if (form.get('removeCover') === 'true') changes.coverUrl = null;
		for (const [index, upload] of uploads.entries()) changes[upload.key] = files[index].media.url;
		const [profile] = await db.update(users).set(changes).where(eq(users.id, user.id)).returning({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, coverUrl: users.coverUrl });
		return json({ profile });
	} catch (cause) {
		await removeMedia(saved.map(({ media }) => media));
		throw cause;
	}
};
