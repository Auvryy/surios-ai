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

	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	let file = $state<File | null>(null);
	let preview = $state<string | null>(null);
	let latitude = $state<number>(14.2813);
	let longitude = $state<number>(121.4173);
	let isSubmitting = $state<boolean>(false);
	let isLocating = $state<boolean>(false);
	let submitted = $state<boolean>(false);
	let proximityClusterCount = $state<number>(3);

	function handleCapture(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			file = target.files[0];
			preview = URL.createObjectURL(file);
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
		try {
			const fd = new FormData();
			fd.append('image', file);
			fd.append('latitude', latitude.toString());
			fd.append('longitude', longitude.toString());
			const res = await fetch('/api/triage', { method: 'POST', body: fd });
			if (res.ok) {
				submitted = true;
			}
		} finally {
			isSubmitting = false;
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
			Point your camera at a road defect. SuriOS logs geodetic telemetry, performs AI distress triage, and clusters nearby reports within ~25m to amplify priority.
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

	{#if submitted}
		<Card class="border border-border bg-card p-8 text-center space-y-4">
			<div class="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
				<CheckCircleIcon class="h-6 w-6" />
			</div>
			<div class="space-y-1">
				<h2 class="text-base font-bold text-foreground">Report Dispatched Successfully</h2>
				<p class="text-xs text-muted-foreground max-w-sm mx-auto">
					Your submission has been cataloged under ASTM D6433 standards and added to the Santa Cruz municipal public works queue.
				</p>
			</div>
			<Button onclick={() => { submitted = false; file = null; preview = null; }} size="sm">
				Submit Another Defect
			</Button>
		</Card>
	{:else}
		<Card class="border border-border bg-card shadow-xs">
			<CardHeader class="pb-3">
				<CardTitle class="text-sm font-semibold flex items-center gap-2">
					<CameraIcon class="h-4 w-4 text-foreground" />
					<span>One-Tap Camera Shutter</span>
				</CardTitle>
				<CardDescription class="text-xs">
					Capture pavement distress clearly showing depth and context.
				</CardDescription>
			</CardHeader>

			<CardContent class="space-y-4">
				{#if preview}
					<div class="relative rounded-xl overflow-hidden border border-border aspect-video bg-secondary/30 flex items-center justify-center">
						<img src={preview} alt="Road report evidence" class="w-full h-full object-cover" />
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
						<p class="font-medium text-foreground">Vulnerable Road User (VRU) Protection</p>
						<p class="text-muted-foreground text-[11px] leading-relaxed">
							Motorcycles and tricycles comprise over 68% of traffic in provincial corridors. Depth reports over 50mm trigger instant emergency flags.
						</p>
					</div>
				</div>

				<Separator />

				<!-- GPS Coordinates -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-xs font-medium text-foreground flex items-center gap-1.5">
							<MapPinIcon class="h-3.5 w-3.5 text-muted-foreground" />
							<span>Geodetic Location</span>
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
					disabled={!file || isSubmitting}
					class="w-full h-10 text-xs font-medium gap-1.5 rounded-lg"
				>
					{#if isSubmitting}
						<RefreshCwIcon class="h-3.5 w-3.5 animate-spin" />
						<span>Dispatching to Municipal Operations...</span>
					{:else}
						<SparklesIcon class="h-3.5 w-3.5" />
						<span>Submit Road Defect Report</span>
					{/if}
				</Button>
			</CardFooter>
		</Card>
	{/if}
</div>
