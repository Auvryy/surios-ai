import fs from 'node:fs';
import path from 'node:path';
import type { SnappedLocation, RouteStep, DispatchRoute } from '$lib/types/routing.js';

export type { SnappedLocation, RouteStep, DispatchRoute };

export function getApiKey(): string {
	if (process.env.GEOAPIFY_API_KEY && process.env.GEOAPIFY_API_KEY.trim() !== '') {
		return process.env.GEOAPIFY_API_KEY.trim();
	}

	try {
		const envPath = path.resolve('.env');
		if (fs.existsSync(envPath)) {
			const content = fs.readFileSync(envPath, 'utf8');
			const match = content.match(/GEOAPIFY_API_KEY=["']?([^"'\r\n]+)/);
			if (match && match[1]) {
				const key = match[1].trim();
				process.env.GEOAPIFY_API_KEY = key;
				return key;
			}
		}
	} catch (e) {
		console.warn('[Geoapify Service] Could not read .env:', e);
	}

	return '';
}

export function isGeoapifyConfigured(): boolean {
	return Boolean(getApiKey());
}

// In-memory cache to conserve Geoapify free credits (TTL: 1 hour)
const routeCache = new Map<string, { data: DispatchRoute; timestamp: number }>();
const snapCache = new Map<string, { data: SnappedLocation; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

// Santa Cruz Municipal Hall / Engineering Depot Anchor
export const SANTA_CRUZ_DEPOT = {
	name: 'Santa Cruz Municipal Engineering Depot',
	lat: 14.2818,
	lng: 121.4150
};

/**
 * Snaps a raw GPS point to the nearest physical road centerline and resolves street naming.
 */
export async function snapToRoad(latitude: number, longitude: number): Promise<SnappedLocation> {
	const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
	const cached = snapCache.get(cacheKey);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
		return cached.data;
	}

	const apiKey = getApiKey();
	if (!apiKey) {
		return {
			latitude,
			longitude,
			snapped: false,
			city: 'Santa Cruz',
			formattedAddress: `Corridor (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`
		};
	}

	try {
		const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&type=street&format=json&apiKey=${apiKey}`;
		const res = await fetch(url, { headers: { 'User-Agent': 'SuriOS-Civil/1.0' }, signal: AbortSignal.timeout(10000) });
		
		if (!res.ok) {
			throw new Error(`Geoapify Reverse Geocode error: ${res.status}`);
		}

		const data = await res.json();
		const result = data.results?.[0];

		if (result) {
			const streetName = result.street || result.name || result.road;
			const district = result.suburb || result.quarter || result.district;
			const city = result.city || 'Santa Cruz';
			const snappedLat = typeof result.lat === 'number' ? result.lat : latitude;
			const snappedLon = typeof result.lon === 'number' ? result.lon : longitude;

			const formattedAddress = streetName 
				? `${streetName}${district ? `, ${district}` : ''}, ${city}`
				: (result.formatted || `Santa Cruz Corridor (${snappedLat.toFixed(4)}° N, ${snappedLon.toFixed(4)}° E)`);

			const snappedData: SnappedLocation = {
				latitude: Number(snappedLat.toFixed(6)),
				longitude: Number(snappedLon.toFixed(6)),
				snapped: true,
				streetName,
				district,
				city,
				formattedAddress,
				confidence: result.rank?.confidence
			};

			snapCache.set(cacheKey, { data: snappedData, timestamp: Date.now() });
			return snappedData;
		}
	} catch (err) {
		console.warn('[Geoapify Snap Warning]:', err);
	}

	// Fallback to original coordinates with default naming
	return {
		latitude,
		longitude,
		snapped: false,
		city: 'Santa Cruz',
		formattedAddress: `Laguna Corridor (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`
	};
}

/**
 * Calculates road routing geometry and transit telemetry from the municipal depot to defect location.
 */
export async function getDispatchRoute(
	destination: { lat: number; lng: number; name?: string },
	origin: { lat: number; lng: number; name?: string } = SANTA_CRUZ_DEPOT,
	mode = 'drive'
): Promise<DispatchRoute> {
	const cacheKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}_${mode}`;
	const cached = routeCache.get(cacheKey);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
		return cached.data;
	}

	const apiKey = getApiKey();
	if (!apiKey) {
		return createFallbackRoute(origin, destination);
	}

	try {
		const waypoints = `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`;
		const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=${mode}&details=instruction_details&apiKey=${apiKey}`;
		
		const res = await fetch(url, { headers: { 'User-Agent': 'SuriOS-Civil/1.0' }, signal: AbortSignal.timeout(10000) });
		if (!res.ok) {
			throw new Error(`Geoapify Routing error: HTTP ${res.status}`);
		}

		const data = await res.json();
		const feature = data.features?.[0];

		if (feature && feature.geometry && feature.geometry.coordinates) {
			// Geoapify returns [lon, lat] in LineString or MultiLineString format. Convert to Leaflet [lat, lon][]
			let leafletCoords: [number, number][] = [];

			if (feature.geometry.type === 'MultiLineString' || Array.isArray(feature.geometry.coordinates[0]?.[0])) {
				for (const segment of feature.geometry.coordinates) {
					if (Array.isArray(segment)) {
						for (const pt of segment) {
							if (Array.isArray(pt) && pt.length >= 2) {
								leafletCoords.push([pt[1], pt[0]]);
							}
						}
					}
				}
			} else if (Array.isArray(feature.geometry.coordinates)) {
				leafletCoords = feature.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
			}

			const props = feature.properties || {};
			const distanceMeters = props.distance || 0;
			const timeSeconds = props.time || 0;

			const distanceKm = Number((distanceMeters / 1000).toFixed(2));
			const distanceFormatted = distanceKm < 1 ? `${Math.round(distanceMeters)} m` : `${distanceKm} km`;

			const durationMinutes = Math.max(1, Math.round(timeSeconds / 60));
			const durationFormatted = durationMinutes < 60 
				? `${durationMinutes} min${durationMinutes > 1 ? 's' : ''}`
				: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

			const steps: RouteStep[] = [];
			const legs = props.legs || [];
			for (const leg of legs) {
				if (Array.isArray(leg.steps)) {
					for (const s of leg.steps) {
						if (s.instruction?.text) {
							steps.push({
								instruction: s.instruction.text,
								distanceMeters: s.distance || 0,
								durationSeconds: s.time || 0
							});
						}
					}
				}
			}

			const routeData: DispatchRoute = {
				coordinates: leafletCoords,
				distanceKm,
				distanceFormatted,
				durationMinutes,
				durationFormatted,
				steps: steps.length > 0 ? steps : [{ instruction: 'Follow Santa Cruz provincial artery directly to defect pin.', distanceMeters, durationSeconds: timeSeconds }],
				originName: origin.name || SANTA_CRUZ_DEPOT.name,
				destinationName: destination.name || 'Road Defect Work Site'
			};

			routeCache.set(cacheKey, { data: routeData, timestamp: Date.now() });
			return routeData;
		}
	} catch (err) {
		console.warn('[Geoapify Routing Warning]:', err);
	}

	return createFallbackRoute(origin, destination);
}

/**
 * Resilient fallback generator if network or third-party service is unavailable.
 */
function createFallbackRoute(
	origin: { lat: number; lng: number; name?: string },
	destination: { lat: number; lng: number; name?: string }
): DispatchRoute {
	const coordinates: [number, number][] = [[origin.lat, origin.lng], [destination.lat, destination.lng]];

	// Approximate Haversine calculation
	const dLat = (destination.lat - origin.lat) * (Math.PI / 180);
	const dLon = (destination.lng - origin.lng) * (Math.PI / 180);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(origin.lat * (Math.PI / 180)) *
			Math.cos(destination.lat * (Math.PI / 180)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const straightKm = 6371 * c;
	return {
		estimated: true,
		coordinates,
		distanceKm: Number(straightKm.toFixed(2)),
		distanceFormatted: `${straightKm.toFixed(2)} km direct`,
		durationMinutes: 0,
		durationFormatted: 'Travel time unavailable',
		steps: [],
		originName: origin.name || SANTA_CRUZ_DEPOT.name,
		destinationName: destination.name || 'Road Defect Work Site'
	};
}
