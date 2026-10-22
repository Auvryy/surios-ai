<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types.js';
	import { page } from '$app/state';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet/index.js';

	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import CameraIcon from '@lucide/svelte/icons/camera';
	import UserIcon from '@lucide/svelte/icons/user';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import CheckCheckIcon from '@lucide/svelte/icons/check-check';
	import AwardIcon from '@lucide/svelte/icons/award';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import ArrowLeftRightIcon from '@lucide/svelte/icons/arrow-left-right';

	let { data, children }: LayoutProps = $props();

	let isMobileOpen = $state(false);

	const isAuthPage = $derived(
		page.url.pathname === '/login' || page.url.pathname === '/register'
	);

	const isGovUser = $derived(
		data?.user?.role === 'ENGINEER' ||
		data?.user?.role === 'OFFICER' ||
		data?.user?.role === 'ADMIN'
	);

	// Strict Two-Persona Navigation Architecture (Zero Decorative Badge Pollution)
	const communityNavGroups = [
		{
			title: 'Community & Safety',
			items: [
				{ name: 'Civic Feed', href: '/community', icon: AwardIcon },
				{ name: 'Map Playground', href: '/', icon: MapPinIcon },
				{ name: 'Camera Report', href: '/report', icon: CameraIcon },
				{ name: 'Liked History', href: '/liked', icon: HeartIcon }
			]
		},
		{
			title: 'Account',
			items: [
				{ name: 'Profile', href: '/profile', icon: UserIcon },
				{ name: 'Settings', href: '/settings', icon: SettingsIcon }
			]
		}
	];

	const governmentNavGroups = [
		{
			title: 'Municipal Engineering',
			items: [
				{ name: 'Triage & Resolve', href: '/dashboard', icon: LayoutDashboardIcon },
				{ name: 'Proof of Patch QA', href: '/verification', icon: CheckCheckIcon },
				{ name: 'Road Analytics', href: '/analytics', icon: TrendingUpIcon },
				{ name: 'GIS Map Canvas', href: '/', icon: MapPinIcon }
			]
		},
		{
			title: 'Officer Account',
			items: [
				{ name: 'Profile', href: '/profile', icon: UserIcon },
				{ name: 'Settings', href: '/settings', icon: SettingsIcon }
			]
		}
	];

	const activeNavGroups = $derived(isGovUser ? governmentNavGroups : communityNavGroups);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>SuriOS — Civil Infrastructure Triage & Rider Safety</title>
</svelte:head>

