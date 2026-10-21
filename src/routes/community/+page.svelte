<script lang="ts">
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import AwardIcon from '@lucide/svelte/icons/award';
</script>

<svelte:head>
	<title>Community Consensus & Leaderboard (Planned) — SuriOS</title>
</svelte:head>

<EmptyState
	icon={AwardIcon}
	title="Community Consensus & Safety Leaderboard"
	description="Crowdsourced hazard validation, citizen reporter reputation scoring, and local road safety announcements."
	phase="Planned for Phase 3"
	plannedFeatures={[
		"Verified citizen safety contributor reputation ranking",
		"Community consensus voting on duplicate defect submissions",
		"Laguna provincial safety advisories for hazardous weather",
		"Civic advocacy badge awards for barangay road volunteers"
	]}
/>
