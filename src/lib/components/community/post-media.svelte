<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import VideoIcon from '@lucide/svelte/icons/video';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import type { CommunityPost } from '$lib/types/community';
	let { post }: { post: CommunityPost } = $props();
	const items = $derived([...post.media.filter((item) => item.id === post.coverId), ...post.media.filter((item) => item.id !== post.coverId)]);
	let selected = $state(0);
	let viewer = $state(false);
	const current = $derived(items[selected]);
	const mapSelected = $derived(selected === items.length);
	const thumbnails = $derived(items.map((item, index) => ({ ...item, index })).filter((item) => item.index !== selected).slice(0, 2));
	const mapUrl = $derived(`https://www.openstreetmap.org/export/embed.html?bbox=${post.longitude - .004},${post.latitude - .0025},${post.longitude + .004},${post.latitude + .0025}&layer=mapnik&marker=${post.latitude},${post.longitude}`);
	function next(direction: number) { selected = (selected + direction + items.length + 1) % (items.length + 1); }
</script>
<svelte:window onkeydown={(event) => { if (!viewer) return; if (event.key === 'ArrowLeft') next(-1); if (event.key === 'ArrowRight') next(1); }} />
{#snippet stage(full = false)}
	{#if mapSelected}<iframe title="Map of {post.locationName}" src={mapUrl} loading="lazy" class="h-full w-full border-0"></iframe>
	{:else if current?.kind === 'video'}<video controls playsinline preload="metadata" class="h-full w-full bg-black object-contain" aria-label={current.name}><source src={current.url} type={current.mimeType} /><track kind="captions" /></video>
	{:else if full}<img src={current?.url} alt={post.title} class="h-full w-full object-contain" />
	{:else}<button class="block h-full w-full cursor-zoom-in" aria-label="Expand {post.title}" onclick={() => viewer = true}><img src={current?.url} alt={post.title} loading="lazy" class="h-full w-full object-cover" /></button>{/if}
{/snippet}
<div class="media-frame relative aspect-[4/3] overflow-hidden border-y border-border bg-muted">
	{@render stage()}
	<div class="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-1.5 rounded-xl border border-white/25 bg-black/55 p-1.5 sm:right-3" aria-label="Post media and map">
		{#each thumbnails as item, index (item.id)}
			<button class="relative flex size-12 items-center justify-center overflow-hidden rounded-lg border border-white/40 bg-black text-white sm:size-14" aria-label="Show {item.kind}: {item.name}" onclick={() => selected = item.index}>
				{#if item.kind === 'photo'}<img src={item.url} alt="" loading="lazy" class="size-full object-cover" />{:else}<VideoIcon class="size-5" />{/if}
				{#if index === 1 && items.length > 3}<span class="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-semibold">+{items.length - 2}</span>{/if}
			</button>
		{/each}
		<button class="relative flex size-12 flex-col items-center justify-center overflow-hidden rounded-lg border bg-card text-foreground sm:size-14 {mapSelected ? 'border-primary ring-2 ring-primary' : 'border-white/40'}" aria-label="Show location map for {post.title}" aria-pressed={mapSelected} onclick={() => selected = items.length}>
			<svg aria-hidden="true" viewBox="0 0 56 56" class="absolute inset-0 size-full text-muted-foreground/20"><path d="M0 12h56M0 28h56M0 44h56M12 0v56M28 0v56M44 0v56" fill="none" stroke="currentColor" /><path d="M-5 48 60 13" fill="none" stroke="currentColor" stroke-width="8" /></svg><MapPinIcon class="relative size-5 text-primary" /><span class="relative mt-0.5 text-[9px] font-bold uppercase">Map</span>
		</button>
	</div>
	<div class="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/65 px-1 text-white">
		<button class="flex size-10 items-center justify-center rounded-full hover:bg-white/15" aria-label="Previous media" onclick={() => next(-1)}><ChevronLeftIcon class="size-4" /></button>
		<button class="min-h-10 px-1 text-xs" onclick={() => viewer = true} aria-label="Open all media">{selected + 1} / {items.length + 1}</button>
		<button class="flex size-10 items-center justify-center rounded-full hover:bg-white/15" aria-label="Next media" onclick={() => next(1)}><ChevronRightIcon class="size-4" /></button>
	</div>
</div>
<Dialog bind:open={viewer}>
	<DialogContent class="max-h-[95svh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{post.title}</DialogTitle><DialogDescription>{mapSelected ? post.locationName : current?.name} · {selected + 1} of {items.length + 1}</DialogDescription></DialogHeader>
		<div class="aspect-[4/3] max-h-[60svh] overflow-hidden rounded-lg bg-muted">{@render stage(true)}</div>
		<div class="flex items-center justify-between"><Button variant="outline" size="icon" aria-label="Previous attachment" onclick={() => next(-1)}><ChevronLeftIcon class="size-4" /></Button><span class="text-xs text-muted-foreground">Photos & videos · Map last</span><Button variant="outline" size="icon" aria-label="Next attachment" onclick={() => next(1)}><ChevronRightIcon class="size-4" /></Button></div>
	</DialogContent>
</Dialog>
