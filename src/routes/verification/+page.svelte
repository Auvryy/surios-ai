<script lang="ts">
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import CheckCheckIcon from '@lucide/svelte/icons/check-check';
</script>

<svelte:head>
	<title>Proof-of-Patch Sign-Off (Planned) — SuriOS</title>
</svelte:head>

<EmptyState
	icon={CheckCheckIcon}
	title="Proof-of-Patch AI Sign-Off Archive"
	description="Gemini multimodal vision sign-off verifying physical asphalt patch quality before municipal fund release."
	phase="Planned for Phase 3"
	plannedFeatures={[
		"Dual before/after photo alignment and road texture inspection",
		"Gemini visual compaction and flush grade verification scoring",
		"Edge joint sealing audit to prevent future water ingress",
		"Digital Certificate of Completion issuance for municipal auditing"
	]}
/>
