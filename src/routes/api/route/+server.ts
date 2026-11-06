import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getDispatchRoute } from '$lib/server/geoapify.js';

export const GET: RequestHandler = async ({ url }) => {
 const coordinate = (key: string, limit: number) => {
  const raw = url.searchParams.get(key);
  if (!raw?.trim()) return null;
  const value = Number(raw);
  return Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
 };
 const destLat = coordinate('destLat', 90), destLng = coordinate('destLng', 180);
 const originLat = coordinate('originLat', 90), originLng = coordinate('originLng', 180);
 if (destLat === null || destLng === null || originLat === null || originLng === null) {
  return json({ success: false, error: 'Valid origin and destination coordinates are required. Allow location access and try again.' }, { status: 400 });
 }
 try {
  const route = await getDispatchRoute(
   { lat: destLat, lng: destLng, name: (url.searchParams.get('name') || 'Selected hazard').slice(0, 160) },
   { lat: originLat, lng: originLng, name: 'Your current location' }
  );
  if (route.estimated || route.coordinates.length < 2 || route.coordinates.some(([lat, lng]) => !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)) {
   return json({ success: false, error: 'Road directions are unavailable. Your location and hazard pin remain available; no direct line is shown as a road route.' }, { status: 503 });
  }
  return json({ success: true, route: { ...route, originName: 'Your current location' } }, { headers: { 'Cache-Control': 'no-store' } });
 } catch {
  return json({ success: false, error: 'Road directions are unavailable. Please try again.' }, { status: 503 });
 }
};
