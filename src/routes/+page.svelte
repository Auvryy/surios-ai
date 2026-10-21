<script lang="ts">
	import type { PageProps } from './$types.js';
	import type { FeedIncident } from './+page.server.js';

	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import BikeIcon from '@lucide/svelte/icons/bike';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import CameraIcon from '@lucide/svelte/icons/camera';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import RouteIcon from '@lucide/svelte/icons/route';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import XIcon from '@lucide/svelte/icons/x';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import ClockIcon from '@lucide/svelte/icons/clock';

	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetDescription,
		SheetFooter
	} from '$lib/components/ui/sheet/index.js';

	interface RoadCorridor {
		id: string;
		name: string;
		classification: string;
		coordinates: [number, number][];
		pci: number;
		status: 'CRITICAL' | 'MODERATE' | 'GOOD';
		color: string;
		weight: number;
		dashArray?: string;
		distressCount: number;
		surfaceType: string;
		vruNote: string;
		lengthKm: string;
	}

	const SANTA_CRUZ_CORRIDORS: RoadCorridor[] = [
		{
			id: 'CORR-01',
			name: 'Manila East Rd / National Highway',
			classification: 'Primary National Arterial',
			coordinates: [
				[14.2842, 121.4172],
				[14.2835, 121.4188],
				[14.2828, 121.4205],
				[14.2815, 121.4230],
				[14.2800, 121.4260],
				[14.2785, 121.4290],
				[14.2768, 121.4330],
				[14.2750, 121.4380],
				[14.2735, 121.4430]
			],
			pci: 38,
			status: 'CRITICAL',
			color: '#ef4444',
			weight: 5,
			distressCount: 2,
			surfaceType: 'Asphalt Concrete over Jointed PCCP',
			vruNote: 'High risk of rim strike & loss-of-control for tricycles/motorcycles during monsoon pooling.',
			lengthKm: '3.4 km'
		},
		{
			id: 'CORR-02',
			name: 'Pedro Guevara Avenue (Poblacion)',
			classification: 'Downtown Commercial Corridor',
			coordinates: [
				[14.2842, 121.4172],
				[14.2830, 121.4182],
				[14.2815, 121.4190],
				[14.2790, 121.4198],
				[14.2760, 121.4202],
				[14.2730, 121.4205]
			],
			pci: 62,
			status: 'MODERATE',
			color: '#f59e0b',
			weight: 5,
			distressCount: 1,
			surfaceType: 'Dense Bituminous Surface Course',
			vruNote: 'Transverse cracking across pedestrian crossings and passenger drop-off zones.',
			lengthKm: '1.2 km'
		},
		{
			id: 'CORR-03',
			name: 'Quezon Ave – Bubukal Student Corridor',
			classification: 'University Access / High-VRU Belt',
			coordinates: [
				[14.2838, 121.4165],
				[14.2818, 121.4148],
				[14.2790, 121.4125],
				[14.2750, 121.4090],
				[14.2715, 121.4050],
				[14.2690, 121.4021]
			],
			pci: 48,
			status: 'CRITICAL',
			color: '#e11d48',
			weight: 5,
			dashArray: '8, 6',
			distressCount: 2,
			surfaceType: 'Subgraded Asphalt with Unpaved Shoulders',
			vruNote: 'Unprotected shoulder erosion creating sudden 75mm grade step-offs for student scooters.',
			lengthKm: '2.1 km'
		},
		{
			id: 'CORR-04',
			name: 'Gatid – Bagumbayan Bypass Road',
			classification: 'Municipal Bypass Arterial',
			coordinates: [
				[14.2930, 121.4280],
				[14.2915, 121.4250],
				[14.2890, 121.4225],
				[14.2865, 121.4190],
				[14.2845, 121.4170]
			],
			pci: 84,
			status: 'GOOD',
			color: '#10b981',
			weight: 4,
			distressCount: 0,
			surfaceType: 'Reinforced Concrete Pavement (Rigid)',
			vruNote: 'Uniform grade with minimal longitudinal cracking; safe multi-modal throughput.',
			lengthKm: '2.6 km'
		},
		{
			id: 'CORR-05',
			name: 'Aguinaldo St / Public Market Feeder',
			classification: 'Commercial Feeder / High Axle Load',
			coordinates: [
				[14.2820, 121.4170],
				[14.2790, 121.4162],
				[14.2760, 121.4155],
				[14.2730, 121.4150],
				[14.2710, 121.4145]
			],
			pci: 42,
			status: 'CRITICAL',
			color: '#ef4444',
			weight: 5,
			distressCount: 1,
			surfaceType: 'Asphalt Wearing Course with Base Failure',
			vruNote: 'Deep pothole clusters obscured by market wash runoff; extreme rollover hazard.',
			lengthKm: '1.1 km'
		}
	];

	let { data }: PageProps = $props();

	let filter = $state<'ALL' | 'CRITICAL' | 'REPORTED' | 'DISPATCHED' | 'RESOLVED'>('ALL');
	let selectedIncident = $state<FeedIncident | null>(null);
	let selectedCorridor = $state<RoadCorridor | null>(null);
	let showCorridors = $state(true);
	let isSheetOpen = $state(false);
	let mapContainer = $state<HTMLDivElement | null>(null);

	// Leaflet instance pointers for dynamic updates
	let mapInstance: any = null;
	let leafletLib: any = null;
	let tileLayerInstance: any = null;
	let markersGroup: any = null;
	let corridorsGroup: any = null;
	let markerMap = new Map<string, any>();

	const incidents = $derived(data.incidents || []);

	const filteredIncidents = $derived(
		filter === 'ALL'
			? incidents
			: filter === 'CRITICAL'
				? incidents.filter((i) => i.riskLevel === 'CRITICAL' || i.vruLethality === 'CRITICAL')
				: incidents.filter((i) => i.status === filter)
	);

	function openInspect(incident: FeedIncident, e?: Event) {
		if (e) e.stopPropagation();
		selectedIncident = incident;
		isSheetOpen = true;
	}

	function selectIncidentFromFeed(item: FeedIncident) {
		selectedIncident = item;
		selectedCorridor = null;
		if (mapInstance) {
			mapInstance.flyTo([item.latitude, item.longitude], 16, { duration: 0.75 });
		}
		const marker = markerMap.get(item.id);
		if (marker) {
			marker.openPopup();
		}
	}

	function selectCorridor(corridor: RoadCorridor) {
		selectedCorridor = corridor;
		selectedIncident = null;
		if (mapInstance && leafletLib && corridor.coordinates.length > 0) {
			const bounds = leafletLib.latLngBounds(corridor.coordinates);
			mapInstance.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, duration: 0.75 });
		}
	}

	function resetMapView() {
		if (mapInstance) {
			mapInstance.flyTo([14.2813, 121.4173], 14, { duration: 0.75 });
			mapInstance.closePopup();
		}
		selectedIncident = null;
		selectedCorridor = null;
	}

	function renderMarkers(items: FeedIncident[]) {
		if (!mapInstance || !leafletLib || !markersGroup) return;
		markersGroup.clearLayers();
		markerMap.clear();

		items.forEach((item) => {
			const isCritical = item.hazardSeverity >= 8;
			const isModerate = item.hazardSeverity >= 5 && item.hazardSeverity < 8;
			const severityColor = isCritical ? '#ef4444' : isModerate ? '#f59e0b' : '#64748b';

			let badgeClass = 'badge-low';
			let ringsHtml = '';

			if (isCritical) {
				badgeClass = 'badge-critical';
				ringsHtml = `
					<span class="surios-pulse-ring ring-1"></span>
					<span class="surios-pulse-ring ring-2"></span>
				`;
			} else if (isModerate) {
				badgeClass = 'badge-moderate';
				ringsHtml = `<span class="surios-pulse-ring ring-moderate"></span>`;
			}

			const isSelected = selectedIncident?.id === item.id;
			const customIcon = leafletLib.divIcon({
				className: 'surios-dot-bomb-container',
				html: `
					<div class="surios-dot-bomb-wrapper ${isSelected ? 'is-selected' : ''}" data-id="${item.id}" title="${item.title}">
						${ringsHtml}
						<div class="surios-badge ${badgeClass}">
							<span>${item.hazardSeverity}</span>
						</div>
					</div>
				`,
				iconSize: [36, 36],
				iconAnchor: [18, 18]
			});

			const marker = leafletLib.marker([item.latitude, item.longitude], { icon: customIcon });

			// High-fidelity Floating Defect Inspection Card (Matching Mockup Choice 1)
			const popupHtml = `
				<div class="surios-card-popup">
					${item.imageUrl ? `
						<div class="surios-card-img-wrap">
							<img src="${item.imageUrl}" alt="${item.title}" class="surios-card-img" />
							<div class="surios-card-badge" style="background-color: ${severityColor}">
								Severity: ${item.hazardSeverity}/10
							</div>
						</div>
					` : `
						<div class="surios-card-header-bar">
							<span class="surios-card-code">${item.id}</span>
							<span class="surios-card-badge" style="background-color: ${severityColor}">
								Severity: ${item.hazardSeverity}/10
							</span>
						</div>
					`}
					<div class="surios-card-content">
						<h4 class="surios-card-title">${item.title}</h4>
						<div class="surios-card-astm">${item.astmCode}</div>
						<div class="surios-card-gps">GPS: +${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}</div>
						<div class="surios-card-actions">
							<button class="surios-card-inspect-btn surios-inspect-btn" data-id="${item.id}">
								Inspect Specs &rarr;
							</button>
						</div>
					</div>
				</div>
			`;

			marker.bindPopup(popupHtml, {
				className: 'surios-custom-popup',
				maxWidth: 260,
				offset: [0, -16],
				closeButton: false
			});

			marker.on('click', () => {
				selectedIncident = item;
				selectedCorridor = null;
			});

			marker.addTo(markersGroup);
			markerMap.set(item.id, marker);
		});
	}

	function renderCorridors() {
		if (!mapInstance || !leafletLib || !corridorsGroup) return;
		corridorsGroup.clearLayers();

		SANTA_CRUZ_CORRIDORS.forEach((corridor) => {
			const isSelected = selectedCorridor?.id === corridor.id;
			const polyline = leafletLib.polyline(corridor.coordinates, {
				color: corridor.color,
				weight: isSelected ? corridor.weight + 3 : corridor.weight,
				opacity: isSelected ? 1.0 : 0.85,
				dashArray: corridor.dashArray,
				lineCap: 'round',
				lineJoin: 'round'
			});

			polyline.bindTooltip(`
				<div class="p-1 space-y-0.5 text-xs">
					<div class="font-bold" style="color: ${corridor.color}">
						${corridor.name}
					</div>
					<div class="text-[10px] text-muted-foreground">
						PCI ${corridor.pci}/100 &bull; ${corridor.status}
					</div>
				</div>
			`, { sticky: true, className: 'surios-tooltip' });

			polyline.on('mouseover', () => {
				polyline.setStyle({ weight: corridor.weight + 3, opacity: 1 });
			});

			polyline.on('mouseout', () => {
				if (selectedCorridor?.id !== corridor.id) {
					polyline.setStyle({ weight: corridor.weight, opacity: 0.85 });
				}
			});

			polyline.on('click', () => {
				selectCorridor(corridor);
			});

			polyline.addTo(corridorsGroup);
		});
	}

	// Dynamic Leaflet Map Lifecycle
	$effect(() => {
		if (typeof window === 'undefined' || !mapContainer) return;

		import('leaflet').then((L) => {
			if (!mapContainer) return;
			leafletLib = L;

			mapInstance = L.map(mapContainer, {
				center: [14.2813, 121.4173],
				zoom: 14,
				minZoom: 12,
				maxZoom: 19,
				zoomControl: false
			});

			L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

			// Fast, high-density detailed street tiles (OpenStreetMap global CDN)
			tileLayerInstance = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
				maxZoom: 19,
				subdomains: ['a', 'b', 'c']
			}).addTo(mapInstance);

			// Setup Layer Groups
			corridorsGroup = L.featureGroup().addTo(mapInstance);
			markersGroup = L.featureGroup().addTo(mapInstance);

			// Initial Render
			renderCorridors();
			renderMarkers(filteredIncidents);

			// Delegate clicks from inside Leaflet custom popups to Svelte
			mapInstance.on('popupopen', (e: any) => {
				const popupEl = e.popup.getElement();
				if (!popupEl) return;
				const btn = popupEl.querySelector('.surios-inspect-btn');
				if (btn) {
					btn.addEventListener('click', () => {
						const incidentId = btn.getAttribute('data-id');
						const found = incidents.find((i) => i.id === incidentId);
						if (found) {
							selectedIncident = found;
							isSheetOpen = true;
						}
					});
				}
			});
		});

		return () => {
			if (mapInstance) {
				mapInstance.remove();
				mapInstance = null;
			}
		};
	});

	// Reactive update for markers when filter changes
	$effect(() => {
		if (mapInstance && filteredIncidents) {
			renderMarkers(filteredIncidents);
		}
	});

	// Reactive update for corridor visibility
	$effect(() => {
		if (mapInstance && corridorsGroup) {
			if (showCorridors) {
				if (!mapInstance.hasLayer(corridorsGroup)) {
					mapInstance.addLayer(corridorsGroup);
				}
			} else {
				if (mapInstance.hasLayer(corridorsGroup)) {
					mapInstance.removeLayer(corridorsGroup);
				}
			}
		}
	});

	// Reactive highlight for selected corridor polyline
	$effect(() => {
		if (mapInstance && corridorsGroup) {
			renderCorridors();
		}
	});

	// Auto-select incident from URL ?id= or ?focus= query parameter
	$effect(() => {
		if (typeof window === 'undefined' || !mapInstance || incidents.length === 0) return;
		const params = new URLSearchParams(window.location.search);
		const targetId = params.get('id') || params.get('focus');
		if (targetId) {
			const found = incidents.find(
				(i) =>
					i.id === targetId ||
					i.rawId === targetId ||
					i.id.toLowerCase() === targetId.toLowerCase() ||
					(i.rawId && targetId.toLowerCase() === i.rawId.toLowerCase())
			);
			if (found) {
				// Defer slightly to ensure markers are placed in DOM
				setTimeout(() => {
					selectIncidentFromFeed(found);
				}, 100);
			}
		}
	});
