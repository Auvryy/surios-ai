<script lang="ts">
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import BikeIcon from '@lucide/svelte/icons/bike';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import GitBranchIcon from '@lucide/svelte/icons/git-branch';
	import UsersIcon from '@lucide/svelte/icons/users';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import Columns2Icon from '@lucide/svelte/icons/columns-2';
	import RadarIcon from '@lucide/svelte/icons/radar';
	import ImagesIcon from '@lucide/svelte/icons/images';
	import ImageIcon from '@lucide/svelte/icons/image';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import NavigationIcon from '@lucide/svelte/icons/navigation';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ZapIcon from '@lucide/svelte/icons/zap';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
	import CameraIcon from '@lucide/svelte/icons/camera';
	import XIcon from '@lucide/svelte/icons/x';

	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	// =========================================================================
	// Section 7: Civic Social Media Stream & Crowdsourced Consensus State
	// Svelte 5 Runes ($state, $derived, $derived.by)
	// =========================================================================

	interface GalleryPhoto {
		id: string;
		title: string;
		tag: string;
		description: string;
		depthMetric?: string;
		angleLabel: string;
	}

	interface DemoHazardReport {
		id: string;
		title: string;
		corridor: string;
		stationing: string;
		coordinates: string;
		lat: number;
		lng: number;
		distressType: string;
		astmCode: string;
		depthEstimate: string;
		vruRisk: 'CRITICAL' | 'HIGH' | 'MODERATE';
		vruNotice: string;
		submittedBy: string;
		submittedTime: string;
		confirmations: number;
		userConfirmed: boolean;
		activePhotoIdx: number;
		photos: GalleryPhoto[];
		comments: { author: string; handle: string; role: string; text: string; time: string }[];
	}

	let hazards = $state<DemoHazardReport[]>([
		{
			id: 'REP-9041',
			title: 'Deep 68mm Crater near LSPU Gate 2',
			corridor: 'Pedro Guevara Avenue',
			stationing: 'Sta 84+210 (Northbound Lane)',
			coordinates: '14.2813° N, 121.4173° E',
			lat: 14.2813,
			lng: 121.4173,
			distressType: 'Pothole (ASTM D6433 - High Severity)',
			astmCode: 'ASTM D6433 Type 13 / Sev-H',
			depthEstimate: '68mm vertical rim strike',
			vruRisk: 'CRITICAL',
			vruNotice: 'Severe vertical lip directly in primary motorcycle path. Concealed during rain pooling.',
			submittedBy: 'Mark Bautista (@rider_mark_laguna)',
			submittedTime: '18m ago',
			confirmations: 6,
			userConfirmed: true,
			activePhotoIdx: 0,
			photos: [
				{
					id: 'p1',
					title: 'Primary Hero Defect Frame',
					tag: 'Primary Defect',
					angleLabel: 'Top-down 45°',
					description: '450mm diameter sharp-edged pothole cavity in concrete pavement joint.',
					depthMetric: '68mm vertical depth'
				},
				{
					id: 'p2',
					title: 'Ruler Scale Calibration',
					tag: 'Scale Reference',
					angleLabel: 'Macro Calibrated',
					description: 'Standard civil steel rule indicating uncompressed 68mm rim penetration.',
					depthMetric: 'ASTM D6433 Grade 3'
				},
				{
					id: 'p3',
					title: 'Corridor Traffic Context',
					tag: 'Approach View',
					angleLabel: 'Wide Corridor 15m',
					description: 'Located 15 meters prior to LSPU pedestrian crosswalk; heavy motorcycle braking zone.',
					depthMetric: 'Blind approach sightline'
				},
				{
					id: 'p4',
					title: 'Monsoon Rain Ponding Hazard',
					tag: 'Wet Weather Hazard',
					angleLabel: 'Water Accumulation',
					description: 'Turbid stormwater conceals cavity completely during tropical afternoon downpours.',
					depthMetric: 'Zero surface contrast'
				}
			],
			comments: [
				{
					author: 'Kuya Jojo',
					handle: '@toda_santa_cruz',
					role: 'Santa Cruz Tricycle Operators Federation',
					text: 'Ingat mga kasama lalo pag gabi! Hindi kita ang lubak pag may tubig, sumasadsad ang tambutso ng tricycle dito.',
					time: '12m ago'
				},
				{
					author: 'Hon. R. Hernandez',
					handle: '@poblacion_lgu',
					role: 'Barangay Poblacion Chairman',
					text: 'Endorsed for DPWH Santa Cruz 1st DEO emergency cold-mix patching. Corridor priority confirmed.',
					time: '25m ago'
				}
			]
		},
		{
			id: 'REP-9038',
			title: 'Longitudinal Shoulder Drop-off & Gutter Fracture',
			corridor: 'National Highway (Pagsanjan Junction)',
			stationing: 'Sta 91+450 (Southbound Shoulder)',
			coordinates: '14.2765° N, 121.4312° E',
			lat: 14.2765,
			lng: 121.4312,
			distressType: 'Edge Breakdown & Rutting (ASTM D6433)',
			astmCode: 'ASTM D6433 Type 7 / Sev-M',
			depthEstimate: '75mm shoulder step-down',
			vruRisk: 'HIGH',
			vruNotice: 'High rollover hazard for passenger tricycles overtaking along unpaved provincial shoulder.',
			submittedBy: 'Kuya Jojo (@toda_santa_cruz)',
			submittedTime: '45m ago',
			confirmations: 4,
			userConfirmed: false,
			activePhotoIdx: 0,
			photos: [
				{
					id: 'p5',
					title: 'Pavement Edge Fracture',
					tag: 'Primary Defect',
					angleLabel: 'Longitudinal View',
					description: 'Continuous 14-meter longitudinal shear between concrete carriageway and gravel shoulder.',
					depthMetric: '75mm drop-off'
				},
				{
					id: 'p6',
					title: 'Tricycle Wheel Track Alignment',
					tag: 'Wheel Strike Zone',
					angleLabel: 'Track Profile',
					description: 'Sidecar passenger wheel forced into unstable mud rut during peak hour oncoming bypass.',
					depthMetric: 'High tipping risk'
				},
				{
					id: 'p7',
					title: 'Sub-base Scour & Erosion',
					tag: 'Sub-base Scour',
					angleLabel: 'Culvert Runoff',
					description: 'Drainage overflow washing away fine aggregates under concrete edge.',
					depthMetric: 'Void under slab'
				}
			],
			comments: [
				{
					author: 'Engr. Mateo Cruz',
					handle: '@cruz_civil',
					role: 'LSPU Civil Engineering Faculty',
					text: 'Edge unraveling requires subbase re-compaction and cold-mix shoulder leveling before edge slab breaks.',
					time: '30m ago'
				}
			]
		},
		{
			id: 'REP-9032',
			title: 'Sunken Crosswalk Trench near School Zone',
			corridor: 'Quezon Ave – Bubukal Student Corridor',
			stationing: 'Sta 82+110 (School Crossing)',
			coordinates: '14.2690° N, 121.4021° E',
			lat: 14.2690,
			lng: 121.4021,
			distressType: 'Depressed Utility Cut (ASTM D6433)',
			astmCode: 'ASTM D6433 Type 16 / Sev-H',
			depthEstimate: '52mm transverse depression',
			vruRisk: 'CRITICAL',
			vruNotice: 'E-trike and bicycle handlebars twist abruptly when crossing unlevel utility backfill.',
			submittedBy: 'Ria Santos (@ria_commutes)',
			submittedTime: '1h 15m ago',
			confirmations: 2,
			userConfirmed: false,
			activePhotoIdx: 0,
			photos: [
				{
					id: 'p8',
					title: 'Transverse Settlement Crosswalk',
					tag: 'Primary Defect',
					angleLabel: 'Transverse Section',
					description: 'Uncompacted pipe crossing trench settled 52mm below asphalt grade.',
					depthMetric: '52mm depression'
				},
				{
					id: 'p9',
					title: 'Student Crosswalk Approach',
					tag: 'Context Sightline',
					angleLabel: 'School Crossing',
					description: 'Crossing point for over 800 students daily between LSPU campus and Quezon Ave jeeps.',
					depthMetric: 'Pedestrian hazard'
				}
			],
			comments: [
				{
					author: 'Carla Dizon',
					handle: '@carla_cycling',
					role: 'Santa Cruz Active Mobility Lead',
					text: 'Cyclists need to swerve into oncoming jeepney lane to avoid this trench. Needs leveling ASAP.',
					time: '50m ago'
				}
			]
		}
	]);

	// Interactive states
	let activeReportId = $state<string>('REP-9041');
	let activeSimulatorConfirmations = $state<number>(4);
	let inspectionModalPhoto = $state<GalleryPhoto | null>(null);
	let expandedCommentsReportId = $state<string | null>('REP-9041');
	let activePreviewTab = $state<'split' | 'feed' | 'radar'>('split');

	// Active selected report
	const selectedReport = $derived(
		hazards.find((h) => h.id === activeReportId) || hazards[0]
	);

	// Derived SLA computation based on simulated confirmation count
	const simulatedSla = $derived.by(() => {
		const count = activeSimulatorConfirmations;
		if (count >= 5) {
			return {
				tier: 'DPWH_EMERGENCY_DISPATCH',
				title: 'Tier 3: Emergency DPWH Work Order Dispatched',
				slaHours: 24,
				badge: '⚡ 24H EMERGENCY SLA',
				badgeClass: 'border-primary text-primary bg-primary/10 font-bold',
				description:
					'Critical consensus threshold reached (5+ confirmations). Automated dispatch packet transmitted to DPWH Laguna 1st District Engineering Office. Cold-mix asphalt & emulsion materials generated.',
				progressPct: 100,
				urgency: 'CRITICAL',
				statusText: 'AUTO-DISPATCHED TO CREW ROSTER',
				actionItem: 'Materials checklist approved (1.4 MT cold-mix asphalt, 12L SS-1 tack emulsion).'
			};
		} else if (count >= 3) {
			return {
				tier: 'BARANGAY_PRIORITY',
				title: 'Tier 2: Barangay & Municipal Engineering Priority',
				slaHours: 48,
				badge: '⚠️ 48H BARANGAY PRIORITY',
				badgeClass: 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-semibold',
				description:
					'Consensus verified by multiple frontline road users. Work ticket escalated to Santa Cruz Municipal Engineering and Barangay Poblacion hall for verification inspection.',
				progressPct: (count / 5) * 100,
				urgency: 'HIGH',
				statusText: 'ESCALATED TO LOCAL LGU & TODA',
				actionItem: 'Municipal engineer site assessment scheduled within 48 hours.'
			};
		} else {
			return {
				tier: 'PENDING_CONSENSUS',
				title: 'Tier 1: Community Observation & Citizen Intake',
				slaHours: 168,
				badge: '🕒 7-DAY STANDARD SLA',
				badgeClass: 'border-border text-muted-foreground bg-secondary/50 font-normal',
				description:
					'Citizen report recorded in GIS telemetry database. Awaiting additional ground-truth confirmations from commuter stream before automated dispatch.',
				progressPct: (count / 5) * 100,
				urgency: 'STANDARD',
				statusText: 'PENDING COMMUNITY CONFIRMATIONS',
				actionItem: 'Awaiting 5 verified confirmations to trigger emergency contractor dispatch.'
			};
		}
	});

	function toggleHazardConfirm(id: string) {
		hazards = hazards.map((h) => {
			if (h.id === id) {
				const isNow = !h.userConfirmed;
				return {
					...h,
					userConfirmed: isNow,
					confirmations: isNow ? h.confirmations + 1 : Math.max(0, h.confirmations - 1)
				};
			}
			return h;
		});
	}

	function selectPhotoIndex(reportId: string, index: number) {
		hazards = hazards.map((h) => {
			if (h.id === reportId) {
				return { ...h, activePhotoIdx: index };
			}
			return h;
		});
	}

	function toggleComments(id: string) {
		expandedCommentsReportId = expandedCommentsReportId === id ? null : id;
	}
