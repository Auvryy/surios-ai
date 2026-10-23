<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	let { data, form }: PageProps = $props();
	let filter = $state('PENDING');
	let busy = $state(false);
	const accounts = $derived(data.accounts.filter(account => filter === 'ALL' || account.accountStatus === filter));
	const pending = $derived(data.accounts.filter(account => account.accountStatus === 'PENDING').length);
</script>
<svelte:head><title>Account approvals — SuriOS</title></svelte:head>
<div class="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-8 sm:py-10">
	<header><p class="text-sm font-medium text-primary">Administration</p><h1 class="mt-1 text-2xl font-semibold">Account approvals</h1><p class="mt-2 text-sm text-muted-foreground">Review government applications and manage account access. {pending} pending.</p></header>
	{#if form?.error}<p role="alert" class="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{form.error}</p>{/if}
	{#if form?.success}<p role="status" class="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">{form.success}</p>{/if}
	<div class="flex items-center gap-3"><label for="status-filter" class="text-sm font-medium">Status</label><select id="status-filter" bind:value={filter} class="min-h-11 rounded-lg border border-input bg-background px-3 text-sm"><option value="PENDING">Pending applications</option><option value="ACTIVE">Active accounts</option><option value="INACTIVE">Inactive accounts</option><option value="REJECTED">Rejected applications</option><option value="ALL">All accounts</option></select></div>
	<div class="space-y-3">{#each accounts as account (account.id)}<article class="rounded-xl border border-border bg-card p-4 sm:p-5">
		<div class="flex flex-wrap items-start justify-between gap-3"><div class="min-w-0"><h2 class="break-words font-semibold">{account.name}</h2><p class="break-all text-sm text-muted-foreground">{account.email}</p></div><span class="rounded-full px-3 py-1 text-xs font-semibold {account.accountStatus === 'PENDING' ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground'}">{account.accountStatus.toLowerCase()}</span></div>
		<dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt class="text-muted-foreground">Account type</dt><dd>{account.role === 'CITIZEN' ? 'Citizen' : 'Government'}</dd></div>{#if account.role !== 'CITIZEN'}<div><dt class="text-muted-foreground">Office / department</dt><dd class="break-words">{account.department || 'Not provided'}</dd></div><div><dt class="text-muted-foreground">Work location</dt><dd class="break-words">{account.governmentProfile?.jurisdiction || 'Not provided'} {account.governmentProfile?.level === 'BARANGAY' ? '(Barangay)' : '(Municipal / city)'}</dd></div><div><dt class="text-muted-foreground">Government ID number</dt><dd class="break-all">{account.badgeNumber || 'Not provided'}</dd></div>{/if}</dl>
		{#if account.accountStatus !== 'REJECTED'}<form method="POST" action="?/update" class="mt-4 flex flex-wrap gap-2 border-t border-border pt-4" use:enhance={() => { busy = true; return async ({ update }) => { await update({ reset: false }); busy = false; }; }}><input type="hidden" name="id" value={account.id} />{#if account.accountStatus === 'PENDING'}<Button type="submit" name="decision" value="approve" disabled={busy} class="min-h-11">Approve government account</Button><Button type="submit" name="decision" value="reject" disabled={busy} variant="outline" class="min-h-11">Reject</Button>{:else}<Button type="submit" name="decision" value={account.accountStatus === 'ACTIVE' ? 'deactivate' : 'activate'} disabled={busy} variant="outline" class="min-h-11">{account.accountStatus === 'ACTIVE' ? 'Deactivate account' : 'Activate account'}</Button>{/if}</form>{/if}
	</article>{:else}<p class="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No accounts with this status.</p>{/each}</div>
</div>
