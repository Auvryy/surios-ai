<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import ProfileView from '$lib/components/community/profile-view.svelte';
	import PostCard from '$lib/components/community/post-card.svelte';
	import RepostCard from '$lib/components/community/repost-card.svelte';
	import Avatar from '$lib/components/community/avatar.svelte';
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import PostComposer from '$lib/components/community/post-composer.svelte';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ImageIcon from '@lucide/svelte/icons/image';
	import VideoIcon from '@lucide/svelte/icons/video';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import XIcon from '@lucide/svelte/icons/x';
	let { data }: PageProps = $props();
	const name = $derived(data.user?.name || 'Guest');
	let composer = $state(false);
	let search = $derived(data.filters.q);
	let message = $state('');
	let searchPending = $state(false);
	const searching = $derived(Boolean(data.filters.q || data.filters.author));
	const people = $derived([...new Map(data.posts.map((post) => [post.author.id, post.author])).values()]);
	function openComposer() { composer = true; }
	async function filter(key: string, value: string) {
		const url = new URL(page.url.href); url.searchParams.delete('page');
		if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
		searchPending = true;
		try { await goto(url, { reset: false }); }
		finally { searchPending = false; }
	}
	async function clearSearch() {
		const url = new URL(page.url.href);
		for (const key of ['q', 'author', 'page']) url.searchParams.delete(key);
		searchPending = true;
		try { await goto(url, { reset: false }); }
		finally { searchPending = false; }
	}
	async function published(id: string, grouped = false) {
		message = grouped ? 'Your update was saved as evidence for an existing nearby hazard.' : 'Your update was published and added to Road hazards.';
		await goto(`/community#post-${id}`, { refreshAll: true });
		await tick(); document.getElementById(`post-${id}`)?.scrollIntoView({ block: 'start' });
	}