</script>

<div class="max-w-5xl mx-auto px-4 py-8 space-y-8">
	<!-- Page Title -->
	<div class="space-y-1.5">
		<div class="flex items-center gap-2">
			<Badge variant="outline" class="text-xs font-normal border-border">
				Specification
			</Badge>
			<span class="text-xs text-muted-foreground">Engineering Standards & Design Charter</span>
		</div>
		<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
			SuriOS Civil Standards & Design System
		</h1>
		<p class="text-xs text-muted-foreground leading-relaxed">
			The definitive specification for ASTM D6433 road distress classification, Vulnerable Road User (VRU) lethality scoring, our Zero AI-Slop UI charter, and the Civic Social Media Stream architecture.
		</p>
	</div>

	<!-- Section 1: Zero AI-Slop Design Charter -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<CardTitle class="text-sm font-semibold flex items-center gap-2">
				<PaletteIcon class="h-4 w-4 text-foreground" />
				<span>Zero AI-Slop Design Charter</span>
			</CardTitle>
			<CardDescription class="text-xs">
				Strict visual rules defining the authentic shadcn-ui institutional look.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-3 text-xs leading-relaxed text-muted-foreground">
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<p class="font-semibold text-foreground">🚫 Strictly NO Gradients</p>
					<p>Zero radial gradients, zero gradient text, and zero glowing borders. All surfaces are flat, solid, and matte.</p>
				</div>
				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<p class="font-semibold text-foreground">🚫 No Excessive Shadows</p>
					<p>No neon-colored drop shadows or blurry elevation. Boundaries are articulated cleanly with 1px border strokes (`border-border`).</p>
				</div>
				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<p class="font-semibold text-foreground">✨ Soft Typography</p>
					<p>Clean human sans-serif typography (Inter system stack). Monospace is reserved strictly for coordinates and ASTM codes.</p>
				</div>
				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<p class="font-semibold text-foreground">🌓 Dual-Mode Equality</p>
					<p>100% feature and visual parity between light and dark modes via semantic OKLCH tokens.</p>
				</div>
				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<p class="font-semibold text-foreground">🚫 No Status Dots</p>
					<p>Zero pulsing green or colored dots. State is expressed purely through clean text and subtle badges.</p>
				</div>
				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1 sm:col-span-2">
					<p class="font-semibold text-foreground">✂️ Minimalist Copy</p>
					<p>Zero marketing fluff or unnecessary words. Terse, functional, high-density civic communication.</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Section 2: Two-Wheeler Lethality & Rider Safety Index -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<CardTitle class="text-sm font-semibold flex items-center gap-2">
				<BikeIcon class="h-4 w-4 text-foreground" />
				<span>Two-Wheeler Lethality Index (VRU Profiling)</span>
			</CardTitle>
			<CardDescription class="text-xs">
				SDG 9 innovation prioritizing vulnerable road users in provincial corridors.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-3 text-xs text-muted-foreground leading-relaxed">
			<p>
				Traditional civil standards (ASTM D6433, PCI) were designed around four-wheeled vehicular wear. In Philippine provincial corridors like Santa Cruz and Pagsanjan, motorcycles and tricycles make up over <strong>68% of daily trips</strong>.
			</p>
			<p>
				SuriOS couples multimodal vision depth extraction with a deterministic lethality formula:
			</p>
			<div class="p-3 rounded-lg bg-secondary/40 border border-border font-mono text-[11px] text-foreground">
				VRU_Index = f(Distress_Type, Depth_mm, Lateral_Position, Traffic_Profile)
			</div>
			<ul class="space-y-1.5 list-disc list-inside pt-1">
				<li><strong class="text-foreground">Depth &gt; 50mm:</strong> High instability; triggers instant emergency VRU alert.</li>
				<li><strong class="text-foreground">Depth &gt; 80mm:</strong> Critical catastrophic rim-catch hazard for small motorcycle tires.</li>
				<li><strong class="text-foreground">Edge Drop-Off:</strong> High-risk tipping hazard for tricycles on narrow uncurbed provincial shoulders.</li>
			</ul>
		</CardContent>
	</Card>

	<!-- Section 3: Gemini "Proof of Patch" Protocol -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<CardTitle class="text-sm font-semibold flex items-center gap-2">
				<SparklesIcon class="h-4 w-4 text-foreground" />
				<span>Gemini Multimodal "Proof of Patch" Verification</span>
			</CardTitle>
			<CardDescription class="text-xs">
				Automated visual auditing for municipal maintenance closure.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-3 text-xs text-muted-foreground leading-relaxed">
			<p>
				Municipal road tickets cannot be closed by dispatcher self-certification alone. Road crews must submit an after-repair photo from the same geodetic coordinates.
			</p>
			<p>
				Gemini 3.5 Flash performs comparative visual inference:
			</p>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-center">
				<div class="p-2.5 rounded-lg bg-secondary/30 border border-border">
					<p class="font-semibold text-foreground">1. Surface Planarity</p>
					<p class="text-[11px] text-muted-foreground mt-0.5">Verifies flush asphalt compaction without mounds or dips.</p>
				</div>
				<div class="p-2.5 rounded-lg bg-secondary/30 border border-border">
					<p class="font-semibold text-foreground">2. Edge Tacking</p>
					<p class="text-[11px] text-muted-foreground mt-0.5">Audits asphalt emulsion seal along old pavement borders.</p>
				</div>
				<div class="p-2.5 rounded-lg bg-secondary/30 border border-border">
					<p class="font-semibold text-foreground">3. Void Elimination</p>
					<p class="text-[11px] text-muted-foreground mt-0.5">Confirms zero water-trapping voids before releasing ticket closure.</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Section 4: Hackathon 5-Branch Delivery Architecture -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<CardTitle class="text-sm font-semibold flex items-center gap-2">
				<GitBranchIcon class="h-4 w-4 text-primary" />
				<span>Hackathon 5-Branch Delivery Architecture</span>
			</CardTitle>
			<CardDescription class="text-xs">
				Strict atomic branch planning enforcing zero scope-creep, rapid execution, and robust feature delivery.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-3 text-xs text-muted-foreground leading-relaxed">
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<div class="flex items-center justify-between">
						<span class="font-bold text-foreground font-mono text-[11px]">1. feat/merge-map-foundation</span>
						<Badge variant="outline" class="text-[9px] font-mono border-primary/40 text-primary">MERGED</Badge>
					</div>
					<p class="text-[11px]">Geoapify road geometry integration, Positron light CAD basemap, animated dispatch route polylines, and squircle dot bomb indicators.</p>
				</div>

				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<div class="flex items-center justify-between">
						<span class="font-bold text-foreground font-mono text-[11px]">2. feat/proof-of-patch</span>
						<Badge variant="outline" class="text-[9px] font-mono border-primary/40 text-primary">MERGED</Badge>
					</div>
					<p class="text-[11px]">`/verification` — Interactive Before/After asphalt comparison slider, DPWH Item 310 1-year contractor warranty countdown, and engineering sign-off stamp.</p>
				</div>

				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<div class="flex items-center justify-between">
						<span class="font-bold text-foreground font-mono text-[11px]">3. feat/road-analytics-pci</span>
						<Badge variant="outline" class="text-[9px] font-mono border-primary/40 text-primary">MERGED</Badge>
					</div>
					<p class="text-[11px]">`/analytics` — Pure SVG/Tailwind Network PCI gauge (49/100), longitudinal pavement deterioration curves, monsoon rain defect correlation, and ₱1.4M saved budget counter.</p>
				</div>

				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<div class="flex items-center justify-between">
						<span class="font-bold text-foreground font-mono text-[11px]">4. feat/contractors-and-community</span>
						<Badge variant="secondary" class="text-[9px] font-mono border-border">ACTIVE</Badge>
					</div>
					<p class="text-[11px]">`/crews` &amp; `/community` — DPWH-accredited asphalt paving crew roster, machinery allocation status (roller, tack tanker), and citizen hazard confirmation leaderboard.</p>
				</div>

				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1 sm:col-span-2">
					<div class="flex items-center justify-between">
						<span class="font-bold text-foreground font-mono text-[11px]">5. feat/community-social-feed</span>
						<Badge variant="outline" class="text-[9px] font-mono border-primary/40 text-primary">ACTIVE EXPANSION</Badge>
					</div>
					<p class="text-[11px]">Option 2 Synchronized 55/45 Split-Screen UX, multi-image gallery thumbnail stack with '+X more' overlay, and crowdsourced triage consensus engine.</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Section 5: Citizen vs. Municipal LGU Process Flow Matrix -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<CardTitle class="text-sm font-semibold flex items-center gap-2">
				<UsersIcon class="h-4 w-4 text-primary" />
				<span>Citizen vs. Municipal LGU Operational Process Flows</span>
			</CardTitle>
			<CardDescription class="text-xs">
				End-to-end lifecycle comparison between public reporting and institutional engineering dispatch.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4 text-xs text-muted-foreground leading-relaxed">
			<div class="overflow-x-auto">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="border-b border-border text-[11px] font-semibold text-foreground">
							<th class="py-2 pr-4">Phase / Module</th>
							<th class="py-2 pr-4 text-muted-foreground">Citizen / Motorist View</th>
							<th class="py-2 text-primary">Municipal LGU / Engineer View</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border/60 text-[11px]">
						<tr>
							<td class="py-2.5 pr-4 font-mono font-bold text-foreground">1. Access &amp; Entry</td>
							<td class="py-2.5 pr-4">1-tap quick Citizen login; immediate light-mode road safety map.</td>
							<td class="py-2.5">Badge/role authenticated dispatch console (`engineer@surios.gov`).</td>
						</tr>
						<tr>
							<td class="py-2.5 pr-4 font-mono font-bold text-foreground">2. Defect Intake</td>
							<td class="py-2.5 pr-4">Snaps asphalt crater photo on `/report`; receives 1.5s AI safety rating.</td>
							<td class="py-2.5">Auto-snapped road corridor position + auto DPWH materials checklist.</td>
						</tr>
						<tr>
							<td class="py-2.5 pr-4 font-mono font-bold text-foreground">3. Map &amp; Routing</td>
							<td class="py-2.5 pr-4">Visualizes squircle dot bombs with severity 1–10 on Laguna map.</td>
							<td class="py-2.5">1-click animated route dispatch from Depot HQ + turn-by-turn maneuvers.</td>
						</tr>
						<tr>
							<td class="py-2.5 pr-4 font-mono font-bold text-foreground">4. Proof of Patch</td>
							<td class="py-2.5 pr-4">Drags Before/After comparison slider; taps "+1 Confirm Smooth Road".</td>
							<td class="py-2.5">Audits 98% compaction score, activates 1-yr DPWH warranty, stamps sign-off.</td>
						</tr>
						<tr>
							<td class="py-2.5 pr-4 font-mono font-bold text-foreground">5. Macro Analytics</td>
							<td class="py-2.5 pr-4">Public transparency: Santa Cruz road health index &amp; fixed potholes count.</td>
							<td class="py-2.5">PCI degradation forecast, monsoon rain defect timeline, ₱1.4M saved counter.</td>
						</tr>
					</tbody>
				</table>
			</div>
		</CardContent>
	</Card>

	<!-- Section 6: Institutional Civil Safety Amber Brand Identity -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<CardTitle class="text-sm font-semibold flex items-center gap-2">
				<ShieldCheckIcon class="h-4 w-4 text-primary" />
				<span>Institutional Safety Amber Brand Identity</span>
			</CardTitle>
			<CardDescription class="text-xs">
				Deliberate departure from generic SaaS blue in favor of authentic civil infrastructure authority.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-3 text-xs text-muted-foreground leading-relaxed">
			<p>
				Generic blue interfaces evoke generic B2B software. In Philippine civil works and international highway administration, <strong class="text-foreground">Safety Amber &amp; High-Visibility Ochre</strong> (`oklch(0.62 0.21 48)` / `#d97706`) signify active road work zones, heavy machinery readiness, and emergency DPWH transit corridors.
			</p>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
				<div class="p-3 rounded-lg border border-border bg-card space-y-1">
					<div class="h-3 w-8 rounded-sm bg-primary mb-1"></div>
					<p class="font-semibold text-foreground text-[11px]">Primary: Civil Safety Amber</p>
					<p class="text-[10px] text-muted-foreground">High-contrast institutional accent for actions, badges, and route geometry.</p>
				</div>
				<div class="p-3 rounded-lg border border-border bg-card space-y-1">
					<div class="h-3 w-8 rounded-sm bg-destructive mb-1"></div>
					<p class="font-semibold text-foreground text-[11px]">Alert: ASTM Critical Red</p>
					<p class="text-[10px] text-muted-foreground">Reserved exclusively for life-threatening VRU rim-strike pothole hazards.</p>
				</div>
				<div class="p-3 rounded-lg border border-border bg-card space-y-1">
					<div class="h-3 w-8 rounded-sm bg-muted-foreground/30 mb-1"></div>
					<p class="font-semibold text-foreground text-[11px]">Canvas: Neutral Civil Slate</p>
					<p class="text-[10px] text-muted-foreground">Paper white in daylight, deep matte slate at night for zero screen glare.</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- ===================================================================== -->
	<!-- Section 7: Civic Social Media Stream & Crowdsourced Consensus Architecture -->
	<!-- ===================================================================== -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
				<CardTitle class="text-base font-bold flex items-center gap-2">
					<Columns2Icon class="h-4.5 w-4.5 text-primary shrink-0" />
					<span>Section 7: Civic Social Media Stream &amp; Crowdsourced Consensus Architecture</span>
				</CardTitle>
				<Badge variant="outline" class="text-[10px] font-mono border-primary/40 text-primary bg-primary/10 w-fit">
					CIVIC SOCIAL MEDIA FEED SPECIFICATION
				</Badge>
			</div>
			<CardDescription class="text-xs">
				Bridging citizen telemetry with municipal public works through synchronized split-screen mapping, multi-angle defect evidence, and decentralized triage consensus.
			</CardDescription>
		</CardHeader>

		<CardContent class="space-y-6 text-xs text-muted-foreground leading-relaxed">
			<!-- 7.1 Overview & Architectural Paradigm -->
			<div class="space-y-2.5">
				<div class="flex items-center gap-2">
					<Badge variant="secondary" class="text-[10px] font-mono border-border">7.1 PARADIGM</Badge>
					<h3 class="text-sm font-semibold text-foreground">Civil Social Media Stream vs. Generic Social Noise</h3>
				</div>
				<p>
					Traditional municipal reporting portals function as bureaucratic "black boxes": citizens submit a report and hear nothing back for months, breeding civic cynicism and disengagement. Conversely, posting potholes on consumer social media platforms (Facebook, X, TikTok) creates virality without accountability—posts lack calibrated geodetic coordinate headers, depth references, or direct pipelines into municipal dispatch queues.
				</p>
				<p>
					SuriOS pioneers the <strong class="text-foreground">Civic Infrastructure Stream</strong>: an open, public-facing feed designed with institutional rigor. Every post is an immutable engineering observation anchored to provincial corridors (e.g., Pedro Guevara Ave, National Highway, San Pablo Bypass), backed by multi-angle visual telemetry and verified by commuter consensus.
				</p>

				<!-- Comparative Feature Matrix -->
				<div class="overflow-x-auto pt-1">
					<table class="w-full text-left border-collapse text-[11px]">
						<thead>
							<tr class="border-b border-border bg-secondary/30 font-semibold text-foreground">
								<th class="py-2 px-3">System Dimension</th>
								<th class="py-2 px-3 text-muted-foreground">Consumer Social Media (FB / X)</th>
								<th class="py-2 px-3 text-primary">SuriOS Civic Social Stream</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border/60">
							<tr>
								<td class="py-2 px-3 font-medium text-foreground">Spatial Anchor</td>
								<td class="py-2 px-3">Vague text description ("malapit sa palengke")</td>
								<td class="py-2 px-3 font-mono text-primary">14.2813° N, 121.4173° E (Sta 84+210)</td>
							</tr>
							<tr>
								<td class="py-2 px-3 font-medium text-foreground">Visual Evidence</td>
								<td class="py-2 px-3">Single blurry photo without scale</td>
								<td class="py-2 px-3">Multi-image thumbnail stack + calibrated ruler gauge</td>
							</tr>
							<tr>
								<td class="py-2 px-3 font-medium text-foreground">Community Action</td>
								<td class="py-2 px-3">Passive vanity likes &amp; outrage comments</td>
								<td class="py-2 px-3 font-semibold text-foreground">+1 Confirmed triage upvotes with SLA escalation</td>
							</tr>
							<tr>
								<td class="py-2 px-3 font-medium text-foreground">Municipal Handoff</td>
								<td class="py-2 px-3">Zero integration; ignored by public works</td>
								<td class="py-2 px-3">Automated DPWH Item 310 BoQ &amp; crew dispatch</td>
							</tr>
							<tr>
								<td class="py-2 px-3 font-medium text-foreground">Aesthetic Charter</td>
								<td class="py-2 px-3">Addictive gradients, red dots, algorithmic clutter</td>
								<td class="py-2 px-3">Safety Amber civil authority, matte slate, zero AI-slop</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<Separator />

			<!-- 7.2 Focused Social Stream & Dedicated GIS Canvas Architecture -->
			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<Badge variant="secondary" class="text-[10px] font-mono border-border">7.2 UX PATTERN</Badge>
					<h3 class="text-sm font-semibold text-foreground">Focused Single-Column Social Stream &amp; Full GIS Canvas Decoupling</h3>
				</div>
				<p>
					To avoid visual overload and cognitive fatigue, SuriOS strictly decouples the <strong class="text-foreground">Civic Social Media Feed</strong> from the <strong class="text-foreground">Dedicated GIS Telemetry Canvas</strong>:
				</p>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
					<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1.5">
						<div class="flex items-center justify-between">
							<span class="font-semibold text-foreground flex items-center gap-1.5">
								<Columns2Icon class="h-3.5 w-3.5 text-primary" />
								<span>Centered Civic Stream (No Side Map)</span>
							</span>
							<Badge variant="outline" class="text-[9px] font-mono border-border">DISTRACTION-FREE</Badge>
						</div>
						<p class="text-[11px] leading-relaxed">
							Clean centered feed column (<code class="font-mono text-primary text-[10px]">max-w-2xl mx-auto</code>) on both desktop PC and mobile smartphones. Emphasizes citizen discussion, community upvotes, and defect photo inspection without competing visual noise from a side map.
						</p>
					</div>

					<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1.5">
						<div class="flex items-center justify-between">
							<span class="font-semibold text-foreground flex items-center gap-1.5">
								<MapPinIcon class="h-3.5 w-3.5 text-primary" />
								<span>Embedded Mini-Map to Full GIS Deep-Link</span>
							</span>
							<Badge variant="outline" class="text-[9px] font-mono border-primary/40 text-primary">DEEP NAVIGATION</Badge>
						</div>
						<p class="text-[11px] leading-relaxed">
							Each report card features a compact vector mini-map tile inside the hero photo. Clicking <code class="font-mono text-primary text-[10px]">[ MAP ]</code> seamlessly deep-links to the full-screen city-wide GIS Map canvas (<code class="font-mono text-primary text-[10px]">/?incident=&#123;id&#125;</code>) for deep turn-by-turn routing and provincial telemetry.
						</p>
					</div>
				</div>
			</div>

			<Separator />

			<!-- 7.3 Swiss Architectural Minimalist Card & Vertical Inset Dock Inside Hero Photo -->
			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<Badge variant="secondary" class="text-[10px] font-mono border-border">7.3 MINIMALIST ARCHITECTURE</Badge>
					<h3 class="text-sm font-semibold text-foreground">Swiss Architectural Minimalist Card &amp; Vertical Inset Dock Inside Hero Photo</h3>
				</div>
				<p>
					Traditional civic apps suffer from "badge creep"—overloading report cards with 6+ conflicting colored pills, label chips, and distracting text tags that obstruct the pavement distress photo. SuriOS adopts a rigorous **Swiss Architectural Minimalist Standard** (inspired by Linear and Apple Pro interface design):
				</p>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
					<div class="p-3 rounded-lg border border-border bg-card space-y-1">
						<div class="flex items-center gap-1.5 text-foreground font-semibold text-[11px]">
							<ImageIcon class="h-3.5 w-3.5 text-primary" />
							<span>1. Full-Span Unobstructed Hero Photo</span>
						</div>
						<p class="text-[10px] text-muted-foreground">
							The primary defect photograph expands across 100% of the media container width. Zero black tags or text overlays obscure the road asphalt, ensuring engineers and citizens inspect the authentic defect aperture without visual interference.
						</p>
					</div>

					<div class="p-3 rounded-lg border border-border bg-card space-y-1">
						<div class="flex items-center gap-1.5 text-foreground font-semibold text-[11px]">
							<ImagesIcon class="h-3.5 w-3.5 text-primary" />
							<span>2. Vertical Inset Dock (Top-Right)</span>
						</div>
						<p class="text-[10px] text-muted-foreground">
							Docked seamlessly inside the top-right corner of the photo with a frosted-glass backdrop (<code class="text-[9px] font-mono text-primary">backdrop-blur-md bg-black/45 border border-white/20</code>). Houses a secondary inspection photo, dark-tinted "+X more" count tile, and a vector mini-map.
						</p>
					</div>

					<div class="p-3 rounded-lg border border-border bg-card space-y-1">
						<div class="flex items-center gap-1.5 text-foreground font-semibold text-[11px]">
							<MapPinIcon class="h-3.5 w-3.5 text-primary" />
							<span>3. Embedded Micro-GIS Radar Tile</span>
						</div>
						<p class="text-[10px] text-muted-foreground">
							An integrated square vector map tile with a red GPS location pin. Clicking instantly flies the desktop 45% radar map directly to the corridor coordinate (<code class="text-[9px] font-mono text-primary">map.flyTo([lat, lng], 16)</code>) and highlights the corresponding polyline.
						</p>
					</div>
				</div>

				<div class="p-3 rounded-lg bg-secondary/20 border border-border space-y-1.5 text-[11px]">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-foreground">Noise Elimination &amp; Single-Severity Hierarchy:</span>
						<Badge variant="outline" class="text-[9px] font-mono text-primary border-primary/30">ZERO CLUTTER</Badge>
					</div>
					<p class="text-muted-foreground leading-relaxed">
						Consolidated 6 legacy pill badges down to a single header chip (<code class="font-mono text-destructive">[ 8.9 CRITICAL ]</code>) paired with the citizen author avatar and timestamp. Replaced chunky rectangular action blocks with refined rounded pills (<code class="font-mono text-foreground">↑ 27 Confirmed</code>) that provide immediate tactile feedback.
					</p>
				</div>
			</div>

			<Separator />

			<!-- 7.4 Crowdsourced Triage Consensus (+1 Confirmed) -->
			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<Badge variant="secondary" class="text-[10px] font-mono border-border">7.4 CONSENSUS ENGINE</Badge>
					<h3 class="text-sm font-semibold text-foreground">Crowdsourced Triage Consensus (+1 Confirmed) &amp; Automated SLA Escalation</h3>
				</div>
				<p>
					Laguna's provincial road network spans hundreds of kilometers across municipal boundaries. City engineering inspectors cannot patrol every barangay road daily. SuriOS taps into decentralized ground truth: local tricycle drivers, commuter riders, and barangay officials validate road distress through the <strong class="text-foreground">"+1 Confirm Pothole" Consensus Engine</strong>.
				</p>

				<!-- 3-Tier SLA Escalation Protocol -->
				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-2.5">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-foreground text-xs flex items-center gap-1.5">
							<ZapIcon class="h-3.5 w-3.5 text-primary" />
							Automated 3-Tier Municipal SLA Escalation Matrix
						</span>
						<Badge variant="outline" class="text-[9px] font-mono border-border">DETERMINISTIC LOGIC</Badge>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
						<div class="p-3 rounded-lg bg-card border border-border space-y-1">
							<div class="flex items-center justify-between">
								<span class="font-bold text-foreground text-[11px]">1–2 Confirmations</span>
								<Badge variant="outline" class="text-[9px] font-mono">TIER 1</Badge>
							</div>
							<p class="font-semibold text-muted-foreground text-[10px]">7-Day Standard Intake SLA</p>
							<p class="text-[10px]">Logged in public telemetry queue. Visible on citizen stream for nearby commuter verification.</p>
						</div>

						<div class="p-3 rounded-lg bg-card border border-amber-500/40 space-y-1">
							<div class="flex items-center justify-between">
								<span class="font-bold text-amber-600 dark:text-amber-400 text-[11px]">3–4 Confirmations</span>
								<Badge variant="outline" class="text-[9px] font-mono border-amber-500/40 text-amber-600 dark:text-amber-400">TIER 2</Badge>
							</div>
							<p class="font-semibold text-foreground text-[10px]">48-Hour Barangay Priority Notice</p>
							<p class="text-[10px]">Escalated to Santa Cruz Municipal Engineering and Barangay Poblacion hall for expedited field audit.</p>
						</div>

						<div class="p-3 rounded-lg bg-card border border-primary space-y-1">
							<div class="flex items-center justify-between">
								<span class="font-bold text-primary text-[11px]">5+ Confirmations</span>
								<Badge variant="outline" class="text-[9px] font-mono border-primary text-primary bg-primary/10">TIER 3</Badge>
							</div>
							<p class="font-semibold text-primary text-[10px]">24-Hour Emergency DPWH Dispatch</p>
							<p class="text-[10px]">Critical consensus threshold reached. Automatically issues work order to DPWH 1st DEO &amp; generates cold-mix BoQ.</p>
						</div>
					</div>
				</div>

				<div class="p-3.5 rounded-xl bg-secondary/20 border border-border space-y-2">
					<p class="font-semibold text-foreground text-xs flex items-center gap-1.5">
						<MessageSquareIcon class="h-3.5 w-3.5 text-primary" />
						Frontline Road Voice: Inline Verification Comments
					</p>
					<p class="text-[11px]">
						Inline commentary is strictly structured around operational safety telemetry rather than generic chat. Verified tricycle drivers from the TODA federation post micro-advisories ("water pooling hides 3-inch lip after 6 PM"), while barangay officials attach formal local clearance stamps. Sybil resistance is enforced via geofenced confirmation radii and weighted Citizen Guardian reputation scores.
					</p>
				</div>
			</div>

			<Separator />

			<!-- 7.5 Safety Amber Brand Identity Integration -->
			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<Badge variant="secondary" class="text-[10px] font-mono border-border">7.5 CIVIL IDENTITY</Badge>
					<h3 class="text-sm font-semibold text-foreground">Safety Amber Brand Identity: Institutional Authority vs. Social Noise</h3>
				</div>
				<p>
					Consumer social networks exploit high-arousal red badges, rainbow reaction icons, and neon gradients to maximize screen addiction. In contrast, SuriOS adheres to institutional civil authority:
				</p>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
					<div class="p-3 rounded-lg bg-secondary/30 border border-border space-y-1">
						<p class="font-semibold text-foreground text-[11px]">Civil Safety Amber (<span class="font-mono text-primary">#d97706 / oklch(0.62 0.21 48)</span>)</p>
						<p class="text-[10px]">
							Derived directly from DPWH road hazard warning standards, high-visibility asphalt rollers, and reflective traffic bollards. Signifies alertness, institutional dispatch, and active repair.
						</p>
					</div>
					<div class="p-3 rounded-lg bg-secondary/30 border border-border space-y-1">
						<p class="font-semibold text-foreground text-[11px]">Matte Civil Slate &amp; Zero Glare</p>
						<p class="text-[10px]">
							High-contrast, non-glare surfaces designed for field engineers and tricycle riders viewing screens under intense tropical sunlight in Laguna. Zero artificial gradients or blurry drop shadows.
						</p>
					</div>
				</div>
			</div>

			<Separator />

			<!-- ================================================================= -->
			<!-- 7.6 LIVE INTERACTIVE ARCHITECTURE SIMULATOR (SVELTE 5 RUNES)      -->
			<!-- ================================================================= -->
			<div class="space-y-4 pt-2">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
					<div>
						<div class="flex items-center gap-2">
							<Badge variant="outline" class="text-[10px] font-mono border-primary text-primary">
								INTERACTIVE DEMONSTRATION
							</Badge>
							<span class="text-xs text-muted-foreground">Svelte 5 Runes Reactive Engine</span>
						</div>
						<h3 class="text-sm sm:text-base font-bold text-foreground mt-0.5 flex items-center gap-2">
							<SlidersHorizontalIcon class="h-4 w-4 text-primary" />
							Interactive Split-Screen &amp; Consensus Simulator
						</h3>
					</div>

					<!-- View Mode Selector -->
					<div class="flex items-center gap-1 self-start sm:self-auto">
						<Button
							variant={activePreviewTab === 'split' ? 'default' : 'outline'}
							size="sm"
							class="text-xs h-7 px-2.5 shadow-none"
							onclick={() => (activePreviewTab = 'split')}
						>
							55/45 Split View
						</Button>
						<Button
							variant={activePreviewTab === 'feed' ? 'default' : 'outline'}
							size="sm"
							class="text-xs h-7 px-2.5 shadow-none"
							onclick={() => (activePreviewTab = 'feed')}
						>
							Social Feed
						</Button>
						<Button
							variant={activePreviewTab === 'radar' ? 'default' : 'outline'}
							size="sm"
							class="text-xs h-7 px-2.5 shadow-none"
							onclick={() => (activePreviewTab = 'radar')}
						>
							Sticky Radar
						</Button>
					</div>
				</div>

				<!-- Incident Picker Tabs -->
				<div class="flex flex-wrap items-center gap-2">
					<span class="text-[11px] font-mono text-muted-foreground mr-1">Select Road Hazard:</span>
					{#each hazards as item}
						<Button
							variant={activeReportId === item.id ? 'default' : 'outline'}
							size="sm"
							class="text-xs h-7 px-2.5 font-mono shadow-none transition-all {activeReportId === item.id ? 'bg-primary text-primary-foreground font-bold' : 'border-border'}"
							onclick={() => {
								activeReportId = item.id;
								activeSimulatorConfirmations = item.confirmations;
							}}
						>
							{item.id}: {item.corridor.split(' ')[0]} ({item.confirmations} confirms)
						</Button>
					{/each}
				</div>

				<!-- Interactive 55/45 Viewport Simulator Box -->
				<div class="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
					<!-- Simulated Browser/App Header Bar -->
					<div class="px-3.5 py-2 bg-secondary/40 border-b border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground">
						<div class="flex items-center gap-2">
							<span class="w-2.5 h-2.5 rounded-full bg-border"></span>
							<span class="w-2.5 h-2.5 rounded-full bg-border"></span>
							<span class="w-2.5 h-2.5 rounded-full bg-border"></span>
							<span class="text-foreground font-medium pl-1">surios.gov.ph/community/stream</span>
						</div>
						<div class="flex items-center gap-2 text-[10px]">
							<span class="text-primary font-bold">55% SOCIAL STREAM</span>
							<span>|</span>
							<span class="text-foreground">45% STICKY RADAR</span>
						</div>
					</div>

					<!-- Split Screen Content Layout -->
					<div class="flex flex-col lg:flex-row min-h-[460px]">
						<!-- Left Pane: 55% Civic Social Media Stream -->
						{#if activePreviewTab === 'split' || activePreviewTab === 'feed'}
							<div class="p-4 sm:p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-border transition-all {activePreviewTab === 'feed' ? 'w-full' : 'w-full lg:w-[55%]' }">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-1.5">
										<Badge variant="outline" class="text-[10px] font-mono border-border">
											{selectedReport.id}
										</Badge>
										<Badge
											variant="outline"
											class="text-[10px] font-mono {selectedReport.vruRisk === 'CRITICAL' ? 'border-destructive text-destructive bg-destructive/10' : 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10'}"
										>
											VRU: {selectedReport.vruRisk}
										</Badge>
										{#if selectedReport.confirmations >= 5}
											<Badge variant="outline" class="text-[10px] font-mono border-primary text-primary bg-primary/10">
												⚡ DPWH Approved
											</Badge>
										{/if}
									</div>
									<span class="text-[10px] text-muted-foreground font-mono">{selectedReport.submittedTime}</span>
								</div>

								<!-- Report Title & Geolocation -->
								<div class="space-y-1">
									<h4 class="text-sm font-bold text-foreground">
										{selectedReport.title}
									</h4>
									<div class="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
										<span class="flex items-center gap-1 text-foreground font-medium">
											<MapPinIcon class="h-3 w-3 text-primary shrink-0" />
											{selectedReport.corridor}
										</span>
										<span>•</span>
										<span class="font-mono text-[10px]">{selectedReport.stationing}</span>
									</div>
								</div>

								<!-- Multi-Image Gallery Primary Hero Defect Frame -->
								<div class="space-y-2">
									<div class="relative rounded-lg border border-border bg-secondary/30 p-4 aspect-video flex flex-col justify-between overflow-hidden">
										<!-- Simulated Pothole Defect Canvas / AI Box -->
										<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
											<div class="w-44 h-28 rounded-lg border-2 border-dashed border-primary/70 bg-primary/10 flex flex-col items-center justify-center p-2 text-center">
												<span class="text-[10px] font-mono font-bold text-primary uppercase">
													{selectedReport.photos[selectedReport.activePhotoIdx].tag}
												</span>
												<span class="text-[9px] font-mono text-foreground font-semibold mt-0.5">
													{selectedReport.photos[selectedReport.activePhotoIdx].depthMetric}
												</span>
												<span class="text-[8px] text-muted-foreground mt-0.5">
													{selectedReport.astmCode}
												</span>
											</div>
										</div>

										<!-- Geostamp Header Overlay -->
										<div class="relative z-10 flex items-center justify-between text-[10px] font-mono">
											<span class="bg-card/90 px-2 py-0.5 rounded border border-border text-foreground">
												{selectedReport.photos[selectedReport.activePhotoIdx].angleLabel}
											</span>
											<span class="bg-card/90 px-2 py-0.5 rounded border border-border text-primary font-bold">
												{selectedReport.coordinates}
											</span>
										</div>

										<!-- Photo Description Footer Overlay -->
										<div class="relative z-10 bg-card/95 p-2 rounded-md border border-border flex items-center justify-between gap-2">
											<p class="text-[10px] text-foreground font-medium truncate">
												{selectedReport.photos[selectedReport.activePhotoIdx].description}
											</p>
											<Button
												variant="ghost"
												size="sm"
												class="text-[10px] h-6 px-1.5 shrink-0 gap-1 text-primary hover:text-primary"
												onclick={() => (inspectionModalPhoto = selectedReport.photos[selectedReport.activePhotoIdx])}
											>
												<EyeIcon class="h-3 w-3" />
												<span>Inspect</span>
											</Button>
										</div>
									</div>

									<!-- Secondary Thumbnail Stack with '+X more' Overlay -->
									<div class="grid grid-cols-4 gap-2">
										{#each selectedReport.photos as photo, idx}
											<button
												type="button"
												class="relative rounded-md border text-left p-1.5 bg-secondary/20 transition-all {selectedReport.activePhotoIdx === idx ? 'border-primary ring-1 ring-primary/40 bg-primary/5' : 'border-border hover:border-foreground/30'}"
												onclick={() => selectPhotoIndex(selectedReport.id, idx)}
											>
												<div class="text-[9px] font-mono font-bold text-foreground truncate">
													#{idx + 1} {photo.tag.split(' ')[0]}
												</div>
												<div class="text-[8px] text-muted-foreground truncate">
													{photo.angleLabel}
												</div>
												{#if idx === 3 && selectedReport.photos.length >= 4}
													<div class="absolute inset-0 bg-background/90 rounded-md border border-primary/50 flex items-center justify-center text-[10px] font-mono font-bold text-primary">
														+3 More
													</div>
												{/if}
											</button>
										{/each}
									</div>
								</div>

								<!-- Embedded Micro-GIS Card (Requirement 2) -->
								<div class="p-2.5 rounded-lg border border-border bg-secondary/20 flex items-center justify-between gap-2">
									<div class="flex items-center gap-2">
										<div class="w-8 h-8 rounded bg-card border border-border flex items-center justify-center text-primary shrink-0">
											<NavigationIcon class="h-4 w-4" />
										</div>
										<div class="space-y-0.5">
											<p class="text-[10px] font-mono font-bold text-foreground">
												Embedded Micro-GIS: Sta 84+210
											</p>
											<p class="text-[9px] text-muted-foreground">
												Bearing: 042° NE • Shoulder: 1.8m Unpaved • Speed: 40 km/h
											</p>
										</div>
									</div>
									<Badge variant="outline" class="text-[9px] font-mono border-border shrink-0">
										GIS SYNCED
									</Badge>
								</div>

								<!-- Interactive Upvote & Consensus Button -->
								<div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border">
									<div class="flex items-center gap-2">
										<Button
											variant={selectedReport.userConfirmed ? 'default' : 'outline'}
											size="sm"
											class="text-xs h-8 px-3 gap-1.5 shadow-none transition-all {selectedReport.userConfirmed ? 'bg-primary text-primary-foreground font-bold hover:bg-primary/90' : 'border-border hover:border-primary/50'}"
											onclick={() => toggleHazardConfirm(selectedReport.id)}
										>
											{#if selectedReport.userConfirmed}
												<CheckIcon class="h-3.5 w-3.5" />
												<span>+1 Confirmed ({selectedReport.confirmations})</span>
											{:else}
												<ThumbsUpIcon class="h-3.5 w-3.5 text-primary" />
												<span>+1 Confirm Pothole ({selectedReport.confirmations})</span>
											{/if}
										</Button>

										<Button
											variant="ghost"
											size="sm"
											class="text-xs h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground"
											onclick={() => toggleComments(selectedReport.id)}
										>
											<MessageSquareIcon class="h-3.5 w-3.5" />
											<span>{selectedReport.comments.length} Ground Notes</span>
										</Button>
									</div>

									<span class="text-[10px] font-mono text-muted-foreground">
										By {selectedReport.submittedBy.split(' ')[0]}
									</span>
								</div>

								<!-- Inline Verification Comments Stream -->
								{#if expandedCommentsReportId === selectedReport.id}
									<div class="p-3 rounded-lg bg-secondary/30 border border-border space-y-2 text-[11px]">
										<div class="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
											<span class="font-bold text-foreground">VERIFIED FRONTLINE COMMENTARY</span>
											<span>Reputation Verified</span>
										</div>
										<div class="space-y-1.5 divide-y divide-border/60">
											{#each selectedReport.comments as c}
												<div class="pt-1.5 first:pt-0 space-y-0.5">
													<div class="flex items-center justify-between text-[10px]">
														<span class="font-semibold text-foreground">{c.author} <span class="text-muted-foreground font-normal">({c.role})</span></span>
														<span class="text-muted-foreground font-mono">{c.time}</span>
													</div>
													<p class="text-[11px] text-muted-foreground leading-tight">
														"{c.text}"
													</p>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/if}

						<!-- Right Pane: 45% Sticky Leaflet Radar Map Viewport -->
						{#if activePreviewTab === 'split' || activePreviewTab === 'radar'}
							<div class="p-4 sm:p-5 space-y-4 bg-secondary/10 flex flex-col justify-between transition-all {activePreviewTab === 'radar' ? 'w-full' : 'w-full lg:w-[45%]' }">
								<div class="space-y-3">
									<!-- Sticky Radar Header -->
									<div class="flex items-center justify-between border-b border-border pb-2.5">
										<div class="flex items-center gap-2">
											<RadarIcon class="h-4 w-4 text-primary animate-pulse" />
											<div>
												<p class="text-xs font-bold text-foreground">Sticky Leaflet GIS Radar</p>
												<p class="text-[10px] text-muted-foreground font-mono">Positron Light CAD Basemap</p>
											</div>
										</div>
										<Badge variant="outline" class="text-[9px] font-mono border-primary text-primary">
											LIVE TRACKING
										</Badge>
									</div>

									<!-- Radar Coordinates & Corridor Status Display -->
									<div class="p-3 rounded-lg bg-card border border-border space-y-1.5 font-mono text-[10px]">
										<div class="flex justify-between items-center">
											<span class="text-muted-foreground">RADAR CENTER:</span>
											<span class="font-bold text-foreground">{selectedReport.coordinates}</span>
										</div>
										<div class="flex justify-between items-center">
											<span class="text-muted-foreground">ACTIVE CORRIDOR:</span>
											<span class="text-primary font-bold">{selectedReport.corridor}</span>
										</div>
										<div class="flex justify-between items-center">
											<span class="text-muted-foreground">CLUSTER DENSITY:</span>
											<span class="text-foreground">3 Defects within 250m Radius</span>
										</div>
										<div class="flex justify-between items-center">
											<span class="text-muted-foreground">NEAREST CREW:</span>
											<span class="text-foreground font-semibold">Laguna 1st DEO Crew Alpha (1.2 km)</span>
										</div>
									</div>

									<!-- Schematic Radar Vector Map Graphic -->
									<div class="relative rounded-lg border border-border bg-card p-3 aspect-square flex flex-col items-center justify-center overflow-hidden">
										<!-- Background Radar Rings -->
										<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
											<div class="w-64 h-64 rounded-full border border-border/40"></div>
											<div class="w-48 h-48 rounded-full border border-border/60"></div>
											<div class="w-32 h-32 rounded-full border border-primary/20 bg-primary/5"></div>
											<div class="w-16 h-16 rounded-full border border-primary/40"></div>
										</div>

										<!-- Crosshairs -->
										<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
											<div class="w-full h-px bg-border/40"></div>
											<div class="h-full w-px bg-border/40"></div>
										</div>

										<!-- Simulated Road Vector Line -->
										<div class="absolute w-full h-1 bg-border/80 rotate-12 flex items-center justify-around"></div>

										<!-- Active Squircle Marker Pin for Selected Report -->
										<div class="relative z-10 flex flex-col items-center">
											<div class="w-7 h-7 rounded-md bg-primary text-primary-foreground border-2 border-background flex items-center justify-center font-mono font-bold text-xs shadow-xs">
												!
											</div>
											<span class="bg-card/95 px-1.5 py-0.5 rounded border border-border text-[9px] font-mono font-bold text-foreground mt-1 shadow-xs">
												{selectedReport.id}
											</span>
										</div>

										<!-- Adjacent Minor Hazard Dots on Map -->
										<div class="absolute top-1/4 left-1/4 flex items-center gap-1">
											<div class="w-3.5 h-3.5 rounded-sm bg-secondary border border-border flex items-center justify-center text-[8px] font-mono text-muted-foreground">
												•
											</div>
											<span class="text-[8px] font-mono text-muted-foreground">REP-9038</span>
										</div>

										<div class="absolute bottom-1/4 right-1/4 flex items-center gap-1">
											<div class="w-3.5 h-3.5 rounded-sm bg-secondary border border-border flex items-center justify-center text-[8px] font-mono text-muted-foreground">
												•
											</div>
											<span class="text-[8px] font-mono text-muted-foreground">REP-9032</span>
										</div>

										<!-- Maintenance Crew Alpha Telemetry Icon -->
										<div class="absolute bottom-6 left-6 flex items-center gap-1 bg-card/95 p-1 rounded border border-border">
											<TruckIcon class="h-3 w-3 text-primary" />
											<span class="text-[8px] font-mono text-foreground font-semibold">Crew Alpha</span>
										</div>
									</div>
								</div>

								<!-- Sticky Telemetry Bottom Action -->
								<div class="pt-2 border-t border-border flex items-center justify-between text-[10px]">
									<span class="text-muted-foreground font-mono">Auto-Sync: Active (150ms Pan)</span>
									<a href="/" class="text-primary hover:underline font-medium flex items-center gap-1">
										<span>Launch Full GIS Console</span>
										<ArrowUpRightIcon class="h-3 w-3" />
									</a>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- ============================================================= -->
				<!-- 7.7 CROWDSOURCED SLA ESCALATION SIMULATOR                     -->
				<!-- ============================================================= -->
				<div class="p-4 sm:p-5 rounded-xl border border-border bg-secondary/20 space-y-4">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
						<div>
							<div class="flex items-center gap-2">
								<Badge variant="outline" class="text-[10px] font-mono border-primary text-primary">
									SLA SIMULATOR
								</Badge>
								<span class="text-xs text-muted-foreground">Test Autonomous Triage Thresholds</span>
							</div>
							<h4 class="text-sm font-bold text-foreground mt-0.5">
								Autonomous Consensus-Driven SLA Escalation Simulator
							</h4>
						</div>

						<Badge variant="outline" class="text-xs font-mono {simulatedSla.badgeClass}">
							{simulatedSla.badge}
						</Badge>
					</div>

					<!-- Interactive Confirmation Slider / Stepper -->
					<div class="space-y-2">
						<div class="flex items-center justify-between text-xs font-mono">
							<span class="text-foreground font-semibold">
								Citizen Confirmations Count: <strong class="text-primary text-sm">{activeSimulatorConfirmations}</strong>
							</span>
							<span class="text-muted-foreground">Threshold for DPWH Dispatch: 5 Confirmations</span>
						</div>

						<!-- Step Buttons -->
						<div class="flex items-center gap-1.5">
							{#each [1, 2, 3, 4, 5, 6, 7, 8] as count}
								<Button
									variant={activeSimulatorConfirmations === count ? 'default' : 'outline'}
									size="sm"
									class="flex-1 text-xs h-8 font-mono shadow-none transition-all {activeSimulatorConfirmations === count ? 'bg-primary text-primary-foreground font-bold' : 'border-border'}"
									onclick={() => (activeSimulatorConfirmations = count)}
								>
									{count}
								</Button>
							{/each}
						</div>

						<!-- Progress Bar to Threshold -->
						<div class="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border">
							<div
								class="bg-primary h-full transition-all duration-300 rounded-full"
								style="width: {simulatedSla.progressPct}%"
							></div>
						</div>
					</div>

					<!-- Dynamic SLA Outcome Card -->
					<div class="p-3.5 rounded-lg bg-card border border-border space-y-2">
						<div class="flex items-center justify-between text-xs">
							<div class="font-bold text-foreground flex items-center gap-1.5">
								<ClockIcon class="h-3.5 w-3.5 text-primary" />
								<span>{simulatedSla.title}</span>
							</div>
							<span class="font-mono text-[11px] text-primary font-bold">
								{simulatedSla.slaHours}h SLA Deadline
							</span>
						</div>
						<p class="text-[11px] text-muted-foreground leading-relaxed">
							{simulatedSla.description}
						</p>
						<div class="p-2 rounded bg-secondary/30 border border-border text-[10px] font-mono text-foreground">
							<strong>Action Item:</strong> {simulatedSla.actionItem}
						</div>
					</div>
				</div>
			</div>

			<Separator />

			<!-- 7.8 TypeScript Architecture & Data Contracts -->
			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<Badge variant="secondary" class="text-[10px] font-mono border-border">7.8 CONTRACTS</Badge>
					<h3 class="text-sm font-semibold text-foreground">Data Contracts &amp; TypeScript Specification</h3>
				</div>
				<p>
					The civic social stream is governed by strict TypeScript interfaces, ensuring clean boundary validation between citizen input, Gemini multimodal auditing, and municipal dispatch engines:
				</p>
				<div class="p-3 rounded-lg bg-secondary/40 border border-border font-mono text-[11px] text-foreground overflow-x-auto space-y-2">
					<p class="text-muted-foreground">// Core Civic Social Hazard Post Contract</p>
					<pre class="leading-relaxed"><code>interface CivicHazardPost &#123;
  id: string; // e.g. "REP-9041"
  corridor: string; // "Pedro Guevara Avenue"
  stationing: string; // "Sta 84+210"
  coordinates: [number, number]; // [14.2813, 121.4173]
  distressType: 'POTHOLE' | 'EDGE_CRACK' | 'ALLIGATOR' | 'UTILITY_TRENCH';
  astmSeverity: 'LOW' | 'MEDIUM' | 'HIGH'; // ASTM D6433-20
  vruLethalityScore: number; // 0-100 calculated by lethality index
  primaryPhotoUrl: string;
  galleryThumbnails: &#123;
    angle: 'ORTHOGONAL_RULER' | 'CORRIDOR_CONTEXT' | 'RAIN_HAZARD';
    url: string;
    depthGaugeMm?: number;
  &#125;[];
  confirmations: number;
  slaTier: 'STANDARD_7D' | 'BARANGAY_48H' | 'DPWH_EMERGENCY_24H';
  escalatedToDpwh: boolean;
  assignedContractorId?: string;
&#125;</code></pre>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Lightbox Inspection Modal (Interactive Gallery Preview) -->
	{#if inspectionModalPhoto}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-none p-4">
			<Card class="border border-border bg-card shadow-lg max-w-lg w-full">
				<CardHeader class="pb-2 flex flex-row items-center justify-between">
					<div>
						<CardTitle class="text-sm font-bold text-foreground">
							{inspectionModalPhoto.title}
						</CardTitle>
						<CardDescription class="text-[10px] font-mono text-primary">
							{inspectionModalPhoto.tag} • {inspectionModalPhoto.angleLabel}
						</CardDescription>
					</div>
					<Button
						variant="ghost"
						size="icon-sm"
						class="h-7 w-7 text-muted-foreground hover:text-foreground"
						onclick={() => (inspectionModalPhoto = null)}
					>
						<XIcon class="h-4 w-4" />
					</Button>
				</CardHeader>
				<CardContent class="space-y-3 text-xs">
					<div class="rounded-lg border border-border bg-secondary/30 p-8 flex flex-col items-center justify-center text-center space-y-2">
						<CameraIcon class="h-8 w-8 text-primary" />
						<p class="font-mono text-xs text-foreground font-semibold">
							High-Resolution Calibrated Civil Frame
						</p>
						<p class="text-[10px] text-muted-foreground max-w-xs">
							{inspectionModalPhoto.description}
						</p>
						{#if inspectionModalPhoto.depthMetric}
							<Badge variant="outline" class="text-[10px] font-mono border-primary text-primary">
								Measurement: {inspectionModalPhoto.depthMetric}
							</Badge>
						{/if}
					</div>
					<div class="p-2.5 rounded bg-secondary/20 border border-border text-[10px] font-mono space-y-1 text-muted-foreground">
						<div class="flex justify-between">
							<span>EXIF GPS Precision:</span>
							<span class="text-foreground">± 1.2 meters CEP</span>
						</div>
						<div class="flex justify-between">
							<span>Camera Calibration:</span>
							<span class="text-foreground">DPWH Form 102 Compliant</span>
						</div>
						<div class="flex justify-between">
							<span>Multimodal Verification:</span>
							<span class="text-primary font-semibold">Gemini 3.5 Flash Audited</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
