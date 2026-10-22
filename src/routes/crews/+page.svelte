<script lang="ts">
	import { SANTA_CRUZ_CORRIDORS } from '$lib/data/corridors.js';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter,
		DialogClose
	} from '$lib/components/ui/dialog/index.js';

	import TruckIcon from '@lucide/svelte/icons/truck';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import HardHatIcon from '@lucide/svelte/icons/hard-hat';
	import NavigationIcon from '@lucide/svelte/icons/navigation';
	import RouteIcon from '@lucide/svelte/icons/route';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import AlertCircleIcon from '@lucide/svelte/icons/circle-alert';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import SearchIcon from '@lucide/svelte/icons/search';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import GaugeIcon from '@lucide/svelte/icons/gauge';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import BikeIcon from '@lucide/svelte/icons/bike';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import PhoneIcon from '@lucide/svelte/icons/phone';

	// Crew interface
	interface AsphaltCrew {
		id: string;
		callsign: string;
		accreditation: string;
		classification: string;
		specialization: string;
		lead: string;
		supervisor: string;
		contact: string;
		teamSize: number;
		corridorId: string;
		corridorName: string;
		status: 'ACTIVE_REPAIR' | 'MOBILIZING' | 'STANDBY' | 'SCHEDULED';
		statusLabel: string;
		activeWorkOrder: string;
		assignedMachinery: string[];
		slaAdherence: number; // percentage
		avgResponseMin: number;
		warrantyRating: number; // percentage
	}

	// Machinery interface
	interface HeavyMachinery {
		id: string;
		tag: string;
		name: string;
		category: string;
		model: string;
		status: 'Available (Depot HQ)' | 'En Route (National Highway)' | 'Standby / Scheduled' | 'Active Repair (Pedro Guevara Ave)' | string;
		statusCode: 'AVAILABLE' | 'EN_ROUTE' | 'STANDBY' | 'ACTIVE_REPAIR';
		location: string;
		health: number; // percentage
		engineHours: number;
		assignedCrew: string;
		operator: string;
		fuelLevel: number; // percentage
	}

	// Initial State for DPWH-Accredited Asphalt Paving Crews
	let crews = $state<AsphaltCrew[]>([
		{
			id: 'CREW-01',
			callsign: 'Crew Alpha - Rapid Patch',
			accreditation: 'DPWH-NCR-2024-C88',
			classification: 'Class A Asphalt Paving Contractor',
			specialization: 'High-Velocity Cold & Hot-Mix Pothole Infill, Quick Tack Seal',
			lead: 'Foreman Arnel Mendoza',
			supervisor: 'Engr. Danilo Reyes, PE (DPWH Laguna 2nd District)',
			contact: '+63 (049) 501-4412',
			teamSize: 8,
			corridorId: 'CORR-02',
			corridorName: 'Pedro Guevara Avenue (Poblacion)',
			status: 'ACTIVE_REPAIR',
			statusLabel: 'Active Patching',
			activeWorkOrder: 'TKT-7821 — LSPU Main Gate Pothole',
			assignedMachinery: ['Vibratory Plate Compactor #01', 'Isuzu 6-Wheeler Hauler'],
			slaAdherence: 98.4,
			avgResponseMin: 22,
			warrantyRating: 99.1
		},
		{
			id: 'CREW-02',
			callsign: 'Crew Bravo - South Milling',
			accreditation: 'DPWH-R4A-2025-A12',
			classification: 'Heavy Milling & Subgrade Resurfacing Unit',
			specialization: 'Cold Planing, Surface Scarification & High-Tonnage Resurfacing',
			lead: 'Lead Operator Jun-Jun Santos',
			supervisor: 'Engr. Carlo Bautista (Municipal Works)',
			contact: '+63 (049) 501-4418',
			teamSize: 10,
			corridorId: 'CORR-01',
			corridorName: 'Manila East Rd / National Highway',
			status: 'MOBILIZING',
			statusLabel: 'En Route / Mobilizing',
			activeWorkOrder: 'TKT-7819 — National Highway Rutting & Corrugation',
			assignedMachinery: ['Tack Tanker #02', 'Asphalt Cold Planer #04'],
			slaAdherence: 95.8,
			avgResponseMin: 34,
			warrantyRating: 97.4
		},
		{
			id: 'CREW-03',
			callsign: 'Crew Charlie - Emergency Response',
			accreditation: 'DPWH-IV-A-092',
			classification: 'VRU Vulnerable Road User Hazard Interceptor',
			specialization: '24/7 Deep Crater Barricading, High-Vis Two-Wheeler Transition Ramps',
			lead: 'Field Foreman Vicente Ramos',
			supervisor: 'Safety Marshal Gary Alcantara',
			contact: '+63 (049) 501-4425',
			teamSize: 6,
			corridorId: 'CORR-03',
			corridorName: 'Quezon Ave – Bubukal Student Corridor',
			status: 'ACTIVE_REPAIR',
			statusLabel: 'Active Patching',
			activeWorkOrder: 'TKT-7814 — Bubukal Drainage Edge Breakdown',
			assignedMachinery: ['Asphalt Roller #03', 'Emergency Bitumen Sprayer'],
			slaAdherence: 99.2,
			avgResponseMin: 14,
			warrantyRating: 98.8
		},
		{
			id: 'CREW-04',
			callsign: 'Crew Delta - Rural Pavement Works',
			accreditation: 'DPWH-R4A-2023-D44',
			classification: 'Secondary Feeder & Concrete-Asphalt Transition Unit',
			specialization: 'Aggregate Base Stabilization, Drainage Culvert Apron Infill',
			lead: 'Foreman Rogelio Cruz',
			supervisor: 'Inspector Ramon Tan',
			contact: '+63 (049) 501-4431',
			teamSize: 7,
			corridorId: 'CORR-04',
			corridorName: 'San Pablo Norte Lakefront Bypass',
			status: 'STANDBY',
			statusLabel: 'Depot Standby',
			activeWorkOrder: 'Scheduled Inspection Patrol',
			assignedMachinery: ['Skid Steer Loader #05', 'Flatbed Utility Rig'],
			slaAdherence: 94.2,
			avgResponseMin: 28,
			warrantyRating: 96.0
		}
	]);

	// Heavy Machinery Readiness Matrix
	// Explicitly requiring:
	// - Vibratory Plate Compactor: 'Available (Depot HQ)'
	// - Tack Tanker: 'En Route (National Highway)'
	// - Asphalt Cold Planer: 'Standby / Scheduled'
	// - Asphalt Roller: 'Active Repair (Pedro Guevara Ave)'
	let machineryList = $state<HeavyMachinery[]>([
		{
			id: 'EQ-01',
			tag: 'EQ-VPC-88',
			name: 'Vibratory Plate Compactor',
			category: 'Vibratory Compaction',
			model: 'Bomag BVP 18/45 (18 kN Centrifugal / 450mm Base)',
			status: 'Available (Depot HQ)',
			statusCode: 'AVAILABLE',
			location: 'Santa Cruz Central Depot HQ (Bay 3)',
			health: 98,
			engineHours: 420,
			assignedCrew: 'Available for Immediate Dispatch',
			operator: 'Certified Operator P. David',
			fuelLevel: 94
		},
		{
			id: 'EQ-02',
			tag: 'EQ-TNK-02',
			name: 'Tack Tanker',
			category: 'Bituminous Tack Sprayer',
			model: 'Isuzu FTR 4,000L Heated Emulsion Distributor (SS-1h)',
			status: 'En Route (National Highway)',
			statusCode: 'EN_ROUTE',
			location: 'National Highway, Km 84+200 (Northbound)',
			health: 94,
			engineHours: 1140,
			assignedCrew: 'Crew Bravo - South Milling',
			operator: 'Senior Driver R. Gonzales',
			fuelLevel: 82
		},
		{
			id: 'EQ-03',
			tag: 'EQ-ACP-04',
			name: 'Asphalt Cold Planer',
			category: 'Pavement Milling & Scarification',
			model: 'Wirtgen W 100 Fi (1.0m Milling Drum / Tier 4f)',
			status: 'Standby / Scheduled',
			statusCode: 'STANDBY',
			location: 'Pagsanjan Maintenance Yard (Staging Area B)',
			health: 96,
			engineHours: 890,
			assignedCrew: 'Crew Delta - Rural Pavement Works',
			operator: 'Specialist Operator B. Dimaculangan',
			fuelLevel: 89
		},
		{
			id: 'EQ-04',
			tag: 'EQ-ROL-03',
			name: 'Asphalt Roller',
			category: 'Tandem Vibratory Steel Roller',
			model: 'Dynapac CC1200 VI (2.6 Metric Ton / Double Drum)',
			status: 'Active Repair (Pedro Guevara Ave)',
			statusCode: 'ACTIVE_REPAIR',
			location: 'Pedro Guevara Ave, Km 87+400 (Poblacion)',
			health: 91,
			engineHours: 1650,
			assignedCrew: 'Crew Alpha - Rapid Patch',
			operator: 'Foreman Arnel Mendoza',
			fuelLevel: 75
		},
		{
			id: 'EQ-05',
			tag: 'EQ-SKD-05',
			name: 'Skid Steer Cold Milling Loader',
			category: 'Auxiliary Trench Planer',
			model: 'Bobcat S770 with 450mm Planer Attachment',
			status: 'Available (Depot HQ)',
			statusCode: 'AVAILABLE',
			location: 'Santa Cruz Central Depot HQ (Bay 1)',
			health: 97,
			engineHours: 610,
			assignedCrew: 'Available for Immediate Dispatch',
			operator: 'Operator C. Macaraeg',
			fuelLevel: 90
		}
	]);

	// Filter & Search State
	let searchQuery = $state('');
	let crewFilter = $state<'ALL' | 'ACTIVE_REPAIR' | 'MOBILIZING' | 'STANDBY'>('ALL');
	let machineryFilter = $state<'ALL' | 'AVAILABLE' | 'EN_ROUTE' | 'STANDBY' | 'ACTIVE_REPAIR'>('ALL');

	// Reassignment Modal State
	let isReassignModalOpen = $state(false);
	let selectedCrewForReassign = $state<AsphaltCrew | null>(null);
	let targetCorridorId = $state<string>('CORR-01');
	let reassignPriority = $state<'STANDARD' | 'PRIORITY' | 'EMERGENCY_VRU'>('PRIORITY');
	let dispatchNotes = $state<string>('');
	let attachPlateCompactor = $state(false);
	let attachTackTanker = $state(false);
	let isReassigning = $state(false);

	// Success Feedback Banner
	let successBanner = $state<{
		show: boolean;
		crewName: string;
		corridorName: string;
		timestamp: string;
		note?: string;
	} | null>(null);

	// Derived crew roster
	const filteredCrews = $derived(
		crews.filter((crew) => {
			const matchesFilter = crewFilter === 'ALL' || crew.status === crewFilter;
			const query = searchQuery.trim().toLowerCase();
			const matchesQuery =
				!query ||
				crew.callsign.toLowerCase().includes(query) ||
				crew.accreditation.toLowerCase().includes(query) ||
				crew.corridorName.toLowerCase().includes(query) ||
				crew.lead.toLowerCase().includes(query) ||
				crew.activeWorkOrder.toLowerCase().includes(query);
			return matchesFilter && matchesQuery;
		})
	);

	// Derived machinery list
	const filteredMachinery = $derived(
		machineryList.filter((m) => {
			return machineryFilter === 'ALL' || m.statusCode === machineryFilter;
		})
	);

	// Total Metrics
	const activeCrewCount = $derived(crews.filter((c) => c.status === 'ACTIVE_REPAIR').length);
	const mobilizingCrewCount = $derived(crews.filter((c) => c.status === 'MOBILIZING').length);
	const standbyCrewCount = $derived(crews.filter((c) => c.status === 'STANDBY').length);
	const operationalMachineryCount = $derived(machineryList.filter((m) => m.health >= 90).length);

	function openReassignModal(crew?: AsphaltCrew) {
		selectedCrewForReassign = crew || crews[0];
		targetCorridorId = selectedCrewForReassign.corridorId;
		reassignPriority = 'PRIORITY';
		dispatchNotes = `Reassigned for preventative asphalt patching under DPWH Laguna 2nd District maintenance directive.`;
		attachPlateCompactor = false;
		attachTackTanker = false;
		isReassignModalOpen = true;
	}

	function confirmReassignment() {
		const targetCrew = selectedCrewForReassign;
		if (!targetCrew) return;
		isReassigning = true;

		const targetCorridor = SANTA_CRUZ_CORRIDORS.find((c) => c.id === targetCorridorId);
		const corridorName = targetCorridor ? targetCorridor.name : targetCorridorId;

		setTimeout(() => {
			// Update Crew In State
			crews = crews.map((c) => {
				if (c.id === targetCrew.id) {
					return {
						...c,
						corridorId: targetCorridorId,
						corridorName,
						status: 'MOBILIZING',
						statusLabel: 'Mobilizing to ' + corridorName.split(' ')[0],
						activeWorkOrder: `DISPATCH-${Date.now().toString().slice(-4)} — ${corridorName}`,
						assignedMachinery: [
							...c.assignedMachinery.filter(
								(m) => !m.includes('Compactor') && !m.includes('Tack Tanker')
							),
							...(attachPlateCompactor ? ['Vibratory Plate Compactor #01'] : []),
							...(attachTackTanker ? ['Tack Tanker #02'] : [])
						]
					};
				}
				return c;
			});

			// If machinery was attached, update machinery state
			if (attachPlateCompactor) {
				machineryList = machineryList.map((m) => {
					if (m.name.includes('Vibratory Plate Compactor')) {
						return {
							...m,
							status: `En Route (${corridorName})`,
							statusCode: 'EN_ROUTE',
							location: `${corridorName} (Dispatched with ${targetCrew.callsign.split(' - ')[0]})`,
							assignedCrew: targetCrew.callsign
						};
					}
					return m;
				});
			}

			if (attachTackTanker) {
				machineryList = machineryList.map((m) => {
					if (m.name.includes('Tack Tanker')) {
						return {
							...m,
							status: `En Route (${corridorName})`,
							statusCode: 'EN_ROUTE',
							location: `${corridorName} (Mobilizing)`,
							assignedCrew: targetCrew.callsign
						};
					}
					return m;
				});
			}

			// Trigger feedback banner
			successBanner = {
				show: true,
				crewName: targetCrew.callsign,
				corridorName,
				timestamp: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
				note: dispatchNotes
			};

			isReassigning = false;
			isReassignModalOpen = false;
		}, 300);
	}

	function getStatusBadgeClass(status: AsphaltCrew['status']): string {
		switch (status) {
			case 'ACTIVE_REPAIR':
				return 'bg-primary text-primary-foreground font-semibold border-primary';
			case 'MOBILIZING':
				return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
			case 'STANDBY':
				return 'bg-secondary text-secondary-foreground border-border';
			case 'SCHEDULED':
				return 'bg-muted text-muted-foreground border-border';
			default:
				return 'bg-secondary text-foreground border-border';
		}
	}

	function getMachineryBadgeClass(status: HeavyMachinery['statusCode']): string {
		switch (status) {
			case 'AVAILABLE':
				return 'bg-secondary text-foreground border-border';
			case 'EN_ROUTE':
				return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
			case 'ACTIVE_REPAIR':
				return 'bg-primary text-primary-foreground border-primary font-medium';
			case 'STANDBY':
				return 'bg-muted text-muted-foreground border-border';
			default:
				return 'bg-secondary text-foreground border-border';
		}
	}
