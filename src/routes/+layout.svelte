<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types.js';
	import { page } from '$app/state';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
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
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import UserIcon from '@lucide/svelte/icons/user';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import CheckCheckIcon from '@lucide/svelte/icons/check-check';
	import AwardIcon from '@lucide/svelte/icons/award';

	let { data, children }: LayoutProps = $props();

	let isMobileOpen = $state(false);

	const isAuthPage = $derived(
		page.url.pathname === '/login' || page.url.pathname === '/register'
	);

	const navGroups = [
		{
			title: 'Operations & GIS',
			items: [
				{ name: 'Map Feed', href: '/', icon: MapPinIcon, badge: 'Live' },
				{ name: 'Dispatch Canvas', href: '/dashboard', icon: LayoutDashboardIcon, badge: 'LGU' },
				{ name: 'Field Report', href: '/report', icon: CameraIcon, badge: null }
			]
		},
		{
			title: 'Municipal Modules (Upcoming)',
			items: [
				{ name: 'Proof of Patch', href: '/verification', icon: CheckCheckIcon, badge: 'Planned' },
				{ name: 'Road Analytics', href: '/analytics', icon: TrendingUpIcon, badge: 'Planned' },
				{ name: 'Contractors & Crews', href: '/crews', icon: TruckIcon, badge: 'Planned' },
				{ name: 'Community Hub', href: '/community', icon: AwardIcon, badge: 'Planned' }
			]
		},
		{
			title: 'Standards & Policy',
			items: [
				{ name: 'Civil Standards', href: '/docs', icon: BookOpenIcon, badge: 'ASTM' }
			]
		},
		{
			title: 'Personnel & Account',
			items: [
				{ name: 'Profile', href: '/profile', icon: UserIcon, badge: null },
				{ name: 'Settings', href: '/settings', icon: SettingsIcon, badge: null }
			]
		}
	];
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
				<div class="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs tracking-tight">
					S
				</div>
				<span class="font-bold text-sm tracking-tight text-foreground">SuriOS</span>
				<Badge variant="secondary" class="h-5 px-1.5 text-[10px] font-normal text-muted-foreground border-border">
					SDG 9
				</Badge>
			</a>
			<ThemeToggle />
		</header>
		<main class="flex-1">
			{@render children()}
		</main>
	</div>
{:else}
	<!-- Full Authentic shadcn Sidebar Shell -->
	<div class="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
		<!-- Desktop Sidebar -->
		<aside class="hidden md:flex flex-col w-64 border-r border-border bg-card shrink-0 h-screen sticky top-0 z-30">
			<!-- Sidebar Brand Header -->
			<div class="h-14 flex items-center justify-between px-4 border-b border-border">
				<a href="/" class="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
					<div class="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs tracking-tight">
						S
					</div>
					<div class="flex flex-col leading-none">
						<div class="flex items-center gap-1.5">
							<span class="font-bold text-sm tracking-tight text-foreground">SuriOS</span>
							<Badge variant="secondary" class="h-4 px-1 text-[9px] font-normal text-muted-foreground border-border">
								SDG 9
							</Badge>
						</div>
						<span class="text-[10px] text-muted-foreground mt-0.5">Municipal Civil Ops</span>
					</div>
				</a>
			</div>

			<!-- Sidebar Navigation Items -->
			<div class="flex-1 overflow-y-auto px-3 py-3 space-y-4">
				{#each navGroups as group}
					<div class="space-y-1">
						<div class="text-[10px] uppercase font-semibold text-muted-foreground/80 tracking-wider px-2 py-1">
							{group.title}
						</div>
						<div class="space-y-0.5">
							{#each group.items as item}
								{@const isActive = page.url.pathname === item.href}
								<a
									href={item.href}
									class="flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors {isActive
										? 'bg-secondary text-foreground font-semibold border border-border/60'
										: 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}"
								>
									<div class="flex items-center gap-2.5">
										<item.icon class="h-4 w-4 shrink-0 {isActive ? 'text-primary' : 'text-muted-foreground'}" />
										<span>{item.name}</span>
									</div>
									{#if item.badge}
										<Badge variant="outline" class="text-[9px] px-1 py-0 h-4 font-mono text-muted-foreground border-border">
											{item.badge}
										</Badge>
									{/if}
								</a>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<!-- Quick Shutter Action Button -->
			<div class="px-3 pb-3">
				<Button
					href="/report"
					size="sm"
					class="w-full h-8 text-xs font-medium gap-1.5 rounded-md"
				>
					<PlusIcon class="h-3.5 w-3.5" />
					<span>New Field Triage</span>
				</Button>
			</div>

			<!-- Sidebar User Footer -->
			<div class="p-3 border-t border-border mt-auto space-y-2.5 bg-card/50">
				{#if data?.user}
					<div class="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/40">
						<a href="/profile" class="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
							<div class="h-7 w-7 rounded-md bg-secondary text-foreground font-semibold text-xs flex items-center justify-center border border-border shrink-0">
								{data.user.name.charAt(0)}
							</div>
							<div class="flex flex-col min-w-0 leading-tight">
								<span class="text-xs font-medium text-foreground truncate">{data.user.name}</span>
								<span class="text-[10px] text-muted-foreground uppercase tracking-wider">{data.user.role}</span>
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
						Civil Personnel Sign In
					</Button>
				{/if}

				<div class="flex items-center justify-between px-1">
					<span class="text-[11px] text-muted-foreground">Dark / Light Theme</span>
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
							<div class="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs tracking-tight">
								S
							</div>
							<div class="flex flex-col leading-none text-left">
								<span class="font-bold text-sm text-foreground">SuriOS</span>
								<span class="text-[10px] text-muted-foreground">Municipal Platform</span>
							</div>
						</SheetHeader>

						<div class="flex-1 overflow-y-auto px-3 py-3 space-y-4">
							{#each navGroups as group}
								<div class="space-y-1">
									<div class="text-[10px] uppercase font-semibold text-muted-foreground/80 tracking-wider px-2 py-1">
										{group.title}
									</div>
									<div class="space-y-0.5">
										{#each group.items as item}
											{@const isActive = page.url.pathname === item.href}
											<a
												href={item.href}
												onclick={() => (isMobileOpen = false)}
												class="flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors {isActive
													? 'bg-secondary text-foreground font-semibold border border-border/60'
													: 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}"
											>
												<div class="flex items-center gap-2.5">
													<item.icon class="h-4 w-4 shrink-0 {isActive ? 'text-primary' : 'text-muted-foreground'}" />
													<span>{item.name}</span>
												</div>
												{#if item.badge}
													<Badge variant="outline" class="text-[9px] px-1 py-0 h-4 font-mono text-muted-foreground border-border">
														{item.badge}
													</Badge>
												{/if}
											</a>
										{/each}
									</div>
								</div>
							{/each}
						</div>

						<div class="p-3 border-t border-border mt-auto space-y-2 bg-card/50">
							{#if data?.user}
								<div class="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/40">
									<a href="/profile" onclick={() => (isMobileOpen = false)} class="flex items-center gap-2 min-w-0">
										<div class="h-7 w-7 rounded-md bg-secondary text-foreground font-semibold text-xs flex items-center justify-center border border-border shrink-0">
											{data.user.name.charAt(0)}
										</div>
										<div class="flex flex-col min-w-0 leading-tight">
											<span class="text-xs font-medium text-foreground truncate">{data.user.name}</span>
											<span class="text-[10px] text-muted-foreground uppercase">{data.user.role}</span>
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
								<span class="text-[11px] text-muted-foreground">Appearance</span>
								<ThemeToggle />
							</div>
						</div>
					</SheetContent>
				</Sheet>

				<a href="/" class="flex items-center gap-2">
					<div class="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-[11px]">
						S
					</div>
					<span class="font-bold text-sm tracking-tight text-foreground">SuriOS</span>
				</a>
			</div>

			<div class="flex items-center gap-2">
				<Button href="/report" size="sm" class="h-7 px-2.5 text-xs gap-1 rounded-md">
					<PlusIcon class="h-3 w-3" />
					<span>Report</span>
				</Button>
				<ThemeToggle />
			</div>
		</div>

		<!-- Main Workspace Area -->
		<main class="flex-1 min-w-0 flex flex-col bg-background">
			<div class="flex-1">
				{@render children()}
			</div>

			<!-- Minimalist shadcn Footer -->
			<footer class="border-t border-border bg-card/30 py-4 text-xs text-muted-foreground px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
				<div class="flex items-center gap-2 text-center sm:text-left">
					<ShieldCheckIcon class="h-3.5 w-3.5 text-primary shrink-0" />
					<span>
						<strong class="font-semibold text-foreground">SuriOS</strong> — Municipal Civil Defect Triage &amp; VRU Safety.
					</span>
				</div>
				<div class="flex items-center gap-3 text-[11px] text-muted-foreground">
					<span>Santa Cruz, Laguna</span>
					<span>•</span>
					<span>ASTM D6433 Standard</span>
					<span>•</span>
					<span>Gemini Vision</span>
				</div>
			</footer>
		</main>
	</div>
{/if}
