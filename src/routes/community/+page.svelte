<script lang="ts">
	import { tick } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import PostComposer from '$lib/components/community/post-composer.svelte';
	import PostMedia from '$lib/components/community/post-media.svelte';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ImageIcon from '@lucide/svelte/icons/image';
	import VideoIcon from '@lucide/svelte/icons/video';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import Share2Icon from '@lucide/svelte/icons/share-2';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import XIcon from '@lucide/svelte/icons/x';
	import SendIcon from '@lucide/svelte/icons/send';
	import type { CommunityPost } from '$lib/types/community';
	let { data }: PageProps = $props();
	const name = $derived(data.user?.name || 'Guest');
	const initials = (value: string) => value.split(' ').slice(0, 2).map((part) => part[0]).join('');
	let composer = $state(false);
	let search = $state('');
	let expanded = $state<Record<string, boolean>>({});
	let commentViews = $state<Record<string, boolean>>({});
	let commentInputs = $state<Record<string, string>>({});
	let busy = $state<Record<string, boolean>>({});
	let actionErrors = $state<Record<string, string>>({});
	let message = $state('');
	let searchPending = $state(false);
	$effect(() => { search = data.filters.q; });
	const people = $derived([...new Map(data.posts.map((post) => [post.author.id, post.author])).values()]);
	function openComposer() { composer = true; }
	async function filter(key: string, value: string) {
		const url = new URL(page.url.href); url.searchParams.delete('page');
		if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
		searchPending = true;
		try { await goto(url, { reset: false }); }
		finally { searchPending = false; }
	}
	async function published(id: string, grouped = false) {
		message = grouped ? 'Your update was saved as evidence for an existing nearby hazard.' : 'Your update was published and added to Road hazards.';
		await goto(`/community#post-${id}`, { refreshAll: true });
		await tick(); document.getElementById(`post-${id}`)?.scrollIntoView({ block: 'start' });
	}
	async function interact(post: CommunityPost, payload: Record<string, unknown>) {
		if (!data.user) { await goto('/login?redirectTo=/community'); return; }
		if (busy[post.id]) return;
		busy[post.id] = true; actionErrors[post.id] = '';
		try {
			const response = await fetch(`/api/community/posts/${post.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || 'Unable to save this action. Please try again.');
			if (payload.action === 'comment') commentInputs[post.id] = '';
			await invalidateAll();
		} catch (cause) { actionErrors[post.id] = cause instanceof Error ? cause.message : 'Unable to save. Please try again.'; }
		finally { busy[post.id] = false; }
	}
	async function share(post: CommunityPost) {
		try { await navigator.clipboard.writeText(`${window.location.origin}/community?q=${post.id}#post-${post.id}`); message = 'Post link copied.'; }
		catch { message = 'Unable to copy the link. Copy this page’s address from your browser.'; }
	}
	function timeAgo(date: string) {
		const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(date)) / 60000));
		return minutes < 1 ? 'Just now' : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : new Date(date).toLocaleDateString();
	}
