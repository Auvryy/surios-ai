<script lang="ts">
	import type { Component } from 'svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	interface Props {
		icon: Component;
		title: string;
		description: string;
		phase?: string;
		plannedFeatures?: string[];
	}

	let {
		icon: Icon,
		title,
		description,
		phase = 'Planned for Phase 3',
		plannedFeatures = []
	}: Props = $props();
</script>

<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center space-y-6">
	<!-- Dashed Icon Container (Authentic shadcn empty state) -->
	<div class="h-16 w-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-muted/20">
		<Icon class="h-7 w-7 text-muted-foreground" />
	</div>

	<div class="space-y-2 max-w-lg">
		<div class="flex items-center justify-center gap-2">
			<Badge variant="outline" class="text-[10px] uppercase font-mono tracking-wider border-border">
				{phase}
			</Badge>
			<span class="text-[10px] text-muted-foreground font-mono">Module Inactive</span>
		</div>
		<h2 class="text-xl font-bold tracking-tight text-foreground">{title}</h2>
		<p class="text-xs text-muted-foreground leading-relaxed">
			{description}
		</p>
	</div>

	{#if plannedFeatures.length > 0}
		<div class="w-full max-w-md p-4 rounded-lg border border-border bg-card text-left space-y-2.5">
			<span class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
				Planned Municipal Specifications:
			</span>
			<ul class="space-y-1.5 text-xs text-muted-foreground">
				{#each plannedFeatures as feat}
					<li class="flex items-start gap-2">
						<span class="text-primary font-bold">•</span>
						<span>{feat}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div class="flex items-center gap-2 pt-2">
		<Button href="/" variant="outline" size="sm" class="h-8 text-xs gap-1.5">
			<ArrowLeftIcon class="h-3.5 w-3.5" />
			<span>Return to Map Feed</span>
		</Button>
	</div>
</div>
