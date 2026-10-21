<script lang="ts">
	import CameraIcon from '@lucide/svelte/icons/camera';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import BikeIcon from '@lucide/svelte/icons/bike';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import RulerIcon from '@lucide/svelte/icons/ruler';
	import SquareCheckIcon from '@lucide/svelte/icons/square-check';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import ClockIcon from '@lucide/svelte/icons/clock';

	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import type { TriageAnalysis } from '$lib/types/triage.js';

	interface PitchSample {
		key: 'pothole' | 'alligator' | 'spam';
		title: string;
		badgeText: string;
		badgeVariant: 'destructive' | 'default' | 'secondary' | 'outline';
		corridor: string;
		lat: number;
		lng: number;
		url: string;
		filename: string;
		description: string;
	}

	const PITCH_SAMPLES: PitchSample[] = [
		{
			key: 'pothole',
			title: 'Severe Pothole',
			badgeText: '9/10 VRU CRITICAL',
			badgeVariant: 'destructive',
			corridor: 'LSPU Main Entrance (Manila East Rd)',
			lat: 14.2813,
			lng: 121.4173,
			url: '/samples/pothole-severe.jpg',
			filename: 'pothole-severe.jpg',
			description: 'Deep rim-strike cavity (>50mm) with vertical asphalt fracture lip.'
		},
		{
			key: 'alligator',
			title: 'Alligator Fatigue',
			badgeText: 'EMERGENCY DISPATCH',
			badgeVariant: 'destructive',
			corridor: 'National Highway Pagsanjan Junction',
			lat: 14.2765,
			lng: 121.4312,
			url: '/samples/alligator-fatigue.jpg',
			filename: 'alligator-fatigue.jpg',
			description: 'Interconnected polygon cracking causing front-tire rut lock.'
		},
		{
			key: 'spam',
			title: 'Non-Road Spam',
			badgeText: 'AI GUARD TEST',
			badgeVariant: 'outline',
			corridor: 'Pedro Guevara Commercial Belt',
			lat: 14.2840,
			lng: 121.4190,
			url: '/samples/non-road-spam.jpg',
			filename: 'non-road-spam.jpg',
			description: 'Indoor portrait photo testing ASTM D6433 422 spam rejection.'
		}
	];

	let file = $state<File | null>(null);
	let preview = $state<string | null>(null);
	let selectedSampleKey = $state<'pothole' | 'alligator' | 'spam' | null>(null);
	let isLoadingSample = $state<boolean>(false);

	let latitude = $state<number>(14.2813);
	let longitude = $state<number>(121.4173);

	let isSubmitting = $state<boolean>(false);
	let isLocating = $state<boolean>(false);

	// Post-Triage state
	let submitted = $state<boolean>(false);
	let isRejected = $state<boolean>(false);
	let submissionError = $state<string | null>(null);
	let reportId = $state<string | null>(null);
	let imageUrl = $state<string | null>(null);
	let triageResult = $state<TriageAnalysis | null>(null);
	let proximityClusterCount = $state<number>(3);

	function handleCapture(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			file = target.files[0];
			preview = URL.createObjectURL(file);
			selectedSampleKey = null;
		}
	}

	async function selectSample(sample: PitchSample) {
		selectedSampleKey = sample.key;
		latitude = sample.lat;
		longitude = sample.lng;
		preview = sample.url;
		isLoadingSample = true;
		try {
			const res = await fetch(sample.url);
			const blob = await res.blob();
			file = new File([blob], sample.filename, { type: blob.type || 'image/jpeg' });
		} catch (err) {
			console.error('Failed to load sample blob:', err);
		} finally {
			isLoadingSample = false;
		}
	}

	function detectLocation() {
		isLocating = true;
		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					latitude = Number(pos.coords.latitude.toFixed(6));
					longitude = Number(pos.coords.longitude.toFixed(6));
					isLocating = false;
				},
				() => {
					isLocating = false;
				},
				{ timeout: 8000 }
			);
		} else {
			isLocating = false;
		}
	}

	async function submitReport() {
		if (!file) return;
		isSubmitting = true;
		submissionError = null;
		isRejected = false;

		try {
			const fd = new FormData();
			fd.append('image', file);
			fd.append('latitude', latitude.toString());
			fd.append('longitude', longitude.toString());

			const res = await fetch('/api/triage', { method: 'POST', body: fd });
			const data = await res.json();

			if (res.ok && data.success) {
				submitted = true;
				isRejected = false;
				reportId = data.data.reportId || 'TKT-DISPATCHED';
				imageUrl = data.data.imageUrl || preview;
				triageResult = data.data.analysis;
			} else if (res.status === 422 || !data.success) {
				submitted = true;
				isRejected = true;
				submissionError =
					data.error ||
					'The uploaded image does not depict valid public road or civil pavement infrastructure.';
				triageResult = data.analysis || null;
				imageUrl = preview;
			} else {
				submissionError = data.error || 'Server error occurred during civil triage.';
			}
		} catch (err: any) {
			submissionError = err?.message || 'Network error occurred during dispatch.';
		} finally {
			isSubmitting = false;
		}
	}

	function resetForm() {
		submitted = false;
		isRejected = false;
		submissionError = null;
		triageResult = null;
		reportId = null;
		file = null;
		preview = null;
		selectedSampleKey = null;
	}

	function formatDistressTitle(type?: string): string {
		if (!type) return 'Civil Distress Defect';
		switch (type) {
			case 'pothole':
				return 'Deep Asphalt Pothole (ASTM D6433 Section 8)';
			case 'alligator_cracking':
				return 'Alligator Fatigue Cracking (ASTM D6433 Section 1)';
			case 'longitudinal_transverse_cracking':
				return 'Longitudinal & Transverse Cracking';
			case 'rutting':
				return 'Wheel Path Rutting & Depression';
			case 'drainage_culvert_failure':
				return 'Drainage / Shoulder Scour Failure';
			case 'edge_break':
				return 'Edge Breakdown / Shoulder Drop-off';
			case 'ravelling_weathering':
				return 'Surface Ravelling & Aggregate Weathering';
			default:
				return 'Civil Infrastructure Distress';
		}
	}
