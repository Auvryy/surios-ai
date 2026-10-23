<script lang="ts">
	import { onDestroy } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import LocationPicker from './location-picker.svelte';
	import ImageIcon from '@lucide/svelte/icons/image';
	import VideoIcon from '@lucide/svelte/icons/video';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import XIcon from '@lucide/svelte/icons/x';
	import LoaderIcon from '@lucide/svelte/icons/loader-circle';
	import type { PostMedia } from '$lib/types/community';
	import type { TriageAnalysis } from '$lib/types/triage';
	let { open = $bindable(false), user, onpublished }: { open?: boolean; user: { name: string } | null; onpublished: (id: string, grouped?: boolean) => void } = $props();
	type Attachment = { id: string; file: File; url: string; kind: 'photo' | 'video' };
	let attachments = $state<Attachment[]>([]);
	let cover = $state('');
	let title = $state('');
	let body = $state('');
	let locationName = $state('');
	let latitude = $state(14.2813);
	let longitude = $state(121.4173);
	let error = $state('');
	let busy = $state<'assessing' | 'publishing' | null>(null);
	let assessment = $state<{ draftId: string; media: PostMedia[]; analysis: TriageAnalysis } | null>(null);
	let fileInput = $state<HTMLInputElement>(null!);
	let requested = $state<'photo' | 'video'>('photo');
	const coverMedia = $derived(attachments.find((item) => item.id === cover));
	onDestroy(() => attachments.forEach((item) => URL.revokeObjectURL(item.url)));
	function choose(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const selected = [...(input.files || [])];
		input.value = '';
		addFiles(selected);
	}
	export function addFiles(selected: File[]) {
		error = '';
		if (!selected.length) return;
		const combined = [...attachments.map((item) => item.file), ...selected];
		if (combined.length > 6 || combined.some((file) => file.size > 10 * 1024 * 1024) || combined.reduce((total, file) => total + file.size, 0) > 12 * 1024 * 1024) { error = 'Choose up to 6 files, 10 MB each and 12 MB in total.'; return; }
		const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
		if (selected.some((file) => !allowed.includes(file.type))) { error = 'Use JPEG, PNG, WebP, MP4, WebM, or MOV files.'; return; }
		attachments.push(...selected.map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file), kind: file.type.startsWith('video/') ? 'video' as const : 'photo' as const })));
		if (!cover) cover = attachments[0].id;
		assessment = null;
	}
	function remove(id: string) {
		const item = attachments.find((item) => item.id === id);
		if (item) URL.revokeObjectURL(item.url);
		attachments = attachments.filter((item) => item.id !== id);
		if (cover === id) cover = attachments[0]?.id || '';
		assessment = null; error = '';
	}
	async function assess() {
		if (!attachments.length || busy) return;
		busy = 'assessing'; error = '';
		try {
			const form = new FormData(); attachments.forEach((item) => form.append('media', item.file));
			const response = await fetch('/api/community/assess', { method: 'POST', body: form });
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || result.message || 'Assessment failed. Please try again.');
			assessment = result;
			if (!title.trim()) title = result.analysis.distressType.replaceAll('_', ' ').replace(/^./, (letter: string) => letter.toUpperCase());
		} catch (cause) { error = cause instanceof Error ? cause.message : 'Unable to assess your attachments.'; }
		finally { busy = null; }
	}
	async function publish() {
		if (!assessment || busy) return;
		busy = 'publishing'; error = '';
		try {
			const coverIndex = attachments.findIndex((item) => item.id === cover);
			const response = await fetch('/api/community/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draftId: assessment.draftId, coverId: assessment.media[coverIndex]?.id, title, body, locationName, latitude: Number(latitude), longitude: Number(longitude) }) });
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || result.error || 'Unable to publish. Your draft is saved here.');
			await invalidateAll();
			attachments.forEach((item) => URL.revokeObjectURL(item.url)); attachments = []; assessment = null; cover = ''; title = ''; body = ''; locationName = '';
			open = false; onpublished(result.id, result.grouped);
		} catch (cause) { error = cause instanceof Error ? cause.message : 'Unable to publish. Please try again.'; }
		finally { busy = null; }
	}
