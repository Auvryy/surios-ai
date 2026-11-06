import { test, expect } from '@playwright/test';
import { GET } from '../src/routes/api/route/+server';
const originalFetch = globalThis.fetch;
const oldKey = process.env.GEOAPIFY_API_KEY;
test.afterEach(() => { globalThis.fetch = originalFetch; if (oldKey === undefined) delete process.env.GEOAPIFY_API_KEY; else process.env.GEOAPIFY_API_KEY = oldKey; });
const invoke = (query: string) => GET({ url: new URL(`https://surios.test/api/route?${query}`) } as Parameters<typeof GET>[0]);
test('requires explicit finite origin and destination coordinates without depot fallback', async () => {
 for (const query of ['', 'destLat=14&destLng=121', 'originLat=14&originLng=121&destLat=&destLng=121', 'originLat=Infinity&originLng=121&destLat=14&destLng=121', 'originLat=91&originLng=121&destLat=14&destLng=121']) {
  const response = await invoke(query); expect(response.status).toBe(400);
 }
});
test('passes user origin to routing and retains curved road geometry', async () => {
 process.env.GEOAPIFY_API_KEY = 'test-only';
 let requested = '';
 globalThis.fetch = async (input) => { requested = String(input); return Response.json({ features: [{ geometry: { type: 'LineString', coordinates: [[121.42,14.31],[121.425,14.315],[121.43,14.32]] }, properties: { distance: 1800, time: 250 } }] }); };
 const response = await invoke('originLat=14.31&originLng=121.42&destLat=14.32&destLng=121.43');
 expect(response.status).toBe(200); expect(decodeURIComponent(requested)).toContain('waypoints=14.31,121.42|14.32,121.43');
 const body = await response.json(); expect(body.route.originName).toBe('Your current location'); expect(body.route.coordinates).toEqual([[14.31,121.42],[14.315,121.425],[14.32,121.43]]); expect(body.route.steps).toEqual([]);
});
test('provider failure returns unavailable instead of a straight-line navigation route', async () => {
 process.env.GEOAPIFY_API_KEY = 'test-only'; globalThis.fetch = async () => new Response('', { status: 503 });
 const response = await invoke('originLat=14.33&originLng=121.44&destLat=14.34&destLng=121.45');
 expect(response.status).toBe(503); const body = await response.json(); expect(body.success).toBe(false); expect(body.route).toBeUndefined();
});