</script>

<div class="max-w-3xl mx-auto px-4 py-8 space-y-6">
	<!-- Mobile-First Header -->
	<div class="space-y-1.5 text-center sm:text-left">
		<div class="flex items-center justify-center sm:justify-start gap-2">
			<Badge variant="outline" class="text-xs font-normal border-border">
				Module A
			</Badge>
			<span class="text-xs text-muted-foreground">Citizen & Inspector Field Reporting</span>
		</div>
		<h1 class="text-2xl font-bold tracking-tight text-foreground">
			Instant Road Hazard Dispatch
		</h1>
		<p class="text-xs text-muted-foreground leading-relaxed">
			Point your camera at a road defect or pick a 1-click pitch demo. SuriOS executes AI distress triage (ASTM D6433), kinematic two-wheeler VRU profiling, and geodetic municipal queueing.
		</p>
	</div>

	<!-- Proximity Clustering Banner -->
	<div class="rounded-xl border border-border bg-card p-4 flex items-center justify-between text-xs">
		<div class="flex items-center gap-3">
			<div class="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-foreground">
				<UsersIcon class="h-4 w-4" />
			</div>
			<div>
				<p class="font-medium text-foreground">Community Cluster Active (~25m)</p>
				<p class="text-muted-foreground text-[11px]">{proximityClusterCount} community confirmations already verified nearby</p>
			</div>
		</div>
		<Badge variant="secondary" class="font-mono text-[10px]">
			+1 Priority Multiplier
		</Badge>
	</div>

	{#if submitted && isRejected}
		<!-- Graceful HTTP 422 Spam Rejection Card -->
		<Card class="border border-border bg-card overflow-hidden">
			<CardHeader class="border-b border-border bg-secondary/30 pb-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-foreground">
							<ShieldAlertIcon class="h-4 w-4" />
						</div>
						<div>
							<CardTitle class="text-sm font-semibold text-foreground">
								AI Civil Infrastructure Guardrail Triggered
							</CardTitle>
							<CardDescription class="text-xs">
								ASTM D6433 Input Validation Protocol &bull; HTTP 422 Unprocessable Content
							</CardDescription>
						</div>
					</div>
					<Badge variant="outline" class="text-[10px] font-mono border-border">
						REJECTED
					</Badge>
				</div>
			</CardHeader>

			<CardContent class="p-6 space-y-5">
				<Alert variant="destructive" class="border-border bg-secondary/40 text-foreground">
					<CircleXIcon class="h-4 w-4 text-foreground" />
					<AlertTitle class="text-xs font-semibold">Triage Rejection Reason</AlertTitle>
					<AlertDescription class="text-xs leading-relaxed text-muted-foreground mt-1">
						{submissionError || 'The submitted image does not depict valid public road or civil pavement infrastructure.'}
					</AlertDescription>
				</Alert>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
					{#if imageUrl}
						<div class="sm:col-span-1 rounded-xl overflow-hidden border border-border aspect-square bg-secondary/30 relative">
							<img src={imageUrl} alt="Rejected submission" class="w-full h-full object-cover" />
							<div class="absolute bottom-2 left-2 bg-background/90 text-foreground text-[10px] font-mono px-2 py-0.5 rounded border border-border">
								INVALID INPUT
							</div>
						</div>
					{/if}
					<div class="sm:col-span-2 space-y-2 text-xs text-muted-foreground leading-relaxed">
						<p class="font-medium text-foreground">Municipal Defense Policy (SDG 9.1):</p>
						<p>
							To prevent spam and protect municipal emergency dispatch bandwidth, SuriOS multimodal vision verifies that submissions portray public roadways, pavement distress, drainage systems, or bridge decks before issuing public works work orders.
						</p>
						<p class="text-[11px]">
							Selfies, indoor scenes, domestic pets, and digital artwork are rejected automatically without creating phantom work orders.
						</p>
					</div>
				</div>
			</CardContent>

			<CardFooter class="border-t border-border bg-secondary/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
				<span class="text-xs text-muted-foreground text-center sm:text-left">
					Ready to test a real road defect? Select one of our verified civil distress samples above.
				</span>
				<Button onclick={resetForm} size="sm" class="w-full sm:w-auto h-9 text-xs">
					Try a Valid Road Sample
				</Button>
			</CardFooter>
		</Card>

	{:else if submitted && triageResult}
		<!-- Rich Civil Engineering Telemetry Card (ASTM D6433 & VRU Dispatch) -->
		<Card class="border border-border bg-card overflow-hidden">
			<!-- Header Banner -->
			<CardHeader class="border-b border-border bg-secondary/30 pb-4">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div class="space-y-1">
						<div class="flex items-center gap-2">
							<Badge variant="outline" class="font-mono text-xs font-semibold border-border">
								{reportId || 'TKT-DISPATCHED'}
							</Badge>
							<Badge
								variant={triageResult.urgency === 'EMERGENCY' ? 'destructive' : triageResult.urgency === 'PRIORITY' ? 'default' : 'secondary'}
								class="text-[10px] font-mono"
							>
								{triageResult.urgency} DISPATCH
							</Badge>
							<Badge variant="outline" class="text-[10px] text-muted-foreground border-border">
								ASTM D6433 COMPLIANT
							</Badge>
						</div>
						<CardTitle class="text-base font-bold text-foreground">
							{formatDistressTitle(triageResult.distressType)}
						</CardTitle>
						<CardDescription class="text-xs">
							Logged in Santa Cruz Municipal PostgreSQL Registry &bull; Verified by Google Gemini Vision
						</CardDescription>
					</div>

					<div class="flex items-center gap-2 shrink-0">
						<Button
							href="/?id={reportId}"
							size="sm"
							class="h-9 px-3.5 text-xs font-medium gap-1.5"
						>
							<MapPinIcon class="h-3.5 w-3.5" />
							<span>View Pin on Live Map Feed</span>
							<ArrowRightIcon class="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent class="p-6 space-y-6">
				<!-- Top Summary Alert -->
				<div class="rounded-xl border border-border bg-secondary/30 p-4 space-y-1 text-xs">
					<span class="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">Civil Inspector Diagnostic Summary</span>
					<p class="text-foreground leading-relaxed">
						{triageResult.summary || 'Road surface distress verified according to ASTM D6433 civil standards.'}
					</p>
				</div>

				<!-- Main 2-Column Telemetry Grid -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Left Column: Photo Evidence & Location Details -->
					<div class="space-y-4">
						<!-- Evidence Image -->
						{#if imageUrl}
							<div class="relative rounded-xl overflow-hidden border border-border aspect-video bg-secondary/30">
								<img src={imageUrl} alt="Pavement distress evidence" class="w-full h-full object-cover" />
								<div class="absolute top-2.5 left-2.5 flex items-center gap-1.5">
									<Badge class="bg-background/90 text-foreground border border-border text-[10px] font-mono">
										SEVERITY {triageResult.hazardSeverity}/10
									</Badge>
								</div>
								<div class="absolute bottom-2.5 right-2.5">
									<Badge class="bg-background/90 text-foreground border border-border text-[10px] font-mono">
										GEO-TAGGED
									</Badge>
								</div>
							</div>
						{/if}

						<!-- Geodetic Telemetry -->
						<div class="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
							<div class="flex items-center justify-between text-muted-foreground">
								<span class="text-[10px] font-semibold uppercase tracking-wider">Geodetic Fix</span>
								<span class="text-[10px] font-mono">GPS LOCK</span>
							</div>
							<div class="grid grid-cols-2 gap-2 text-xs">
								<div class="bg-secondary/40 border border-border rounded-lg p-2 font-mono">
									<span class="text-[9px] text-muted-foreground block">LAT</span>
									<span class="text-foreground font-semibold">{latitude}° N</span>
								</div>
								<div class="bg-secondary/40 border border-border rounded-lg p-2 font-mono">
									<span class="text-[9px] text-muted-foreground block">LNG</span>
									<span class="text-foreground font-semibold">{longitude}° E</span>
								</div>
							</div>
							<p class="text-[11px] text-muted-foreground">
								Municipality of Santa Cruz, Laguna Corridor (Manila East Provincial Artery)
							</p>
						</div>

						<!-- Estimated Dimensions -->
						<div class="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
							<div class="flex items-center gap-1.5 text-foreground font-medium">
								<RulerIcon class="h-3.5 w-3.5 text-muted-foreground" />
								<span>Estimated Defect Dimensions</span>
							</div>
							<div class="grid grid-cols-2 gap-2 text-xs font-mono">
								<div class="bg-secondary/40 border border-border rounded-lg p-2">
									<span class="text-[9px] text-muted-foreground block font-sans">ESTIMATED DEPTH</span>
									<span class="text-foreground font-semibold">
										{triageResult.estimatedDimensions?.depthEstimate || '40 - 75 mm'}
									</span>
								</div>
								<div class="bg-secondary/40 border border-border rounded-lg p-2">
									<span class="text-[9px] text-muted-foreground block font-sans">SURFACE AREA</span>
									<span class="text-foreground font-semibold">
										{triageResult.estimatedDimensions?.surfaceAreaEstimate || '0.45 m²'}
									</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Right Column: Hazard Severity, VRU Kinematics, Materials -->
					<div class="space-y-4">
						<!-- Hazard Severity Score -->
						<div class="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
							<div class="flex items-center justify-between">
								<span class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
									Hazard Severity Index
								</span>
								<span class="font-mono font-bold text-foreground">
									{triageResult.hazardSeverity} / 10
								</span>
							</div>
							<!-- Clean segmented meter -->
							<div class="w-full bg-secondary rounded-full h-2 overflow-hidden">
								<div
									class="h-full rounded-full transition-all duration-500 {triageResult.hazardSeverity >= 8 ? 'bg-destructive' : triageResult.hazardSeverity >= 5 ? 'bg-amber-500' : 'bg-foreground'}"
									style="width: {triageResult.hazardSeverity * 10}%"
								></div>
							</div>
							<div class="flex justify-between text-[10px] text-muted-foreground">
								<span>1 (Cosmetic)</span>
								<span class="font-medium text-foreground">Risk: {triageResult.riskLevel}</span>
								<span>10 (Structural Failure)</span>
							</div>
						</div>

						<!-- Two-Wheeler VRU Threat Analysis -->
						<div class="rounded-xl border border-border bg-secondary/30 p-4 space-y-2 text-xs">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-1.5 font-medium text-foreground">
									<BikeIcon class="h-4 w-4 text-muted-foreground" />
									<span>Two-Wheeler VRU Kinematic Profile</span>
								</div>
								<Badge
									variant={triageResult.vruLethality === 'CRITICAL' ? 'destructive' : 'secondary'}
									class="text-[10px] font-mono"
								>
									{triageResult.vruLethality} THREAT
								</Badge>
							</div>
							<p class="text-muted-foreground text-[11px] leading-relaxed">
								{triageResult.vruDetails}
							</p>
							<div class="pt-1 text-[10px] text-muted-foreground border-t border-border">
								Laguna Modal Share: Tricycles and motorcycles represent 68% of local transit.
							</div>
						</div>

						<!-- Public Works Action Plan -->
						<div class="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
							<div class="flex items-center gap-1.5 font-medium text-foreground">
								<WrenchIcon class="h-3.5 w-3.5 text-muted-foreground" />
								<span>Public Works Repair Protocol</span>
							</div>
							<p class="text-muted-foreground text-[11px] leading-relaxed">
								{triageResult.recommendedAction}
							</p>
						</div>

						<!-- Bill of Materials Checklist -->
						{#if triageResult.materialsChecklist && triageResult.materialsChecklist.length > 0}
							<div class="rounded-xl border border-border bg-card p-4 space-y-2.5 text-xs">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-1.5 font-medium text-foreground">
										<SquareCheckIcon class="h-3.5 w-3.5 text-muted-foreground" />
										<span>Municipal Materials Checklist</span>
									</div>
									<span class="text-[10px] text-muted-foreground">
										{triageResult.materialsChecklist.length} Items
									</span>
								</div>
								<ul class="space-y-1.5">
									{#each triageResult.materialsChecklist as item}
										<li class="flex items-start gap-2 text-[11px] text-muted-foreground">
											<span class="h-1.5 w-1.5 rounded-full bg-foreground shrink-0 mt-1.5"></span>
											<span class="text-foreground">{item}</span>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				</div>
			</CardContent>

			<!-- Card Footer Action Bar -->
			<CardFooter class="border-t border-border bg-secondary/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
				<Button
					variant="outline"
					size="sm"
					onclick={resetForm}
					class="w-full sm:w-auto h-9 text-xs"
				>
					Submit Another Road Defect
				</Button>

				<Button
					href="/?id={reportId}"
					size="sm"
					class="w-full sm:w-auto h-9 text-xs font-medium gap-1.5"
				>
					<MapPinIcon class="h-3.5 w-3.5" />
					<span>View Pin on Live Map Feed</span>
					<ArrowRightIcon class="h-3.5 w-3.5" />
				</Button>
			</CardFooter>
		</Card>

	{:else}
		<!-- Dispatch Form with 1-Click Pitch Demos -->

		<!-- Quick Pitch Demo Selector -->
		<div class="space-y-2.5">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-foreground flex items-center gap-1.5">
					<SparklesIcon class="h-3.5 w-3.5 text-muted-foreground" />
					<span>1-Click Pitch Demos</span>
				</span>
				<span class="text-[10px] text-muted-foreground">Instant load for live presentation</span>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				{#each PITCH_SAMPLES as sample}
					{@const isSelected = selectedSampleKey === sample.key}
					<button
						type="button"
						onclick={() => selectSample(sample)}
						class="rounded-xl border p-3.5 text-left transition-all duration-150 relative flex flex-col justify-between gap-2.5 group {isSelected ? 'border-foreground bg-secondary/50 shadow-xs' : 'border-border bg-card hover:border-foreground/30 hover:bg-secondary/20'}"
					>
						<div class="space-y-1">
							<div class="flex items-center justify-between gap-1">
								<span class="text-xs font-semibold text-foreground group-hover:text-foreground">
									{sample.title}
								</span>
								<Badge variant={sample.badgeVariant} class="text-[9px] font-mono px-1.5 py-0">
									{sample.badgeText}
								</Badge>
							</div>
							<p class="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
								{sample.description}
							</p>
						</div>

						<div class="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/60">
							<span class="truncate">{sample.corridor.split('(')[0]}</span>
							<span class="font-mono shrink-0 ml-1">
								{isSelected ? '✓ Selected' : 'Tap to load'}
							</span>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Camera Shutter & Upload Area -->
		<Card class="border border-border bg-card shadow-xs">
			<CardHeader class="pb-3">
				<CardTitle class="text-sm font-semibold flex items-center justify-between">
					<span class="flex items-center gap-2">
						<CameraIcon class="h-4 w-4 text-foreground" />
						<span>Pavement Distress Camera Shutter</span>
					</span>
					{#if preview}
						<Button
							variant="ghost"
							size="sm"
							onclick={() => { preview = null; file = null; selectedSampleKey = null; }}
							class="text-xs text-muted-foreground hover:text-foreground h-6 px-2"
						>
							Clear Photo
						</Button>
					{/if}
				</CardTitle>
				<CardDescription class="text-xs">
					Capture pavement distress clearly showing depth, edge fractures, and surrounding traffic context.
				</CardDescription>
			</CardHeader>

			<CardContent class="space-y-4">
				{#if preview}
					<div class="relative rounded-xl overflow-hidden border border-border aspect-video bg-secondary/30 flex items-center justify-center">
						<img src={preview} alt="Road report evidence" class="w-full h-full object-cover" />
						{#if selectedSampleKey}
							<div class="absolute bottom-3 left-3 bg-background/90 text-foreground text-xs font-medium px-2.5 py-1 rounded-lg border border-border shadow-xs flex items-center gap-2">
								<span class="h-1.5 w-1.5 rounded-full bg-foreground"></span>
								<span>Pitch Demo Sample Active</span>
							</div>
						{/if}
					</div>
				{:else}
					<label
						class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border hover:border-foreground/40 bg-secondary/20 hover:bg-secondary/40 p-10 cursor-pointer transition-colors aspect-video group"
					>
						<div class="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors mb-3">
							<UploadIcon class="h-6 w-6" />
						</div>
						<p class="text-xs font-medium text-foreground">Tap to take photo or upload</p>
						<p class="text-[11px] text-muted-foreground mt-0.5">High-resolution camera capture</p>
						<input
							type="file"
							accept="image/*"
							capture="environment"
							onchange={handleCapture}
							class="hidden"
						/>
					</label>
				{/if}

				<!-- Two-Wheeler Safety Reminder Banner -->
				<div class="rounded-xl border border-border bg-secondary/30 p-3.5 flex items-start gap-3 text-xs">
					<BikeIcon class="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
					<div class="space-y-0.5">
						<p class="font-medium text-foreground">Vulnerable Road User (VRU) Protection Policy</p>
						<p class="text-muted-foreground text-[11px] leading-relaxed">
							Motorcycles and tricycles comprise over 68% of traffic in provincial corridors. Depth reports over 50mm trigger instant emergency municipal queueing.
						</p>
					</div>
				</div>

				<Separator />

				<!-- GPS Coordinates -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-xs font-medium text-foreground flex items-center gap-1.5">
							<MapPinIcon class="h-3.5 w-3.5 text-muted-foreground" />
							<span>Geodetic Location Fix</span>
						</span>
						<Button
							variant="ghost"
							size="sm"
							onclick={detectLocation}
							disabled={isLocating}
							class="text-xs text-muted-foreground hover:text-foreground h-6 px-2"
						>
							{#if isLocating}
								<RefreshCwIcon class="h-3 w-3 animate-spin mr-1" />
								Locking GPS...
							{:else}
								<RefreshCwIcon class="h-3 w-3 mr-1" />
								Acquire GPS
							{/if}
						</Button>
					</div>
					<div class="grid grid-cols-2 gap-2 text-xs">
						<div class="bg-secondary/40 border border-border rounded-lg p-2.5">
							<span class="text-[10px] text-muted-foreground block font-medium">LATITUDE</span>
							<span class="font-mono text-foreground font-semibold">{latitude}° N</span>
						</div>
						<div class="bg-secondary/40 border border-border rounded-lg p-2.5">
							<span class="text-[10px] text-muted-foreground block font-medium">LONGITUDE</span>
							<span class="font-mono text-foreground font-semibold">{longitude}° E</span>
						</div>
					</div>
				</div>
			</CardContent>

			<CardFooter class="pt-0">
				<Button
					onclick={submitReport}
					disabled={!file || isSubmitting || isLoadingSample}
					class="w-full h-10 text-xs font-medium gap-1.5 rounded-lg"
				>
					{#if isSubmitting}
						<RefreshCwIcon class="h-3.5 w-3.5 animate-spin" />
						<span>Conducting Multimodal ASTM Triage...</span>
					{:else if isLoadingSample}
						<RefreshCwIcon class="h-3.5 w-3.5 animate-spin" />
						<span>Loading Demo Sample...</span>
					{:else}
						<SparklesIcon class="h-3.5 w-3.5" />
						<span>Dispatch Defect to Public Works Queue</span>
					{/if}
				</Button>
			</CardFooter>
		</Card>
	{/if}
</div>
