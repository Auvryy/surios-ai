<script lang="ts">
	import type { Map as LeafletMap, Marker } from 'leaflet';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import NavigationIcon from '@lucide/svelte/icons/navigation';
	let { latitude = $bindable(14.2813), longitude = $bindable(121.4173), disabled = false }: { latitude?: number; longitude?: number; disabled?: boolean } = $props();
	let container: HTMLDivElement;
	let map = $state<LeafletMap | null>(null);
	let marker: Marker | undefined;
	let locating = $state(false);
	let message = $state('');
	$effect(() => {
		let disposed = false;
		let instance: LeafletMap | undefined;
		let observer: ResizeObserver | undefined;
		void import('leaflet').then((L) => {
			if (disposed) return;
			instance = L.map(container, { scrollWheelZoom: false, zoomControl: true }).setView([14.2813, 121.4173], 15);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19 }).addTo(instance);
			marker = L.marker([14.2813, 121.4173], { draggable: true, icon: L.divIcon({ className: 'location-pin', html: '<span aria-hidden="true"></span>', iconSize: [24, 24], iconAnchor: [12, 24] }) }).addTo(instance);
			instance.on('click', (event) => { if (disabled) return; latitude = Number(event.latlng.lat.toFixed(6)); longitude = Number(event.latlng.lng.toFixed(6)); });
			marker.on('dragend', () => { if (disabled) return; const position = marker!.getLatLng(); latitude = Number(position.lat.toFixed(6)); longitude = Number(position.lng.toFixed(6)); });
			observer = new ResizeObserver(() => instance?.invalidateSize()); observer.observe(container);
			map = instance;
		}).catch(() => message = 'Map unavailable. Enter the coordinates below.');
		return () => { disposed = true; observer?.disconnect(); instance?.remove(); map = null; };
	});
	$effect(() => {
		if (!map || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;
		marker?.setLatLng([latitude, longitude]);
		map.panTo([latitude, longitude]);
		if (disabled) { map.dragging.disable(); marker?.dragging?.disable(); }
		else { map.dragging.enable(); marker?.dragging?.enable(); }
	});
	function locate() {
		if (!navigator.geolocation) { message = 'Location is unavailable. Tap the map or enter coordinates.'; return; }
		locating = true; message = '';
		navigator.geolocation.getCurrentPosition((position) => { latitude = position.coords.latitude; longitude = position.coords.longitude; locating = false; }, () => { locating = false; message = 'Location permission was unavailable. Tap the map or enter coordinates.'; }, { enableHighAccuracy: true, timeout: 10000 });
	}
</script>
<div class="space-y-3">
	<div class="flex items-center justify-between gap-2"><p class="text-xs text-muted-foreground">Tap the map or drag the pin to the hazard.</p><Button type="button" size="sm" variant="outline" class="h-10 shrink-0 text-xs" onclick={locate} disabled={disabled || locating}><NavigationIcon class="size-3.5" />{locating ? 'Locating…' : 'Use my location'}</Button></div>
	<div bind:this={container} class="relative z-0 h-48 w-full overflow-hidden rounded-lg border border-border" aria-label="Hazard location picker"></div>
	<div class="grid grid-cols-2 gap-3"><label class="space-y-1 text-xs" for="post-latitude"><span>Latitude</span><Input id="post-latitude" type="number" min="-90" max="90" step="any" bind:value={latitude} required {disabled} class="h-11" /></label><label class="space-y-1 text-xs" for="post-longitude"><span>Longitude</span><Input id="post-longitude" type="number" min="-180" max="180" step="any" bind:value={longitude} required {disabled} class="h-11" /></label></div>
	{#if message}<p role="status" class="text-xs text-muted-foreground">{message}</p>{/if}
</div>
<style>
	:global(.location-pin span) { display: block; height: 24px; width: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: var(--primary); border: 3px solid var(--card); box-shadow: 0 2px 5px #0005; }
</style>
