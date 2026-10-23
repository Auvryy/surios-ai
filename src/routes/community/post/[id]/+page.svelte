<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import PostCard from '$lib/components/community/post-card.svelte';
	import RepostCard from '$lib/components/community/repost-card.svelte';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	let backHref = $state('/community');
	afterNavigate(({ from }) => {
		if (from && ['/community', '/profile'].includes(from.url.pathname)) backHref = from.url.pathname + from.url.search;
	});
</script>

<svelte:head><title>{data.post.title} — SuriOS</title></svelte:head>
<div class="min-h-full bg-muted/35 px-2 py-3 sm:px-5 sm:py-5">
	<div class="mx-auto max-w-[680px] space-y-4">
		<header class="flex items-center gap-3"><a href={backHref} aria-label="Back to feed" class="flex size-11 items-center justify-center rounded-full hover:bg-secondary"><ArrowLeftIcon aria-hidden="true" class="size-5" /></a><h1 class="text-lg font-semibold">Post</h1></header>
		<PostCard post={data.post} user={data.user} detail mediaId={data.mediaId} />
		{#if data.reposts.length}<section aria-label="Reposts" class="space-y-3"><h2 class="px-1 text-sm font-semibold">Reposts</h2>{#each data.reposts as repost (repost.id)}<RepostCard {repost} user={data.user} />{/each}</section>{/if}
	</div>
</div>
