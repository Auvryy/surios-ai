<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	let { data, form }: PageProps = $props();
	let busy = $state(false);
</script>

<svelte:head>
	<title>Verify email — SuriOS</title>
	<meta name="referrer" content="no-referrer" />
</svelte:head>

<div class="mx-auto max-w-md px-4 py-12">
	<div class="rounded-2xl border border-border bg-card p-6 sm:p-8">
		<h1 class="text-xl font-semibold">{data.verified ? 'Email verified' : data.token ? 'Confirm your email' : 'Email verification'}</h1>
		{#if form?.error}<p role="alert" class="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{form.error}</p>{/if}
		{#if data.verified}
			<p role="status" class="mt-3 text-sm leading-6 text-muted-foreground">Your email is confirmed. You can now sign in to SuriOS.</p>
			<a href="/login" class="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4">Continue to sign in</a>
		{:else if data.token}
			<p class="mt-3 text-sm leading-6 text-muted-foreground">Confirm this email address to finish creating your account. The link can be used once.</p>
			<form method="POST" action="?/verify" class="mt-6" use:enhance={() => { busy = true; return async ({ update }) => { try { await update(); } finally { busy = false; } }; }}>
				<input type="hidden" name="token" value={data.token} />
				<Button type="submit" disabled={busy} class="min-h-11 w-full">{busy ? 'Confirming…' : 'Confirm email address'}</Button>
			</form>
			<a href="/verify-email" class="mt-4 inline-flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4">Request a new verification link</a>
		{:else}
			{#if data.sent || form?.resent}
				<p role="status" class="mt-3 text-sm leading-6 text-muted-foreground">If your account needs verification, check your inbox for a link. It may take a few minutes to arrive.</p>
			{:else}
				<p class="mt-3 text-sm leading-6 text-muted-foreground">Enter the email address you used to sign up and we’ll send a fresh verification link if the account still needs one.</p>
			{/if}
			{#if !data.mailAvailable}<p class="mt-4 text-sm text-destructive">Email delivery is not configured right now. Please try again later.</p>{/if}
			<form method="POST" action="?/resend" class="mt-6 space-y-4" use:enhance={() => { busy = true; return async ({ update }) => { try { await update(); } finally { busy = false; } }; }}>
				<div class="space-y-2"><label for="email" class="text-sm font-medium">Email address</label><Input id="email" name="email" type="email" autocomplete="email" maxlength={254} required class="min-h-11" /></div>
				<Button type="submit" disabled={busy || !data.mailAvailable} class="min-h-11 w-full">{busy ? 'Sending…' : 'Send verification link'}</Button>
			</form>
			<a href="/login" class="mt-4 inline-flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4">Back to sign in</a>
		{/if}
	</div>
</div>
