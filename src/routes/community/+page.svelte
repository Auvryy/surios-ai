<script lang="ts">
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';

	import AwardIcon from '@lucide/svelte/icons/award';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import BikeIcon from '@lucide/svelte/icons/bike';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import NavigationIcon from '@lucide/svelte/icons/navigation';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import SearchIcon from '@lucide/svelte/icons/search';
	import CameraIcon from '@lucide/svelte/icons/camera';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import AlertCircleIcon from '@lucide/svelte/icons/circle-alert';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import TrophyIcon from '@lucide/svelte/icons/trophy';
	import MedalIcon from '@lucide/svelte/icons/medal';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import CoinsIcon from '@lucide/svelte/icons/coins';
	import CheckIcon from '@lucide/svelte/icons/check';
	import Share2Icon from '@lucide/svelte/icons/share-2';

	// Citizen Reporter Interface
	interface GuardianLeader {
		rank: number;
		name: string;
		handle: string;
		role: string;
		badgeName: string;
		hazardScore: number;
		verifiedReports: number;
		preventedAccidents: number;
		accuracyRate: number; // percentage
		topCorridor: string;
		isCurrentUser?: boolean;
	}

	// Community Report Interface
	interface CommunityReport {
		id: string;
		title: string;
		location: string;
		coordinates: string;
		distressType: string;
		depthEstimate: string;
		vruRisk: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
		vruDetails: string;
		submittedBy: string;
		submittedTime: string;
		confirmations: number;
		userConfirmed: boolean;
		isUserSubmission?: boolean;
		escalatedToDpwh: boolean;
		status: 'PENDING_CONSENSUS' | 'ESCALATED' | 'DISPATCHED';
	}

	// Personal Citizen Impact State
	// Explicitly requiring:
	// - '3 Verified Submissions'
	// - '14 Motorcycle Accidents Prevented'
	// - '₱84,000 Pavement Damage Averted'
	let verifiedSubmissionsCount = $state(3);
	let accidentsPreventedCount = $state(14);
	let damageAvertedPesos = $state(84000);
	let personalUpvotesGiven = $state(28);
	let personalScore = $state(210);

	// Leaderboard State
	let leaderboardTab = $state<'ALL_TIME' | 'THIS_MONTH' | 'SANTA_CRUZ'>('ALL_TIME');
	let leaderboardSearch = $state('');

	let guardians = $state<GuardianLeader[]>([
		{
			rank: 1,
			name: 'Mark Bautista',
			handle: '@rider_mark_laguna',
			role: 'Motorcycle Commuter & Two-Wheeler Safety Lead',
			badgeName: 'Laguna Gold Guardian',
			hazardScore: 940,
			verifiedReports: 38,
			preventedAccidents: 62,
			accuracyRate: 99.4,
			topCorridor: 'Manila East Rd / National Highway'
		},
		{
			rank: 2,
			name: 'Ria Santos',
			handle: '@ria_commutes',
			role: 'Student Corridor Watch Coordinator',
			badgeName: 'Silver Sentinel',
			hazardScore: 780,
			verifiedReports: 29,
			preventedAccidents: 45,
			accuracyRate: 98.2,
			topCorridor: 'Quezon Ave – Bubukal Student Corridor'
		},
		{
			rank: 3,
			name: 'Kuya Jojo & TODASCL Patrol',
			handle: '@toda_santa_cruz',
			role: 'Santa Cruz Tricycle Operators Federation',
			badgeName: 'Bronze Advocate',
			hazardScore: 650,
			verifiedReports: 24,
			preventedAccidents: 39,
			accuracyRate: 96.8,
			topCorridor: 'Pedro Guevara Avenue (Poblacion)'
		},
		{
			rank: 4,
			name: 'Engr. Mateo Cruz',
			handle: '@cruz_civil',
			role: 'LSPU Civil Engineering Faculty Volunteer',
			badgeName: 'Civil Inspector Sentinel',
			hazardScore: 520,
			verifiedReports: 19,
			preventedAccidents: 28,
			accuracyRate: 100,
			topCorridor: 'San Pablo Norte Lakefront Bypass'
		},
		{
			rank: 5,
			name: 'Carla Dizon',
			handle: '@carla_cycling',
			role: 'Santa Cruz Active Mobility Advocate',
			badgeName: 'Active Mobility Sentinel',
			hazardScore: 440,
			verifiedReports: 16,
			preventedAccidents: 22,
			accuracyRate: 97.0,
			topCorridor: 'Aguinaldo St / Public Market Feeder'
		},
		{
			rank: 12,
			name: 'Juan Dela Cruz (You)',
			handle: '@juan_guardian',
			role: 'Verified Barangay Citizen Sentinel',
			badgeName: 'Active Road Guardian',
			hazardScore: 210,
			verifiedReports: 3,
			preventedAccidents: 14,
			accuracyRate: 100,
			topCorridor: 'Pedro Guevara Avenue',
			isCurrentUser: true
		}
	]);

	// Community Verification Feed State
	let feedTab = $state<'ALL' | 'CRITICAL_VRU' | 'NEEDS_CONSENSUS' | 'MY_SUBMISSIONS'>('ALL');
	let feedSearch = $state('');
	let copiedReportId = $state<string | null>(null);

	let reports = $state<CommunityReport[]>([
		{
			id: 'REP-9041',
			title: 'Deep 68mm Crater near LSPU Gate 2',
			location: 'Pedro Guevara Ave (Near LSPU Main Gate), Santa Cruz',
			coordinates: '14.2813° N, 121.4173° E',
			distressType: 'Pothole (ASTM D6433 - High Severity)',
			depthEstimate: '68mm vertical rim strike',
			vruRisk: 'CRITICAL',
			vruDetails: 'Severe vertical lip directly in the primary motorcycle lane. Submerged during rain pooling.',
			submittedBy: '@rider_mark_laguna',
			submittedTime: '15m ago',
			confirmations: 8,
			userConfirmed: false,
			isUserSubmission: false,
			escalatedToDpwh: true,
			status: 'ESCALATED'
		},
		{
			id: 'REP-9038',
			title: 'Longitudinal Shoulder Drop-off & Gutter Fracture',
			location: 'National Highway (Pagsanjan Junction), Santa Cruz',
			coordinates: '14.2765° N, 121.4312° E',
			distressType: 'Edge Breakdown & Rutting (ASTM D6433)',
			depthEstimate: '75mm shoulder step-down',
			vruRisk: 'HIGH',
			vruDetails: 'High instability risk for passenger tricycles overtaking along shoulder during evening commute.',
			submittedBy: '@toda_santa_cruz',
			submittedTime: '42m ago',
			confirmations: 4,
			userConfirmed: false,
			isUserSubmission: false,
			escalatedToDpwh: false,
			status: 'PENDING_CONSENSUS'
		},
		{
			id: 'REP-9032',
			title: 'Sunken Crosswalk Trench near Elementary School',
			location: 'Quezon Ave – Bubukal Student Corridor, Santa Cruz',
			coordinates: '14.2690° N, 121.4021° E',
			distressType: 'Depressed Utility Cut (ASTM D6433)',
			depthEstimate: '52mm transverse depression',
			vruRisk: 'CRITICAL',
			vruDetails: 'School zone danger: causes sudden loss of steering control for commuter e-trikes and scooters.',
			submittedBy: '@ria_commutes',
			submittedTime: '1h 10m ago',
			confirmations: 7,
			userConfirmed: true,
			isUserSubmission: false,
			escalatedToDpwh: true,
			status: 'DISPATCHED'
		},
		{
			id: 'REP-9029',
			title: 'Fatigue Alligator Cracking with Loose Aggregates',
			location: 'Aguinaldo St / Public Market Feeder, Santa Cruz',
			coordinates: '14.2801° N, 121.4154° E',
			distressType: 'Alligator Cracking (ASTM D6433 - Moderate)',
			depthEstimate: '35mm localized spalling',
			vruRisk: 'MODERATE',
			vruDetails: 'Loose gravel pebbles create skid danger for mopeds making tight turns at market intersection.',
			submittedBy: '@juan_guardian',
			submittedTime: '2h 15m ago',
			confirmations: 3,
			userConfirmed: true,
			isUserSubmission: true,
			escalatedToDpwh: false,
			status: 'PENDING_CONSENSUS'
		},
		{
			id: 'REP-9025',
			title: 'Thermal Transverse Crack Across Travel Lane',
			location: 'San Pablo Norte Lakefront Bypass, Santa Cruz',
			coordinates: '14.2890° N, 121.4250° E',
			distressType: 'Transverse Thermal Crack (ASTM D6433 - Low)',
			depthEstimate: '18mm crack aperture',
			vruRisk: 'LOW',
			vruDetails: 'Hairline cracking requiring preventative rubberized bitumen seal before monsoon infiltration.',
			submittedBy: '@cruz_civil',
			submittedTime: '3h 40m ago',
			confirmations: 2,
			userConfirmed: false,
			isUserSubmission: false,
			escalatedToDpwh: false,
			status: 'PENDING_CONSENSUS'
		}
	]);

	// Filtered Leaderboard
	const filteredGuardians = $derived(
		guardians.filter((g) => {
			const query = leaderboardSearch.trim().toLowerCase();
			const matchesQuery =
				!query ||
				g.name.toLowerCase().includes(query) ||
				g.handle.toLowerCase().includes(query) ||
				g.badgeName.toLowerCase().includes(query) ||
				g.topCorridor.toLowerCase().includes(query);
			return matchesQuery;
		})
	);

	// Filtered Feed Reports
	const filteredReports = $derived(
		reports.filter((rep) => {
			let matchesTab = true;
			if (feedTab === 'CRITICAL_VRU') {
				matchesTab = rep.vruRisk === 'CRITICAL' || rep.vruRisk === 'HIGH';
			} else if (feedTab === 'NEEDS_CONSENSUS') {
				matchesTab = rep.confirmations < 5;
			} else if (feedTab === 'MY_SUBMISSIONS') {
				matchesTab = !!rep.isUserSubmission;
			}

			const query = feedSearch.trim().toLowerCase();
			const matchesQuery =
				!query ||
				rep.title.toLowerCase().includes(query) ||
				rep.location.toLowerCase().includes(query) ||
				rep.distressType.toLowerCase().includes(query) ||
				rep.submittedBy.toLowerCase().includes(query);

			return matchesTab && matchesQuery;
		})
	);

	// Interactive Upvote Handler: '+1 Confirm Pothole'
	function toggleConfirm(reportId: string) {
		reports = reports.map((r) => {
			if (r.id === reportId) {
				const isNowConfirmed = !r.userConfirmed;
				const newCount = isNowConfirmed ? r.confirmations + 1 : Math.max(0, r.confirmations - 1);
				const isEscalated = newCount >= 5;

				// Update personal counter dynamically
				if (isNowConfirmed) {
					personalUpvotesGiven += 1;
					personalScore += 10;
				} else {
					personalUpvotesGiven = Math.max(0, personalUpvotesGiven - 1);
					personalScore = Math.max(0, personalScore - 10);
				}

				return {
					...r,
					confirmations: newCount,
					userConfirmed: isNowConfirmed,
					escalatedToDpwh: isEscalated,
					status: isEscalated ? (r.status === 'DISPATCHED' ? 'DISPATCHED' : 'ESCALATED') : 'PENDING_CONSENSUS'
				};
			}
			return r;
		});
	}

	function copyReportShare(reportId: string) {
		copiedReportId = reportId;
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(`${window.location.origin}/community#${reportId}`);
		}
		setTimeout(() => {
			if (copiedReportId === reportId) {
				copiedReportId = null;
			}
		}, 2000);
	}

	function getVruBadgeClass(risk: CommunityReport['vruRisk']): string {
		switch (risk) {
			case 'CRITICAL':
				return 'bg-destructive/15 text-destructive border-destructive/30 font-semibold';
			case 'HIGH':
				return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold';
			case 'MODERATE':
				return 'bg-secondary text-foreground border-border';
			case 'LOW':
				return 'bg-muted text-muted-foreground border-border';
			default:
				return 'bg-secondary text-foreground border-border';
		}
	}
