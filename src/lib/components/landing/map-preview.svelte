<script lang="ts">
	import type { LayerGroup, Map as LeafletMap } from 'leaflet';
	import type { PublicMapHazard, PublicMapSnapshot } from '$lib/types/public-map';

	type Props = { snapshot: PublicMapSnapshot };
	let { snapshot: initialSnapshot }: Props = $props();
	let latestSnapshot = $state.raw<PublicMapSnapshot | null>(null);
	let snapshot = $derived(latestSnapshot ?? initialSnapshot);
	let container: HTMLDivElement;
	let map = $state<LeafletMap | null>(null);
	let leaflet: typeof import('leaflet') | undefined;
	let markerLayer: LayerGroup | undefined;
	let refreshing = $state(false);
	let refreshError = $state(false);
	let mapError = $state(false);
	let hasFittedReports = false;

	function statusLabel(status: string) {
		if (status === 'RESOLVED') return 'Resolved';
		if (['DISPATCHED', 'IN_REPAIR', 'AWAITING_REVIEW'].includes(status)) return 'In progress';
		return 'Reported';
	}

	function statusColor(status: string) {
		if (status === 'RESOLVED') return '#3d805c';
		if (['DISPATCHED', 'IN_REPAIR', 'AWAITING_REVIEW'].includes(status)) return '#547ea8';
		return '#df602f';
	}

	function popupFor(hazards: PublicMapHazard[]) {
		const content = document.createElement('div');
		content.className = 'landing-hazard-popup';
		if (hazards.length > 1) {
			const heading = document.createElement('strong');
			heading.className = 'landing-popup-heading';
			heading.textContent = `${hazards.length} nearby hazards`;
			content.append(heading);
		}

		for (const hazard of hazards.slice(0, 6)) {
			const link = document.createElement('a');
			link.className = 'landing-popup-item';
			link.href = `/map?report=${encodeURIComponent(hazard.id)}`;
			const title = document.createElement('strong');
			title.textContent = hazard.title;
			const meta = document.createElement('span');
			meta.textContent = `${statusLabel(hazard.status)} · Severity ${hazard.severity}/10`;
			const location = document.createElement('span');
			location.textContent = hazard.location;
			link.append(title, meta, location);
			content.append(link);
		}

		if (hazards.length > 6) {
			const more = document.createElement('span');
			more.className = 'landing-popup-more';
			more.textContent = `+${hazards.length - 6} more · open the full map`;
			content.append(more);
		}
		return content;
	}

	function drawMarkers(hazards: PublicMapHazard[]) {
		if (!map || !leaflet || !markerLayer) return;
		markerLayer.clearLayers();
		const clusters = new Map<string, PublicMapHazard[]>();
		for (const hazard of hazards) {
			const point = map.project([hazard.latitude, hazard.longitude], map.getZoom());
			const key = `${Math.round(point.x / 42)}:${Math.round(point.y / 42)}`;
			clusters.set(key, [...(clusters.get(key) || []), hazard]);
		}

		for (const group of clusters.values()) {
			const ordered = group.slice().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
			const latest = ordered[0];
			const count = group.length > 1 ? `<i>${group.length}</i>` : '';
			const icon = leaflet.divIcon({
				className: 'landing-map-icon',
				html: `<span class="landing-map-pin" style="--pin-color:${statusColor(latest.status)}"><span>${latest.severity}</span>${count}</span>`,
				iconSize: [34, 34],
				iconAnchor: [17, 17]
			});
			leaflet.marker([latest.latitude, latest.longitude], {
				icon,
				keyboard: true,
				title: group.length > 1 ? `${group.length} nearby hazards` : `${latest.title} · ${statusLabel(latest.status)}`
			}).bindPopup(popupFor(ordered), { maxWidth: 250 }).addTo(markerLayer);
		}

		if (!hasFittedReports) {
			hasFittedReports = true;
			if (hazards.length) {
				map.fitBounds(leaflet.latLngBounds(hazards.map((hazard) => [hazard.latitude, hazard.longitude])), {
					padding: [36, 36],
					maxZoom: 15
				});
			}
		}
	}

	$effect(() => {
		let cancelled = false;
		let instance: LeafletMap | undefined;
		let observer: ResizeObserver | undefined;
		void import('leaflet').then((L) => {
			if (cancelled) return;
			leaflet = L;
			instance = L.map(container, { zoomControl: false, scrollWheelZoom: false, preferCanvas: true })
				.setView([14.2813, 121.4173], 14);
			markerLayer = L.layerGroup().addTo(instance);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			}).addTo(instance);
			L.control.zoom({ position: 'bottomright' }).addTo(instance);
			map = instance;
			const redraw = () => drawMarkers(snapshot.hazards);
			instance.on('zoomend', redraw);
			observer = new ResizeObserver(() => instance?.invalidateSize({ pan: false }));
			observer.observe(container);
			window.requestAnimationFrame(() => instance?.invalidateSize({ pan: false }));
		}).catch(() => {
			mapError = true;
		});

		return () => {
			cancelled = true;
			observer?.disconnect();
			instance?.remove();
			markerLayer = undefined;
			leaflet = undefined;
			map = null;
		};
	});

	$effect(() => {
		const currentHazards = snapshot.hazards;
		if (map) drawMarkers(currentHazards);
	});

	$effect(() => {
		const timer = window.setInterval(() => {
			if (document.visibilityState === 'visible') void refresh();
		}, 30_000);
		const onFocus = () => void refresh();
		window.addEventListener('focus', onFocus);
		return () => {
			window.clearInterval(timer);
			window.removeEventListener('focus', onFocus);
		};
	});

	async function refresh() {
		if (refreshing) return;
		refreshing = true;
		try {
			const response = await fetch('/api/map/hazards', { cache: 'no-store' });
			if (!response.ok) throw new Error('Map refresh failed.');
			const next = await response.json() as PublicMapSnapshot;
			if (!Array.isArray(next.hazards) || typeof next.totalHazards !== 'number') throw new Error('Invalid map data.');
			latestSnapshot = next;
			refreshError = false;
		} catch {
			refreshError = true;
		} finally {
			refreshing = false;
		}
	}
