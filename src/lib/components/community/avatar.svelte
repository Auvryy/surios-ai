<script lang="ts">
	let { name, src = null, class: className = 'size-10' }: { name: string; src?: string | null; class?: string } = $props();
	let failed = $state<string | null>(null);
	const initials = $derived(name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase());
</script>
<span aria-hidden="true" class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary {className}">
	{#if src && failed !== src}<img {src} alt="" class="size-full object-cover" onerror={() => failed = src} />{:else}{initials}{/if}
</span>
