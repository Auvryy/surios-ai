<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import PostComposer from '$lib/components/community/post-composer.svelte';
	import ImageIcon from '@lucide/svelte/icons/image';
	import VideoIcon from '@lucide/svelte/icons/video';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';

	let { data }: PageProps = $props();
	let composer = $state(false);
	const name = $derived(data.user?.name || 'Guest');
	const initials = $derived(name.split(' ').slice(0, 2).map((part) => part[0]).join(''));
	function openComposer() { composer = true; }
	async function published(id: string) {
		await goto(`/community?q=${id}#post-${id}`, { refreshAll: true });
	}
</script>

<svelte:head><title>Report a hazard — SuriOS</title></svelte:head>
<div class="min-h-full bg-muted/35 px-3 py-4 sm:px-5 sm:py-6">
	<section class="mx-auto max-w-[680px] rounded-xl border border-border bg-card px-3 pt-3" aria-label="Report a hazard">
		<h1 class="sr-only">Report a hazard</h1>
		<div class="flex items-center gap-3">
			<span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary" aria-hidden="true">{initials}</span>
			<button type="button" onclick={openComposer} class="flex min-h-12 min-w-0 flex-1 items-center rounded-full bg-muted px-4 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring">What’s happening on your road?</button>
		</div>
		<div class="mt-3 grid grid-cols-3 border-t border-border py-1">
			<button type="button" onclick={openComposer} class="report-action"><ImageIcon aria-hidden="true" class="size-4 text-primary" />Photos</button>
			<button type="button" onclick={openComposer} class="report-action"><VideoIcon aria-hidden="true" class="size-4 text-primary" />Video</button>
			<button type="button" onclick={openComposer} class="report-action"><MapPinIcon aria-hidden="true" class="size-4 text-primary" />Location</button>
		</div>
	</section>
</div>
<PostComposer bind:open={composer} user={data.user} onpublished={published} />

<style>
	.report-action { display: flex; min-height: 44px; align-items: center; justify-content: center; gap: 6px; border-radius: 8px; font-size: .8125rem; }
	.report-action:hover { background: var(--secondary); }
	.report-action:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
</style>
