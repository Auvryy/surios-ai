import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadPublicMapSnapshot } from '$lib/server/public-map';

export const GET: RequestHandler = async ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'no-store, max-age=0' });
	try {
		return json(await loadPublicMapSnapshot());
	} catch {
		return json({ message: 'Map updates are temporarily unavailable.' }, { status: 503 });
	}
};
