<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import Avatar from './avatar.svelte';
	import Repeat2Icon from '@lucide/svelte/icons/repeat-2';
	import { pesos, budgetTotal, type CommunityRepost } from '$lib/types/community';
	let { repost, user }: { repost: CommunityRepost; user: { id: string } | null } = $props();
	let card = $state<HTMLElement>();
	let busy = $state(false);
	let issue = $state('');
	const official = $derived(repost.governmentUpdate);
	const currentStatus = $derived(repost.post.reportStatus === 'RESOLVED' ? 'RESOLVED' : ['IN_REPAIR', 'DISPATCHED', 'AWAITING_REVIEW'].includes(repost.post.reportStatus) ? 'IN_PROGRESS' : official?.status);
	const href = $derived(`/community/post/${repost.post.id}?repost=${repost.id}#repost-${repost.id}`);
	$effect(() => {
		if (!card) return;
		const element = card;
		function open(event: MouseEvent) {
			if (event.button !== 0 || event.defaultPrevented || !(event.target instanceof Element) || event.target.closest('a,button,summary,details') || window.getSelection()?.toString()) return;
			if (event.ctrlKey || event.metaKey) window.open(href, '_blank', 'noopener'); else void goto(href);
		}
		element.addEventListener('click', open);
		return () => element.removeEventListener('click', open);
	});
	async function undo() {
		if (busy) return; busy = true; issue = '';
		try {
			const response = await fetch(`/api/community/reposts?id=${repost.id}`, { method: 'DELETE' });
			if (!response.ok) throw new Error((await response.json()).message || 'Could not remove repost.');
			await invalidateAll();
		} catch (cause) { issue = cause instanceof Error ? cause.message : 'Could not remove repost.'; }
		finally { busy = false; }
	}
</script>

<article bind:this={card} id="repost-{repost.id}" data-repost-id={repost.id} class="cursor-pointer scroll-mt-4 overflow-hidden rounded-xl border border-border bg-card">
	<header class="flex items-center justify-between gap-2 px-3 py-3 sm:px-4">
		<a href="/community?profile={repost.author.id}" class="flex min-w-0 items-center gap-2.5"><Avatar name={repost.author.name} src={repost.author.avatarUrl} /><span class="min-w-0"><span class="block truncate text-sm font-semibold">{repost.author.name}</span><span class="flex items-center gap-1 text-xs text-muted-foreground"><Repeat2Icon aria-hidden="true" class="size-3" />{official ? 'Government update' : 'Reposted'} · {new Date(repost.createdAt).toLocaleDateString()}</span></span></a>
		{#if !official && user?.id === repost.author.id}<button type="button" disabled={busy} onclick={undo} class="min-h-11 shrink-0 rounded-lg px-2 text-xs text-muted-foreground hover:bg-secondary">Undo repost</button>{/if}
	</header>
	<div class="block space-y-3 px-3 pb-3 sm:px-4" >
		{#if official}<a href={repost.post.governmentUpdateLink || href} class="inline-flex min-h-8 items-center rounded-full bg-primary/10 px-3 text-xs font-semibold text-primary">{currentStatus === 'RESOLVED' ? 'Resolved' : 'In progress'}</a>{#if currentStatus !== official.status}<p class="text-xs text-muted-foreground">Posted as {official.status === 'RESOLVED' ? 'Resolved' : 'In progress'} · View the latest update for the current status.</p>{/if}{/if}
		{#if repost.body}<p class="break-words whitespace-pre-wrap text-sm leading-6">{repost.body}</p>{/if}
		{#if repost.media[0]}<img src={repost.media[0].url} alt={repost.media[0].name} loading="lazy" class="max-h-96 w-full rounded-lg object-contain" />{/if}
		{#if official}
			{#each official.attachments as attachment}{#if attachment.kind === 'photo'}<a href={attachment.url} target="_blank" rel="noreferrer" aria-label="Open evidence photo: {attachment.name}"><img src={attachment.url} alt={attachment.name} loading="lazy" class="max-h-96 w-full rounded-lg object-contain" /></a>{:else}<a href={attachment.url} download={attachment.name} class="flex min-h-11 items-center gap-2 break-all rounded-lg border border-border p-3 text-sm text-primary hover:bg-secondary">Download PDF · {attachment.name}</a>{/if}{/each}
			{#if official.budget.length}<details class="rounded-lg border border-border p-3"><summary class="cursor-pointer text-sm font-medium">{official.budgetType === 'ACTUAL' ? 'Actual expenditure' : 'Estimated budget'} · {pesos(budgetTotal(official.budget))}</summary><dl class="mt-3 space-y-2">{#each official.budget as item}<div class="flex items-baseline justify-between gap-4 text-sm"><dt class="min-w-0 break-words text-muted-foreground">{item.label}</dt><dd class="shrink-0 tabular-nums">{pesos(item.amount)}</dd></div>{/each}<div class="flex justify-between gap-3 border-t border-border pt-2 text-sm font-semibold"><dt>Total</dt><dd>{pesos(budgetTotal(official.budget))}</dd></div></dl></details>{/if}
		{/if}
		<a href="/community/post/{repost.post.id}" class="flex gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"><div class="min-w-0 flex-1"><p class="text-xs text-muted-foreground">Original post · {repost.post.author.name}</p><h2 class="mt-1 break-words text-sm font-semibold">{repost.post.title}</h2><p class="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">{repost.post.body}</p></div>{#if repost.post.media.find((media) => media.kind === 'photo')}<img src={repost.post.media.find((media) => media.kind === 'photo')!.url} alt="Quoted original report" class="size-16 shrink-0 rounded-md object-cover" />{/if}</a>
	</div>
	{#if issue}<p role="alert" class="px-3 pb-3 text-sm text-destructive">{issue}</p>{/if}
</article>
