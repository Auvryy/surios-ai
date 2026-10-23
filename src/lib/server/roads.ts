import { error } from '@sveltejs/kit';
import { MAX_ROAD_METERS, MIN_ROAD_METERS, roadLength, selectRoadSegment, type RoadWay } from '$lib/types/roads';
const cache = new Map<string, { expires: number; ways: RoadWay[] }>();
const pending = new Map<string, Promise<RoadWay[]>>();
async function queryRoads(key: string, query: string): Promise<RoadWay[]> {
	const cached = cache.get(key); if (cached && cached.expires > Date.now()) return cached.ways;
	const existing = pending.get(key); if (existing) return existing;
	const task = (async () => {
		const response = await fetch(`https://api.openstreetmap.org/api/0.6/${query}`, { headers: { Accept: 'application/json', 'User-Agent': 'SuriOS/1.0 (community road reporting)' }, signal: AbortSignal.timeout(10000) });
		if (!response.ok) error(503, 'Street data is busy. Try road selection again or use a point pin.');
		const body = await response.json();
		const elements = body.elements || [];
		const nodes = new Map<number, [number, number]>(elements.filter((item: any) => item.type === 'node').map((item: any) => [item.id, [item.lat, item.lon]]));
		const ways: RoadWay[] = elements.filter((item: any) => item.type === 'way' && item.tags?.highway && !['footway', 'path', 'steps', 'cycleway', 'construction', 'proposed'].includes(item.tags.highway) && item.nodes?.length >= 2 && item.nodes.length <= 2000 && item.nodes.every((id: number) => nodes.has(id))).map((item: any) => ({ id: String(item.id), name: String(item.tags.name || item.tags.ref || 'Unnamed road').slice(0, 160), coordinates: item.nodes.map((id: number) => nodes.get(id)!) }));
		if (cache.size > 200) cache.delete(cache.keys().next().value!);
		cache.set(key, { expires: Date.now() + 15 * 60000, ways });
		for (const way of ways) cache.set(`way:${way.id}`, { expires: Date.now() + 15 * 60000, ways: [way] });
		while (cache.size > 400) cache.delete(cache.keys().next().value!);
		return ways;
	})();
	pending.set(key, task);
	try { return await task; } finally { pending.delete(key); }
}
export async function roadsNear(latitude: number, longitude: number) {
	const lat = Math.round(latitude * 1000) / 1000, lon = Math.round(longitude * 1000) / 1000;
	const dy = .0045, dx = Math.min(.02, dy / Math.max(.1, Math.cos(lat * Math.PI / 180)));
	try { return await queryRoads(`near:${lat},${lon}`, `map?bbox=${Math.max(-180, lon - dx)},${Math.max(-85, lat - dy)},${Math.min(180, lon + dx)},${Math.min(85, lat + dy)}`); }
	catch { error(503, 'Street data is unavailable. Try again or choose a point pin.'); }
}
export async function verifyRoadSelection(input: { id: string; start: number; end: number }) {
	if (!/^[1-9][0-9]{0,14}$/.test(input.id) || !Number.isFinite(input.start) || !Number.isFinite(input.end) || input.start < 0 || input.end - input.start < MIN_ROAD_METERS || input.end - input.start > MAX_ROAD_METERS) error(400, 'Choose a road section between 5 and 500 metres.');
	let road: RoadWay | undefined;
	try { [road] = await queryRoads(`way:${input.id}`, `way/${input.id}/full.json`); } catch { error(503, 'Unable to verify this road. Try again; your draft is retained.'); }
	if (!road) error(400, 'Choose a mapped road.');
	if (input.start < 0 || input.end > roadLength(road.coordinates) + .1 || input.end - input.start < MIN_ROAD_METERS || input.end - input.start > MAX_ROAD_METERS) error(400, 'Choose a road section between 5 and 500 metres.');
	return selectRoadSegment(road, input.start, input.end);
}
