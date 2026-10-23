<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	let { data, form }: PageProps = $props();
	let role = $state(untrack(() => form?.role === 'OFFICER' ? 'OFFICER' : 'CITIZEN'));
	let submitting = $state(false);
</script>
<svelte:head><title>Create account — SuriOS</title></svelte:head>
<div class="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
	<div class="rounded-2xl border border-border bg-card p-5 sm:p-7">
		<h1 class="text-xl font-semibold">Create account</h1>
		<p class="mt-2 text-sm text-muted-foreground">Report public infrastructure concerns or apply to represent your government office.</p>
		{#if form?.error}<p role="alert" class="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{form.error}</p>{/if}
		<form method="POST" class="mt-6 space-y-4" use:enhance={() => { submitting = true; return async ({ update }) => { await update(); submitting = false; }; }}>
			<input type="hidden" name="redirectTo" value={data.redirectTo} />
			<fieldset><legend class="mb-2 text-sm font-medium">Account type</legend><div class="grid grid-cols-2 gap-3">{#each [['CITIZEN', 'Citizen'], ['OFFICER', 'Government']] as [value, label]}<label class="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm {role === value ? 'border-primary bg-primary/10 text-primary' : 'border-border'}"><input type="radio" name="role" {value} bind:group={role} class="accent-primary" />{label}</label>{/each}</div></fieldset>
			<div class="space-y-1.5"><label for="name" class="text-sm font-medium">Full name</label><Input id="name" name="name" value={form?.name || ''} required minlength={2} maxlength={120} autocomplete="name" class="min-h-11" /></div>
			<div class="space-y-1.5"><label for="email" class="text-sm font-medium">Email address</label><Input id="email" name="email" type="email" value={form?.email || ''} required maxlength={254} autocomplete="email" class="min-h-11" /></div>
			{#if role === 'OFFICER'}
				<div class="rounded-xl bg-secondary/50 p-4 space-y-4">
					<p class="text-sm text-muted-foreground">An administrator will review your office details and ID number before activating government access.</p>
					<div class="space-y-1.5"><label for="department" class="text-sm font-medium">Office / department</label><Input id="department" name="department" value={form?.department || ''} required minlength={2} maxlength={160} placeholder="Municipal Engineering Office" class="min-h-11" /></div>
					<div class="space-y-1.5"><label for="level" class="text-sm font-medium">Office level</label><select id="level" name="level" class="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="MUNICIPAL" selected={form?.level !== 'BARANGAY'}>Municipal / city</option><option value="BARANGAY" selected={form?.level === 'BARANGAY'}>Barangay</option></select></div>
					<div class="space-y-1.5"><label for="jurisdiction" class="text-sm font-medium">Work location / jurisdiction</label><Input id="jurisdiction" name="jurisdiction" value={form?.jurisdiction || ''} required minlength={2} maxlength={120} placeholder="Santa Cruz, Laguna — or your barangay" class="min-h-11" /><p class="text-xs text-muted-foreground">The municipality, city, or barangay your office serves.</p></div>
					<div class="space-y-1.5"><label for="badgeNumber" class="text-sm font-medium">Government ID number</label><Input id="badgeNumber" name="badgeNumber" value={form?.badgeNumber || ''} required minlength={2} maxlength={80} class="min-h-11" /><p class="text-xs text-muted-foreground">For admin review. Your ID number is kept private.</p></div>
				</div>
			{/if}
			<div class="space-y-1.5"><label for="password" class="text-sm font-medium">Password</label><Input id="password" name="password" type="password" autocomplete="new-password" required minlength={8} maxlength={256} aria-describedby="password-help" class="min-h-11" /><p id="password-help" class="text-xs text-muted-foreground">At least 8 characters.</p></div>
			<Button type="submit" disabled={submitting} class="min-h-11 w-full">{submitting ? 'Creating account…' : role === 'OFFICER' ? 'Submit government application' : 'Create citizen account'}</Button>
		</form>
		<p class="mt-6 text-center text-sm text-muted-foreground">Already registered? <a href="/login" class="font-medium text-primary underline underline-offset-4">Sign in</a></p>
	</div>
</div>
