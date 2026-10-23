<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	let { form }: PageProps = $props();
	let token = $state('');
	let ready = $state(false);
	let busy = $state(false);
	onMount(() => { token = new URLSearchParams(window.location.hash.slice(1)).get('token') || ''; ready = true; void goto('/reset-password', { state: {}, shallow: true, replace: true }); });
</script>
<svelte:head><title>Choose a new password — SuriOS</title></svelte:head>
<div class="mx-auto max-w-sm px-4 py-12"><h1 class="text-xl font-semibold">Choose a new password</h1>
	{#if form?.success}<p role="status" class="mt-4 text-sm text-primary">{form.success}</p><Button href="/login" class="mt-5 h-11 w-full">Sign in</Button>
	{:else if ready && token}<form method="POST" class="mt-6 space-y-4" use:enhance={() => { busy = true; return async ({ update }) => { try { await update(); } finally { busy = false; } }; }}>
		<input type="hidden" name="token" value={token} />
		<div class="space-y-2"><label for="new-password" class="text-sm font-medium">New password</label><Input id="new-password" name="newPassword" type="password" autocomplete="new-password" minlength={8} maxlength={128} required class="h-11" /></div>
		<div class="space-y-2"><label for="confirm-password" class="text-sm font-medium">Confirm new password</label><Input id="confirm-password" name="confirmPassword" type="password" autocomplete="new-password" minlength={8} maxlength={128} required class="h-11" /></div>
		{#if form?.error}<p role="alert" class="text-sm text-destructive">{form.error}</p>{/if}
		<Button type="submit" class="h-11 w-full" disabled={busy}>{busy ? 'Resetting…' : 'Reset password'}</Button>
	</form>{:else if ready}<p class="mt-4 text-sm text-muted-foreground">Open the reset link from your email.</p><Button href="/forgot-password" variant="outline" class="mt-4 h-11">Request a new link</Button>{/if}
</div>