</script>
<svelte:head><title>Community Feed — SuriOS</title></svelte:head>
{#if data.viewedProfile}
	<section aria-label="Community feed"><ProfileView data={{ ...data, profile: data.viewedProfile }} user={data.user} embedded /></section>
{:else}
<div class="min-h-full bg-muted/35">
	<div class="feed-layout mx-auto grid max-w-[1040px] items-start gap-5 px-2 py-2 sm:px-5 sm:py-4">
		<section class="min-w-0 space-y-3" aria-label="Community feed">
			<h1 class="sr-only">Community feed</h1>
			<form action="/community" method="GET" class="flex items-center gap-2" role="search" onsubmit={(event) => { event.preventDefault(); void filter('q', String(new FormData(event.currentTarget).get('q') || '').trim()); }}>
				{#each ['tab', 'media', 'author', 'sort'] as key}<input type="hidden" name={key} value={page.url.searchParams.get(key) || ''} />{/each}
				<div class="relative min-w-0 flex-1"><SearchIcon aria-hidden="true" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" aria-label="Search community" type="search" placeholder="Search people, roads, and posts" bind:value={search} maxlength={100} class="h-11 rounded-full bg-card pl-10 pr-12 shadow-none" /><button type="submit" class="absolute right-1 top-1 flex size-9 items-center justify-center rounded-full text-primary hover:bg-primary/10" aria-label="Search posts" disabled={searchPending}><SearchIcon aria-hidden="true" class="size-4" /></button></div>
				<a href={data.user ? '/profile' : '/login?redirectTo=/community'} aria-label="Your profile" class="avatar size-11 bg-primary/10 text-primary"><Avatar {name} src={data.user?.avatarUrl} class="size-11" /></a>
			</form>
			{#if !searching}<div class="rounded-xl border border-border bg-card px-3 pt-2">
				<div class="flex items-center gap-2.5"><Avatar {name} src={data.user?.avatarUrl} /><button onclick={openComposer} class="flex min-h-11 flex-1 items-center rounded-full bg-muted px-4 text-left text-sm text-muted-foreground hover:bg-secondary">What’s happening on your road?</button></div>
				<div class="mt-2 grid grid-cols-3 border-t border-border"><button onclick={openComposer} class="feed-action"><ImageIcon class="size-4 text-primary" />Photos</button><button onclick={openComposer} class="feed-action"><VideoIcon class="size-4 text-primary" />Video</button><button onclick={openComposer} class="feed-action"><MapPinIcon class="size-4 text-primary" />Location</button></div>
			</div>{/if}
			<div class="flex flex-wrap items-center justify-between gap-1">
				<div class="flex gap-1" aria-label="Feed filters">{#each [{ id: '', label: 'All updates' }, { id: 'critical', label: 'Critical' }, { id: 'confirmed', label: 'Confirmed' }] as tab}<button type="button" disabled={searchPending} aria-pressed={data.filters.tab === tab.id} class="min-h-11 rounded-full px-3 text-sm font-medium {data.filters.tab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}" onclick={() => filter('tab', tab.id)}>{tab.label}</button>{/each}</div>
				<div class="flex flex-wrap items-center gap-2">
					<label class="flex items-center gap-1 text-xs text-muted-foreground">Sort<select aria-label="Sort posts" disabled={searchPending} value={data.filters.sort || 'newest'} onchange={(event) => filter('sort', event.currentTarget.value)} class="min-h-11 max-w-40 rounded-lg bg-card px-2 text-sm text-foreground">{#if data.filters.q}<option value="relevance">Most relevant</option>{/if}<option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="severity">Highest severity</option><option value="confirmations">Most confirmed</option></select></label>
					<select aria-label="Media type" disabled={searchPending} value={data.filters.media} onchange={(event) => filter('media', event.currentTarget.value)} class="min-h-11 max-w-24 rounded-lg bg-transparent px-1 text-xs text-muted-foreground"><option value="">All media</option><option value="photo">Photos</option><option value="video">Videos</option></select>
				</div>
			</div>
			{#if searching}<div class="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span role="status" class="min-w-0 [overflow-wrap:anywhere]">{searchPending ? 'Searching…' : `${data.total} ${data.total === 1 ? 'result' : 'results'}${data.filters.q ? ` for “${data.filters.q}”` : ' by this contributor'}`}</span><Button variant="ghost" size="sm" class="shrink-0" disabled={searchPending} onclick={clearSearch}>Clear search<XIcon class="size-3.5" /></Button></div>{/if}
			{#if message}<div role="status" class="flex items-start justify-between gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm"><span>{message}</span><button class="flex size-8 shrink-0 items-center justify-center" aria-label="Dismiss notification" onclick={() => message = ''}><XIcon class="size-4" /></button></div>{/if}
			<div aria-live="polite" class="sr-only">{searchPending ? 'Searching posts' : `${data.total} posts found`}</div>
			{#each data.feed as item (`${item.kind}:${item.id}`)}
				{#if item.kind === 'post'}<PostCard post={item.post} user={data.user} />{:else}<RepostCard repost={item.repost} user={data.user} />{/if}
			{:else}<div class="rounded-xl border border-border bg-card px-5 py-10 text-center"><span class="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><MapPinIcon class="size-6" /></span><h2 class="mt-3 font-semibold">{data.filters.q || data.filters.tab || data.filters.media || data.filters.author ? 'No matching road updates' : 'Safer roads start with a report'}</h2><p class="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{data.filters.q || data.filters.tab || data.filters.media || data.filters.author ? 'Try another name, road, or media filter.' : 'Share photos or a short video. AI will help assess the hazard before you post.'}</p><Button class="mt-4" onclick={() => data.filters.q || data.filters.tab || data.filters.media || data.filters.author ? goto('/community') : openComposer()}>{data.filters.q || data.filters.tab || data.filters.media || data.filters.author ? 'Clear filters' : 'Share a road update'}</Button></div>{/each}
			{#if data.hasMore}<Button variant="outline" class="h-11 w-full" onclick={() => filter('page', String(data.currentPage + 1))} disabled={searchPending}>Load more updates</Button>{/if}
		</section>
		<aside class="hidden xl:block" aria-label="Community people"><div class="sticky top-4 space-y-4"><div class="border-b border-border pb-3"><h2 class="text-sm font-semibold">Your community</h2><p class="mt-1 text-xs leading-5 text-muted-foreground">People keeping local roads safer.</p></div>{#if people.length}<div class="space-y-1">{#each people as person}<a class="flex min-h-12 w-full items-center gap-2.5 rounded-lg px-2 text-left hover:bg-secondary" href="/community?profile={person.id}"><Avatar name={person.name} src={person.avatarUrl} class="size-9" /><span class="min-w-0"><span class="block truncate text-sm font-medium">{person.name}</span><span class="block text-xs text-muted-foreground">Community contributor</span></span></a>{/each}</div>{:else}<p class="text-sm leading-6 text-muted-foreground">Your community’s updates will appear here.</p>{/if}<div class="rounded-xl border border-primary/20 bg-primary/5 p-4"><SparklesIcon class="size-5 text-primary" /><h3 class="mt-2 text-sm font-semibold">Evidence, then action</h3><p class="mt-1 text-xs leading-5 text-muted-foreground">Every post includes an AI assessment and a location, saved as a road report for municipal follow-up.</p></div></div></aside>
	</div>
</div>
{/if}
<PostComposer bind:open={composer} user={data.user} onpublished={published} />
<style>
	.feed-layout { grid-template-columns: minmax(0, 680px); justify-content: center; }
	.avatar { display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center; border: 1px solid var(--border); border-radius: 9999px; background: var(--secondary); font-size: .75rem; font-weight: 600; }
	.feed-action { display: flex; min-height: 44px; align-items: center; justify-content: center; gap: 6px; border-radius: 8px; font-size: .8125rem; font-weight: 500; cursor: pointer; }
	.feed-action:hover { background: var(--secondary); }
	.feed-action:disabled { cursor: wait; opacity: .6; }
	@media (min-width: 1280px) { .feed-layout { grid-template-columns: minmax(0, 680px) 240px; } }
	@media (max-width: 400px) { .feed-action { gap: 4px; font-size: .75rem; } }
</style>
