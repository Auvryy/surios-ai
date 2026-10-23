<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import ImageIcon from '@lucide/svelte/icons/image';
	import XIcon from '@lucide/svelte/icons/x';
	import type { CommunityPost } from '$lib/types/community';
	let { open = $bindable(false), post, user }: { open: boolean; post: CommunityPost; user: { id: string } | null } = $props();
	let body = $state('');
	let image = $state<File | null>(null);
	let preview = $state('');
	let busy = $state(false);
	let issue = $state('');
	let requestId = $state('');
	$effect(() => { if (open && !requestId) requestId = crypto.randomUUID(); });
	$effect(() => {
		if (!image) { preview = ''; return; }
		const url = URL.createObjectURL(image); preview = url;
		return () => URL.revokeObjectURL(url);
	});
	function attach(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const files = Array.from(input.files || []); input.value = ''; issue = '';
		if (files.length !== 1) { issue = 'Choose at most one image.'; return; }
		if (!['image/jpeg', 'image/png', 'image/webp'].includes(files[0].type)) { issue = 'Use a JPEG, PNG, or WebP image.'; return; }
		if (files[0].size > 4 * 1024 * 1024) { issue = 'The repost image must be 4 MB or less.'; return; }
		image = files[0];
	}
	async function publish() {
		if (!user) { await goto(`/login?redirectTo=${encodeURIComponent(page.url.pathname + page.url.search)}`); return; }
		if (busy) return;
		busy = true; issue = '';
		try {
			const form = new FormData(); form.set('id', requestId); form.set('postId', post.id); form.set('body', body);
			if (image) form.set('image', image);
			const response = await fetch('/api/community/reposts', { method: 'POST', body: form });
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || 'Could not repost. Try again.');
			open = false; body = ''; image = null; requestId = '';
			await invalidateAll();
			await goto(`/community/post/${post.id}?repost=${result.id}#repost-${result.id}`);
		} catch (cause) { issue = cause instanceof Error ? cause.message : 'Could not repost.'; }
		finally { busy = false; }
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-h-[90svh] overflow-y-auto sm:max-w-lg">
		<DialogHeader><DialogTitle>Repost</DialogTitle><DialogDescription>Share this update with your community.</DialogDescription></DialogHeader>
		<form class="space-y-4" onsubmit={(event) => { event.preventDefault(); void publish(); }}>
			<label class="block text-sm font-medium" for="repost-body-{post.id}">Add your thoughts <span class="font-normal text-muted-foreground">(optional)</span></label>
			<textarea id="repost-body-{post.id}" aria-label="Repost text" bind:value={body} maxlength={1000} rows="3" class="w-full resize-y rounded-lg border border-border bg-card p-3 text-sm" placeholder="What would you like to add?" disabled={busy}></textarea>
			{#if preview}<div class="relative overflow-hidden rounded-lg border border-border"><img src={preview} alt="Repost attachment preview" class="max-h-64 w-full object-contain" /><button type="button" class="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full bg-card/95" aria-label="Remove repost image" disabled={busy} onclick={() => image = null}><XIcon aria-hidden="true" class="size-4" /></button></div>{/if}
			<label class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm text-primary hover:bg-primary/10"><ImageIcon aria-hidden="true" class="size-4" />{image ? 'Replace image' : 'Add one image'}<input aria-label="Repost image" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" disabled={busy} onchange={attach} /></label>
			<div class="rounded-lg border border-border px-3 py-3"><p class="text-xs text-muted-foreground">{post.author.name}</p><p class="mt-1 break-words text-sm font-medium">{post.title}</p></div>
			<p class="text-xs leading-5 text-muted-foreground">Reposts share the original report. They do not increase hazard severity or count as new evidence.</p>
			{#if issue}<p role="alert" class="text-sm text-destructive">{issue}</p>{/if}
			<div class="flex justify-end"><Button type="submit" disabled={busy}>{busy ? 'Posting…' : 'Publish repost'}</Button></div>
		</form>
	</DialogContent>
</Dialog>