</script>

<svelte:head>
	<title>Map Feed — SuriOS Municipal Civil Infrastructure</title>
</svelte:head>

<div class="h-full flex flex-col">
	<!-- Feed Controls & Stats Strip -->
	<div class="px-4 py-3 border-b border-border bg-card/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
		<div class="flex items-center gap-2">
			<Badge variant="outline" class="text-[10px] font-mono border-border">
				Laguna Corridor GIS
			</Badge>
			<span class="text-xs text-muted-foreground">
				Santa Cruz Centroid &bull; 14.2813° N, 121.4173° E
			</span>
		</div>

		<!-- Filter Pill Group -->
		<div class="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
			{#each [
				{ id: 'ALL', label: 'All Incidents' },
				{ id: 'CRITICAL', label: 'Critical VRU' },
				{ id: 'REPORTED', label: 'Reported' },
				{ id: 'DISPATCHED', label: 'Dispatched' },
				{ id: 'RESOLVED', label: 'Resolved' }
			] as tab}
				<button
					type="button"
					onclick={() => (filter = tab.id as any)}
					class="px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer {filter === tab.id
						? 'bg-primary text-primary-foreground font-semibold'
						: 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Main Map Feed Grid: Matte Split Screen -->
	<div class="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[calc(100vh-8.5rem)]">
		<!-- Left: Interactive GIS Map Canvas with Floating Matte HUD -->
		<div class="lg:col-span-7 xl:col-span-8 relative border-b lg:border-b-0 lg:border-r border-border h-96 lg:h-full min-h-[360px]">
			<div bind:this={mapContainer} class="w-full h-full bg-[#0c0e14] surios-matte-map"></div>

			<!-- Floating Top-Left Matte HUD Bar -->
			<div class="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 max-w-[calc(100%-1.5rem)] pointer-events-auto">
				<!-- District PCI Badge -->
				<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/90 backdrop-blur-md shadow-md text-xs">
					<span class="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
					<div class="flex items-center gap-1.5">
						<span class="font-semibold text-foreground">Santa Cruz Corridor</span>
						<span class="text-muted-foreground">&bull;</span>
						<span class="font-mono text-muted-foreground">Network PCI: <strong class="text-destructive font-bold">49</strong></span>
					</div>
				</div>

				<!-- Layer Controls Pill -->
				<div class="flex items-center gap-1 p-1 rounded-lg border border-border bg-card/90 backdrop-blur-md shadow-md">
					<button
						type="button"
						onclick={() => (showCorridors = !showCorridors)}
						class="px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer {showCorridors ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
						title="Toggle Road Corridor Telemetry Lines"
					>
						<RouteIcon class="h-3.5 w-3.5" />
						<span>Corridors ({SANTA_CRUZ_CORRIDORS.length})</span>
					</button>
					<button
						type="button"
						onclick={resetMapView}
						class="px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
						title="Recenter Map to Santa Cruz Center"
					>
						<RotateCcwIcon class="h-3.5 w-3.5" />
						<span>Reset</span>
					</button>
				</div>
			</div>

			<!-- Floating Bottom-Left Matte Corridor Telemetry Card / HUD Legend -->
			<div class="absolute bottom-3 left-3 z-[1000] max-w-sm w-full sm:w-auto pointer-events-auto">
				{#if selectedCorridor}
					<!-- Active Corridor Telemetry Card -->
					<div class="p-3.5 rounded-lg border border-border bg-card/95 backdrop-blur-md shadow-lg space-y-2 text-xs">
						<div class="flex items-start justify-between gap-3">
							<div>
								<div class="flex items-center gap-1.5">
									<Badge
										variant={selectedCorridor.status === 'CRITICAL' ? 'destructive' : selectedCorridor.status === 'MODERATE' ? 'secondary' : 'outline'}
										class="text-[9px] font-mono px-1.5 py-0"
									>
										{selectedCorridor.id}
									</Badge>
									<span class="font-bold text-foreground text-xs">{selectedCorridor.name}</span>
								</div>
								<div class="text-[11px] text-muted-foreground mt-0.5">
									{selectedCorridor.classification} &bull; {selectedCorridor.lengthKm}
								</div>
							</div>
							<button
								type="button"
								onclick={() => (selectedCorridor = null)}
								class="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted cursor-pointer"
								title="Close Corridor Card"
							>
								<XIcon class="h-3.5 w-3.5" />
							</button>
						</div>

						<div class="grid grid-cols-2 gap-2 pt-1 border-t border-border">
							<div class="p-2 rounded bg-muted/40 border border-border">
								<div class="text-[10px] text-muted-foreground uppercase font-mono">Pavement Condition</div>
								<div class="text-sm font-bold font-mono mt-0.5 flex items-center gap-1.5">
									<span class="inline-block w-2.5 h-2.5 rounded-full" style="background-color: {selectedCorridor.color}"></span>
									<span>PCI {selectedCorridor.pci} / 100</span>
								</div>
							</div>
							<div class="p-2 rounded bg-muted/40 border border-border">
								<div class="text-[10px] text-muted-foreground uppercase font-mono">Active Road Distress</div>
								<div class="text-sm font-bold font-mono mt-0.5 text-foreground">
									{selectedCorridor.distressCount} Severe Hotspots
								</div>
							</div>
						</div>

						<div class="p-2 rounded bg-destructive/5 border border-destructive/20 text-[11px] text-destructive leading-relaxed">
							<div class="font-semibold flex items-center gap-1 mb-0.5">
								<BikeIcon class="h-3 w-3" />
								<span>VRU Telemetry Analysis</span>
							</div>
							<p class="text-foreground/90">{selectedCorridor.vruNote}</p>
						</div>
					</div>
				{:else}
					<!-- Compact Collapsible HUD Legend -->
					<div class="p-3 rounded-lg border border-border bg-card/90 backdrop-blur-md shadow-md text-xs space-y-2">
						<div class="flex items-center justify-between gap-4">
							<span class="font-semibold text-foreground text-[11px] uppercase tracking-wider">Laguna Telemetry HUD</span>
							<span class="text-[10px] text-muted-foreground font-mono">ASTM D6433</span>
						</div>
						<div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
							<!-- Critical Marker -->
							<div class="flex items-center gap-2">
								<span class="h-4 w-4 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold flex items-center justify-center shrink-0">9</span>
								<span class="text-muted-foreground">Critical Dot Bomb (8–10)</span>
							</div>
							<!-- Critical Road Line -->
							<div class="flex items-center gap-2">
								<span class="h-1.5 w-5 rounded bg-red-500 shrink-0"></span>
								<span class="text-muted-foreground">Critical Line (PCI &lt; 50)</span>
							</div>
							<!-- Moderate Marker -->
							<div class="flex items-center gap-2">
								<span class="h-4 w-4 rounded-full bg-amber-500 text-white font-mono text-[9px] font-bold flex items-center justify-center shrink-0">6</span>
								<span class="text-muted-foreground">Moderate Hazard (5–7)</span>
							</div>
							<!-- Moderate Road Line -->
							<div class="flex items-center gap-2">
								<span class="h-1.5 w-5 rounded bg-amber-500 shrink-0"></span>
								<span class="text-muted-foreground">Warning Line (50–70)</span>
							</div>
							<!-- Low Marker -->
							<div class="flex items-center gap-2">
								<span class="h-4 w-4 rounded-full bg-slate-500 text-white font-mono text-[9px] font-bold flex items-center justify-center shrink-0">2</span>
								<span class="text-muted-foreground">Minor Distress (1–4)</span>
							</div>
							<!-- Good Road Line -->
							<div class="flex items-center gap-2">
								<span class="h-1.5 w-5 rounded bg-emerald-500 shrink-0"></span>
								<span class="text-muted-foreground">Stable Line (PCI &gt; 70)</span>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right: Live Civil Defect Stream with Vertical Timeline (Matching Mockup Choice 1) -->
		<div class="lg:col-span-5 xl:col-span-4 flex flex-col h-full bg-card/20 overflow-hidden">
			<!-- Stream Header -->
			<div class="p-3.5 border-b border-border flex items-center justify-between bg-card/60">
				<div class="flex items-center gap-2">
					<LayersIcon class="h-4 w-4 text-primary" />
					<span class="text-xs font-semibold text-foreground">Defect Incident Feed</span>
					<Badge variant="secondary" class="text-[10px] px-1.5 h-4 font-mono">
						{filteredIncidents.length}
					</Badge>
				</div>
				<Button href="/report" size="sm" class="h-7 text-xs px-2.5 gap-1 rounded-md">
					<CameraIcon class="h-3 w-3" />
					<span>Field Capture</span>
				</Button>
			</div>

			<!-- Incident Cards List with Timeline Connector -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if filteredIncidents.length === 0}
					<div class="text-center py-12 text-xs text-muted-foreground">
						No incidents match the active filter criteria.
					</div>
				{:else}
					<div class="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border/80">
						{#each filteredIncidents as item}
							{@const isSelected = selectedIncident?.id === item.id}
							{@const isCritical = item.hazardSeverity >= 8}
							{@const isModerate = item.hazardSeverity >= 5 && item.hazardSeverity < 8}
							<div class="relative">
								<!-- Timeline Node Indicator -->
								<span
									class="absolute -left-[17px] top-4 h-2.5 w-2.5 rounded-full border-2 border-background {isCritical
										? 'bg-destructive ring-2 ring-destructive/20'
										: isModerate
											? 'bg-amber-500 ring-2 ring-amber-500/20'
											: 'bg-slate-500'}"
								></span>

								<!-- Incident Card -->
								<div
									role="button"
									tabindex="0"
									onclick={() => selectIncidentFromFeed(item)}
									onkeydown={(e) => e.key === 'Enter' && selectIncidentFromFeed(item)}
									class="p-3.5 rounded-lg border text-left transition-all cursor-pointer bg-card hover:border-foreground/30 {isSelected
										? 'border-primary ring-1 ring-primary/20 bg-secondary/30'
										: 'border-border'}"
								>
									<!-- Top Metadata -->
									<div class="flex items-start justify-between gap-2">
										<div class="flex items-center gap-1.5 flex-wrap">
											<!-- Severity Pill -->
											<span class="text-[10px] font-bold font-mono px-2 py-0.5 rounded border {isCritical
												? 'bg-destructive/15 text-destructive border-destructive/30'
												: isModerate
													? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
													: 'bg-secondary text-foreground border-border'}">
												Severity: {item.hazardSeverity}
											</span>
											<Badge
												variant={item.vruLethality === 'CRITICAL' ? 'destructive' : 'secondary'}
												class="text-[9px] font-mono px-1.5 py-0"
											>
												{item.vruLethality} VRU
											</Badge>
										</div>

										<span class="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
											<ClockIcon class="h-3 w-3" />
											<span>{item.createdAt}</span>
										</span>
									</div>

									<!-- Title -->
									<h4 class="text-xs font-semibold text-foreground line-clamp-1 mt-2">
										{item.title}
									</h4>

									<!-- ASTM Distress & Location -->
									<p class="text-[11px] text-muted-foreground mt-1 line-clamp-1">
										{item.astmCode} &bull; {item.locationName}
									</p>

									<!-- Card Footer Action Buttons -->
									<div class="flex items-center justify-between mt-3 pt-2.5 border-t border-border/60 text-[11px] gap-2">
										<span class="text-muted-foreground font-mono text-[10px]">
											{item.status} &bull; {item.communityConfirmations} confirmed
										</span>

										<div class="flex items-center gap-1.5">
											<Button
												href="/dashboard"
												size="sm"
												variant="outline"
												class="h-6 text-[10px] px-2 border-border gap-1"
												onclick={(e) => e.stopPropagation()}
											>
												<WrenchIcon class="h-2.5 w-2.5" />
												<span>Dispatch</span>
											</Button>
											<Button
												size="sm"
												variant="secondary"
												class="h-6 text-[10px] px-2 font-medium"
												onclick={(e) => openInspect(item, e)}
											>
												<span>Review</span>
											</Button>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Slide-over Detailed Inspection Drawer -->
