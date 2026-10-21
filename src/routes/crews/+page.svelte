<script lang="ts">
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import TruckIcon from '@lucide/svelte/icons/truck';
</script>

<svelte:head>
	<title>Contractor & Crew Directory (Planned) — SuriOS</title>
</svelte:head>

<EmptyState
	icon={TruckIcon}
	title="Contractor & Heavy Equipment Directory"
	description="Municipal contractor roster, asphalt crew availability status, and machinery allocation tracking."
	phase="Planned for Phase 3"
	plannedFeatures={[
		"DPWH accredited asphalt paving contractor registry",
		"Vibratory roller, cold planer, and tack coat tanker dispatch readiness",
		"Barangay emergency response time SLA benchmarks",
		"Contractor 1-year asphalt patch warranty validation"
	]}
/>
