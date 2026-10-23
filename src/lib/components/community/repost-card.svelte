<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import Avatar from './avatar.svelte';
	import Repeat2Icon from '@lucide/svelte/icons/repeat-2';
	import type { CommunityRepost } from '$lib/types/community';
	let { repost, user }: { repost: CommunityRepost; user: { id: string } | null } = $props();
	let card = $state<HTMLElement>();
	let busy = $state(false);
	let issue = $state('');
	const href = $derived(`/community/post/${repost.post.id}?repost=${repost.id}#repost-${repost.id}`);
	$effect(() => {
		if (!card) return;
		const element = card;
		function open(event: MouseEvent) {
			if (event.button !== 0 || event.defaultPrevented || !(event.target instanceof Element) || event.target.closest('a,button') || window.getSelection()?.toString()) return;
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
		<a href="/community?profile={repost.author.id}" class="flex min-w-0 items-center gap-2.5"><Avatar name={repost.author.name} src={repost.author.avatarUrl} /><span class="min-w-0"><span class="block truncate text-sm font-semibold">{repost.author.name}</span><span class="flex items-center gap-1 text-xs text-muted-foreground"><Repeat2Icon aria-hidden="true" class="size-3" />Reposted · {new Date(repost.createdAt).toLocaleDateString()}</span></span></a>
		{#if user?.id === repost.author.id}<button type="button" disabled={busy} onclick={undo} class="min-h-11 shrink-0 rounded-lg px-2 text-xs text-muted-foreground hover:bg-secondary">Undo repost</button>{/if}
	</header>
	<a href={href} class="block space-y-3 px-3 pb-3 sm:px-4" aria-label="Open repost by {repost.author.name}">
		{#if repost.body}<p class="break-words whitespace-pre-wrap text-sm leading-6">{repost.body}</p>{/if}
		{#if repost.media[0]}<img src={repost.media[0].url} alt={repost.media[0].name} loading="lazy" class="max-h-96 w-full rounded-lg object-contain" />{/if}
		<div class="rounded-lg border border-border p-3"><p class="text-xs text-muted-foreground">Original post · {repost.post.author.name}</p><h2 class="mt-1 break-words text-sm font-semibold">{repost.post.title}</h2><p class="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">{repost.post.body}</p></div>
	</a>
	{#if issue}<p role="alert" class="px-3 pb-3 text-sm text-destructive">{issue}</p>{/if}
</article>
