<script lang="ts">
	import type { ActionData, PageProps } from './$types.js';
	import { enhance } from '$app/forms';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import LockIcon from '@lucide/svelte/icons/lock';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	let { data, form }: PageProps & { form: ActionData } = $props();

	let email = $state('');
	let password = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (form?.email) {
			email = form.email;
		}
	});

	function fillCredentials(testEmail: string) {
		email = testEmail;
		password = 'Password123!';
	}
</script>

<svelte:head>
	<title>Sign In — SuriOS Municipal Platform</title>
</svelte:head>

<div class="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
	<div class="w-full max-w-md space-y-6">
		<Card class="border-border bg-card shadow-none">
			<CardHeader class="space-y-1.5 pb-4">
				<div class="flex items-center justify-between">
					<CardTitle class="text-lg font-semibold tracking-tight">Sign In</CardTitle>
					<Badge variant="outline" class="text-[10px] uppercase font-mono tracking-wider border-border">
						Civil Access
					</Badge>
				</div>
				<CardDescription class="text-xs text-muted-foreground">
					Enter your municipal credentials or community login to access the dispatch center.
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
							placeholder="officer@surios.gov"
							class="h-9 text-xs"
						/>
					</div>

					<div class="space-y-1.5">
						<div class="flex items-center justify-between">
							<label for="password" class="text-xs font-medium text-foreground">
								Password
							</label>
						</div>
						<Input
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
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
							<span>Authenticating...</span>
						{:else}
							<span>Continue</span>
							<ArrowRightIcon class="ml-1.5 h-3.5 w-3.5" />
						{/if}
					</Button>
				</form>

				<!-- Instant Quick-Fill Test Credentials -->
				<div class="pt-4 border-t border-border space-y-2">
					<span class="text-[11px] font-medium text-muted-foreground block">
						Quick Login (Demo Accounts):
					</span>
					<div class="grid grid-cols-3 gap-1.5">
						<button
							type="button"
							onclick={() => fillCredentials('engineer@surios.gov')}
							class="flex flex-col items-center justify-center p-2 rounded-md border border-border bg-muted/40 hover:bg-secondary text-left transition-colors cursor-pointer"
						>
							<span class="text-[11px] font-medium text-foreground">Engineer</span>
							<span class="text-[9px] text-muted-foreground">Admin</span>
						</button>

						<button
							type="button"
							onclick={() => fillCredentials('inspector@surios.gov')}
							class="flex flex-col items-center justify-center p-2 rounded-md border border-border bg-muted/40 hover:bg-secondary text-left transition-colors cursor-pointer"
						>
							<span class="text-[11px] font-medium text-foreground">Inspector</span>
							<span class="text-[9px] text-muted-foreground">Officer</span>
						</button>

						<button
							type="button"
							onclick={() => fillCredentials('citizen@surios.gov')}
							class="flex flex-col items-center justify-center p-2 rounded-md border border-border bg-muted/40 hover:bg-secondary text-left transition-colors cursor-pointer"
						>
							<span class="text-[11px] font-medium text-foreground">Citizen</span>
							<span class="text-[9px] text-muted-foreground">Reporter</span>
						</button>
					</div>
				</div>
			</CardContent>

			<CardFooter class="pt-2 pb-4 border-t border-border flex items-center justify-center text-xs text-muted-foreground">
				<span>Need an account?</span>
				<a href="/register" class="ml-1.5 font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors">
					Register here
				</a>
			</CardFooter>
		</Card>

		<div class="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
			<LockIcon class="h-3 w-3" />
			<span>Secured via timing-safe cryptographic hashing (NIST Scrypt)</span>
		</div>
	</div>
</div>
