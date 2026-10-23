<script lang="ts">
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import type { GovernmentAttachment, PostMedia } from '$lib/types/community';
	let { images, href, detail = false, selectedId = '' }: { images: (GovernmentAttachment | PostMedia)[]; href: string; detail?: boolean; selectedId?: string } = $props();
	const selected = $derived(images.findIndex((image) => image.id === selectedId));
	function link(index: number) { const url = new URL(href, 'https://surios.invalid'); url.searchParams.set('quoteMedia', images[index].id); return url.pathname + url.search + url.hash; }
</script>
{#if images.length}
	<div data-quote-gallery class="space-y-2">
		{#if detail && selected >= 0}<div class="overflow-hidden rounded-xl border border-border bg-muted"><img src={images[selected].url} alt={images[selected].name} class="max-h-[75svh] w-full object-contain" /><div class="flex items-center justify-between gap-2 border-t border-border px-2"><a href={link((selected + images.length - 1) % images.length)} aria-label="Previous government photo" class="flex size-11 items-center justify-center rounded-lg hover:bg-secondary"><ChevronLeftIcon class="size-4" /></a><a {href} class="inline-flex min-h-11 items-center text-xs text-muted-foreground">{selected + 1} / {images.length} · Back to gallery</a><a href={link((selected + 1) % images.length)} aria-label="Next government photo" class="flex size-11 items-center justify-center rounded-lg hover:bg-secondary"><ChevronRightIcon class="size-4" /></a></div></div>
		{:else}<div class="grid gap-1 overflow-hidden rounded-xl {images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}">{#each images.slice(0, 4) as image, index}<a href={link(index)} aria-label="Open evidence photo: {image.name}" class="relative block overflow-hidden bg-muted {images.length === 1 ? 'aspect-[16/10]' : 'aspect-[4/3]'}"><img src={image.url} alt={image.name} loading="lazy" class="size-full object-cover" />{#if index === 3 && images.length > 4}<span data-gallery-overflow class="absolute inset-0 flex items-center justify-center bg-black/60 text-3xl font-semibold text-white">+{images.length - 4}<span class="sr-only"> more photos. View all {images.length}.</span></span>{/if}</a>{/each}</div>{/if}
		{#if images.length > 1}<a href={link(0)} class="inline-flex min-h-8 items-center text-xs text-muted-foreground hover:text-foreground">View all {images.length} photos</a>{/if}
	</div>
{/if}