</script>

<svelte:head>
	<title>Laguna Road Guardians — Citizen Hub — SuriOS</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
	<!-- Page Header with Civic Identity -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
		<div class="space-y-1.5">
			<div class="flex items-center gap-2">
				<Badge variant="outline" class="text-xs font-mono border-border">
					Civil Transparency & Consensus
				</Badge>
				<span class="text-xs text-muted-foreground">SDG 9 / SDG 11 Civic Infrastructure Watch</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
				<AwardIcon class="h-6 w-6 text-primary shrink-0" />
				Laguna Road Guardians Hub
			</h1>
			<p class="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
				Crowdsourced road hazard verification, two-wheeler accident prevention metrics, and citizen consensus ranking for Santa Cruz, Laguna.
			</p>
		</div>

		<!-- Action CTAs: Submit & Map -->
		<div class="flex flex-wrap items-center gap-2.5">
			<a href="/report" class="inline-flex">
				<Button class="text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-none">
					<CameraIcon class="h-3.5 w-3.5" />
					<span>Report Road Defect</span>
				</Button>
			</a>
			<a href="/" class="inline-flex">
				<Button variant="outline" class="text-xs h-9 border-border gap-1.5 shadow-none">
					<NavigationIcon class="h-3.5 w-3.5 text-primary" />
					<span>Live Map Feed</span>
					<ArrowUpRightIcon class="h-3.5 w-3.5 text-muted-foreground" />
				</Button>
			</a>
		</div>
	</div>

	<!-- Section 1: Personal Citizen Impact Counter (Requirement 2) -->
	<div class="space-y-3">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
			<div>
				<div class="flex items-center gap-2">
					<Badge variant="outline" class="text-[10px] font-mono border-border">
						Personal Telemetry
					</Badge>
					<span class="text-xs text-muted-foreground">Verified Citizen Impact Profile</span>
				</div>
				<h2 class="text-lg font-bold tracking-tight text-foreground mt-0.5 flex items-center gap-2">
					<ShieldCheckIcon class="h-4 w-4 text-primary" />
					Your Civic Infrastructure Impact
				</h2>
			</div>
			<div class="flex items-center gap-2 text-xs">
				<Badge variant="secondary" class="border-border text-foreground font-mono">
					Rank #12 • Active Guardian
				</Badge>
				<span class="text-muted-foreground font-mono">{personalScore} pts</span>
			</div>
		</div>

		<!-- Personal Impact Counter Cards Grid (Strictly containing the 3 required metrics) -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Metric 1: '3 Verified Submissions' -->
			<Card class="border border-border bg-card shadow-none">
				<CardHeader class="pb-2">
					<div class="flex items-center justify-between">
						<CardDescription class="text-xs font-medium text-muted-foreground">Field Submissions</CardDescription>
						<CheckCircleIcon class="h-4 w-4 text-primary" />
					</div>
					<CardTitle class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
						{verifiedSubmissionsCount} <span class="text-sm font-normal text-muted-foreground">Verified Submissions</span>
					</CardTitle>
				</CardHeader>
				<CardContent class="text-xs text-muted-foreground pt-0 space-y-1">
					<p class="text-foreground font-medium">100% Gemini AI Civil Audit Pass Rate</p>
					<p class="text-[11px] leading-tight">
						Pedro Guevara Ave, National Highway, and Aguinaldo St corridors verified without spam rejection.
					</p>
				</CardContent>
			</Card>

			<!-- Metric 2: '14 Motorcycle Accidents Prevented' -->
			<Card class="border border-border bg-card shadow-none">
				<CardHeader class="pb-2">
					<div class="flex items-center justify-between">
						<CardDescription class="text-xs font-medium text-muted-foreground">Two-Wheeler Safety Impact</CardDescription>
						<BikeIcon class="h-4 w-4 text-primary" />
					</div>
					<CardTitle class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
						{accidentsPreventedCount} <span class="text-sm font-normal text-muted-foreground">Motorcycle Accidents Prevented</span>
					</CardTitle>
				</CardHeader>
				<CardContent class="text-xs text-muted-foreground pt-0 space-y-1">
					<p class="text-foreground font-medium">High-Risk VRU Pothole Profiling</p>
					<p class="text-[11px] leading-tight">
						Eliminated severe rim strike and loss-of-control hazards for tricycles and commuter riders.
					</p>
				</CardContent>
			</Card>

			<!-- Metric 3: '₱84,000 Pavement Damage Averted' -->
			<Card class="border border-border bg-card shadow-none">
				<CardHeader class="pb-2">
					<div class="flex items-center justify-between">
						<CardDescription class="text-xs font-medium text-muted-foreground">LGU Budget Preservation</CardDescription>
						<CoinsIcon class="h-4 w-4 text-primary" />
					</div>
					<CardTitle class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
						₱{damageAvertedPesos.toLocaleString()} <span class="text-sm font-normal text-muted-foreground">Pavement Damage Averted</span>
					</CardTitle>
				</CardHeader>
				<CardContent class="text-xs text-muted-foreground pt-0 space-y-1">
					<p class="text-foreground font-medium">Preventative Maintenance Economics</p>
					<p class="text-[11px] leading-tight">
						Savings calculated via early cold-patching (₱1,500/m²) vs. structural subgrade base reconstruction (₱15,000/m²).
					</p>
				</CardContent>
			</Card>
		</div>
	</div>

	<!-- Section 2: Laguna Road Guardians Leaderboard (Requirement 1) -->
	<div class="space-y-4">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<div>
				<div class="flex items-center gap-2">
					<Badge variant="outline" class="text-[10px] font-mono border-border">
						Public Honor Roll
					</Badge>
					<span class="text-xs text-muted-foreground">ASTM D6433 Certified Citizen Reports</span>
				</div>
				<h2 class="text-lg font-bold tracking-tight text-foreground mt-1 flex items-center gap-2">
					<TrophyIcon class="h-4 w-4 text-primary" />
					Laguna Road Guardians Citizen Leaderboard
				</h2>
			</div>

			<!-- Search & Filter Controls -->
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
				<div class="relative w-full sm:w-56">
					<SearchIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search reporter or corridor..."
						class="text-xs pl-8 h-8 bg-card border-border shadow-none"
						bind:value={leaderboardSearch}
					/>
				</div>

				<div class="flex items-center gap-1">
					<Button
						variant={leaderboardTab === 'ALL_TIME' ? 'default' : 'outline'}
						size="sm"
						class="text-xs h-8 px-2.5 shadow-none"
						onclick={() => (leaderboardTab = 'ALL_TIME')}
					>
						All-Time
					</Button>
					<Button
						variant={leaderboardTab === 'THIS_MONTH' ? 'default' : 'outline'}
						size="sm"
						class="text-xs h-8 px-2.5 shadow-none"
						onclick={() => (leaderboardTab = 'THIS_MONTH')}
					>
						This Month
					</Button>
					<Button
						variant={leaderboardTab === 'SANTA_CRUZ' ? 'default' : 'outline'}
						size="sm"
						class="text-xs h-8 px-2.5 shadow-none"
						onclick={() => (leaderboardTab = 'SANTA_CRUZ')}
					>
						Santa Cruz
					</Button>
				</div>
			</div>
		</div>

		<!-- Leaderboard Table Card -->
		<Card class="border border-border bg-card shadow-none overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full text-left border-collapse text-xs">
					<thead>
						<tr class="border-b border-border bg-secondary/30 font-mono text-[11px] text-muted-foreground">
							<th class="py-2.5 px-4 font-normal">RANK</th>
							<th class="py-2.5 px-4 font-normal">ROAD GUARDIAN</th>
							<th class="py-2.5 px-4 font-normal">HONOR BADGE</th>
							<th class="py-2.5 px-4 font-normal text-right">VERIFIED REPORTS</th>
							<th class="py-2.5 px-4 font-normal text-right">VRU ACCIDENTS PREVENTED</th>
							<th class="py-2.5 px-4 font-normal text-right">HAZARD SCORE</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filteredGuardians as guardian}
							<tr class="hover:bg-secondary/20 transition-colors {guardian.isCurrentUser ? 'bg-primary/5 font-medium' : ''}">
								<!-- Rank -->
								<td class="py-3 px-4 font-mono">
									{#if guardian.rank === 1}
										<span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/30">
											1
										</span>
									{:else if guardian.rank === 2}
										<span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-secondary text-foreground font-bold text-xs border border-border">
											2
										</span>
									{:else if guardian.rank === 3}
										<span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-secondary text-foreground font-bold text-xs border border-border">
											3
										</span>
									{:else}
										<span class="text-muted-foreground pl-2 font-mono">#{guardian.rank}</span>
									{/if}
								</td>

								<!-- Citizen Info -->
								<td class="py-3 px-4">
									<div class="flex items-center gap-2.5">
										<div class="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center font-bold text-xs text-foreground shrink-0">
											{guardian.name.slice(0, 2).toUpperCase()}
										</div>
										<div class="space-y-0.5">
											<div class="font-bold text-foreground flex items-center gap-1.5">
												<span>{guardian.name}</span>
												{#if guardian.isCurrentUser}
													<Badge variant="outline" class="text-[9px] py-0 px-1 border-primary text-primary">
														YOU
													</Badge>
												{/if}
											</div>
											<div class="text-[11px] text-muted-foreground flex items-center gap-1.5">
												<span class="font-mono">{guardian.handle}</span>
												<span>•</span>
												<span class="truncate max-w-[200px]">{guardian.topCorridor}</span>
											</div>
										</div>
									</div>
								</td>

								<!-- Honor Badge -->
								<td class="py-3 px-4">
									<Badge
										variant="outline"
										class="text-[10px] font-mono {guardian.rank === 1 ? 'border-primary text-primary bg-primary/10' : 'border-border'}"
									>
										{guardian.badgeName}
									</Badge>
								</td>

								<!-- Verified Reports -->
								<td class="py-3 px-4 text-right font-mono text-foreground">
									{guardian.verifiedReports}
									<span class="text-[10px] text-muted-foreground font-sans">({guardian.accuracyRate}%)</span>
								</td>

								<!-- Accidents Prevented -->
								<td class="py-3 px-4 text-right font-mono text-foreground">
									{guardian.preventedAccidents}
									<span class="text-[10px] text-muted-foreground font-sans">avoided</span>
								</td>

								<!-- Hazard Score -->
								<td class="py-3 px-4 text-right font-mono font-bold text-primary">
									{guardian.hazardScore} pts
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	</div>

	<!-- Section 3: Community Verification Feed (Requirement 3) -->
	<div class="space-y-4">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<div>
				<div class="flex items-center gap-2">
					<Badge variant="outline" class="text-[10px] font-mono border-border">
						Crowdsourced Consensus
					</Badge>
					<span class="text-xs text-muted-foreground">Interactive Upvote & Priority Escalation</span>
				</div>
				<h2 class="text-lg font-bold tracking-tight text-foreground mt-1 flex items-center gap-2">
					<ThumbsUpIcon class="h-4 w-4 text-primary" />
					Community Verification Feed
				</h2>
			</div>

			<!-- Feed Search & Category Tabs -->
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
				<div class="relative w-full sm:w-56">
					<SearchIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Filter street or defect..."
						class="text-xs pl-8 h-8 bg-card border-border shadow-none"
						bind:value={feedSearch}
					/>
				</div>

				<div class="flex items-center gap-1">
					<Button
						variant={feedTab === 'ALL' ? 'default' : 'outline'}
						size="sm"
						class="text-xs h-8 px-2.5 shadow-none"
						onclick={() => (feedTab = 'ALL')}
					>
						All ({reports.length})
					</Button>
					<Button
						variant={feedTab === 'CRITICAL_VRU' ? 'default' : 'outline'}
						size="sm"
						class="text-xs h-8 px-2.5 shadow-none"
						onclick={() => (feedTab = 'CRITICAL_VRU')}
					>
						VRU Hazard
					</Button>
					<Button
						variant={feedTab === 'NEEDS_CONSENSUS' ? 'default' : 'outline'}
						size="sm"
						class="text-xs h-8 px-2.5 shadow-none"
						onclick={() => (feedTab = 'NEEDS_CONSENSUS')}
					>
						Needs Consensus
					</Button>
					<Button
						variant={feedTab === 'MY_SUBMISSIONS' ? 'default' : 'outline'}
						size="sm"
						class="text-xs h-8 px-2.5 shadow-none"
						onclick={() => (feedTab = 'MY_SUBMISSIONS')}
					>
						My Submissions
					</Button>
				</div>
			</div>
		</div>

		<!-- Feed Cards List -->
		<div class="space-y-4">
			{#if filteredReports.length === 0}
				<Card class="border border-border bg-card shadow-none p-8 text-center space-y-2">
					<p class="text-sm font-medium text-foreground">No community reports match this criteria.</p>
					<p class="text-xs text-muted-foreground">Select another tab or clear your search.</p>
					<Button
						variant="outline"
						size="sm"
						class="text-xs border-border shadow-none mt-2"
						onclick={() => {
							feedSearch = '';
							feedTab = 'ALL';
						}}
					>
						Reset Feed Filters
					</Button>
				</Card>
			{:else}
				{#each filteredReports as report}
					<Card class="border border-border bg-card shadow-none hover:border-foreground/20 transition-colors">
						<CardContent class="p-5 sm:p-6 space-y-4">
							<!-- Feed Card Header -->
							<div class="flex flex-col md:flex-row md:items-start justify-between gap-3">
								<div class="space-y-1 flex-1">
									<div class="flex flex-wrap items-center gap-2">
										<span class="text-xs font-mono text-muted-foreground">{report.id}</span>
										<Badge variant="outline" class="text-[10px] font-mono {getVruBadgeClass(report.vruRisk)}">
											VRU: {report.vruRisk}
										</Badge>
										{#if report.escalatedToDpwh}
											<Badge variant="outline" class="text-[10px] font-mono border-primary text-primary bg-primary/10">
												⚡ DPWH Dispatch Approved
											</Badge>
										{/if}
										{#if report.isUserSubmission}
											<Badge variant="outline" class="text-[10px] font-mono border-border text-foreground">
												Your Submission
											</Badge>
										{/if}
									</div>

									<h3 class="text-base font-bold text-foreground">
										{report.title}
									</h3>

									<div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
										<div class="flex items-center gap-1">
											<MapPinIcon class="h-3.5 w-3.5 text-primary shrink-0" />
											<span class="text-foreground font-medium">{report.location}</span>
										</div>
										<span>•</span>
										<span class="font-mono text-[11px]">{report.coordinates}</span>
										<span>•</span>
										<span>{report.submittedBy} ({report.submittedTime})</span>
									</div>
								</div>

								<!-- Interactive '+1 Confirm Pothole' Upvote Button -->
								<div class="flex items-center gap-2 self-start md:self-auto shrink-0">
									<Button
										variant={report.userConfirmed ? 'default' : 'outline'}
										size="sm"
										class="text-xs h-9 px-3.5 gap-2 shadow-none transition-all {report.userConfirmed ? 'bg-primary text-primary-foreground font-bold hover:bg-primary/90' : 'border-border hover:border-primary/50'}"
										onclick={() => toggleConfirm(report.id)}
									>
										{#if report.userConfirmed}
											<CheckIcon class="h-3.5 w-3.5" />
											<span>Confirmed ({report.confirmations})</span>
										{:else}
											<ThumbsUpIcon class="h-3.5 w-3.5 text-primary" />
											<span>+1 Confirm Pothole ({report.confirmations})</span>
										{/if}
									</Button>

									<Button
										variant="ghost"
										size="icon-sm"
										class="h-9 w-9 text-muted-foreground hover:text-foreground"
										title="Share or copy report permalink"
										onclick={() => copyReportShare(report.id)}
									>
										{#if copiedReportId === report.id}
											<CheckIcon class="h-4 w-4 text-primary" />
										{:else}
											<Share2Icon class="h-4 w-4" />
										{/if}
									</Button>
								</div>
							</div>

							<Separator />

							<!-- Defect Context & Two-Wheeler Vulnerability Profile -->
							<div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-secondary/20 p-3 rounded-xl border border-border">
								<div class="space-y-1">
									<span class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
										ASTM Distress Code
									</span>
									<div class="font-medium text-foreground">
										{report.distressType}
									</div>
									<div class="text-[11px] text-muted-foreground font-mono">
										Depth: {report.depthEstimate}
									</div>
								</div>

								<div class="space-y-1 md:col-span-2">
									<span class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
										Vulnerable Road User (VRU) Safety Warning
									</span>
									<p class="text-[11px] text-foreground leading-relaxed">
										{report.vruDetails}
									</p>
								</div>
							</div>

							<!-- Consensus Progress Meter -->
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
								<div class="flex items-center gap-2">
									<span class="text-[11px] font-mono text-muted-foreground">
										Consensus: <strong>{report.confirmations}</strong> citizen confirmations
									</span>
									{#if report.confirmations >= 5}
										<span class="text-[11px] font-mono text-primary font-semibold">
											(Threshold Reached: 5/5)
										</span>
									{:else}
										<span class="text-[11px] font-mono text-muted-foreground">
											(Needs {5 - report.confirmations} more to trigger auto-dispatch)
										</span>
									{/if}
								</div>

								<div class="flex items-center gap-2">
									<a
										href="/?incident={report.id}"
										class="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
									>
										<span>View Pin on GIS Map</span>
										<ArrowUpRightIcon class="h-3 w-3" />
									</a>
								</div>
							</div>
						</CardContent>
					</Card>
				{/each}
			{/if}
		</div>
	</div>
</div>
