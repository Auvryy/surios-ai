<script lang="ts">
	import QuoteMap from './quote-map.svelte';
	import VideoIcon from '@lucide/svelte/icons/video';
	import type { CommunityPost, CommunityRepost } from '$lib/types/community';
	let { post, quote = null }: { post: CommunityPost; quote?: CommunityRepost | null } = $props();
	const href = $derived(quote ? `/community/post/${post.id}?repost=${quote.id}#repost-${quote.id}` : `/community/post/${post.id}`);
	const photos = $derived(quote ? (quote.governmentUpdate?.attachments.filter((file) => file.kind === 'photo') || quote.media).slice(0, 2) : post.media.slice(0, 2));

</script>
<div data-quoted-source class="overflow-hidden rounded-xl border border-border bg-muted/20">
	<a {href} class="block space-y-1 px-3 pt-3 pb-2 hover:bg-muted/40"><p class="text-xs text-muted-foreground">{quote ? 'Quoted update' : 'Original post'} · {quote?.author.name || post.author.name}</p>{#if quote?.governmentUpdate}<span class="inline-block rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">{post.reportStatus === 'RESOLVED' ? 'Resolved' : 'In progress'} · Government update</span>{/if}<h2 class="line-clamp-2 break-words text-sm font-semibold leading-5">{quote ? quote.body : post.title}</h2>{#if !quote}<p class="line-clamp-2 break-words text-xs leading-5 text-muted-foreground">{post.body}</p>{/if}</a>
	<div class="grid gap-1 p-1 pt-0" style:grid-template-columns={`repeat(${photos.length + 1}, minmax(0, 1fr))`}>
		{#each photos as media, index}<a href={quote ? `${href.split('#')[0]}&quoteMedia=${media.id}#repost-${quote.id}` : `/community/post/${post.id}?media=${media.id}#post-media`} aria-label={quote ? `Open quoted update photo ${index + 1}` : `Open original ${media.kind} ${index + 1}`} class="relative flex h-24 min-w-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">{#if media.kind === 'photo'}<img src={media.url} alt={quote ? 'Quoted government evidence' : index === 0 ? 'Quoted original report' : media.name} loading="lazy" class="size-full object-cover" />{:else}<VideoIcon class="size-6" /><span class="sr-only">{media.name}</span>{/if}</a>{/each}
		<QuoteMap latitude={post.latitude} longitude={post.longitude} name={post.locationName} href={`/community/post/${post.id}?media=map#post-media`} />
	</div>
	<p class="truncate px-3 pb-2 text-[11px] text-muted-foreground">{post.locationName}</p>
</div>
