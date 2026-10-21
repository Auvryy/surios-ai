<script lang="ts">
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
</script>

<svelte:head>
	<title>Road Degradation Analytics (Planned) — SuriOS</title>
</svelte:head>

<EmptyState
	icon={TrendingUpIcon}
	title="Municipal Road Degradation Analytics"
	description="Longitudinal pavement deterioration curves and seasonal defect spike forecasting across the Laguna transport network."
	phase="Planned for Phase 3"
	plannedFeatures={[
		"Pavement Condition Index (PCI) deterioration decay curves",
		"Monsoon rain precipitation vs. pothole formation correlation",
		"Laguna national highway high-frequency incident heatmaps",
		"Annual municipal road preservation budget optimization reports"
	]}
/>
