import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { error } from '@sveltejs/kit';
import { z } from 'zod';
import { MEDIA_DIR, validateMedia } from './community-media';
import type { GovernmentAttachment } from '$lib/types/community';

export const governmentProfileSchema = z.object({
	level: z.enum(['MUNICIPAL', 'BARANGAY']), jurisdiction: z.string().trim().min(2).max(120), bio: z.string().trim().max(500)
});
const budgetItem = z.object({ label: z.string().trim().min(1).max(100), amount: z.number().finite().min(0.01).max(1_000_000_000).refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.0001, 'Use at most two decimal places.') });
export const governmentUpdateSchema = z.object({
	status: z.enum(['IN_PROGRESS', 'RESOLVED']), budget: z.array(budgetItem).max(20), budgetType: z.enum(['ESTIMATED', 'ACTUAL'])
});

export async function prepareGovernmentAttachments(entries: FormDataEntryValue[]) {
	if (entries.length < 1 || entries.length > 4) error(400, 'Attach 1–4 evidence photos or PDF documents.');
	let bytes = 0;
	const prepared: { filename: string; buffer: Buffer; media: GovernmentAttachment }[] = [];
	for (const file of entries) {
		if (!(file instanceof File) || !file.size) error(400, 'Choose a photo or PDF document.');
		bytes += file.size;
		if (file.size > (file.type === 'application/pdf' ? 4 : 5) * 1024 * 1024 || bytes > 12 * 1024 * 1024) error(413, 'Photos must be 5 MB or less and PDFs 4 MB or less; total must be 12 MB or less.');
		if (file.type === 'application/pdf') {
			const buffer = Buffer.from(await file.arrayBuffer());
			if (buffer.toString('ascii', 0, 5) !== '%PDF-') error(400, 'The document does not match its PDF format.');
			const id = randomUUID();
			prepared.push({ filename: `${id}.pdf`, buffer, media: { id, url: `/media/${id}.pdf`, name: file.name.slice(0, 160), mimeType: file.type, kind: 'document' } });
		} else {
			if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) error(400, 'Use JPEG, PNG, WebP or PDF evidence.');
			const [photo] = await validateMedia([file]);
			prepared.push({ ...photo, media: { ...photo.media, kind: 'photo' } });
		}
	}
	return prepared;
}

export async function writeGovernmentAttachments(uploads: Awaited<ReturnType<typeof prepareGovernmentAttachments>>) {
	await fs.mkdir(MEDIA_DIR, { recursive: true });
	for (const upload of uploads) await fs.writeFile(path.join(MEDIA_DIR, upload.filename), upload.buffer, { flag: 'wx' });
}
export async function removeGovernmentAttachments(uploads: Awaited<ReturnType<typeof prepareGovernmentAttachments>>) {
	await Promise.all(uploads.map((upload) => fs.rm(path.join(MEDIA_DIR, upload.filename), { force: true })));
}