</script>

<svelte:head>
	<title>Contractors & Heavy Equipment — SuriOS</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
	<!-- Page Header with Civic Identity -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
		<div class="space-y-1.5">
			<div class="flex items-center gap-2">
				<Badge variant="outline" class="text-xs font-mono border-border">
					DPWH Laguna 2nd District
				</Badge>
				<span class="text-xs text-muted-foreground">Municipal Works & Machinery Registry</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
				<TruckIcon class="h-6 w-6 text-primary shrink-0" />
				Contractors & Heavy Equipment Directory
			</h1>
			<p class="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
				DPWH-accredited asphalt paving roster, heavy machinery readiness telemetry, and municipal corridor reassignment for Santa Cruz, Laguna.
			</p>
		</div>

		<!-- Quick Action CTAs including Direct Map Routing -->
		<div class="flex flex-wrap items-center gap-2.5">
			<a href="/" class="inline-flex">
				<Button variant="outline" class="text-xs h-9 border-border gap-1.5 shadow-none">
					<NavigationIcon class="h-3.5 w-3.5 text-primary" />
					<span>Map Routing Feed</span>
					<ArrowUpRightIcon class="h-3.5 w-3.5 text-muted-foreground" />
				</Button>
			</a>
			<Button
				onclick={() => openReassignModal()}
				class="text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-none"
			>
				<RouteIcon class="h-3.5 w-3.5" />
				<span>Reassign Corridor</span>
			</Button>
		</div>
	</div>

	<!-- Interactive Success Alert Banner -->
	{#if successBanner?.show}
		<Alert class="border border-border bg-card shadow-none">
			<CheckCircleIcon class="h-4 w-4 text-primary shrink-0 mt-0.5" />
			<div class="space-y-1 flex-1">
				<AlertTitle class="text-sm font-semibold text-foreground flex items-center justify-between">
					<span>Corridor Reassignment Confirmed</span>
					<span class="text-xs font-mono text-muted-foreground font-normal">{successBanner.timestamp}</span>
				</AlertTitle>
				<AlertDescription class="text-xs text-muted-foreground">
					<strong>{successBanner.crewName}</strong> has been successfully mobilized to <strong>{successBanner.corridorName}</strong>. Pavement telemetry and GPS tracking updated.
					{#if successBanner.note}
						<div class="mt-1 text-[11px] font-mono text-muted-foreground/90">
							Dispatch Note: {successBanner.note}
						</div>
					{/if}
				</AlertDescription>
			</div>
			<Button
				variant="ghost"
				size="icon-sm"
				class="h-7 w-7 text-muted-foreground hover:text-foreground"
				onclick={() => (successBanner = null)}
			>
				<span class="text-xs font-mono">✕</span>
			</Button>
		</Alert>
	{/if}

	<!-- Section 1: KPI Telemetry Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- KPI 1: Active Crews -->
		<Card class="border border-border bg-card shadow-none">
			<CardHeader class="pb-2">
				<div class="flex items-center justify-between">
					<CardDescription class="text-xs font-medium text-muted-foreground">Active Paving Crews</CardDescription>
					<HardHatIcon class="h-4 w-4 text-primary" />
				</div>
				<CardTitle class="text-2xl font-bold tracking-tight text-foreground font-mono">
					{activeCrewCount + mobilizingCrewCount} <span class="text-xs font-normal text-muted-foreground">/ {crews.length}</span>
				</CardTitle>
			</CardHeader>
			<CardContent class="text-xs text-muted-foreground pt-0">
				<span class="text-foreground font-medium">{activeCrewCount} patching</span>, {mobilizingCrewCount} en route, {standbyCrewCount} standby
			</CardContent>
		</Card>

		<!-- KPI 2: Heavy Machinery Readiness -->
		<Card class="border border-border bg-card shadow-none">
			<CardHeader class="pb-2">
				<div class="flex items-center justify-between">
					<CardDescription class="text-xs font-medium text-muted-foreground">Machinery Readiness</CardDescription>
					<TruckIcon class="h-4 w-4 text-primary" />
				</div>
				<CardTitle class="text-2xl font-bold tracking-tight text-foreground font-mono">
					{operationalMachineryCount} <span class="text-xs font-normal text-muted-foreground">/ {machineryList.length} Units</span>
				</CardTitle>
			</CardHeader>
			<CardContent class="text-xs text-muted-foreground pt-0">
				Compactors, planers & rollers 100% operational
			</CardContent>
		</Card>

		<!-- KPI 3: Average Emergency SLA -->
		<Card class="border border-border bg-card shadow-none">
			<CardHeader class="pb-2">
				<div class="flex items-center justify-between">
					<CardDescription class="text-xs font-medium text-muted-foreground">Emergency Response SLA</CardDescription>
					<ClockIcon class="h-4 w-4 text-primary" />
				</div>
				<CardTitle class="text-2xl font-bold tracking-tight text-foreground font-mono">
					23.4 <span class="text-xs font-normal text-muted-foreground">mins</span>
				</CardTitle>
			</CardHeader>
			<CardContent class="text-xs text-muted-foreground pt-0">
				<span class="text-foreground font-medium">96.9%</span> adherence to 45m municipal SLA
			</CardContent>
		</Card>

		<!-- KPI 4: 1-Year Patch Warranty -->
		<Card class="border border-border bg-card shadow-none">
			<CardHeader class="pb-2">
				<div class="flex items-center justify-between">
					<CardDescription class="text-xs font-medium text-muted-foreground">Patch Warranty Audit</CardDescription>
					<ShieldCheckIcon class="h-4 w-4 text-primary" />
				</div>
				<CardTitle class="text-2xl font-bold tracking-tight text-foreground font-mono">
					97.8% <span class="text-xs font-normal text-muted-foreground">Passed</span>
				</CardTitle>
			</CardHeader>
			<CardContent class="text-xs text-muted-foreground pt-0">
				Zero void subsidence after 12 months (ASTM D6433)
			</CardContent>
		</Card>
	</div>

	<!-- Section 2: Active Crew Assignment & Corridor Reassignment Command Card -->
	<Card class="border border-border bg-card shadow-none">
		<CardHeader class="pb-4 border-b border-border">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<div class="flex items-center gap-2">
						<Badge variant="outline" class="text-[10px] font-mono border-border">
							Orchestrator Canvas
						</Badge>
						<span class="text-xs text-muted-foreground">Municipal Road Corridors</span>
					</div>
					<CardTitle class="text-base font-semibold text-foreground mt-1">
						Corridor Allocation & Real-Time Deployment Status
					</CardTitle>
					<CardDescription class="text-xs mt-0.5">
						Active arterial assignments across Santa Cruz, Laguna. Reassign teams directly to mitigate severe two-wheeler road hazards.
					</CardDescription>
				</div>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						class="text-xs h-8 border-border shadow-none gap-1.5"
						onclick={() => openReassignModal()}
					>
						<RouteIcon class="h-3.5 w-3.5 text-primary" />
						<span>Quick Reassign</span>
					</Button>
					<a href="/">
						<Button variant="secondary" class="text-xs h-8 border border-border shadow-none gap-1.5">
							<NavigationIcon class="h-3.5 w-3.5" />
							<span>Live GIS Routing</span>
						</Button>
					</a>
				</div>
			</div>
		</CardHeader>

		<CardContent class="p-4 sm:p-6 space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
				{#each SANTA_CRUZ_CORRIDORS.slice(0, 3) as corridor}
					{@const assignedToCorridor = crews.filter((c) => c.corridorId === corridor.id)}
					<div class="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-2">
						<div class="flex items-center justify-between">
							<span class="text-xs font-semibold text-foreground">{corridor.name}</span>
							<Badge variant="outline" class="text-[10px] font-mono border-border">
								PCI: {corridor.pci}
							</Badge>
						</div>
						<div class="text-[11px] text-muted-foreground flex items-center gap-1.5">
							<MapPinIcon class="h-3 w-3 text-primary shrink-0" />
							<span class="truncate">{corridor.classification} • {corridor.lengthKm}</span>
						</div>
						<Separator class="my-1.5" />
						<div class="space-y-1">
							<div class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
								Assigned Contractor Units:
							</div>
							{#if assignedToCorridor.length > 0}
								{#each assignedToCorridor as c}
									<div class="flex items-center justify-between text-xs py-0.5">
										<span class="font-medium text-foreground">{c.callsign.split(' - ')[0]}</span>
										<Badge variant="secondary" class="text-[10px] py-0 px-1.5 border-border">
											{c.statusLabel}
										</Badge>
									</div>
								{/each}
							{:else}
								<div class="text-xs text-muted-foreground italic py-0.5 flex items-center justify-between">
									<span>No active crew</span>
									<button
										class="text-[10px] text-primary hover:underline font-mono"
										onclick={() => {
											targetCorridorId = corridor.id;
											openReassignModal();
										}}
									>
										+ Assign
									</button>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- Section 3: Heavy Machinery Readiness Matrix -->
	<div class="space-y-4">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<div>
				<div class="flex items-center gap-2">
					<Badge variant="outline" class="text-[10px] font-mono border-border">
						Fleet Telemetry
					</Badge>
					<span class="text-xs text-muted-foreground">Municipal Heavy Equipment</span>
				</div>
				<h2 class="text-lg font-bold tracking-tight text-foreground mt-1 flex items-center gap-2">
					<WrenchIcon class="h-4 w-4 text-primary" />
					Heavy Machinery Readiness Matrix
				</h2>
			</div>

			<!-- Machinery Filter Tabs -->
			<div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
				<Button
					variant={machineryFilter === 'ALL' ? 'default' : 'outline'}
					size="sm"
					class="text-xs h-7 px-2.5 shadow-none"
					onclick={() => (machineryFilter = 'ALL')}
				>
					All ({machineryList.length})
				</Button>
				<Button
					variant={machineryFilter === 'AVAILABLE' ? 'default' : 'outline'}
					size="sm"
					class="text-xs h-7 px-2.5 shadow-none"
					onclick={() => (machineryFilter = 'AVAILABLE')}
				>
					Available HQ
				</Button>
				<Button
					variant={machineryFilter === 'EN_ROUTE' ? 'default' : 'outline'}
					size="sm"
					class="text-xs h-7 px-2.5 shadow-none"
					onclick={() => (machineryFilter = 'EN_ROUTE')}
				>
					En Route
				</Button>
				<Button
					variant={machineryFilter === 'ACTIVE_REPAIR' ? 'default' : 'outline'}
					size="sm"
					class="text-xs h-7 px-2.5 shadow-none"
					onclick={() => (machineryFilter = 'ACTIVE_REPAIR')}
				>
					Active Repair
				</Button>
				<Button
					variant={machineryFilter === 'STANDBY' ? 'default' : 'outline'}
					size="sm"
					class="text-xs h-7 px-2.5 shadow-none"
					onclick={() => (machineryFilter = 'STANDBY')}
				>
					Standby
				</Button>
			</div>
		</div>

		<!-- Machinery Cards Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each filteredMachinery as machine}
				<Card class="border border-border bg-card shadow-none flex flex-col justify-between">
					<CardHeader class="pb-3">
						<div class="flex items-center justify-between gap-2">
							<span class="text-xs font-mono text-muted-foreground">{machine.tag}</span>
							<Badge variant="outline" class="text-[10px] font-mono {getMachineryBadgeClass(machine.statusCode)}">
								{machine.status}
							</Badge>
						</div>
						<CardTitle class="text-sm font-bold text-foreground mt-1">
							{machine.name}
						</CardTitle>
						<CardDescription class="text-xs line-clamp-1">
							{machine.model}
						</CardDescription>
					</CardHeader>

					<CardContent class="space-y-2.5 text-xs text-muted-foreground pt-0 pb-3 flex-1">
						<div class="space-y-1">
							<div class="flex items-center justify-between text-[11px]">
								<span class="text-muted-foreground">Location</span>
								<span class="text-foreground font-medium truncate max-w-[150px]">{machine.location}</span>
							</div>
							<div class="flex items-center justify-between text-[11px]">
								<span class="text-muted-foreground">Operator</span>
								<span class="text-foreground font-medium truncate max-w-[150px]">{machine.operator}</span>
							</div>
							<div class="flex items-center justify-between text-[11px]">
								<span class="text-muted-foreground">Assigned Crew</span>
								<span class="text-foreground font-medium truncate max-w-[150px]">{machine.assignedCrew}</span>
							</div>
						</div>

						<Separator class="my-2" />

						<div class="grid grid-cols-2 gap-2 text-[11px] font-mono">
							<div class="p-1.5 rounded-lg bg-secondary/50 border border-border">
								<div class="text-[10px] text-muted-foreground">ENGINE HRS</div>
								<div class="font-bold text-foreground">{machine.engineHours} hrs</div>
							</div>
							<div class="p-1.5 rounded-lg bg-secondary/50 border border-border">
								<div class="text-[10px] text-muted-foreground">FUEL / BATTERY</div>
								<div class="font-bold text-foreground">{machine.fuelLevel}%</div>
							</div>
						</div>
					</CardContent>

					<CardFooter class="pt-0 border-t border-border p-3 flex items-center justify-between bg-secondary/15">
						<span class="text-[10px] text-muted-foreground font-mono">
							Health: {machine.health}%
						</span>
						<a
							href="/?focus={machine.tag}"
							class="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
						>
							<span>Track on Map</span>
							<ArrowUpRightIcon class="h-3 w-3" />
						</a>
					</CardFooter>
				</Card>
			{/each}
		</div>
	</div>

	<!-- Section 4: DPWH-Accredited Asphalt Paving Crew Roster -->
	<div class="space-y-4">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<div>
				<div class="flex items-center gap-2">
					<Badge variant="outline" class="text-[10px] font-mono border-border">
						Accredited Roster
					</Badge>
					<span class="text-xs text-muted-foreground">DPWH Standard Paving Contractors</span>
				</div>
				<h2 class="text-lg font-bold tracking-tight text-foreground mt-1 flex items-center gap-2">
					<HardHatIcon class="h-4 w-4 text-primary" />
					DPWH-Accredited Asphalt Paving Crew Roster
				</h2>
			</div>

			<!-- Search & Filter Controls -->
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
				<div class="relative w-full sm:w-60">
					<SearchIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search crew, lead, or corridor..."
						class="text-xs pl-8 h-8 bg-card border-border shadow-none"
						bind:value={searchQuery}
					/>
				</div>

				<div class="flex items-center gap-1">
					<Button
						variant={crewFilter === 'ALL' ? 'default' : 'outline'}
						size="sm"
						class="text-xs h-8 px-2.5 shadow-none"
						onclick={() => (crewFilter = 'ALL')}
					>
						All
					</Button>
					<Button
						variant={crewFilter === 'ACTIVE_REPAIR' ? 'default' : 'outline'}
						size="sm"
						class="text-xs h-8 px-2.5 shadow-none"
						onclick={() => (crewFilter = 'ACTIVE_REPAIR')}
					>
						Active
					</Button>
					<Button
						variant={crewFilter === 'MOBILIZING' ? 'default' : 'outline'}
						size="sm"
						class="text-xs h-8 px-2.5 shadow-none"
						onclick={() => (crewFilter = 'MOBILIZING')}
					>
						En Route
					</Button>
					<Button
						variant={crewFilter === 'STANDBY' ? 'default' : 'outline'}
						size="sm"
						class="text-xs h-8 px-2.5 shadow-none"
						onclick={() => (crewFilter = 'STANDBY')}
					>
						Standby
					</Button>
				</div>
			</div>
		</div>

		<!-- Crew Cards List -->
		<div class="space-y-4">
			{#if filteredCrews.length === 0}
				<Card class="border border-border bg-card shadow-none p-8 text-center space-y-2">
					<p class="text-sm font-medium text-foreground">No paving crews match your search filter.</p>
					<p class="text-xs text-muted-foreground">Try clearing the search query or changing the status filter.</p>
					<Button
						variant="outline"
						size="sm"
						class="text-xs border-border shadow-none mt-2"
						onclick={() => {
							searchQuery = '';
							crewFilter = 'ALL';
						}}
					>
						Reset Filters
					</Button>
				</Card>
			{:else}
				{#each filteredCrews as crew}
					<Card class="border border-border bg-card shadow-none hover:border-foreground/20 transition-colors">
						<CardContent class="p-5 sm:p-6 space-y-4">
							<!-- Crew Top Row -->
							<div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
								<div class="space-y-1">
									<div class="flex flex-wrap items-center gap-2">
										<h3 class="text-base font-bold text-foreground">
											{crew.callsign}
										</h3>
										<Badge variant="outline" class="text-[10px] font-mono border-border">
											{crew.accreditation}
										</Badge>
										<Badge variant="outline" class="text-[10px] font-mono {getStatusBadgeClass(crew.status)}">
											{crew.statusLabel}
										</Badge>
									</div>
									<p class="text-xs text-muted-foreground">
										{crew.classification} • {crew.specialization}
									</p>
								</div>

								<!-- Interactive Reassign Corridor Button & Map Link -->
								<div class="flex items-center gap-2 self-start md:self-auto">
									<a href="/?corridor={crew.corridorId}">
										<Button
											variant="outline"
											size="sm"
											class="text-xs h-8 border-border shadow-none gap-1.5"
										>
											<NavigationIcon class="h-3 w-3 text-primary" />
											<span>Track on Map</span>
										</Button>
									</a>
									<Button
										variant="default"
										size="sm"
										class="text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-none gap-1.5"
										onclick={() => openReassignModal(crew)}
									>
										<RouteIcon class="h-3 w-3" />
										<span>Reassign Corridor</span>
									</Button>
								</div>
							</div>

							<Separator />

							<!-- Detailed Grid for Personnel, Corridors, Machinery & SLA -->
							<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
								<!-- Column 1: Corridor & Current Ticket -->
								<div class="space-y-1">
									<span class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
										Assigned Corridor & Ticket
									</span>
									<div class="font-medium text-foreground flex items-center gap-1.5">
										<MapPinIcon class="h-3.5 w-3.5 text-primary shrink-0" />
										<span class="truncate">{crew.corridorName}</span>
									</div>
									<div class="text-[11px] text-muted-foreground font-mono truncate">
										{crew.activeWorkOrder}
									</div>
								</div>

								<!-- Column 2: Crew Personnel & Lead -->
								<div class="space-y-1">
									<span class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
										Field Leadership ({crew.teamSize} personnel)
									</span>
									<div class="font-medium text-foreground truncate">
										{crew.lead}
									</div>
									<div class="text-[11px] text-muted-foreground truncate">
										{crew.supervisor}
									</div>
								</div>

								<!-- Column 3: Machinery Attached -->
								<div class="space-y-1">
									<span class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
										Allocated Machinery
									</span>
									<div class="flex flex-wrap gap-1 pt-0.5">
										{#each crew.assignedMachinery as eq}
											<Badge variant="secondary" class="text-[10px] font-normal border-border">
												{eq}
											</Badge>
										{/each}
									</div>
								</div>

								<!-- Column 4: SLA Performance -->
								<div class="space-y-1">
									<span class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
										SLA & Quality Benchmark
									</span>
									<div class="flex items-center gap-3 font-mono text-[11px]">
										<div>
											<span class="text-muted-foreground">SLA:</span>
											<span class="font-bold text-foreground ml-1">{crew.slaAdherence}%</span>
										</div>
										<div>
											<span class="text-muted-foreground">Avg:</span>
											<span class="font-bold text-foreground ml-1">{crew.avgResponseMin}m</span>
										</div>
										<div>
											<span class="text-muted-foreground">Warranty:</span>
											<span class="font-bold text-foreground ml-1">{crew.warrantyRating}%</span>
										</div>
									</div>
									<div class="text-[10px] text-muted-foreground">
										Emergency response priority ready
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				{/each}
			{/if}
		</div>
	</div>
</div>

<!-- Interactive 'Reassign Corridor' Modal Dialog -->
<Dialog bind:open={isReassignModalOpen}>
	<DialogContent class="max-w-lg bg-card text-card-foreground border-border shadow-none">
		<DialogHeader>
			<div class="flex items-center gap-2">
				<Badge variant="outline" class="text-[10px] font-mono border-border">
					Municipal Dispatch Order
				</Badge>
				<span class="text-xs text-muted-foreground">DPWH Laguna 2nd District</span>
			</div>
			<DialogTitle class="text-base font-bold text-foreground mt-1">
				Reassign Maintenance Corridor
			</DialogTitle>
			<DialogDescription class="text-xs text-muted-foreground">
				Transfer active contractor crews and heavy equipment to high-priority road corridors or urgent Two-Wheeler hazard locations.
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4 py-2 text-xs">
			<!-- Selected Crew Info -->
			<div class="p-3 rounded-lg border border-border bg-secondary/30 space-y-1">
				<div class="flex items-center justify-between">
					<span class="font-bold text-foreground text-sm">
						{selectedCrewForReassign?.callsign}
					</span>
					<Badge variant="outline" class="text-[10px] font-mono border-border">
						{selectedCrewForReassign?.accreditation}
					</Badge>
				</div>
				<div class="text-muted-foreground">
					Current Assignment: <span class="font-medium text-foreground">{selectedCrewForReassign?.corridorName}</span>
				</div>
			</div>

			<!-- Target Corridor Selector -->
			<div class="space-y-1.5">
				<label for="corridor-select" class="block font-semibold text-foreground text-xs">
					Select Destination Corridor:
				</label>
				<select
					id="corridor-select"
					bind:value={targetCorridorId}
					class="w-full h-9 rounded-lg border border-border bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
				>
					{#each SANTA_CRUZ_CORRIDORS as corridor}
						<option value={corridor.id}>
							{corridor.name} (PCI: {corridor.pci} — {corridor.status})
						</option>
					{/each}
				</select>
			</div>

			<!-- Urgency Priority Selector -->
			<div class="space-y-1.5">
				<span class="block font-semibold text-foreground text-xs">
					Dispatch Urgency Level:
				</span>
				<div class="grid grid-cols-3 gap-2">
					<button
						type="button"
						class="p-2 rounded-lg border text-center transition-colors {reassignPriority === 'STANDARD' ? 'border-primary bg-primary/10 font-bold text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'}"
						onclick={() => (reassignPriority = 'STANDARD')}
					>
						Standard
					</button>
					<button
						type="button"
						class="p-2 rounded-lg border text-center transition-colors {reassignPriority === 'PRIORITY' ? 'border-primary bg-primary/10 font-bold text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'}"
						onclick={() => (reassignPriority = 'PRIORITY')}
					>
						Priority
					</button>
					<button
						type="button"
						class="p-2 rounded-lg border text-center transition-colors {reassignPriority === 'EMERGENCY_VRU' ? 'border-destructive bg-destructive/10 font-bold text-destructive' : 'border-border bg-card text-muted-foreground hover:text-foreground'}"
						onclick={() => (reassignPriority = 'EMERGENCY_VRU')}
					>
						Emergency VRU
					</button>
				</div>
			</div>

			<!-- Machinery Attachment Checkboxes -->
			<div class="space-y-2">
				<span class="block font-semibold text-foreground text-xs">
					Deploy Supporting Heavy Equipment:
				</span>
				<div class="space-y-2">
					<label class="flex items-center gap-2 p-2 rounded-lg border border-border bg-background cursor-pointer hover:bg-secondary/40 transition-colors">
						<input
							type="checkbox"
							bind:checked={attachPlateCompactor}
							class="rounded border-border text-primary focus:ring-primary"
						/>
						<div class="flex-1">
							<span class="font-medium text-foreground">Attach Vibratory Plate Compactor #01</span>
							<p class="text-[11px] text-muted-foreground">Currently: Available (Depot HQ)</p>
						</div>
					</label>

					<label class="flex items-center gap-2 p-2 rounded-lg border border-border bg-background cursor-pointer hover:bg-secondary/40 transition-colors">
						<input
							type="checkbox"
							bind:checked={attachTackTanker}
							class="rounded border-border text-primary focus:ring-primary"
						/>
						<div class="flex-1">
							<span class="font-medium text-foreground">Attach Tack Tanker #02</span>
							<p class="text-[11px] text-muted-foreground">Currently: En Route (National Highway)</p>
						</div>
					</label>
				</div>
			</div>

			<!-- Dispatch Notes Input -->
			<div class="space-y-1.5">
				<label for="dispatch-notes" class="block font-semibold text-foreground text-xs">
					Dispatch Order Notes (Official Manifest):
				</label>
				<Input
					id="dispatch-notes"
					type="text"
					placeholder="Enter specific repair directives or hazard IDs..."
					class="text-xs h-8 bg-background border-border shadow-none"
					bind:value={dispatchNotes}
				/>
			</div>
		</div>

		<DialogFooter class="gap-2 sm:gap-0 pt-2 border-t border-border">
			<Button
				variant="outline"
				size="sm"
				class="text-xs border-border shadow-none"
				onclick={() => (isReassignModalOpen = false)}
			>
				Cancel
			</Button>
			<Button
				variant="default"
				size="sm"
				class="text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-none gap-1.5"
				disabled={isReassigning}
				onclick={confirmReassignment}
			>
				{#if isReassigning}
					<RefreshCwIcon class="h-3 w-3 animate-spin" />
					<span>Mobilizing...</span>
				{:else}
					<CheckCircleIcon class="h-3 w-3" />
					<span>Authorize Reassignment</span>
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
