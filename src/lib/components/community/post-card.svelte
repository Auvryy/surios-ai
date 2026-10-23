<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import PostMedia from './post-media.svelte';
	import RepostComposer from './repost-composer.svelte';
	import Avatar from './avatar.svelte';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import Share2Icon from '@lucide/svelte/icons/share-2';
	import Repeat2Icon from '@lucide/svelte/icons/repeat-2';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import SendIcon from '@lucide/svelte/icons/send';
	import XIcon from '@lucide/svelte/icons/x';
	import type { CommunityPost, CommunityComment } from '$lib/types/community';
	let { post, user, detail = false, mediaId = '' }: { post: CommunityPost; user: { id: string } | null; detail?: boolean; mediaId?: string } = $props();
	let article = $state<HTMLElement>();
	let commentInput = $state('');
	let busy = $state(false);
	let actionError = $state('');
	let message = $state('');
	let repostOpen = $state(false);
	let replyTarget = $state<CommunityComment | null>(null);
	const threadUrl = $derived(`/community/post/${post.id}`);
	const comments = $derived(detail ? post.comments : post.comments.slice(0, 1));
	// The title is a native keyboard-accessible link. Pointer clicks on the rest
	// of the card use the same destination without hijacking child controls.
	$effect(() => {
		if (!article || detail) return;
		const target = article;
		function openBlank(event: MouseEvent) {
			if (!(event.target instanceof Element) || event.button !== 0 || event.defaultPrevented) return;
			if (event.target.closest('a,button,input,textarea,select,summary,video,iframe,details,label,[data-no-post-open]')) return;
			if (window.getSelection()?.toString()) return;
			if (event.metaKey || event.ctrlKey) window.open(threadUrl, '_blank', 'noopener');
			else void goto(threadUrl);
		}
		target.addEventListener('click', openBlank);
		return () => target.removeEventListener('click', openBlank);
	});
	async function signedIn() {
		if (user) return true;
		await goto(`/login?redirectTo=${encodeURIComponent(threadUrl)}`); return false;
	}
	async function interact(payload: Record<string, unknown>) {
		if (!await signedIn() || busy) return;
		busy = true; actionError = '';
		try {
			const response = await fetch(`/api/community/posts/${post.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || 'Unable to save. Please try again.');
			if (payload.action === 'comment') { commentInput = ''; replyTarget = null; }
			await invalidateAll();
		} catch (cause) { actionError = cause instanceof Error ? cause.message : 'Unable to save.'; }
		finally { busy = false; }
	}
	async function like(comment: CommunityComment) {
		if (!await signedIn() || busy) return;
		busy = true; actionError = '';
		try {
			const response = await fetch(`/api/community/comments/${comment.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ liked: !comment.userLiked }) });
			if (!response.ok) throw new Error((await response.json()).message || 'Unable to like this comment.');
			await invalidateAll();
		} catch (cause) { actionError = cause instanceof Error ? cause.message : 'Unable to save.'; }
		finally { busy = false; }
	}
	async function share() {
		try { await navigator.clipboard.writeText(`${window.location.origin}${threadUrl}`); message = 'Post link copied.'; }
		catch { message = 'Unable to copy the link. Copy this page’s address from your browser.'; }
	}
	async function repost() { if (await signedIn()) repostOpen = true; }
	function timeAgo(date: string) {
		const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(date)) / 60000));
		return minutes < 1 ? 'Just now' : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : new Date(date).toLocaleDateString();
	}
</script>

