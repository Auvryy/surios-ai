<script lang="ts">
	import { page } from '$app/state';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '$lib/components/ui/dialog';
	import Share2Icon from '@lucide/svelte/icons/share-2';
	import LinkIcon from '@lucide/svelte/icons/link';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	let { title, path }: { title: string; path: string } = $props();
	let open = $state(false);
	let status = $state('');
	let busy = $state(false);
	let messengerReady = $state(false);
	let nativeShare = $state(false);
	let linkInput = $state<HTMLInputElement>();
	const url = $derived(new URL(path, page.url.origin).href);
	const facebookUrl = $derived(`https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({ u: url })}`);
	$effect(() => { nativeShare = typeof navigator.share === 'function'; });
	$effect(() => { if (!open) { status = ''; messengerReady = false; } });
	async function copy() {
		try {
			await navigator.clipboard.writeText(url);
			status = 'Link copied.';
			return true;
		} catch {
			status = 'Select and copy the link below.';
			linkInput?.focus(); linkInput?.select();
			return false;
		}
	}
	async function shareInApps() {
		if (busy) return 'busy';
		busy = true; status = '';
		try {
			await navigator.share({ title, url });
			return 'shared';
		} catch (cause) {
			if (cause instanceof Error && cause.name === 'AbortError') return 'cancelled';
			status = 'Your device could not open sharing. You can copy the link instead.';
			return 'failed';
		} finally { busy = false; }
	}
	async function messenger() {
		if (nativeShare && await shareInApps() !== 'failed') return;
		messengerReady = true;
		await copy();
	}
</script>

<Dialog bind:open>
	<DialogTrigger>{#snippet child({ props })}<button {...props} class="share-trigger flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-[.8125rem] font-medium hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" aria-label="Share"><Share2Icon aria-hidden="true" class="size-4" />Share</button>{/snippet}</DialogTrigger>
	<DialogContent class="max-h-[calc(100svh_-_2rem)] w-full max-w-[calc(100%_-_2rem)] gap-4 overflow-y-auto rounded-xl p-5 sm:max-w-sm">
		<DialogHeader><DialogTitle>Share post</DialogTitle><DialogDescription>Send this post to someone or copy its link.</DialogDescription></DialogHeader>
		<div class="space-y-1">
			<button type="button" class="share-option" onclick={copy}><LinkIcon aria-hidden="true" class="size-5 text-primary" /><span>Copy link</span></button>
			<a class="share-option" href={facebookUrl} target="_blank" rel="noopener noreferrer"><ExternalLinkIcon aria-hidden="true" class="size-5 text-primary" /><span>Facebook</span></a>
			<button type="button" class="share-option" disabled={busy} onclick={messenger}><MessageCircleIcon aria-hidden="true" class="size-5 text-primary" /><span class="text-left"><span class="block">Messenger</span><span class="block text-xs font-normal text-muted-foreground">{nativeShare ? 'Choose Messenger in your device’s share menu' : 'Copy the link, then paste it into your chat'}</span></span></button>
			{#if nativeShare}<button type="button" class="share-option" disabled={busy} onclick={shareInApps}><Share2Icon aria-hidden="true" class="size-5 text-primary" /><span>More apps</span></button>{/if}
		</div>
		{#if messengerReady}<a href="https://www.facebook.com/messages/" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-secondary">Open Messenger<ExternalLinkIcon aria-hidden="true" class="size-4" /></a>{/if}
		<label class="block min-w-0 text-xs text-muted-foreground">Post link<input bind:this={linkInput} aria-label="Post link" readonly value={url} onclick={(event) => event.currentTarget.select()} class="mt-1 h-11 w-full min-w-0 rounded-lg border border-border bg-muted/40 px-3 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-ring" /></label>
		{#if status}<p role="status" class="text-xs text-muted-foreground">{status}</p>{/if}
	</DialogContent>
</Dialog>

<style>
	.share-option { display: flex; width: 100%; min-height: 48px; align-items: center; gap: 12px; border-radius: 8px; padding: 10px 12px; font-size: .875rem; font-weight: 500; }
	.share-option:hover { background: var(--secondary); }
	.share-option:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
	.share-option:disabled { opacity: .6; cursor: wait; }
	@media (max-width: 400px) { .share-trigger { flex-direction: column; gap: 2px; padding-block: 5px; font-size: .6875rem; } }
</style>
