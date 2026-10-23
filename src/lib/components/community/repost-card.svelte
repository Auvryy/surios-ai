<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import Avatar from './avatar.svelte';
	import QuotePreview from './quote-preview.svelte';
	import QuoteGallery from './quote-gallery.svelte';
	import QuoteDiscussion from './quote-discussion.svelte';
	import RepostComposer from './repost-composer.svelte';
	import Repeat2Icon from '@lucide/svelte/icons/repeat-2';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import PostShare from './post-share.svelte';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import ClockIcon from '@lucide/svelte/icons/clock-3';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import { pesos, budgetTotal, type CommunityRepost } from '$lib/types/community';
	let { repost, user, detail = false, mediaId = '' }: { repost: CommunityRepost; user: { id: string; role?: string } | null; detail?: boolean; mediaId?: string } = $props();
	let card = $state<HTMLElement>();
	let busy = $state(false);
	let issue = $state('');
	let repostOpen = $state(false);
	const official = $derived(repost.governmentUpdate);
	const photos = $derived(official ? official.attachments.filter((file) => file.kind === 'photo') : repost.media);
	const documents = $derived(official?.attachments.filter((file) => file.kind === 'document') || []);
	const currentStatus = $derived(repost.post.reportStatus === 'RESOLVED' ? 'RESOLVED' : ['IN_REPAIR', 'DISPATCHED', 'AWAITING_REVIEW'].includes(repost.post.reportStatus) ? 'IN_PROGRESS' : official?.status);
	const href = $derived(`/community/post/${repost.post.id}?repost=${repost.id}#repost-${repost.id}`);
	$effect(() => {
		if (!card || detail) return;
		const element = card;
		function open(event: MouseEvent) {
			if (event.button !== 0 || event.defaultPrevented || !(event.target instanceof Element) || event.target.closest('a,button,input,textarea,form,label,select,summary,details,iframe') || window.getSelection()?.toString()) return;
			if (event.ctrlKey || event.metaKey) window.open(href, '_blank', 'noopener'); else void goto(href);
		}
		element.addEventListener('click', open);
		return () => element.removeEventListener('click', open);
	});
	async function signedIn() { if (user) return true; await goto(`/login?redirectTo=${encodeURIComponent(href)}`); return false; }
	async function react() {
		if (!await signedIn() || busy) return; busy = true; issue = '';
		try { const response = await fetch(`/api/community/reposts/${repost.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'like', liked: !repost.userLiked }) }); const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not save reaction.'); await invalidateAll(); }
		catch (cause) { issue = cause instanceof Error ? cause.message : 'Could not save reaction.'; } finally { busy = false; }
	}
	async function undo() {
		if (busy) return; busy = true; issue = '';
		try { const response = await fetch(`/api/community/reposts?id=${repost.id}`, { method: 'DELETE' }); if (!response.ok) throw new Error((await response.json()).message || 'Could not remove repost.'); await invalidateAll(); }
		catch (cause) { issue = cause instanceof Error ? cause.message : 'Could not remove repost.'; } finally { busy = false; }
	}
</script>

<article bind:this={card} id="repost-{repost.id}" data-repost-id={repost.id} class="scroll-mt-4 overflow-hidden rounded-xl border border-border bg-card" class:cursor-pointer={!detail}>
	<header class="flex items-start justify-between gap-3 px-3 pt-4 pb-3 sm:px-4">
		<a href="/community?profile={repost.author.id}" class="flex min-w-0 items-center gap-2.5"><Avatar name={repost.author.name} src={repost.author.avatarUrl} /><span class="min-w-0"><span class="block truncate text-sm font-semibold">{repost.author.name}</span><span class="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">{#if !official}<Repeat2Icon aria-hidden="true" class="size-3" />{/if}{official ? 'Government update' : 'Reposted'}<span aria-hidden="true">·</span>{new Date(repost.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span></span></a>
		{#if official}<a data-government-status={currentStatus} href={repost.post.governmentUpdateLink || href} class="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold {currentStatus === 'RESOLVED' ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-emerald-950' : 'border-amber-500 bg-amber-100 text-amber-950 dark:bg-amber-400 dark:text-amber-950'}">{#if currentStatus === 'RESOLVED'}<CheckCircleIcon aria-hidden="true" class="size-3.5" />Resolved{:else}<ClockIcon aria-hidden="true" class="size-3.5" />In progress{/if}</a>{:else if user?.id === repost.author.id}<button type="button" disabled={busy} onclick={undo} class="min-h-11 shrink-0 rounded-lg px-2 text-xs text-muted-foreground hover:bg-secondary">Undo repost</button>{/if}
	</header>
	<div class="space-y-3 px-3 pb-3 sm:px-4">
		{#if official && currentStatus !== official.status}<p class="text-[11px] text-muted-foreground">Posted as {official.status === 'RESOLVED' ? 'Resolved' : 'In progress'} · Status reflects the latest government update.</p>{/if}
		{#if repost.body}<p class="break-words whitespace-pre-wrap text-sm leading-6" class:line-clamp-4={!detail}>{repost.body}</p>{#if !detail && repost.body.length > 220}<a {href} class="inline-flex min-h-8 items-center text-xs font-medium text-primary hover:underline">Read full update</a>{/if}{/if}
		{#if documents.length}<div class="rounded-lg border border-border px-3">{#each documents as attachment}<a href={attachment.url} download={attachment.name} class="flex min-h-12 items-center gap-2 py-2 text-xs text-muted-foreground hover:text-foreground"><FileTextIcon aria-hidden="true" class="size-4 shrink-0 text-primary" /><span class="min-w-0 flex-1 truncate">{attachment.name}</span><DownloadIcon aria-hidden="true" class="size-4 shrink-0" /><span class="sr-only">Download PDF</span></a>{/each}</div>{/if}
		{#if official?.budget.length}<details class="rounded-lg border border-border px-3"><summary class="flex min-h-12 cursor-pointer flex-wrap items-center justify-between gap-2 py-2 text-xs font-medium"><span>{official.budgetType === 'ACTUAL' ? 'Actual expenditure' : 'Estimated budget'}</span><span class="text-sm font-semibold tabular-nums">{pesos(budgetTotal(official.budget))}<span class="ml-1 text-muted-foreground" aria-hidden="true">⌄</span></span></summary><dl class="space-y-2 border-t border-border py-3">{#each official.budget as item}<div class="flex items-baseline justify-between gap-4 text-xs"><dt class="min-w-0 break-words text-muted-foreground">{item.label}</dt><dd class="shrink-0 tabular-nums">{pesos(item.amount)}</dd></div>{/each}<div class="flex justify-between gap-3 border-t border-border pt-2 text-xs font-semibold"><dt>Total</dt><dd>{pesos(budgetTotal(official.budget))}</dd></div></dl></details>{/if}
		<QuoteGallery images={photos} {href} {detail} selectedId={mediaId} />
		<QuotePreview post={repost.post} quote={repost.quotedRepost} />
	</div>
	<div class="flex flex-wrap items-center justify-between gap-2 px-3 pb-2 text-[11px] text-muted-foreground sm:px-4"><span>{repost.likes} {repost.likes === 1 ? 'reaction' : 'reactions'}</span><a href="{href.split('#')[0]}#quote-comments-{repost.id}" class="inline-flex min-h-8 items-center hover:underline">{repost.comments.length} comments · {repost.reposts} reposts</a></div>
	<div class="mx-3 grid grid-cols-4 border-t border-border py-1 sm:mx-4"><button type="button" class="quote-action {repost.userLiked ? 'text-primary' : ''}" aria-pressed={repost.userLiked} disabled={busy} onclick={react}><HeartIcon aria-hidden="true" class="size-4" />{repost.userLiked ? 'Liked' : 'Like'}</button><a class="quote-action" href="{href.split('#')[0]}#quote-comments-{repost.id}"><MessageSquareIcon aria-hidden="true" class="size-4" />Comment</a><button type="button" class="quote-action" onclick={async () => { if (await signedIn()) repostOpen = true; }}><Repeat2Icon aria-hidden="true" class="size-4" />Repost</button><PostShare title={`${repost.author.name} — SuriOS`} path={href} /></div>
	{#if issue}<p role="alert" class="px-3 pb-3 text-sm text-destructive">{issue}</p>{/if}
	<QuoteDiscussion {repost} {user} {detail} {href} />
</article>
{#if repostOpen}<RepostComposer bind:open={repostOpen} post={repost.post} quote={repost} {user} />{/if}
<style>
	.quote-action { display:flex;min-height:44px;align-items:center;justify-content:center;gap:6px;border-radius:8px;font-size:.8125rem;font-weight:500; }
	.quote-action:hover { background:var(--secondary); }
	.quote-action:disabled { opacity:.6;cursor:wait; }
	@media(max-width:400px) { .quote-action { flex-direction:column;gap:2px;padding-block:5px;font-size:.6875rem; } }
</style>
