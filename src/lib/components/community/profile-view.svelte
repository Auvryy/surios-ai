<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import Avatar from './avatar.svelte';
	import PostCard from './post-card.svelte';
	import ProfileEditor from './profile-editor.svelte';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import type { CommunityPost } from '$lib/types/community';
	let { data, user }: {
		data: { profile: { id: string; name: string; avatarUrl: string | null; coverUrl: string | null }; isOwner: boolean; posts: CommunityPost[]; total: number; hasMore: boolean; currentPage: number };
		user: { id: string } | null;
	} = $props();
	let editOpen = $state(false);
	let loading = $state(false);
	async function more() {
		loading = true;
		try { const url = new URL(page.url.href); url.searchParams.set('page', String(data.currentPage + 1)); await goto(url, { reset: false }); }
		finally { loading = false; }
	}
</script>
<svelte:head><title>{data.profile.name} — SuriOS</title></svelte:head>
<div class="min-h-full bg-muted/35 px-2 py-3 sm:px-5 sm:py-5">
	<div class="mx-auto max-w-[680px] space-y-4">
		<a href="/community" class="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeftIcon aria-hidden="true" class="size-4" />Community</a>
		<section class="overflow-hidden rounded-xl border border-border bg-card" aria-label="Profile">
			<div class="aspect-[3/1] bg-primary/10">{#if data.profile.coverUrl}<img src={data.profile.coverUrl} alt="{data.profile.name}’s cover photo" class="size-full object-cover" />{/if}</div>
			<div class="px-4 pb-4 sm:px-5"><div class="flex items-end justify-between gap-3"><div class="-mt-10 relative rounded-full bg-card p-1" role="img" aria-label="{data.profile.name}’s profile picture"><Avatar name={data.profile.name} src={data.profile.avatarUrl} class="size-20 text-xl sm:size-24" /></div>{#if data.isOwner}<Button variant="outline" class="mt-3 h-11 shrink-0" onclick={() => editOpen = true}>Edit profile</Button>{/if}</div>
				<h1 class="mt-3 break-words text-xl font-semibold tracking-tight">{data.profile.name}</h1>
				<p class="mt-1 text-sm text-muted-foreground">{data.total} {data.total === 1 ? 'post' : 'posts'}</p>
			</div>
		</section>
		<div class="flex min-h-11 items-center justify-between border-b border-border px-1"><h2 class="text-sm font-semibold">Posts</h2>{#if data.isOwner}<a href="/report" class="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">New post</a>{/if}</div>
		{#each data.posts as post (post.id)}<PostCard {post} {user} />{:else}<div class="rounded-xl border border-border bg-card p-8 text-center"><p class="text-sm text-muted-foreground">No posts yet.</p>{#if data.isOwner}<Button href="/report" class="mt-4 h-11">Share a road update</Button>{/if}</div>{/each}
		{#if data.hasMore}<Button variant="outline" class="h-11 w-full" onclick={more} disabled={loading}>{loading ? 'Loading…' : 'Load more posts'}</Button>{/if}
	</div>
</div>
{#if editOpen && data.isOwner}<ProfileEditor bind:open={editOpen} profile={data.profile} />{/if}
