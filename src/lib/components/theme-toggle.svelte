<script lang="ts">
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import { Button } from '$lib/components/ui/button/index.js';

	let isDark = $state(true);

	$effect(() => {
		if (typeof document !== 'undefined') {
			isDark = document.documentElement.classList.contains('dark');
		}
	});

	function toggleTheme() {
		if (typeof document === 'undefined') return;
		if (document.documentElement.classList.contains('dark')) {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('surios-theme', 'light');
			isDark = false;
		} else {
			document.documentElement.classList.add('dark');
			localStorage.setItem('surios-theme', 'dark');
			isDark = true;
		}
	}
</script>

<Button
	variant="ghost"
	size="icon"
	onclick={toggleTheme}
	class="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
	aria-label="Toggle color theme"
>
	{#if isDark}
		<SunIcon class="h-4 w-4" />
	{:else}
		<MoonIcon class="h-4 w-4" />
	{/if}
</Button>
