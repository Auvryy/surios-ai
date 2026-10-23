import { and, eq, isNull, lt } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { db } from './db';
import { governmentMedia } from './db/community-social-schema';
import { readUploadForm, removeMedia } from './community-media';
import { prepareGovernmentAttachments, writeGovernmentAttachments, removeGovernmentAttachments } from './government-updates';

export async function stageGovernmentMedia(request: Request, userId: string) {
	await db.transaction(async (tx) => {
		const expired = await tx.select().from(governmentMedia).where(and(isNull(governmentMedia.claimedBy), lt(governmentMedia.expiresAt, new Date()))).limit(20).for('update', { skipLocked: true });
		for (const row of expired) {
			await removeMedia([{ ...row.media, kind: 'photo' }]);
			await tx.delete(governmentMedia).where(eq(governmentMedia.id, row.id));
		}
	});
	const form = await readUploadForm(request);
	const entries = form.getAll('file');
	if (entries.length !== 1) error(400, 'Upload one evidence file at a time.');
	const uploads = await prepareGovernmentAttachments(entries);
	try {
		await writeGovernmentAttachments(uploads);
		const [saved] = await db.insert(governmentMedia).values({ userId, media: uploads[0].media, expiresAt: new Date(Date.now() + 86400000) }).returning();
		return { id: saved.id, media: saved.media };
	} catch (cause) { await removeGovernmentAttachments(uploads); throw cause; }
}

export async function discardGovernmentMedia(id: string, userId: string) {
	await db.transaction(async (tx) => {
		const [row] = await tx.select().from(governmentMedia).where(and(eq(governmentMedia.id, id), eq(governmentMedia.userId, userId), isNull(governmentMedia.claimedBy))).for('update');
		if (!row) error(404, 'Unpublished attachment not found.');
		await removeMedia([{ ...row.media, kind: 'photo' }]);
		await tx.delete(governmentMedia).where(eq(governmentMedia.id, row.id));
	});
}