<article bind:this={article} id="post-{post.id}" class="scroll-mt-4 overflow-hidden rounded-xl border border-border bg-card" class:cursor-pointer={!detail}>
	<header class="flex items-center justify-between gap-2 px-3 py-3 sm:px-4">
		<a class="flex min-w-0 items-center gap-2.5 rounded-lg text-left" aria-label="View profile of {post.author.name}" href="/community?profile={post.author.id}"><Avatar name={post.author.name} src={post.author.avatarUrl} /><span class="min-w-0"><span class="block truncate text-sm font-semibold">{post.author.name}</span><span class="block text-xs text-muted-foreground">{timeAgo(post.createdAt)} · Community</span></span></a>
		<span class="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold {post.analysis.riskLevel === 'CRITICAL' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}">{post.analysis.hazardSeverity}/10 {post.analysis.riskLevel.toLowerCase()}</span>
	</header>
	<div class="space-y-1 px-3 pb-3 sm:px-4"><h2 class="text-sm font-semibold leading-snug"><a href={threadUrl} class="rounded-sm hover:underline">{post.title}</a></h2>{#if post.body}<p class="break-words text-sm leading-5 text-muted-foreground" class:line-clamp-2={!detail}>{post.body}</p>{#if !detail && post.body.length > 150}<a href={threadUrl} class="inline-flex min-h-8 items-center text-xs font-semibold hover:underline">Read full post</a>{/if}{/if}</div>
	<PostMedia {post} {detail} {mediaId} />
	{#if message}<p role="status" class="px-3 py-2 text-xs text-muted-foreground">{message}</p>{/if}
	<div class="space-y-2 px-3 py-2 sm:px-4">
		<a href="https://www.openstreetmap.org/?mlat={post.latitude}&mlon={post.longitude}#map=17/{post.latitude}/{post.longitude}" target="_blank" rel="noreferrer" class="flex items-start gap-1.5 text-xs text-muted-foreground hover:underline"><MapPinIcon aria-hidden="true" class="mt-0.5 size-3.5 shrink-0 text-primary" />{post.locationName}</a>
		<details class="rounded-lg bg-primary/5 px-3"><summary class="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-medium"><SparklesIcon aria-hidden="true" class="size-3.5 text-primary" />AI assessed · {post.analysis.distressType.replaceAll('_', ' ')}<span class="ml-auto text-muted-foreground">Details</span></summary><div class="space-y-2 pb-3 text-xs leading-5 text-muted-foreground"><p>{post.analysis.summary}</p><p><strong class="font-medium text-foreground">Rider risk:</strong> {post.analysis.vruLethality.toLowerCase()} · {post.analysis.vruDetails}</p><p><strong class="font-medium text-foreground">Suggested repair:</strong> {post.analysis.recommendedAction}</p><p>AI estimates require on-site inspection.</p><a class="inline-flex min-h-10 items-center gap-1 font-medium text-primary hover:underline" href="/map?report={post.reportId}"><MapPinIcon aria-hidden="true" class="size-3.5" />View hazard on map · {post.reportId.slice(0, 8).toUpperCase()}</a>{#if post.grouping}<p>{post.grouping.reason}</p>{/if}</div></details>
	</div>
	<div class="flex flex-wrap items-center justify-between gap-x-3 px-3 pb-2 text-xs text-muted-foreground sm:px-4"><span>{post.confirmations} confirmations</span><a class="inline-flex min-h-8 items-center hover:underline" href="{threadUrl}#comments">{post.comments.length} comments · {post.reposts || 0} reposts</a></div>
	<div class="mx-3 grid grid-cols-4 border-t border-border py-1 sm:mx-4">
		<button class="feed-action {post.userConfirmed ? 'text-primary' : ''}" aria-pressed={post.userConfirmed} disabled={busy} onclick={() => interact({ action: 'confirm', confirmed: !post.userConfirmed })}><ThumbsUpIcon aria-hidden="true" class="size-4" />{post.userConfirmed ? 'Confirmed' : 'Confirm'}</button>
		<a class="feed-action" href="{threadUrl}#comments"><MessageSquareIcon aria-hidden="true" class="size-4" />Comment</a>
		<button class="feed-action {post.userReposted ? 'text-primary' : ''}" onclick={repost}><Repeat2Icon aria-hidden="true" class="size-4" />Repost</button>
		<button class="feed-action" onclick={share}><Share2Icon aria-hidden="true" class="size-4" />Share</button>
	</div>
	{#if actionError}<p role="alert" class="px-3 pb-3 text-sm text-destructive">{actionError}</p>{/if}
	{#if comments.length || detail}<section id={detail ? 'comments' : undefined} aria-label={detail ? 'Comments' : 'Top comment'} class="space-y-3 border-t border-border bg-muted/20 p-3 sm:p-4">
		{#if detail}<h3 class="text-sm font-semibold">Comments</h3>{:else}<p class="text-xs font-medium text-muted-foreground">Top comment</p>{/if}
		{#each comments as comment (comment.id)}
			<div id="comment-{comment.id}" data-comment-id={comment.id} class="flex min-w-0 scroll-mt-4 items-start gap-2" class:ml-5={detail && !!comment.parentId}>
				<a href="/community?profile={comment.author.id}" aria-label="View profile of {comment.author.name}"><Avatar name={comment.author.name} src={comment.author.avatarUrl} class="size-8 text-[10px]" /></a>
				<div class="min-w-0 flex-1"><div class="rounded-xl bg-muted px-3 py-2"><a href="/community?profile={comment.author.id}" class="text-xs font-semibold hover:underline">{comment.author.name}</a>{#if detail && comment.parentId}<a href="#comment-{comment.parentId}" class="mt-1 block text-xs text-muted-foreground hover:underline">Replying to {post.comments.find((item) => item.id === comment.parentId)?.author.name || 'a comment'}</a>{/if}<p class="break-words text-sm">{comment.body}</p></div>
					<div class="flex items-center gap-3"><button type="button" class="inline-flex min-h-11 items-center gap-1 px-2 text-xs {comment.userLiked ? 'text-primary' : 'text-muted-foreground'}" aria-label="Like comment by {comment.author.name}" aria-pressed={comment.userLiked} disabled={busy} onclick={() => like(comment)}><HeartIcon aria-hidden="true" class="size-3.5" />{comment.likes || 0}</button>{#if detail}<button type="button" class="min-h-11 px-2 text-xs font-medium text-muted-foreground hover:text-primary" onclick={() => { replyTarget = comment; document.getElementById(`comment-input-${post.id}`)?.focus(); }}>Reply</button>{:else}<a href="{threadUrl}#comment-{comment.id}" class="inline-flex min-h-11 items-center text-xs text-muted-foreground hover:text-primary">Reply</a>{/if}</div>
				</div>
			</div>
		{/each}
		{#if !detail}<a href="{threadUrl}#comments" class="inline-flex min-h-11 items-center text-xs font-medium text-primary hover:underline">View all {post.comments.length} comments</a>{:else}
			{#if replyTarget}<div class="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>Replying to {replyTarget.author.name}</span><button type="button" aria-label="Cancel reply" class="flex size-11 items-center justify-center rounded-lg hover:bg-secondary" onclick={() => replyTarget = null}><XIcon aria-hidden="true" class="size-4" /></button></div>{/if}
			<form class="flex items-center gap-2" onsubmit={(event) => { event.preventDefault(); void interact({ action: 'comment', body: commentInput, parentId: replyTarget?.id || null }); }}>
				<Input id="comment-input-{post.id}" aria-label="Comment on {post.title}" placeholder={replyTarget ? 'Write a reply…' : 'Write a comment…'} bind:value={commentInput} maxlength={1000} class="h-11 min-w-0 flex-1 rounded-full bg-card" />
				<Button type="submit" variant="ghost" size="icon" class="size-11 shrink-0" aria-label={replyTarget ? 'Send reply' : 'Send comment'} disabled={!commentInput?.trim() || busy}><SendIcon aria-hidden="true" class="size-4" /></Button>
			</form>
		{/if}
	</section>{/if}
</article>
{#if repostOpen}<RepostComposer bind:open={repostOpen} {post} {user} />{/if}

<style>
	.feed-action { display: flex; min-height: 44px; align-items: center; justify-content: center; gap: 6px; border-radius: 8px; font-size: .8125rem; font-weight: 500; cursor: pointer; }
	.feed-action:hover { background: var(--secondary); }
	.feed-action:disabled { cursor: wait; opacity: .6; }
	@media (max-width: 400px) { .feed-action { flex-direction: column; gap: 2px; padding-block: 5px; font-size: .6875rem; } }
</style>
