<script lang="ts">
	import type { PageProps } from './$types.js';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import TrendingDownIcon from '@lucide/svelte/icons/trending-down';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import CloudRainIcon from '@lucide/svelte/icons/cloud-rain';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import ArrowDownRightIcon from '@lucide/svelte/icons/arrow-down-right';
	import GaugeIcon from '@lucide/svelte/icons/gauge';
	import CalculatorIcon from '@lucide/svelte/icons/calculator';
	import TruckIcon from '@lucide/svelte/icons/truck';

	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	let { data }: PageProps = $props();

	// -------------------------------------------------------------
	// State 1: Active Corridor & Horizon Filter
	// -------------------------------------------------------------
	type CorridorKey = 'ALL' | 'SANTA_CRUZ' | 'BUBUKAL' | 'PAGSANJAN' | 'GATID';
	let selectedCorridor = $state<CorridorKey>('ALL');
	let timeHorizon = $state<'5Y' | '10Y'>('5Y');

	// -------------------------------------------------------------
	// State 2: Longitudinal Deterioration Curve
	// -------------------------------------------------------------
	interface DecayPoint {
		year: number;
		label: string;
		doNothingPCI: number;
		preservationPCI: number;
		deltaPCI: number;
		civilAction: string;
		budgetImpact: string;
	}

	const decayData: DecayPoint[] = [
		{
			year: 0,
			label: 'Year 0 (Current)',
			doNothingPCI: 49,
			preservationPCI: 49,
			deltaPCI: 0,
			civilAction: 'Baseline Survey: Immediate crack sealing & emergency cold patching',
			budgetImpact: '₱0 baseline'
		},
		{
			year: 1,
			label: 'Year 1 (+12 Mos)',
			doNothingPCI: 41,
			preservationPCI: 64,
			deltaPCI: 23,
			civilAction: 'SuriOS Triage: Thin polymer micro-surfacing (12mm) & joint sealing',
			budgetImpact: '₱285,000 saved'
		},
		{
			year: 2,
			label: 'Year 2 (+24 Mos)',
			doNothingPCI: 32,
			preservationPCI: 61,
			deltaPCI: 29,
			civilAction: 'Scheduled routine inspection & localized tack coat edge sealing',
			budgetImpact: '₱590,000 saved'
		},
		{
			year: 3,
			label: 'Year 3 (+36 Mos)',
			doNothingPCI: 22,
			preservationPCI: 68,
			deltaPCI: 46,
			civilAction: 'Phase 2 preservation: Micro-surfacing slurry re-application',
			budgetImpact: '₱940,000 saved'
		},
		{
			year: 4,
			label: 'Year 4 (+48 Mos)',
			doNothingPCI: 14,
			preservationPCI: 65,
			deltaPCI: 51,
			civilAction: 'Edge drainage culvert reinforcement & raveling mitigation',
			budgetImpact: '₱1,210,000 saved'
		},
		{
			year: 5,
			label: 'Year 5 (+60 Mos)',
			doNothingPCI: 8,
			preservationPCI: 62,
			deltaPCI: 54,
			civilAction: 'Sustained Fair/Good condition. Avoided total PCCP slab demolition',
			budgetImpact: '₱1,420,000 saved'
		}
	];

	let selectedDecayYear = $state<number>(5);
	let activeCurveMode = $state<'BOTH' | 'PRESERVATION' | 'DO_NOTHING'>('BOTH');
	let showCriticalThreshold = $state<boolean>(true);

	const activeDecayPoint = $derived(
		decayData.find((d) => d.year === selectedDecayYear) ?? decayData[5]
	);
	const selectedDecayX = $derived(55 + selectedDecayYear * 118);

	// -------------------------------------------------------------
	// State 3: Monsoon Correlation Data (Rainfall mm vs Potholes)
	// -------------------------------------------------------------
	interface MonsoonMonth {
		month: string;
		name: string;
		rainfallMm: number;
		potholesFormed: number;
		isMonsoonPeak: boolean;
		vruRisk: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
		seasonalNote: string;
		civilAdvisory: string;
	}

	const monsoonHistory: MonsoonMonth[] = [
		{
			month: 'Jan',
			name: 'January',
			rainfallMm: 65,
			potholesFormed: 12,
			isMonsoonPeak: false,
			vruRisk: 'LOW',
			seasonalNote: 'Northeast Monsoon (Amihan) cool dry weather; minimal pavement saturation.',
			civilAdvisory: 'Routine crack filling along Pedro Guevara Ave.'
		},
		{
			month: 'Feb',
			name: 'February',
			rainfallMm: 45,
			potholesFormed: 8,
			isMonsoonPeak: false,
			vruRisk: 'LOW',
			seasonalNote: 'Annual dry baseline low; optimal curing conditions for hot asphalt patching.',
			civilAdvisory: 'Full-depth joint sealing on Bubukal Bypass.'
		},
		{
			month: 'Mar',
			name: 'March',
			rainfallMm: 35,
			potholesFormed: 6,
			isMonsoonPeak: false,
			vruRisk: 'LOW',
			seasonalNote: 'Dry season minimum; subgrade water table is at lowest annual elevation.',
			civilAdvisory: 'Annual ASTM D6433 geodetic corridor baseline audit.'
		},
		{
			month: 'Apr',
			name: 'April',
			rainfallMm: 50,
			potholesFormed: 10,
			isMonsoonPeak: false,
			vruRisk: 'LOW',
			seasonalNote: 'High pavement surface heat (>44°C); thermal expansion of concrete slab joints.',
			civilAdvisory: 'Seal transverse reflection cracks before rain season.'
		},
		{
			month: 'May',
			name: 'May',
			rainfallMm: 145,
			potholesFormed: 24,
			isMonsoonPeak: false,
			vruRisk: 'MODERATE',
			seasonalNote: 'Pre-monsoon thunderstorms initiate surface bitumen stripping.',
			civilAdvisory: 'Drainage culvert silt clearing across Pagsanjan boundary.'
		},
		{
			month: 'Jun',
			name: 'June',
			rainfallMm: 230,
			potholesFormed: 46,
			isMonsoonPeak: false,
			vruRisk: 'HIGH',
			seasonalNote: 'Monsoon onset; moisture penetrates fatigue micro-fissures in sub-base.',
			civilAdvisory: 'Stage emergency cold-mix stockpile at Santa Cruz depot.'
		},
		{
			month: 'Jul',
			name: 'July',
			rainfallMm: 385,
			potholesFormed: 89,
			isMonsoonPeak: true,
			vruRisk: 'CRITICAL',
			seasonalNote: 'Southwest Monsoon (Habagat) heavy rains; hydraulic pumping under heavy trucks.',
			civilAdvisory: 'Daily high-velocity pothole triage; 24h QRU dispatch.'
		},
		{
			month: 'Aug',
			name: 'August',
			rainfallMm: 440,
			potholesFormed: 114,
			isMonsoonPeak: true,
			vruRisk: 'CRITICAL',
			seasonalNote: 'Annual rainfall maximum in Laguna; sub-base water saturation accelerates rutting.',
			civilAdvisory: 'Deploy cold-patching units; barricade waterlogged edge drop-offs.'
		},
		{
			month: 'Sep',
			name: 'September',
			rainfallMm: 395,
			potholesFormed: 98,
			isMonsoonPeak: true,
			vruRisk: 'CRITICAL',
			seasonalNote: 'Typhoon season tropical depressions; high motorcycle skid hazard.',
			civilAdvisory: 'Post VRU safety advisories; priority patch school routes.'
		},
		{
			month: 'Oct',
			name: 'October',
			rainfallMm: 315,
			potholesFormed: 76,
			isMonsoonPeak: true,
			vruRisk: 'HIGH',
			seasonalNote: 'Late Habagat trailing storms; alligator cracking rapidly expands into deep voids.',
			civilAdvisory: 'Audit patched sections for bitumen wash-out.'
		},
		{
			month: 'Nov',
			name: 'November',
			rainfallMm: 185,
			potholesFormed: 38,
			isMonsoonPeak: false,
			vruRisk: 'MODERATE',
			seasonalNote: 'Post-monsoon transition; water table recedes, defects stabilize.',
			civilAdvisory: 'Permanent hot-mix asphalt overlays over temporary cold patches.'
		},
		{
			month: 'Dec',
			name: 'December',
			rainfallMm: 110,
			potholesFormed: 20,
			isMonsoonPeak: false,
			vruRisk: 'LOW',
			seasonalNote: 'Holiday holiday traffic surge; cool dry conditions resume.',
			civilAdvisory: 'Execute 4th-quarter municipal maintenance sign-offs.'
		}
	];

	let selectedMonthIndex = $state<number>(7); // Default to August (Peak Monsoon)
	const activeMonth = $derived(monsoonHistory[selectedMonthIndex]);

	// -------------------------------------------------------------
	// State 4: Municipal Budget Optimization Simulator
	// -------------------------------------------------------------
	// Base corridor: 42.8 lane-km, ~12,800 m² high-risk surface area
	let simulatedCoveragePct = $state<number>(100); // 40% to 150%

	const baselineSaved = 1420000; // ₱1,420,000
	const dynamicSavedBudget = $derived(
		Math.round((baselineSaved * (simulatedCoveragePct / 100)) / 1000) * 1000
	);

	const preventiveCost = $derived(
		Math.round((1170000 * (simulatedCoveragePct / 100)) / 1000) * 1000
	);
	const reactiveCost = $derived(preventiveCost + dynamicSavedBudget);

	let showCostLedger = $state<boolean>(false);

	// -------------------------------------------------------------
	// State 5: Barangay Hazard Distribution
	// -------------------------------------------------------------
	interface BarangayHazardStat {
		id: string;
		barangay: string;
		corridorType: string;
		networkKm: number;
		avgPCI: number;
		pciStatus: 'Good' | 'Fair' | 'Poor';
		totalHazards: number;
		criticalHazards: number;
		highHazards: number;
		moderateHazards: number;
		lowHazards: number;
		avgSeverityScore: number;
		vruRisk: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
		completedRepairs: number;
		repairRate: number;
		avgResponseDays: number;
		primaryDistress: string;
		assignedCrew: string;
	}

	const barangayStats: BarangayHazardStat[] = [
		{
			id: 'BRGY-SC',
			barangay: 'Santa Cruz (Poblacion)',
			corridorType: 'Commercial Center & LSPU University Arterial',
			networkKm: 14.6,
			avgPCI: 46,
			pciStatus: 'Poor',
			totalHazards: 68,
			criticalHazards: 18,
			highHazards: 24,
			moderateHazards: 16,
			lowHazards: 10,
			avgSeverityScore: 7.8,
			vruRisk: 'CRITICAL',
			completedRepairs: 44,
			repairRate: 64.7,
			avgResponseDays: 3.4,
			primaryDistress: 'Deep Pothole & Edge Breakdown (P. Guevara Ave)',
			assignedCrew: 'Santa Cruz MEO Quick Response Alpha'
		},
		{
			id: 'BRGY-BUB',
			barangay: 'Bubukal',
			corridorType: 'Agricultural Bypass & Heavy Haul Corridor',
			networkKm: 10.2,
			avgPCI: 42,
			pciStatus: 'Poor',
			totalHazards: 49,
			criticalHazards: 16,
			highHazards: 19,
			moderateHazards: 10,
			lowHazards: 4,
			avgSeverityScore: 8.1,
			vruRisk: 'HIGH',
			completedRepairs: 24,
			repairRate: 49.0,
			avgResponseDays: 5.8,
			primaryDistress: 'Alligator Cracking & Heavy Base Rutting',
			assignedCrew: 'DPWH Laguna 2nd District Asphalt Team'
		},
		{
			id: 'BRGY-PAG',
			barangay: 'Pagsanjan',
			corridorType: 'Tourism Gateway & River Crossing Corridor',
			networkKm: 9.8,
			avgPCI: 58,
			pciStatus: 'Fair',
			totalHazards: 38,
			criticalHazards: 6,
			highHazards: 12,
			moderateHazards: 14,
			lowHazards: 6,
			avgSeverityScore: 5.4,
			vruRisk: 'MODERATE',
			completedRepairs: 30,
			repairRate: 78.9,
			avgResponseDays: 2.1,
			primaryDistress: 'Drainage Culvert Overflow & Surface Raveling',
			assignedCrew: 'Pagsanjan Municipal Maintenance Unit'
		},
		{
			id: 'BRGY-GAT',
			barangay: 'Gatid',
			corridorType: 'National Highway Link & Residential Arterial',
			networkKm: 8.2,
			avgPCI: 52,
			pciStatus: 'Fair',
			totalHazards: 32,
			criticalHazards: 5,
			highHazards: 9,
			moderateHazards: 12,
			lowHazards: 6,
			avgSeverityScore: 6.0,
			vruRisk: 'MODERATE',
			completedRepairs: 23,
			repairRate: 71.9,
			avgResponseDays: 2.9,
			primaryDistress: 'Longitudinal Reflection & Transverse Joint Cracks',
			assignedCrew: 'District Highway Patrol Maintenance'
		}
	];

	type SortField = 'severity' | 'repairRate' | 'hazards' | 'pci';
	let sortField = $state<SortField>('severity');
	let sortDirection = $state<'asc' | 'desc'>('desc');
	let searchFilter = $state<string>('');
	let selectedBarangayId = $state<string>('BRGY-SC');
	let dispatchedBarangayId = $state<string | null>(null);

	const sortedBarangays = $derived(
		barangayStats
			.filter(
				(b) =>
					b.barangay.toLowerCase().includes(searchFilter.toLowerCase()) ||
					b.primaryDistress.toLowerCase().includes(searchFilter.toLowerCase())
			)
			.sort((a, b) => {
				let comparison = 0;
				if (sortField === 'severity') {
					comparison = b.avgSeverityScore - a.avgSeverityScore;
				} else if (sortField === 'repairRate') {
					comparison = b.repairRate - a.repairRate;
				} else if (sortField === 'hazards') {
					comparison = b.totalHazards - a.totalHazards;
				} else if (sortField === 'pci') {
					comparison = a.avgPCI - b.avgPCI; // Lowest PCI first by default
				}
				return sortDirection === 'asc' ? -comparison : comparison;
			})
	);

	const selectedBarangay = $derived(
		barangayStats.find((b) => b.id === selectedBarangayId) ?? barangayStats[0]
	);

	function toggleSort(field: SortField) {
		if (sortField === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'desc';
		}
	}

	function handleDispatch(id: string) {
		dispatchedBarangayId = id;
		setTimeout(() => {
			dispatchedBarangayId = null;
		}, 4000);
	}

	let exportNotice = $state<boolean>(false);
	function triggerExport() {
		exportNotice = true;
		setTimeout(() => {
			exportNotice = false;
		}, 3500);
	}

	function formatPesos(num: number): string {
		return '₱' + num.toLocaleString('en-PH');
	}
