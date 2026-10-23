<script lang="ts">
	import type { PageProps } from './$types';
	import ProfileView from '$lib/components/community/profile-view.svelte';
	let { data }: PageProps = $props();
</script>
<ProfileView {data} user={data.user} />
