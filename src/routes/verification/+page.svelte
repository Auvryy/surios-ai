<script lang="ts">
	import type { PageProps } from './$types.js';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
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

	// Lucide Icons
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import CheckCheckIcon from '@lucide/svelte/icons/check-check';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import AwardIcon from '@lucide/svelte/icons/award';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import ArrowLeftRightIcon from '@lucide/svelte/icons/arrow-left-right';
	import HardHatIcon from '@lucide/svelte/icons/hard-hat';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import PrinterIcon from '@lucide/svelte/icons/printer';
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
	import BikeIcon from '@lucide/svelte/icons/bike';
	import Undo2Icon from '@lucide/svelte/icons/undo-2';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ActivityIcon from '@lucide/svelte/icons/activity';

	let { data }: PageProps = $props();

	// Civil Verification Ticket Interface
	interface VerificationTicket {
		id: string;
		title: string;
		distressType: string;
		astmCode: string;
		locationName: string;
		corridor: string;
		coordinates: string;
		contractorName: string;
		contractorReg: string;
		compactionDensity: number; // e.g. 98.4
		compactionStandard: number; // 97.0
		tackCoatDensity: number; // 0.22 gal/yd²
		tackCoatUnit: string;
		warrantyDaysRemaining: number; // 328
		warrantyExpiry: string;
		repairCompletedDate: string;
		status: 'PENDING_DPWH_AUDIT' | 'DPWH-VERIFIED / RESOLVED';
		communityConfirmations: number;
		beforeImageUrl: string;
		afterImageUrl: string;
		depthMm: number;
		areaM2: number;
		asphaltMix: string;
		jointSealIntegrity: number; // 100%
		flushGradeVarianceMm: number; // 0.8mm
		marshalStabilityKn: number; // 12.8 kN
		mixTempCelsius: number; // 142°C
		signedOffBy?: string;
		signedOffLicense?: string;
		signedOffTimestamp?: string;
		verificationHash?: string;
		disbursementAmount: string;
	}

	// Laguna Municipal Verification Tickets
	let tickets = $state<VerificationTicket[]>([
		{
			id: 'TKT-7821',
			title: 'LSPU Main Entrance Asphalt Pothole Restoration',
			distressType: 'Deep Asphalt Crater & Edge Breakdown',
			astmCode: 'ASTM D6433 (Pothole - High Severity)',
			locationName: 'LSPU Main Entrance, Pedro Guevara Ave, Santa Cruz',
			corridor: 'Pedro Guevara Avenue (Poblacion Corridor)',
			coordinates: '14.2813° N, 121.4173° E',
			contractorName: 'Laguna Asphalt Builders Corp.',
			contractorReg: 'DPWH-REG-2024-LAGUNA-08',
			compactionDensity: 98.4,
			compactionStandard: 97.0,
			tackCoatDensity: 0.22,
			tackCoatUnit: 'gal/yd²',
			warrantyDaysRemaining: 328,
			warrantyExpiry: 'September 15, 2027',
			repairCompletedDate: 'October 18, 2026',
			status: 'PENDING_DPWH_AUDIT',
			communityConfirmations: 28,
			beforeImageUrl: '/uploads/pothole-pre-repair.jpg',
			afterImageUrl: '/uploads/patch-post-repair.jpg',
			depthMm: 68,
			areaM2: 1.45,
			asphaltMix: 'DPWH Item 310 Class A Hot-Mix Asphalt Surface Course',
			jointSealIntegrity: 100,
			flushGradeVarianceMm: 0.8,
			marshalStabilityKn: 12.8,
			mixTempCelsius: 142,
			disbursementAmount: '₱48,500.00'
		},
		{
			id: 'TKT-7819',
			title: 'National Highway Pagsanjan Junction Fatigue Infill',
			distressType: 'Severe Alligator Fatigue & Wheelpath Rutting',
			astmCode: 'ASTM D6433 (Alligator Cracking - Med/High)',
			locationName: 'National Highway, Km 84+200, Pagsanjan Junction',
			corridor: 'Manila East Rd / National Highway',
			coordinates: '14.2765° N, 121.4312° E',
			contractorName: 'Laguna Asphalt Builders Corp.',
			contractorReg: 'DPWH-REG-2024-LAGUNA-08',
			compactionDensity: 98.1,
			compactionStandard: 97.0,
			tackCoatDensity: 0.23,
			tackCoatUnit: 'gal/yd²',
			warrantyDaysRemaining: 342,
			warrantyExpiry: 'September 29, 2027',
			repairCompletedDate: 'October 14, 2026',
			status: 'DPWH-VERIFIED / RESOLVED',
			communityConfirmations: 34,
			beforeImageUrl: '/samples/alligator-fatigue.jpg',
			afterImageUrl: '/uploads/patch-post-repair.jpg',
			depthMm: 45,
			areaM2: 3.8,
			asphaltMix: 'DPWH Item 310 Bituminous Concrete Surface Course',
			jointSealIntegrity: 99,
			flushGradeVarianceMm: 1.1,
			marshalStabilityKn: 13.2,
			mixTempCelsius: 145,
			signedOffBy: 'Engr. Danilo Reyes, PE',
			signedOffLicense: 'PRC Reg. No. 0089412',
			signedOffTimestamp: 'Oct 15, 2026, 09:30:00 PST',
			verificationHash: 'DPWH-310-LAG-7819-A8F2',
			disbursementAmount: '₱112,000.00'
		},
		{
			id: 'TKT-7814',
			title: 'Barangay Bubukal Corridor Shoulder Infill',
			distressType: 'Drainage Edge Scour & Drop-Off (75mm)',
			astmCode: 'ASTM D6433 (Edge Defect - High)',
			locationName: 'Barangay Bubukal Student Corridor, Santa Cruz',
			corridor: 'Quezon Ave – Bubukal Student Corridor',
			coordinates: '14.2690° N, 121.4021° E',
			contractorName: 'Laguna Asphalt Builders Corp.',
			contractorReg: 'DPWH-REG-2024-LAGUNA-08',
			compactionDensity: 97.8,
			compactionStandard: 97.0,
			tackCoatDensity: 0.21,
			tackCoatUnit: 'gal/yd²',
			warrantyDaysRemaining: 315,
			warrantyExpiry: 'September 02, 2027',
			repairCompletedDate: 'October 10, 2026',
			status: 'PENDING_DPWH_AUDIT',
			communityConfirmations: 19,
			beforeImageUrl: '/samples/pothole-severe.jpg',
			afterImageUrl: '/uploads/patch-post-repair.jpg',
			depthMm: 75,
			areaM2: 2.1,
			asphaltMix: 'DPWH Item 310 Hot-Mix Asphalt Mix Course',
			jointSealIntegrity: 98,
			flushGradeVarianceMm: 1.4,
			marshalStabilityKn: 12.1,
			mixTempCelsius: 139,
			disbursementAmount: '₱64,200.00'
		},
		{
			id: 'TKT-7798',
			title: 'Pedro Guevara Transverse Joint Recapping',
			distressType: 'Transverse Thermal Crack & Cavity',
			astmCode: 'ASTM D6433 (Transverse Crack - Low/Med)',
			locationName: 'Pedro Guevara Ave (Near Provincial Capitol)',
			corridor: 'Pedro Guevara Avenue (Poblacion Corridor)',
			coordinates: '14.2840° N, 121.4190° E',
			contractorName: 'Laguna Asphalt Builders Corp.',
			contractorReg: 'DPWH-REG-2024-LAGUNA-08',
			compactionDensity: 98.7,
			compactionStandard: 97.0,
			tackCoatDensity: 0.24,
			tackCoatUnit: 'gal/yd²',
			warrantyDaysRemaining: 301,
			warrantyExpiry: 'August 19, 2027',
			repairCompletedDate: 'October 01, 2026',
			status: 'DPWH-VERIFIED / RESOLVED',
			communityConfirmations: 42,
			beforeImageUrl: '/uploads/1792497053187-c0f0987e311e.jpeg',
			afterImageUrl: '/uploads/patch-post-repair.jpg',
			depthMm: 38,
			areaM2: 1.1,
			asphaltMix: 'DPWH Item 310 Asphalt Wearing Course',
			jointSealIntegrity: 100,
			flushGradeVarianceMm: 0.6,
			marshalStabilityKn: 13.6,
			mixTempCelsius: 144,
			signedOffBy: 'Engr. Danilo Reyes, PE',
			signedOffLicense: 'PRC Reg. No. 0089412',
			signedOffTimestamp: 'Oct 02, 2026, 14:15:22 PST',
			verificationHash: 'DPWH-310-LAG-7798-9B11',
			disbursementAmount: '₱35,000.00'
		}
	]);

	// Active Ticket State
	let selectedTicketId = $state<string>('TKT-7821');
	const currentTicket = $derived(
		tickets.find((t) => t.id === selectedTicketId) || tickets[0]
	);

	// Image Comparison Slider State
	let sliderPosition = $state<number>(50); // percentage 0 to 100
	let isDragging = $state<boolean>(false);
	let sliderContainer = $state<HTMLDivElement | null>(null);
	let viewMode = $state<'slider' | 'side-by-side' | 'ab-toggle'>('slider');
	let activeAB = $state<'before' | 'after'>('after');
	let showAiAnnotations = $state<boolean>(true);
	let activeImagePreset = $state<'standard' | 'uploads_ref' | 'alligator' | 'svg_texture'>('standard');

	// Image error fallback tracking
	let beforeImgFailed = $state<boolean>(false);
	let afterImgFailed = $state<boolean>(false);

	// Community confirmation tracking
	let hasUserConfirmed = $state<Record<string, boolean>>({});
	let communityBanner = $state<{ show: boolean; message: string; count: number } | null>(null);

	// Engineering Sign-off State
	let isSigning = $state<boolean>(false);
	let isSignOffDialogOpen = $state<boolean>(false);
	let signOffBanner = $state<{ show: boolean; title: string; hash: string } | null>(null);
	let inspectorNotes = $state<string>(
		'DPWH Item 310 bituminous surface course compaction verified at 98.4% (exceeds >97.0% minimum spec). Perimeter joint sealed with ASTM D6690 bitumen. 1-Year contractor warranty active under DPWH-REG-2024-LAGUNA-08. Cleared for municipal fund release.'
	);

	// Compute effective image URLs based on preset or fallback
	const effectiveBeforeImage = $derived.by(() => {
		if (activeImagePreset === 'svg_texture') return null;
		if (activeImagePreset === 'uploads_ref') return '/uploads/1792497053187-c0f0987e311e.jpeg';
		if (activeImagePreset === 'alligator') return '/samples/alligator-fatigue.jpg';
		return currentTicket.beforeImageUrl;
	});

	const effectiveAfterImage = $derived.by(() => {
		if (activeImagePreset === 'svg_texture') return null;
		if (activeImagePreset === 'uploads_ref') return '/uploads/patch-post-repair.jpg';
		return currentTicket.afterImageUrl;
	});

	// Slider Pointer Events
	function handlePointerDown(e: PointerEvent) {
		isDragging = true;
		updateSliderPosition(e);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging) return;
		updateSliderPosition(e);
	}

	function handlePointerUp() {
		isDragging = false;
	}

	function updateSliderPosition(e: PointerEvent) {
		if (!sliderContainer) return;
		const rect = sliderContainer.getBoundingClientRect();
		const clientX = e.clientX;
		const offset = clientX - rect.left;
		const pct = Math.max(0, Math.min(100, (offset / rect.width) * 100));
		sliderPosition = Math.round(pct);
	}

	// Community Confirmation Button Action (+1 Confirm Smooth Road)
	function handleCommunityConfirm() {
		const target = currentTicket;
		target.communityConfirmations += 1;
		hasUserConfirmed[target.id] = true;

		communityBanner = {
			show: true,
			message: `Thank you for contributing! Your field verification for ${target.id} (${target.locationName}) has been logged to the Santa Cruz commuter ledger.`,
			count: target.communityConfirmations
		};

		setTimeout(() => {
			if (communityBanner) communityBanner.show = false;
		}, 5000);
	}

	// Engineering Sign-Off Button Action (Approve & Stamp DPWH Sign-off)
	function handleApproveSignOff() {
		isSigning = true;

		setTimeout(() => {
			const target = tickets.find((t) => t.id === selectedTicketId);
			if (target) {
				const now = new Date();
				const formattedDate = now.toLocaleDateString('en-PH', {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				});
				const formattedTime = now.toLocaleTimeString('en-PH', {
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hour12: false
				});

				target.status = 'DPWH-VERIFIED / RESOLVED';
				target.signedOffBy = data?.user?.name
					? `${data.user.name}, PE`
					: 'Engr. Danilo Reyes, PE';
				target.signedOffLicense = data?.user?.badgeNumber
					? `PRC Reg. No. ${data.user.badgeNumber}`
					: 'PRC Reg. No. 0089412';
				target.signedOffTimestamp = `${formattedDate}, ${formattedTime} PST`;
				target.verificationHash = `DPWH-310-LAG-${target.id}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

				signOffBanner = {
					show: true,
					title: 'DPWH Engineering Sign-off & Official Stamp Affixed',
					hash: target.verificationHash
				};
			}

			isSigning = false;
			isSignOffDialogOpen = false;
		}, 450);
	}

	// Revoke / Return to Audit (for inspection testing)
	function handleRevokeSignOff() {
		const target = tickets.find((t) => t.id === selectedTicketId);
		if (target) {
			target.status = 'PENDING_DPWH_AUDIT';
			target.signedOffBy = undefined;
			target.signedOffLicense = undefined;
			target.signedOffTimestamp = undefined;
			target.verificationHash = undefined;
			signOffBanner = null;
		}
	}
</script>

<svelte:head>
	<title>Proof-of-Patch Workstation (DPWH Item 310) — SuriOS</title>
</svelte:head>

<svelte:window onpointermove={handlePointerMove} onpointerup={handlePointerUp} />

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
	<!-- Workspace Header -->
	<div class="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-6">
		<div class="space-y-1.5">
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant="outline" class="text-xs font-mono border-primary text-primary bg-primary/10">
					DPWH Standard Item 310
				</Badge>
				<Badge variant="secondary" class="text-xs font-mono border-border">
					Workstation Module D
				</Badge>
				<span class="text-xs text-muted-foreground">Santa Cruz, Laguna District Office</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
				<CheckCheckIcon class="h-6 w-6 text-primary shrink-0" />
				<span>Proof-of-Patch AI Verification Workstation</span>
			</h1>
			<p class="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
				Multimodal Gemini vision inspection and civil engineering compliance sign-off. Audits compaction density, edge joint sealing, and 1-year warranty performance before municipal asphalt fund release.
			</p>
		</div>

		<!-- Workstation Top Action Bar -->
		<div class="flex flex-wrap items-center gap-2 shrink-0">
			{#if currentTicket.status === 'DPWH-VERIFIED / RESOLVED'}
				<div class="flex items-center gap-2">
					<Badge class="bg-primary text-primary-foreground border-primary text-xs px-2.5 py-1 font-mono font-semibold">
						✓ DPWH-VERIFIED
					</Badge>
					<Button
						variant="outline"
						size="sm"
						class="text-xs h-8 border-border gap-1 text-muted-foreground hover:text-foreground shadow-none"
						onclick={handleRevokeSignOff}
						title="Return ticket to pending audit status"
					>
						<Undo2Icon class="h-3 w-3" />
						<span>Revoke Stamp</span>
					</Button>
				</div>
			{:else}
				<Button
					size="sm"
					class="text-xs h-8.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium gap-1.5 shadow-none"
					onclick={() => (isSignOffDialogOpen = true)}
				>
					<AwardIcon class="h-3.5 w-3.5" />
					<span>Approve & Stamp DPWH Sign-off</span>
				</Button>
			{/if}

			<Button
				variant="outline"
				size="sm"
				class="text-xs h-8.5 border-border gap-1.5 shadow-none"
				onclick={() => window.print()}
			>
				<PrinterIcon class="h-3.5 w-3.5 text-muted-foreground" />
				<span class="hidden sm:inline">Print Certificate</span>
			</Button>
		</div>
	</div>

	<!-- Interactive Status Feedback Banners -->
	{#if signOffBanner?.show}
		<Alert class="border border-primary/40 bg-primary/5 text-foreground shadow-none">
			<ShieldCheckIcon class="h-4 w-4 text-primary shrink-0 mt-0.5" />
			<div class="space-y-1 flex-1">
				<AlertTitle class="text-sm font-bold text-foreground flex items-center justify-between">
					<span>{signOffBanner.title}</span>
					<span class="text-xs font-mono text-primary font-semibold">VERIFIED</span>
				</AlertTitle>
				<AlertDescription class="text-xs text-muted-foreground">
					Asphalt patch ticket <strong class="text-foreground">{currentTicket.id}</strong> has been certified compliant with DPWH Standard Item 310. Digital inspector seal applied by <strong class="text-foreground">{currentTicket.signedOffBy}</strong>. Digital Hash: <code class="font-mono text-primary text-[11px] bg-background px-1.5 py-0.5 rounded border border-border">{signOffBanner.hash}</code>. Fund release authorized for {currentTicket.disbursementAmount}.
				</AlertDescription>
			</div>
			<Button
				variant="ghost"
				size="icon-sm"
				class="h-7 w-7 text-muted-foreground hover:text-foreground"
				onclick={() => (signOffBanner = null)}
			>
				✕
			</Button>
		</Alert>
	{/if}

	{#if communityBanner?.show}
		<Alert class="border border-border bg-card shadow-none">
			<ThumbsUpIcon class="h-4 w-4 text-primary shrink-0 mt-0.5" />
			<div class="space-y-1 flex-1">
				<AlertTitle class="text-sm font-semibold text-foreground flex items-center justify-between">
					<span>Community Field Verification Count Updated</span>
					<span class="text-xs font-mono text-muted-foreground">Total: {communityBanner.count} Confirmations</span>
				</AlertTitle>
				<AlertDescription class="text-xs text-muted-foreground">
					{communityBanner.message}
				</AlertDescription>
			</div>
			<Button
				variant="ghost"
				size="icon-sm"
				class="h-7 w-7 text-muted-foreground hover:text-foreground"
				onclick={() => (communityBanner = null)}
			>
				✕
			</Button>
		</Alert>
	{/if}

	<!-- Section: Workstation Ticket Selector Bar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30 p-2.5 rounded-lg border border-border">
		<div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
			<span class="text-xs font-medium text-muted-foreground px-2 flex items-center gap-1 shrink-0">
				<FileTextIcon class="h-3.5 w-3.5" />
				<span>Audit Queue:</span>
			</span>
			{#each tickets as ticket}
				{@const isSelected = selectedTicketId === ticket.id}
				<button
					type="button"
					onclick={() => (selectedTicketId = ticket.id)}
					class="px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 flex items-center gap-2 border {isSelected
						? 'bg-card text-foreground font-semibold border-border shadow-xs'
						: 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60'}"
				>
					<span class="font-mono">{ticket.id}</span>
					<Badge
						variant={ticket.status === 'DPWH-VERIFIED / RESOLVED' ? 'default' : 'outline'}
						class="text-[9px] px-1 py-0 h-4 font-mono {ticket.status === 'DPWH-VERIFIED / RESOLVED'
							? 'bg-primary text-primary-foreground border-primary'
							: 'border-border text-muted-foreground'}"
					>
						{ticket.status === 'DPWH-VERIFIED / RESOLVED' ? 'VERIFIED' : 'PENDING'}
					</Badge>
				</button>
			{/each}
		</div>

		<div class="flex items-center gap-2 shrink-0 px-2 sm:px-0">
			<span class="text-xs text-muted-foreground">
				<strong class="text-foreground">{tickets.filter((t) => t.status === 'DPWH-VERIFIED / RESOLVED').length}</strong> of {tickets.length} Audited
			</span>
		</div>
	</div>

	<!-- Section 1: DPWH Item 310 Quality Scorecard & 1-Year Warranty Tracker (Requirement 3) -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<HardHatIcon class="h-4 w-4 text-primary" />
				<h2 class="text-sm font-bold tracking-tight uppercase text-muted-foreground font-mono">
					DPWH Item 310 Quality Scorecard & 1-Year Warranty Tracker
				</h2>
			</div>
			<Badge variant="outline" class="text-[10px] font-mono border-border">
				AASHTO T-209 / ASTM D6433
			</Badge>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<!-- Metric 1: Compaction Density (Requirement 3: 98.4%) -->
			<Card class="border border-border bg-card shadow-none">
				<CardHeader class="pb-2">
					<div class="flex items-center justify-between">
						<CardDescription class="text-xs font-medium text-muted-foreground">Compaction Density</CardDescription>
						<Badge class="bg-primary/15 text-primary border-primary/30 text-[10px] font-mono">
							DPWH PASS
						</Badge>
					</div>
					<div class="flex items-baseline gap-2 mt-1">
						<CardTitle class="text-3xl font-bold tracking-tight text-foreground font-mono">
							{currentTicket.compactionDensity}%
						</CardTitle>
						<span class="text-xs font-mono text-muted-foreground">
							(Spec: &gt;{currentTicket.compactionStandard}%)
						</span>
					</div>
				</CardHeader>
				<CardContent class="text-xs text-muted-foreground pt-0 space-y-2">
					<div class="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border">
						<div
							class="bg-primary h-full transition-all duration-500 rounded-full"
							style="width: {currentTicket.compactionDensity}%"
						></div>
					</div>
					<p class="text-[11px] leading-tight text-muted-foreground">
						Passes DPWH Standard Item 310 (&gt;97.0%). Tested via calibrated nuclear density gauge.
					</p>
				</CardContent>
			</Card>

			<!-- Metric 2: Tack Coat Density (Requirement 3: 0.22 gal/yd²) -->
			<Card class="border border-border bg-card shadow-none">
				<CardHeader class="pb-2">
					<div class="flex items-center justify-between">
						<CardDescription class="text-xs font-medium text-muted-foreground">Tack Coat Density</CardDescription>
						<Badge variant="outline" class="text-[10px] font-mono border-border">
							Item 302 Emulsion
						</Badge>
					</div>
					<div class="flex items-baseline gap-2 mt-1">
						<CardTitle class="text-3xl font-bold tracking-tight text-foreground font-mono">
							{currentTicket.tackCoatDensity}
						</CardTitle>
						<span class="text-xs font-mono text-muted-foreground">
							{currentTicket.tackCoatUnit}
						</span>
					</div>
				</CardHeader>
				<CardContent class="text-xs text-muted-foreground pt-0 space-y-2">
					<div class="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border">
						<div
							class="bg-primary h-full transition-all duration-500 rounded-full"
							style="width: {(currentTicket.tackCoatDensity / 0.3) * 100}%"
						></div>
					</div>
					<p class="text-[11px] leading-tight text-muted-foreground">
						Optimal SS-1h rapid-setting asphalt emulsion. Ensures bonding with concrete subgrade.
					</p>
				</CardContent>
			</Card>

			<!-- Metric 3: Live 1-Year Warranty Tracker (Requirement 3: 328 days remaining) -->
			<Card class="border border-border bg-card shadow-none">
				<CardHeader class="pb-2">
					<div class="flex items-center justify-between">
						<CardDescription class="text-xs font-medium text-muted-foreground">1-Year Warranty Tracker</CardDescription>
						<div class="flex items-center gap-1">
							<span class="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
							<span class="text-[10px] font-mono text-primary font-medium">LIVE</span>
						</div>
					</div>
					<div class="flex items-baseline gap-2 mt-1">
						<CardTitle class="text-3xl font-bold tracking-tight text-foreground font-mono">
							{currentTicket.warrantyDaysRemaining}
						</CardTitle>
						<span class="text-xs font-mono text-muted-foreground">
							days remaining
						</span>
					</div>
				</CardHeader>
				<CardContent class="text-xs text-muted-foreground pt-0 space-y-2">
					<div class="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border">
						<div
							class="bg-primary h-full transition-all duration-500 rounded-full"
							style="width: {(currentTicket.warrantyDaysRemaining / 365) * 100}%"
						></div>
					</div>
					<p class="text-[11px] leading-tight text-muted-foreground">
						Under RA 9184 &amp; DPWH Section 310.6. Expires <strong>{currentTicket.warrantyExpiry}</strong>.
					</p>
				</CardContent>
			</Card>

			<!-- Metric 4: Assigned Contractor (Requirement 3: Laguna Asphalt Builders Corp.) -->
			<Card class="border border-border bg-card shadow-none">
				<CardHeader class="pb-2">
					<div class="flex items-center justify-between">
						<CardDescription class="text-xs font-medium text-muted-foreground">Assigned Contractor</CardDescription>
						<Badge variant="outline" class="text-[10px] font-mono border-border">
							PCAB Class A
						</Badge>
					</div>
					<CardTitle class="text-sm font-bold text-foreground mt-1 line-clamp-1 leading-snug" title={currentTicket.contractorName}>
						{currentTicket.contractorName}
					</CardTitle>
				</CardHeader>
				<CardContent class="text-xs text-muted-foreground pt-0 space-y-1.5">
					<div class="p-1.5 rounded bg-secondary/50 border border-border font-mono text-[11px] text-foreground truncate">
						{currentTicket.contractorReg}
					</div>
					<p class="text-[11px] leading-tight text-muted-foreground">
						DPWH Region IV-A Accredited. Guaranteed defect repair bond on file.
					</p>
				</CardContent>
			</Card>
		</div>
	</div>

	<!-- Section 2: Interactive Before & After Image Comparison Workstation (Requirement 2) -->
	<Card class="border border-border bg-card shadow-none">
		<CardHeader class="pb-4 border-b border-border">
			<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
				<div class="space-y-1">
					<div class="flex items-center gap-2">
						<span class="font-mono text-xs font-bold text-foreground">{currentTicket.id}</span>
						<span class="text-muted-foreground text-xs">•</span>
						<span class="text-xs font-medium text-foreground">{currentTicket.title}</span>
						<Badge
							variant="outline"
							class="text-[10px] font-mono border-border {currentTicket.status === 'DPWH-VERIFIED / RESOLVED'
								? 'bg-primary/10 text-primary border-primary/30'
								: 'text-muted-foreground'}"
						>
							{currentTicket.status}
						</Badge>
					</div>
					<CardDescription class="text-xs text-muted-foreground flex items-center gap-2">
						<MapPinIcon class="h-3.5 w-3.5 text-primary shrink-0" />
						<span>{currentTicket.locationName}</span>
						<span class="font-mono text-muted-foreground">({currentTicket.coordinates})</span>
					</CardDescription>
				</div>

				<!-- Visual Mode Selector & Controls -->
				<div class="flex flex-wrap items-center gap-2">
					<!-- Image Dataset Preset Switcher -->
					<div class="flex items-center rounded-md border border-border bg-secondary/40 p-0.5 text-xs">
						<button
							type="button"
							class="px-2 py-1 rounded text-[11px] font-medium transition-colors {activeImagePreset === 'standard'
								? 'bg-card text-foreground font-semibold shadow-xs'
								: 'text-muted-foreground hover:text-foreground'}"
							onclick={() => (activeImagePreset = 'standard')}
							title="High-definition top-down road repair photography"
						>
							High-Def Patch
						</button>
						<button
							type="button"
							class="px-2 py-1 rounded text-[11px] font-medium transition-colors {activeImagePreset === 'uploads_ref'
								? 'bg-card text-foreground font-semibold shadow-xs'
								: 'text-muted-foreground hover:text-foreground'}"
							onclick={() => (activeImagePreset = 'uploads_ref')}
							title="Reference uploads from system storage"
						>
							System Uploads
						</button>
						<button
							type="button"
							class="px-2 py-1 rounded text-[11px] font-medium transition-colors {activeImagePreset === 'svg_texture'
								? 'bg-card text-foreground font-semibold shadow-xs'
								: 'text-muted-foreground hover:text-foreground'}"
							onclick={() => (activeImagePreset = 'svg_texture')}
							title="Procedural asphalt road texture & vector CAD overlay"
						>
							Procedural SVG
						</button>
					</div>

					<!-- View Mode Buttons -->
					<div class="flex items-center rounded-md border border-border bg-secondary/40 p-0.5 text-xs">
						<button
							type="button"
							class="px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 {viewMode === 'slider'
								? 'bg-card text-foreground font-semibold shadow-xs'
								: 'text-muted-foreground hover:text-foreground'}"
							onclick={() => (viewMode = 'slider')}
						>
							<SlidersHorizontalIcon class="h-3 w-3" />
							<span>Drag Slider</span>
						</button>
						<button
							type="button"
							class="px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 {viewMode === 'side-by-side'
								? 'bg-card text-foreground font-semibold shadow-xs'
								: 'text-muted-foreground hover:text-foreground'}"
							onclick={() => (viewMode = 'side-by-side')}
						>
							<LayersIcon class="h-3 w-3" />
							<span>Side-by-Side</span>
						</button>
						<button
							type="button"
							class="px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 {viewMode === 'ab-toggle'
								? 'bg-card text-foreground font-semibold shadow-xs'
								: 'text-muted-foreground hover:text-foreground'}"
							onclick={() => (viewMode = 'ab-toggle')}
						>
							<EyeIcon class="h-3 w-3" />
							<span>A/B Flip</span>
						</button>
					</div>

					<!-- Toggle Gemini AI Annotations -->
					<Button
						variant={showAiAnnotations ? 'secondary' : 'outline'}
						size="sm"
						class="text-xs h-7.5 border-border gap-1 shadow-none"
						onclick={() => (showAiAnnotations = !showAiAnnotations)}
					>
						<SparklesIcon class="h-3 w-3 text-primary" />
						<span class="hidden sm:inline">AI Vision Audit</span>
					</Button>
				</div>
			</div>
		</CardHeader>

		<CardContent class="p-4 sm:p-6 space-y-4">
			<!-- Slider View Mode -->
			{#if viewMode === 'slider'}
				<div class="space-y-3">
					<!-- Comparison Container with interactive Drag Divider -->
					<div
						bind:this={sliderContainer}
						onpointerdown={handlePointerDown}
						role="slider"
						aria-label="Before and After Pavement Comparison Slider"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={sliderPosition}
						tabindex={0}
						class="relative w-full h-[340px] sm:h-[440px] rounded-xl overflow-hidden border border-border bg-neutral-950 select-none cursor-ew-resize touch-none shadow-xs group"
					>
						<!-- BOTTOM LAYER: AFTER / COMPLETED ASPHALT PATCH -->
						<div class="absolute inset-0 w-full h-full">
							{#if effectiveAfterImage && !afterImgFailed}
								<img
									src={effectiveAfterImage}
									alt="Completed DPWH Item 310 Asphalt Patch"
									class="w-full h-full object-cover pointer-events-none"
									onerror={() => (afterImgFailed = true)}
								/>
							{:else}
								<!-- Procedural SVG Fallback for Completed Patch -->
								<svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="none">
									<rect width="800" height="600" fill="#202225" />
									<!-- Asphalt Grain Dots -->
									<filter id="asphalt-grain-after">
										<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
										<feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.12  0 0 0 0 0.13  0 0 0 0.35 0" />
									</filter>
									<rect width="800" height="600" filter="url(#asphalt-grain-after)" />
									<!-- Restored White Road Marker -->
									<rect x="710" y="0" width="30" height="600" fill="#e2e8f0" opacity="0.85" />
									<!-- Fresh Compacted Hot-Mix Asphalt Patch -->
									<rect x="180" y="110" width="440" height="380" rx="4" fill="#141517" stroke="#000" stroke-width="4" />
									<!-- Bituminous Joint Seal Ring -->
									<rect x="178" y="108" width="444" height="384" rx="6" fill="none" stroke="#262626" stroke-width="6" opacity="0.9" />
									<!-- Roller Pass Texture Lines -->
									<line x1="200" y1="200" x2="600" y2="200" stroke="#1f2124" stroke-width="2" stroke-dasharray="10 5" />
									<line x1="200" y1="300" x2="600" y2="300" stroke="#1f2124" stroke-width="2" stroke-dasharray="10 5" />
									<line x1="200" y1="400" x2="600" y2="400" stroke="#1f2124" stroke-width="2" stroke-dasharray="10 5" />
									<!-- Civil Stencil Mark -->
									<text x="210" y="150" font-family="monospace" font-size="14" fill="#f59e0b" font-weight="bold">DPWH ITEM 310 — PASS (98.4%)</text>
								</svg>
							{/if}

							<!-- After Badges -->
							<div class="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5 pointer-events-none">
								<Badge class="bg-black/85 text-primary border-primary/40 text-[10px] font-mono backdrop-blur px-2 py-0.5">
									COMPLETED PATCH (ITEM 310)
								</Badge>
								<span class="text-[10px] text-white/80 font-mono bg-black/60 px-1.5 py-0.5 rounded">
									Compaction: {currentTicket.compactionDensity}%
								</span>
							</div>
						</div>

						<!-- TOP LAYER: BEFORE / PRE-REPAIR POTHOLE (Clipped by slider position) -->
						<div
							class="absolute inset-0 w-full h-full overflow-hidden"
							style="clip-path: inset(0 calc(100% - {sliderPosition}%) 0 0);"
						>
							{#if effectiveBeforeImage && !beforeImgFailed}
								<img
									src={effectiveBeforeImage}
									alt="Pre-repair Pothole Defect"
									class="w-full h-full object-cover pointer-events-none"
									onerror={() => (beforeImgFailed = true)}
								/>
							{:else}
								<!-- Procedural SVG Fallback for Pre-repair Defect -->
								<svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="none">
									<rect width="800" height="600" fill="#383a3f" />
									<!-- Weathered Road Marking -->
									<rect x="60" y="0" width="30" height="600" fill="#cbd5e1" opacity="0.45" stroke-dasharray="15 10" />
									<!-- Cracked Road Lines -->
									<path d="M 200 120 Q 250 200 320 180 T 450 150" stroke="#1e2022" stroke-width="3" fill="none" />
									<path d="M 450 380 Q 520 440 580 400" stroke="#1e2022" stroke-width="3" fill="none" />
									<!-- Pothole Crater Cavity -->
									<ellipse cx="400" cy="300" rx="200" ry="160" fill="#1b1c1e" stroke="#2d2f34" stroke-width="8" />
									<ellipse cx="400" cy="305" rx="170" ry="130" fill="#101112" />
									<ellipse cx="410" cy="315" rx="120" ry="85" fill="#08090a" />
									<!-- Cavity Aggregate Stones & Water Reflection -->
									<circle cx="360" cy="280" r="12" fill="#52525b" />
									<circle cx="430" cy="320" r="16" fill="#3f3f46" />
									<circle cx="390" cy="340" r="9" fill="#71717a" />
									<circle cx="450" cy="270" r="14" fill="#52525b" />
									<!-- Severe Hazard Depth Marker -->
									<text x="310" y="310" font-family="monospace" font-size="16" fill="#ef4444" font-weight="bold">DEPTH: 68mm (CRITICAL)</text>
								</svg>
							{/if}

							<!-- Before Badges -->
							<div class="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5 pointer-events-none">
								<Badge class="bg-black/85 text-destructive border-destructive/40 text-[10px] font-mono backdrop-blur px-2 py-0.5">
									PRE-REPAIR DEFECT
								</Badge>
								<span class="text-[10px] text-white/80 font-mono bg-black/60 px-1.5 py-0.5 rounded">
									Cavity Depth: {currentTicket.depthMm}mm
								</span>
							</div>
						</div>

						<!-- Gemini Multimodal AI Vision Annotations Overlay -->
						{#if showAiAnnotations}
							<div class="absolute inset-0 pointer-events-none z-20">
								<!-- AI Bounding Box & Telemetry Markers -->
								<div class="absolute left-1/4 top-1/4 w-1/2 h-1/2 border border-dashed border-primary/70 rounded bg-primary/5 flex flex-col justify-between p-2">
									<div class="flex items-center justify-between text-[10px] font-mono">
										<span class="bg-black/90 text-primary px-1.5 py-0.5 rounded border border-primary/40 font-bold">
											GEMINI MULTIMODAL AUDIT: 99.4% CONFIDENCE
										</span>
										<span class="bg-black/90 text-white/80 px-1.5 py-0.5 rounded">
											Area: {currentTicket.areaM2} m²
										</span>
									</div>
									<div class="flex items-center justify-between text-[10px] font-mono">
										<span class="bg-black/90 text-foreground px-1.5 py-0.5 rounded border border-border">
											Flush Grade: {currentTicket.flushGradeVarianceMm}mm deviation
										</span>
										<span class="bg-black/90 text-primary px-1.5 py-0.5 rounded border border-primary/40">
											Joint Seal: {currentTicket.jointSealIntegrity}%
										</span>
									</div>
								</div>
							</div>
						{/if}

						<!-- VERTICAL DIVIDER LINE & HANDLE -->
						<div
							class="absolute top-0 bottom-0 w-0.5 bg-primary -translate-x-1/2 z-30 pointer-events-none"
							style="left: {sliderPosition}%;"
						>
							<!-- Center Draggable Knob with Dual Arrows -->
							<div
								class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md border-2 border-background cursor-ew-resize transition-transform duration-75 group-hover:scale-105 active:scale-95"
							>
								<ArrowLeftRightIcon class="h-4 w-4" />
							</div>
						</div>
					</div>

					<!-- Slider Controller Bar & Quick Jump Presets -->
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
						<div class="flex items-center gap-2 flex-1">
							<span class="text-xs font-mono text-muted-foreground shrink-0 w-20">
								Before: {sliderPosition}%
							</span>
							<input
								type="range"
								min="0"
								max="100"
								bind:value={sliderPosition}
								class="w-full accent-primary h-2 cursor-pointer bg-secondary rounded-lg"
								aria-label="Adjust Before and After Comparison Position"
							/>
							<span class="text-xs font-mono text-muted-foreground shrink-0 w-20 text-right">
								After: {100 - sliderPosition}%
							</span>
						</div>

						<!-- Quick Preset Buttons -->
						<div class="flex items-center gap-1 shrink-0">
							<Button
								variant="outline"
								size="sm"
								class="h-7 text-[11px] px-2 border-border shadow-none"
								onclick={() => (sliderPosition = 100)}
							>
								100% Pre-Repair
							</Button>
							<Button
								variant="outline"
								size="sm"
								class="h-7 text-[11px] px-2 border-border shadow-none"
								onclick={() => (sliderPosition = 50)}
							>
								50/50 Split
							</Button>
							<Button
								variant="outline"
								size="sm"
								class="h-7 text-[11px] px-2 border-border shadow-none"
								onclick={() => (sliderPosition = 0)}
							>
								100% Completed
							</Button>
						</div>
					</div>
				</div>

			<!-- Side-by-Side Dual View Mode -->
			{:else if viewMode === 'side-by-side'}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Card 1: Pre-Repair Defect -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<span class="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<AlertTriangleIcon class="h-3.5 w-3.5 text-destructive" />
								<span>Pre-Repair Pothole Cavity</span>
							</span>
							<Badge variant="outline" class="text-[10px] font-mono border-destructive/40 text-destructive">
								Depth: {currentTicket.depthMm}mm
							</Badge>
						</div>
						<div class="relative h-[280px] sm:h-[340px] rounded-xl overflow-hidden border border-border bg-neutral-950">
							{#if effectiveBeforeImage && !beforeImgFailed}
								<img
									src={effectiveBeforeImage}
									alt="Pre-repair pothole defect"
									class="w-full h-full object-cover"
									onerror={() => (beforeImgFailed = true)}
								/>
							{:else}
								<div class="w-full h-full flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
									<AlertTriangleIcon class="h-8 w-8 text-destructive mb-2" />
									<span class="text-xs font-mono">ASTM D6433 Pothole Crater Scan</span>
									<span class="text-[11px]">Depth: 68mm • High Hazard</span>
								</div>
							{/if}
							<div class="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur p-2 rounded text-[11px] font-mono text-white/90">
								ASTM D6433 Distress: {currentTicket.distressType}
							</div>
						</div>
					</div>

					<!-- Card 2: Completed Asphalt Patch -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<span class="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<CheckCircleIcon class="h-3.5 w-3.5 text-primary" />
								<span>Completed Hot-Mix Asphalt Patch</span>
							</span>
							<Badge class="bg-primary text-primary-foreground border-primary text-[10px] font-mono">
								Compaction: {currentTicket.compactionDensity}%
							</Badge>
						</div>
						<div class="relative h-[280px] sm:h-[340px] rounded-xl overflow-hidden border border-border bg-neutral-950">
							{#if effectiveAfterImage && !afterImgFailed}
								<img
									src={effectiveAfterImage}
									alt="Completed asphalt patch"
									class="w-full h-full object-cover"
									onerror={() => (afterImgFailed = true)}
								/>
							{:else}
								<div class="w-full h-full flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
									<CheckCircleIcon class="h-8 w-8 text-primary mb-2" />
									<span class="text-xs font-mono">DPWH Item 310 Asphalt Patch</span>
									<span class="text-[11px]">Compaction: 98.4% • 100% Sealed</span>
								</div>
							{/if}
							<div class="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur p-2 rounded text-[11px] font-mono text-white/90">
								Specification: {currentTicket.asphaltMix}
							</div>
						</div>
					</div>
				</div>

			<!-- A/B Flip Toggle Mode -->
			{:else}
				<div class="space-y-3">
					<div class="flex items-center justify-center gap-2">
						<Button
							variant={activeAB === 'before' ? 'default' : 'outline'}
							size="sm"
							class="text-xs h-8 px-4 gap-1.5 {activeAB === 'before' ? 'bg-destructive text-destructive-foreground' : 'border-border'}"
							onclick={() => (activeAB = 'before')}
						>
							<AlertTriangleIcon class="h-3.5 w-3.5" />
							<span>View Pre-Repair (Before)</span>
						</Button>
						<Button
							variant={activeAB === 'after' ? 'default' : 'outline'}
							size="sm"
							class="text-xs h-8 px-4 gap-1.5 {activeAB === 'after' ? 'bg-primary text-primary-foreground' : 'border-border'}"
							onclick={() => (activeAB = 'after')}
						>
							<CheckCircleIcon class="h-3.5 w-3.5" />
							<span>View Completed Patch (After)</span>
						</Button>
					</div>

					<div class="relative w-full h-[340px] sm:h-[440px] rounded-xl overflow-hidden border border-border bg-neutral-950">
						{#if activeAB === 'before'}
							{#if effectiveBeforeImage && !beforeImgFailed}
								<img
									src={effectiveBeforeImage}
									alt="Pre-repair pothole"
									class="w-full h-full object-cover"
									onerror={() => (beforeImgFailed = true)}
								/>
							{:else}
								<div class="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
									<span class="text-sm font-mono text-destructive">PRE-REPAIR CAVITY SCAN</span>
									<span class="text-xs">Measured depth: 68mm</span>
								</div>
							{/if}
							<div class="absolute top-3 left-3">
								<Badge class="bg-destructive text-destructive-foreground text-xs font-mono">
									PRE-REPAIR DEFECT
								</Badge>
							</div>
						{:else}
							{#if effectiveAfterImage && !afterImgFailed}
								<img
									src={effectiveAfterImage}
									alt="Completed patch"
									class="w-full h-full object-cover"
									onerror={() => (afterImgFailed = true)}
								/>
							{:else}
								<div class="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
									<span class="text-sm font-mono text-primary">COMPLETED ASPHALT PATCH</span>
									<span class="text-xs">Compaction: 98.4%</span>
								</div>
							{/if}
							<div class="absolute top-3 right-3">
								<Badge class="bg-primary text-primary-foreground text-xs font-mono">
									COMPLETED PATCH (DPWH ITEM 310)
								</Badge>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</CardContent>

		<!-- Card Footer: Engineering Metadata & Citizen Confirmation Action (Requirement 5) -->
		<CardFooter class="pt-0 border-t border-border p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-secondary/10">
			<!-- Technical Quality Metadata -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono flex-1">
				<div class="p-2 rounded bg-card border border-border">
					<div class="text-[10px] text-muted-foreground">MARSHALL STABILITY</div>
					<div class="font-bold text-foreground">{currentTicket.marshalStabilityKn} kN <span class="text-[10px] font-normal text-muted-foreground">(&gt;9.0)</span></div>
				</div>
				<div class="p-2 rounded bg-card border border-border">
					<div class="text-[10px] text-muted-foreground">FLUSH DEVIATION</div>
					<div class="font-bold text-foreground">{currentTicket.flushGradeVarianceMm} mm <span class="text-[10px] font-normal text-muted-foreground">(&lt;3.0)</span></div>
				</div>
				<div class="p-2 rounded bg-card border border-border">
					<div class="text-[10px] text-muted-foreground">JOINT EDGE SEAL</div>
					<div class="font-bold text-foreground">{currentTicket.jointSealIntegrity}% <span class="text-[10px] font-normal text-muted-foreground">ASTM D6690</span></div>
				</div>
				<div class="p-2 rounded bg-card border border-border">
					<div class="text-[10px] text-muted-foreground">MIX PLACEMENT TEMP</div>
					<div class="font-bold text-foreground">{currentTicket.mixTempCelsius}°C <span class="text-[10px] font-normal text-muted-foreground">(&gt;135°C)</span></div>
				</div>
			</div>

			<!-- Citizen Community Confirmation (Requirement 5: +1 Confirm Smooth Road) -->
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
				<div class="text-right hidden sm:block">
					<div class="text-xs font-bold text-foreground font-mono">
						{currentTicket.communityConfirmations} Citizen Confirmations
					</div>
					<div class="text-[11px] text-muted-foreground">
						SCTODA &amp; Rider Commuter Verified
					</div>
				</div>

				<Button
					size="sm"
					class="text-xs h-9 px-4 font-semibold gap-1.5 shadow-none transition-transform active:scale-95 {hasUserConfirmed[currentTicket.id]
						? 'bg-secondary text-foreground border border-border'
						: 'bg-primary text-primary-foreground hover:bg-primary/90'}"
					onclick={handleCommunityConfirm}
				>
					<ThumbsUpIcon class="h-3.5 w-3.5" />
					<span>{hasUserConfirmed[currentTicket.id] ? 'Confirmed Smooth Road (+1)' : '+1 Confirm Smooth Road'}</span>
					<Badge variant="outline" class="ml-1 text-[10px] px-1.5 py-0 h-4.5 font-mono border-primary-foreground/30">
						{currentTicket.communityConfirmations}
					</Badge>
				</Button>
			</div>
		</CardFooter>
	</Card>

	<!-- Section 3: Engineering Sign-off Details & Digital Stamp Display (Requirement 4) -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left: Official DPWH Digital Seal Card -->
		<Card class="border border-border bg-card shadow-none lg:col-span-1">
			<CardHeader class="pb-3 border-b border-border">
				<div class="flex items-center justify-between">
					<CardTitle class="text-sm font-bold text-foreground flex items-center gap-2">
						<ShieldCheckIcon class="h-4 w-4 text-primary" />
						<span>Official Digital Stamp</span>
					</CardTitle>
					<Badge variant="outline" class="text-[10px] font-mono border-border">
						Republic of the Philippines
					</Badge>
				</div>
			</CardHeader>

			<CardContent class="p-5 flex flex-col items-center justify-center text-center space-y-4">
				{#if currentTicket.status === 'DPWH-VERIFIED / RESOLVED'}
					<!-- Authentic Engineering Circular Stamp Display -->
					<div class="relative p-6 rounded-2xl border-2 border-primary bg-primary/5 flex flex-col items-center justify-center space-y-2 max-w-[280px] w-full shadow-xs">
						<div class="text-[9px] font-mono font-bold tracking-widest text-primary uppercase">
							DPWH REGION IV-A
						</div>
						<div class="h-10 w-10 rounded-full border-2 border-primary flex items-center justify-center text-primary font-bold text-lg font-mono">
							✓
						</div>
						<div class="text-xs font-bold font-mono tracking-tight text-foreground uppercase">
							APPROVED &amp; VERIFIED
						</div>
						<div class="text-[10px] font-mono text-muted-foreground">
							ITEM 310 STANDARD COMPLIANT
						</div>
						<Separator class="my-1 bg-primary/30" />
						<div class="text-[11px] font-bold text-foreground">
							{currentTicket.signedOffBy}
						</div>
						<div class="text-[10px] font-mono text-muted-foreground">
							{currentTicket.signedOffLicense}
						</div>
						<div class="text-[9px] font-mono text-primary font-semibold">
							{currentTicket.signedOffTimestamp}
						</div>
					</div>

					<div class="text-[11px] font-mono text-muted-foreground text-center">
						Verification Reference: <br />
						<strong class="text-foreground">{currentTicket.verificationHash}</strong>
					</div>
				{:else}
					<!-- Pending Audit State -->
					<div class="p-6 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center space-y-2 max-w-[280px] w-full text-muted-foreground">
						<AwardIcon class="h-10 w-10 text-muted-foreground/50 stroke-[1.5]" />
						<div class="text-xs font-semibold font-mono">STAMP PENDING AUDIT</div>
						<p class="text-[11px] text-muted-foreground leading-tight">
							Awaiting Chief Civil Inspector sign-off to validate compaction and release contractor bond.
						</p>
					</div>

					<Button
						class="w-full text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-medium gap-1.5 shadow-none"
						onclick={() => (isSignOffDialogOpen = true)}
					>
						<AwardIcon class="h-3.5 w-3.5" />
						<span>Approve & Stamp DPWH Sign-off</span>
					</Button>
				{/if}
			</CardContent>
		</Card>

		<!-- Right: Civil Engineering Inspection Audit Log -->
		<Card class="border border-border bg-card shadow-none lg:col-span-2">
			<CardHeader class="pb-3 border-b border-border">
				<div class="flex items-center justify-between">
					<CardTitle class="text-sm font-bold text-foreground flex items-center gap-2">
						<FileTextIcon class="h-4 w-4 text-primary" />
						<span>Municipal Engineering Audit Ledger &amp; Fund Release</span>
					</CardTitle>
					<Badge variant="outline" class="text-[10px] font-mono border-border">
						DPWH Form 310-A
					</Badge>
				</div>
			</CardHeader>

			<CardContent class="p-5 space-y-4 text-xs">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1">
						<span class="text-muted-foreground text-[11px]">Jurisdiction:</span>
						<p class="font-semibold text-foreground">Santa Cruz District Engineering Office (Laguna 2nd DEO)</p>
					</div>
					<div class="space-y-1">
						<span class="text-muted-foreground text-[11px]">Primary Corridor:</span>
						<p class="font-semibold text-foreground">{currentTicket.corridor}</p>
					</div>
					<div class="space-y-1">
						<span class="text-muted-foreground text-[11px]">Contractor Classification:</span>
						<p class="font-semibold text-foreground">Laguna Asphalt Builders Corp. (DPWH-REG-2024-LAGUNA-08)</p>
					</div>
					<div class="space-y-1">
						<span class="text-muted-foreground text-[11px]">Fund Authorization:</span>
						<p class="font-semibold text-foreground">
							{currentTicket.disbursementAmount}
							<span class="text-[11px] font-normal text-muted-foreground">(10% Warranty Retainage Held)</span>
						</p>
					</div>
				</div>

				<Separator />

				<div class="space-y-2">
					<div class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
						Engineering Assessment Notes:
					</div>
					<p class="text-xs text-muted-foreground leading-relaxed bg-secondary/30 p-3 rounded-lg border border-border">
						{inspectorNotes}
					</p>
				</div>

				<!-- Verification Status Tracker Steps -->
				<div class="space-y-2 pt-1">
					<div class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
						Lifecycle Compliance Stages:
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
						<div class="p-2.5 rounded-lg border border-border bg-card flex items-center gap-2">
							<CheckCircleIcon class="h-4 w-4 text-primary shrink-0" />
							<div>
								<div class="font-semibold text-foreground text-[11px]">1. Field Infill</div>
								<div class="text-[10px] text-muted-foreground">Item 310 Hot-Mix Placed</div>
							</div>
						</div>
						<div class="p-2.5 rounded-lg border border-border bg-card flex items-center gap-2">
							<CheckCircleIcon class="h-4 w-4 text-primary shrink-0" />
							<div>
								<div class="font-semibold text-foreground text-[11px]">2. Density Core</div>
								<div class="text-[10px] text-muted-foreground">98.4% Compaction Met</div>
							</div>
						</div>
						<div class="p-2.5 rounded-lg border border-border bg-card flex items-center gap-2 {currentTicket.status === 'DPWH-VERIFIED / RESOLVED' ? 'border-primary/50 bg-primary/5' : ''}">
							{#if currentTicket.status === 'DPWH-VERIFIED / RESOLVED'}
								<CheckCheckIcon class="h-4 w-4 text-primary shrink-0" />
							{:else}
								<ClockIcon class="h-4 w-4 text-muted-foreground shrink-0" />
							{/if}
							<div>
								<div class="font-semibold text-foreground text-[11px]">3. DPWH Sign-off</div>
								<div class="text-[10px] text-muted-foreground">
									{currentTicket.status === 'DPWH-VERIFIED / RESOLVED' ? 'Certified & Stamped' : 'Awaiting Stamp'}
								</div>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</div>

<!-- Modal Dialog: Engineering Approval Sign-off (Requirement 4) -->
<Dialog bind:open={isSignOffDialogOpen}>
	<DialogContent class="sm:max-w-md bg-card border-border">
		<DialogHeader>
			<div class="flex items-center gap-2">
				<HardHatIcon class="h-5 w-5 text-primary" />
				<DialogTitle class="text-base font-bold text-foreground">
					Approve &amp; Stamp DPWH Sign-off
				</DialogTitle>
			</div>
			<DialogDescription class="text-xs text-muted-foreground mt-1">
				Affix official civil inspector stamp for ticket <strong class="text-foreground">{currentTicket.id}</strong>. Verifies Item 310 bituminous compaction and initiates the 365-day contractor warranty.
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4 py-2 text-xs">
			<div class="p-3 rounded-lg bg-secondary/50 border border-border space-y-2">
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">Compaction Density:</span>
					<strong class="font-mono text-primary">{currentTicket.compactionDensity}% (PASS &gt;97%)</strong>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">Tack Coat Application:</span>
					<strong class="font-mono text-foreground">{currentTicket.tackCoatDensity} gal/yd² (Optimal)</strong>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">Contractor:</span>
					<strong class="text-foreground">{currentTicket.contractorName}</strong>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">Warranty Period:</span>
					<strong class="font-mono text-foreground">{currentTicket.warrantyDaysRemaining} Days (Until {currentTicket.warrantyExpiry})</strong>
				</div>
			</div>

			<div class="space-y-1.5">
				<label for="inspector-notes-input" class="text-xs font-medium text-foreground">Inspector Certification Notes</label>
				<textarea
					id="inspector-notes-input"
					bind:value={inspectorNotes}
					rows="3"
					class="w-full text-xs p-2.5 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans resize-none"
				></textarea>
			</div>
		</div>

		<DialogFooter class="gap-2 sm:gap-0">
			<DialogClose>
				{#snippet child({ props })}
					<Button variant="outline" size="sm" class="text-xs h-8.5 border-border shadow-none" {...props}>
						Cancel
					</Button>
				{/snippet}
			</DialogClose>
			<Button
				size="sm"
				class="text-xs h-8.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium gap-1.5 shadow-none"
				onclick={handleApproveSignOff}
				disabled={isSigning}
			>
				{#if isSigning}
					<RefreshCwIcon class="h-3.5 w-3.5 animate-spin" />
					<span>Affixing Digital Seal...</span>
				{:else}
					<CheckCheckIcon class="h-3.5 w-3.5" />
					<span>Approve &amp; Stamp DPWH Sign-off</span>
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
