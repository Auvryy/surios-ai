<script lang="ts">
	import OtpInput from '$lib/components/auth/otp-input.svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	let { data, form }: PageProps = $props();
	let busy = $state(false);
	let resetOpen = $state(false);
	let code = $state('');
	$effect(() => { if (form?.codePending) resetOpen = true; });
</script>

<svelte:head><title>Reset password — SuriOS</title></svelte:head>
<div class="mx-auto max-w-sm px-4 py-12">
	<h1 class="text-xl font-semibold">Reset password</h1>
	<p class="mt-2 text-sm leading-6 text-muted-foreground">We’ll email you a 6-digit code to choose a new password.</p>
	<form method="POST" action="?/requestCode" class="mt-6 space-y-4" use:enhance={() => { busy = true; return async ({ update }) => { try { await update(); } finally { busy = false; } }; }}>
		<div class="space-y-2"><label for="email" class="text-sm font-medium">Email address</label><Input id="email" name="email" type="email" autocomplete="email" maxlength={254} required class="h-11" /></div>
		{#if !data.mailAvailable}<p class="text-sm text-muted-foreground">Password recovery email is currently unavailable. Try again later.</p>{/if}
		{#if form?.error && !form?.codePending}<p role="alert" class="text-sm text-destructive">{form.error}</p>{/if}
		<Button type="submit" class="h-11 w-full" disabled={busy || !data.mailAvailable}>{busy ? 'Sending…' : 'Send reset code'}</Button>
	</form>
	<a href="/login" class="mt-4 inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground">Back to sign in</a>
</div>

<Dialog bind:open={resetOpen}>
	<DialogContent class="max-h-[90svh] overflow-y-auto sm:max-w-sm" showCloseButton={!busy} onInteractOutside={(event) => { if (busy) event.preventDefault(); }} onEscapeKeydown={(event) => { if (busy) event.preventDefault(); }}>
		<DialogHeader><DialogTitle>Choose a new password</DialogTitle><DialogDescription>Enter the code sent to {form?.email || 'your email address'}, then choose a new password.</DialogDescription></DialogHeader>
		{#if form?.error}<p role="alert" class="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{form.error}</p>{/if}
		<form method="POST" action="?/verify" class="space-y-3" use:enhance={() => { busy = true; return async ({ update }) => { try { await update(); } finally { busy = false; } }; }}>
			<input type="hidden" name="email" value={form?.email || ''} />
			<div class="space-y-1.5"><label for="reset-code" class="text-sm font-medium">Email code</label><OtpInput id="reset-code" bind:value={code} /></div>
			<div class="space-y-1.5"><label for="new-password" class="text-sm font-medium">New password</label><Input id="new-password" name="newPassword" type="password" autocomplete="new-password" minlength={8} maxlength={128} required class="min-h-11" /></div>
			<div class="space-y-1.5"><label for="confirm-password" class="text-sm font-medium">Confirm new password</label><Input id="confirm-password" name="confirmPassword" type="password" autocomplete="new-password" maxlength={128} required class="min-h-11" /></div>
			<Button type="submit" disabled={busy} class="min-h-11 w-full">{busy ? 'Resetting…' : 'Reset password'}</Button>
		</form>
		<form method="POST" action="?/resend" use:enhance={() => { busy = true; return async ({ update }) => { try { await update(); } finally { busy = false; } }; }}>
			<input type="hidden" name="email" value={form?.email || ''} />
			<Button type="submit" variant="outline" disabled={busy || !data.mailAvailable} class="min-h-11 w-full">{busy ? 'Sending…' : 'Resend code'}</Button>
		</form>
		{#if form?.notice}<p role="status" class="text-sm text-muted-foreground">{form.notice}</p>{/if}
	</DialogContent>
</Dialog>
