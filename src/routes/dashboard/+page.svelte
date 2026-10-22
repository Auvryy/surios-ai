<script lang="ts">
	import type { PageProps } from './$types.js';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import CheckCheckIcon from '@lucide/svelte/icons/check-check';

	import { Card } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	let { data }: PageProps = $props();

	interface TriageTicket {
		id: string;
		distress: string;
		astm: string;
		depthEstimate: string;
		location: string;
		coords: string;
		vru: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
		severity: number;
		status: 'REPORTED' | 'DISPATCHED' | 'RESOLVED';
		confirmations: number;
		time: string;
		imageUrl: string;
		assignedCrew: string | null;
		asphaltEstimate: string;
		reporterName: string;
		notes: string;
	}

	const availableCrews = [
		'DPWH Crew Alpha (Cold-Patch Squad)',
		'DPWH Crew Bravo (Hot-Mix Asphalt Unit)',
		'Laguna Provincial Edge & Curb Team',
		'Santa Cruz MEO Rapid Response Unit'
	];

	let incidents = $state<TriageTicket[]>([
		{
			id: 'TKT-7821',
			distress: 'Deep Pothole & Submerged Edge Breakdown',
			astm: 'ASTM D6433 • 13H (Pothole - High)',
			depthEstimate: '68mm vertical lip',
			location: 'LSPU Main Entrance, Pedro Guevara Ave, Santa Cruz',
			coords: '14.2813° N, 121.4173° E',
			vru: 'CRITICAL',
			severity: 9.2,
			status: 'REPORTED',
			confirmations: 43,
			time: '12m ago',
			imageUrl: '/samples/pothole-severe.jpg',
			assignedCrew: null,
			asphaltEstimate: '0.45t Polymer Cold-Mix',
			reporterName: 'Mark Bautista (@rider_mark_laguna)',
			notes: 'Located directly in primary two-wheeler and tricycle track. Submerged during monsoon rain.'
		},
		{
			id: 'TKT-7820',
			distress: 'Sunken Crosswalk Utility Trench',
			astm: 'ASTM D6433 • 14H (Utility Cut Depression)',
			depthEstimate: '52mm transverse trench',
			location: 'Quezon Ave Student Corridor, Santa Cruz',
			coords: '14.2792° N, 121.4161° E',
			vru: 'CRITICAL',
			severity: 8.9,
			status: 'DISPATCHED',
			confirmations: 27,
			time: '34m ago',
			imageUrl: '/uploads/pothole-pre-repair.jpg',
			assignedCrew: 'DPWH Crew Alpha (Cold-Patch Squad)',
			asphaltEstimate: '0.60t Hot-Mix Asphalt',
			reporterName: 'Ria Santos (@ria_commutes)',
			notes: 'Subgrade moisture settling beneath crosswalk skin. Requires gravel base re-compaction.'
		},
		{
			id: 'TKT-7819',
			distress: 'Alligator Cracking & Longitudinal Rutting',
			astm: 'ASTM D6433 • 01M (Alligator - Med)',
			depthEstimate: '38mm wheel rut',
			location: 'National Highway, Pagsanjan Junction',
			coords: '14.2765° N, 121.4312° E',
			vru: 'HIGH',
			severity: 7.6,
			status: 'DISPATCHED',
			confirmations: 31,
			time: '45m ago',
			imageUrl: '/samples/alligator-fatigue.jpg',
			assignedCrew: 'DPWH Crew Bravo (Hot-Mix Asphalt Unit)',
			asphaltEstimate: '1.20t Dense-Graded Asphalt',
			reporterName: 'TODASCL Patrol (@toda_santa_cruz)',
			notes: 'Interconnected fatigue fractures causing loose gravel slip hazard for braking tricycles.'
		},
		{
			id: 'TKT-7814',
			distress: 'Drainage Failure & Unpaved Shoulder Drop-off',
			astm: 'ASTM D6433 • 09M (Edge Drop-off)',
			depthEstimate: '48mm shoulder step',
			location: 'Barangay Bubukal Provincial Corridor',
			coords: '14.2690° N, 121.4021° E',
			vru: 'MODERATE',
			severity: 5.8,
			status: 'REPORTED',
			confirmations: 14,
			time: '2h ago',
			imageUrl: '/uploads/1792498308438-da49636d411c.jpeg',
			assignedCrew: null,
			asphaltEstimate: '0.80t Shoulder Aggregate + Tack Coat',
			reporterName: 'Carla Dizon (@carla_cycling)',
			notes: 'Shoulder erosion along concrete gutter edge forcing cyclists into heavy bus lane.'
		},
		{
			id: 'TKT-7798',
			distress: 'Transverse Thermal Crack (Patched & Sealed)',
			astm: 'ASTM D6433 • 10L (Crack - Low)',
			depthEstimate: 'Flush (<3mm)',
			location: 'Pedro Guevara Ave (Poblacion), Santa Cruz',
			coords: '14.2840° N, 121.4190° E',
			vru: 'LOW',
			severity: 2.1,
			status: 'RESOLVED',
			confirmations: 19,
			time: '4h ago',
			imageUrl: '/uploads/patch-post-repair.jpg',
			assignedCrew: 'Santa Cruz MEO Rapid Response Unit',
			asphaltEstimate: '0.15t Elastomeric Bitumen Seal',
			reporterName: 'Engr. Mateo Cruz (@cruz_civil)',
			notes: 'Verified closed via Proof-of-Patch Gemini audit (96% surface flushness).'
		}
	]);

	type FilterTab = 'ALL' | 'CRITICAL' | 'REPORTED' | 'DISPATCHED' | 'RESOLVED';
	let filter = $state<FilterTab>('ALL');
	let searchQuery = $state('');
	let dispatchingId = $state<string | null>(null);
	let selectedCrew = $state<string>(availableCrews[0]);
	let inspectingTicket = $state<TriageTicket | null>(null);
	let actionFeedback = $state<string | null>(null);

	const counts = $derived({
		all: incidents.length,
		critical: incidents.filter((i) => i.vru === 'CRITICAL' || i.vru === 'HIGH').length,
		reported: incidents.filter((i) => i.status === 'REPORTED').length,
		dispatched: incidents.filter((i) => i.status === 'DISPATCHED').length,
		resolved: incidents.filter((i) => i.status === 'RESOLVED').length
	});

	const filteredIncidents = $derived(
		incidents.filter((item) => {
			if (filter === 'CRITICAL' && item.vru !== 'CRITICAL' && item.vru !== 'HIGH') return false;
			if (filter === 'REPORTED' && item.status !== 'REPORTED') return false;
			if (filter === 'DISPATCHED' && item.status !== 'DISPATCHED') return false;
			if (filter === 'RESOLVED' && item.status !== 'RESOLVED') return false;

			const q = searchQuery.trim().toLowerCase();
			if (!q) return true;
			return (
				item.id.toLowerCase().includes(q) ||
				item.distress.toLowerCase().includes(q) ||
				item.location.toLowerCase().includes(q) ||
				item.astm.toLowerCase().includes(q)
			);
		})
	);

	function triggerFeedback(msg: string) {
		actionFeedback = msg;
		setTimeout(() => {
			if (actionFeedback === msg) actionFeedback = null;
		}, 3500);
	}

	function confirmDispatch(ticketId: string) {
		const target = incidents.find((i) => i.id === ticketId);
		if (!target) return;
		target.status = 'DISPATCHED';
		target.assignedCrew = selectedCrew;
		dispatchingId = null;
		triggerFeedback(`Dispatched ${selectedCrew} to ${ticketId} (${target.location}).`);
	}

	function markResolved(ticketId: string) {
		const target = incidents.find((i) => i.id === ticketId);
		if (!target) return;
		target.status = 'RESOLVED';
		if (inspectingTicket?.id === ticketId) {
			inspectingTicket = target;
		}
		triggerFeedback(`Marked ${ticketId} as Patched & Resolved.`);
	}

	function exportWorkOrdersCsv() {
		const headers = [
			'Ticket ID',
			'Status',
			'VRU Risk',
			'Severity',
			'Distress Type',
			'ASTM Code',
			'Depth',
			'Location',
			'Coordinates',
			'Assigned Crew',
			'Material Estimate'
		];
		const rows = filteredIncidents.map((i) => [
			i.id,
			i.status,
			i.vru,
			i.severity.toFixed(1),
			`"${i.distress}"`,
			`"${i.astm}"`,
			`"${i.depthEstimate}"`,
			`"${i.location}"`,
			`"${i.coords}"`,
			`"${i.assignedCrew || 'Unassigned'}"`,
			`"${i.asphaltEstimate}"`
		]);
		const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `surios-dpwh-work-orders-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		triggerFeedback(`Exported ${filteredIncidents.length} work orders to CSV.`);
	}

	function getVruBadgeClass(risk: TriageTicket['vru']): string {
		switch (risk) {
			case 'CRITICAL':
				return 'bg-destructive/15 text-destructive border-destructive/30 font-semibold';
			case 'HIGH':
				return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold';
			case 'MODERATE':
				return 'bg-secondary text-foreground border-border';
			default:
				return 'bg-muted text-muted-foreground border-border';
		}
	}
</script>

<svelte:head>
	<title>Triage & Resolve — Municipal Engineering — SuriOS</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
	<!-- Swiss Minimalist Header (Zero Redundant Identity Banner or Module C Badge) -->
	<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-5">
		<div class="space-y-1">
			<span class="text-xs font-mono text-muted-foreground uppercase tracking-wider">
				DPWH District 1 &amp; Santa Cruz MEO
			</span>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
				Triage &amp; Resolving Reports
			</h1>
			<p class="text-xs text-muted-foreground">
				Assign engineering crews to verified road defects and resolve completed field patches.
			</p>
		</div>

		<div class="flex items-center gap-2 shrink-0">
			<Button
				variant="outline"
				size="sm"
				class="text-xs h-8 border-border gap-1.5 shadow-none"
				onclick={exportWorkOrdersCsv}
			>
				<DownloadIcon class="h-3.5 w-3.5" />
				<span>Export CSV</span>
			</Button>
			<Button
				href="/verification"
				size="sm"
				class="text-xs h-8 gap-1.5 shadow-none"
			>
				<CheckCheckIcon class="h-3.5 w-3.5" />
				<span>Proof of Patch QA</span>
			</Button>
		</div>
	</div>

	{#if actionFeedback}
		<div class="rounded-lg border border-border bg-secondary/50 px-3.5 py-2.5 text-xs font-medium text-foreground flex items-center justify-between">
			<span class="flex items-center gap-2">
				<CheckCircleIcon class="h-4 w-4 text-foreground shrink-0" />
				<span>{actionFeedback}</span>
			</span>
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground cursor-pointer"
				onclick={() => (actionFeedback = null)}
			>
				<XIcon class="h-3.5 w-3.5" />
			</button>
		</div>
	{/if}

	<!-- Unified Filter Pills with Embedded Live Counts + Search -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
		<div class="flex flex-wrap items-center gap-1.5">
			<Button
				variant={filter === 'ALL' ? 'default' : 'outline'}
				size="sm"
				class="h-8 text-xs px-3 rounded-full shadow-none gap-1.5"
				onclick={() => (filter = 'ALL')}
			>
				<span>All Reports</span>
				<span class="font-mono text-[10px] opacity-80">({counts.all})</span>
			</Button>
			<Button
				variant={filter === 'CRITICAL' ? 'default' : 'outline'}
				size="sm"
				class="h-8 text-xs px-3 rounded-full shadow-none gap-1.5"
				onclick={() => (filter = 'CRITICAL')}
			>
				<span>Critical VRU</span>
				<span class="font-mono text-[10px] opacity-80">({counts.critical})</span>
			</Button>
			<Button
				variant={filter === 'REPORTED' ? 'default' : 'outline'}
				size="sm"
				class="h-8 text-xs px-3 rounded-full shadow-none gap-1.5"
				onclick={() => (filter = 'REPORTED')}
			>
				<span>Pending Dispatch</span>
				<span class="font-mono text-[10px] opacity-80">({counts.reported})</span>
			</Button>
			<Button
				variant={filter === 'DISPATCHED' ? 'default' : 'outline'}
				size="sm"
				class="h-8 text-xs px-3 rounded-full shadow-none gap-1.5"
				onclick={() => (filter = 'DISPATCHED')}
			>
				<span>In Repair</span>
				<span class="font-mono text-[10px] opacity-80">({counts.dispatched})</span>
			</Button>
			<Button
				variant={filter === 'RESOLVED' ? 'default' : 'outline'}
				size="sm"
				class="h-8 text-xs px-3 rounded-full shadow-none gap-1.5"
				onclick={() => (filter = 'RESOLVED')}
			>
				<span>Resolved</span>
				<span class="font-mono text-[10px] opacity-80">({counts.resolved})</span>
			</Button>
		</div>

		<div class="relative w-full md:w-64">
			<SearchIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search ticket, street, or ASTM..."
				class="text-xs pl-8 h-8 bg-card border-border shadow-none"
				bind:value={searchQuery}
			/>
		</div>
	</div>

	<!-- Triage Work Order Queue -->
	<Card class="border border-border bg-card shadow-xs overflow-hidden">
		{#if filteredIncidents.length === 0}
			<div class="p-10 text-center space-y-2">
				<p class="text-sm font-semibold text-foreground">No work orders match this filter.</p>
				<p class="text-xs text-muted-foreground">Try resetting the status filter or clearing your search query.</p>
			</div>
		{:else}
			<div class="divide-y divide-border text-xs">
				{#each filteredIncidents as item (item.id)}
					<div class="p-4 sm:p-5 space-y-3 hover:bg-secondary/15 transition-colors">
						<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<!-- Left: Defect Thumbnail + Telemetry -->
							<div class="flex items-start gap-3.5 min-w-0">
								<button
									type="button"
									class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-border bg-muted shrink-0 cursor-pointer group"
									onclick={() => (inspectingTicket = item)}
									title="Inspect defect dossier"
								>
									<img
										src={item.imageUrl}
										alt={item.distress}
										class="w-full h-full object-cover group-hover:scale-105 transition-transform"
									/>
								</button>

								<div class="space-y-1 min-w-0">
									<div class="flex flex-wrap items-center gap-2">
										<span class="font-mono font-bold text-foreground">{item.id}</span>
										<Badge
											variant="outline"
											class="text-[10px] font-mono px-2 py-0 rounded-full {getVruBadgeClass(item.vru)} shadow-none"
										>
											{item.severity.toFixed(1)} {item.vru} VRU
										</Badge>
										<Badge variant="outline" class="text-[10px] font-mono px-2 py-0 border-border">
											{item.status}
										</Badge>
										<span class="text-muted-foreground font-mono text-[11px]">• {item.time}</span>
									</div>

									<p class="font-semibold text-foreground text-sm sm:text-base leading-snug">
										{item.distress}
									</p>

									<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-[11px]">
										<span class="font-mono text-foreground/85">{item.astm}</span>
										<span>•</span>
										<span class="font-mono">Depth: {item.depthEstimate}</span>
										<span>•</span>
										<span>+{item.confirmations} Citizen Confirmations</span>
									</div>

									<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-[11px] pt-0.5">
										<span class="flex items-center gap-1 text-foreground/85 font-medium">
											<MapPinIcon class="h-3 w-3 text-muted-foreground shrink-0" />
											{item.location}
										</span>
										<a
											href="/?incident={item.id}"
											class="font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
										>
											<span>{item.coords}</span>
											<ArrowUpRightIcon class="h-3 w-3" />
										</a>
									</div>

									{#if item.assignedCrew}
										<div class="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-foreground">
											<TruckIcon class="h-3.5 w-3.5 text-muted-foreground" />
											<span>Assigned: <strong>{item.assignedCrew}</strong> ({item.asphaltEstimate})</span>
										</div>
									{/if}
								</div>
							</div>

							<!-- Right: Status-Aware Engineering Actions (No Dead Buttons) -->
							<div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
								{#if item.status === 'REPORTED'}
									<Button
										variant="default"
										size="sm"
										class="h-8 text-xs gap-1.5 shadow-none"
										onclick={() => {
											dispatchingId = dispatchingId === item.id ? null : item.id;
										}}
									>
										<WrenchIcon class="h-3.5 w-3.5" />
										<span>Dispatch Crew</span>
									</Button>
								{:else if item.status === 'DISPATCHED'}
									<Button
										variant="outline"
										size="sm"
										class="h-8 text-xs gap-1.5 border-foreground text-foreground hover:bg-secondary shadow-none"
										onclick={() => markResolved(item.id)}
									>
										<CheckCircleIcon class="h-3.5 w-3.5" />
										<span>Resolve Report</span>
									</Button>
								{:else}
									<Badge variant="secondary" class="h-8 px-3 text-xs font-mono border border-border gap-1.5">
										<CheckCircleIcon class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
										<span>Patched &amp; Verified</span>
									</Badge>
								{/if}

								<Button
									variant="ghost"
									size="sm"
									class="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
									onclick={() => (inspectingTicket = item)}
								>
									<span>Inspect</span>
									<ArrowUpRightIcon class="h-3 w-3" />
								</Button>
							</div>
						</div>

						<!-- Inline Crew Assignment Bar (When Dispatching) -->
						{#if dispatchingId === item.id}
							<div class="rounded-lg border border-border bg-secondary/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<div class="space-y-0.5">
									<span class="text-xs font-semibold text-foreground">
										Assign Field Engineering Unit for {item.id}
									</span>
									<p class="text-[11px] font-mono text-muted-foreground">
										Required Material: {item.asphaltEstimate}
									</p>
								</div>

								<div class="flex flex-wrap items-center gap-2">
									<select
										bind:value={selectedCrew}
										class="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground font-medium"
									>
										{#each availableCrews as crew}
											<option value={crew}>{crew}</option>
										{/each}
									</select>
									<Button
										size="sm"
										class="h-8 text-xs shadow-none"
										onclick={() => confirmDispatch(item.id)}
									>
										Confirm Dispatch
									</Button>
									<Button
										variant="ghost"
										size="sm"
										class="h-8 text-xs"
										onclick={() => (dispatchingId = null)}
									>
										Cancel
									</Button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</Card>
</div>

<!-- Engineering Inspection Dossier Modal -->
{#if inspectingTicket}
	<div
		class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-xl rounded-xl border border-border bg-card text-foreground shadow-xl overflow-hidden">
			<div class="p-4 sm:p-5 border-b border-border flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="font-mono font-bold text-sm">{inspectingTicket.id}</span>
					<Badge variant="outline" class="font-mono text-[10px] border-border">
						{inspectingTicket.status}
					</Badge>
				</div>
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 rounded-full"
					onclick={() => (inspectingTicket = null)}
				>
					<XIcon class="h-4 w-4" />
				</Button>
			</div>

			<div class="p-4 sm:p-5 space-y-4 text-xs">
				<div class="h-56 w-full rounded-lg overflow-hidden border border-border bg-muted">
					<img
						src={inspectingTicket.imageUrl}
						alt={inspectingTicket.distress}
						class="w-full h-full object-cover"
					/>
				</div>

				<div class="space-y-1">
					<h3 class="text-base font-bold text-foreground">{inspectingTicket.distress}</h3>
					<p class="text-muted-foreground leading-relaxed">{inspectingTicket.notes}</p>
				</div>

				<div class="grid grid-cols-2 gap-2.5 p-3 rounded-lg border border-border bg-secondary/20 font-mono text-[11px]">
					<div>
						<span class="text-muted-foreground block">ASTM D6433 Code</span>
						<span class="text-foreground font-semibold">{inspectingTicket.astm}</span>
					</div>
					<div>
						<span class="text-muted-foreground block">Measured Depth</span>
						<span class="text-foreground font-semibold">{inspectingTicket.depthEstimate}</span>
					</div>
					<div>
						<span class="text-muted-foreground block">Material Spec</span>
						<span class="text-foreground font-semibold">{inspectingTicket.asphaltEstimate}</span>
					</div>
					<div>
						<span class="text-muted-foreground block">Assigned Unit</span>
						<span class="text-foreground font-semibold">{inspectingTicket.assignedCrew || 'Pending Dispatch'}</span>
					</div>
				</div>

				<Separator />

				<div class="flex items-center justify-between gap-2">
					<Button
						href="/?incident={inspectingTicket.id}"
						variant="outline"
						size="sm"
						class="h-8 text-xs gap-1.5 border-border shadow-none"
					>
						<MapPinIcon class="h-3.5 w-3.5" />
						<span>Open on GIS Map</span>
					</Button>

					<div class="flex items-center gap-2">
						{#if inspectingTicket.status !== 'RESOLVED'}
							<Button
								size="sm"
								class="h-8 text-xs gap-1.5 shadow-none"
								onclick={() => markResolved(inspectingTicket!.id)}
							>
								<CheckCircleIcon class="h-3.5 w-3.5" />
								<span>Mark Resolved</span>
							</Button>
						{/if}
						<Button
							variant="ghost"
							size="sm"
							class="h-8 text-xs"
							onclick={() => (inspectingTicket = null)}
						>
							Close
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
