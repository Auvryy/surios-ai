import fs from 'node:fs/promises';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import { MEDIA_DIR } from '$lib/server/community-media';
import type { RequestHandler } from './$types';
const mimeTypes: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };
export const GET: RequestHandler = async ({ params, request }) => {
	if (!/^[0-9a-f-]{36}\.(jpg|png|webp|mp4|webm|mov)$/.test(params.name)) error(404);
	const filename = path.join(MEDIA_DIR, params.name);
	const stat = await fs.stat(filename).catch(() => null);
	if (!stat?.isFile()) error(404);
	const headers: Record<string, string> = { 'Content-Type': mimeTypes[params.name.split('.').pop()!], 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' };
	const range = request.headers.get('range');
	let start = 0, end = stat.size - 1, status = 200;
	if (range) {
		const match = /^bytes=(\d*)-(\d*)$/.exec(range);
		if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${stat.size}` } });
		start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
		end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
		if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${stat.size}` } });
		status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
	}
	const handle = await fs.open(filename, 'r');
	try {
		const buffer = Buffer.alloc(end - start + 1);
		await handle.read(buffer, 0, buffer.length, start);
		headers['Content-Length'] = String(buffer.length);
		return new Response(buffer, { status, headers });
	} finally { await handle.close(); }
};