</script>
<svelte:head><title>Community Feed — SuriOS</title></svelte:head>
<div class="min-h-full bg-muted/35">
	<div class="feed-layout mx-auto grid max-w-[1040px] items-start gap-5 px-2 py-2 sm:px-5 sm:py-4">
		<section class="min-w-0 space-y-3" aria-label="Community feed">
			<h1 class="sr-only">Community feed</h1>
			<form class="flex items-center gap-2" role="search" onsubmit={(event) => { event.preventDefault(); void filter('q', search.trim()); }}>
				<div class="relative min-w-0 flex-1"><SearchIcon aria-hidden="true" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search community" type="search" placeholder="Search people, roads, and posts" bind:value={search} maxlength={100} class="h-11 rounded-full bg-card pl-10 pr-12 shadow-none" /><button type="submit" class="absolute right-1 top-1 flex size-9 items-center justify-center rounded-full text-primary hover:bg-primary/10" aria-label="Search posts" disabled={searchPending}><SearchIcon class="size-4" /></button></div>
				<a href={data.user ? '/profile' : '/login?redirectTo=/community'} aria-label="Your profile" class="avatar size-11 bg-primary/10 text-primary">{initials(name)}</a>
			</form>
			<div class="rounded-xl border border-border bg-card px-3 pt-2">
				<div class="flex items-center gap-2.5"><span class="avatar size-10">{initials(name)}</span><button onclick={openComposer} class="flex min-h-11 flex-1 items-center rounded-full bg-muted px-4 text-left text-sm text-muted-foreground hover:bg-secondary">What’s happening on your road?</button></div>
				<div class="mt-2 grid grid-cols-3 border-t border-border"><button onclick={openComposer} class="feed-action"><ImageIcon class="size-4 text-primary" />Photos</button><button onclick={openComposer} class="feed-action"><VideoIcon class="size-4 text-primary" />Video</button><button onclick={openComposer} class="feed-action"><MapPinIcon class="size-4 text-primary" />Location</button></div>
			</div>
			<div class="flex flex-wrap items-center justify-between gap-1">
				<div class="flex gap-1" aria-label="Feed filters">{#each [{ id: '', label: 'Latest' }, { id: 'critical', label: 'Critical' }, { id: 'confirmed', label: 'Confirmed' }] as tab}<button type="button" aria-pressed={data.filters.tab === tab.id} class="min-h-11 rounded-full px-3 text-sm font-medium {data.filters.tab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}" onclick={() => filter('tab', tab.id)}>{tab.label}</button>{/each}</div>
				<select aria-label="Media type" value={data.filters.media} onchange={(event) => filter('media', event.currentTarget.value)} class="min-h-11 max-w-24 rounded-lg bg-transparent px-1 text-xs text-muted-foreground"><option value="">All media</option><option value="photo">Photos</option><option value="video">Videos</option></select>
			</div>
			{#if data.filters.q || data.filters.author}<div class="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{data.total} results{data.filters.q ? ` for “${data.filters.q}”` : ' by this contributor'}</span><Button variant="ghost" size="sm" onclick={() => goto('/community')}>Clear search<XIcon class="size-3.5" /></Button></div>{/if}
			{#if message}<div role="status" class="flex items-start justify-between gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm"><span>{message}</span><button class="flex size-8 shrink-0 items-center justify-center" aria-label="Dismiss notification" onclick={() => message = ''}><XIcon class="size-4" /></button></div>{/if}
			<div aria-live="polite" class="sr-only">{searchPending ? 'Searching posts' : `${data.total} posts found`}</div>
			{#each data.posts as post (post.id)}
				<article id="post-{post.id}" class="scroll-mt-4 overflow-hidden rounded-xl border border-border bg-card">
					<header class="flex items-center justify-between gap-2 px-3 py-3 sm:px-4"><button class="flex min-w-0 items-center gap-2.5 rounded-lg text-left" aria-label="View posts by {post.author.name}" onclick={() => filter('author', post.author.id)}><span class="avatar size-10">{initials(post.author.name)}</span><span class="min-w-0"><span class="block truncate text-sm font-semibold">{post.author.name}</span><span class="block text-xs text-muted-foreground">{timeAgo(post.createdAt)} · Community</span></span></button><span class="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold {post.analysis.riskLevel === 'CRITICAL' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}">{post.analysis.hazardSeverity}/10 {post.analysis.riskLevel.toLowerCase()}</span></header>
					<div class="space-y-1 px-3 pb-3 sm:px-4"><h2 class="text-sm font-semibold leading-snug">{post.title}</h2>{#if post.body}<p class="break-words text-sm leading-5 text-muted-foreground" class:line-clamp-2={!expanded[post.id]}>{post.body}</p>{#if post.body.length > 150}<button class="min-h-8 text-xs font-semibold hover:underline" onclick={() => expanded[post.id] = !expanded[post.id]}>{expanded[post.id] ? 'See less' : 'See more'}</button>{/if}{/if}</div>
					<PostMedia {post} />
					<div class="space-y-2 px-3 py-2 sm:px-4"><a href="https://www.openstreetmap.org/?mlat={post.latitude}&mlon={post.longitude}#map=17/{post.latitude}/{post.longitude}" target="_blank" rel="noreferrer" class="flex items-start gap-1.5 text-xs text-muted-foreground hover:underline"><MapPinIcon class="mt-0.5 size-3.5 shrink-0 text-primary" />{post.locationName}</a><details class="rounded-lg bg-primary/5 px-3"><summary class="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-medium"><SparklesIcon class="size-3.5 text-primary" />AI assessed · {post.analysis.distressType.replaceAll('_', ' ')}<span class="ml-auto text-muted-foreground">Details</span></summary><div class="space-y-2 pb-3 text-xs leading-5 text-muted-foreground"><p>{post.analysis.summary}</p><p><strong class="font-medium text-foreground">Rider risk:</strong> {post.analysis.vruLethality.toLowerCase()} · {post.analysis.vruDetails}</p><p><strong class="font-medium text-foreground">Suggested repair:</strong> {post.analysis.recommendedAction}</p><p>AI estimates require on-site inspection.</p><a class="inline-flex min-h-10 items-center gap-1 font-medium text-primary hover:underline" href="/map?report={post.reportId}"><MapPinIcon class="size-3.5" />View hazard on map · {post.reportId.slice(0, 8).toUpperCase()}</a>{#if post.grouping}<p>{post.grouping.reason}</p>{/if}</div></details></div>
					<div class="flex items-center justify-between px-3 pb-2 text-xs text-muted-foreground sm:px-4"><span>{post.confirmations} confirmations</span><button class="min-h-8 hover:underline" onclick={() => commentViews[post.id] = !commentViews[post.id]}>{post.comments.length} comments</button></div>
					<div class="mx-3 grid grid-cols-3 border-t border-border py-1 sm:mx-4"><button class="feed-action {post.userConfirmed ? 'text-primary' : ''}" aria-pressed={post.userConfirmed} disabled={busy[post.id]} onclick={() => interact(post, { action: 'confirm', confirmed: !post.userConfirmed })}><ThumbsUpIcon class="size-4" />{post.userConfirmed ? 'Confirmed' : 'Confirm'}</button><button class="feed-action" aria-expanded={!!commentViews[post.id]} onclick={() => commentViews[post.id] = !commentViews[post.id]}><MessageSquareIcon class="size-4" />Comment</button><button class="feed-action" onclick={() => share(post)}><Share2Icon class="size-4" />Share</button></div>
					{#if actionErrors[post.id]}<p role="alert" class="px-3 pb-3 text-sm text-destructive">{actionErrors[post.id]}</p>{/if}
					{#if commentViews[post.id]}<div class="space-y-3 border-t border-border bg-muted/20 p-3 sm:p-4">{#each post.comments as comment (comment.id)}<div class="flex items-start gap-2"><span class="avatar size-8 text-[10px]">{initials(comment.author.name)}</span><div class="min-w-0 rounded-xl bg-muted px-3 py-2"><p class="text-xs font-semibold">{comment.author.name}</p><p class="break-words text-sm">{comment.body}</p></div></div>{/each}<form class="flex items-center gap-2" onsubmit={(event) => { event.preventDefault(); void interact(post, { action: 'comment', body: commentInputs[post.id] }); }}><Input aria-label="Comment on {post.title}" placeholder="Write a comment…" bind:value={commentInputs[post.id]} maxlength={1000} class="h-11 min-w-0 flex-1 rounded-full bg-card" /><Button type="submit" variant="ghost" size="icon" class="size-11 shrink-0" aria-label="Send comment" disabled={!commentInputs[post.id]?.trim() || busy[post.id]}><SendIcon class="size-4" /></Button></form></div>{/if}
				</article>
			{:else}<div class="rounded-xl border border-border bg-card px-5 py-10 text-center"><span class="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><MapPinIcon class="size-6" /></span><h2 class="mt-3 font-semibold">{data.filters.q || data.filters.tab || data.filters.media || data.filters.author ? 'No matching road updates' : 'Safer roads start with a report'}</h2><p class="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{data.filters.q || data.filters.tab || data.filters.media || data.filters.author ? 'Try another name, road, or media filter.' : 'Share photos or a short video. AI will help assess the hazard before you post.'}</p><Button class="mt-4" onclick={() => data.filters.q || data.filters.tab || data.filters.media || data.filters.author ? goto('/community') : openComposer()}>{data.filters.q || data.filters.tab || data.filters.media || data.filters.author ? 'Clear filters' : 'Share a road update'}</Button></div>{/each}
			{#if data.hasMore}<Button variant="outline" class="h-11 w-full" onclick={() => filter('page', String(data.currentPage + 1))} disabled={searchPending}>Load more updates</Button>{/if}
		</section>
		<aside class="hidden xl:block" aria-label="Community people"><div class="sticky top-4 space-y-4"><div class="border-b border-border pb-3"><h2 class="text-sm font-semibold">Your community</h2><p class="mt-1 text-xs leading-5 text-muted-foreground">People keeping local roads safer.</p></div>{#if people.length}<div class="space-y-1">{#each people as person}<button class="flex min-h-12 w-full items-center gap-2.5 rounded-lg px-2 text-left hover:bg-secondary" onclick={() => filter('author', person.id)}><span class="avatar size-9">{initials(person.name)}</span><span class="min-w-0"><span class="block truncate text-sm font-medium">{person.name}</span><span class="block text-xs text-muted-foreground">Community contributor</span></span></button>{/each}</div>{:else}<p class="text-sm leading-6 text-muted-foreground">Your community’s updates will appear here.</p>{/if}<div class="rounded-xl border border-primary/20 bg-primary/5 p-4"><SparklesIcon class="size-5 text-primary" /><h3 class="mt-2 text-sm font-semibold">Evidence, then action</h3><p class="mt-1 text-xs leading-5 text-muted-foreground">Every post includes an AI assessment and a location, saved as a road report for municipal follow-up.</p></div></div></aside>
	</div>
</div>
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
