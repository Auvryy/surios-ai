<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import PostComposer from '$lib/components/community/post-composer.svelte';
	import { Button } from '$lib/components/ui/button';
	import CameraIcon from '@lucide/svelte/icons/camera';
	import UploadIcon from '@lucide/svelte/icons/upload';

	let { data }: PageProps = $props();
	let composer = $state(false);
	let composerRef: PostComposer;
	let uploadInput: HTMLInputElement;
	let cameraInput: HTMLInputElement;
	function choosePhoto(camera = false) {
		if (!data.user) { composer = true; return; }
		(camera ? cameraInput : uploadInput).click();
	}
	function selectedPhoto(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const files = [...(input.files || [])];
		input.value = '';
		if (!files.length) return;
		composerRef.addFiles(files);
		composer = true;
	}
	async function published(id: string) {
		await goto(`/community?q=${id}#post-${id}`, { refreshAll: true });
	}
</script>

<svelte:head><title>Report a hazard — SuriOS</title></svelte:head>
<div class="min-h-full bg-muted/35 px-4 py-6 sm:py-8">
	<section class="mx-auto max-w-[560px] space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5" aria-label="Report a hazard">
		<h1 class="sr-only">Report a hazard</h1>
		<button type="button" onclick={() => choosePhoto()} class="flex min-h-60 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-input bg-muted/25 px-5 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-ring">
			<span class="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><CameraIcon aria-hidden="true" class="size-6" /></span>
			<span class="text-base font-medium">Add a hazard photo</span>
			<span class="text-sm text-muted-foreground">Upload an image to start a post.</span>
			<span class="mt-1 inline-flex items-center gap-2 text-sm font-medium text-primary"><UploadIcon aria-hidden="true" class="size-4" />Choose image</span>
		</button>
		<Button type="button" variant="outline" class="h-11 w-full" onclick={() => choosePhoto(true)}><CameraIcon aria-hidden="true" class="size-4" />Take a photo</Button>
		<input bind:this={uploadInput} type="file" accept="image/jpeg,image/png,image/webp" multiple onchange={selectedPhoto} aria-label="Upload hazard images" class="sr-only" tabindex="-1" />
		<input bind:this={cameraInput} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onchange={selectedPhoto} aria-label="Capture hazard photo" class="sr-only" tabindex="-1" />
	</section>
</div>
<PostComposer bind:this={composerRef} bind:open={composer} user={data.user} onpublished={published} />