</script>

<svelte:head>
	<title>Road Degradation Analytics — SuriOS</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
	<!-- Top Navigation & Title Bar -->
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<Badge variant="outline" class="text-xs font-normal border-border">
					Module E · Civil Telemetry
				</Badge>
				<span class="text-xs text-muted-foreground">ASTM D6433 Pavement Management System</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
				<span>Municipal Road Degradation Analytics</span>
			</h1>
			<p class="text-xs sm:text-sm text-muted-foreground">
				Longitudinal Pavement Condition Index (PCI) telemetry, monsoon rainfall impact, and preventive lifecycle cost analysis for Santa Cruz, Laguna.
			</p>
			{#if data?.user}
				<div class="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
					<Badge variant="secondary" class="text-[10px] font-mono px-1.5 py-0 border-border">
						{data.user.role === 'ENGINEER' ? 'Chief Engineer' : data.user.role === 'OFFICER' ? 'Field Inspector' : 'Municipal Staff'}
					</Badge>
					<span>
						Logged in as <strong class="text-foreground font-medium">{data.user.name}</strong>
						{#if data.user.department}
							&bull; {data.user.department}
						{/if}
					</span>
				</div>
			{/if}
		</div>

		<!-- Action Controls -->
		<div class="flex items-center gap-2">
			{#if exportNotice}
				<Badge variant="default" class="text-xs h-8 px-3 animate-in fade-in">
					<CircleCheckIcon class="h-3.5 w-3.5 mr-1" />
					ASTM Report Generated (CSV/PDF)
				</Badge>
			{/if}
			<Button variant="outline" size="sm" class="text-xs h-8" onclick={triggerExport}>
				<DownloadIcon class="h-3.5 w-3.5 mr-1.5" />
				Export ASTM Audit
			</Button>
			<Button size="sm" class="text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90" onclick={() => handleDispatch('BRGY-SC')}>
				<TruckIcon class="h-3.5 w-3.5 mr-1.5" />
				Dispatch QRU Maintenance
			</Button>
		</div>
	</div>

	<!-- 4 Top KPI Cards (Authentic shadcn KPI layout) -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- KPI 1: Network PCI Health -->
		<Card class="border border-border bg-card p-4 space-y-1 shadow-xs">
			<div class="flex items-center justify-between text-muted-foreground text-xs font-medium">
				<span>Network PCI Score</span>
				<GaugeIcon class="h-4 w-4 text-primary" />
			</div>
			<div class="flex items-baseline gap-2">
				<span class="text-3xl font-extrabold text-foreground font-mono">49</span>
				<span class="text-xs text-muted-foreground font-mono">/ 100</span>
			</div>
			<div class="pt-1">
				<Badge variant="outline" class="text-[11px] font-medium border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">
					Poor - Immediate Action Required
				</Badge>
			</div>
			<p class="text-[11px] text-muted-foreground pt-1">
				Weighted across 42.8 km of municipal corridor
			</p>
		</Card>

		<!-- KPI 2: Budget Saved Counter -->
		<Card class="border border-border bg-card p-4 space-y-1 shadow-xs">
			<div class="flex items-center justify-between text-muted-foreground text-xs font-medium">
				<span>Municipal Budget Saved</span>
				<CalculatorIcon class="h-4 w-4 text-primary" />
			</div>
			<div class="flex items-baseline gap-1">
				<span class="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight text-primary">
					{formatPesos(dynamicSavedBudget)}
				</span>
			</div>
			<div class="text-[11px] text-muted-foreground pt-1 flex items-center gap-1">
				<ArrowDownRightIcon class="h-3.5 w-3.5 text-primary shrink-0" />
				<span>Preventive triage vs full-depth slab rebuild</span>
			</div>
			<p class="text-[11px] text-muted-foreground">
				54.8% capital preservation on 42.8 km network
			</p>
		</Card>

		<!-- KPI 3: Monsoon Outbreak Risk -->
		<Card class="border border-border bg-card p-4 space-y-1 shadow-xs">
			<div class="flex items-center justify-between text-muted-foreground text-xs font-medium">
				<span>Monsoon Defect Surge</span>
				<CloudRainIcon class="h-4 w-4 text-primary" />
			</div>
			<div class="flex items-baseline gap-2">
				<span class="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">377</span>
				<span class="text-xs text-muted-foreground">potholes / Q3</span>
			</div>
			<div class="pt-1">
				<Badge variant="outline" class="text-[11px] font-medium border-destructive/40 text-destructive bg-destructive/10">
					+184% Monsoon Outbreak (Jul-Oct)
				</Badge>
			</div>
			<p class="text-[11px] text-muted-foreground pt-1">
				Triggered by Habagat sub-base hydraulic pumping
			</p>
		</Card>

		<!-- KPI 4: Repair Completion SLA -->
		<Card class="border border-border bg-card p-4 space-y-1 shadow-xs">
			<div class="flex items-center justify-between text-muted-foreground text-xs font-medium">
				<span>Network Repair SLA</span>
				<CircleCheckIcon class="h-4 w-4 text-primary" />
			</div>
			<div class="flex items-baseline gap-2">
				<span class="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">64.0%</span>
				<span class="text-xs text-muted-foreground">completed</span>
			</div>
			<div class="pt-1 text-[11px] text-muted-foreground flex items-center gap-1.5">
				<span class="font-mono text-foreground font-medium">121</span> / 187 hazards resolved
			</div>
			<p class="text-[11px] text-muted-foreground pt-1">
				3.6 days average emergency response time
			</p>
		</Card>
	</div>

	<!-- Main Section: Network PCI Gauge & Condition Distribution -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3 border-b border-border">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
				<div>
					<CardTitle class="text-base font-semibold text-foreground flex items-center gap-2">
						<GaugeIcon class="h-4 w-4 text-primary" />
						<span>ASTM D6433 Network PCI Health Gauge & Condition Breakdown</span>
					</CardTitle>
					<CardDescription class="text-xs text-muted-foreground">
						Santa Cruz municipal road network evaluated under ASTM Standard Practice for Pavement Condition Index.
					</CardDescription>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant="outline" class="text-xs font-mono">
						Jurisdiction: Santa Cruz, Laguna
					</Badge>
				</div>
			</div>
		</CardHeader>

		<CardContent class="p-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
				<!-- Left: Semi-Circular SVG Gauge -->
				<div class="lg:col-span-5 flex flex-col items-center justify-center p-4 border border-border rounded-lg bg-secondary/20">
					<div class="relative w-full max-w-[280px] flex flex-col items-center">
						<svg
							viewBox="0 0 280 165"
							class="w-full h-auto overflow-visible"
							role="img"
							aria-label="Pavement Condition Index Dial Gauge"
						>
							<!-- Background Track Arc (0 to 100) -->
							<path
								d="M 40 140 A 100 100 0 0 1 240 140"
								fill="none"
								stroke="currentColor"
								class="text-muted/60"
								stroke-width="16"
								stroke-linecap="round"
							/>

							<!-- Poor Zone (0 - 50 PCI): Angle 180 to 90 deg -->
							<!-- Arc from (40, 140) to (140, 40) -->
							<path
								d="M 40 140 A 100 100 0 0 1 140 40"
								fill="none"
								stroke="#ef4444"
								stroke-width="16"
								stroke-linecap="round"
								class="opacity-80"
							/>

							<!-- Fair Zone (50 - 70 PCI): Angle 90 to 54 deg -->
							<!-- 140 + 100*cos(54)=198.8, 140 - 100*sin(54)=59.1 -->
							<path
								d="M 140 40 A 100 100 0 0 1 198.8 59.1"
								fill="none"
								stroke="#f59e0b"
								stroke-width="16"
							/>

							<!-- Good Zone (70 - 100 PCI): Angle 54 to 0 deg -->
							<!-- Arc from (198.8, 59.1) to (240, 140) -->
							<path
								d="M 198.8 59.1 A 100 100 0 0 1 240 140"
								fill="none"
								stroke="#10b981"
								stroke-width="16"
								stroke-linecap="round"
								class="opacity-80"
							/>

							<!-- Needle Pointer at PCI 49 (approx 91.8 deg from left = x: 136.9, y: 55.1) -->
							<line
								x1="140"
								y1="140"
								x2="137"
								y2="52"
								stroke="currentColor"
								class="text-foreground"
								stroke-width="3.5"
								stroke-linecap="round"
							/>
							<circle cx="140" cy="140" r="7" fill="currentColor" class="text-foreground" />
							<circle cx="140" cy="140" r="3" fill="#f59e0b" />

							<!-- Dial Scale Labels -->
							<text x="32" y="158" font-size="11" font-weight="600" fill="currentColor" class="text-muted-foreground font-mono">0</text>
							<text x="75" y="75" font-size="10" font-weight="500" fill="currentColor" class="text-muted-foreground font-mono">25</text>
							<text x="133" y="24" font-size="11" font-weight="700" fill="currentColor" class="text-foreground font-mono">50</text>
							<text x="202" y="52" font-size="10" font-weight="500" fill="currentColor" class="text-muted-foreground font-mono">70</text>
							<text x="240" y="158" font-size="11" font-weight="600" fill="currentColor" class="text-muted-foreground font-mono">100</text>
						</svg>

						<!-- Score Display Under Gauge -->
						<div class="text-center mt-2 space-y-1">
							<div class="text-4xl font-black text-foreground font-mono tracking-tight">
								49<span class="text-base font-normal text-muted-foreground">/100</span>
							</div>
							<div class="inline-flex">
								<Badge variant="outline" class="text-xs font-semibold border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5">
									Poor — Immediate Preventive Action Required
								</Badge>
							</div>
							<p class="text-[11px] text-muted-foreground pt-1">
								ASTM Critical Threshold: &le; 50 triggers structural base failure
							</p>
						</div>
					</div>
				</div>

				<!-- Right: Condition Breakdown & Analysis -->
				<div class="lg:col-span-7 space-y-5">
					<div class="space-y-2">
						<div class="flex items-center justify-between text-xs font-medium">
							<span class="text-foreground font-semibold">Municipal Network Condition Distribution</span>
							<span class="text-muted-foreground font-mono">42.8 km surveyed</span>
						</div>

						<!-- Segmented Stacked Bar (Authentic pure Tailwind, zero gradients) -->
						<div class="w-full h-7 rounded-md overflow-hidden flex border border-border bg-secondary/30">
							<!-- Poor (<50): 40% -->
							<div
								style="width: 40%;"
								class="bg-red-500/80 text-white flex items-center justify-center text-xs font-bold font-mono transition-all"
								title="Poor (<50 PCI): 40%"
							>
								40% Poor
							</div>

							<!-- Fair (50-70): 38% -->
							<div
								style="width: 38%;"
								class="bg-amber-500 text-black flex items-center justify-center text-xs font-bold font-mono transition-all"
								title="Fair (50-70 PCI): 38%"
							>
								38% Fair
							</div>

							<!-- Good (>70): 22% -->
							<div
								style="width: 22%;"
								class="bg-emerald-600 text-white flex items-center justify-center text-xs font-bold font-mono transition-all"
								title="Good (>70 PCI): 22%"
							>
								22% Good
							</div>
						</div>
					</div>

					<!-- Detailed Tier Breakdown Cards -->
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<!-- Good Tier -->
						<div class="p-3 border border-border rounded-lg bg-card space-y-1">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">Good (&gt;70 PCI)</span>
								<span class="text-xs font-mono font-bold text-foreground">22%</span>
							</div>
							<div class="text-sm font-semibold text-foreground font-mono">9.4 km</div>
							<p class="text-[11px] text-muted-foreground leading-snug">
								Routine crack sealing & edge clearing. Sub-base intact.
							</p>
						</div>

						<!-- Fair Tier -->
						<div class="p-3 border border-border rounded-lg bg-card space-y-1">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-amber-600 dark:text-amber-400">Fair (50–70 PCI)</span>
								<span class="text-xs font-mono font-bold text-foreground">38%</span>
							</div>
							<div class="text-sm font-semibold text-foreground font-mono">16.3 km</div>
							<p class="text-[11px] text-muted-foreground leading-snug">
								Prime candidate for micro-surfacing and thin asphalt overlay.
							</p>
						</div>

						<!-- Poor Tier -->
						<div class="p-3 border border-border rounded-lg bg-card space-y-1">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-red-600 dark:text-red-400">Poor (&lt;50 PCI)</span>
								<span class="text-xs font-mono font-bold text-foreground">40%</span>
							</div>
							<div class="text-sm font-semibold text-foreground font-mono">17.1 km</div>
							<p class="text-[11px] text-muted-foreground leading-snug">
								Severe alligator cracking. Risk of total structural base collapse.
							</p>
						</div>
					</div>

					<!-- Civil Engineering Directive Alert -->
					<div class="p-3.5 border border-amber-500/30 rounded-lg bg-amber-500/5 flex items-start gap-3">
						<CircleAlertIcon class="h-4 w-4 text-primary shrink-0 mt-0.5" />
						<div class="text-xs space-y-1">
							<strong class="font-semibold text-foreground">DPWH & Municipal Engineering Directive:</strong>
							<p class="text-muted-foreground">
								At PCI 49, deferring preventive crack sealing by more than 8 months will degrade the 38% Fair corridor into structural failure, increasing capital replacement liability by up to <strong class="text-foreground">10x per square meter</strong>.
							</p>
						</div>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Middle Section: Longitudinal Deterioration Curve (Pure SVG) -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3 border-b border-border">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<CardTitle class="text-base font-semibold text-foreground flex items-center gap-2">
						<TrendingUpIcon class="h-4 w-4 text-primary" />
						<span>Longitudinal Pavement Deterioration Curve (5-Year Lifecycle Model)</span>
					</CardTitle>
					<CardDescription class="text-xs text-muted-foreground">
						Comparative decay trajectory: Unchecked 'Do-Nothing Decay' vs proactive 'SuriOS Triage Preservation'.
					</CardDescription>
				</div>

				<!-- Interactive Controls for the SVG Graph -->
				<div class="flex items-center flex-wrap gap-2">
					<div class="inline-flex rounded-md border border-border bg-secondary/30 p-0.5 text-xs">
						<button
							class="px-2 py-1 rounded text-xs font-medium transition-colors {activeCurveMode === 'BOTH' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
							onclick={() => (activeCurveMode = 'BOTH')}
						>
							Both Curves
						</button>
						<button
							class="px-2 py-1 rounded text-xs font-medium transition-colors {activeCurveMode === 'PRESERVATION' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
							onclick={() => (activeCurveMode = 'PRESERVATION')}
						>
							SuriOS Preservation
						</button>
						<button
							class="px-2 py-1 rounded text-xs font-medium transition-colors {activeCurveMode === 'DO_NOTHING' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
							onclick={() => (activeCurveMode = 'DO_NOTHING')}
						>
							Do-Nothing
						</button>
					</div>

					<Button
						variant="outline"
						size="sm"
						class="text-xs h-7.5 {showCriticalThreshold ? 'border-primary/40 text-primary' : 'text-muted-foreground'}"
						onclick={() => (showCriticalThreshold = !showCriticalThreshold)}
					>
						Threshold (PCI 50)
					</Button>
				</div>
			</div>
		</CardHeader>

		<CardContent class="p-6 space-y-6">
			<!-- Responsive SVG Graph -->
			<div class="w-full overflow-x-auto">
				<div class="min-w-[620px]">
					<svg
						viewBox="0 0 680 290"
						class="w-full h-auto overflow-visible select-none"
						role="img"
						aria-label="5-Year PCI Deterioration Chart"
					>
						<!-- Y-Axis Gridlines & Labels -->
						<!-- PCI 100: y = 30 -->
						<line x1="55" y1="30" x2="645" y2="30" stroke="currentColor" class="text-border" stroke-width="1" stroke-dasharray="3 3" />
						<text x="45" y="34" font-size="10" font-weight="500" fill="currentColor" text-anchor="end" class="text-muted-foreground font-mono">100</text>

						<!-- PCI 80: y = 73 -->
						<line x1="55" y1="73" x2="645" y2="73" stroke="currentColor" class="text-border" stroke-width="1" stroke-dasharray="3 3" />
						<text x="45" y="77" font-size="10" font-weight="500" fill="currentColor" text-anchor="end" class="text-muted-foreground font-mono">80</text>

						<!-- PCI 70 (Good Boundary): y = 94.5 -->
						<line x1="55" y1="94.5" x2="645" y2="94.5" stroke="currentColor" class="text-border" stroke-width="1" stroke-dasharray="2 2" />
						<text x="45" y="98.5" font-size="10" font-weight="500" fill="currentColor" text-anchor="end" class="text-emerald-600 dark:text-emerald-400 font-mono">70</text>

						<!-- PCI 60: y = 116 -->
						<line x1="55" y1="116" x2="645" y2="116" stroke="currentColor" class="text-border" stroke-width="1" stroke-dasharray="3 3" />
						<text x="45" y="120" font-size="10" font-weight="500" fill="currentColor" text-anchor="end" class="text-muted-foreground font-mono">60</text>

						<!-- PCI 50 (Critical Action Limit): y = 137.5 -->
						{#if showCriticalThreshold}
							<line x1="55" y1="137.5" x2="645" y2="137.5" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4 4" />
							<rect x="475" y="126" width="168" height="20" rx="3" fill="currentColor" class="text-background" stroke="#f59e0b" stroke-width="1" />
							<text x="480" y="140" font-size="9.5" font-weight="700" fill="#f59e0b" class="font-mono">Critical Action Limit (PCI 50)</text>
						{/if}
						<text x="45" y="141.5" font-size="10" font-weight="700" fill="#f59e0b" text-anchor="end" class="font-mono">50</text>

						<!-- PCI 40: y = 159 -->
						<line x1="55" y1="159" x2="645" y2="159" stroke="currentColor" class="text-border" stroke-width="1" stroke-dasharray="3 3" />
						<text x="45" y="163" font-size="10" font-weight="500" fill="currentColor" text-anchor="end" class="text-muted-foreground font-mono">40</text>

						<!-- PCI 25 (Failure Zone): y = 191.25 -->
						<line x1="55" y1="191.25" x2="645" y2="191.25" stroke="currentColor" class="text-red-500/40" stroke-width="1" stroke-dasharray="2 2" />
						<text x="45" y="195" font-size="10" font-weight="500" fill="currentColor" text-anchor="end" class="text-red-500 font-mono">25</text>

						<!-- PCI 0 / X-Axis baseline: y = 245 -->
						<line x1="55" y1="245" x2="645" y2="245" stroke="currentColor" class="text-foreground" stroke-width="1.5" />
						<text x="45" y="249" font-size="10" font-weight="500" fill="currentColor" text-anchor="end" class="text-muted-foreground font-mono">0</text>

						<!-- Vertical Year Gridlines -->
						<!-- Year 0 (x = 55) -->
						<line x1="55" y1="30" x2="55" y2="245" stroke="currentColor" class="text-border" stroke-width="1" />
						<!-- Year 1 (x = 173) -->
						<line x1="173" y1="30" x2="173" y2="245" stroke="currentColor" class="text-border" stroke-width="1" />
						<!-- Year 2 (x = 291) -->
						<line x1="291" y1="30" x2="291" y2="245" stroke="currentColor" class="text-border" stroke-width="1" />
						<!-- Year 3 (x = 409) -->
						<line x1="409" y1="30" x2="409" y2="245" stroke="currentColor" class="text-border" stroke-width="1" />
						<!-- Year 4 (x = 527) -->
						<line x1="527" y1="30" x2="527" y2="245" stroke="currentColor" class="text-border" stroke-width="1" />
						<!-- Year 5 (x = 645) -->
						<line x1="645" y1="30" x2="645" y2="245" stroke="currentColor" class="text-border" stroke-width="1" />

						<!-- X-Axis Labels -->
						<text x="55" y="265" font-size="11" font-weight="600" fill="currentColor" text-anchor="middle" class="text-foreground">Year 0</text>
						<text x="55" y="278" font-size="9.5" fill="currentColor" text-anchor="middle" class="text-muted-foreground font-mono">Current</text>

						<text x="173" y="265" font-size="11" font-weight="600" fill="currentColor" text-anchor="middle" class="text-foreground">Year 1</text>
						<text x="173" y="278" font-size="9.5" fill="currentColor" text-anchor="middle" class="text-muted-foreground font-mono">+12 Mo</text>

						<text x="291" y="265" font-size="11" font-weight="600" fill="currentColor" text-anchor="middle" class="text-foreground">Year 2</text>
						<text x="291" y="278" font-size="9.5" fill="currentColor" text-anchor="middle" class="text-muted-foreground font-mono">+24 Mo</text>

						<text x="409" y="265" font-size="11" font-weight="600" fill="currentColor" text-anchor="middle" class="text-foreground">Year 3</text>
						<text x="409" y="278" font-size="9.5" fill="currentColor" text-anchor="middle" class="text-muted-foreground font-mono">+36 Mo</text>

						<text x="527" y="265" font-size="11" font-weight="600" fill="currentColor" text-anchor="middle" class="text-foreground">Year 4</text>
						<text x="527" y="278" font-size="9.5" fill="currentColor" text-anchor="middle" class="text-muted-foreground font-mono">+48 Mo</text>

						<text x="645" y="265" font-size="11" font-weight="600" fill="currentColor" text-anchor="middle" class="text-foreground">Year 5</text>
						<text x="645" y="278" font-size="9.5" fill="currentColor" text-anchor="middle" class="text-muted-foreground font-mono">+60 Mo</text>

						<!-- Shaded Area Between Curves (Benefit of Preservation) -->
						{#if activeCurveMode === 'BOTH'}
							<polygon
								points="55,139.7 173,107.4 291,113.9 409,98.8 527,105.3 645,111.7 645,227.8 527,214.9 409,197.7 291,176.2 173,156.9 55,139.7"
								fill="currentColor"
								class="text-amber-500/10 dark:text-amber-500/15"
							/>
						{/if}

						<!-- 1. Do-Nothing Decay Curve (Red Dashed Line) -->
						{#if activeCurveMode === 'BOTH' || activeCurveMode === 'DO_NOTHING'}
							<path
								d="M 55 139.7 C 114 148 114 156.9 173 156.9 C 232 166 232 176.2 291 176.2 C 350 186 350 197.7 409 197.7 C 468 206 468 214.9 527 214.9 C 586 221 586 227.8 645 227.8"
								fill="none"
								stroke="#ef4444"
								stroke-width="2.5"
								stroke-dasharray="6 4"
							/>
							<!-- Do-Nothing Points -->
							{#each decayData as pt, i}
								{@const x = 55 + i * 118}
								{@const y = 30 + (100 - pt.doNothingPCI) * 2.15}
								<g
									role="button"
									tabindex="0"
									aria-label="Year {pt.year} Do-Nothing PCI {pt.doNothingPCI}"
									class="cursor-pointer focus:outline-none"
									onclick={() => (selectedDecayYear = pt.year)}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											selectedDecayYear = pt.year;
										}
									}}
								>
									<circle
										cx={x}
										cy={y}
										r={selectedDecayYear === pt.year ? 5.5 : 4}
										fill="#ef4444"
										stroke="currentColor"
										class="text-background"
										stroke-width="2"
									/>
								</g>
							{/each}
						{/if}

						<!-- 2. SuriOS Triage Preservation Curve (Solid Safety Amber Line) -->
						{#if activeCurveMode === 'BOTH' || activeCurveMode === 'PRESERVATION'}
							<path
								d="M 55 139.7 C 114 123 114 107.4 173 107.4 C 232 110 232 113.9 291 113.9 C 350 106 350 98.8 409 98.8 C 468 102 468 105.3 527 105.3 C 586 108 586 111.7 645 111.7"
								fill="none"
								stroke="#f59e0b"
								stroke-width="3.5"
								stroke-linecap="round"
							/>
							<!-- Preservation Points -->
							{#each decayData as pt, i}
								{@const x = 55 + i * 118}
								{@const y = 30 + (100 - pt.preservationPCI) * 2.15}
								<g
									role="button"
									tabindex="0"
									aria-label="Year {pt.year} SuriOS Preservation PCI {pt.preservationPCI}"
									class="cursor-pointer focus:outline-none"
									onclick={() => (selectedDecayYear = pt.year)}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											selectedDecayYear = pt.year;
										}
									}}
								>
									<circle
										cx={x}
										cy={y}
										r={selectedDecayYear === pt.year ? 6.5 : 4.5}
										fill="#f59e0b"
										stroke="currentColor"
										class="text-background"
										stroke-width="2.5"
									/>
								</g>
							{/each}
						{/if}

						<!-- Active Selected Year Vertical Indicator -->
						<line
							x1={selectedDecayX}
							y1="30"
							x2={selectedDecayX}
							y2="245"
							stroke="currentColor"
							class="text-primary/70"
							stroke-width="1.5"
							stroke-dasharray="2 2"
						/>
					</svg>
				</div>
			</div>

			<!-- Interactive Year Inspection Card -->
			<div class="p-4 border border-border rounded-lg bg-secondary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
				<div class="space-y-1">
					<div class="flex items-center gap-2">
						<span class="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
							Lifecycle Milestone: {activeDecayPoint.label}
						</span>
						<Badge variant="outline" class="text-[10px] font-mono border-border">
							&Delta; +{activeDecayPoint.deltaPCI} PCI pts
						</Badge>
					</div>
					<p class="text-xs text-muted-foreground">
						<strong class="text-foreground">Required Civil Engineering Action:</strong> {activeDecayPoint.civilAction}
					</p>
				</div>

				<div class="flex items-center gap-4 text-xs font-mono shrink-0">
					<div class="flex items-center gap-2">
						<span class="inline-block w-3 h-0.5 bg-red-500"></span>
						<span class="text-muted-foreground">Do-Nothing:</span>
						<strong class="text-red-500 font-bold">{activeDecayPoint.doNothingPCI} PCI</strong>
					</div>
					<div class="flex items-center gap-2">
						<span class="inline-block w-3 h-0.5 bg-amber-500"></span>
						<span class="text-muted-foreground">SuriOS Triage:</span>
						<strong class="text-amber-500 font-bold">{activeDecayPoint.preservationPCI} PCI</strong>
					</div>
					<Badge variant="default" class="text-xs font-mono">
						{activeDecayPoint.budgetImpact}
					</Badge>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Two Column Layout: Monsoon Outbreak vs Municipal Budget Optimization -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
		<!-- Left: Monsoon Defect Outbreak Correlation (7 Cols) -->
		<Card class="lg:col-span-7 border border-border bg-card shadow-xs">
			<CardHeader class="pb-3 border-b border-border">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
					<div>
						<CardTitle class="text-base font-semibold text-foreground flex items-center gap-2">
							<CloudRainIcon class="h-4 w-4 text-primary" />
							<span>Monsoon Defect Outbreak Correlation (Rainfall vs Potholes)</span>
						</CardTitle>
						<CardDescription class="text-xs text-muted-foreground">
							Monthly precipitation (mm) plotted against verified pothole occurrences in Santa Cruz & adjacent corridors.
						</CardDescription>
					</div>
					<Badge variant="outline" class="text-xs font-mono border-amber-500/40 text-amber-600 dark:text-amber-400">
						July–Oct Peak
					</Badge>
				</div>
			</CardHeader>

			<CardContent class="p-6 space-y-5">
				<!-- Pure SVG Histogram / Bar Chart -->
				<div class="w-full overflow-x-auto">
					<div class="min-w-[540px]">
						<svg
							viewBox="0 0 700 270"
							class="w-full h-auto overflow-visible select-none"
							role="img"
							aria-label="Monsoon Defect Correlation Bar Chart"
						>
							<!-- Habagat Monsoon Highlight Band (Months 6 to 9: Jul, Aug, Sep, Oct) -->
							<!-- x starts at 50 + 6 * 50 = 350, width = 4 * 50 = 200 -->
							<rect
								x="345"
								y="20"
								width="200"
								height="195"
								fill="currentColor"
								class="text-amber-500/5 dark:text-amber-500/10"
								rx="4"
							/>
							<rect
								x="345"
								y="20"
								width="200"
								height="195"
								fill="none"
								stroke="#f59e0b"
								stroke-width="1"
								stroke-dasharray="3 3"
								class="opacity-40"
							/>
							<text x="445" y="34" font-size="9" font-weight="700" fill="#f59e0b" text-anchor="middle" class="font-mono">
								HABAGAT MONSOON SURGE WINDOW
							</text>

							<!-- Horizontal Gridlines & Y-Axis Left (Rainfall mm, 0 to 500) -->
							<!-- 500 mm: y = 20 -->
							<line x1="50" y1="20" x2="650" y2="20" stroke="currentColor" class="text-border" stroke-width="1" stroke-dasharray="2 2" />
							<text x="42" y="24" font-size="9.5" fill="currentColor" text-anchor="end" class="text-muted-foreground font-mono">500</text>
							<text x="658" y="24" font-size="9.5" fill="#f59e0b" class="font-mono">130</text>

							<!-- 375 mm: y = 68.75 -->
							<line x1="50" y1="68.75" x2="650" y2="68.75" stroke="currentColor" class="text-border" stroke-width="1" stroke-dasharray="2 2" />
							<text x="42" y="72.5" font-size="9.5" fill="currentColor" text-anchor="end" class="text-muted-foreground font-mono">375</text>
							<text x="658" y="72.5" font-size="9.5" fill="#f59e0b" class="font-mono">98</text>

							<!-- 250 mm: y = 117.5 -->
							<line x1="50" y1="117.5" x2="650" y2="117.5" stroke="currentColor" class="text-border" stroke-width="1" stroke-dasharray="2 2" />
							<text x="42" y="121" font-size="9.5" fill="currentColor" text-anchor="end" class="text-muted-foreground font-mono">250</text>
							<text x="658" y="121" font-size="9.5" fill="#f59e0b" class="font-mono">65</text>

							<!-- 125 mm: y = 166.25 -->
							<line x1="50" y1="166.25" x2="650" y2="166.25" stroke="currentColor" class="text-border" stroke-width="1" stroke-dasharray="2 2" />
							<text x="42" y="170" font-size="9.5" fill="currentColor" text-anchor="end" class="text-muted-foreground font-mono">125</text>
							<text x="658" y="170" font-size="9.5" fill="#f59e0b" class="font-mono">32</text>

							<!-- Baseline: y = 215 -->
							<line x1="50" y1="215" x2="650" y2="215" stroke="currentColor" class="text-foreground" stroke-width="1.5" />
							<text x="42" y="219" font-size="9.5" fill="currentColor" text-anchor="end" class="text-muted-foreground font-mono">0 mm</text>
							<text x="658" y="219" font-size="9.5" fill="#f59e0b" class="font-mono">0 pt</text>

							<!-- Grouped Bars per Month -->
							{#each monsoonHistory as m, idx}
								{@const slotX = 50 + idx * 50}
								{@const rainHeight = (m.rainfallMm / 500) * 195}
								{@const rainY = 215 - rainHeight}
								{@const potholeHeight = (m.potholesFormed / 130) * 195}
								{@const potholeY = 215 - potholeHeight}
								{@const isSelected = selectedMonthIndex === idx}

								<g
									role="button"
									tabindex="0"
									aria-label="Inspect {m.name} data"
									class="cursor-pointer focus:outline-none"
									onclick={() => (selectedMonthIndex = idx)}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											selectedMonthIndex = idx;
										}
									}}
								>
									<!-- Selection Indicator Bar Top -->
									{#if isSelected}
										<rect
											x={slotX + 5}
											y="18"
											width="40"
											height="198"
											fill="currentColor"
											class="text-primary/10"
											rx="3"
										/>
									{/if}

									<!-- Rainfall Bar (Neutral Slate / Gray) -->
									<rect
										x={slotX + 8}
										y={rainY}
										width="16"
										height={rainHeight}
										rx="2"
										fill="currentColor"
										class="text-zinc-400 dark:text-zinc-600 transition-opacity hover:opacity-80"
									/>

									<!-- Potholes Bar (Safety Amber / bg-primary) -->
									<rect
										x={slotX + 26}
										y={potholeY}
										width="16"
										height={potholeHeight}
										rx="2"
										fill="#f59e0b"
										class="transition-opacity hover:opacity-90"
									/>

									<!-- Month Label on X-Axis -->
									<text
										x={slotX + 25}
										y="235"
										font-size="10.5"
										font-weight={isSelected ? '700' : '500'}
										fill="currentColor"
										text-anchor="middle"
										class={isSelected ? 'text-primary' : 'text-muted-foreground'}
									>
										{m.month}
									</text>
								</g>
							{/each}
						</svg>
					</div>
				</div>

				<!-- Chart Legend & Active Month Inspector -->
				<div class="flex items-center justify-between text-xs border-t border-border pt-3">
					<div class="flex items-center gap-4">
						<div class="flex items-center gap-1.5">
							<span class="inline-block w-3 h-3 rounded-xs bg-zinc-400 dark:bg-zinc-600"></span>
							<span class="text-muted-foreground">Monthly Rainfall (mm)</span>
						</div>
						<div class="flex items-center gap-1.5">
							<span class="inline-block w-3 h-3 rounded-xs bg-amber-500"></span>
							<span class="text-foreground font-medium">Pothole Formations</span>
						</div>
					</div>
					<span class="text-muted-foreground text-[11px] font-mono">
						Click any month bar to inspect
					</span>
				</div>

				<!-- Month Inspector Details Card -->
				<div class="p-3.5 border border-border rounded-lg bg-secondary/20 space-y-2">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="text-xs font-bold text-foreground uppercase tracking-wide font-mono">
								{activeMonth.name} Telemetry & Advisory
							</span>
							{#if activeMonth.isMonsoonPeak}
								<Badge variant="outline" class="text-[10px] font-mono border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10">
									Monsoon Active
								</Badge>
							{/if}
						</div>
						<div class="flex items-center gap-2 font-mono text-xs">
							<span>Rainfall: <strong class="text-foreground">{activeMonth.rainfallMm} mm</strong></span>
							&bull;
							<span>Potholes: <strong class="text-amber-500 font-bold">{activeMonth.potholesFormed}</strong></span>
						</div>
					</div>

					<p class="text-xs text-muted-foreground leading-relaxed">
						{activeMonth.seasonalNote}
					</p>

					<div class="flex items-center gap-2 pt-1 text-xs">
						<WrenchIcon class="h-3.5 w-3.5 text-primary shrink-0" />
						<span class="text-muted-foreground">
							<strong class="text-foreground font-medium">LGU Maintenance Action:</strong> {activeMonth.civilAdvisory}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Right: Municipal Budget Optimization Counter & Ledger (5 Cols) -->
		<Card class="lg:col-span-5 border border-border bg-card shadow-xs flex flex-col justify-between">
			<div>
				<CardHeader class="pb-3 border-b border-border">
					<div class="flex items-center justify-between">
						<div>
							<CardTitle class="text-base font-semibold text-foreground flex items-center gap-2">
								<CalculatorIcon class="h-4 w-4 text-primary" />
								<span>Municipal Budget Optimization Counter</span>
							</CardTitle>
							<CardDescription class="text-xs text-muted-foreground">
								Preventive micro-surfacing vs full-depth slab reconstruction.
							</CardDescription>
						</div>
					</div>
				</CardHeader>

				<CardContent class="p-6 space-y-5">
					<!-- Big Highlight Counter -->
					<div class="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
						<div class="flex items-center justify-between text-xs">
							<span class="text-muted-foreground uppercase font-mono tracking-wider font-semibold">
								Santa Cruz Municipal Budget Saved
							</span>
							<Badge variant="default" class="text-[10px] font-mono bg-primary text-primary-foreground">
								54.8% Preserved
							</Badge>
						</div>

						<div class="text-3xl sm:text-4xl font-extrabold text-foreground font-mono tracking-tight text-primary">
							{formatPesos(dynamicSavedBudget)}
						</div>

						<p class="text-xs text-muted-foreground leading-snug">
							Preserved via early detection, crack sealing, and thin polymer micro-surfacing before structural base washout.
						</p>
					</div>

					<!-- Unit Cost Multiplier Comparison (10x Difference) -->
					<div class="grid grid-cols-2 gap-3 text-xs">
						<div class="p-3 border border-border rounded-lg bg-card space-y-1">
							<div class="text-[11px] text-muted-foreground uppercase font-medium">Preventive Triage</div>
							<div class="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">₱185 / m²</div>
							<p class="text-[10px] text-muted-foreground">Crack seal + 12mm micro-surfacing slurry</p>
						</div>

						<div class="p-3 border border-border rounded-lg bg-card space-y-1">
							<div class="text-[11px] text-muted-foreground uppercase font-medium">Reconstruction</div>
							<div class="text-lg font-bold text-red-600 dark:text-red-400 font-mono">₱1,850 / m²</div>
							<p class="text-[10px] text-muted-foreground">Cold milling + full-depth PCCP repour (10x cost)</p>
						</div>
					</div>

					<!-- Interactive Coverage Simulation Slider -->
					<div class="space-y-2 pt-1">
						<div class="flex items-center justify-between text-xs">
							<span class="text-muted-foreground font-medium flex items-center gap-1.5">
								<SlidersHorizontalIcon class="h-3.5 w-3.5" />
								<span>Corridor Preservation Coverage</span>
							</span>
							<span class="font-mono font-bold text-foreground">
								{simulatedCoveragePct}% ({((42.8 * simulatedCoveragePct) / 100).toFixed(1)} km)
							</span>
						</div>

						<input
							type="range"
							min="40"
							max="150"
							step="10"
							bind:value={simulatedCoveragePct}
							class="w-full accent-amber-500 cursor-pointer h-1.5 bg-secondary rounded-lg"
						/>
						<div class="flex justify-between text-[10px] text-muted-foreground font-mono">
							<span>40% (Emergency Core)</span>
							<span>100% (Baseline 42.8 km)</span>
							<span>150% (Laguna 2nd Dist)</span>
						</div>
					</div>

					<!-- Bill of Quantities Ledger Accordion -->
					<div class="border border-border rounded-lg overflow-hidden">
						<button
							class="w-full p-3 text-xs font-semibold text-foreground flex items-center justify-between bg-secondary/30 hover:bg-secondary/50 transition-colors"
							onclick={() => (showCostLedger = !showCostLedger)}
						>
							<span>Itemized Civil Engineering Cost Ledger</span>
							<span class="text-[11px] text-primary">{showCostLedger ? 'Hide' : 'View'}</span>
						</button>

						{#if showCostLedger}
							<div class="p-3 text-xs space-y-2 border-t border-border bg-card">
								<div class="flex justify-between text-muted-foreground">
									<span>Polymer Micro-Surfacing (ASTM D6372):</span>
									<span class="font-mono text-foreground font-medium">{formatPesos(Math.round(758500 * (simulatedCoveragePct / 100)))}</span>
								</div>
								<div class="flex justify-between text-muted-foreground">
									<span>Hot-Poured Rubberized Joint Seal:</span>
									<span class="font-mono text-foreground font-medium">{formatPesos(Math.round(246000 * (simulatedCoveragePct / 100)))}</span>
								</div>
								<div class="flex justify-between text-muted-foreground">
									<span>Culvert Desilting & Edge Dressing:</span>
									<span class="font-mono text-foreground font-medium">{formatPesos(Math.round(165500 * (simulatedCoveragePct / 100)))}</span>
								</div>
								<Separator />
								<div class="flex justify-between font-semibold text-foreground">
									<span>Total Preventive Investment:</span>
									<span class="font-mono">{formatPesos(preventiveCost)}</span>
								</div>
								<div class="flex justify-between text-red-500 font-semibold">
									<span>Deferred Reactive Replacement Cost:</span>
									<span class="font-mono">{formatPesos(reactiveCost)}</span>
								</div>
								<div class="flex justify-between text-primary font-bold pt-1 border-t border-border">
									<span>Net Municipal Budget Preserved:</span>
									<span class="font-mono">{formatPesos(dynamicSavedBudget)}</span>
								</div>
							</div>
						{/if}
					</div>
				</CardContent>
			</div>

			<div class="p-4 border-t border-border bg-secondary/10 flex items-center justify-between text-xs">
				<span class="text-muted-foreground">ROI Preservation Ratio:</span>
				<span class="font-mono font-bold text-foreground">₱1 spent saves ₱4.20 over 36 months</span>
			</div>
		</Card>
	</div>

	<!-- Bottom Section: Barangay Hazard Distribution Table / Grid -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3 border-b border-border">
			<div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
				<div>
					<CardTitle class="text-base font-semibold text-foreground flex items-center gap-2">
						<LayersIcon class="h-4 w-4 text-primary" />
						<span>Barangay Hazard Distribution & Repair Completion Audit</span>
					</CardTitle>
					<CardDescription class="text-xs text-muted-foreground">
						Comparative telemetry across Santa Cruz, Bubukal, Pagsanjan, and Gatid municipal sectors.
					</CardDescription>
				</div>

				<!-- Table Controls: Search & Sort -->
				<div class="flex items-center flex-wrap gap-2">
					<input
						type="text"
						placeholder="Filter barangays or distress..."
						bind:value={searchFilter}
						class="text-xs h-8 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-60"
					/>

					<div class="inline-flex rounded-md border border-border bg-secondary/30 p-0.5 text-xs">
						<button
							class="px-2 py-1 rounded text-xs font-medium transition-colors {sortField === 'severity' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
							onclick={() => toggleSort('severity')}
						>
							Severity {sortField === 'severity' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
						</button>
						<button
							class="px-2 py-1 rounded text-xs font-medium transition-colors {sortField === 'repairRate' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
							onclick={() => toggleSort('repairRate')}
						>
							Completion {sortField === 'repairRate' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
						</button>
						<button
							class="px-2 py-1 rounded text-xs font-medium transition-colors {sortField === 'pci' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
							onclick={() => toggleSort('pci')}
						>
							PCI {sortField === 'pci' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
						</button>
					</div>
				</div>
			</div>
		</CardHeader>

		<CardContent class="p-0">
			<!-- Notification on Dispatch -->
			{#if dispatchedBarangayId}
				<div class="m-4 p-3 rounded-lg border border-primary/40 bg-primary/10 text-xs flex items-center justify-between">
					<div class="flex items-center gap-2">
						<TruckIcon class="h-4 w-4 text-primary shrink-0" />
						<span>
							Quick Response Unit dispatched to <strong>{barangayStats.find((b) => b.id === dispatchedBarangayId)?.barangay}</strong> corridor. Cold-mix patch crew en route.
						</span>
					</div>
					<Badge variant="default" class="text-[10px] font-mono">Dispatched</Badge>
				</div>
			{/if}

			<!-- Responsive Table -->
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead class="bg-secondary/40 text-muted-foreground uppercase text-[10px] font-mono tracking-wider border-b border-border">
						<tr>
							<th class="py-3 px-4 font-semibold">Barangay & Corridor</th>
							<th class="py-3 px-4 font-semibold text-center">Network Length</th>
							<th class="py-3 px-4 font-semibold text-center">Average PCI</th>
							<th class="py-3 px-4 font-semibold text-center">Active Hazards</th>
							<th class="py-3 px-4 font-semibold text-center">Hazard Severity</th>
							<th class="py-3 px-4 font-semibold">Repair Completion Rate</th>
							<th class="py-3 px-4 font-semibold text-center">Avg Response</th>
							<th class="py-3 px-4 font-semibold text-right">Action</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each sortedBarangays as b}
							{@const isSelected = selectedBarangayId === b.id}
							<tr
								class="hover:bg-secondary/30 transition-colors cursor-pointer {isSelected ? 'bg-secondary/20' : ''}"
								onclick={() => (selectedBarangayId = b.id)}
							>
								<!-- Barangay & Corridor -->
								<td class="py-3.5 px-4">
									<div class="space-y-0.5">
										<div class="font-semibold text-foreground text-sm flex items-center gap-2">
											<span>{b.barangay}</span>
											{#if b.vruRisk === 'CRITICAL'}
												<Badge variant="outline" class="text-[10px] border-destructive/40 text-destructive bg-destructive/10">
													VRU High
												</Badge>
											{/if}
										</div>
										<div class="text-[11px] text-muted-foreground">{b.corridorType}</div>
										<div class="text-[10px] font-mono text-muted-foreground pt-0.5">
											Primary Distress: {b.primaryDistress}
										</div>
									</div>
								</td>

								<!-- Network Length -->
								<td class="py-3.5 px-4 text-center font-mono font-medium text-foreground">
									{b.networkKm} km
								</td>

								<!-- Average PCI -->
								<td class="py-3.5 px-4 text-center font-mono">
									<Badge
										variant="outline"
										class="text-xs font-bold font-mono {b.avgPCI < 50 ? 'border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10' : 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10'}"
									>
										{b.avgPCI} ({b.pciStatus})
									</Badge>
								</td>

								<!-- Active Hazards -->
								<td class="py-3.5 px-4 text-center">
									<div class="font-mono font-bold text-foreground text-sm">{b.totalHazards}</div>
									<div class="text-[10px] text-muted-foreground font-mono">
										{b.criticalHazards} crit &bull; {b.highHazards} high
									</div>
								</td>

								<!-- Hazard Severity -->
								<td class="py-3.5 px-4 text-center">
									<div class="inline-flex items-center gap-1.5 font-mono">
										<span class="text-sm font-extrabold {b.avgSeverityScore >= 7.5 ? 'text-destructive' : 'text-primary'}">
											{b.avgSeverityScore.toFixed(1)}
										</span>
										<span class="text-[10px] text-muted-foreground">/ 10</span>
									</div>
								</td>

								<!-- Repair Completion Rate -->
								<td class="py-3.5 px-4 min-w-[180px]">
									<div class="space-y-1.5">
										<div class="flex items-center justify-between text-[11px] font-mono">
											<span class="font-medium text-foreground">{b.repairRate.toFixed(1)}%</span>
											<span class="text-muted-foreground">{b.completedRepairs} / {b.totalHazards} fixed</span>
										</div>
										<div class="w-full h-2 rounded-full bg-secondary overflow-hidden border border-border">
											<div
												class="h-full rounded-full transition-all {b.repairRate > 70 ? 'bg-emerald-600' : b.repairRate > 50 ? 'bg-amber-500' : 'bg-red-500'}"
												style="width: {b.repairRate}%"
											></div>
										</div>
									</div>
								</td>

								<!-- Avg Response -->
								<td class="py-3.5 px-4 text-center font-mono text-muted-foreground">
									{b.avgResponseDays} days
								</td>

								<!-- Action -->
								<td class="py-3.5 px-4 text-right">
									<Button
										variant="outline"
										size="sm"
										class="text-xs h-7.5 px-2.5"
										onclick={(e) => {
											e.stopPropagation();
											handleDispatch(b.id);
										}}
									>
										<TruckIcon class="h-3 w-3 mr-1" />
										Dispatch
									</Button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Selected Barangay Audit Card -->
			<div class="p-4 border-t border-border bg-secondary/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
				<div class="space-y-1">
					<div class="flex items-center gap-2">
						<span class="text-xs font-semibold text-foreground">
							Selected Sector Audit: <span class="text-primary">{selectedBarangay.barangay}</span>
						</span>
						<Badge variant="outline" class="text-[10px] font-mono">
							Assigned: {selectedBarangay.assignedCrew}
						</Badge>
					</div>
					<p class="text-xs text-muted-foreground">
						Recommended Treatment: Seal {selectedBarangay.criticalHazards} critical voids along {selectedBarangay.primaryDistress} prior to next heavy rainfall.
					</p>
				</div>

				<div class="flex items-center gap-2 shrink-0">
					<Button
						size="sm"
						class="text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90"
						onclick={() => handleDispatch(selectedBarangay.id)}
					>
						<TruckIcon class="h-3.5 w-3.5 mr-1.5" />
						Dispatch {selectedBarangay.assignedCrew.split(' ')[0]} Crew
					</Button>
				</div>
			</div>
		</CardContent>
	</Card>
</div>
