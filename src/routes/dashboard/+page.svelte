<script lang="ts">
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import BikeIcon from '@lucide/svelte/icons/bike';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';

	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	// Mock Real-Time Incident Data for Laguna Municipal Corridor
	const incidents = [
		{
			id: 'TKT-7821',
			distress: 'Deep Pothole (Edge Breakdown)',
			astm: 'ASTM D6433 (Pothole - High)',
			location: 'LSPU Main Entrance, Santa Cruz',
			coords: '14.2813° N, 121.4173° E',
			vru: 'CRITICAL',
			severity: 9,
			status: 'REPORTED',
			confirmations: 4,
			time: '12m ago'
		},
		{
			id: 'TKT-7819',
			distress: 'Alligator Cracking & Rutting',
			astm: 'ASTM D6433 (Alligator - Med)',
			location: 'National Highway, Pagsanjan Junction',
			coords: '14.2765° N, 121.4312° E',
			vru: 'HIGH',
			severity: 7,
			status: 'DISPATCHED',
			confirmations: 2,
			time: '45m ago'
		},
		{
			id: 'TKT-7814',
			distress: 'Drainage Failure / Edge Drop-off',
			astm: 'ASTM D6433 (Edge Defect)',
			location: 'Barangay Bubukal Corridor',
			coords: '14.2690° N, 121.4021° E',
			vru: 'MODERATE',
			severity: 5,
			status: 'REPORTED',
			confirmations: 1,
			time: '2h ago'
		},
		{
			id: 'TKT-7798',
			distress: 'Transverse Thermal Crack (Patched)',
			astm: 'ASTM D6433 (Crack - Low)',
			location: 'Pedro Guevara Ave, Santa Cruz',
			coords: '14.2840° N, 121.4190° E',
			vru: 'LOW',
			severity: 2,
			status: 'RESOLVED',
			confirmations: 3,
			time: '4h ago'
		}
	];

	let filter = $state<string>('ALL');

	const filteredIncidents = $derived(
		filter === 'ALL'
			? incidents
			: filter === 'CRITICAL'
				? incidents.filter((i) => i.vru === 'CRITICAL' || i.vru === 'HIGH')
				: incidents.filter((i) => i.status === filter)
	);
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<Badge variant="outline" class="text-xs font-normal border-border">
					Module C
				</Badge>
				<span class="text-xs text-muted-foreground">Municipal Operations & Dispatch GIS</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
				Operations Dispatch Canvas
			</h1>
			<p class="text-xs text-muted-foreground">
				Real-time geolocated distress triage across the Santa Cruz, Laguna provincial transport network.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" class="text-xs h-8">
				Export CSV Work Orders
			</Button>
			<Button size="sm" class="text-xs h-8">
				Dispatch Quick Response Unit
			</Button>
		</div>
	</div>

	<!-- Top Metric Cards (True shadcn KPI layout) -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<Card class="border border-border bg-card p-4 space-y-1 shadow-xs">
			<div class="flex items-center justify-between text-muted-foreground text-xs font-medium">
				<span>Active Hazards</span>
				<MapPinIcon class="h-3.5 w-3.5" />
			</div>
			<div class="text-2xl font-bold text-foreground">14</div>
			<p class="text-[11px] text-muted-foreground">4 awaiting municipal dispatch</p>
		</Card>

		<Card class="border border-border bg-card p-4 space-y-1 shadow-xs">
			<div class="flex items-center justify-between text-destructive text-xs font-medium">
				<span>Critical VRU Threats</span>
				<BikeIcon class="h-3.5 w-3.5" />
			</div>
			<div class="text-2xl font-bold text-destructive">4</div>
			<p class="text-[11px] text-muted-foreground">Fatal motorcycle/tricycle risks</p>
		</Card>

		<Card class="border border-border bg-card p-4 space-y-1 shadow-xs">
			<div class="flex items-center justify-between text-muted-foreground text-xs font-medium">
				<span>Avg. Dispatch Time</span>
				<ClockIcon class="h-3.5 w-3.5" />
			</div>
			<div class="text-2xl font-bold text-foreground">2.4h</div>
			<p class="text-[11px] text-muted-foreground">From report to crew departure</p>
		</Card>

		<Card class="border border-border bg-card p-4 space-y-1 shadow-xs">
			<div class="flex items-center justify-between text-muted-foreground text-xs font-medium">
				<span>Proof of Patch Audited</span>
				<CheckCircleIcon class="h-3.5 w-3.5" />
			</div>
			<div class="text-2xl font-bold text-foreground">8</div>
			<p class="text-[11px] text-muted-foreground">Gemini vision verified closure</p>
		</Card>
	</div>

	<!-- Incident Filter Bar -->
	<div class="flex items-center justify-between gap-3 pt-2">
		<div class="flex items-center gap-1.5 text-xs">
			<span class="text-muted-foreground mr-1 flex items-center gap-1">
				<FilterIcon class="h-3 w-3" />
				<span>Filter:</span>
			</span>
			<Button
				variant={filter === 'ALL' ? 'secondary' : 'ghost'}
				size="sm"
				class="h-7 text-xs px-2.5 rounded-md"
				onclick={() => filter = 'ALL'}
			>
				All Defects
			</Button>
			<Button
				variant={filter === 'CRITICAL' ? 'secondary' : 'ghost'}
				size="sm"
				class="h-7 text-xs px-2.5 rounded-md text-destructive"
				onclick={() => filter = 'CRITICAL'}
			>
				Critical Rider Threats
			</Button>
			<Button
				variant={filter === 'REPORTED' ? 'secondary' : 'ghost'}
				size="sm"
				class="h-7 text-xs px-2.5 rounded-md"
				onclick={() => filter = 'REPORTED'}
			>
				Pending Dispatch
			</Button>
			<Button
				variant={filter === 'RESOLVED' ? 'secondary' : 'ghost'}
				size="sm"
				class="h-7 text-xs px-2.5 rounded-md"
				onclick={() => filter = 'RESOLVED'}
			>
				Resolved
			</Button>
		</div>

		<span class="text-xs text-muted-foreground font-mono">
			{filteredIncidents.length} Records
		</span>
	</div>

	<!-- Incidents Queue Table / Card List -->
	<Card class="border border-border bg-card shadow-xs overflow-hidden">
		<div class="divide-y divide-border text-xs">
			{#each filteredIncidents as item}
				<div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/20 transition-colors">
					<div class="space-y-1">
						<div class="flex items-center gap-2">
							<span class="font-mono font-semibold text-foreground">{item.id}</span>
							<Badge
								variant={item.vru === 'CRITICAL' ? 'destructive' : item.vru === 'HIGH' ? 'destructive' : 'secondary'}
								class="text-[10px] h-4.5 px-1.5"
							>
								{item.vru} VRU RISK
							</Badge>
							<Badge variant="outline" class="text-[10px] h-4.5 px-1.5 font-mono border-border">
								{item.status}
							</Badge>
							<span class="text-muted-foreground text-[11px]">• {item.time}</span>
						</div>
						<p class="font-medium text-foreground text-sm">{item.distress}</p>
						<div class="flex items-center gap-3 text-muted-foreground text-[11px]">
							<span class="flex items-center gap-1">
								<MapPinIcon class="h-3 w-3" />
								{item.location}
							</span>
							<span class="font-mono text-foreground/80">{item.coords}</span>
							<span>+{item.confirmations} Community Reports</span>
						</div>
					</div>

					<div class="flex items-center gap-2 shrink-0">
						<Button variant="outline" size="sm" class="h-8 text-xs gap-1">
							<WrenchIcon class="h-3.5 w-3.5" />
							<span>Assign Crew</span>
						</Button>
						<Button variant="ghost" size="sm" class="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground">
							<span>Details</span>
							<ArrowUpRightIcon class="h-3 w-3" />
						</Button>
					</div>
				</div>
			{/each}
		</div>
	</Card>
</div>
