<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import RepostComposer from '$lib/components/community/repost-composer.svelte';
	import type { CommunityPost } from '$lib/types/community';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	let selected = $state<CommunityPost | null>(null);
	let open = $state(false);
	let search = $state('');
	async function filter() { const url = new URL(page.url.href); url.searchParams.set('q', search); url.searchParams.delete('page'); await goto(url); }
</script>
<svelte:head><title>Government updates — SuriOS</title></svelte:head>
<div class="min-h-full bg-muted/35 px-2 py-4 sm:px-5">
	<div class="mx-auto max-w-[680px] space-y-4">
		<header><h1 class="text-xl font-semibold tracking-tight">Government updates</h1><p class="mt-2 text-sm leading-6 text-muted-foreground">Quote a community report with progress, repair evidence and an optional budget breakdown.</p><a href="/dashboard/export" class="mt-2 inline-flex min-h-11 items-center text-xs font-medium text-primary hover:underline">Export government updates (CSV)</a></header>
		<form class="flex gap-2" onsubmit={(event) => { event.preventDefault(); void filter(); }}><input type="search" aria-label="Find a report" bind:value={search} placeholder="Find a road or report" class="h-11 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-sm" /><Button type="submit" variant="outline">Search</Button></form>
		{#each data.posts as post (post.id)}
			<article class="rounded-xl border border-border bg-card p-4"><div class="flex items-start gap-3">{#if post.media[0]?.kind === 'photo'}<a href="/community/post/{post.id}" class="shrink-0"><img src={post.media[0].url} alt="Original road report" class="size-16 rounded-lg object-cover" /></a>{/if}<div class="min-w-0 flex-1"><a href="/community/post/{post.id}" class="break-words text-sm font-semibold hover:underline">{post.title}</a><p class="mt-1 break-words text-xs text-muted-foreground">{post.locationName} · {post.author.name}</p><p class="mt-2 text-xs font-medium text-primary">{post.reportStatus === 'RESOLVED' ? 'Resolved' : ['IN_REPAIR', 'DISPATCHED', 'AWAITING_REVIEW'].includes(post.reportStatus) ? 'In progress' : 'Reported'}</p></div></div><Button variant="outline" class="mt-4 h-11 w-full" onclick={() => { selected = post; open = true; }}>Post government update</Button></article>
		{:else}<p class="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">No matching community reports.</p>{/each}
		{#if data.hasMore}<Button variant="outline" class="h-11 w-full" onclick={() => { const url = new URL(page.url.href); url.searchParams.set('page', String(data.currentPage + 1)); void goto(url); }}>Load more reports</Button>{/if}
	</div>
</div>
{#if selected && open}<RepostComposer bind:open post={selected} user={data.user} />{/if}
