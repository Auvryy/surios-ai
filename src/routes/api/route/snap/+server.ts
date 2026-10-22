import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { snapToRoad } from '$lib/server/geoapify.js';

export const GET: RequestHandler = async ({ url }) => {
	const lat = Number(url.searchParams.get('lat'));
	const lng = Number(url.searchParams.get('lng'));

	if (isNaN(lat) || isNaN(lng)) {
		return json(
			{ success: false, error: 'Valid lat and lng query parameters are required.' },
			{ status: 400 }
		);
	}

	try {
		const snapped = await snapToRoad(lat, lng);
		return json({
			success: true,
			snapped
		});
	} catch (err: any) {
		console.error('[API Snap Error]', err);
		return json(
			{ success: false, error: err?.message || 'Could not snap coordinates to road.' },
			{ status: 500 }
		);
	}
};
