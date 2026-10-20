<script lang="ts">
	import CameraIcon from '@lucide/svelte/icons/camera';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import Loader2Icon from '@lucide/svelte/icons/loader';
	import BikeIcon from '@lucide/svelte/icons/bike';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';

	// Official shadcn-svelte components
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	import type { TriageApiResponse, TriageAnalysis } from '$lib/types/triage.js';

	// Svelte 5 Runes Reactive State
	let selectedFile = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);
	let latitude = $state<number>(14.2813);
	let longitude = $state<number>(121.4173);
	let locationStatus = $state<string>('Default: Santa Cruz, Laguna');
	let isLocating = $state<boolean>(false);
	let isAnalyzing = $state<boolean>(false);
	let result = $state<TriageApiResponse['data'] | null>(null);
	let errorMessage = $state<string | null>(null);
	let rejectionAnalysis = $state<TriageAnalysis | null>(null);

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			selectedFile = file;
			previewUrl = URL.createObjectURL(file);
			errorMessage = null;
			rejectionAnalysis = null;
			result = null;
		}
	}

	function detectLocation() {
		if (!('geolocation' in navigator)) {
			locationStatus = 'Geolocation is not supported by your browser.';
			return;
		}

		isLocating = true;
		locationStatus = 'Acquiring GPS coordinates...';

		navigator.geolocation.getCurrentPosition(
			(position) => {
				latitude = Number(position.coords.latitude.toFixed(6));
				longitude = Number(position.coords.longitude.toFixed(6));
				locationStatus = `GPS Locked: ${latitude}° N, ${longitude}° E (±${Math.round(position.coords.accuracy)}m)`;
				isLocating = false;
			},
			(error) => {
				console.warn('Geolocation warning:', error.message);
				locationStatus = `Using fallback anchor (Santa Cruz, Laguna): ${latitude}° N, ${longitude}° E`;
				isLocating = false;
			},
			{ enableHighAccuracy: true, timeout: 8000 }
		);
	}

	async function analyzeImage() {
		if (!selectedFile) {
			errorMessage = 'Please select or capture a road photo first.';
			return;
		}

		isAnalyzing = true;
		errorMessage = null;
		rejectionAnalysis = null;
		result = null;

		try {
			const formData = new FormData();
			formData.append('image', selectedFile);
			formData.append('latitude', latitude.toString());
			formData.append('longitude', longitude.toString());

			const response = await fetch('/api/triage', {
				method: 'POST',
				body: formData
			});

			const jsonResponse: TriageApiResponse = await response.json();

			if (!response.ok || !jsonResponse.success) {
				errorMessage = jsonResponse.error || 'Failed to inspect image.';
				if (response.status === 422 && (jsonResponse as any).analysis) {
					rejectionAnalysis = (jsonResponse as any).analysis;
				}
				return;
			}

			result = jsonResponse.data;
		} catch (err: any) {
			errorMessage = err?.message || 'Network error occurred while calling the triage engine.';
		} finally {
			isAnalyzing = false;
		}
	}

	function resetForm() {
		selectedFile = null;
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
		result = null;
		errorMessage = null;
		rejectionAnalysis = null;
	}
</script>

