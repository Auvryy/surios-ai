import { json } from '@sveltejs/kit';
import { loadMapHazards } from '$lib/server/map-hazards';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => json(await loadMapHazards());
