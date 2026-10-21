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

	let { data }: PageProps = $props();

	let filter = $state<'ALL' | 'CRITICAL' | 'REPORTED' | 'DISPATCHED' | 'RESOLVED'>('ALL');
	let selectedIncident = $state<FeedIncident | null>(null);
	let isSheetOpen = $state(false);
	let mapContainer = $state<HTMLDivElement | null>(null);

	const incidents = $derived(data.incidents || []);

	const filteredIncidents = $derived(
		filter === 'ALL'
			? incidents
			: filter === 'CRITICAL'
				? incidents.filter((i) => i.riskLevel === 'CRITICAL' || i.vruLethality === 'CRITICAL')
				: incidents.filter((i) => i.status === filter)
	);

	function openInspect(incident: FeedIncident) {
		selectedIncident = incident;
		isSheetOpen = true;
	}

	// Dynamic Leaflet Map Integration
	$effect(() => {
		if (typeof window === 'undefined' || !mapContainer) return;

		let mapInstance: any = null;

		import('leaflet').then((L) => {
			if (!mapContainer) return;

			mapInstance = L.map(mapContainer, {
				center: [14.2813, 121.4173],
				zoom: 14,
				zoomControl: false
			});

			L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

			// Carto Voyager Minimalist Vector Tiles
			L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
				attribution: '&copy; OpenStreetMap &copy; CARTO',
				maxZoom: 19
			}).addTo(mapInstance);

			// Plot Incident Markers
			filteredIncidents.forEach((item) => {
				const isCrit = item.hazardSeverity >= 8;
				const isMod = item.hazardSeverity >= 5 && item.hazardSeverity < 8;

				const markerColor = isCrit ? '#ef4444' : isMod ? '#f59e0b' : '#64748b';

				const customIcon = L.divIcon({
					className: 'surios-marker',
					html: `
						<div style="
							width: 24px;
							height: 24px;
							background: ${markerColor};
							border: 2px solid #ffffff;
							border-radius: 50%;
							display: flex;
							align-items: center;
							justify-content: center;
							color: #ffffff;
							font-weight: 700;
							font-size: 10px;
							box-shadow: 0 2px 4px rgba(0,0,0,0.25);
							cursor: pointer;
						">
							${item.hazardSeverity}
						</div>
					`,
					iconSize: [24, 24],
					iconAnchor: [12, 12]
				});

				const marker = L.marker([item.latitude, item.longitude], { icon: customIcon }).addTo(mapInstance);

				marker.on('click', () => {
					openInspect(item);
				});
			});
		});

		return () => {
			if (mapInstance) {
				mapInstance.remove();
			}
		};
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
				Laguna Corridor
			</Badge>
			<span class="text-xs text-muted-foreground">
				Santa Cruz &bull; 14.2813° N, 121.4173° E
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

	<!-- Main Map Feed Grid: Split Screen -->
	<div class="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[calc(100vh-8.5rem)]">
		<!-- Left: Interactive GIS Map Canvas -->
		<div class="lg:col-span-7 xl:col-span-8 relative border-b lg:border-b-0 lg:border-r border-border h-80 lg:h-full min-h-[300px]">
			<div bind:this={mapContainer} class="w-full h-full bg-muted/20"></div>

			<!-- Floating Map Overlay Legend -->
			<div class="absolute top-3 left-3 z-[1000] p-2 rounded-lg border border-border bg-background/90 backdrop-blur shadow-xs text-[11px] space-y-1">
				<div class="font-semibold text-foreground text-[10px] uppercase tracking-wider">Severity Legend</div>
				<div class="flex items-center gap-2">
					<span class="h-2.5 w-2.5 rounded-full bg-destructive shrink-0"></span>
					<span class="text-muted-foreground">Critical (8–10)</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0"></span>
					<span class="text-muted-foreground">Moderate (5–7)</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="h-2.5 w-2.5 rounded-full bg-slate-500 shrink-0"></span>
					<span class="text-muted-foreground">Low (1–4)</span>
				</div>
			</div>
		</div>

		<!-- Right: Live Civil Defect Stream -->
		<div class="lg:col-span-5 xl:col-span-4 flex flex-col h-full bg-card/20 overflow-hidden">
			<!-- Stream Header -->
			<div class="p-3.5 border-b border-border flex items-center justify-between bg-card/60">
				<div class="flex items-center gap-2">
					<LayersIcon class="h-4 w-4 text-primary" />
					<span class="text-xs font-semibold text-foreground">Active Civil Incidents</span>
					<Badge variant="secondary" class="text-[10px] px-1.5 h-4 font-mono">
						{filteredIncidents.length}
					</Badge>
				</div>
				<Button href="/report" size="sm" class="h-7 text-xs px-2.5 gap-1 rounded-md">
					<CameraIcon class="h-3 w-3" />
					<span>Field Capture</span>
				</Button>
			</div>

			<!-- Incident Cards List -->
			<div class="flex-1 overflow-y-auto p-3 space-y-2.5">
				{#if filteredIncidents.length === 0}
					<div class="text-center py-12 text-xs text-muted-foreground">
						No incidents match the active filter criteria.
					</div>
				{:else}
					{#each filteredIncidents as item}
						{@const isSelected = selectedIncident?.id === item.id}
						<div
							role="button"
							tabindex="0"
							onclick={() => openInspect(item)}
							onkeydown={(e) => e.key === 'Enter' && openInspect(item)}
							class="p-3 rounded-lg border text-left transition-all cursor-pointer bg-card hover:border-foreground/30 {isSelected
								? 'border-primary ring-1 ring-primary/20'
								: 'border-border'}"
						>
							<!-- Top Metadata -->
							<div class="flex items-start justify-between gap-2">
								<div class="space-y-0.5">
									<div class="flex items-center gap-1.5">
										<Badge variant="outline" class="text-[9px] font-mono px-1 py-0 border-border">
											{item.id}
										</Badge>
										<Badge
											variant={item.vruLethality === 'CRITICAL' ? 'destructive' : 'secondary'}
											class="text-[9px] font-mono px-1.5 py-0"
										>
											{item.vruLethality} VRU
										</Badge>
									</div>
									<h4 class="text-xs font-semibold text-foreground line-clamp-1 mt-1">
										{item.title}
									</h4>
								</div>

								<!-- Severity Pill -->
								<div class="flex flex-col items-end">
									<div class="text-xs font-bold font-mono px-1.5 py-0.5 rounded border border-border bg-secondary text-foreground">
										{item.hazardSeverity}/10
									</div>
									<span class="text-[9px] text-muted-foreground mt-0.5">{item.createdAt}</span>
								</div>
							</div>

							<!-- ASTM Distress & Location -->
							<p class="text-[11px] text-muted-foreground mt-1.5 line-clamp-1">
								{item.distressType} &bull; {item.locationName}
							</p>

							<!-- Card Footer Actions -->
							<div class="flex items-center justify-between mt-2.5 pt-2 border-t border-border/60 text-[11px]">
								<span class="text-muted-foreground font-mono text-[10px]">
									{item.status} &bull; {item.communityConfirmations} confirmed
								</span>
								<div class="flex items-center gap-1 text-primary hover:underline font-medium text-[11px]">
									<span>Inspect</span>
									<ArrowUpRightIcon class="h-3 w-3" />
								</div>
							</div>
						</div>
					{/each}
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
