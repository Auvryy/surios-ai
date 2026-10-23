import { error, json } from '@sveltejs/kit';
import { roadsNear } from '$lib/server/roads';
import type { RequestHandler } from './$types';
const recent = new Map<string, number>();
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) error(401, 'Sign in to select a road.');
	const lat = Number(url.searchParams.get('lat')), lng = Number(url.searchParams.get('lng'));
	if (!url.searchParams.has('lat') || !url.searchParams.has('lng') || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 85 || Math.abs(lng) > 180) error(400, 'Choose a valid map location.');
	if ((recent.get(locals.user.id) || 0) > Date.now() - 1000) error(429, 'Wait a moment before selecting another road.');
	if (recent.size > 1000) recent.clear(); recent.set(locals.user.id, Date.now());
	return json({ roads: await roadsNear(lat, lng) });
};
