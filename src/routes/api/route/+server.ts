import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getDispatchRoute, snapToRoad, SANTA_CRUZ_DEPOT } from '$lib/server/geoapify.js';

export const GET: RequestHandler = async ({ url }) => {
	const destLat = Number(url.searchParams.get('destLat'));
	const destLng = Number(url.searchParams.get('destLng'));
	const destName = url.searchParams.get('name') || 'Road Defect Work Site';

	if (isNaN(destLat) || isNaN(destLng)) {
		return json(
			{ success: false, error: 'Destination coordinates (destLat and destLng) are required.' },
			{ status: 400 }
		);
	}

	const originLat = url.searchParams.get('originLat')
		? Number(url.searchParams.get('originLat'))
		: SANTA_CRUZ_DEPOT.lat;
	const originLng = url.searchParams.get('originLng')
		? Number(url.searchParams.get('originLng'))
		: SANTA_CRUZ_DEPOT.lng;
	const originName = url.searchParams.get('originName') || SANTA_CRUZ_DEPOT.name;

	try {
		const route = await getDispatchRoute(
			{ lat: destLat, lng: destLng, name: destName },
			{ lat: originLat, lng: originLng, name: originName }
		);

		return json({
			success: true,
			route
		});
	} catch (err: any) {
		console.error('[API Route Error]', err);
		return json(
			{ success: false, error: err?.message || 'Could not calculate road dispatch route.' },
			{ status: 500 }
		);
	}
};