{#if isAuthPage}
	<!-- Minimalist Auth Layout without Sidebar -->
	<div class="min-h-screen bg-background text-foreground flex flex-col font-sans">
		<header class="w-full border-b border-border bg-background/95 px-6 h-14 flex items-center justify-between">
			<a href="/" class="flex items-center gap-2.5">
				<div class="h-7 w-7 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-xs tracking-tight">
					S
				</div>
				<span class="font-bold text-sm tracking-tight text-foreground">SuriOS</span>
			</a>
			<ThemeToggle />
		</header>
		<main class="flex-1">
			{@render children()}
		</main>
	</div>
{:else}
	<!-- Swiss Minimalist Two-Persona Shell -->
	<div class="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
		<!-- Desktop Sidebar -->
		<aside class="hidden md:flex flex-col w-60 border-r border-border bg-card shrink-0 h-screen sticky top-0 z-30">
			<!-- Sidebar Brand Header -->
			<div class="h-14 flex items-center justify-between px-4 border-b border-border">
				<a href={isGovUser ? '/dashboard' : '/community'} class="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
					<div class="h-7 w-7 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-xs tracking-tight">
						S
					</div>
					<div class="flex flex-col leading-none">
						<span class="font-bold text-sm tracking-tight text-foreground">SuriOS</span>
						<span class="text-[10px] font-mono text-muted-foreground mt-0.5">
							{isGovUser ? 'DPWH & LGU Ops' : 'Road Guardians'}
						</span>
					</div>
				</a>
			</div>

			<!-- Sidebar Navigation Items (Zero Badge Clutter) -->
			<div class="flex-1 overflow-y-auto px-3 py-4 space-y-5">
				{#each activeNavGroups as group}
					<div class="space-y-1">
						<div class="text-[10px] uppercase font-mono font-semibold text-muted-foreground/75 tracking-wider px-2.5 py-1">
							{group.title}
						</div>
						<div class="space-y-0.5">
							{#each group.items as item}
								{@const isActive = page.url.pathname === item.href}
								<a
									href={item.href}
									class="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors {isActive
										? 'bg-secondary text-foreground font-semibold border border-border/70'
										: 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'}"
								>
									<item.icon class="h-4 w-4 shrink-0 {isActive ? 'text-foreground' : 'text-muted-foreground'}" />
									<span>{item.name}</span>
								</a>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<!-- Sidebar User Footer & 1-Click Persona Switcher -->
			<div class="p-3 border-t border-border mt-auto space-y-2.5 bg-card/50">
				<!-- Instant Role Switcher (Community <-> Government) -->
				<form method="POST" action="/profile?/switchPersona" class="w-full">
					<input
						type="hidden"
						name="email"
						value={isGovUser ? 'citizen@surios.gov' : 'engineer@surios.gov'}
					/>
					<input type="hidden" name="redirectTo" value="auto" />
					<button
						type="submit"
						class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-secondary/60 text-[11px] font-medium text-foreground transition-colors cursor-pointer"
						title="Switch active persona between Community Citizen and Government Engineer"
					>
						<span class="flex items-center gap-1.5 truncate">
							<ArrowLeftRightIcon class="h-3 w-3 text-muted-foreground shrink-0" />
							<span>Switch to {isGovUser ? 'Community View' : 'Gov Admin View'}</span>
						</span>
						<span class="text-[9px] font-mono uppercase text-muted-foreground">1-Click</span>
					</button>
				</form>

				{#if data?.user}
					<div class="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/30">
						<a href="/profile" class="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
							<div class="h-7 w-7 rounded-md bg-secondary text-foreground font-semibold text-xs flex items-center justify-center border border-border shrink-0">
								{data.user.name.charAt(0)}
							</div>
							<div class="flex flex-col min-w-0 leading-tight">
								<span class="text-xs font-medium text-foreground truncate">{data.user.name}</span>
								<span class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
									{isGovUser ? data.user.role : 'COMMUNITY'}
								</span>
							</div>
						</a>
						<form method="POST" action="/logout">
							<Button
								type="submit"
								variant="ghost"
								size="icon"
								class="h-7 w-7 text-muted-foreground hover:text-foreground"
								title="Sign Out"
							>
								<LogOutIcon class="h-3.5 w-3.5" />
							</Button>
						</form>
					</div>
				{:else}
					<Button href="/login" variant="outline" size="sm" class="w-full text-xs h-8 border-border">
						Sign In
					</Button>
				{/if}

				<div class="flex items-center justify-between px-1">
					<span class="text-[11px] text-muted-foreground">Theme</span>
					<ThemeToggle />
				</div>
			</div>
		</aside>

		<!-- Mobile Header Bar -->
		<div class="md:hidden sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur px-4 h-14 flex items-center justify-between">
			<div class="flex items-center gap-2.5">
				<Sheet bind:open={isMobileOpen}>
					<SheetTrigger>
						{#snippet child({ props })}
							<Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground" {...props}>
								<MenuIcon class="h-4 w-4" />
							</Button>
						{/snippet}
					</SheetTrigger>
					<SheetContent side="left" class="w-72 p-0 flex flex-col bg-card">
						<SheetHeader class="h-14 px-4 border-b border-border flex items-center justify-start flex-row gap-2.5 space-y-0">
							<div class="h-7 w-7 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-xs tracking-tight">
								S
							</div>
							<div class="flex flex-col leading-none text-left">
								<SheetTitle class="font-bold text-sm text-foreground">SuriOS</SheetTitle>
								<span class="text-[10px] font-mono text-muted-foreground">
									{isGovUser ? 'DPWH & LGU Ops' : 'Road Guardians'}
								</span>
							</div>
						</SheetHeader>

						<div class="flex-1 overflow-y-auto px-3 py-4 space-y-5">
							{#each activeNavGroups as group}
								<div class="space-y-1">
									<div class="text-[10px] uppercase font-mono font-semibold text-muted-foreground/75 tracking-wider px-2.5 py-1">
										{group.title}
									</div>
									<div class="space-y-0.5">
										{#each group.items as item}
											{@const isActive = page.url.pathname === item.href}
											<a
												href={item.href}
												onclick={() => (isMobileOpen = false)}
												class="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors {isActive
													? 'bg-secondary text-foreground font-semibold border border-border/70'
													: 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'}"
											>
												<item.icon class="h-4 w-4 shrink-0 {isActive ? 'text-foreground' : 'text-muted-foreground'}" />
												<span>{item.name}</span>
											</a>
										{/each}
									</div>
								</div>
							{/each}
						</div>

						<div class="p-3 border-t border-border mt-auto space-y-2 bg-card/50">
							<form method="POST" action="/profile?/switchPersona" class="w-full">
								<input
									type="hidden"
									name="email"
									value={isGovUser ? 'citizen@surios.gov' : 'engineer@surios.gov'}
								/>
								<input type="hidden" name="redirectTo" value="auto" />
								<button
									type="submit"
									class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-secondary/60 text-[11px] font-medium text-foreground transition-colors cursor-pointer"
								>
									<span class="flex items-center gap-1.5">
										<ArrowLeftRightIcon class="h-3 w-3 text-muted-foreground" />
										<span>Switch to {isGovUser ? 'Community View' : 'Gov Admin View'}</span>
									</span>
									<span class="text-[9px] font-mono uppercase text-muted-foreground">1-Click</span>
								</button>
							</form>

							{#if data?.user}
								<div class="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/30">
									<a href="/profile" onclick={() => (isMobileOpen = false)} class="flex items-center gap-2 min-w-0">
										<div class="h-7 w-7 rounded-md bg-secondary text-foreground font-semibold text-xs flex items-center justify-center border border-border shrink-0">
											{data.user.name.charAt(0)}
										</div>
										<div class="flex flex-col min-w-0 leading-tight">
											<span class="text-xs font-medium text-foreground truncate">{data.user.name}</span>
											<span class="text-[10px] font-mono text-muted-foreground uppercase">
												{isGovUser ? data.user.role : 'COMMUNITY'}
											</span>
										</div>
									</a>
									<form method="POST" action="/logout">
										<Button type="submit" variant="ghost" size="icon" class="h-7 w-7 text-muted-foreground">
											<LogOutIcon class="h-3.5 w-3.5" />
										</Button>
									</form>
								</div>
							{:else}
								<Button href="/login" onclick={() => (isMobileOpen = false)} variant="outline" size="sm" class="w-full text-xs h-8">
									Sign In
								</Button>
							{/if}
							<div class="flex items-center justify-between px-1">
								<span class="text-[11px] text-muted-foreground">Theme</span>
								<ThemeToggle />
							</div>
						</div>
					</SheetContent>
				</Sheet>

				<a href={isGovUser ? '/dashboard' : '/community'} class="flex items-center gap-2">
					<div class="h-6 w-6 rounded-md bg-foreground text-background flex items-center justify-center font-bold text-[11px]">
						S
					</div>
					<span class="font-bold text-sm tracking-tight text-foreground">SuriOS</span>
				</a>
			</div>

			<div class="flex items-center gap-2">
				{#if !isGovUser}
					<Button href="/report" size="sm" variant="outline" class="h-7 px-2.5 text-xs gap-1 rounded-md border-border">
						<CameraIcon class="h-3 w-3" />
						<span>Camera</span>
					</Button>
				{/if}
				<ThemeToggle />
			</div>
		</div>

		<!-- Main Workspace Area -->
		<main class="flex-1 min-w-0 flex flex-col bg-background {page.url.pathname === '/' ? 'h-screen overflow-hidden' : ''}">
			<div class="flex-1 {page.url.pathname === '/' ? 'h-full min-h-0 overflow-hidden' : ''}">
				{@render children()}
			</div>

			<!-- Minimalist Footer (shown on non-map pages) -->
			{#if page.url.pathname !== '/'}
				<footer class="border-t border-border bg-card/30 py-4 text-xs text-muted-foreground px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
					<div class="flex items-center gap-2 text-center sm:text-left">
						<ShieldCheckIcon class="h-3.5 w-3.5 text-foreground shrink-0" />
						<span>
							<strong class="font-semibold text-foreground">SuriOS</strong> — {isGovUser ? 'Municipal Civil Engineering & Dispatch' : 'Community Road Safety & Hazard Feed'}.
						</span>
					</div>
					<div class="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
						<span>Santa Cruz, Laguna</span>
						<span>•</span>
						<span>ASTM D6433</span>
					</div>
				</footer>
			{/if}
		</main>
	</div>
{/if}
