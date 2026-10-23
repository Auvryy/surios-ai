export interface PublicMapHazard {
	id: string;
	title: string;
	location: string;
	latitude: number;
	longitude: number;
	severity: number;
	status: string;
	updatedAt: string;
}

export interface PublicMapSnapshot {
	asOf: string | null;
	totalHazards: number;
	hazards: PublicMapHazard[];
}

export const emptyPublicMapSnapshot: PublicMapSnapshot = {
	asOf: null,
	totalHazards: 0,
	hazards: []
};