<main class="min-h-screen bg-background text-foreground antialiased">
	<!-- Top Navigation Bar -->
	<header class="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
		<div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg">
					S
				</div>
				<div>
					<div class="flex items-center gap-2">
						<span class="font-bold text-lg tracking-tight text-foreground">SuriOS</span>
						<Badge variant="outline" class="border-primary/40 text-primary bg-primary/5 text-[10px]">
							SDG 9 Platform
						</Badge>
					</div>
					<p class="text-[11px] text-muted-foreground">Autonomous Civil Infrastructure Triage & Dispatch</p>
				</div>
			</div>

			<div class="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
				<span class="flex items-center gap-1.5">
					<span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
					Gemini 3.5 Flash Active
				</span>
				<Separator orientation="vertical" class="h-4" />
				<span class="font-mono text-[11px]">LSPU Santa Cruz Anchor</span>
			</div>
		</div>
	</header>

	<div class="max-w-5xl mx-auto px-4 py-8">
		<!-- Hero Section -->
		<div class="mb-8 text-center sm:text-left">
			<h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-foreground">
				Automated Road Defect Triage
			</h1>
			<p class="text-sm sm:text-base text-muted-foreground max-w-2xl">
				Upload or photograph road hazards (potholes, cracks, rutting). Our multimodal vision engine classifies the distress (ASTM D6433), estimates Two-Wheeler Lethality, and generates municipal repair tickets.
			</p>
		</div>

		<!-- Interactive Diagnostic Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
			<!-- Left Column: Input & Capture -->
			<div class="lg:col-span-5 space-y-5">
				<Card class="border-border bg-card shadow-sm">
					<CardHeader class="pb-3 flex flex-row items-center justify-between">
						<div>
							<CardTitle class="text-sm font-semibold flex items-center gap-2">
								<CameraIcon class="w-4 h-4 text-primary" />
								1. Capture or Select Image
							</CardTitle>
							<CardDescription class="text-xs mt-0.5">
								Provide real-time road surface evidence
							</CardDescription>
						</div>
						{#if previewUrl}
							<Button
								variant="ghost"
								size="sm"
								onclick={resetForm}
								class="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
							>
								Clear
							</Button>
						{/if}
					</CardHeader>

					<CardContent class="space-y-4">
						{#if previewUrl}
							<div class="relative rounded-lg overflow-hidden border border-border bg-background aspect-video flex items-center justify-center">
								<img src={previewUrl} alt="Road hazard preview" class="w-full h-full object-cover" />
							</div>
						{:else}
							<label
								class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-background/50 p-8 cursor-pointer transition group aspect-video"
							>
								<div class="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition mb-3">
									<UploadIcon class="w-6 h-6" />
								</div>
								<p class="text-xs font-medium text-foreground">Click to upload or take a photo</p>
								<p class="text-[11px] text-muted-foreground mt-1">JPEG, PNG, WebP up to 10MB</p>
								<input
									type="file"
									accept="image/*"
									capture="environment"
									onchange={handleFileChange}
									class="hidden"
								/>
							</label>
						{/if}

						<Separator class="my-3" />

						<!-- GPS Coordinates -->
						<div>
							<div class="flex items-center justify-between mb-2">
								<label class="text-xs font-semibold text-foreground flex items-center gap-1.5">
									<MapPinIcon class="w-3.5 h-3.5 text-sky-400" />
									2. Geolocation Coordinates
								</label>
								<Button
									variant="ghost"
									size="sm"
									onclick={detectLocation}
									disabled={isLocating}
									class="text-[11px] font-medium text-sky-400 hover:text-sky-300 h-6 px-2"
								>
									{#if isLocating}
										<Loader2Icon class="w-3 h-3 animate-spin mr-1" />
										Locating...
									{:else}
										<RefreshCwIcon class="w-3 h-3 mr-1" />
										Detect GPS
									{/if}
								</Button>
							</div>

							<div class="grid grid-cols-2 gap-2 text-xs">
								<div class="bg-background border border-border rounded-lg px-2.5 py-1.5">
									<span class="text-muted-foreground text-[10px] block font-medium">LATITUDE</span>
									<span class="font-mono text-foreground font-semibold">{latitude}° N</span>
								</div>
								<div class="bg-background border border-border rounded-lg px-2.5 py-1.5">
									<span class="text-muted-foreground text-[10px] block font-medium">LONGITUDE</span>
									<span class="font-mono text-foreground font-semibold">{longitude}° E</span>
								</div>
							</div>
							<p class="text-[11px] text-muted-foreground mt-1.5 truncate font-mono">{locationStatus}</p>
						</div>
					</CardContent>

					<CardFooter class="pt-0">
						<Button
							type="button"
							onclick={analyzeImage}
							disabled={!selectedFile || isAnalyzing}
							class="w-full font-semibold text-xs tracking-wider uppercase h-10 gap-2 shadow-md"
						>
							{#if isAnalyzing}
								<Loader2Icon class="w-4 h-4 animate-spin" />
								<span>Inspecting via Gemini...</span>
							{:else}
								<SparklesIcon class="w-4 h-4" />
								<span>Run AI Civil Triage</span>
							{/if}
						</Button>
					</CardFooter>
				</Card>
			</div>

			<!-- Right Column: Results & Triage Payload -->
			<div class="lg:col-span-7">
				{#if isAnalyzing}
					<Card class="border-border bg-card/60 p-10 text-center flex flex-col items-center justify-center min-h-[380px]">
						<div class="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-4"></div>
						<h3 class="text-sm font-semibold text-foreground mb-1">Processing Road Multimodal Vision</h3>
						<p class="text-xs text-muted-foreground max-w-sm">
							Extracting ASTM D6433 defect distress types, calculating Two-Wheeler Lethality Index, and formulating crew materials...
						</p>
					</Card>
				{:else if errorMessage}
					<Alert variant="destructive" class="min-h-[380px] flex flex-col justify-center p-6">
						<AlertTriangleIcon class="w-5 h-5" />
						<AlertTitle class="text-sm font-bold">Triage Rejection / Validation Warning</AlertTitle>
						<AlertDescription class="text-xs mt-2 space-y-3">
							<p>{errorMessage}</p>
							{#if rejectionAnalysis}
								<div class="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs">
									<p class="font-semibold">Spam / Non-Infrastructure Filter Activated:</p>
									<p class="mt-1 opacity-90">{rejectionAnalysis.rejectionReason}</p>
								</div>
							{/if}
						</AlertDescription>
					</Alert>
				{:else if result}
					<Card class="border-border bg-card shadow-sm space-y-4 p-6">
						<!-- Top Status Bar -->
						<div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
							<div class="flex items-center gap-2">
								<CheckCircleIcon class="w-4 h-4 text-primary" />
								<span class="text-xs font-semibold uppercase tracking-wider text-primary">
									Ticket Created & Saved
								</span>
								{#if result.reportId}
									<Badge variant="secondary" class="font-mono text-[10px]">
										#{result.reportId.slice(0, 8)}
									</Badge>
								{/if}
							</div>

							<div class="flex items-center gap-2 text-xs">
								<span class="text-muted-foreground">Urgency:</span>
								<Badge variant="outline" class="font-semibold font-mono">
									{result.analysis.urgency}
								</Badge>
							</div>
						</div>

						<!-- Two-Wheeler Lethality Alert (The Differentiator) -->
						<div class="rounded-lg border p-4 flex items-start gap-3.5 {
							result.analysis.vruLethality === 'CRITICAL' || result.analysis.vruLethality === 'HIGH'
								? 'bg-destructive/15 border-destructive/40 text-destructive-foreground'
								: result.analysis.vruLethality === 'MODERATE'
									? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
									: 'bg-primary/15 border-primary/40 text-primary-foreground'
						}">
							<BikeIcon class="w-5 h-5 shrink-0 mt-0.5 text-current" />
							<div class="space-y-1">
								<div class="flex items-center gap-2">
									<h4 class="text-xs font-bold uppercase tracking-wider">
										Two-Wheeler Lethality: {result.analysis.vruLethality} RISK
									</h4>
									<Badge variant="outline" class="text-[9px] uppercase border-current/30 font-mono">
										VRU Profile
									</Badge>
								</div>
								<p class="text-xs opacity-90 leading-relaxed">
									{result.analysis.vruDetails}
								</p>
							</div>
						</div>

						<!-- Key Metrics Grid -->
						<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
							<!-- Severity Index -->
							<div class="rounded-lg bg-background border border-border p-3">
								<span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
									Hazard Severity
								</span>
								<div class="flex items-baseline gap-1.5">
									<span class="text-2xl font-black text-foreground">{result.analysis.hazardSeverity}</span>
									<span class="text-xs text-muted-foreground">/ 10</span>
								</div>
								<Badge
									variant={result.analysis.riskLevel === 'CRITICAL' ? 'destructive' : 'secondary'}
									class="mt-1 text-[10px]"
								>
									{result.analysis.riskLevel} TIER
								</Badge>
							</div>

							<!-- Distress Type -->
							<div class="rounded-lg bg-background border border-border p-3">
								<span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
									Distress Type
								</span>
								<span class="text-sm font-bold text-foreground capitalize block truncate">
									{result.analysis.distressType.replace(/_/g, ' ')}
								</span>
								<span class="text-[10px] text-muted-foreground block font-mono mt-1">ASTM D6433</span>
							</div>

							<!-- Dimensions -->
							<div class="rounded-lg bg-background border border-border p-3 col-span-2 sm:col-span-1">
								<span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
									Est. Dimensions
								</span>
								<span class="text-xs font-mono text-foreground block truncate">
									D: {result.analysis.estimatedDimensions.depthEstimate}
								</span>
								<span class="text-[10px] text-muted-foreground block truncate font-mono mt-1">
									A: {result.analysis.estimatedDimensions.surfaceAreaEstimate}
								</span>
							</div>
						</div>

						<!-- Engineering Summary -->
						<div class="p-3.5 rounded-lg bg-background border border-border">
							<span class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
								Engineering Assessment Summary
							</span>
							<p class="text-xs text-foreground/90 leading-relaxed">
								{result.analysis.summary}
							</p>
						</div>

						<!-- Recommended Action & Materials -->
						<div class="p-3.5 rounded-lg bg-background border border-border space-y-2">
							<div class="flex items-center gap-1.5 text-primary text-xs font-bold">
								<WrenchIcon class="w-3.5 h-3.5" />
								<span>Public Works Dispatch Specification:</span>
							</div>
							<p class="text-xs text-foreground font-medium">
								{result.analysis.recommendedAction}
							</p>

							{#if result.analysis.materialsChecklist && result.analysis.materialsChecklist.length > 0}
								<div class="pt-2">
									<Separator class="my-2" />
									<span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
										Crew Equipment & Materials Checklist:
									</span>
									<ul class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-foreground/80">
										{#each result.analysis.materialsChecklist as item}
											<li class="flex items-center gap-2">
												<span class="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
												<span>{item}</span>
											</li>
										{/each}
									</ul>
								</div>
							{/if}
						</div>
					</Card>
				{:else}
					<!-- Empty State Placeholder -->
					<Card class="border-border border-dashed bg-card/30 p-10 text-center flex flex-col items-center justify-center min-h-[380px]">
						<ShieldAlertIcon class="w-10 h-10 text-muted-foreground/40 mb-3" />
						<h3 class="text-sm font-semibold text-foreground mb-1">AI Triage Results Standby</h3>
						<p class="text-xs text-muted-foreground max-w-sm">
							Select or capture an image on the left and click "Run AI Civil Triage" to execute multimodal road distress classification.
						</p>
					</Card>
				{/if}
			</div>
		</div>
	</div>
</main>