<Sheet bind:open={isSheetOpen}>
	<SheetContent side="right" class="w-full sm:max-w-lg p-0 flex flex-col bg-card">
		{#if selectedIncident}
			<SheetHeader class="p-5 border-b border-border space-y-1.5">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Badge variant="outline" class="text-[10px] font-mono border-border">
							{selectedIncident.id}
						</Badge>
						<Badge
							variant={selectedIncident.vruLethality === 'CRITICAL' ? 'destructive' : 'secondary'}
							class="text-[10px] font-mono"
						>
							{selectedIncident.vruLethality} VRU Risk
						</Badge>
					</div>
					<Badge variant="outline" class="text-[10px] font-mono border-border">
						{selectedIncident.status}
					</Badge>
				</div>
				<SheetTitle class="text-base font-bold text-foreground text-left">
					{selectedIncident.title}
				</SheetTitle>
				<SheetDescription class="text-xs text-muted-foreground text-left">
					{selectedIncident.locationName} ({selectedIncident.latitude}° N, {selectedIncident.longitude}° E)
				</SheetDescription>
			</SheetHeader>

			<div class="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
				{#if selectedIncident.imageUrl}
					<div class="rounded-lg overflow-hidden border border-border bg-muted/30">
						<img src={selectedIncident.imageUrl} alt={selectedIncident.title} class="w-full h-48 object-cover" />
					</div>
				{/if}

				<!-- ASTM D6433 Classification Card -->
				<div class="p-3.5 rounded-lg border border-border bg-muted/30 space-y-2">
					<div class="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider">
						ASTM D6433 Standard Distress Spec
					</div>
					<div class="text-sm font-semibold text-foreground">
						{selectedIncident.astmCode}
					</div>
					<p class="text-muted-foreground leading-relaxed text-[11px]">
						Classified according to municipal asphalt distress identification procedures.
					</p>
				</div>

				<!-- Vulnerable Road User (VRU) Profiling -->
				<div class="p-3.5 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1.5">
					<div class="flex items-center gap-1.5 text-destructive font-semibold text-[11px]">
						<BikeIcon class="h-3.5 w-3.5" />
						<span>Two-Wheeler & Pedestrian Threat Analysis</span>
					</div>
					<p class="text-foreground leading-relaxed text-[11px]">
						{selectedIncident.vruDetails}
					</p>
				</div>

				<!-- Recommended Civil Maintenance Action -->
				<div class="space-y-2">
					<h4 class="font-semibold text-foreground text-xs uppercase tracking-wider">
						Civil Engineering Remediation
					</h4>
					<div class="p-3 rounded-lg border border-border bg-card">
						<p class="font-medium text-foreground">{selectedIncident.recommendedAction}</p>
					</div>
				</div>

				<!-- Materials & Equipment Checklist -->
				<div class="space-y-2">
					<h4 class="font-semibold text-foreground text-xs uppercase tracking-wider">
						Required Materials &amp; Crew Equipment
					</h4>
					<div class="space-y-1">
						{#each selectedIncident.materialsChecklist as mat}
							<div class="flex items-center gap-2 p-2 rounded-md border border-border/80 bg-muted/20 text-muted-foreground">
								<WrenchIcon class="h-3 w-3 text-primary shrink-0" />
								<span>{mat}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Community Confirmations -->
				<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-card text-muted-foreground">
					<span>Community Validation</span>
					<strong class="text-foreground font-semibold">
						{selectedIncident.communityConfirmations} field confirmations
					</strong>
				</div>
			</div>

			<SheetFooter class="p-4 border-t border-border flex items-center justify-between gap-2 bg-card/50">
				<Button variant="outline" size="sm" class="text-xs h-8" onclick={() => (isSheetOpen = false)}>
					Close
				</Button>
				<Button href="/dashboard" size="sm" class="text-xs h-8 gap-1.5">
					<WrenchIcon class="h-3.5 w-3.5" />
					<span>Route Dispatch Crew</span>
				</Button>
			</SheetFooter>
		{/if}
	</SheetContent>
</Sheet>

<style>
	/* Dedicated Deep Matte Command Center Canvas */
	:global(.surios-matte-map.leaflet-container),
	:global(.surios-matte-map .leaflet-container) {
		background-color: #0c0e14 !important;
		font-family: inherit;
		outline: none;
	}

	/* Deep Matte Dark Mode for OpenStreetMap Base Tiles across all zooms (12-19) */
	:global(.surios-matte-map .leaflet-tile-pane) {
		filter: invert(100%) hue-rotate(180deg) brightness(80%) contrast(125%) saturate(18%);
		-webkit-filter: invert(100%) hue-rotate(180deg) brightness(80%) contrast(125%) saturate(18%);
	}

	:global(.surios-dot-bomb-container) {
		background: transparent !important;
		border: none !important;
	}

	:global(.surios-dot-bomb-wrapper) {
		position: relative;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	:global(.surios-pulse-ring) {
		position: absolute;
		inset: 0;
		border-radius: 9999px;
		pointer-events: none;
	}

	:global(.surios-pulse-ring.ring-1) {
		background: rgba(239, 68, 68, 0.45);
		border: 1.5px solid rgba(239, 68, 68, 0.9);
		animation: surios-radar-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
	}

	:global(.surios-pulse-ring.ring-2) {
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.6);
		animation: surios-radar-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.7s;
	}

	:global(.surios-pulse-ring.ring-moderate) {
		background: rgba(245, 158, 11, 0.25);
		border: 1px solid rgba(245, 158, 11, 0.7);
		animation: surios-radar-pulse 3s cubic-bezier(0, 0, 0.2, 1) infinite;
	}

	@keyframes surios-radar-pulse {
		0% {
			transform: scale(0.65);
			opacity: 0.95;
		}
		65% {
			transform: scale(2.1);
			opacity: 0.2;
		}
		100% {
			transform: scale(2.6);
			opacity: 0;
		}
	}

	:global(.surios-badge) {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-weight: 700;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
		transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
	}

	:global(.surios-badge.badge-critical) {
		width: 26px;
		height: 26px;
		background: #ef4444;
		color: #ffffff;
		border: 2px solid #ffffff;
		font-size: 11px;
	}

	:global(.surios-badge.badge-moderate) {
		width: 24px;
		height: 24px;
		background: #f59e0b;
		color: #ffffff;
		border: 2px solid #ffffff;
		font-size: 10px;
	}

	:global(.surios-badge.badge-low) {
		width: 22px;
		height: 22px;
		background: #64748b;
		color: #ffffff;
		border: 1.5px solid #ffffff;
		font-size: 9px;
	}

	:global(.surios-dot-bomb-wrapper:hover .surios-badge) {
		transform: scale(1.25);
		box-shadow: 0 6px 14px rgba(0, 0, 0, 0.5);
	}

	:global(.surios-dot-bomb-wrapper.is-selected .surios-badge) {
		outline: 3px solid #38bdf8;
		outline-offset: 2px;
		transform: scale(1.2);
	}

	/* Custom Floating Popover Card (Choice 1 Mockup) */
	:global(.surios-custom-popup .leaflet-popup-content-wrapper) {
		background: var(--card) !important;
		color: var(--card-foreground) !important;
		border: 1px solid var(--border) !important;
		border-radius: 12px !important;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4) !important;
		padding: 0 !important;
		overflow: hidden;
	}

	:global(.surios-custom-popup .leaflet-popup-content) {
		margin: 0 !important;
		line-height: normal !important;
	}

	:global(.surios-custom-popup .leaflet-popup-tip) {
		background: var(--card) !important;
		border: 1px solid var(--border) !important;
	}

	:global(.surios-card-popup) {
		width: 240px;
		overflow: hidden;
		font-family: inherit;
	}

	:global(.surios-card-img-wrap) {
		width: 100%;
		height: 110px;
		position: relative;
		overflow: hidden;
		background-color: var(--muted);
	}

	:global(.surios-card-img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	:global(.surios-card-header-bar) {
		padding: 8px 12px;
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	:global(.surios-card-code) {
		font-family: monospace;
		font-size: 10px;
		color: var(--muted-foreground);
	}

	:global(.surios-card-badge) {
		position: absolute;
		top: 8px;
		right: 8px;
		padding: 2px 6px;
		border-radius: 4px;
		font-family: monospace;
		font-size: 10px;
		font-weight: 700;
		color: #ffffff;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
	}

	:global(.surios-card-content) {
		padding: 10px 12px;
	}

	:global(.surios-card-title) {
		font-weight: 700;
		font-size: 12px;
		color: var(--foreground);
		margin: 0 0 4px 0;
		line-height: 1.3;
	}

	:global(.surios-card-astm) {
		font-size: 10px;
		color: var(--muted-foreground);
		margin-bottom: 6px;
	}

	:global(.surios-card-gps) {
		font-family: monospace;
		font-size: 9px;
		color: var(--muted-foreground);
		margin-bottom: 10px;
	}

	:global(.surios-card-inspect-btn) {
		width: 100%;
		padding: 6px 10px;
		border-radius: 6px;
		background-color: var(--primary);
		color: var(--primary-foreground);
		font-weight: 600;
		font-size: 11px;
		border: none;
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	:global(.surios-card-inspect-btn:hover) {
		opacity: 0.9;
	}

	:global(.surios-tooltip) {
		background: var(--card) !important;
		color: var(--card-foreground) !important;
		border: 1px solid var(--border) !important;
		border-radius: 6px !important;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
		padding: 4px 8px !important;
	}

	:global(.leaflet-tooltip-top:before) {
		border-top-color: var(--border) !important;
	}

	:global(.leaflet-control-zoom) {
		border: 1px solid var(--border) !important;
		border-radius: 8px !important;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
	}

	:global(.leaflet-control-zoom a) {
		background-color: var(--card) !important;
		color: var(--foreground) !important;
		border-bottom: 1px solid var(--border) !important;
	}

	:global(.leaflet-control-zoom a:hover) {
		background-color: var(--secondary) !important;
	}
</style>
