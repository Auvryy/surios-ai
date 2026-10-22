<script lang="ts">
	import type { ActionData, PageProps } from './$types.js';
	import { enhance } from '$app/forms';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	import UserIcon from '@lucide/svelte/icons/user';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import KeyIcon from '@lucide/svelte/icons/key';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import AlertCircleIcon from '@lucide/svelte/icons/circle-alert';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import UsersIcon from '@lucide/svelte/icons/users';
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	let { data, form }: PageProps & { form: ActionData } = $props();

	let name = $state('');
	let email = $state('');
	let department = $state('');
	let badgeNumber = $state('');

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	let isUpdating = $state(false);
	let isChangingPassword = $state(false);
	let isSwitchingPersona = $state<string | null>(null);

	$effect(() => {
		if (data.user) {
			name = data.user.name || '';
			email = data.user.email || '';
			department = data.user.department || '';
			badgeNumber = data.user.badgeNumber || '';
		}
	});

	function getInitials(nameStr: string): string {
		if (!nameStr) return 'SO';
		const parts = nameStr.trim().split(/\s+/);
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	}
</script>

<svelte:head>
	<title>Municipal Profile — SuriOS</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between border-b border-border pb-4">
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<Badge variant="outline" class="text-xs font-mono border-border">
					Personnel ID
				</Badge>
				<span class="text-xs text-muted-foreground">Municipal Registry</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">
				Civil Staff Profile
			</h1>
		</div>

		<Badge variant="secondary" class="text-xs font-mono px-2.5 py-1 border-border">
			{data.user?.role}
		</Badge>
	</div>

	<!-- Form Status Feedback -->
	{#if form?.error}
		<Alert variant="destructive" class="py-2.5 px-3">
			<div class="flex items-center gap-2">
				<AlertCircleIcon class="h-4 w-4 shrink-0" />
				<AlertDescription class="text-xs font-medium">{form.error}</AlertDescription>
			</div>
		</Alert>
	{/if}

	{#if form?.success}
		<Alert class="py-2.5 px-3 border-border bg-secondary/50 text-foreground">
			<div class="flex items-center gap-2">
				<CheckCircleIcon class="h-4 w-4 text-primary shrink-0" />
				<AlertDescription class="text-xs font-medium">{form.success}</AlertDescription>
			</div>
		</Alert>
	{/if}

	<!-- Personnel Identity Card (Authentic shadcn Card) -->
	<Card class="border-border bg-card shadow-none">
		<CardContent class="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
			<div class="flex items-center gap-4">
				<div class="h-14 w-14 rounded-lg bg-secondary text-foreground font-bold text-lg flex items-center justify-center border border-border shrink-0 tracking-tight">
					{getInitials(name || data.user?.name || '')}
				</div>
				<div class="space-y-0.5">
					<div class="flex items-center gap-2">
						<h3 class="text-base font-bold text-foreground">{name || data.user?.name}</h3>
						{#if badgeNumber || data.user?.badgeNumber}
							<Badge variant="outline" class="text-[10px] font-mono border-border">
								{badgeNumber || data.user?.badgeNumber}
							</Badge>
						{/if}
					</div>
					<p class="text-xs text-muted-foreground">{email || data.user?.email}</p>
					<p class="text-xs text-muted-foreground">
						{department || data.user?.department || 'Civil Infrastructure & Transport Directorate'}
					</p>
				</div>
			</div>

			<div class="flex flex-col items-start sm:items-end text-xs text-muted-foreground font-mono">
				<span class="flex items-center gap-1.5 font-medium text-foreground">
					<BadgeCheckIcon class="h-3.5 w-3.5 text-primary" />
					<span>Active Municipal Officer</span>
				</span>
				<span class="text-[11px] opacity-75 mt-0.5">Santa Cruz, Laguna Jurisdiction</span>
			</div>
		</CardContent>
	</Card>

	<!-- Quick 1-Click Persona Switcher for Hackathon Demonstrations -->
	<div class="space-y-2.5">
		<div class="flex items-center justify-between">
			<span class="text-xs font-medium text-foreground flex items-center gap-1.5">
				<UsersIcon class="h-3.5 w-3.5 text-muted-foreground" />
				<span>1-Click Demo Persona Switcher</span>
			</span>
			<span class="text-[10px] text-muted-foreground">Switch municipal roles instantly for evaluation</span>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
			{#each data.personas as persona}
				{@const isCurrent = data.user?.email === persona.email}
				<form
					method="POST"
					action="?/switchPersona"
					use:enhance={() => {
						isSwitchingPersona = persona.email;
						return async ({ update }) => {
							isSwitchingPersona = null;
							await update();
						};
					}}
					class="w-full"
				>
					<input type="hidden" name="email" value={persona.email} />
					<button
						type="submit"
						disabled={isCurrent || isSwitchingPersona !== null}
						class="w-full rounded-xl border p-3.5 text-left transition-all duration-150 flex flex-col justify-between gap-2.5 cursor-pointer {isCurrent
							? 'border-foreground bg-secondary/50 shadow-xs'
							: 'border-border bg-card hover:border-foreground/30 hover:bg-secondary/20'}"
					>
						<div class="space-y-1">
							<div class="flex items-center justify-between gap-1">
								<span class="text-xs font-semibold text-foreground">
									{persona.name}
								</span>
								<Badge
									variant={persona.role === 'ENGINEER' ? 'default' : persona.role === 'OFFICER' ? 'secondary' : 'outline'}
									class="text-[9px] font-mono px-1.5 py-0"
								>
									{persona.role}
								</Badge>
							</div>
							<p class="text-[11px] text-muted-foreground line-clamp-1">
								{persona.department || 'Civil Infrastructure'}
							</p>
						</div>

						<div class="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/60">
							<span class="font-mono truncate">{persona.badgeNumber || persona.email}</span>
							<span class="font-medium shrink-0 ml-1">
								{#if isCurrent}
									<span class="text-foreground">✓ Active</span>
								{:else if isSwitchingPersona === persona.email}
									<RefreshCwIcon class="h-3 w-3 animate-spin inline mr-1" /> Switching...
								{:else}
									Switch &rarr;
								{/if}
							</span>
						</div>
					</button>
				</form>
			{/each}
		</div>
	</div>

	<!-- Live Municipal Activity Statistics (Queried from Database) -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		<Card class="border-border bg-card p-3.5 space-y-1 shadow-none">
			<span class="text-[11px] text-muted-foreground">Reports Cataloged</span>
			<div class="text-xl font-bold text-foreground font-mono">{data.stats.totalSubmissions}</div>
			<p class="text-[10px] text-muted-foreground">Geotagged road defects</p>
		</Card>

		<Card class="border-border bg-card p-3.5 space-y-1 shadow-none">
			<span class="text-[11px] text-muted-foreground">Critical VRU Hazards</span>
			<div class="text-xl font-bold text-destructive font-mono">{data.stats.criticalHazards}</div>
			<p class="text-[10px] text-muted-foreground">Severity 8–10 alerts</p>
		</Card>

		<Card class="border-border bg-card p-3.5 space-y-1 shadow-none">
			<span class="text-[11px] text-muted-foreground">Active Dispatches</span>
			<div class="text-xl font-bold text-foreground font-mono">{data.stats.dispatchesAuthorized}</div>
			<p class="text-[10px] text-muted-foreground">Municipal work orders</p>
		</Card>

		<Card class="border-border bg-card p-3.5 space-y-1 shadow-none">
			<span class="text-[11px] text-muted-foreground">Community Upvotes</span>
			<div class="text-xl font-bold text-foreground font-mono">{data.stats.communityUpvotes}</div>
			<p class="text-[10px] text-muted-foreground">Consensus confirmations</p>
		</Card>
	</div>

	<!-- Municipal Role & Authorized Privileges -->
	<Card class="border-border bg-card shadow-none">
		<CardHeader class="pb-3">
			<CardTitle class="text-sm font-semibold tracking-tight">Authorized Municipal Powers</CardTitle>
			<CardDescription class="text-xs text-muted-foreground">
				Jurisdictional authorizations assigned to your personnel level ({data.user?.role}) under UN SDG 9.1.
			</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
				{#each data.privileges as priv}
					<div class="flex items-center gap-2 p-2 rounded-md border border-border/70 bg-muted/20 text-xs">
						<ShieldCheckIcon class="h-3.5 w-3.5 text-primary shrink-0" />
						<span class="text-foreground">{priv}</span>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- Account Settings Grids -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- Update Details -->
		<Card class="border-border bg-card shadow-none">
			<CardHeader class="pb-3">
				<CardTitle class="text-sm font-semibold tracking-tight">General Information</CardTitle>
				<CardDescription class="text-xs text-muted-foreground">
					Update your official display name, email, and municipal office unit.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					method="POST"
					action="?/updateProfile"
					use:enhance={() => {
						isUpdating = true;
						return async ({ update }) => {
							isUpdating = false;
							await update();
						};
					}}
					class="space-y-3"
				>
					<div class="space-y-1">
						<label for="name" class="text-xs font-medium text-foreground">Official Full Name</label>
						<Input id="name" name="name" bind:value={name} class="h-8 text-xs" required />
					</div>

					<div class="space-y-1">
						<label for="email" class="text-xs font-medium text-foreground">Email Address</label>
						<Input id="email" name="email" type="email" bind:value={email} class="h-8 text-xs" required />
					</div>

					<div class="space-y-1">
						<label for="department" class="text-xs font-medium text-foreground">Department / Municipal Office</label>
						<Input id="department" name="department" bind:value={department} class="h-8 text-xs" placeholder="e.g. Santa Cruz Municipal Engineering Office" />
					</div>

					<div class="space-y-1">
						<label for="badgeNumber" class="text-xs font-medium text-foreground">Personnel Badge / Field ID</label>
						<Input id="badgeNumber" name="badgeNumber" bind:value={badgeNumber} class="h-8 text-xs font-mono" placeholder="e.g. SC-MEO-041" />
					</div>

					<Button type="submit" disabled={isUpdating} size="sm" class="h-8 text-xs font-medium w-full mt-2">
						{#if isUpdating}
							<RefreshCwIcon class="h-3 w-3 animate-spin mr-1.5" />
							<span>Saving to Municipal Registry...</span>
						{:else}
							<span>Save Profile Changes</span>
						{/if}
					</Button>
				</form>
			</CardContent>
		</Card>

		<!-- Change Password -->
		<Card class="border-border bg-card shadow-none">
			<CardHeader class="pb-3">
				<CardTitle class="text-sm font-semibold tracking-tight">Security &amp; Credentials</CardTitle>
				<CardDescription class="text-xs text-muted-foreground">
					Rotate your password using NIST-compliant salted scrypt cryptographic hashing.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					method="POST"
					action="?/changePassword"
					use:enhance={() => {
						isChangingPassword = true;
						return async ({ update }) => {
							isChangingPassword = false;
							currentPassword = '';
							newPassword = '';
							confirmPassword = '';
							await update();
						};
					}}
					class="space-y-3"
				>
					<div class="space-y-1">
						<label for="currentPassword" class="text-xs font-medium text-foreground">Current Password</label>
						<Input
							id="currentPassword"
							name="currentPassword"
							type="password"
							bind:value={currentPassword}
							placeholder="••••••••••••"
							class="h-8 text-xs font-mono"
							required
						/>
					</div>

					<div class="space-y-1">
						<label for="newPassword" class="text-xs font-medium text-foreground">New Password</label>
						<Input
							id="newPassword"
							name="newPassword"
							type="password"
							bind:value={newPassword}
							placeholder="Minimum 8 characters"
							class="h-8 text-xs font-mono"
							required
						/>
					</div>

					<div class="space-y-1">
						<label for="confirmPassword" class="text-xs font-medium text-foreground">Confirm New Password</label>
						<Input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							bind:value={confirmPassword}
							placeholder="Repeat new password"
							class="h-8 text-xs font-mono"
							required
						/>
					</div>

					<Button type="submit" disabled={isChangingPassword} size="sm" class="h-8 text-xs font-medium w-full mt-2">
						{#if isChangingPassword}
							<RefreshCwIcon class="h-3 w-3 animate-spin mr-1.5" />
							<span>Encrypting &amp; Updating...</span>
						{:else}
							<span>Update Password</span>
						{/if}
					</Button>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
