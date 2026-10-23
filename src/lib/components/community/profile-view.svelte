<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import Avatar from './avatar.svelte';
	import PostCard from './post-card.svelte';
	import RepostCard from './repost-card.svelte';
	import ProfileEditor from './profile-editor.svelte';
	import CameraIcon from '@lucide/svelte/icons/camera';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import type { CommunityPost, CommunityFeedItem } from '$lib/types/community';
	let { data, user, embedded = false }: {
		embedded?: boolean;
		data: { profile: { id: string; name: string; avatarUrl: string | null; coverUrl: string | null }; isOwner: boolean; posts: CommunityPost[]; feed: CommunityFeedItem[]; total: number; hasMore: boolean; currentPage: number };
		user: { id: string } | null;
	} = $props();
	let editOpen = $state(false);
	let loading = $state(false);
	let uploading = $state<'avatar' | 'cover' | null>(null);
	let photoError = $state('');
	let photoMessage = $state('');
	let avatarInput = $state<HTMLInputElement>(null!);
	let coverInput = $state<HTMLInputElement>(null!);
	const canEdit = $derived(data.isOwner && !embedded);
	async function changePhoto(event: Event, kind: 'avatar' | 'cover') {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0]; input.value = '';
		if (!file || uploading || !canEdit) return;
		photoError = ''; photoMessage = '';
		if (file.size > 4 * 1024 * 1024) { photoError = 'Each photo must be 4 MB or less.'; return; }
		uploading = kind;
		try {
			const form = new FormData(); form.set('name', data.profile.name); form.set(kind, file);
			const response = await fetch('/api/profile', { method: 'POST', body: form });
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || 'Could not update your photo.');
			await invalidateAll(); photoMessage = kind === 'avatar' ? 'Profile picture updated.' : 'Cover photo updated.';
		} catch (cause) { photoError = cause instanceof Error ? cause.message : 'Could not update your photo.'; }
		finally { uploading = null; }
	}
	async function more() {
		loading = true;
		try { const url = new URL(page.url.href); url.searchParams.set('page', String(data.currentPage + 1)); await goto(url, { reset: false }); }
		finally { loading = false; }
	}
</script>
<svelte:head><title>{data.profile.name} — SuriOS</title></svelte:head>
<div class="min-h-full bg-muted/35 px-2 py-3 sm:px-5 sm:py-5">
	<div class="mx-auto max-w-[680px] space-y-4">
		<a href="/community" class="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeftIcon aria-hidden="true" class="size-4" />Back to feed</a>
		<section class="overflow-hidden rounded-xl border border-border bg-card" aria-label="Profile">
			<div class="photo-target relative aspect-[3/1] bg-primary/10">
				{#if data.profile.coverUrl}<img src={data.profile.coverUrl} alt="{data.profile.name}’s cover photo" class="size-full object-cover" />{/if}
				{#if canEdit}<button type="button" aria-label="Change cover photo" class="photo-control absolute bottom-3 right-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-black/65 px-3 text-xs font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" disabled={!!uploading} onclick={() => coverInput.click()}><CameraIcon aria-hidden="true" class="size-4" />{uploading === 'cover' ? 'Uploading…' : 'Change cover'}</button>{/if}
			</div>
			<div class="px-4 pb-4 sm:px-5"><div class="flex items-end justify-between gap-3"><div class="photo-target -mt-10 relative rounded-full bg-card p-1">
				<div role="img" aria-label="{data.profile.name}’s profile picture"><Avatar name={data.profile.name} src={data.profile.avatarUrl} class="size-20 text-xl sm:size-24" /></div>
				{#if canEdit}<button type="button" aria-label="Change profile picture" class="photo-control absolute inset-1 flex flex-col items-center justify-center gap-1 rounded-full bg-black/55 text-[10px] font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" disabled={!!uploading} onclick={() => avatarInput.click()}><CameraIcon aria-hidden="true" class="size-5" /><span>{uploading === 'avatar' ? 'Uploading…' : 'Change photo'}</span></button>{/if}
			</div>{#if canEdit}<Button variant="outline" class="mt-3 h-11 shrink-0" disabled={!!uploading} onclick={() => editOpen = true}>Edit profile</Button>{/if}</div>
				<h1 class="mt-3 break-words text-xl font-semibold tracking-tight">{data.profile.name}</h1>
				<p class="mt-1 text-sm text-muted-foreground">{data.total} {data.total === 1 ? 'post' : 'posts'}</p>
			</div>
			{#if photoError}<p role="alert" class="px-4 pb-4 text-sm text-destructive">{photoError}</p>{/if}
			{#if photoMessage}<p role="status" class="px-4 pb-4 text-xs text-muted-foreground">{photoMessage}</p>{/if}
			{#if canEdit}<input bind:this={avatarInput} type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" tabindex="-1" aria-label="Upload new profile picture" onchange={(event) => changePhoto(event, 'avatar')} /><input bind:this={coverInput} type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" tabindex="-1" aria-label="Upload new cover photo" onchange={(event) => changePhoto(event, 'cover')} />{/if}
		</section>
		<div class="flex min-h-11 items-center justify-between border-b border-border px-1"><h2 class="text-sm font-semibold">Posts</h2>{#if canEdit}<a href="/report" class="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">New post</a>{/if}</div>
		{#each data.feed as item (`${item.kind}:${item.id}`)}{#if item.kind === 'post'}<PostCard post={item.post} {user} />{:else}<RepostCard repost={item.repost} {user} />{/if}{:else}<div class="rounded-xl border border-border bg-card p-8 text-center"><p class="text-sm text-muted-foreground">No posts yet.</p>{#if canEdit}<Button href="/report" class="mt-4 h-11">Share a road update</Button>{/if}</div>{/each}
		{#if data.hasMore}<Button variant="outline" class="h-11 w-full" onclick={more} disabled={loading}>{loading ? 'Loading…' : 'Load more posts'}</Button>{/if}
	</div>
</div>
{#if editOpen && canEdit}<ProfileEditor bind:open={editOpen} profile={data.profile} />{/if}

<style>
	.photo-control { transition: opacity 150ms; }
	@media (hover: hover) and (pointer: fine) {
		.photo-control { opacity: 0; }
		.photo-target:hover .photo-control, .photo-target:focus-within .photo-control { opacity: 1; }
	}
	@media (prefers-reduced-motion: reduce) { .photo-control { transition: none; } }
</style>
