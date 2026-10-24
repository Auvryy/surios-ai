<script lang="ts">
	import type { Map as LeafletMap, Marker, LayerGroup } from 'leaflet';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import NavigationIcon from '@lucide/svelte/icons/navigation';
	import { MAX_ROAD_METERS, MIN_ROAD_METERS, nearestRoadPoint, pointAlong, roadLength, selectRoadSegment, type RoadSegment, type RoadWay, type RoadPoint } from '$lib/types/roads';
	let { latitude = $bindable(14.2813), longitude = $bindable(121.4173), roadSegment = $bindable<RoadSegment | null>(null), ready = $bindable(true), disabled = false, allowRoadSection = true }: { latitude?: number; longitude?: number; roadSegment?: RoadSegment | null; ready?: boolean; disabled?: boolean; allowRoadSection?: boolean } = $props();
	let container: HTMLDivElement;
	let map = $state<LeafletMap | null>(null);
	let leaflet: typeof import('leaflet');
	let marker: Marker | undefined;
	let lineLayers: LayerGroup;
	let locating = $state(false);
	let loadingRoad = $state(false);
	let mode = $state<'point' | 'road'>('point');
	let message = $state('');
	let road = $state<RoadWay | null>(null);
	let pickEnd = $state<'start' | 'end' | null>(null);
	let requestVersion = 0;
	let draggingPin = $state(false);
	let landing = $state<{ x: number; y: number } | null>(null);
	function clearLanding() { landing = null; draggingPin = false; }
	function previewDrop(event: DragEvent) {
		if (!draggingPin || disabled || !allowRoadSection || mode !== 'road' || !map) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		const point = map.mouseEventToContainerPoint(event);
		landing = { x: point.x, y: point.y };
	}
	$effect(() => { ready = mode === 'point' || !!roadSegment; });
	$effect(() => { if (!allowRoadSection && mode === 'road') changeMode('point'); });
	const roadTotal = $derived(road ? roadLength(road.coordinates) : 0);
	function saveSection(start: number, end: number) {
		if (!road) return;
		roadSegment = selectRoadSegment(road, start, end);
		const center = pointAlong(roadSegment.coordinates, roadSegment.length / 2);
		latitude = center[0]; longitude = center[1];
		map?.fitBounds(roadSegment.coordinates, { padding: [32, 38], maxZoom: 18, animate: false });
	}
	function moveEnd(which: 'start' | 'end', offset: number) {
		if (!roadSegment || !road || disabled) return;
		if (which === 'start') saveSection(Math.min(roadSegment.end - MIN_ROAD_METERS, Math.max(0, roadSegment.end - MAX_ROAD_METERS, offset)), roadSegment.end);
		else saveSection(roadSegment.start, Math.max(roadSegment.start + MIN_ROAD_METERS, Math.min(roadTotal, roadSegment.start + MAX_ROAD_METERS, offset)));
	}
	async function selectAt(point: RoadPoint) {
		if (disabled || (mode === 'road' && loadingRoad)) return;
		if (mode === 'point') { latitude = point[0]; longitude = point[1]; return; }
		if (pickEnd && road) { moveEnd(pickEnd, nearestRoadPoint(road.coordinates, point).offset); pickEnd = null; return; }
		loadingRoad = true; message = ''; const version = ++requestVersion;
		try {
			const response = await fetch(`/api/roads?lat=${point[0]}&lng=${point[1]}`);
			const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Unable to load the road.');
			if (version !== requestVersion) return;
			const nearest = (data.roads as RoadWay[]).map((way) => ({ way, snap: nearestRoadPoint(way.coordinates, point) })).sort((a, b) => a.snap.distance - b.snap.distance)[0];
			if (!nearest || nearest.snap.distance > 40 || roadLength(nearest.way.coordinates) < MIN_ROAD_METERS) throw new Error('Drop the pin closer to a road (within 40 metres).');
			road = nearest.way;
			const total = roadLength(road.coordinates), start = Math.max(0, Math.min(total - MIN_ROAD_METERS, nearest.snap.offset - 40));
			saveSection(start, Math.min(total, start + 80));
			message = 'Road selected. Drag either endpoint or adjust the sliders.';
		} catch (cause) { if (version === requestVersion) message = cause instanceof Error ? cause.message : 'Road data is unavailable. Try again or choose a point pin.'; }
		finally { if (version === requestVersion) loadingRoad = false; }
	}
	function changeMode(next: 'point' | 'road') { clearLanding(); mode = next; requestVersion++; loadingRoad = false; road = null; roadSegment = null; pickEnd = null; message = ''; }
	function drop(event: DragEvent) { event.preventDefault(); const valid = draggingPin; clearLanding(); if (!valid || disabled || !allowRoadSection || mode !== 'road' || !map) return; const point = map.mouseEventToLatLng(event); void selectAt([point.lat, point.lng]); }
	$effect(() => {
		let disposed = false;
		let instance: LeafletMap | undefined;
		let observer: ResizeObserver | undefined;
		void import('leaflet').then((L) => {
			if (disposed) return;
			leaflet = L;
			instance = L.map(container, { scrollWheelZoom: false, zoomControl: true }).setView([14.2813, 121.4173], 16);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19 }).addTo(instance);
			lineLayers = L.layerGroup().addTo(instance);
			marker = L.marker([14.2813, 121.4173], { draggable: true, icon: L.divIcon({ className: 'location-pin', html: '<span aria-hidden="true"></span>', iconSize: [24, 24], iconAnchor: [12, 24] }) }).addTo(instance);
			instance.on('click', (event) => { void selectAt([event.latlng.lat, event.latlng.lng]); });
			marker.on('dragstart', () => { draggingPin = true; });
			marker.on('drag', () => { if (disabled || !instance) return; const point = instance.latLngToContainerPoint(marker!.getLatLng()); landing = { x: point.x, y: point.y }; });
			marker.on('dragend', () => { clearLanding(); if (disabled) return; const point = marker!.getLatLng(); latitude = point.lat; longitude = point.lng; });
			observer = new ResizeObserver(() => instance?.invalidateSize({ pan: false })); observer.observe(container);
			map = instance;
		}).catch(() => message = 'Map unavailable. Enter point coordinates below.');
		return () => { disposed = true; requestVersion++; observer?.disconnect(); instance?.remove(); map = null; };
	});
	$effect(() => {
		if (!map || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;
		marker?.setLatLng([latitude, longitude]);
		if (mode === 'point') { if (marker && !map.hasLayer(marker)) marker.addTo(map); if (!map.getBounds().contains([latitude, longitude])) map.panTo([latitude, longitude]); }
		else marker?.remove();
		if (disabled) { map.dragging.disable(); marker?.dragging?.disable(); } else { map.dragging.enable(); marker?.dragging?.enable(); }
	});
	$effect(() => {
		if (!map || !leaflet || !lineLayers) return;
		lineLayers.clearLayers();
		if (!roadSegment || !road) return;
		leaflet.polyline(roadSegment.coordinates, { color: getComputedStyle(container).getPropertyValue('--primary').trim() || '#d44a00', weight: 6 }).addTo(lineLayers);
		for (const which of ['start', 'end'] as const) {
			const coordinates = pointAlong(road.coordinates, roadSegment[which]);
			const endpoint = leaflet.marker(coordinates, { draggable: !disabled, title: `Drag road ${which}`, icon: leaflet.divIcon({ className: 'road-end', html: `<span>${which === 'start' ? 'A' : 'B'}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] }) }).addTo(lineLayers);
			endpoint.on('dragend', () => { const point = endpoint.getLatLng(); moveEnd(which, nearestRoadPoint(road!.coordinates, [point.lat, point.lng]).offset); });
		}
		const center = pointAlong(roadSegment.coordinates, roadSegment.length / 2);
		leaflet.marker(center, { interactive: false, icon: leaflet.divIcon({ className: 'location-pin', html: '<span aria-hidden="true"></span>', iconSize: [24, 24], iconAnchor: [12, 24] }) }).addTo(lineLayers);
	});
	function locate() {
		if (!navigator.geolocation) { message = 'Location is unavailable. Tap the map or enter coordinates.'; return; }
		locating = true; message = '';
		navigator.geolocation.getCurrentPosition((position) => { latitude = position.coords.latitude; longitude = position.coords.longitude; map?.setView([latitude, longitude], 17); locating = false; }, () => { locating = false; message = 'Location permission was unavailable. Tap the map or enter coordinates.'; }, { enableHighAccuracy: true, timeout: 10000 });
	}
</script>
<div class="space-y-3">
	<div class="flex flex-wrap items-center justify-between gap-2"><div role="group" class="flex gap-1" aria-label="Location type"><Button type="button" variant={mode === 'point' ? 'default' : 'outline'} size="sm" class="min-h-11" aria-pressed={mode === 'point'} {disabled} onclick={() => changeMode('point')}>Point pin</Button><Button type="button" variant={mode === 'road' ? 'default' : 'outline'} size="sm" class="min-h-11" aria-pressed={mode === 'road'} disabled={disabled || !allowRoadSection} onclick={() => changeMode('road')}>Road section</Button></div><Button type="button" size="sm" variant="outline" class="min-h-11 shrink-0 text-xs" onclick={locate} disabled={disabled || locating}><NavigationIcon class="size-3.5" />{locating ? 'Locating…' : 'Use my location'}</Button></div>
	{#if mode === 'road'}<div class="flex items-center gap-3 rounded-lg bg-primary/5 px-3 py-2"><button type="button" draggable={!disabled} ondragstart={(event) => { draggingPin = true; if (event.dataTransfer) { event.dataTransfer.setData('text/plain', 'road-pin'); event.dataTransfer.effectAllowed = 'move'; } }} ondragend={clearLanding} onclick={() => { if (map) { const center = map.getCenter(); void selectAt([center.lat, center.lng]); } }} disabled={disabled || loadingRoad} aria-label="Drop pin at map center" class="flex size-12 shrink-0 cursor-grab items-center justify-center rounded-lg border border-primary/30 bg-card active:cursor-grabbing"><MapPinIcon aria-hidden="true" class={`road-dropper size-8 text-primary ${!roadSegment && !loadingRoad && !disabled ? 'road-dropper-idle' : ''}`} /></button><p class="text-xs leading-5 text-muted-foreground">{loadingRoad ? 'Finding the road…' : 'Drag the pin onto a road, tap a road, or press the pin to select at the map center. Adjust A and B to mark 5–500 metres.'}</p></div>{:else}<p class="text-xs text-muted-foreground">Tap the map or drag the pin to the hazard.</p>{/if}
	<div role="region" ondragover={previewDrop} ondragleave={(event) => { if (!(event.relatedTarget instanceof Node) || !container.contains(event.relatedTarget)) landing = null; }} ondrop={drop} aria-label="Infrastructure issue location picker" bind:this={container} class="relative z-0 h-60 w-full overflow-hidden rounded-lg border border-border">{#if landing}<span data-testid="pin-landing-shadow" aria-hidden="true" class="pin-landing-shadow" style:left={`${landing.x}px`} style:top={`${landing.y}px`}></span>{/if}</div>
	{#if mode === 'road' && roadSegment}<div class="space-y-3 rounded-lg border border-primary/25 p-3"><p class="text-sm font-medium">{roadSegment.name} · {Math.round(roadSegment.length)} m</p>{#each (['start', 'end'] as const) as which}<label class="block text-xs"><span>{which === 'start' ? 'A · Start' : 'B · End'} · {Math.round(roadSegment[which])} m along road</span><input aria-label={`Road ${which}`} type="range" min={which === 'start' ? Math.max(0, roadSegment.end - MAX_ROAD_METERS) : roadSegment.start + MIN_ROAD_METERS} max={which === 'start' ? roadSegment.end - MIN_ROAD_METERS : Math.min(roadTotal, roadSegment.start + MAX_ROAD_METERS)} step="1" value={roadSegment[which]} {disabled} oninput={(event) => moveEnd(which, Number(event.currentTarget.value))} class="mt-1 min-h-11 w-full accent-primary" /></label>{/each}<div class="grid grid-cols-2 gap-2"><Button type="button" size="sm" variant="outline" {disabled} onclick={() => pickEnd = 'start'}>Tap to move A</Button><Button type="button" size="sm" variant="outline" {disabled} onclick={() => pickEnd = 'end'}>Tap to move B</Button></div>{#if pickEnd}<p role="status" class="text-xs text-primary">Tap the road to move {pickEnd === 'start' ? 'A' : 'B'}.</p>{/if}</div>{/if}
	{#if mode === 'point'}<div class="grid grid-cols-2 gap-3"><label class="space-y-1 text-xs" for="post-latitude"><span>Latitude</span><Input id="post-latitude" type="number" min="-90" max="90" step="any" bind:value={latitude} required {disabled} class="h-11" /></label><label class="space-y-1 text-xs" for="post-longitude"><span>Longitude</span><Input id="post-longitude" type="number" min="-180" max="180" step="any" bind:value={longitude} required {disabled} class="h-11" /></label></div>{/if}
	{#if mode === 'road' && !roadSegment}<p class="text-xs text-muted-foreground">Select a road before publishing, or switch to a point pin.</p>{/if}
	{#if message}<p role="status" class="text-xs text-muted-foreground">{message}</p>{/if}
</div>
<style>
	.pin-landing-shadow { position:absolute; z-index:650; pointer-events:none; width:30px; height:12px; transform:translate(-50%,-50%); border-radius:50%; background:#0005; box-shadow:0 0 0 2px var(--primary),0 2px 7px #0006; }
	:global(.road-dropper-idle) { animation: road-pin-hop 1.25s ease-in-out infinite; transform-origin: 50% 100%; }
	@keyframes road-pin-hop { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-7px); } }
	@media (prefers-reduced-motion: reduce) { :global(.road-dropper-idle) { animation: none; } }
	:global(.location-pin span) { display:block;height:24px;width:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--primary);border:3px solid var(--card);box-shadow:0 2px 5px #0005; }
	:global(.road-end span) { display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--primary);color:white;border:3px solid white;box-shadow:0 1px 4px #0005;font-weight:700; }
</style>