</script>
<Dialog bind:open onOpenChange={(next) => { if (!busy) open = next; }}>
	<DialogContent class="max-h-[92svh] overflow-y-auto sm:max-w-xl" onInteractOutside={(event) => { if (busy) event.preventDefault(); }} onEscapeKeydown={(event) => { if (busy) event.preventDefault(); }} showCloseButton={!busy}>
		<DialogHeader><DialogTitle>Share a road update</DialogTitle><DialogDescription>Add your evidence, choose a cover, and let AI assess the hazard before you publish.</DialogDescription></DialogHeader>
		{#if !user}<div class="rounded-xl border border-border bg-muted p-4 text-center"><p class="text-sm">Sign in to share a road update with your community.</p><Button href="/login?redirectTo=/community" class="mt-3">Sign in to post</Button></div>
		{:else}
		<form class="space-y-5" onsubmit={(event) => { event.preventDefault(); void publish(); }}>
			<div class="flex items-center gap-2.5"><span class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{user.name.charAt(0)}</span><div><p class="text-sm font-semibold">{user.name}</p><p class="text-xs text-muted-foreground">Public road safety update</p></div></div>
			<fieldset disabled={!!busy} class="space-y-4">
				<div class="space-y-1"><label for="post-title" class="text-sm font-medium">Headline</label><Input id="post-title" placeholder="What should other road users know?" bind:value={title} minlength={3} maxlength={120} required class="h-11" /></div>
				<div class="space-y-1"><label for="post-body" class="text-sm font-medium">What happened?</label><textarea id="post-body" bind:value={body} placeholder="Describe the hazard, lane, or nearby landmark…" rows="3" maxlength={2000} class="w-full rounded-lg border border-input bg-background p-3 text-base focus-visible:outline-2 focus-visible:outline-ring sm:text-sm"></textarea></div>
				<section class="space-y-3" aria-label="Post attachments">
					<div class="flex items-center justify-between"><h3 class="text-sm font-medium">Photos & videos</h3><span class="text-xs text-muted-foreground">{attachments.length}/6 · 12 MB total</span></div>
					{#if coverMedia}<div class="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">{#if coverMedia.kind === 'photo'}<img src={coverMedia.url} alt="Selected cover" class="size-full object-cover" />{:else}{#key coverMedia.id}<video controls playsinline class="size-full bg-black object-contain" aria-label="Selected video cover"><source src={coverMedia.url} type={coverMedia.file.type} /><track kind="captions" /></video>{/key}{/if}<span class="absolute left-2 top-2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">Post cover</span></div>{/if}
					{#if attachments.length}<p class="text-xs text-muted-foreground">Choose which photo or video appears first.</p><div class="grid grid-cols-3 gap-2">{#each attachments as item (item.id)}<div class="relative min-w-0"><button type="button" class="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border-2 bg-muted {cover === item.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'}" aria-label="Use {item.file.name} as cover" aria-pressed={cover === item.id} onclick={() => cover = item.id}>{#if item.kind === 'photo'}<img src={item.url} alt="" class="size-full object-cover" />{:else}<span class="flex flex-col items-center gap-1 text-xs"><VideoIcon class="size-6" />Video</span>{/if}{#if cover === item.id}<span class="absolute bottom-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Cover</span>{/if}</button><button type="button" class="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-black/75 text-white" aria-label="Remove {item.file.name}" onclick={() => remove(item.id)}><XIcon class="size-4" /></button><p class="mt-1 truncate text-[11px] text-muted-foreground">{item.file.name}</p></div>{/each}</div>{/if}
					<input bind:this={fileInput} type="file" multiple accept={requested === 'photo' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm,video/quicktime'} onchange={choose} class="sr-only" aria-label="Attach media" />
					<div class="grid grid-cols-2 gap-2"><Button type="button" variant="outline" class="h-11" onclick={() => { requested = 'photo'; fileInput.accept = 'image/jpeg,image/png,image/webp'; fileInput.click(); }}><ImageIcon class="size-4" />Add photos</Button><Button type="button" variant="outline" class="h-11" onclick={() => { requested = 'video'; fileInput.accept = 'video/mp4,video/webm,video/quicktime'; fileInput.click(); }}><VideoIcon class="size-4" />Add video</Button></div>
				</section>
			</fieldset>
			<section class="space-y-3 rounded-xl border border-border p-3 sm:p-4" aria-label="AI assessment">
				<div class="flex items-center gap-2"><SparklesIcon class="size-4 text-primary" /><h3 class="text-sm font-semibold">AI road assessment</h3></div>
				{#if assessment}<div class="flex flex-wrap gap-2 text-xs"><span class="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">{assessment.analysis.distressType.replaceAll('_', ' ')}</span><span class="rounded-full bg-muted px-2.5 py-1">Severity {assessment.analysis.hazardSeverity}/10</span><span class="rounded-full bg-muted px-2.5 py-1">Rider risk: {assessment.analysis.vruLethality.toLowerCase()}</span></div><p class="text-sm leading-6">{assessment.analysis.summary}</p><details class="text-xs text-muted-foreground"><summary class="cursor-pointer py-2">Suggested repair & rider safety</summary><p class="py-2 leading-5">{assessment.analysis.recommendedAction}</p><p class="leading-5">{assessment.analysis.vruDetails}</p></details><Button type="button" variant="outline" size="sm" disabled={!!busy} onclick={() => body = assessment!.analysis.summary}>Use AI summary in my post</Button><p class="text-xs text-muted-foreground">AI estimates support triage. An on-site inspection confirms dimensions and repairs.</p>
				{:else}<p class="text-sm leading-6 text-muted-foreground">AI checks your photos and videos for road infrastructure, distress type, severity, and rider risk.</p>{/if}
				<Button type="button" variant={assessment ? 'outline' : 'default'} class="h-11 w-full" disabled={!attachments.length || !!busy} onclick={assess}>{#if busy === 'assessing'}<LoaderIcon class="size-4 animate-spin motion-reduce:animate-none" />Assessing your evidence…{:else}<SparklesIcon class="size-4" />{assessment ? 'Assess again' : 'Assess with AI'}{/if}</Button>
			</section>
			<fieldset disabled={!!busy} class="space-y-3 border-t border-border pt-4"><legend class="flex items-center gap-2 pt-4 text-sm font-medium"><MapPinIcon class="size-4 text-primary" />Where is the hazard?</legend><label for="post-location" class="sr-only">Road or landmark</label><Input id="post-location" bind:value={locationName} placeholder="Road or landmark, barangay, town" minlength={3} maxlength={200} required class="h-11" /><LocationPicker bind:latitude bind:longitude disabled={!!busy} /><p class="text-xs text-muted-foreground">The map is the final item in your post’s media gallery.</p></fieldset>
			{#if error}<p role="alert" class="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>{/if}
			<div class="sticky -bottom-4 border-t border-border bg-popover py-3"><Button type="submit" class="h-11 w-full" disabled={!assessment || !!busy || !locationName.trim() || title.trim().length < 3}>{#if busy === 'publishing'}<LoaderIcon class="size-4 animate-spin motion-reduce:animate-none" />Publishing…{:else}Publish road update{/if}</Button>{#if !assessment}<p class="mt-2 text-center text-xs text-muted-foreground">Assess your attachments to enable publishing.</p>{/if}</div>
		</form>
		{/if}
	</DialogContent>
</Dialog>
