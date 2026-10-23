import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { error } from '@sveltejs/kit';
import { and, eq, isNull, lt } from 'drizzle-orm';
import { db, communityDrafts, communityPosts } from './db';
import type { PostMedia } from '$lib/types/community';

export const MEDIA_DIR = path.resolve('static/uploads/community');
import { TOTAL_MEDIA_BYTES, mediaLimitError } from '$lib/types/media';
export const MAX_TOTAL_BYTES = TOTAL_MEDIA_BYTES;
const types: Record<string, { extension: string; kind: 'photo' | 'video' }> = {
	'image/jpeg': { extension: 'jpg', kind: 'photo' }, 'image/png': { extension: 'png', kind: 'photo' },
	'image/webp': { extension: 'webp', kind: 'photo' }, 'video/mp4': { extension: 'mp4', kind: 'video' },
	'video/webm': { extension: 'webm', kind: 'video' }, 'video/quicktime': { extension: 'mov', kind: 'video' }
};
export async function readUploadForm(request: Request) {
	const reader = request.body?.getReader();
	if (!reader) error(400, 'Choose road photos or a short video.');
	let size = 0;
	const chunks: Uint8Array[] = [];
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		size += value.length;
		if (size > MAX_TOTAL_BYTES + 128 * 1024) { await reader.cancel(); error(413, 'Attachments must total 50 MB or less.'); }
		chunks.push(value);
	}
	try {
		return await new Response(Buffer.concat(chunks), { headers: { 'content-type': request.headers.get('content-type') || '' } }).formData();
	} catch { error(400, 'Unable to read attachments. Select the files again.'); }
}
export async function validateMedia(files: FormDataEntryValue[]) {
	if (files.length < 1 || files.length > 6) error(400, 'Choose between 1 and 6 photos or videos.');
	if (files.some((file) => !(file instanceof File))) error(400, 'Invalid attachment.');
	if ((files as File[]).some((file) => !types[file.type])) error(400, 'Use JPEG, PNG, WebP, MP4, WebM, or MOV files.');
	const limitError = mediaLimitError(files as File[]);
	if (limitError) error(413, limitError);
	return Promise.all(files.map(async (entry) => {
		if (!(entry instanceof File)) error(400, 'Invalid attachment.');
		const type = types[entry.type];
		if (!type || !entry.size) error(400, 'Use JPEG, PNG, WebP, MP4, WebM, or MOV files.');
		const buffer = Buffer.from(await entry.arrayBuffer());
		const valid = entry.type === 'image/jpeg' ? buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
			: entry.type === 'image/png' ? buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
			: entry.type === 'image/webp' ? buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
			: entry.type === 'video/webm' ? buffer.subarray(0, 4).equals(Buffer.from([26,69,223,163]))
			: buffer.toString('ascii', 4, 8) === 'ftyp';
		if (!valid) error(400, 'An attachment does not match its file format.');
		const id = crypto.randomUUID();
		return { buffer, filename: `${id}.${type.extension}`, media: { id, url: `/media/${id}.${type.extension}`, kind: type.kind, name: entry.name.slice(0, 160), mimeType: entry.type } satisfies PostMedia };
	}));
}
export async function removeMedia(media: PostMedia[]) {
	await Promise.all(media.map((item) => fs.rm(path.join(MEDIA_DIR, path.basename(item.url)), { force: true })));
}
export async function cleanExpiredDrafts() {
	const expired = await db.select({ draft: communityDrafts }).from(communityDrafts)
		.leftJoin(communityPosts, eq(communityPosts.draftId, communityDrafts.id))
		.where(and(lt(communityDrafts.expiresAt, new Date()), isNull(communityPosts.id))).limit(20);
	for (const { draft } of expired) {
		await removeMedia(draft.media);
		await db.delete(communityDrafts).where(eq(communityDrafts.id, draft.id));
	}
}
