<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	let { data, form }: PageProps = $props();
	let busy = $state(false);
</script>
<svelte:head><title>Reset password — SuriOS</title></svelte:head>
<div class="mx-auto max-w-sm px-4 py-12"><h1 class="text-xl font-semibold">Reset password</h1><p class="mt-2 text-sm leading-6 text-muted-foreground">We’ll email you a link to choose a new password.</p>
	<form method="POST" class="mt-6 space-y-4" use:enhance={() => { busy = true; return async ({ update }) => { try { await update(); } finally { busy = false; } }; }}>
		<div class="space-y-2"><label for="email" class="text-sm font-medium">Email address</label><Input id="email" name="email" type="email" autocomplete="email" maxlength={254} required class="h-11" /></div>
		{#if !data.mailAvailable}<p class="text-sm text-muted-foreground">Password recovery email is currently unavailable. Try again later.</p>{/if}
		{#if form?.error}<p role="alert" class="text-sm text-destructive">{form.error}</p>{:else if form?.success}<p role="status" class="text-sm text-primary">{form.success}</p>{/if}
		<Button type="submit" class="h-11 w-full" disabled={busy || !data.mailAvailable}>{busy ? 'Sending…' : 'Email reset link'}</Button>
	</form><a href="/login" class="mt-4 inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground">Back to sign in</a>
</div>
