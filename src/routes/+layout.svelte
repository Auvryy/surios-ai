<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import LogOutIcon from '@lucide/svelte/icons/log-out';

	let { data, children }: LayoutProps = $props();

	const navItems = [
		{ name: 'Live Triage', href: '/' },
		{ name: 'Field Report', href: '/report' },
		{ name: 'Operations Map', href: '/dashboard' },
		{ name: 'Civil Standards', href: '/docs' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>SuriOS — Civil Infrastructure Triage & Rider Safety</title>
</svelte:head>

<div class="min-h-screen bg-background text-foreground flex flex-col font-sans">
	<!-- Official shadcn App Header -->
	<header class="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
		<div class="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
			<!-- Brand and Nav Links -->
			<div class="flex items-center gap-6">
				<a href="/" class="flex items-center gap-2.5 transition hover:opacity-90">
					<div class="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs tracking-tight">
						S
					</div>
					<span class="font-bold text-sm tracking-tight text-foreground">SuriOS</span>
					<Badge variant="secondary" class="h-5 px-1.5 text-[10px] font-normal text-muted-foreground border-border">
						SDG 9
					</Badge>
				</a>

				<!-- Desktop Nav Links -->
				<nav class="hidden md:flex items-center gap-1 text-xs font-medium">
					{#each navItems as item}
						{@const isActive = page.url.pathname === item.href}
						<a
							href={item.href}
							class="px-3 py-1.5 rounded-md transition-colors {isActive
								? 'bg-secondary text-foreground font-semibold'
								: 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}"
						>
							{item.name}
						</a>
					{/each}
				</nav>
			</div>

			<!-- Right-Side Controls -->
			<div class="flex items-center gap-2">
				<!-- Search Trigger (shadcn style) -->
				<div class="hidden sm:flex items-center gap-2 h-8 px-2.5 rounded-lg border border-border bg-secondary/30 text-xs text-muted-foreground w-36 lg:w-48 cursor-pointer hover:border-muted-foreground/30 transition-colors">
					<SearchIcon class="h-3.5 w-3.5 shrink-0" />
					<span class="truncate">Search distress...</span>
					<kbd class="ml-auto pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground">
						⌘K
					</kbd>
				</div>

				<!-- GitHub Link -->
				<Button
					variant="ghost"
					size="icon"
					href="https://github.com/Auvryy/surios-ai"
					target="_blank"
					rel="noreferrer"
					class="h-8 w-8 text-muted-foreground hover:text-foreground"
					aria-label="GitHub Repository"
				>
					<svg class="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
						<path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
					</svg>
				</Button>

				<!-- Theme Mode Toggle (Dark / Light) -->
				<ThemeToggle />

				<!-- User Auth State or Sign In / Register -->
				{#if data?.user}
					<div class="flex items-center gap-2 pl-2 border-l border-border">
						<div class="hidden lg:flex flex-col items-end leading-none">
							<span class="text-xs font-medium text-foreground truncate max-w-[110px]">{data.user.name}</span>
							<span class="text-[9px] text-muted-foreground uppercase tracking-wider">{data.user.role}</span>
						</div>
						<Badge variant="outline" class="text-[10px] font-mono px-1.5 py-0 border-border">
							{data.user.role === 'ENGINEER' ? 'Admin' : data.user.role === 'OFFICER' ? 'Officer' : 'Citizen'}
						</Badge>
						<form method="POST" action="/logout">
							<Button
								type="submit"
								variant="ghost"
								size="icon"
								class="h-8 w-8 text-muted-foreground hover:text-foreground"
								title="Sign Out"
								aria-label="Sign Out"
							>
								<LogOutIcon class="h-3.5 w-3.5" />
							</Button>
						</form>
					</div>
				{:else}
					<div class="flex items-center gap-1.5 pl-2 border-l border-border">
						<Button
							href="/login"
							variant="ghost"
							size="sm"
							class="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
						>
							Sign In
						</Button>
						<Button
							href="/register"
							variant="outline"
							size="sm"
							class="hidden sm:inline-flex h-8 px-2.5 text-xs border-border"
						>
							Register
						</Button>
					</div>
				{/if}

				<!-- New Report CTA Button -->
				<Button
					href="/#capture"
					size="sm"
					class="h-8 gap-1 px-3 text-xs font-medium rounded-lg ml-1"
				>
					<PlusIcon class="h-3.5 w-3.5" />
					<span>New Triage</span>
				</Button>
			</div>
		</div>
	</header>

	<!-- Main Page Content -->
	<div class="flex-1">
		{@render children()}
	</div>

	<!-- Minimalist shadcn Footer -->
	<footer class="border-t border-border bg-background py-6 text-xs text-muted-foreground">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
			<div class="flex items-center gap-2 text-center sm:text-left">
				<ShieldCheckIcon class="h-4 w-4 text-primary shrink-0" />
				<span>
					<strong class="font-semibold text-foreground">SuriOS</strong> — Municipal Civil Defect Triage & Two-Wheeler Safety Platform.
				</span>
			</div>
			<div class="flex items-center gap-4 text-[11px]">
				<span>LSPU Santa Cruz Corridor</span>
				<span>•</span>
				<span>ASTM D6433 Standard</span>
				<span>•</span>
				<span>Gemini 3.5 Vision</span>
			</div>
		</div>
	</footer>
</div>
