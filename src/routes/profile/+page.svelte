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
	import LayersIcon from '@lucide/svelte/icons/layers';

	let { data, form }: PageProps & { form: ActionData } = $props();

	let name = $state('');
	let department = $state('');
	let currentPassword = $state('');
	let newPassword = $state('');
	let isUpdating = $state(false);
	let isChangingPassword = $state(false);

	$effect(() => {
		if (data.user) {
			name = data.user.name || '';
			department = data.user.department || '';
		}
	});
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

		<Badge variant="secondary" class="text-xs font-mono px-2 py-1 border-border">
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
				<div class="h-14 w-14 rounded-lg bg-secondary text-foreground font-bold text-xl flex items-center justify-center border border-border shrink-0">
					{data.user?.name.charAt(0)}
				</div>
				<div class="space-y-0.5">
					<div class="flex items-center gap-2">
						<h3 class="text-base font-bold text-foreground">{data.user?.name}</h3>
						{#if data.user?.badgeNumber}
							<Badge variant="outline" class="text-[10px] font-mono border-border">
								{data.user?.badgeNumber}
							</Badge>
						{/if}
					</div>
					<p class="text-xs text-muted-foreground">{data.user?.email}</p>
					<p class="text-xs text-muted-foreground">
						{data.user?.department || 'Civil Infrastructure & Transport Directorate'}
					</p>
				</div>
			</div>

			<div class="flex flex-col items-start sm:items-end text-xs text-muted-foreground font-mono">
				<span>Status: Active Official</span>
				<span class="text-[11px] opacity-75">SDG 9 Municipal Registry</span>
			</div>
		</CardContent>
	</Card>

	<!-- Activity Statistics -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		<Card class="border-border bg-card p-3.5 space-y-1 shadow-none">
			<span class="text-[11px] text-muted-foreground">Reports Filed</span>
			<div class="text-xl font-bold text-foreground">{data.stats.totalSubmissions}</div>
			<p class="text-[10px] text-muted-foreground">Geotagged hazards</p>
		</Card>

		<Card class="border-border bg-card p-3.5 space-y-1 shadow-none">
			<span class="text-[11px] text-muted-foreground">Verified Fixes</span>
			<div class="text-xl font-bold text-foreground">{data.stats.verifiedDistresses}</div>
			<p class="text-[10px] text-muted-foreground">ASTM standard</p>
		</Card>

		<Card class="border-border bg-card p-3.5 space-y-1 shadow-none">
			<span class="text-[11px] text-muted-foreground">Dispatches Approved</span>
			<div class="text-xl font-bold text-foreground">{data.stats.dispatchesAuthorized}</div>
			<p class="text-[10px] text-muted-foreground">Work orders issued</p>
		</Card>

		<Card class="border-border bg-card p-3.5 space-y-1 shadow-none">
			<span class="text-[11px] text-muted-foreground">Community Upvotes</span>
			<div class="text-xl font-bold text-foreground">{data.stats.communityUpvotes}</div>
			<p class="text-[10px] text-muted-foreground">Consensus points</p>
		</Card>
	</div>

	<!-- Municipal Role & Authorized Privileges -->
	<Card class="border-border bg-card shadow-none">
		<CardHeader class="pb-3">
			<CardTitle class="text-sm font-semibold tracking-tight">Authorized Municipal Roles</CardTitle>
			<CardDescription class="text-xs text-muted-foreground">
				Operational permissions assigned to your account in the Santa Cruz jurisdiction.
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
					Update your official display name and agency unit.
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
						<label for="name" class="text-xs font-medium text-foreground">Full Name</label>
						<Input id="name" name="name" bind:value={name} class="h-8 text-xs" required />
					</div>

					<div class="space-y-1">
						<label for="department" class="text-xs font-medium text-foreground">Department / Office</label>
						<Input id="department" name="department" bind:value={department} class="h-8 text-xs" />
					</div>

					<Button type="submit" disabled={isUpdating} size="sm" class="h-8 text-xs font-medium w-full mt-2">
						{isUpdating ? 'Saving...' : 'Save Profile Changes'}
					</Button>
				</form>
			</CardContent>
		</Card>

		<!-- Change Password -->
		<Card class="border-border bg-card shadow-none">
			<CardHeader class="pb-3">
				<CardTitle class="text-sm font-semibold tracking-tight">Security &amp; Credentials</CardTitle>
				<CardDescription class="text-xs text-muted-foreground">
					Rotate your password using NIST-compliant salted scrypt hashing.
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

					<Button type="submit" disabled={isChangingPassword} size="sm" class="h-8 text-xs font-medium w-full mt-2">
						{isChangingPassword ? 'Updating Password...' : 'Update Password'}
					</Button>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
