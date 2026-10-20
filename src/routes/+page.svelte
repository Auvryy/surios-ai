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
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '$lib/components/ui/card/index.js';
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

	let selectedFile = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);
	let latitude = $state<number>(14.2813);
	let longitude = $state<number>(121.4173);
	let locationStatus = $state<string>('Santa Cruz, Laguna');
	let isLocating = $state<boolean>(false);
	let isAnalyzing = $state<boolean>(false);
	let result = $state<TriageApiResponse['data'] | null>(null);
	let errorMessage = $state<string | null>(null);
	let rejectionAnalysis = $state<TriageAnalysis | null>(null);
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
		if (!('geolocation' in navigator)) return;
		isLocating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				latitude = Number(pos.coords.latitude.toFixed(6));
				longitude = Number(pos.coords.longitude.toFixed(6));
				locationStatus = `${latitude}° N, ${longitude}° E`;
				isLocating = false;
			},
			() => {
				isLocating = false;
			},
			{ enableHighAccuracy: true, timeout: 8000 }
		);
	}

	async function analyzeImage() {
		if (!selectedFile) {
			errorMessage = 'Select a photo first.';
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
				errorMessage = jsonResponse.error || 'Inspection failed.';
				if (response.status === 422 && (jsonResponse as any).analysis) {
					rejectionAnalysis = (jsonResponse as any).analysis;
				}
				return;
			}

			result = jsonResponse.data;
		} catch (err: any) {
			errorMessage = err?.message || 'Network error.';
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

<div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
	<!-- Minimal Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
		<div>
			<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
				Road Defect Triage
			</h1>
			<p class="text-xs text-muted-foreground mt-0.5">
				ASTM D6433 civil distress classification and rider hazard index.
			</p>
		</div>

		<div class="flex items-center gap-2 text-xs">
			<Badge variant="outline" class="font-normal text-muted-foreground border-border">
				Santa Cruz Anchor
			</Badge>
			<Badge variant="secondary" class="font-normal">
				ASTM D6433
			</Badge>
		</div>
	</div>

	<!-- Triage Canvas -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="capture">
		<!-- Left: Input & Image -->
		<div class="lg:col-span-5 space-y-4">
			<Card class="border border-border bg-card shadow-xs">
				<CardHeader class="pb-3 flex flex-row items-center justify-between">
					<CardTitle class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Evidence
					</CardTitle>
					{#if previewUrl}
						<Button
							variant="ghost"
							size="sm"
							onclick={resetForm}
							class="text-xs text-muted-foreground hover:text-destructive h-6 px-1.5"
						>
							Clear
						</Button>
					{/if}
				</CardHeader>

				<CardContent class="space-y-4">
					{#if previewUrl}
						<div class="relative rounded-xl overflow-hidden border border-border bg-secondary/30 aspect-video flex items-center justify-center">
							<img src={previewUrl} alt="Preview" class="w-full h-full object-cover" />
						</div>
					{:else}
						<label
							class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border hover:border-foreground/30 bg-secondary/15 hover:bg-secondary/30 p-8 cursor-pointer transition-colors aspect-video group"
						>
							<UploadIcon class="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors mb-2" />
							<p class="text-xs font-medium text-foreground">Select road photo</p>
							<p class="text-[11px] text-muted-foreground mt-0.5">JPEG, PNG, WebP</p>
							<input
								type="file"
								accept="image/*"
								capture="environment"
								onchange={handleFileChange}
								class="hidden"
							/>
						</label>
					{/if}

					<Separator class="my-1" />

					<!-- Coordinates -->
					<div class="space-y-1.5 text-xs">
						<div class="flex items-center justify-between text-muted-foreground">
							<span class="text-[11px] font-medium uppercase tracking-wider">Coordinates</span>
							<button
								type="button"
								onclick={detectLocation}
								disabled={isLocating}
								class="text-[11px] text-foreground hover:underline disabled:opacity-50"
							>
								{isLocating ? 'Locking...' : 'Detect GPS'}
							</button>
						</div>

						<div class="grid grid-cols-2 gap-2">
							<div class="bg-secondary/30 border border-border rounded-lg p-2">
								<span class="text-muted-foreground text-[10px] block">LAT</span>
								<span class="font-mono text-foreground font-medium text-xs">{latitude}° N</span>
							</div>
							<div class="bg-secondary/30 border border-border rounded-lg p-2">
								<span class="text-muted-foreground text-[10px] block">LNG</span>
								<span class="font-mono text-foreground font-medium text-xs">{longitude}° E</span>
							</div>
						</div>
					</div>
				</CardContent>

				<CardFooter class="pt-0">
					<Button
						type="button"
						onclick={analyzeImage}
						disabled={!selectedFile || isAnalyzing}
						class="w-full h-9 font-medium text-xs rounded-lg"
					>
						{#if isAnalyzing}
							<Loader2Icon class="h-3.5 w-3.5 animate-spin mr-1.5" />
							<span>Analyzing...</span>
						{:else}
							<span>Run Triage</span>
						{/if}
					</Button>
				</CardFooter>
			</Card>
		</div>

		<!-- Right: Results -->
		<div class="lg:col-span-7">
			{#if isAnalyzing}
				<Card class="border border-border bg-card p-10 text-center flex flex-col items-center justify-center min-h-[380px] shadow-xs">
					<Loader2Icon class="h-6 w-6 animate-spin text-muted-foreground mb-3" />
					<h3 class="text-xs font-semibold text-foreground uppercase tracking-wider">Classifying Distress</h3>
					<p class="text-xs text-muted-foreground max-w-xs mt-1">
						Extracting ASTM D6433 metrics and calculating lethality index...
					</p>
				</Card>
			{:else if errorMessage}
				<Alert variant="destructive" class="min-h-[380px] flex flex-col justify-center p-6 bg-card border-destructive/40">
					<AlertTriangleIcon class="h-4 w-4 text-destructive" />
					<AlertTitle class="text-xs font-semibold uppercase tracking-wider mt-1">Notice</AlertTitle>
					<AlertDescription class="text-xs mt-1.5 space-y-2">
						<p class="text-foreground">{errorMessage}</p>
						{#if rejectionAnalysis}
							<p class="text-muted-foreground text-[11px]">{rejectionAnalysis.rejectionReason}</p>
						{/if}
					</AlertDescription>
				</Alert>
			{:else if result}
				<Card class="border border-border bg-card shadow-xs space-y-4 p-5">
					<!-- Top Meta -->
					<div class="flex items-center justify-between pb-3 border-b border-border text-xs">
						<div class="flex items-center gap-2">
							<span class="font-semibold text-foreground">Defect Cataloged</span>
							{#if result.reportId}
								<span class="font-mono text-muted-foreground text-[10px]">
									#{result.reportId.slice(0, 8)}
								</span>
							{/if}
						</div>
						<Badge variant="outline" class="text-[11px] font-normal border-border">
							Urgency: {result.analysis.urgency}
						</Badge>
					</div>

					<!-- Two-Wheeler Hazard Banner -->
					<div class="rounded-xl border p-3.5 flex items-start gap-3 {
						result.analysis.vruLethality === 'CRITICAL' || result.analysis.vruLethality === 'HIGH'
							? 'bg-destructive/10 border-destructive/30 text-destructive'
							: result.analysis.vruLethality === 'MODERATE'
								? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
								: 'bg-secondary/40 border-border text-foreground'
					}">
						<BikeIcon class="h-4 w-4 shrink-0 mt-0.5 text-current" />
						<div class="space-y-0.5 text-xs">
							<p class="font-semibold uppercase tracking-wide">
								Two-Wheeler Hazard: {result.analysis.vruLethality}
							</p>
							<p class="text-foreground opacity-90 text-[11px] leading-relaxed">
								{result.analysis.vruDetails}
							</p>
						</div>
					</div>

					<!-- Segmented Tabs -->
					<Tabs value="overview" class="w-full">
						<TabsList class="grid w-full grid-cols-3 h-8 bg-secondary/40 p-0.5 rounded-lg">
							<TabsTrigger value="overview" class="text-xs">Overview</TabsTrigger>
							<TabsTrigger value="astm" class="text-xs">ASTM Specs</TabsTrigger>
							<TabsTrigger value="dispatch" class="text-xs">Materials</TabsTrigger>
						</TabsList>

						<!-- Tab 1: Overview -->
						<TabsContent value="overview" class="space-y-3 pt-3">
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
								<div class="rounded-lg bg-secondary/30 border border-border p-3 space-y-0.5">
									<span class="text-[10px] text-muted-foreground uppercase tracking-wider block">Severity</span>
									<div class="flex items-baseline gap-1">
										<span class="text-xl font-bold text-foreground">{result.analysis.hazardSeverity}</span>
										<span class="text-xs text-muted-foreground">/ 10</span>
									</div>
									<Badge
										variant={result.analysis.riskLevel === 'CRITICAL' ? 'destructive' : 'secondary'}
										class="text-[9px] h-4 px-1"
									>
										{result.analysis.riskLevel}
									</Badge>
								</div>

								<div class="rounded-lg bg-secondary/30 border border-border p-3 space-y-0.5">
									<span class="text-[10px] text-muted-foreground uppercase tracking-wider block">Distress</span>
									<span class="text-xs font-semibold text-foreground capitalize block truncate">
										{result.analysis.distressType.replace(/_/g, ' ')}
									</span>
									<span class="text-[10px] text-muted-foreground block font-mono">D6433</span>
								</div>

								<div class="rounded-lg bg-secondary/30 border border-border p-3 space-y-0.5 col-span-2 sm:col-span-1">
									<span class="text-[10px] text-muted-foreground uppercase tracking-wider block">Dimensions</span>
									<span class="text-xs font-mono text-foreground block truncate">
										{result.analysis.estimatedDimensions.depthEstimate} deep
									</span>
									<span class="text-[10px] text-muted-foreground block truncate font-mono">
										{result.analysis.estimatedDimensions.surfaceAreaEstimate}
									</span>
								</div>
							</div>

							<div class="p-3 rounded-lg bg-secondary/20 border border-border space-y-1">
								<span class="text-[10px] text-muted-foreground uppercase tracking-wider block">Assessment</span>
								<p class="text-xs text-foreground leading-relaxed">
									{result.analysis.summary}
								</p>
							</div>
						</TabsContent>

						<!-- Tab 2: ASTM Specs -->
						<TabsContent value="astm" class="space-y-2 pt-3 text-xs">
							<div class="rounded-lg bg-secondary/20 border border-border p-3 divide-y divide-border">
								<div class="flex items-center justify-between py-1.5">
									<span class="text-muted-foreground">Standard</span>
									<span class="font-mono text-foreground">ASTM D6433</span>
								</div>
								<div class="flex items-center justify-between py-1.5">
									<span class="text-muted-foreground">Severity Level</span>
									<span class="font-mono text-foreground">{result.analysis.riskLevel}</span>
								</div>
								<div class="flex items-center justify-between py-1.5">
									<span class="text-muted-foreground">Location</span>
									<span class="font-mono text-foreground">{latitude}° N, {longitude}° E</span>
								</div>
							</div>
						</TabsContent>

						<!-- Tab 3: Materials -->
						<TabsContent value="dispatch" class="space-y-3 pt-3 text-xs">
							<div class="rounded-lg bg-secondary/20 border border-border p-3 space-y-2">
								<p class="font-medium text-foreground">
									{result.analysis.recommendedAction}
								</p>

								{#if result.analysis.materialsChecklist && result.analysis.materialsChecklist.length > 0}
									<Separator class="my-1.5" />
									<ul class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-muted-foreground">
										{#each result.analysis.materialsChecklist as item}
											<li class="p-1.5 rounded bg-card border border-border text-foreground">
												{item}
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						</TabsContent>
					</Tabs>

					<!-- Bottom Action -->
					<div class="pt-2 flex items-center justify-end border-t border-border">
						<Sheet bind:open={isSheetOpen}>
							<SheetTrigger>
								<Button size="sm" class="h-8 text-xs font-medium gap-1">
									<span>Dispatch Work Order</span>
									<ArrowRightIcon class="h-3 w-3" />
								</Button>
							</SheetTrigger>
							<SheetContent side="right" class="w-full sm:max-w-md bg-card border-border p-6 space-y-4">
								<SheetHeader>
									<SheetTitle class="text-sm font-bold text-foreground">
										Municipal Dispatch Order
									</SheetTitle>
									<SheetDescription class="text-xs text-muted-foreground">
										Civil maintenance work order generated by SuriOS.
									</SheetDescription>
								</SheetHeader>

								<Separator />

								<div class="space-y-3 text-xs">
									<div class="p-2.5 rounded bg-secondary/40 border border-border">
										<span class="text-[10px] text-muted-foreground block">TICKET</span>
										<span class="font-mono font-semibold text-foreground">
											#{result.reportId || 'AUTO-GEN'}
										</span>
									</div>
									<div>
										<span class="text-[10px] text-muted-foreground block">LOCATION</span>
										<p class="font-mono text-foreground">{latitude}° N, {longitude}° E</p>
									</div>
									<div>
										<span class="text-[10px] text-muted-foreground block">ACTION</span>
										<p class="text-foreground mt-0.5">{result.analysis.recommendedAction}</p>
									</div>
								</div>

								<SheetFooter class="pt-2">
									<Button class="w-full text-xs h-8" onclick={() => isSheetOpen = false}>
										Confirm Dispatch
									</Button>
								</SheetFooter>
							</SheetContent>
						</Sheet>
					</div>
				</Card>
			{:else}
				<Card class="border border-dashed border-border bg-card/30 p-10 text-center flex flex-col items-center justify-center min-h-[380px] shadow-xs">
					<ShieldAlertIcon class="h-5 w-5 text-muted-foreground/60 mb-2" />
					<h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Triage Standby</h3>
					<p class="text-xs text-muted-foreground mt-1 max-w-xs">
						Capture a pavement defect to classify distress.
					</p>
				</Card>
			{/if}
		</div>
	</div>
</div>
