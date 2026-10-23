<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Avatar from './avatar.svelte';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import XIcon from '@lucide/svelte/icons/x';
	import SendIcon from '@lucide/svelte/icons/send';
	import type { CommunityRepost, CommunityComment } from '$lib/types/community';
	let { repost, user, detail = false, href }: { repost: CommunityRepost; user: { id: string } | null; detail?: boolean; href: string } = $props();
	let body = $state('');
	let reply = $state<CommunityComment | null>(null);
	let busy = $state(false);
	let issue = $state('');
	const comments = $derived(detail ? repost.comments : [...repost.comments].sort((a, b) => b.likes - a.likes || b.replies - a.replies).slice(0, 1));
	async function send() {
		if (busy) return;
		if (!user) { await goto(`/login?redirectTo=${encodeURIComponent(href)}`); return; }
		busy = true; issue = '';
		try { const response = await fetch(`/api/community/reposts/${repost.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'comment', body, parentId: reply?.id || null }) }); const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not post comment.'); body = ''; reply = null; await invalidateAll(); }
		catch (cause) { issue = cause instanceof Error ? cause.message : 'Could not post comment.'; } finally { busy = false; }
	}
	async function like(comment: CommunityComment) {
		if (busy) return;
		if (!user) { await goto(`/login?redirectTo=${encodeURIComponent(href)}`); return; }
		busy = true; issue = '';
		try { const response = await fetch(`/api/community/reposts/${repost.id}/comments/${comment.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ liked: !comment.userLiked }) }); if (!response.ok) throw new Error('Could not save reaction.'); await invalidateAll(); }
		catch (cause) { issue = cause instanceof Error ? cause.message : 'Could not save reaction.'; } finally { busy = false; }
	}
</script>
{#if comments.length || detail}<section id="quote-comments-{repost.id}" aria-label={detail ? 'Update comments' : 'Top update comment'} class="space-y-3 border-t border-border bg-muted/20 p-3 sm:p-4">
	{#if detail}<h3 class="text-sm font-semibold">Comments</h3>{/if}
	{#each comments as comment (comment.id)}<div data-quote-comment-id={comment.id} id="quote-comment-{comment.id}" class="flex min-w-0 gap-2" class:ml-5={detail && !!comment.parentId}><a href="/community?profile={comment.author.id}" aria-label="View profile of {comment.author.name}"><Avatar name={comment.author.name} src={comment.author.avatarUrl} class="size-8" /></a><div class="min-w-0 flex-1"><div class="rounded-xl bg-muted p-2.5"><a href="/community?profile={comment.author.id}" class="text-xs font-semibold">{comment.author.name}</a>{#if comment.parentId}<p class="text-[11px] text-muted-foreground">Replying to {repost.comments.find((item) => item.id === comment.parentId)?.author.name || 'a comment'}</p>{/if}<p class="break-words text-sm leading-5">{comment.body}</p></div><div class="flex items-center gap-3"><button type="button" disabled={busy} aria-label="Like comment by {comment.author.name}" aria-pressed={comment.userLiked} class="inline-flex min-h-11 items-center gap-1 px-1 text-xs {comment.userLiked ? 'text-primary' : 'text-muted-foreground'}" onclick={() => like(comment)}><HeartIcon class="size-3.5" />{comment.likes}</button>{#if detail}<button type="button" class="min-h-11 text-xs text-muted-foreground" onclick={() => { reply = comment; document.getElementById(`quote-input-${repost.id}`)?.focus(); }}>Reply</button>{:else}<a href="{href.split('#')[0]}#quote-comments-{repost.id}" class="inline-flex min-h-11 items-center text-xs text-muted-foreground">Reply</a>{/if}</div></div></div>{/each}
	{#if detail}{#if reply}<div class="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>Replying to {reply.author.name}</span><button type="button" aria-label="Cancel reply" class="flex size-11 items-center justify-center" onclick={() => reply = null}><XIcon class="size-4" /></button></div>{/if}<form class="flex min-w-0 gap-2" onsubmit={(event) => { event.preventDefault(); void send(); }}><Input id="quote-input-{repost.id}" aria-label="Comment on update by {repost.author.name}" placeholder={reply ? 'Write a reply…' : 'Write a comment…'} bind:value={body} maxlength={1000} class="h-11 min-w-0 flex-1 rounded-full bg-card" /><Button type="submit" variant="ghost" size="icon" aria-label={reply ? 'Send reply' : 'Send comment'} disabled={busy || !body.trim()} class="size-11 shrink-0"><SendIcon class="size-4" /></Button></form>{:else}<a href="{href.split('#')[0]}#quote-comments-{repost.id}" class="inline-flex min-h-11 items-center text-xs font-medium text-primary">View all {repost.comments.length} comments</a>{/if}
	{#if issue}<p role="alert" class="text-sm text-destructive">{issue}</p>{/if}
</section>{/if}
