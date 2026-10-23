<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	let { data, form }: PageProps = $props();
	let emailComments = $state(false);
	let emailConfirmations = $state(false);
	let saving = $state(false);
	let changing = $state(false);
	let sending = $state(false);
	$effect(() => { emailComments = data.preferences.emailComments; emailConfirmations = data.preferences.emailConfirmations; });
</script>
<svelte:head><title>Settings — SuriOS</title></svelte:head>
<div class="min-h-full bg-muted/35 px-3 py-5 sm:px-5 sm:py-6">
	<div class="mx-auto max-w-[680px] space-y-4">
		<h1 class="px-1 text-xl font-semibold tracking-tight">Settings</h1>
		<section aria-labelledby="email-heading" class="rounded-xl border border-border bg-card p-4 sm:p-5">
			<h2 id="email-heading" class="text-sm font-semibold">Email notifications</h2>
			<p class="mt-1 break-words text-xs leading-5 text-muted-foreground">Send updates to {data.email}</p>
			<form method="POST" action="?/saveNotifications" class="mt-3" use:enhance={() => { saving = true; return async ({ update }) => { try { await update(); } finally { saving = false; } }; }}>
				<fieldset disabled={saving} class="divide-y divide-border">
					<label class="flex min-h-16 cursor-pointer items-center justify-between gap-4 py-3"><span><span class="block text-sm font-medium">Comments and replies</span><span class="mt-1 block text-xs leading-5 text-muted-foreground">Comments on your posts and replies to you.</span></span><input type="checkbox" name="emailComments" bind:checked={emailComments} class="size-5 shrink-0 accent-primary" /></label>
					<label class="flex min-h-16 cursor-pointer items-center justify-between gap-4 py-3"><span><span class="block text-sm font-medium">Post confirmations</span><span class="mt-1 block text-xs leading-5 text-muted-foreground">When someone confirms your road update.</span></span><input type="checkbox" name="emailConfirmations" bind:checked={emailConfirmations} class="size-5 shrink-0 accent-primary" /></label>
				</fieldset>
				{#if !data.mailAvailable}<p class="mt-2 text-xs leading-5 text-muted-foreground">Email delivery is currently unavailable. You can still save your preferences.</p>{/if}
				{#if form?.section === 'notifications' && form.success}<p role="status" class="mt-3 text-sm text-primary">{form.success}</p>{/if}
				<Button type="submit" variant="outline" class="mt-4 h-11" disabled={saving}>{saving ? 'Saving…' : 'Save preferences'}</Button>
			</form>
		</section>
		<section aria-labelledby="security-heading" class="rounded-xl border border-border bg-card p-4 sm:p-5">
			<h2 id="security-heading" class="text-sm font-semibold">Password & security</h2>
			<details class="mt-2" open={form?.section === 'password'}><summary class="flex min-h-11 cursor-pointer items-center justify-between text-sm font-medium">Change password<ChevronDownIcon aria-hidden="true" class="size-4 text-muted-foreground" /></summary>
				<form method="POST" action="?/changePassword" class="space-y-3 pb-4 pt-1" use:enhance={() => { changing = true; return async ({ update }) => { try { await update(); } finally { changing = false; } }; }}>
					<fieldset disabled={changing} class="space-y-3">
						<div class="space-y-1"><label for="current-password" class="text-xs font-medium">Current password</label><Input id="current-password" name="currentPassword" type="password" autocomplete="current-password" maxlength={128} required class="h-11" /></div>
						<div class="space-y-1"><label for="new-password" class="text-xs font-medium">New password</label><Input id="new-password" name="newPassword" type="password" autocomplete="new-password" minlength={8} maxlength={128} required class="h-11" /></div>
						<div class="space-y-1"><label for="confirm-password" class="text-xs font-medium">Confirm new password</label><Input id="confirm-password" name="confirmPassword" type="password" autocomplete="new-password" minlength={8} maxlength={128} required class="h-11" /></div>
					</fieldset>
					{#if form?.section === 'password'}{#if form.error}<p role="alert" class="text-sm text-destructive">{form.error}</p>{:else if form.success}<p role="status" class="text-sm text-primary">{form.success}</p>{/if}{/if}
					<Button type="submit" class="h-11" disabled={changing}>{changing ? 'Updating…' : 'Update password'}</Button>
				</form>
			</details>
			<div class="mt-2 border-t border-border pt-4"><p class="text-sm font-medium">Reset password by email</p><p class="mt-1 text-xs leading-5 text-muted-foreground">Forgot your current password? Request a secure reset link.</p>
				<form method="POST" action="?/sendResetLink" class="mt-3" use:enhance={() => { sending = true; return async ({ update }) => { try { await update(); } finally { sending = false; } }; }}><Button type="submit" variant="outline" class="h-11" disabled={sending || !data.mailAvailable}>{sending ? 'Sending…' : 'Email reset link'}</Button></form>
				{#if form?.section === 'recovery'}{#if form.error}<p role="alert" class="mt-3 text-sm text-destructive">{form.error}</p>{:else if form.success}<p role="status" class="mt-3 text-sm text-primary">{form.success}</p>{/if}{/if}
			</div>
		</section>
	</div>
</div>
