<script lang="ts">
	import './layout.css';
	import { untrack } from 'svelte';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import Avatar from '$lib/components/community/avatar.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '$lib/components/ui/sheet';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import CameraIcon from '@lucide/svelte/icons/camera';
	import UserIcon from '@lucide/svelte/icons/user';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import CheckCheckIcon from '@lucide/svelte/icons/check-check';
	import AwardIcon from '@lucide/svelte/icons/award';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import ArrowLeftRightIcon from '@lucide/svelte/icons/arrow-left-right';
	import PanelLeftCloseIcon from '@lucide/svelte/icons/panel-left-close';
	import PanelLeftOpenIcon from '@lucide/svelte/icons/panel-left-open';
	let { data, children }: LayoutProps = $props();
	let mobileOpen = $state(false);
	let collapsed = $state(untrack(() => data.sidebarCollapsed));
	$effect(() => { collapsed = data.sidebarCollapsed; });
	const isAuthPage = $derived(['/login', '/register', '/forgot-password', '/reset-password'].includes(page.url.pathname));
	const isMapPage = $derived(page.url.pathname === '/map');
	const isGovUser = $derived(['ENGINEER', 'OFFICER', 'ADMIN'].includes(data.user?.role || ''));
	const groups = $derived([
		{ title: 'Community', items: [
			{ name: 'Community feed', href: '/community', icon: AwardIcon },
			{ name: 'Road hazards', href: '/map', icon: MapPinIcon },
			{ name: 'Report a hazard', href: '/report', icon: CameraIcon },
			{ name: 'Confirmed updates', href: '/liked', icon: HeartIcon }
		] },
		...(isGovUser ? [{ title: 'Municipal operations', items: [
			{ name: 'Triage & resolve', href: '/dashboard', icon: LayoutDashboardIcon },
			{ name: 'Repair verification', href: '/verification', icon: CheckCheckIcon },
			{ name: 'Road analytics', href: '/analytics', icon: TrendingUpIcon }
		] }] : []),
		{ title: 'Account', items: [{ name: 'Profile', href: '/profile', icon: UserIcon }, { name: 'Settings', href: '/settings', icon: SettingsIcon }] }
	]);
	function toggleSidebar() {
		collapsed = !collapsed;
		document.cookie = `surios_nav=${collapsed ? 'collapsed' : 'expanded'}; Path=/; Max-Age=31536000; SameSite=Lax`;
	}
