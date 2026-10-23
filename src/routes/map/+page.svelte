<script lang="ts">
	import { untrack } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import type { Map as LeafletMap, LayerGroup, TileLayer } from 'leaflet';
	import type { MapHazard } from '$lib/types/hazards';
	const reportStatuses = ['REPORTED', 'IN_REPAIR', 'RESOLVED'];
	const reportStatusLabel = (value: string) => ['DISPATCHED', 'IN_REPAIR', 'AWAITING_REVIEW'].includes(value) ? 'In progress' : value === 'RESOLVED' ? 'Resolved' : 'Reported';
	import type { DispatchRoute } from '$lib/types/routing';
	import { SANTA_CRUZ_CORRIDORS } from '$lib/data/corridors';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import ListIcon from '@lucide/svelte/icons/list';
	import XIcon from '@lucide/svelte/icons/x';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import LocateFixedIcon from '@lucide/svelte/icons/locate-fixed';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ImageIcon from '@lucide/svelte/icons/image';
	import VideoIcon from '@lucide/svelte/icons/video';
	import InfoIcon from '@lucide/svelte/icons/info';
	import RouteIcon from '@lucide/svelte/icons/route';
	let { data }: PageProps = $props();
	let container: HTMLDivElement;
	let map = $state<LeafletMap | null>(null);
	let leaflet: typeof import('leaflet');
	let markers: LayerGroup;
	let referenceRoads: LayerGroup;
	let routeLayer: LayerGroup;
	let tiles: TileLayer | undefined;
	let dark = $state(false);
	let roads = $state(false);
	let panel = $state<'filters' | 'layers' | 'legend' | null>(null);
	let listOpen = $state(false);
	let selectedId = $state('');
	let detailsExpanded = $state(false);
	let sourcesExpanded = $state(false);
	let pinIds = $state<string[]>([]);
	let status = $state('');
	let distress = $state('');
	let highRisk = $state(false);
	let riderRisk = $state(false);
	let search = $state('');
	let sort = $state('priority');
	let refreshing = $state(false);
	let errorMessage = $state('');
	let routing = $state(false);
	let route = $state<DispatchRoute | null>(null);
	let handledQuery = '';
	const selected = $derived(data.hazards.find((hazard) => hazard.id === selectedId));
	const types = $derived([...new Set(data.hazards.map((hazard) => hazard.distressType))].sort());
	const filtered = $derived(data.hazards.filter((hazard) => (!status || (status === 'IN_REPAIR' ? ['IN_REPAIR', 'DISPATCHED', 'AWAITING_REVIEW'].includes(hazard.status) : hazard.status === status)) && (!distress || hazard.distressType === distress) && (!highRisk || hazard.severity >= 8) && (!riderRisk || ['HIGH', 'CRITICAL'].includes(hazard.vruLethality)) && `${hazard.title} ${hazard.location} ${hazard.distressType} ${hazard.id}`.toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => {
		if (sort === 'newest') return Date.parse(b.createdAt) - Date.parse(a.createdAt);
		if (sort === 'support') return b.support - a.support || b.severity - a.severity;
		if (sort === 'severity') return b.severity - a.severity || b.support - a.support;
		return b.priority - a.priority || Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
	}));
	const listed = $derived(pinIds.length ? filtered.filter((hazard) => pinIds.includes(hazard.id)) : filtered);
	const activeFilters = $derived(Number(!!status) + Number(!!distress) + Number(highRisk) + Number(riderRisk) + Number(!!search));
	const humanize = (value: string) => value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
	const tone = (severity: number) => severity >= 8 ? '#dc2626' : severity >= 4 ? '#d97706' : '#64748b';
	function openPanel(value: typeof panel) { panel = panel === value ? null : value; if (panel) { listOpen = false; selectedId = ''; } }
	function toggleList() { listOpen = !listOpen; panel = null; selectedId = ''; }
	function focus(hazard: MapHazard) {
		if (selectedId !== hazard.id) { route = null; routeLayer?.clearLayers(); }
		selectedId = hazard.id; detailsExpanded = false; sourcesExpanded = false; listOpen = false; panel = null;
		if (map) { map.setView([hazard.latitude, hazard.longitude], Math.max(16, map.getZoom()), { animate: false }); map.panBy(window.innerWidth < 768 ? [0, Math.min(120, map.getSize().y * .2)] : [Math.min(140, map.getSize().x * .2), 0], { animate: false }); }
	}
	function viewRoadSection() {
		if (!map || !selected?.roadSegment) return;
		const coordinates = selected.roadSegment.coordinates;
		selectedId = ''; panel = null; listOpen = false;
		map.fitBounds(coordinates, { padding: [60, 140], maxZoom: 18, animate: false });
	}
	function clearFilters() { status = ''; distress = ''; highRisk = false; riderRisk = false; search = ''; pinIds = []; }
	function fitReports() {
		if (!map || !leaflet) return;
		if (filtered.length) map.fitBounds(leaflet.latLngBounds(filtered.map((hazard) => [hazard.latitude, hazard.longitude])), { padding: [70, 110], maxZoom: 16, animate: false });
		else map.setView([14.2813, 121.4173], 14);
	}
	function renderMarkers(items: MapHazard[]) {
		if (!map || !leaflet || !markers) return;
		markers.clearLayers();
		const clusters = new Map<string, MapHazard[]>();
		for (const hazard of items) {
			if (hazard.roadSegment) {
				leaflet.polyline(hazard.roadSegment.coordinates, { color: tone(hazard.severity), weight: 7, opacity: .85 }).on('click', () => focus(hazard)).bindTooltip(`${hazard.roadSegment.name} · ${Math.round(hazard.roadSegment.length)} m`).addTo(markers);
				for (const point of [hazard.roadSegment.coordinates[0], hazard.roadSegment.coordinates[hazard.roadSegment.coordinates.length - 1]]) leaflet.circleMarker(point, { radius: 5, color: '#fff', weight: 2, fillColor: tone(hazard.severity), fillOpacity: 1 }).on('click', () => focus(hazard)).addTo(markers);
			}
			const point = map.latLngToLayerPoint([hazard.latitude, hazard.longitude]);
			const key = `${Math.round(point.x / 42)}:${Math.round(point.y / 42)}`;
			clusters.set(key, [...(clusters.get(key) || []), hazard]);
		}
		for (const group of clusters.values()) {
			const hazard = group.slice().sort((a, b) => b.severity - a.severity)[0];
			const icon = leaflet.divIcon({ className: 'hazard-pin-root', html: `<span class="hazard-pin" style="--pin-color:${tone(hazard.severity)}">${hazard.severity}${group.length > 1 ? `<span class="hazard-pin-count">${group.length}</span>` : ''}</span>`, iconSize: [32, 34], iconAnchor: [16, 32] });
			const marker = leaflet.marker([hazard.latitude, hazard.longitude], { icon, keyboard: true, title: group.length > 1 ? `${group.length} separate hazards at this location` : hazard.title });
			marker.on('add', () => marker.getElement()?.setAttribute('aria-label', group.length > 1 ? `${group.length} hazards at this location, highest severity ${hazard.severity}` : `${hazard.title}, severity ${hazard.severity}`));
			marker.on('click', () => {
				if (group.length === 1) focus(hazard);
				else { pinIds = group.map((item) => item.id); listOpen = true; panel = null; selectedId = ''; }
			});
			marker.addTo(markers);
		}
	}
	$effect(() => {
		let disposed = false;
		let instance: LeafletMap | undefined;
		let observer: ResizeObserver | undefined;
		void import('leaflet').then((L) => {
			if (disposed) return;
			leaflet = L;
			instance = L.map(container, { zoomControl: false, preferCanvas: true }).setView([14.2813, 121.4173], 14);
			markers = L.layerGroup().addTo(instance); referenceRoads = L.layerGroup().addTo(instance); routeLayer = L.layerGroup().addTo(instance);
			L.control.zoom({ position: 'bottomright' }).addTo(instance);
			instance.on('zoomend moveend', () => renderMarkers(filtered));
			observer = new ResizeObserver(() => { instance?.invalidateSize({ pan: false }); }); observer.observe(container);
			map = instance;
			untrack(fitReports);
		}).catch(() => errorMessage = 'The map could not load. You can still browse the report list.');
		return () => { disposed = true; observer?.disconnect(); instance?.remove(); map = null; };
	});
	$effect(() => {
		dark = document.documentElement.classList.contains('dark');
		const observer = new MutationObserver(() => dark = document.documentElement.classList.contains('dark'));
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	});
	$effect(() => {
		if (!map || !leaflet) return;
		tiles?.remove();
		const url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
		tiles = leaflet.tileLayer(url, { maxZoom: 19, className: 'road-tiles', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
	});
	$effect(() => { if (map) renderMarkers(filtered); });
	$effect(() => {
		if (!map || !leaflet || !referenceRoads) return;
		referenceRoads.clearLayers();
		if (roads) for (const road of SANTA_CRUZ_CORRIDORS) leaflet.polyline(road.coordinates, { color: dark ? '#a8a29e' : '#78716c', weight: 3, opacity: .7, dashArray: '5 5' }).bindTooltip(road.name).addTo(referenceRoads);
	});
	$effect(() => {
		const key = page.url.searchParams.get('report');
		if (!map || !key || key === handledQuery) return;
		const clean = key.replace(/^TKT-/i, '').toLowerCase();
		const hazard = data.hazards.find((item) => item.id === key || item.id.replaceAll('-', '').startsWith(clean.replaceAll('-', '')));
		if (hazard) { handledQuery = key; untrack(() => focus(hazard)); }
	});
	$effect(() => {
		const interval = setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 30000);
		const onFocus = () => { void refresh(); }; window.addEventListener('focus', onFocus);
		return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
	});
	async function refresh() {
		if (refreshing) return;
		refreshing = true;
		try { await invalidateAll(); errorMessage = ''; }
		catch { errorMessage = 'Updates could not be loaded. Showing the last loaded reports.'; }
		finally { refreshing = false; }
	}
	async function directions(hazard: MapHazard) {
		if (routing || !map || !leaflet) return;
		routing = true; detailsExpanded = true; errorMessage = '';
		try {
			const response = await fetch(`/api/route?destLat=${hazard.latitude}&destLng=${hazard.longitude}&name=${encodeURIComponent(hazard.title)}`);
			const result = await response.json(); if (!response.ok || !result.route) throw new Error('Routing unavailable.');
			route = result.route;
			routeLayer.clearLayers();
			const line = leaflet.polyline(route!.coordinates, { color: '#ea580c', weight: 4, dashArray: route!.estimated ? '6 6' : undefined }).addTo(routeLayer);
			map.fitBounds(line.getBounds(), { padding: [60, 100] });
		} catch { errorMessage = 'Directions are unavailable. The hazard pin is still visible.'; }
		finally { routing = false; }
	}
</script>
<svelte:head><title>Road hazards — SuriOS</title></svelte:head>
<div class="relative isolate h-full w-full overflow-hidden bg-muted" class:dark-streets={dark}>
	<div bind:this={container} class="absolute inset-0 z-0" aria-label="Road hazard map"></div>
	<h1 class="sr-only">Road hazards</h1>
	<!-- Compact controls float over the full map. -->
	<div class="pointer-events-none absolute inset-x-3 top-3 z-20 space-y-2">
		<div class="flex flex-wrap items-center gap-2"><span class="map-chip pointer-events-auto gap-2 font-semibold"><MapPinIcon class="size-4 text-primary" /><span class="hidden sm:inline">Road hazards</span><span class="sm:hidden">Hazards</span><span class="text-xs font-normal text-muted-foreground">{data.hazards.length}</span></span><button class="map-chip pointer-events-auto gap-2 {listOpen ? 'text-primary' : ''}" aria-label={listOpen ? 'Hide report list' : 'Show report list'} aria-expanded={listOpen} onclick={toggleList}><ListIcon class="size-4" />Reports<span class="text-xs text-muted-foreground">{filtered.length}</span><ChevronDownIcon class="size-3" /></button><button class="map-chip pointer-events-auto px-3" aria-label="Refresh reports" title="Refresh reports" disabled={refreshing} onclick={refresh}><RefreshCwIcon class="size-4 {refreshing ? 'animate-spin motion-reduce:animate-none' : ''}" /></button></div>
		<div class="flex flex-wrap gap-2"><button class="map-chip pointer-events-auto gap-1.5 {panel === 'filters' || activeFilters ? 'text-primary' : ''}" aria-expanded={panel === 'filters'} onclick={() => openPanel('filters')}><SlidersHorizontalIcon class="size-3.5" />Filters{#if activeFilters}<span class="rounded-full bg-primary/10 px-1.5 text-xs">{activeFilters}</span>{/if}</button><button class="map-chip pointer-events-auto gap-1.5 {panel === 'layers' ? 'text-primary' : ''}" aria-expanded={panel === 'layers'} onclick={() => openPanel('layers')}><LayersIcon class="size-3.5" />Layers</button><button class="map-chip pointer-events-auto px-3" aria-label="Fit all visible hazards" title="Fit visible hazards" onclick={fitReports}><LocateFixedIcon class="size-4" /></button>{#if activeFilters}<span class="pointer-events-auto hidden sm:block"><button class="map-chip gap-1 text-xs" onclick={clearFilters}>Clear filters<XIcon class="size-3" /></button></span>{/if}</div>
	</div>
	{#if panel}
		<section class="map-panel absolute left-3 top-[7.25rem] z-30 max-h-[calc(100%-12rem)] w-72 max-w-[calc(100%-1.5rem)] overflow-y-auto p-4" aria-label={panel === 'filters' ? 'Map filters' : panel === 'layers' ? 'Map layers' : 'Map legend'}>
			<div class="mb-3 flex items-center justify-between"><h2 class="text-sm font-semibold">{panel === 'filters' ? 'Filter & sort' : panel === 'layers' ? 'Map layers' : 'Reading the map'}</h2><button class="icon-button" aria-label="Close map controls" onclick={() => panel = null}><XIcon class="size-4" /></button></div>
			{#if panel === 'filters'}<div class="space-y-3"><label class="block space-y-1 text-xs"><span>Search reports</span><div class="relative"><SearchIcon class="absolute left-3 top-3.5 size-3.5 text-muted-foreground" /><Input bind:value={search} placeholder="Road, hazard, or ticket…" aria-label="Search map reports" class="h-11 pl-9" /></div></label><label class="block space-y-1 text-xs"><span>Status</span><select class="map-select" aria-label="Hazard status" bind:value={status}><option value="">All statuses</option>{#each reportStatuses as option}<option value={option}>{reportStatusLabel(option)}</option>{/each}</select></label><label class="block space-y-1 text-xs"><span>Damage type</span><select class="map-select" aria-label="Damage type" bind:value={distress}><option value="">All types</option>{#each types as type}<option value={type}>{humanize(type)}</option>{/each}</select></label><label class="block space-y-1 text-xs"><span>Sort reports</span><select class="map-select" aria-label="Sort reports" bind:value={sort}><option value="priority">Priority first</option><option value="severity">Highest severity</option><option value="newest">Newest first</option><option value="support">Most community support</option></select></label><label class="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" bind:checked={highRisk} class="size-4 accent-primary" />Critical severity (8–10)</label><label class="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" bind:checked={riderRisk} class="size-4 accent-primary" />High rider risk</label><div class="flex items-center justify-between gap-2"><p class="text-xs text-muted-foreground">{filtered.length} of {data.hazards.length} match.</p><button class="min-h-10 text-xs font-medium text-primary" onclick={clearFilters}>Reset filters</button></div><Button class="h-11 w-full" onclick={() => { panel = null; listOpen = true; }}>Show matching reports</Button></div>
			{:else if panel === 'layers'}<div class="space-y-3"><p class="text-sm font-medium">Street map</p><p class="text-xs leading-5 text-muted-foreground">OpenStreetMap · No API key required.</p><label class="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" bind:checked={roads} class="size-4 accent-primary" />Reference roads</label><p class="text-xs leading-5 text-muted-foreground">Reference lines show named road corridors. They do not indicate measured pavement condition.</p></div>
			{:else}<div class="space-y-3 text-xs leading-5"><p>Pin numbers show estimated severity, from 1 to 10.</p><div class="flex items-center gap-2"><span class="legend-dot bg-slate-500"></span>1–3 · Low</div><div class="flex items-center gap-2"><span class="legend-dot bg-amber-600"></span>4–7 · Moderate</div><div class="flex items-center gap-2"><span class="legend-dot bg-red-600"></span>8–10 · Critical</div><p>Solid colored lines mark reported road sections. The two end circles show their extent; dashed reference roads provide context only.</p><p>A small corner count means multiple separate hazards overlap on screen. It does not mean they were merged.</p><p>AI estimates severity and rider risk. Matching evidence within 25 metres or on overlapping sections of the same mapped road can join one hazard. Community support increases priority, not damage severity.</p><p>On-site inspection is needed to verify dimensions and repairs.</p></div>{/if}
		</section>
	{/if}
	{#if listOpen}
		<aside class="map-panel absolute bottom-4 right-3 top-[7.25rem] z-20 flex w-[340px] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden" aria-label="Hazard report list"><div class="flex shrink-0 items-center justify-between border-b border-border px-4 py-2"><h2 class="text-sm font-semibold">{pinIds.length ? 'At this pin' : 'Reports'}<span class="ml-2 text-xs font-normal text-muted-foreground">{listed.length}</span></h2><div class="flex items-center">{#if pinIds.length}<button class="icon-button" aria-label="Show all reports" onclick={() => pinIds = []}><ListIcon class="size-4" /></button>{/if}<button class="icon-button" aria-label="Close report list" onclick={() => listOpen = false}><XIcon class="size-4" /></button></div></div><div class="min-h-0 flex-1 overflow-y-auto p-2">
			{#each listed as hazard (hazard.id)}<button class="group mb-1 flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary" onclick={() => focus(hazard)} aria-label="Open hazard: {hazard.title}"><span class="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">{#if hazard.mediaKind === 'video'}<VideoIcon class="size-4" />{:else}<ImageIcon class="absolute size-4" /><img src={hazard.imageUrl} alt="" loading="lazy" class="absolute size-full object-cover" onerror={(event) => (event.currentTarget as HTMLImageElement).hidden = true} />{/if}</span><span class="min-w-0 flex-1"><span class="flex items-start justify-between gap-2"><span class="line-clamp-2 break-words text-sm font-semibold leading-5">{hazard.title}</span><span class="shrink-0 text-xs font-semibold" style:color={tone(hazard.severity)}>{hazard.severity}/10</span></span><span class="mt-1 block truncate text-xs text-muted-foreground">{hazard.location}</span><span class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground"><span>{reportStatusLabel(hazard.status)}</span><span>· {hazard.support} support</span><span>· {hazard.observations} evidence</span></span></span></button>{:else}<div class="p-5 text-center"><p class="text-sm font-medium">No matching hazards</p><p class="mt-2 text-xs text-muted-foreground">Adjust the map filters or share a road update.</p><Button variant="outline" class="mt-3" onclick={clearFilters}>Clear filters</Button></div>{/each}
		</div><div class="border-t border-border px-4 py-2 text-[10px] text-muted-foreground">Refreshes every 30 seconds · {sort === 'priority' ? 'Sorted by priority' : sort === 'severity' ? 'Sorted by severity' : sort === 'newest' ? 'Newest first' : 'Most supported first'}</div></aside>
	{/if}
	{#if selected}
		<section class="map-panel absolute bottom-4 right-3 z-30 flex w-[360px] {detailsExpanded || sourcesExpanded ? 'top-[7.25rem]' : 'max-h-[calc(100%-8rem)]'} max-w-[calc(100%-1.5rem)] flex-col overflow-hidden" aria-label="Hazard details"><div class="flex shrink-0 items-start justify-between gap-2 border-b border-border p-4"><div class="min-w-0"><p class="text-[10px] uppercase tracking-wide text-muted-foreground">Road hazard · {selected.id.slice(0, 8)}</p><h2 class="mt-1 break-words text-sm font-semibold">{selected.title}</h2><p class="mt-1 text-xs leading-5 text-muted-foreground">{selected.location}</p></div><button class="icon-button -mr-2 -mt-2 shrink-0" aria-label="Close hazard details" onclick={() => selectedId = ''}><XIcon class="size-4" /></button></div><div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-xs">
			{#if selected.roadSegment}<Button variant="outline" class="min-h-11 w-full text-xs" onclick={viewRoadSection}><RouteIcon class="size-4" />View {Math.round(selected.roadSegment.length)} m road section</Button>{/if}
			<div class="grid grid-cols-3 gap-2 rounded-xl bg-muted/60 p-3"><div><p class="text-muted-foreground">Severity</p><p class="mt-1 text-base font-semibold" style:color={tone(selected.severity)}>{selected.severity}<span class="text-xs font-normal">/10</span></p></div><div><p class="text-muted-foreground">Support</p><p class="mt-1 text-base font-semibold">{selected.support}</p></div><div><p class="text-muted-foreground">Priority</p><p class="mt-1 text-base font-semibold">{selected.priority.toFixed(2).replace(/0$/, '')}</p></div></div>
			<div class="flex flex-wrap gap-1.5"><span class="rounded-full bg-secondary px-2 py-1">{reportStatusLabel(selected.status)}</span><span class="rounded-full bg-primary/10 px-2 py-1 text-primary">{humanize(selected.distressType)}</span><span class="rounded-full bg-secondary px-2 py-1">{humanize(selected.vruLethality.toLowerCase())} rider risk</span></div>
			<div class="rounded-xl border border-border p-3"><p class="leading-5 text-muted-foreground">AI severity is an estimate. Stronger linked evidence can update it; Likes and reposts cannot. Open the source posts to inspect the evidence.</p>
			{#if selected.posts.length}<button class="flex min-h-11 w-full items-center justify-between text-left font-semibold text-primary" aria-expanded={sourcesExpanded} aria-controls="hazard-source-posts" onclick={() => sourcesExpanded = !sourcesExpanded}>View {selected.posts.length} source {selected.posts.length === 1 ? 'post' : 'posts'}<ChevronDownIcon class="size-3.5" /></button>
			{#if sourcesExpanded}<div id="hazard-source-posts" class="space-y-2"><h3 class="font-semibold">Source posts</h3><p class="mt-1 text-muted-foreground">{selected.observations} saved observations · Updated {new Date(selected.updatedAt).toLocaleString()}</p>{#each selected.posts as post}<a href="/community?q={post.id}#post-{post.id}" class="mt-2 block rounded-lg border border-border p-3 hover:bg-secondary"><span class="block font-medium">{post.title}</span><span class="mt-1 block text-muted-foreground">{post.author} · {new Date(post.createdAt).toLocaleDateString()}</span>{#if post.match}<span class="mt-2 block leading-5 text-muted-foreground">{post.match.reason}</span>{/if}</a>{:else}<p class="mt-2 leading-5 text-muted-foreground">Submitted through field capture. No community post is linked to this report.</p>{/each}</div>{/if}
			{:else}<p class="mt-2 leading-5 text-muted-foreground">Field capture · No community post is linked to this report.</p>{/if}</div>
			<button class="flex min-h-10 w-full items-center justify-between text-xs font-medium text-primary" aria-expanded={detailsExpanded} onclick={() => detailsExpanded = !detailsExpanded}>{detailsExpanded ? 'Less detail' : 'More details'}<ChevronDownIcon class="size-3.5" /></button>
			{#if detailsExpanded}<p class="leading-6">{selected.analysis.summary}</p><p class="leading-5 text-muted-foreground">{selected.analysis.vruDetails}</p>
			<details><summary class="cursor-pointer py-2 font-medium">Suggested repair</summary><p class="mt-1 leading-5 text-muted-foreground">{selected.analysis.recommendedAction}</p><ul class="mt-2 list-inside list-disc space-y-1 text-muted-foreground">{#each selected.analysis.materialsChecklist as material}<li>{material}</li>{/each}</ul></details>
			<details><summary class="cursor-pointer py-2 font-medium">Why this priority?</summary><p class="leading-5 text-muted-foreground">Severity comes from the highest assessed evidence, with consistent risk bands. Unique community support adds 0.25 priority points per additional supporter, up to 2 points; priority is capped at 10. Reposting does not add damage severity.</p></details>

			<p class="leading-5 text-muted-foreground">AI estimates require on-site inspection. Repaired reports stay separate from new defects reported later.</p>
			{#if route}<div class="rounded-lg bg-primary/5 p-3"><p class="font-medium">{route.estimated ? 'Approximate direct connection' : 'Directions from municipal depot'}</p><p class="mt-1 text-muted-foreground">{route.distanceFormatted}{route.estimated ? ' · Road routing unavailable' : ` · ${route.durationFormatted}`}</p><button class="mt-2 min-h-10 font-medium text-primary" onclick={() => { route = null; routeLayer?.clearLayers(); }}>Clear directions</button></div>{/if}{/if}
		</div><div class="grid shrink-0 grid-cols-2 gap-2 border-t border-border p-3"><Button variant="outline" class="h-11 text-xs" disabled={routing} onclick={() => directions(selected!)}><RouteIcon class="size-3.5" />{routing ? 'Loading…' : 'Directions'}</Button><Button href="/community" class="h-11 text-xs">Share an update</Button></div></section>
	{/if}
	{#if !data.hazards.length}<div class="map-panel absolute left-1/2 top-1/2 z-10 w-64 -translate-x-1/2 -translate-y-1/2 p-5 text-center"><MapPinIcon class="mx-auto size-6 text-primary" /><h2 class="mt-2 text-sm font-semibold">No hazards reported yet</h2><p class="mt-2 text-xs leading-5 text-muted-foreground">Published road updates appear here at their pinned locations.</p><Button href="/community" size="sm" class="mt-3">Open the feed</Button></div>{/if}
	{#if errorMessage}<p role="alert" class="map-panel absolute bottom-16 left-3 z-30 max-w-[calc(100%-5rem)] px-3 py-2 text-xs">{errorMessage}</p>{/if}
	<button class="map-chip absolute bottom-5 left-3 z-10 gap-1.5" aria-expanded={panel === 'legend'} onclick={() => openPanel('legend')}><InfoIcon class="size-3.5" />Legend<ChevronDownIcon class="size-3" /></button>
</div>
<style>
	.map-chip { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; padding: 0 12px; border: 1px solid var(--border); border-radius: 9999px; background: var(--card); font-size: 12px; box-shadow: 0 1px 4px #0001; }
	.map-panel { border: 1px solid var(--border); border-radius: 14px; background: var(--card); box-shadow: 0 4px 18px #0001; }
	.icon-button { display: inline-flex; width: 40px; height: 40px; align-items: center; justify-content: center; border-radius: 8px; }
	.icon-button:hover { background: var(--secondary); }
	.map-select { min-height: 44px; width: 100%; border-radius: 8px; border: 1px solid var(--input); background: var(--background); padding: 0 10px; font-size: 13px; }
	.legend-dot { width: 10px; height: 10px; border-radius: 50%; }
	:global(.hazard-pin-root) { background: transparent; border: none; }
	:global(.hazard-pin) { position: relative; display: flex; width: 30px; height: 30px; align-items: center; justify-content: center; border: 2px solid white; border-radius: 9px 9px 9px 2px; background: var(--pin-color); color: white; font: 600 12px system-ui; box-shadow: 0 2px 5px #0003; }
	:global(.hazard-pin-count) { position: absolute; top: -7px; right: -7px; display: flex; min-width: 17px; height: 17px; align-items: center; justify-content: center; padding: 0 3px; border-radius: 9999px; border: 1px solid var(--card); background: var(--foreground); color: var(--background); font-size: 9px; }
	.dark-streets :global(.road-tiles) { filter: invert(.92) hue-rotate(180deg) brightness(.8) saturate(.6); }
	:global(.leaflet-control-zoom) { border: 1px solid var(--border) !important; overflow: hidden; border-radius: 10px !important; box-shadow: 0 2px 5px #0001 !important; }
	:global(.leaflet-control-zoom a) { background: var(--card) !important; color: var(--foreground) !important; border-color: var(--border) !important; }
	:global(.leaflet-container) { font-family: inherit; }
</style>
