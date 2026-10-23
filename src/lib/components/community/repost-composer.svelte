<script lang="ts">
	import { untrack } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import ImageIcon from '@lucide/svelte/icons/image';
	import { isGovernment, pesos, budgetTotal, type CommunityRepost, type CommunityPost, type BudgetItem } from '$lib/types/community';
	let { open = $bindable(false), post, user, quote = null }: { quote?: CommunityRepost | null; open: boolean; post: CommunityPost; user: { id: string; role?: string } | null } = $props();
	const official = $derived(isGovernment(user?.role) && !quote);
	let body = $state('');
	let status = $state(untrack(() => post.reportStatus === 'RESOLVED' ? 'RESOLVED' : 'IN_PROGRESS'));
	let budgetType = $state('ESTIMATED');
	let budget = $state<BudgetItem[]>([]);
	let files = $state<File[]>([]);
	const uploaded = new Map<File, string>();
	let uploadProgress = $state('');
	let showAllFiles = $state(false);
	let previews = $state<string[]>([]);
	let busy = $state(false);
	let issue = $state('');
	let requestId = $state('');
	$effect(() => { if (open && !requestId) requestId = crypto.randomUUID(); });
	$effect(() => {
		const urls = files.map((file) => file.type.startsWith('image/') ? URL.createObjectURL(file) : ''); previews = urls;
		return () => urls.forEach((url) => { if (url) URL.revokeObjectURL(url); });
	});
	function attach(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const chosen = Array.from(input.files || []); input.value = ''; issue = '';
		if (!official && chosen.length > 1) { issue = 'Choose at most one image.'; return; }
		if (chosen.some((file) => !['image/jpeg', 'image/png', 'image/webp', ...(official ? ['application/pdf'] : [])].includes(file.type))) { issue = official ? 'Use photos or PDF documents.' : 'Use a JPEG, PNG, or WebP image.'; return; }
		if (chosen.some((file) => file.size > 4 * 1024 * 1024)) { issue = 'Each file must be 4 MB or less.'; return; }
		files = official ? [...files, ...chosen] : chosen;
	}
	async function publish() {
		if (!user) { await goto(`/login?redirectTo=${encodeURIComponent(page.url.pathname + page.url.search)}`); return; }
		if (busy) return;
		busy = true; issue = '';
		try {
			const form = new FormData(); form.set('id', requestId); form.set('postId', post.id); form.set('body', body);
			if (quote) form.set('quotedRepostId', quote.id);
			if (official) {
				form.set('status', status); form.set('budget', JSON.stringify(budget)); form.set('budgetType', budgetType);
				if (!files.length) throw new Error('Attach at least one photo or PDF document.');
				for (const [index, file] of files.entries()) {
					if (uploaded.has(file)) continue;
					uploadProgress = `Uploading evidence ${index + 1} of ${files.length}…`;
					const upload = new FormData(); upload.set('file', file);
					const response = await fetch('/api/community/government-media', { method: 'POST', body: upload });
					const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not upload evidence.');
					uploaded.set(file, result.id);
				}
				form.set('evidenceIds', JSON.stringify(files.map((file) => uploaded.get(file)))); uploadProgress = '';
			} else for (const file of files) form.append('image', file);
			const response = await fetch('/api/community/reposts', { method: 'POST', body: form });
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || 'Could not publish. Try again.');
			open = false; body = ''; files = []; requestId = ''; budget = [];
			await invalidateAll();
			await goto(`/community/post/${post.id}?repost=${result.id}#repost-${result.id}`);
		} catch (cause) { issue = cause instanceof Error ? cause.message : 'Could not publish.'; }
		finally { busy = false; uploadProgress = ''; }
	}
