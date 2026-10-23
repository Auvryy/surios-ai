<script lang="ts">
	import type { ActionData, PageProps } from './$types.js';
	import { enhance } from '$app/forms';
	import { dev } from '$app/env';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';

	let { data, form }: PageProps & { form: ActionData } = $props();

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let role = $state<'CITIZEN' | 'OFFICER' | 'ENGINEER'>('CITIZEN');
	let department = $state('');
	let isSubmitting = $state(false);
	const availableRoles = dev ? ['CITIZEN', 'OFFICER', 'ENGINEER'] as const : ['CITIZEN'] as const;

	$effect(() => {
		if (form) {
			if (form.name) name = form.name;
			if (form.email) email = form.email;
			if (form.role === 'CITIZEN' || form.role === 'OFFICER' || form.role === 'ENGINEER') {
				role = form.role;
			}
			if (form.department) department = form.department;
		}
	});

	const roleDescriptions: Record<string, string> = {
		CITIZEN: 'Submit hazard reports, track status, and verify completed road repairs.',
		OFFICER: 'Field safety inspector. Review AI severity ratings and dispatch repair crews.',
		ENGINEER: 'Municipal engineering administrator. Manage lifecycle, standards, and contractors.'
	};
</script>

<svelte:head>
	<title>Register Account — SuriOS Municipal Platform</title>
</svelte:head>

<div class="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
	<div class="w-full max-w-lg space-y-6">
		<Card class="border-border bg-card shadow-none">
			<CardHeader class="space-y-1.5 pb-4">
				<div class="flex items-center justify-between">
					<CardTitle class="text-lg font-semibold tracking-tight">Create Account</CardTitle>
					<Badge variant="outline" class="text-[10px] uppercase font-mono tracking-wider border-border">
						Onboarding
					</Badge>
				</div>
				<CardDescription class="text-xs text-muted-foreground">
					Register as a citizen reporter or municipal staff member.
				</CardDescription>
			</CardHeader>

			<CardContent class="space-y-4">
				{#if form?.error}
					<Alert variant="destructive" class="py-2.5 px-3 border-destructive/30 bg-destructive/10 text-destructive">
						<div class="flex items-center gap-2">
							<ShieldAlertIcon class="h-4 w-4 shrink-0" />
							<AlertDescription class="text-xs font-medium">
								{form.error}
							</AlertDescription>
						</div>
					</Alert>
				{/if}

				<form
					method="POST"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							isSubmitting = false;
							await update();
						};
					}}
					class="space-y-3.5"
				>
					<input type="hidden" name="redirectTo" value={data.redirectTo} />

					<!-- Role Selection -->
					<div class="space-y-1.5">
						<label for="role-selector" class="text-xs font-medium text-foreground">
							Account Type & Municipal Role
						</label>
						<div class="grid grid-cols-3 gap-2">
							{#each availableRoles as r}
								<button
									type="button"
									onclick={() => (role = r)}
									class="flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer {role === r
										? 'border-primary bg-primary/10 text-primary font-semibold'
										: 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'}"
								>
									<span>{r === 'CITIZEN' ? 'Citizen' : r === 'OFFICER' ? 'Inspector' : 'Engineer'}</span>
									<span class="text-[9px] font-normal opacity-70 mt-0.5">
										{r === 'CITIZEN' ? 'Public' : r === 'OFFICER' ? 'Field' : 'Admin'}
									</span>
								</button>
							{/each}
						</div>
						<input type="hidden" name="role" value={role} />
						<p class="text-[11px] text-muted-foreground mt-1">
							{roleDescriptions[role]}
						</p>
					</div>

					<div class="space-y-1.5">
						<label for="name" class="text-xs font-medium text-foreground">
							Full name
						</label>
						<Input
							id="name"
							name="name"
							type="text"
							required
							bind:value={name}
							placeholder="e.g. Maria Santos"
							class="h-9 text-xs"
						/>
					</div>

					<div class="space-y-1.5">
						<label for="email" class="text-xs font-medium text-foreground">
							Email address
						</label>
						<Input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={email}
							placeholder="maria.santos@surios.gov"
							class="h-9 text-xs"
						/>
					</div>

					{#if role !== 'CITIZEN'}
						<div class="space-y-1.5">
							<label for="department" class="text-xs font-medium text-foreground">
								Agency / Department
							</label>
							<Input
								id="department"
								name="department"
								type="text"
								bind:value={department}
								placeholder="e.g. Santa Cruz Municipal Engineering Office"
								class="h-9 text-xs"
							/>
						</div>
					{/if}

					<div class="space-y-1.5">
						<label for="password" class="text-xs font-medium text-foreground">
							Password (minimum 8 characters)
						</label>
						<Input
							id="password"
							name="password"
							type="password"
							autocomplete="new-password"
							required
							bind:value={password}
							placeholder="••••••••••••"
							class="h-9 text-xs font-mono"
						/>
					</div>

					<Button
						type="submit"
						disabled={isSubmitting}
						class="w-full h-9 text-xs font-medium mt-2"
					>
						{#if isSubmitting}
							<span>Creating Account...</span>
						{:else}
							<UserPlusIcon class="mr-1.5 h-3.5 w-3.5" />
							<span>Register Account</span>
						{/if}
					</Button>
				</form>
			</CardContent>

			<CardFooter class="pt-2 pb-4 border-t border-border flex items-center justify-center text-xs text-muted-foreground">
				<span>Already have an account?</span>
				<a href="/login" class="ml-1.5 font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors">
					Sign in here
				</a>
			</CardFooter>
		</Card>
	</div>
</div>
