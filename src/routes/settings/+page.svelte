<script lang="ts">
	import type { ActionData, PageProps } from './$types.js';
	import { enhance } from '$app/forms';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';

	import SettingsIcon from '@lucide/svelte/icons/settings';
	import BellIcon from '@lucide/svelte/icons/bell';
	import SlidersIcon from '@lucide/svelte/icons/sliders';
	import CpuIcon from '@lucide/svelte/icons/cpu';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import BikeIcon from '@lucide/svelte/icons/bike';

	let { data, form }: PageProps & { form: ActionData } = $props();

	// Reactive Settings State
	let vruAlerts = $state(true);
	let dailyDigest = $state(true);
	let dpwhForwarding = $state(false);
	let potholeThreshold = $state(50);
	let vruWeightMultiplier = $state(1.5);
	let autoSnapCorridors = $state(true);
	let defaultMapView = $state<'split' | 'full'>('split');
	let preferredCorridor = $state('ALL');

	let isSaving = $state(false);
	let isResetting = $state(false);
	let lastSavedTime = $state<string | null>(null);

	// Initialize from server data on mount/change
	$effect(() => {
		if (data.settings) {
			vruAlerts = data.settings.vruAlerts ?? true;
			dailyDigest = data.settings.dailyDigest ?? true;
			dpwhForwarding = data.settings.dpwhForwarding ?? false;
			potholeThreshold = data.settings.potholeThreshold ?? 50;
			vruWeightMultiplier = data.settings.vruWeightMultiplier ?? 1.5;
			autoSnapCorridors = data.settings.autoSnapCorridors ?? true;
			defaultMapView = data.settings.defaultMapView ?? 'split';
			preferredCorridor = data.settings.preferredCorridor ?? 'ALL';
		}
	});

	// Sync success updates from form response
	$effect(() => {
		if (form?.savedAt) {
			lastSavedTime = form.savedAt;
		}
		if (form?.settings) {
			vruAlerts = form.settings.vruAlerts;
			dailyDigest = form.settings.dailyDigest;
			dpwhForwarding = form.settings.dpwhForwarding;
			potholeThreshold = form.settings.potholeThreshold;
			vruWeightMultiplier = form.settings.vruWeightMultiplier;
			autoSnapCorridors = form.settings.autoSnapCorridors;
			defaultMapView = form.settings.defaultMapView;
			preferredCorridor = form.settings.preferredCorridor;

			// Also backup to localStorage
			if (typeof window !== 'undefined') {
				try {
					localStorage.setItem('surios_settings', JSON.stringify(form.settings));
				} catch (e) {
					// ignore
				}
			}
		}
	});
</script>

