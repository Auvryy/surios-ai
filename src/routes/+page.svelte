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
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import ActivityIcon from '@lucide/svelte/icons/activity';

	// Official shadcn-svelte components
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs/index.js';
	import {
		Sheet,
		SheetTrigger,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetDescription,
		SheetFooter
	} from '$lib/components/ui/sheet/index.js';

	import type { TriageApiResponse, TriageAnalysis } from '$lib/types/triage.js';

	// Svelte 5 Runes Reactive State
	let selectedFile = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);
	let latitude = $state<number>(14.2813);
	let longitude = $state<number>(121.4173);
	let locationStatus = $state<string>('Anchor: Santa Cruz, Laguna');
	let isLocating = $state<boolean>(false);
	let isAnalyzing = $state<boolean>(false);
	let result = $state<TriageApiResponse['data'] | null>(null);
	let errorMessage = $state<string | null>(null);
	let rejectionAnalysis = $state<TriageAnalysis | null>(null);
	let activeTab = $state<string>('overview');
	let isSheetOpen = $state<boolean>(false);

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
				locationStatus = `Fallback anchor (Santa Cruz, Laguna): ${latitude}° N, ${longitude}° E`;
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

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
	<!-- Hero Section with Metric Pills -->
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
		<div class="space-y-2 max-w-2xl">
			<div class="flex items-center gap-2">
				<Badge variant="outline" class="font-normal text-xs px-2.5 py-0.5 rounded-full border-border">
					SDG 9 Civil Infrastructure
				</Badge>
				<span class="text-xs text-muted-foreground flex items-center gap-1.5">
					<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
					LSPU Santa Cruz Corridor
				</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
				Automated Road Defect Triage
			</h1>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Upload or photograph roadway distress. Gemini multimodal vision classifies defects via ASTM D6433 standards, scores Two-Wheeler Lethality, and generates municipal work orders.
			</p>
		</div>

		<!-- Mini Status Indicators (Matching shadcn metrics aesthetic) -->
		<div class="flex flex-wrap items-center gap-2 text-xs">
			<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card">
				<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
				<span class="font-medium text-foreground">Gemini 3.5 Flash</span>
				<span class="text-muted-foreground">Active</span>
			</div>
			<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card">
				<ActivityIcon class="h-3.5 w-3.5 text-muted-foreground" />
				<span class="font-medium text-foreground">ASTM D6433</span>
				<span class="text-muted-foreground">Compliant</span>
			</div>
		</div>
	</div>

	<!-- Interactive Diagnostic Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="capture">
		<!-- Left Column: Image Capture & GPS Form -->
		<div class="lg:col-span-5 space-y-5">
			<Card class="border border-border bg-card shadow-xs">
				<CardHeader class="pb-3 flex flex-row items-center justify-between">
					<div class="space-y-0.5">
						<CardTitle class="text-sm font-semibold flex items-center gap-2">
							<CameraIcon class="h-4 w-4 text-foreground" />
							<span>1. Evidence Capture</span>
						</CardTitle>
						<CardDescription class="text-xs">
							Photograph asphalt defect or pavement distress
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
						<div class="relative rounded-xl overflow-hidden border border-border bg-secondary/30 aspect-video flex items-center justify-center">
							<img src={previewUrl} alt="Road hazard preview" class="w-full h-full object-cover" />
						</div>
					{:else}
						<label
							class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border hover:border-foreground/40 bg-secondary/20 hover:bg-secondary/40 p-8 cursor-pointer transition-colors aspect-video group"
						>
							<div class="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors mb-2.5">
								<UploadIcon class="h-5 w-5" />
							</div>
							<p class="text-xs font-medium text-foreground">Upload or take a photo</p>
							<p class="text-[11px] text-muted-foreground mt-0.5">JPEG, PNG, WebP up to 10MB</p>
							<input
								type="file"
								accept="image/*"
								capture="environment"
								onchange={handleFileChange}
								class="hidden"
							/>
						</label>
					{/if}

					<Separator class="my-2" />

					<!-- Geolocation Block -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<label class="text-xs font-medium text-foreground flex items-center gap-1.5">
								<MapPinIcon class="h-3.5 w-3.5 text-muted-foreground" />
								<span>2. Coordinates & Anchor</span>
							</label>
							<Button
								variant="ghost"
								size="sm"
								onclick={detectLocation}
								disabled={isLocating}
								class="text-xs text-muted-foreground hover:text-foreground h-6 px-2"
							>
								{#if isLocating}
									<Loader2Icon class="h-3 w-3 animate-spin mr-1" />
									Acquiring...
								{:else}
									<RefreshCwIcon class="h-3 w-3 mr-1" />
									Detect GPS
								{/if}
							</Button>
						</div>

						<div class="grid grid-cols-2 gap-2 text-xs">
							<div class="bg-secondary/40 border border-border rounded-lg p-2.5 space-y-0.5">
								<span class="text-muted-foreground text-[10px] font-medium block">LATITUDE</span>
								<span class="font-mono text-foreground font-semibold text-xs">{latitude}° N</span>
							</div>
							<div class="bg-secondary/40 border border-border rounded-lg p-2.5 space-y-0.5">
								<span class="text-muted-foreground text-[10px] font-medium block">LONGITUDE</span>
								<span class="font-mono text-foreground font-semibold text-xs">{longitude}° E</span>
							</div>
						</div>
						<p class="text-[11px] text-muted-foreground truncate">{locationStatus}</p>
					</div>
				</CardContent>

				<CardFooter class="pt-0">
					<Button
						type="button"
						onclick={analyzeImage}
						disabled={!selectedFile || isAnalyzing}
						class="w-full h-9 font-medium text-xs gap-1.5 rounded-lg"
					>
						{#if isAnalyzing}
							<Loader2Icon class="h-3.5 w-3.5 animate-spin" />
							<span>Classifying via Gemini Vision...</span>
						{:else}
							<SparklesIcon class="h-3.5 w-3.5" />
							<span>Run AI Civil Triage</span>
						{/if}
					</Button>
				</CardFooter>
			</Card>
		</div>

		<!-- Right Column: Results & Triage Payload -->
		<div class="lg:col-span-7">
			{#if isAnalyzing}
				<!-- Clean, Flat Loading State (No AI slop gradients) -->
				<Card class="border border-border bg-card p-12 text-center flex flex-col items-center justify-center min-h-[420px] shadow-xs">
					<div class="h-10 w-10 rounded-full border-2 border-border border-t-foreground animate-spin mb-4"></div>
					<h3 class="text-sm font-semibold text-foreground mb-1">Evaluating Road Pavement Distress</h3>
					<p class="text-xs text-muted-foreground max-w-sm leading-relaxed">
						Extracting ASTM D6433 standard metrics, calculating Two-Wheeler Lethality Index, and generating maintenance bill of materials...
					</p>
				</Card>
			{:else if errorMessage}
				<!-- Clean Alert Error State -->
				<Alert variant="destructive" class="min-h-[420px] flex flex-col justify-center p-8 bg-card border-destructive/40">
					<AlertTriangleIcon class="h-5 w-5 text-destructive" />
					<AlertTitle class="text-sm font-semibold mt-2">Validation Notice / Triage Filter</AlertTitle>
					<AlertDescription class="text-xs mt-2 space-y-3 leading-relaxed">
						<p class="text-muted-foreground">{errorMessage}</p>
						{#if rejectionAnalysis}
							<div class="mt-4 p-3 rounded-lg bg-secondary border border-border text-xs text-foreground space-y-1">
								<p class="font-medium">Filter Rejection Telemetry:</p>
								<p class="text-muted-foreground">{rejectionAnalysis.rejectionReason}</p>
							</div>
						{/if}
					</AlertDescription>
				</Alert>
			{:else if result}
				<!-- Complete shadcn Triage Result Card -->
				<Card class="border border-border bg-card shadow-xs space-y-5 p-6">
					<!-- Header Bar: Ticket Metadata -->
					<div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
						<div class="flex items-center gap-2">
							<CheckCircleIcon class="h-4 w-4 text-emerald-500" />
							<span class="text-xs font-semibold text-foreground">
								Defect Categorized
							</span>
							{#if result.reportId}
								<Badge variant="secondary" class="font-mono text-[10px] px-1.5 h-5">
									#{result.reportId.slice(0, 8)}
								</Badge>
							{/if}
						</div>

						<div class="flex items-center gap-2">
							<Badge variant="outline" class="text-xs font-medium border-border">
								Urgency: {result.analysis.urgency}
							</Badge>
							<Badge variant="secondary" class="text-xs font-medium">
								ASTM Compliant
							</Badge>
						</div>
					</div>

					<!-- Two-Wheeler Lethality Alert (Clean, Flat, High-Contrast) -->
					<div class="rounded-xl border p-4 flex items-start gap-3.5 {
						result.analysis.vruLethality === 'CRITICAL' || result.analysis.vruLethality === 'HIGH'
							? 'bg-destructive/10 border-destructive/30 text-destructive'
							: result.analysis.vruLethality === 'MODERATE'
								? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
								: 'bg-secondary border-border text-foreground'
					}">
						<BikeIcon class="h-5 w-5 shrink-0 mt-0.5 text-current" />
						<div class="space-y-1 text-xs">
							<div class="flex items-center gap-2">
								<h4 class="font-bold tracking-wide uppercase">
									Two-Wheeler Lethality: {result.analysis.vruLethality} RISK
								</h4>
								<span class="text-[10px] px-1.5 py-0.5 rounded border border-current/20 font-mono">
									VRU Index
								</span>
							</div>
							<p class="opacity-90 leading-relaxed text-foreground">
								{result.analysis.vruDetails}
							</p>
						</div>
					</div>

					<!-- Segmented shadcn Tabs for Structured Deep Dive -->
					<Tabs value="overview" class="w-full">
						<TabsList class="grid w-full grid-cols-3 h-9 bg-secondary/50 p-1 rounded-lg">
							<TabsTrigger value="overview" class="text-xs font-medium">
								Overview
							</TabsTrigger>
							<TabsTrigger value="astm" class="text-xs font-medium">
								ASTM Telemetry
							</TabsTrigger>
							<TabsTrigger value="dispatch" class="text-xs font-medium">
								Materials & Dispatch
							</TabsTrigger>
						</TabsList>

						<!-- Tab 1: Overview -->
						<TabsContent value="overview" class="space-y-4 pt-3">
							<!-- Key Metric Cards (Matching reference screenshot style) -->
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
								<div class="rounded-xl bg-secondary/30 border border-border p-3.5 space-y-1">
									<span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
										Hazard Severity
									</span>
									<div class="flex items-baseline gap-1">
										<span class="text-2xl font-bold text-foreground">{result.analysis.hazardSeverity}</span>
										<span class="text-xs text-muted-foreground">/ 10</span>
									</div>
									<Badge
										variant={result.analysis.riskLevel === 'CRITICAL' ? 'destructive' : 'secondary'}
										class="text-[10px] h-4 px-1.5"
									>
										{result.analysis.riskLevel} TIER
									</Badge>
								</div>

								<div class="rounded-xl bg-secondary/30 border border-border p-3.5 space-y-1">
									<span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
										Distress Type
									</span>
									<span class="text-sm font-semibold text-foreground capitalize block truncate">
										{result.analysis.distressType.replace(/_/g, ' ')}
									</span>
									<span class="text-[10px] text-muted-foreground block font-mono">ASTM D6433</span>
								</div>

								<div class="rounded-xl bg-secondary/30 border border-border p-3.5 space-y-1 col-span-2 sm:col-span-1">
									<span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
										Est. Dimensions
									</span>
									<span class="text-xs font-mono text-foreground block truncate">
										Depth: {result.analysis.estimatedDimensions.depthEstimate}
									</span>
									<span class="text-[10px] text-muted-foreground block truncate font-mono">
										Area: {result.analysis.estimatedDimensions.surfaceAreaEstimate}
									</span>
								</div>
							</div>

							<!-- Engineering Assessment Summary -->
							<div class="p-4 rounded-xl bg-secondary/20 border border-border space-y-1.5">
								<span class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
									Engineering Diagnosis
								</span>
								<p class="text-xs text-foreground leading-relaxed">
									{result.analysis.summary}
								</p>
							</div>
						</TabsContent>

						<!-- Tab 2: ASTM Telemetry -->
						<TabsContent value="astm" class="space-y-4 pt-3">
							<div class="rounded-xl bg-secondary/20 border border-border p-4 space-y-3 text-xs">
								<div class="flex items-center justify-between pb-2 border-b border-border">
									<span class="text-muted-foreground">Civil Distress Standard</span>
									<span class="font-mono font-medium text-foreground">ASTM D6433-20</span>
								</div>
								<div class="flex items-center justify-between pb-2 border-b border-border">
									<span class="text-muted-foreground">Classified Severity Code</span>
									<Badge variant="outline" class="font-mono text-[10px]">
										{result.analysis.riskLevel}
									</Badge>
								</div>
								<div class="flex items-center justify-between pb-2 border-b border-border">
									<span class="text-muted-foreground">GPS Coordinates</span>
									<span class="font-mono text-foreground">{latitude}° N, {longitude}° E</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-muted-foreground">Secondary Distress Clues</span>
									<span class="text-foreground">{result.analysis.estimatedDimensions.depthEstimate} deep depression</span>
								</div>
							</div>
						</TabsContent>

						<!-- Tab 3: Materials & Crew Dispatch -->
						<TabsContent value="dispatch" class="space-y-4 pt-3">
							<div class="rounded-xl bg-secondary/20 border border-border p-4 space-y-3">
								<div class="flex items-center gap-2 text-foreground text-xs font-semibold">
									<WrenchIcon class="h-4 w-4 text-muted-foreground" />
									<span>Public Works Dispatch Specification:</span>
								</div>
								<p class="text-xs text-muted-foreground">
									{result.analysis.recommendedAction}
								</p>

								{#if result.analysis.materialsChecklist && result.analysis.materialsChecklist.length > 0}
									<Separator class="my-2" />
									<div class="space-y-2">
										<span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
											Bill of Materials & Equipment:
										</span>
										<ul class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
											{#each result.analysis.materialsChecklist as item}
												<li class="flex items-center gap-2 p-2 rounded-lg bg-card border border-border text-foreground">
													<span class="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></span>
													<span>{item}</span>
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							</div>
						</TabsContent>
					</Tabs>

					<!-- Bottom Dispatch Action Trigger (shadcn Sheet Drawer) -->
					<div class="pt-2 flex items-center justify-end gap-3 border-t border-border">
						<Sheet bind:open={isSheetOpen}>
							<SheetTrigger>
								<Button size="sm" class="gap-1.5 h-8 text-xs font-medium">
									<FileTextIcon class="h-3.5 w-3.5" />
									<span>View Municipal Dispatch Sheet</span>
									<ArrowRightIcon class="h-3.5 w-3.5" />
								</Button>
							</SheetTrigger>
							<SheetContent side="right" class="w-full sm:max-w-md bg-card border-border p-6 space-y-6">
								<SheetHeader class="space-y-1">
									<SheetTitle class="text-base font-bold text-foreground">
										Municipal Maintenance Dispatch
									</SheetTitle>
									<SheetDescription class="text-xs text-muted-foreground">
										Official local government unit (LGU) repair order generated by SuriOS.
									</SheetDescription>
								</SheetHeader>

								<Separator />

								<div class="space-y-4 text-xs">
									<div class="p-3 rounded-lg bg-secondary/50 border border-border space-y-1">
										<span class="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">TICKET ID</span>
										<span class="font-mono font-semibold text-foreground">
											#{result.reportId || 'AUTO-GEN-2026'}
										</span>
									</div>

									<div class="space-y-1">
										<span class="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">CORRIDOR LOCATION</span>
										<p class="font-mono text-foreground">{latitude}° N, {longitude}° E</p>
										<p class="text-muted-foreground text-[11px]">Provincial Corridor, Santa Cruz, Laguna</p>
									</div>

									<div class="space-y-1">
										<span class="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">ASTM DEFECT CLASSIFICATION</span>
										<p class="font-semibold text-foreground capitalize">{result.analysis.distressType.replace(/_/g, ' ')}</p>
										<p class="text-muted-foreground text-[11px]">Severity Index: {result.analysis.hazardSeverity}/10 ({result.analysis.riskLevel})</p>
									</div>

									<div class="space-y-1">
										<span class="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">RIDER LETHALITY WARNING</span>
										<Badge variant="destructive" class="text-[10px] h-5">
											{result.analysis.vruLethality} VRU THREAT
										</Badge>
										<p class="text-muted-foreground text-[11px] mt-1">{result.analysis.vruDetails}</p>
									</div>

									<div class="space-y-2 pt-2">
										<span class="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">RECOMMENDED DISPATCH SPEC</span>
										<p class="p-2.5 rounded-lg bg-secondary/30 border border-border text-foreground leading-relaxed">
											{result.analysis.recommendedAction}
										</p>
									</div>
								</div>

								<SheetFooter class="pt-4">
									<Button class="w-full text-xs font-medium h-9" onclick={() => isSheetOpen = false}>
										Confirm & Dispatch Work Order
									</Button>
								</SheetFooter>
							</SheetContent>
						</Sheet>
					</div>
				</Card>
			{:else}
				<!-- Empty Standby Placeholder (Matching shadcn matte aesthetic) -->
				<Card class="border border-dashed border-border bg-card/40 p-12 text-center flex flex-col items-center justify-center min-h-[420px] shadow-xs">
					<div class="h-12 w-12 rounded-2xl bg-secondary/60 flex items-center justify-center text-muted-foreground mb-3">
						<ShieldAlertIcon class="h-6 w-6" />
					</div>
					<h3 class="text-sm font-semibold text-foreground mb-1">AI Triage Results Standby</h3>
					<p class="text-xs text-muted-foreground max-w-sm leading-relaxed">
						Capture or select a road distress photo on the left, verify coordinates, and execute multimodal triage to inspect distress telemetry.
					</p>
				</Card>
			{/if}
		</div>
	</div>
</div>
