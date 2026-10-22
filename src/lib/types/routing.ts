export interface RouteStep {
	instruction: string;
	distanceMeters: number;
	durationSeconds: number;
}

export interface DispatchRoute {
	coordinates: [number, number][]; // [lat, lng] for Leaflet
	distanceKm: number;
	distanceFormatted: string;
	durationMinutes: number;
	durationFormatted: string;
	steps: RouteStep[];
	originName: string;
	destinationName: string;
}

export interface SnappedLocation {
	latitude: number;
	longitude: number;
	snapped: boolean;
	streetName?: string;
	district?: string;
	city: string;
	formattedAddress: string;
	confidence?: number;
}
