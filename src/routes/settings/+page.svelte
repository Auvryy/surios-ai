<script lang="ts">
	import type { PageProps } from './$types.js';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs/index.js';

	import SettingsIcon from '@lucide/svelte/icons/settings';
	import BellIcon from '@lucide/svelte/icons/bell';
	import SlidersIcon from '@lucide/svelte/icons/sliders';
	import CpuIcon from '@lucide/svelte/icons/cpu';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

	let { data }: PageProps = $props();

	let vruAlerts = $state(true);
	let dailyDigest = $state(true);
	let dpwhForwarding = $state(false);
	let potholeThreshold = $state(50);
	let isSaved = $state(false);

	function saveSettings() {
		isSaved = true;
		setTimeout(() => {
			isSaved = false;
		}, 2500);
	}
</script>

<svelte:head>
	<title>Settings — SuriOS Municipal Civil Infrastructure</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between border-b border-border pb-4">
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

		<Button size="sm" onclick={saveSettings} class="h-8 text-xs font-medium">
			{isSaved ? 'Settings Saved' : 'Save Changes'}
		</Button>
	</div>

	<!-- Tabbed Settings Layout -->
	<Tabs value="appearance" class="space-y-6">
		<TabsList class="border border-border bg-card p-1">
			<TabsTrigger value="appearance" class="text-xs">Appearance</TabsTrigger>
			<TabsTrigger value="alerts" class="text-xs">Municipal Alerts</TabsTrigger>
			<TabsTrigger value="astm" class="text-xs">ASTM Tolerances</TabsTrigger>
			<TabsTrigger value="diagnostics" class="text-xs">AI Diagnostics</TabsTrigger>
		</TabsList>

		<!-- Appearance Tab -->
		<TabsContent value="appearance" class="space-y-4">
			<Card class="border-border bg-card shadow-none">
				<CardHeader class="pb-3">
					<CardTitle class="text-sm font-semibold tracking-tight">Display &amp; Theme Mode</CardTitle>
					<CardDescription class="text-xs text-muted-foreground">
						Select high-contrast dark or light themes optimized for direct outdoor sunlight and low-light control rooms.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
						<div class="space-y-0.5">
							<span class="text-xs font-medium text-foreground">Active Color Scheme</span>
							<p class="text-[11px] text-muted-foreground">Toggle between flat dark matte and clean light paper.</p>
						</div>
						<ThemeToggle />
					</div>

					<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
						<div class="space-y-0.5">
							<span class="text-xs font-medium text-foreground">Design System Compliance</span>
							<p class="text-[11px] text-muted-foreground">Strict zero-gradient charter, soft Inter typography, subtle micro-borders.</p>
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
					<CardTitle class="text-sm font-semibold tracking-tight">Emergency Hazard Routing</CardTitle>
					<CardDescription class="text-xs text-muted-foreground">
						Real-time dispatch alerts for Vulnerable Road User (VRU) threats in Santa Cruz.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-3">
					<label class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 cursor-pointer">
						<div class="space-y-0.5 pr-4">
							<span class="text-xs font-medium text-foreground">Critical VRU Threat Alerts</span>
							<p class="text-[11px] text-muted-foreground">Instant browser notification when potholes &gt;60mm or deep rutting are triaged.</p>
						</div>
						<input type="checkbox" bind:checked={vruAlerts} class="h-4 w-4 rounded border-border" />
					</label>

					<label class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 cursor-pointer">
						<div class="space-y-0.5 pr-4">
							<span class="text-xs font-medium text-foreground">Daily LGU Maintenance Digest</span>
							<p class="text-[11px] text-muted-foreground">Consolidated summary of reported vs. resolved defects across the Laguna corridor.</p>
						</div>
						<input type="checkbox" bind:checked={dailyDigest} class="h-4 w-4 rounded border-border" />
					</label>

					<label class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 cursor-pointer">
						<div class="space-y-0.5 pr-4">
							<span class="text-xs font-medium text-foreground">Automated DPWH District II Forwarding</span>
							<p class="text-[11px] text-muted-foreground">Relay national highway defects directly to DPWH maintenance dispatchers.</p>
						</div>
						<input type="checkbox" bind:checked={dpwhForwarding} class="h-4 w-4 rounded border-border" />
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
						Calibration parameters for Pothole and Alligator Cracking severity calculation.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2 p-3 rounded-lg border border-border bg-muted/20">
						<div class="flex items-center justify-between">
							<span class="text-xs font-medium text-foreground">Pothole High-Severity Threshold</span>
							<Badge variant="outline" class="text-xs font-mono">{potholeThreshold} mm</Badge>
						</div>
						<p class="text-[11px] text-muted-foreground">
							Defects deeper than this depth are automatically escalated to Hazard Severity 8+ and marked Critical VRU.
						</p>
						<input
							type="range"
							min="30"
							max="100"
							step="5"
							bind:value={potholeThreshold}
							class="w-full accent-primary"
						/>
					</div>

					<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs">
						<div class="space-y-0.5">
							<span class="font-medium text-foreground">Two-Wheeler Lethality Weight Multiplier</span>
							<p class="text-[11px] text-muted-foreground">Multiplies base distress severity for motorcycles, scooters, and tricycles.</p>
						</div>
						<Badge variant="secondary" class="font-mono text-xs">1.50x Weight</Badge>
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
						Live status of vision inference endpoints and database connectivity.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-2.5">
					<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs">
						<div class="flex items-center gap-2.5">
							<SparklesIcon class="h-4 w-4 text-primary" />
							<div>
								<span class="font-medium text-foreground">Google Gemini Vision Engine</span>
								<p class="text-[11px] text-muted-foreground">Model: {data.systemDiagnostics.geminiModel}</p>
							</div>
						</div>
						<Badge variant="outline" class="font-mono text-[10px] border-border text-foreground">
							{data.systemDiagnostics.geminiStatus}
						</Badge>
					</div>

					<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs">
						<div class="flex items-center gap-2.5">
							<CpuIcon class="h-4 w-4 text-primary" />
							<div>
								<span class="font-medium text-foreground">PostgreSQL Persistence</span>
								<p class="text-[11px] text-muted-foreground">{data.systemDiagnostics.databaseStatus}</p>
							</div>
						</div>
						<Badge variant="outline" class="font-mono text-[10px] border-border text-foreground">
							Connected (Port 5433)
						</Badge>
					</div>

					<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs">
						<div class="flex items-center gap-2.5">
							<ShieldCheckIcon class="h-4 w-4 text-primary" />
							<div>
								<span class="font-medium text-foreground">ASTM Standard Baseline</span>
								<p class="text-[11px] text-muted-foreground">{data.systemDiagnostics.astmStandard}</p>
							</div>
						</div>
						<Badge variant="outline" class="font-mono text-[10px] border-border text-foreground">
							DPWH Aligned
						</Badge>
					</div>
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</div>