</script>
<Dialog bind:open>
	<DialogContent class="max-h-[90svh] overflow-y-auto sm:max-w-lg" showCloseButton={!busy} onInteractOutside={(event) => { if (busy) event.preventDefault(); }} onEscapeKeydown={(event) => { if (busy) event.preventDefault(); }}>
		<DialogHeader><DialogTitle>{official ? 'Government update' : 'Repost'}</DialogTitle><DialogDescription>{official ? 'Share action taken on this report. All linked posts will show the same status.' : 'Share this update with your community.'}</DialogDescription></DialogHeader>
		<form class="space-y-4" onsubmit={(event) => { event.preventDefault(); void publish(); }}>
		<fieldset disabled={busy} class="min-w-0 space-y-4">
			{#if official}<label class="block space-y-2 text-sm font-medium">Report status<select aria-label="Report status" bind:value={status} class="h-11 w-full rounded-lg border border-border bg-card px-3"><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option></select></label>{/if}
			<label class="block text-sm font-medium" for="repost-body-{post.id}">{official ? 'Update details' : 'Add your thoughts (optional)'}</label>
			<textarea id="repost-body-{post.id}" aria-label="Repost text" bind:value={body} required={official} maxlength={1000} rows="3" class="w-full resize-y rounded-lg border border-border bg-card p-3 text-sm" placeholder={official ? 'Explain the action, what is being done, or why this is resolved.' : 'What would you like to add?'}></textarea>
			<div class="grid grid-cols-2 gap-2">{#each files.slice(0, showAllFiles ? files.length : 4) as file, index}<div class="relative rounded-lg border border-border p-2">{#if previews[index]}<img src={previews[index]} alt="Repost attachment preview" class="aspect-[4/3] w-full rounded object-cover" />{:else}<p class="break-words pr-16 text-sm">PDF · {file.name}</p>{/if}<button type="button" class="mt-1 min-h-11 px-2 text-xs text-muted-foreground" aria-label="Remove attachment {index + 1}" onclick={() => files = files.filter((_, i) => i !== index)}>Remove</button>{#if index === 3 && files.length > 4 && !showAllFiles}<span class="absolute top-2 right-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">+{files.length - 4}</span>{/if}</div>{/each}</div>{#if files.length > 4}<button type="button" class="min-h-11 text-xs text-primary" onclick={() => showAllFiles = !showAllFiles}>{showAllFiles ? 'Show fewer' : `Manage all ${files.length} attachments`}</button>{/if}
			<label class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm text-primary hover:bg-primary/10"><ImageIcon aria-hidden="true" class="size-4" />{official ? 'Attach evidence' : files.length ? 'Replace image' : 'Add one image'}<input aria-label={official ? 'Government evidence' : 'Repost image'} type="file" accept={official ? 'image/jpeg,image/png,image/webp,application/pdf' : 'image/jpeg,image/png,image/webp'} multiple={official} class="sr-only" onchange={attach} /></label>
			{#if official}<p class="text-xs leading-5 text-muted-foreground">Add photos or PDF documents, such as repair photos, a work instruction or a certificate. Each file can be up to 4 MB. You can keep adding evidence.</p>
				<details class="rounded-lg border border-border p-3" open={budget.length > 0}><summary class="cursor-pointer text-sm font-medium">Budget breakdown <span class="text-xs font-normal text-muted-foreground">(optional)</span></summary><div class="mt-3 space-y-3">
					<label class="block text-xs">Budget type<select aria-label="Budget type" bind:value={budgetType} class="mt-1 h-11 w-full rounded-lg border border-border bg-card px-2 text-sm"><option value="ESTIMATED">Estimated budget</option><option value="ACTUAL">Actual expenditure</option></select></label>
					{#each budget as item, index}<div class="space-y-2 rounded-lg bg-muted/50 p-2"><input aria-label="Budget item {index + 1}" placeholder="e.g. Materials, labor, equipment" bind:value={item.label} required maxlength={100} class="h-11 w-full min-w-0 rounded border border-border bg-card px-2 text-sm" /><div class="flex gap-2"><input aria-label="Budget amount {index + 1}" type="number" min="0.01" max="1000000000" step="0.01" bind:value={item.amount} required placeholder="Amount in PHP" class="h-11 min-w-0 flex-1 rounded border border-border bg-card px-2 text-sm" /><button type="button" class="min-h-11 px-2 text-xs text-muted-foreground" onclick={() => budget = budget.filter((_, i) => i !== index)}>Remove item</button></div></div>{/each}
					<button type="button" disabled={budget.length >= 20} class="min-h-11 text-sm text-primary" onclick={() => budget = [...budget, { label: '', amount: 0 }]}>Add budget item</button><p class="text-sm font-medium">Total: {pesos(budgetTotal(budget))}</p>
				</div></details>
			{/if}
			<div class="flex gap-3 rounded-lg border border-border p-3">{#if post.media.find((media) => media.kind === 'photo')}<img src={post.media.find((media) => media.kind === 'photo')!.url} alt="Original report" class="size-14 shrink-0 rounded object-cover" />{/if}<div class="min-w-0"><p class="text-xs text-muted-foreground">{quote?.author.name || post.author.name}</p><p class="mt-1 break-words text-sm font-medium">{quote?.body || post.title}</p></div></div>
			{#if !official}<p class="text-xs leading-5 text-muted-foreground">Reposts share the original report. They do not increase hazard severity or count as new evidence.</p>{/if}
		</fieldset>
			{#if issue}<p role="alert" class="text-sm text-destructive">{issue}</p>{/if}
			<div class="flex justify-end"><Button type="submit" disabled={busy}>{busy ? uploadProgress || 'Posting…' : official ? 'Publish update' : 'Publish repost'}</Button></div>
		</form>
	</DialogContent>
</Dialog>
