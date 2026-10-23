import { distanceMeters } from './hazards';
export type RoadPoint = [number, number];
export interface RoadWay { id: string; name: string; coordinates: RoadPoint[] }
export interface RoadSegment extends RoadWay { start: number; end: number; length: number }
export const MAX_ROAD_METERS = 500;
export const MIN_ROAD_METERS = 5;
export function roadLength(points: RoadPoint[]) {
	return points.slice(1).reduce((total, point, index) => total + meters(points[index], point), 0);
}
export function meters(a: RoadPoint, b: RoadPoint) { return distanceMeters({ latitude: a[0], longitude: a[1] }, { latitude: b[0], longitude: b[1] }); }
export function pointAlong(points: RoadPoint[], offset: number): RoadPoint {
	let remaining = Math.max(0, offset);
	for (let index = 1; index < points.length; index++) {
		const length = meters(points[index - 1], points[index]);
		if (remaining <= length && length) { const t = remaining / length; return [points[index - 1][0] + t * (points[index][0] - points[index - 1][0]), points[index - 1][1] + t * (points[index][1] - points[index - 1][1])]; }
		remaining -= length;
	}
	return points[points.length - 1];
}
export function nearestRoadPoint(points: RoadPoint[], target: RoadPoint) {
	let best = { distance: Infinity, offset: 0, point: points[0] };
	let walked = 0;
	const scale = Math.cos(target[0] * Math.PI / 180);
	for (let i = 1; i < points.length; i++) {
		const a = points[i - 1], b = points[i];
		const dx = (b[1] - a[1]) * scale, dy = b[0] - a[0];
		const t = Math.min(1, Math.max(0, ((target[1] - a[1]) * scale * dx + (target[0] - a[0]) * dy) / (dx * dx + dy * dy || 1)));
		const point: RoadPoint = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
		const length = meters(a, b), distance = meters(point, target);
		if (distance < best.distance) best = { distance, offset: walked + t * length, point };
		walked += length;
	}
	return best;
}
export function selectRoadSegment(road: RoadWay, start: number, end: number): RoadSegment {
	const total = roadLength(road.coordinates);
	start = Math.max(0, Math.min(total, start)); end = Math.max(start, Math.min(total, end));
	const coordinates: RoadPoint[] = [pointAlong(road.coordinates, start)];
	let walked = 0;
	for (let i = 1; i < road.coordinates.length; i++) { walked += meters(road.coordinates[i - 1], road.coordinates[i]); if (walked > start && walked < end) coordinates.push(road.coordinates[i]); }
	coordinates.push(pointAlong(road.coordinates, end));
	return { id: road.id, name: road.name, coordinates, start, end, length: end - start };
}
/** Nearby overlapping sections of the same mapped way are candidates, never proof of hazard identity. */
export function roadSectionsOverlap(a?: RoadSegment | null, b?: RoadSegment | null) { return !!a && !!b && a.id === b.id && Math.min(a.end, b.end) >= Math.max(a.start, b.start) - 15; }