</script>
<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{#snippet brand(compact = false)}
	<a href="/community" aria-label="SuriOS community feed" class="flex min-h-11 items-center gap-2.5 rounded-lg"><span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-sm font-bold text-background">S</span>{#if !compact}<span class="min-w-0"><span class="block text-sm font-bold">SuriOS</span><span class="block text-[10px] text-muted-foreground">Road safety, together</span></span>{/if}</a>
{/snippet}
{#snippet navigation(compact = false)}
	<nav aria-label="{compact ? 'Collapsed' : 'Main'} navigation" class="space-y-5 px-2 py-4">
		{#each groups as group}<div class="space-y-1">{#if !compact}<p class="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{group.title}</p>{/if}{#each group.items as item}<a href={item.href} aria-label={item.name} aria-current={(page.url.pathname === item.href || item.href === '/profile' && page.url.pathname.startsWith('/profile/')) ? 'page' : undefined} title={compact ? item.name : undefined} onclick={() => mobileOpen = false} class="flex min-h-11 items-center rounded-lg px-3 text-sm transition-colors {compact ? 'justify-center' : 'gap-2.5'} {(page.url.pathname === item.href || item.href === '/profile' && page.url.pathname.startsWith('/profile/')) ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}"><item.icon class="size-4 shrink-0" />{#if !compact}<span>{item.name}</span>{/if}</a>{/each}</div>{/each}
	</nav>
{/snippet}
{#snippet account(compact = false)}
	<div class="space-y-2 border-t border-border p-2">
		{#if data.user}<a href="/profile" aria-label="Your profile" title={compact ? data.user.name : undefined} class="flex min-h-11 items-center rounded-lg p-2 hover:bg-secondary {compact ? 'justify-center' : 'gap-2'}"><Avatar name={data.user.name} src={data.user.avatarUrl} class="size-8" />{#if !compact}<span class="min-w-0"><span class="block truncate text-xs font-medium">{data.user.name}</span><span class="block text-[10px] text-muted-foreground">{isGovUser ? 'Municipal team' : 'Community member'}</span></span>{/if}</a>{:else}<Button href="/login" variant="outline" class="min-h-11 w-full px-1 text-xs" aria-label="Sign in">{compact ? 'In' : 'Sign in'}</Button>{/if}
		{#if !compact}<form method="POST" action="/profile?/switchPersona"><input type="hidden" name="email" value={isGovUser ? 'citizen@surios.gov' : 'engineer@surios.gov'} /><input type="hidden" name="redirectTo" value="auto" /><button class="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg text-[11px] text-muted-foreground hover:bg-secondary" title="Switch demo persona"><ArrowLeftRightIcon class="size-3.5" />Switch to {isGovUser ? 'community' : 'municipal'} view</button></form>{/if}
		<div class="flex items-center {compact ? 'flex-col gap-1' : 'justify-between px-1'}">{#if !compact}<span class="text-xs text-muted-foreground">Appearance</span>{/if}<ThemeToggle />{#if data.user}<form method="POST" action="/logout"><Button type="submit" variant="ghost" size="icon" class="size-10" aria-label="Sign out" title="Sign out"><LogOutIcon class="size-4" /></Button></form>{/if}</div>
	</div>
{/snippet}
{#if isAuthPage}
	<div class="min-h-svh bg-background text-foreground"><header class="flex h-14 items-center justify-between border-b border-border px-5">{@render brand()}<ThemeToggle /></header><main>{@render children()}</main></div>
{:else}
	<div class="min-h-svh bg-background text-foreground md:flex">
		<aside aria-label="App sidebar" class="sticky top-0 hidden h-svh shrink-0 flex-col border-r border-border bg-card md:flex {collapsed ? 'w-16' : 'w-60'}">
			<div class="flex shrink-0 items-center border-b border-border px-3 {collapsed ? 'flex-col gap-1 py-2' : 'h-16 justify-between'}">{@render brand(collapsed)}<Button variant="ghost" size="icon" class="size-9 shrink-0" onclick={toggleSidebar} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={!collapsed} title={collapsed ? 'Expand navigation' : 'Collapse navigation'}>{#if collapsed}<PanelLeftOpenIcon class="size-4" />{:else}<PanelLeftCloseIcon class="size-4" />{/if}</Button></div>
			<div class="min-h-0 flex-1 overflow-y-auto">{@render navigation(collapsed)}</div>{@render account(collapsed)}
		</aside>
		<div class="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-3 md:hidden">
			<div class="flex items-center gap-2"><Sheet bind:open={mobileOpen}><SheetTrigger>{#snippet child({ props })}<Button variant="ghost" size="icon" class="size-10" aria-label="Open navigation" {...props}><MenuIcon class="size-4" /></Button>{/snippet}</SheetTrigger><SheetContent side="left" class="flex w-72 max-w-[90vw] flex-col p-0"><SheetHeader class="border-b border-border px-4 py-3"><SheetTitle>SuriOS</SheetTitle></SheetHeader><div class="min-h-0 flex-1 overflow-y-auto">{@render navigation()}</div>{@render account()}</SheetContent></Sheet>{@render brand(true)}<span class="text-sm font-semibold">{isMapPage ? 'Road hazards' : 'SuriOS'}</span></div><ThemeToggle />
		</div>
		<main class="min-w-0 flex-1 {isMapPage ? 'map-workspace overflow-hidden' : ''}">{@render children()}</main>
	</div>
{/if}
<style>
	.map-workspace { height: calc(100svh - 3.5rem); }
	@media (min-width: 768px) { .map-workspace { height: 100svh; } }
</style>
