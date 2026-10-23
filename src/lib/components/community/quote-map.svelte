<script lang="ts">
	import type { RoadSegment } from '$lib/types/roads';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	let { latitude, longitude, name, href, roadSegment = null }: { latitude: number; longitude: number; name: string; href: string; roadSegment?: RoadSegment | null } = $props();
	let element = $state<HTMLDivElement>();
	let failed = $state(false);
	$effect(() => {
		if (!element) return;
		const container = element, lat = latitude, lon = longitude, section = roadSegment;
		let active = true, started = false;
		let map: import('leaflet').Map | undefined;
		async function start() {
			if (started || !active) return; started = true;
			try {
				const L = await import('leaflet'); if (!active) return;
				map = L.map(container, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false }).setView([lat, lon], 15);
				L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
				if (section) { L.polyline(section.coordinates, { color: '#2563eb', weight: 4 }).addTo(map); map.fitBounds(section.coordinates, { padding: [12, 12], maxZoom: 17 }); }
				L.circleMarker([lat, lon], { radius: 5, color: '#ffffff', weight: 2, fillColor: '#2563eb', fillOpacity: 1, interactive: false }).addTo(map);
			} catch { if (active) failed = true; }
		}
		const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); void start(); } }, { rootMargin: '200px' });
		observer.observe(container);
		return () => { active = false; observer.disconnect(); map?.remove(); };
	});
</script>
<div class="relative isolate h-24 min-w-0 overflow-hidden rounded-lg bg-muted">
	<div bind:this={element} role="img" aria-label="Map of {name}" class="absolute inset-0 z-0 size-full"></div>
	<a {href} aria-label="Open original report map" class="absolute inset-0 z-10"><span class="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-md bg-card/95 px-1.5 py-1 text-[10px] font-semibold"><MapPinIcon class="size-3 text-primary" />Map</span>{#if failed}<span class="absolute inset-0 flex items-center justify-center"><MapPinIcon class="size-6 text-primary" /></span>{/if}</a>
	<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" aria-label="OpenStreetMap attribution" class="absolute right-0 bottom-0 z-20 rounded-tl bg-card/90 px-1 text-[8px] leading-3 text-muted-foreground">© OSM</a>
</div>
