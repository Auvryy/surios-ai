import { json, isHttpError } from '@sveltejs/kit';
import { analyzeRoadDistress } from '$lib/server/gemini';
import { snapToRoad } from '$lib/server/geoapify';
import { normalizeSeverity } from '$lib/types/hazards';
import { recordHazardEvidence } from '$lib/server/hazard-reporting';
import { MEDIA_DIR, readUploadForm, validateMedia, removeMedia } from '$lib/server/community-media';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type { RequestHandler } from './$types';
export const POST: RequestHandler = async ({ request, locals, url }) => {
	let saved: Awaited<ReturnType<typeof validateMedia>> = [];
	try {
		if (request.headers.get('origin') !== url.origin) return json({ success: false, error: 'Invalid request origin.' }, { status: 403 });
		const form = await readUploadForm(request);
		const latitude = Number(form.get('latitude')), longitude = Number(form.get('longitude'));
		if (!form.get('latitude') || !form.get('longitude') || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return json({ success: false, error: 'Provide valid latitude and longitude for the hazard pin.' }, { status: 400 });
		const files = await validateMedia(form.getAll('image'));
		if (files.length !== 1 || files[0].media.kind !== 'photo') return json({ success: false, error: 'Choose one JPEG, PNG, or WebP photo.' }, { status: 400 });
		const file = files[0];
		const analysis = normalizeSeverity(await analyzeRoadDistress(file.buffer, file.media.mimeType));
		if (!analysis.isValidInfrastructure) return json({ success: false, error: analysis.rejectionReason || 'The photo does not show public road infrastructure.', analysis }, { status: 422 });
		const address = await snapToRoad(latitude, longitude).catch(() => null);
		await fs.mkdir(MEDIA_DIR, { recursive: true });
		saved = files;
		await fs.writeFile(path.join(MEDIA_DIR, file.filename), file.buffer, { flag: 'wx' });
		const result = await recordHazardEvidence({ sourceId: crypto.randomUUID(), userId: locals.user?.id, analysis, media: [file.media], latitude, longitude, locationName: address?.formattedAddress || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
		saved = [];
		return json({ success: true, data: { ...result, reportId: `TKT-${result.reportId.slice(0, 8).toUpperCase()}`, rawId: result.reportId, imageUrl: file.media.url, latitude, longitude, streetAddress: address?.formattedAddress, analysis, createdAt: new Date().toISOString() } });
	} catch (cause) {
		return json({ success: false, error: isHttpError(cause) ? cause.body.message : 'Unable to save the report. Your evidence was not dispatched; please try again.' }, { status: isHttpError(cause) ? cause.status : 503 });
	} finally { if (saved.length) await removeMedia(saved.map((file) => file.media)); }
};
