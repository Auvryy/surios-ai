import type { PageServerLoad } from './$types';
import { loadMapHazards } from '$lib/server/map-hazards';
export const load: PageServerLoad = () => loadMapHazards();