</script>

<section class="map-window" aria-label="Live public hazard map">
	<header class="map-header">
		<div>
			<p class="live-label"><span class="live-dot"></span> LIVE MAP</p>
			<strong>{snapshot.totalHazards.toLocaleString()} {snapshot.totalHazards === 1 ? 'hazard' : 'hazards'} mapped</strong>
		</div>
		<span class="refresh-label" role="status">{refreshError ? 'Showing last update' : refreshing ? 'Checking for updates…' : snapshot.asOf ? 'Refreshes every 30 sec' : 'Connecting…'}</span>
	</header>
	<div class="map-scene">
		<div bind:this={container} class="map-canvas" role="region" aria-label="OpenStreetMap with current community hazard reports"></div>
		{#if mapError}
			<div class="map-message" role="status">Map unavailable. Try the full map.</div>
		{:else if snapshot.asOf && snapshot.totalHazards === 0}
			<div class="map-message" role="status"><strong>No reports yet</strong><span>New hazards will appear here.</span></div>
		{/if}
	</div>
	<div class="map-footer">
		<div class="status-legend" aria-label="Map status colors">
			<span><i class="legend-dot reported"></i>Reported</span>
			<span><i class="legend-dot in-progress"></i>In progress</span>
			<span><i class="legend-dot resolved"></i>Resolved</span>
		</div>
		<a href="/map">Open hazard map <span aria-hidden="true">↗</span></a>
	</div>
	{#if snapshot.totalHazards > snapshot.hazards.length}
		<p class="map-limit">Showing the latest {snapshot.hazards.length} hazards.</p>
	{/if}
</section>

<style>
	.map-window { overflow: hidden; border: 1px solid rgba(255,255,255,.95); border-radius: 25px; background: #fff; box-shadow: 0 22px 60px rgba(62,49,37,.10), 0 2px 9px rgba(62,49,37,.04); }
	.map-header { display: flex; min-height: 68px; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 18px; }
	.map-header > div { display: grid; gap: 5px; }
	.map-header strong { color: #302b26; font-size: 12px; font-weight: 650; letter-spacing: -.015em; }
	.live-label { display: flex; align-items: center; gap: 7px; margin: 0; color: #7d756c; font-size: 8px; font-weight: 750; letter-spacing: .14em; }
	.live-dot { width: 7px; height: 7px; border-radius: 50%; background: #3f9162; box-shadow: 0 0 0 3px rgba(63,145,98,.11); animation: pulse 2.2s ease-out infinite; }
	.refresh-label { color: #8a837a; font-size: 9px; white-space: nowrap; }
	.map-scene { position: relative; height: clamp(340px, 38vw, 500px); overflow: hidden; border-block: 1px solid rgba(55,45,36,.08); background: #eeece7; }
	.map-canvas { position: absolute; inset: 0; outline: none; }
	.map-footer { display: flex; min-height: 54px; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 17px; }
	.status-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 11px; }
	.status-legend > span { display: inline-flex; align-items: center; gap: 5px; color: #77716a; font-size: 9px; }
	.legend-dot { width: 7px; height: 7px; border-radius: 50%; }
	.legend-dot.reported { background: #df602f; }
	.legend-dot.in-progress { background: #547ea8; }
	.legend-dot.resolved { background: #3d805c; }
	.map-footer > a { display: inline-flex; align-items: center; gap: 8px; color: #cb562b; font-size: 10px; font-weight: 650; text-decoration: none; white-space: nowrap; }
	.map-footer > a:hover { color: #a53f1d; }
	.map-limit { margin: -1px 17px 12px; color: #8a837a; font-size: 9px; }
	.map-message { position: absolute; z-index: 500; top: 50%; left: 50%; display: grid; gap: 4px; width: max-content; max-width: calc(100% - 32px); padding: 13px 17px; border: 1px solid rgba(255,255,255,.9); border-radius: 14px; background: rgba(255,255,255,.9); color: #746c63; font-size: 10px; text-align: center; box-shadow: 0 6px 22px rgba(48,38,28,.12); transform: translate(-50%, -50%); pointer-events: none; }
	.map-message strong { color: #302b26; font-size: 12px; }
	:global(.landing-map-icon) { border: 0; background: transparent; }
	:global(.landing-map-pin) { position: relative; display: grid; width: 32px; height: 32px; place-items: center; border: 2px solid #fff; border-radius: 50% 50% 50% 9px; background: var(--pin-color); color: #fff; font: 700 10px/1 system-ui,sans-serif; box-shadow: 0 2px 7px #0004; transform: rotate(-45deg); }
	:global(.landing-map-pin > span) { transform: rotate(45deg); }
	:global(.landing-map-pin > i) { position: absolute; top: -5px; right: -8px; display: grid; min-width: 16px; height: 16px; place-items: center; padding-inline: 3px; border: 1px solid white; border-radius: 999px; background: #25211d; color: white; font: 700 8px/1 system-ui,sans-serif; font-style: normal; transform: rotate(45deg); }
	:global(.landing-hazard-popup) { display: grid; gap: 4px; min-width: 150px; }
	:global(.landing-popup-heading) { padding-bottom: 4px; color: #29241f; font-size: 12px; }
	:global(.landing-popup-item) { display: grid; gap: 3px; padding: 6px 0; color: #28231e; font-size: 11px; text-decoration: none; }
	:global(.landing-popup-item + .landing-popup-item), :global(.landing-popup-heading + .landing-popup-item) { border-top: 1px solid #eee8e2; }
	:global(.landing-popup-item:hover strong) { color: #c95025; }
	:global(.landing-popup-item > span) { color: #77716a; font-size: 9px; }
	:global(.landing-popup-more) { padding-top: 5px; border-top: 1px solid #eee8e2; color: #77716a; font-size: 9px; }
	:global(.leaflet-container) { font-family: inherit; }
	:global(.leaflet-control-zoom) { overflow: hidden; border: 1px solid rgba(49,42,35,.13) !important; border-radius: 9px !important; box-shadow: 0 2px 6px #0002 !important; }
	:global(.leaflet-control-zoom a) { border-color: rgba(49,42,35,.1) !important; background: rgba(255,255,255,.93) !important; color: #443c34 !important; }
	@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 3px rgba(63,145,98,.11); } 50% { box-shadow: 0 0 0 6px rgba(63,145,98,.04); } }
	@media (max-width: 600px) {
		.map-window { border-radius: 20px; }
		.map-header { min-height: 62px; padding-inline: 13px; }
		.refresh-label { font-size: 8px; }
		.map-scene { height: 350px; }
		.map-footer { align-items: flex-start; padding: 10px 13px; }
		.status-legend { gap: 7px; }
		.status-legend > span { gap: 4px; font-size: 8px; }
		.map-footer > a { font-size: 9px; }
	}
	@media (prefers-reduced-motion: reduce) { .live-dot { animation: none; } }
</style>
