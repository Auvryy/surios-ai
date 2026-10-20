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

<main class="min-h-screen bg-slate-950 text-slate-100 antialiased">
	<!-- Top Navigation Bar -->
	<header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-20">
		<div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
					S
				</div>
				<div>
					<div class="flex items-center gap-2">
						<span class="font-bold text-lg tracking-tight text-white">SuriOS</span>
						<span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
							SDG 9 Platform
						</span>
					</div>
					<p class="text-[11px] text-slate-400">Autonomous Civil Infrastructure Triage & Dispatch</p>
				</div>
			</div>

			<div class="hidden sm:flex items-center gap-4 text-xs text-slate-400">
				<span class="flex items-center gap-1.5">
					<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
					Gemini 3.5 Flash Active
				</span>
				<span class="text-slate-600">|</span>
				<span>LSPU Santa Cruz Anchor</span>
			</div>
		</div>
	</header>

	<div class="max-w-5xl mx-auto px-4 py-8">
		<!-- Hero Section -->
		<div class="mb-8 text-center sm:text-left">
			<h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
				Automated Road Defect Triage
			</h1>
			<p class="text-sm sm:text-base text-slate-400 max-w-2xl">
				Upload or photograph road hazards (potholes, cracks, drainage failures). Our multimodal vision engine classifies the distress (ASTM D6433), estimates Two-Wheeler Lethality, and generates municipal repair tickets.
			</p>
		</div>

		<!-- Interactive Diagnostic Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
			<!-- Left Column: Input & Capture -->
			<div class="lg:col-span-5 space-y-5">
				<!-- Photo Upload Card -->
				<div class="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm">
					<div class="flex items-center justify-between mb-3">
						<h2 class="text-sm font-semibold text-slate-200 flex items-center gap-2">
							<CameraIcon class="w-4 h-4 text-emerald-400" />
							1. Capture or Select Image
						</h2>
						{#if previewUrl}
							<button
								type="button"
								onclick={resetForm}
								class="text-xs text-slate-400 hover:text-rose-400 transition"
							>
								Clear
							</button>
						{/if}
					</div>

					{#if previewUrl}
						<div class="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 aspect-video mb-3 flex items-center justify-center">
							<img src={previewUrl} alt="Road hazard preview" class="w-full h-full object-cover" />
						</div>
					{:else}
						<label
							class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/50 p-8 cursor-pointer transition group aspect-video"
						>
							<div class="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition mb-3">
								<UploadIcon class="w-6 h-6" />
							</div>
							<p class="text-xs font-medium text-slate-300">Click to upload or take a photo</p>
							<p class="text-[11px] text-slate-500 mt-1">JPEG, PNG, WebP up to 10MB</p>
							<input
								type="file"
								accept="image/*"
								capture="environment"
								onchange={handleFileChange}
								class="hidden"
							/>
						</label>
					{/if}

					<!-- GPS Coordinates -->
					<div class="mt-4 pt-4 border-t border-slate-800/80">
						<div class="flex items-center justify-between mb-2">
							<label class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
								<MapPinIcon class="w-3.5 h-3.5 text-sky-400" />
								2. Geolocation Coordinates
							</label>
							<button
								type="button"
								onclick={detectLocation}
								disabled={isLocating}
								class="text-[11px] font-medium text-sky-400 hover:text-sky-300 disabled:opacity-50 transition"
							>
								{isLocating ? 'Locating...' : 'Detect GPS'}
							</button>
						</div>

						<div class="grid grid-cols-2 gap-2 text-xs">
							<div class="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5">
								<span class="text-slate-500 text-[10px] block">LATITUDE</span>
								<span class="font-mono text-slate-200">{latitude}° N</span>
							</div>
							<div class="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5">
								<span class="text-slate-500 text-[10px] block">LONGITUDE</span>
								<span class="font-mono text-slate-200">{longitude}° E</span>
							</div>
						</div>
						<p class="text-[11px] text-slate-500 mt-1.5 truncate">{locationStatus}</p>
					</div>

					<!-- Analyze Button -->
					<div class="mt-5">
						<button
							type="button"
							onclick={analyzeImage}
							disabled={!selectedFile || isAnalyzing}
							class="w-full h-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10"
						>
							{#if isAnalyzing}
								<Loader2Icon class="w-4 h-4 animate-spin" />
								<span>Inspecting via Gemini...</span>
							{:else}
								<SparklesIcon class="w-4 h-4" />
								<span>Run AI Civil Triage</span>
							{/if}
						</button>
					</div>
				</div>
			</div>

			<!-- Right Column: Results & Triage Payload -->
			<div class="lg:col-span-7">
				{#if isAnalyzing}
					<div class="rounded-xl border border-slate-800 bg-slate-900/30 p-10 text-center flex flex-col items-center justify-center min-h-[360px]">
						<div class="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin mb-4"></div>
						<h3 class="text-sm font-semibold text-white mb-1">Processing Road Multimodal Vision</h3>
						<p class="text-xs text-slate-400 max-w-sm">
							Extracting ASTM D6433 defect distress types, calculating Two-Wheeler Lethality Index, and formulating crew materials...
						</p>
					</div>
				{:else if errorMessage}
					<div class="rounded-xl border border-rose-900/40 bg-rose-950/20 p-6 text-slate-200 min-h-[360px]">
						<div class="flex items-start gap-3">
							<AlertTriangleIcon class="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
							<div>
								<h3 class="text-sm font-bold text-rose-300">Triage Rejection / Error</h3>
								<p class="text-xs text-rose-200/80 mt-1">{errorMessage}</p>
								{#if rejectionAnalysis}
									<div class="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-900/30 text-xs space-y-1">
										<p class="font-semibold text-rose-300">Spam / Non-Infrastructure Filter Activated:</p>
										<p class="text-rose-200/90">{rejectionAnalysis.rejectionReason}</p>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{:else if result}
					<div class="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-5 shadow-sm">
						<!-- Top Status Bar -->
						<div class="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
							<div class="flex items-center gap-2">
								<CheckCircleIcon class="w-4 h-4 text-emerald-400" />
								<span class="text-xs font-semibold uppercase tracking-wider text-emerald-400">
									Ticket Created & Saved
								</span>
								{#if result.reportId}
									<span class="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
										#{result.reportId.slice(0, 8)}
									</span>
								{/if}
							</div>

							<div class="flex items-center gap-2 text-xs">
								<span class="text-slate-400">Urgency:</span>
								<span class="font-semibold text-white px-2 py-0.5 rounded bg-slate-800 text-[11px]">
									{result.analysis.urgency}
								</span>
							</div>
						</div>

						<!-- Two-Wheeler Lethality Alert (The Differentiator) -->
						<div class="rounded-lg border p-3.5 flex items-start gap-3 {
							result.analysis.vruLethality === 'CRITICAL' || result.analysis.vruLethality === 'HIGH'
								? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
								: result.analysis.vruLethality === 'MODERATE'
									? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
									: 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
						}">
							<BikeIcon class="w-5 h-5 shrink-0 mt-0.5" />
							<div>
								<div class="flex items-center gap-2">
									<h4 class="text-xs font-bold uppercase tracking-wide">
										Two-Wheeler Lethality: {result.analysis.vruLethality} RISK
									</h4>
									<span class="text-[10px] px-1.5 py-0.2 rounded bg-black/40 font-mono">
										VRU Safety Profile
									</span>
								</div>
								<p class="text-xs mt-1 opacity-90 leading-relaxed">
									{result.analysis.vruDetails}
								</p>
							</div>
						</div>

						<!-- Key Metrics Grid -->
						<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
							<!-- Severity Index -->
							<div class="rounded-lg bg-slate-950 border border-slate-800 p-3">
								<span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
									Hazard Severity
								</span>
								<div class="flex items-baseline gap-1.5">
									<span class="text-2xl font-black text-white">{result.analysis.hazardSeverity}</span>
									<span class="text-xs text-slate-500">/ 10</span>
								</div>
								<span class="text-[10px] font-medium {
									result.analysis.riskLevel === 'CRITICAL'
										? 'text-rose-400'
										: result.analysis.riskLevel === 'MODERATE'
											? 'text-amber-400'
											: 'text-emerald-400'
								}">
									{result.analysis.riskLevel} TIER
								</span>
							</div>

							<!-- Distress Type -->
							<div class="rounded-lg bg-slate-950 border border-slate-800 p-3">
								<span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
									Classification
								</span>
								<span class="text-sm font-bold text-white capitalize block truncate">
									{result.analysis.distressType.replace(/_/g, ' ')}
								</span>
								<span class="text-[10px] text-slate-500">ASTM D6433 Standard</span>
							</div>

							<!-- Dimensions -->
							<div class="rounded-lg bg-slate-950 border border-slate-800 p-3 col-span-2 sm:col-span-1">
								<span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
									Est. Dimensions
								</span>
								<span class="text-xs font-mono text-slate-200 block truncate">
									Depth: {result.analysis.estimatedDimensions.depthEstimate}
								</span>
								<span class="text-[10px] text-slate-400 block truncate">
									Area: {result.analysis.estimatedDimensions.surfaceAreaEstimate}
								</span>
							</div>
						</div>

						<!-- Engineering Summary -->
						<div class="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800">
							<span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
								Engineering Assessment Summary
							</span>
							<p class="text-xs text-slate-300 leading-relaxed">
								{result.analysis.summary}
							</p>
						</div>

						<!-- Recommended Action & Materials -->
						<div class="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
							<div class="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
								<WrenchIcon class="w-3.5 h-3.5" />
								<span>Public Works Dispatch Specification:</span>
							</div>
							<p class="text-xs text-slate-200 font-medium">
								{result.analysis.recommendedAction}
							</p>

							{#if result.analysis.materialsChecklist && result.analysis.materialsChecklist.length > 0}
								<div class="pt-2">
									<span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
										Crew Equipment & Materials Checklist:
									</span>
									<ul class="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-300">
										{#each result.analysis.materialsChecklist as item}
											<li class="flex items-center gap-1.5">
												<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
												<span>{item}</span>
											</li>
										{/each}
									</ul>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<!-- Empty State Placeholder -->
					<div class="rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-10 text-center flex flex-col items-center justify-center min-h-[360px]">
						<ShieldAlertIcon class="w-10 h-10 text-slate-700 mb-3" />
						<h3 class="text-sm font-semibold text-slate-300 mb-1">AI Triage Results Standby</h3>
						<p class="text-xs text-slate-500 max-w-sm">
							Select or capture an image on the left and click "Run AI Civil Triage" to execute multimodal road distress classification.
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</main>
