import { loadMapHazards } from '$lib/server/map-hazards';
import type { PublicMapHazard, PublicMapSnapshot } from '$lib/types/public-map';

const LANDING_MAP_LIMIT = 300;

export async function loadPublicMapSnapshot(): Promise<PublicMapSnapshot> {
	const { asOf, hazards } = await loadMapHazards();
	const validHazards = hazards
		.filter((hazard) => Number.isFinite(hazard.latitude)
			&& Number.isFinite(hazard.longitude)
			&& Math.abs(hazard.latitude) <= 90
			&& Math.abs(hazard.longitude) <= 180);
	const mapped: PublicMapHazard[] = validHazards
		.slice(0, LANDING_MAP_LIMIT)
		.map((hazard) => ({
			id: hazard.id,
			title: hazard.title,
			location: hazard.location,
			latitude: hazard.latitude,
			longitude: hazard.longitude,
			severity: hazard.severity,
			status: hazard.status,
			updatedAt: hazard.updatedAt
		}));

	return { asOf, totalHazards: validHazards.length, hazards: mapped };
}