<svelte:head>
	<title>Settings — SuriOS Municipal Civil Infrastructure</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
	<!-- Page Header with Save & Reset Actions -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<Badge variant="outline" class="text-xs font-mono border-border">
					Configuration
				</Badge>
				<span class="text-xs text-muted-foreground">Municipal Platform</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">
				System &amp; Workspace Settings
			</h1>
		</div>

		<div class="flex items-center gap-2">
			<!-- Reset Defaults Form -->
			<form
				method="POST"
				action="?/resetDefaults"
				use:enhance={() => {
					isResetting = true;
					return async ({ update }) => {
						isResetting = false;
						await update();
					};
				}}
			>
				<Button
					type="submit"
					variant="outline"
					size="sm"
					disabled={isResetting || isSaving}
					class="h-8 text-xs font-medium gap-1.5"
				>
					{#if isResetting}
						<RefreshCwIcon class="h-3 w-3 animate-spin" />
						<span>Resetting...</span>
					{:else}
						<RotateCcwIcon class="h-3 w-3" />
						<span>Reset Defaults</span>
					{/if}
				</Button>
			</form>

			<!-- Primary Submit Form Trigger -->
			<Button
				type="submit"
				form="settings-form"
				size="sm"
				disabled={isSaving || isResetting}
				class="h-8 text-xs font-medium gap-1.5"
			>
				{#if isSaving}
					<RefreshCwIcon class="h-3 w-3 animate-spin" />
					<span>Saving...</span>
				{:else}
					<CheckCircleIcon class="h-3 w-3" />
					<span>Save Changes</span>
				{/if}
			</Button>
		</div>
	</div>

	<!-- Status Banners -->
	{#if form?.success}
		<Alert class="py-2.5 px-3 border-border bg-secondary/50 text-foreground">
			<div class="flex items-center justify-between w-full">
				<div class="flex items-center gap-2">
					<CheckCircleIcon class="h-4 w-4 text-primary shrink-0" />
					<AlertDescription class="text-xs font-medium">{form.success}</AlertDescription>
				</div>
				{#if lastSavedTime}
					<Badge variant="outline" class="font-mono text-[10px] border-border text-muted-foreground">
						Saved at {lastSavedTime}
					</Badge>
				{/if}
			</div>
		</Alert>
	{/if}

	{#if !data.user}
		<div class="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-between text-xs">
			<div class="space-y-0.5">
				<span class="font-medium text-foreground">Guest Evaluation Mode</span>
				<p class="text-[11px] text-muted-foreground">
					Settings apply to this browser. Sign in to synchronize preferences with the municipal PostgreSQL server.
				</p>
			</div>
			<Button href="/login?redirectTo=/settings" variant="outline" size="sm" class="h-7 text-xs">
				Sign In
			</Button>
		</div>
	{/if}

	<!-- Main Settings Form -->
	<form
		id="settings-form"
		method="POST"
		action="?/saveSettings"
		use:enhance={() => {
			isSaving = true;
			return async ({ update }) => {
				isSaving = false;
				await update();
			};
		}}
	>
		<!-- Hidden values passed to server action -->
		<input type="hidden" name="potholeThreshold" value={potholeThreshold} />
		<input type="hidden" name="vruWeightMultiplier" value={vruWeightMultiplier} />
		<input type="hidden" name="defaultMapView" value={defaultMapView} />
		<input type="hidden" name="preferredCorridor" value={preferredCorridor} />

		<!-- Tabbed Settings Layout -->
		<Tabs value="appearance" class="space-y-6">
			<TabsList class="border border-border bg-card p-1">
				<TabsTrigger value="appearance" class="text-xs">Appearance &amp; GIS</TabsTrigger>
				<TabsTrigger value="alerts" class="text-xs">Municipal Alerts</TabsTrigger>
				<TabsTrigger value="astm" class="text-xs">ASTM Tolerances</TabsTrigger>
				<TabsTrigger value="diagnostics" class="text-xs">AI Diagnostics</TabsTrigger>
			</TabsList>

			<!-- Appearance & GIS Tab -->
			<TabsContent value="appearance" class="space-y-4">
				<Card class="border-border bg-card shadow-none">
					<CardHeader class="pb-3">
						<CardTitle class="text-sm font-semibold tracking-tight">Display &amp; Map Layout Mode</CardTitle>
						<CardDescription class="text-xs text-muted-foreground">
							Select high-contrast themes and layout preferences for direct outdoor sunlight or command center control rooms.
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<!-- Theme Switcher -->
						<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
							<div class="space-y-0.5">
								<span class="text-xs font-medium text-foreground">Active Theme Scheme</span>
								<p class="text-[11px] text-muted-foreground">Toggle between flat dark command matte and clean light paper.</p>
							</div>
							<ThemeToggle />
						</div>

						<!-- Default Map View Mode -->
						<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
							<div class="space-y-0.5">
								<span class="text-xs font-medium text-foreground">Default Map Feed Layout</span>
								<p class="text-[11px] text-muted-foreground">Choose between split telemetry feed or full-screen GIS viewport.</p>
							</div>
							<div class="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-lg border border-border">
								<button
									type="button"
									onclick={() => { defaultMapView = 'split'; }}
									class="text-xs px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer {defaultMapView === 'split' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
								>
									Split Telemetry
								</button>
								<button
									type="button"
									onclick={() => { defaultMapView = 'full'; }}
									class="text-xs px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer {defaultMapView === 'full' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
								>
									Full GIS
								</button>
							</div>
						</div>

						<!-- Corridor Snapping Switch -->
						<label class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 cursor-pointer">
							<div class="space-y-0.5 pr-4">
								<span class="text-xs font-medium text-foreground">Road Curve Snapping (Santa Cruz Corridors)</span>
								<p class="text-[11px] text-muted-foreground">Automatically render true physical street curvature on Manila East Rd and Guevara Ave.</p>
							</div>
							<input
								type="checkbox"
								name="autoSnapCorridors"
								bind:checked={autoSnapCorridors}
								class="h-4 w-4 rounded border-border"
							/>
						</label>

						<!-- Zero AI Slop Compliance Badge -->
						<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
							<div class="space-y-0.5">
								<span class="text-xs font-medium text-foreground">Design System Compliance</span>
								<p class="text-[11px] text-muted-foreground">Strict zero-gradient charter, soft Inter typography, subtle 1px micro-borders.</p>
							</div>
							<Badge variant="outline" class="text-[10px] font-mono border-border">
								Zero AI Slop Active
							</Badge>
						</div>
					</CardContent>
				</Card>
			</TabsContent>

			<!-- Municipal Alerts Tab -->
			<TabsContent value="alerts" class="space-y-4">
				<Card class="border-border bg-card shadow-none">
					<CardHeader class="pb-3">
						<CardTitle class="text-sm font-semibold tracking-tight">Emergency Hazard Routing &amp; Notifications</CardTitle>
						<CardDescription class="text-xs text-muted-foreground">
							Real-time dispatch alerts for Vulnerable Road User (VRU) threats across the Santa Cruz municipality.
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-3">
						<label class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 cursor-pointer">
							<div class="space-y-0.5 pr-4">
								<span class="text-xs font-medium text-foreground">Critical VRU Threat Notifications</span>
								<p class="text-[11px] text-muted-foreground">Instant browser alert when potholes &gt;{potholeThreshold}mm or severe alligator rutting are triaged.</p>
							</div>
							<input
								type="checkbox"
								name="vruAlerts"
								bind:checked={vruAlerts}
								class="h-4 w-4 rounded border-border"
							/>
						</label>

						<label class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 cursor-pointer">
							<div class="space-y-0.5 pr-4">
								<span class="text-xs font-medium text-foreground">Daily LGU Maintenance Digest</span>
								<p class="text-[11px] text-muted-foreground">Consolidated summary of reported vs. resolved road defects across the Laguna corridor.</p>
							</div>
							<input
								type="checkbox"
								name="dailyDigest"
								bind:checked={dailyDigest}
								class="h-4 w-4 rounded border-border"
							/>
						</label>

						<label class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 cursor-pointer">
							<div class="space-y-0.5 pr-4">
								<span class="text-xs font-medium text-foreground">Automated DPWH District II Forwarding</span>
								<p class="text-[11px] text-muted-foreground">Relay national highway defects directly to DPWH maintenance dispatchers.</p>
							</div>
							<input
								type="checkbox"
								name="dpwhForwarding"
								bind:checked={dpwhForwarding}
								class="h-4 w-4 rounded border-border"
							/>
						</label>
					</CardContent>
				</Card>
			</TabsContent>

			<!-- ASTM Tolerances Tab -->
			<TabsContent value="astm" class="space-y-4">
				<Card class="border-border bg-card shadow-none">
					<CardHeader class="pb-3">
						<CardTitle class="text-sm font-semibold tracking-tight">ASTM D6433 Distress Classification Parameters</CardTitle>
						<CardDescription class="text-xs text-muted-foreground">
							Calibration parameters for Pothole and Alligator Cracking severity calculations.
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<!-- Pothole Slider -->
						<div class="space-y-2.5 p-3.5 rounded-lg border border-border bg-muted/20">
							<div class="flex items-center justify-between">
								<div class="space-y-0.5">
									<span class="text-xs font-medium text-foreground">Pothole High-Severity Emergency Threshold</span>
									<p class="text-[11px] text-muted-foreground">Defects deeper than this value trigger automatic Hazard Severity 8+ escalation.</p>
								</div>
								<Badge variant="outline" class="text-xs font-mono font-bold px-2 py-0.5">
									{potholeThreshold} mm
								</Badge>
							</div>
							<input
								type="range"
								min="30"
								max="100"
								step="5"
								bind:value={potholeThreshold}
								class="w-full accent-primary cursor-pointer"
							/>
							<div class="flex justify-between text-[10px] text-muted-foreground font-mono">
								<span>30 mm (Standard Depth)</span>
								<span>50 mm (Laguna Default)</span>
								<span>100 mm (Severe Crater)</span>
							</div>
						</div>

						<!-- VRU Multiplier -->
						<div class="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20 text-xs">
							<div class="space-y-0.5 pr-4">
								<div class="flex items-center gap-1.5 font-medium text-foreground">
									<BikeIcon class="h-3.5 w-3.5 text-muted-foreground" />
									<span>Two-Wheeler Lethality Multiplier</span>
								</div>
								<p class="text-[11px] text-muted-foreground">
									Kinematic weight applied to motorcycle/tricycle traffic (68% modal share in Laguna).
								</p>
							</div>
							<div class="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-lg border border-border shrink-0">
								{#each [1.25, 1.5, 1.75, 2.0] as mult}
									<button
										type="button"
										onclick={() => { vruWeightMultiplier = mult; }}
										class="text-xs px-2 py-1 rounded-md font-mono transition-colors cursor-pointer {vruWeightMultiplier === mult ? 'bg-background text-foreground font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
									>
										{mult.toFixed(2)}x
									</button>
								{/each}
							</div>
						</div>

						<!-- Deduplication Radius -->
						<div class="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20 text-xs">
							<div class="space-y-0.5">
								<span class="font-medium text-foreground">Spatial Deduplication Radius</span>
								<p class="text-[11px] text-muted-foreground">Haversine geo-clustering radius for merging duplicate citizen submissions.</p>
							</div>
							<Badge variant="secondary" class="font-mono text-xs">~25 Meters</Badge>
						</div>
					</CardContent>
				</Card>
			</TabsContent>

			<!-- AI Diagnostics Tab -->
			<TabsContent value="diagnostics" class="space-y-4">
				<Card class="border-border bg-card shadow-none">
					<CardHeader class="pb-3">
						<CardTitle class="text-sm font-semibold tracking-tight">Multimodal AI &amp; Platform Health</CardTitle>
						<CardDescription class="text-xs text-muted-foreground">
							Live operational status of Google Gemini vision inference, PostgreSQL persistence, and ASTM compliance.
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-2.5">
						<!-- Gemini Model -->
						<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs">
							<div class="flex items-center gap-2.5">
								<SparklesIcon class="h-4 w-4 text-primary" />
								<div>
									<span class="font-medium text-foreground">Google Gemini Multimodal Vision</span>
									<p class="text-[11px] text-muted-foreground">Active Model: {data.systemDiagnostics.geminiModel}</p>
								</div>
							</div>
							<Badge variant="outline" class="font-mono text-[10px] border-border text-foreground">
								{data.systemDiagnostics.geminiStatus}
							</Badge>
						</div>

						<!-- PostgreSQL -->
						<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs">
							<div class="flex items-center gap-2.5">
								<CpuIcon class="h-4 w-4 text-primary" />
								<div>
									<span class="font-medium text-foreground">PostgreSQL Persistence Engine</span>
									<p class="text-[11px] text-muted-foreground">
										{data.systemDiagnostics.databaseStatus} &bull; {data.systemDiagnostics.totalReportsCataloged} reports logged
									</p>
								</div>
							</div>
							<Badge variant="outline" class="font-mono text-[10px] border-border text-foreground">
								Port 5433
							</Badge>
						</div>

						<!-- ASTM Standard -->
						<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs">
							<div class="flex items-center gap-2.5">
								<ShieldCheckIcon class="h-4 w-4 text-primary" />
								<div>
									<span class="font-medium text-foreground">Civil Distress Standard</span>
									<p class="text-[11px] text-muted-foreground">{data.systemDiagnostics.astmStandard}</p>
								</div>
							</div>
							<Badge variant="outline" class="font-mono text-[10px] border-border text-foreground">
								DPWH Aligned
							</Badge>
						</div>

						<!-- Jurisdiction -->
						<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs">
							<div class="flex items-center gap-2.5">
								<MapPinIcon class="h-4 w-4 text-primary" />
								<div>
									<span class="font-medium text-foreground">Municipal Operational Anchor</span>
									<p class="text-[11px] text-muted-foreground">{data.systemDiagnostics.activeJurisdiction}</p>
								</div>
							</div>
							<Badge variant="secondary" class="font-mono text-[10px]">
								14.2813° N, 121.4173° E
							</Badge>
						</div>
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	</form>
</div>
