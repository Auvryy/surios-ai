import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { loadMapHazards } from '$lib/server/map-hazards';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	if (!z.uuid().safeParse(params.id).success) error(404, 'Report not found.');
	const { hazards, asOf } = await loadMapHazards(params.id);
	if (!hazards.length) error(404, 'Report not found.');
	return json({ hazard: hazards[0], asOf });
};
