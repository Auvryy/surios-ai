<script lang="ts">
	import { Card } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	import HeartIcon from '@lucide/svelte/icons/heart';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import SearchIcon from '@lucide/svelte/icons/search';
	import CameraIcon from '@lucide/svelte/icons/camera';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import Share2Icon from '@lucide/svelte/icons/share-2';
	import CheckIcon from '@lucide/svelte/icons/check';
	import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
	import XIcon from '@lucide/svelte/icons/x';

	interface LikedHazardItem {
		id: string;
		title: string;
		location: string;
		corridorName: string;
		coordinatesString: string;
		severity: number;
		vruRisk: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
		astmCode: string;
		depthEstimate: string;
		description: string;
		author: {
			name: string;
			avatarInitials: string;
		};
		timeAgo: string;
		likedAt: string;
		mainImage: string;
		secondaryImages: { src: string; label: string }[];
		totalPhotosCount: number;
		confirmations: number;
		userConfirmed: boolean;
		status: 'REPORTED' | 'DISPATCHED' | 'RESOLVED';
		dpwhNote: string;
		commentsCount: number;
	}

	let items = $state<LikedHazardItem[]>([
		{
			id: 'REP-9032',
			title: 'Sunken Crosswalk Utility Trench',
			location: 'Quezon Ave cor. EDSA, Diliman',
			corridorName: 'Quezon Avenue Corridor',
			coordinatesString: '14.6507° N, 121.0345° E',
			severity: 8.9,
			vruRisk: 'CRITICAL',
			astmCode: 'ASTM D6433 (Utility Cut Depression)',
			depthEstimate: '52mm transverse trench',
			description:
				'Depression across eastbound pedestrian crosswalk causing wheel entrapment and trip hazards for pedestrians and cyclists.',
			author: {
				name: 'Ria Santos',
				avatarInitials: 'RS'
			},
			timeAgo: '1h ago',
			likedAt: 'Confirmed 38m ago',
			mainImage: '/uploads/pothole-pre-repair.jpg',
			secondaryImages: [
				{ src: '/uploads/patch-post-repair.jpg', label: 'Crosswalk Alignment' },
				{ src: '/samples/pothole-severe.jpg', label: 'Trench Depth Lip' }
			],
			totalPhotosCount: 5,
			confirmations: 27,
			userConfirmed: true,
			status: 'DISPATCHED',
			dpwhNote: 'DPWH Crew Alpha scheduled for gravel re-compaction & hot asphalt patch.',
			commentsCount: 1
		},
		{
			id: 'REP-9041',
			title: 'Deep 68mm Rim-Strike Crater & Submerged Ponding Hole',
			location: 'Pedro Guevara Ave (Near LSPU Main Gate 2), Santa Cruz',
			corridorName: 'Pedro Guevara Avenue',
			coordinatesString: '14.2813° N, 121.4173° E',
			severity: 9.2,
			vruRisk: 'CRITICAL',
			astmCode: 'ASTM D6433 (Pothole - High)',
			depthEstimate: '68mm vertical lip strike',
			description:
				'Severe vertical lip directly in the primary two-wheeler and tricycle wheel path. Turbid rainwater disguises the crater depth.',
			author: {
				name: 'Mark Bautista',
				avatarInitials: 'MB'
			},
			timeAgo: '14m ago',
			likedAt: 'Confirmed 10m ago',
			mainImage: '/samples/pothole-severe.jpg',
			secondaryImages: [
				{ src: '/uploads/pothole-pre-repair.jpg', label: 'Lip Gauge: 68mm' },
				{ src: '/uploads/1792498062533-be2a7a728e3e.jpeg', label: 'Wheel Track Cross-Section' }
			],
			totalPhotosCount: 5,
			confirmations: 44,
			userConfirmed: true,
			status: 'DISPATCHED',
			dpwhNote: 'Staging 0.45t polymer-modified cold-patch at Santa Cruz municipal depot.',
			commentsCount: 3
		},
		{
			id: 'REP-9029',
			title: 'Fatigue Alligator Cracking & Loose Ballast Pebbles',
			location: 'Aguinaldo St / Public Market Feeder, Santa Cruz',
			corridorName: 'Aguinaldo Street Market Bypass',
			coordinatesString: '14.2801° N, 121.4154° E',
			severity: 6.8,
			vruRisk: 'MODERATE',
			astmCode: 'ASTM D6433 (Alligator Cracking - Med)',
			depthEstimate: '35mm localized spalling',
			description:
				'Interconnected polygon fatigue fractures generating loose basalt aggregate pebbles near the wet market corner curve.',
			author: {
				name: 'Alex Cruz',
				avatarInitials: 'AC'
			},
			timeAgo: '2h 15m ago',
			likedAt: 'Confirmed 2h ago',
			mainImage: '/samples/alligator-fatigue.jpg',
			secondaryImages: [
				{ src: '/uploads/1792498062533-be2a7a728e3e.jpeg', label: 'Aggregate Dispersion' },
				{ src: '/uploads/1792589063756-8b8a8dcd0e4e.jpeg', label: 'Market Corner View' }
			],
			totalPhotosCount: 3,
			confirmations: 19,
			userConfirmed: true,
			status: 'REPORTED',
			dpwhNote: 'Awaiting municipal engineering queue assignment (19 citizen confirmations).',
			commentsCount: 1
		},
		{
			id: 'REP-8994',
			title: 'Patched Asphalt Edge Drop-off Near Pagsanjan Bridge',
			location: 'National Highway, Pagsanjan Approach',
			corridorName: 'Manila East Rd',
			coordinatesString: '14.2765° N, 121.4312° E',
			severity: 2.1,
			vruRisk: 'LOW',
			astmCode: 'ASTM D6433 (Patched Utility Cut)',
			depthEstimate: 'Flush surface (<4mm)',
			description:
				'Previously hazardous 60mm edge drop-off has been compacted and sealed with hot-mix asphalt by DPWH District 1.',
			author: {
				name: 'Kuya Jojo & TODASCL Patrol',
				avatarInitials: 'KJ'
			},
			timeAgo: 'Yesterday',
			likedAt: 'Confirmed yesterday',
			mainImage: '/uploads/patch-post-repair.jpg',
			secondaryImages: [
				{ src: '/uploads/pothole-pre-repair.jpg', label: 'Pre-Repair Crater' },
				{ src: '/samples/pothole-severe.jpg', label: 'Compaction Verification' }
			],
			totalPhotosCount: 3,
			confirmations: 36,
			userConfirmed: true,
			status: 'RESOLVED',
			dpwhNote: 'Verified closed via Proof-of-Patch audit (96% surface flushness).',
			commentsCount: 4
		}
	]);

	type FilterType = 'ALL' | 'DISPATCHED' | 'RESOLVED';
	let activeFilter = $state<FilterType>('ALL');
	let searchQuery = $state('');
	let copiedId = $state<string | null>(null);
	let previewImage = $state<{ src: string; title: string; meta: string } | null>(null);

	const filteredItems = $derived(
		items.filter((item) => {
			if (!item.userConfirmed) return false;
			if (activeFilter === 'DISPATCHED' && item.status !== 'DISPATCHED') return false;
			if (activeFilter === 'RESOLVED' && item.status !== 'RESOLVED') return false;
			const q = searchQuery.trim().toLowerCase();
			if (!q) return true;
			return (
				item.title.toLowerCase().includes(q) ||
				item.location.toLowerCase().includes(q) ||
				item.id.toLowerCase().includes(q)
			);
		})
	);

	const counts = $derived({
		all: items.filter((i) => i.userConfirmed).length,
		dispatched: items.filter((i) => i.userConfirmed && i.status === 'DISPATCHED').length,
		resolved: items.filter((i) => i.userConfirmed && i.status === 'RESOLVED').length
	});

	function toggleConfirm(id: string) {
		const target = items.find((i) => i.id === id);
		if (!target) return;
		target.userConfirmed = !target.userConfirmed;
		target.confirmations += target.userConfirmed ? 1 : -1;
	}

	function copyShare(id: string) {
		copiedId = id;
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(`${window.location.origin}/community#post-${id}`);
		}
		setTimeout(() => {
			if (copiedId === id) copiedId = null;
		}, 2000);
	}

	function getVruBadgeClass(risk: LikedHazardItem['vruRisk']): string {
		switch (risk) {
			case 'CRITICAL':
				return 'bg-destructive/15 text-destructive border-destructive/30 font-semibold';
			case 'HIGH':
				return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold';
			case 'MODERATE':
				return 'bg-secondary text-foreground border-border';
			default:
				return 'bg-muted text-muted-foreground border-border';
		}
	}
</script>

<svelte:head>
	<title>Liked & Confirmed History — SuriOS</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
	<!-- Minimalist Header -->
	<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-5">
		<div class="space-y-1">
			<div class="flex items-center gap-2 text-xs font-mono text-muted-foreground">
				<HeartIcon class="h-3.5 w-3.5 text-foreground" />
				<span>Personal Civic Watchlist</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">
				Liked &amp; Confirmed Hazards
			</h1>
			<p class="text-xs text-muted-foreground">
				Track DPWH repair progress on every road defect you have upvoted or confirmed.
			</p>
		</div>

		<div class="flex items-center gap-2 shrink-0">
			<Button href="/community" variant="outline" size="sm" class="h-8 text-xs border-border shadow-none">
				Back to Feed
			</Button>
			<Button href="/report" size="sm" class="h-8 text-xs gap-1.5 shadow-none">
				<CameraIcon class="h-3.5 w-3.5" />
				<span>Report Hazard</span>
			</Button>
		</div>
	</div>

	<!-- Filter Pills & Search (Counts Embedded Directly in Pills) -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
		<div class="flex flex-wrap items-center gap-1.5">
			<Button
				variant={activeFilter === 'ALL' ? 'default' : 'outline'}
				size="sm"
				class="h-8 text-xs px-3 rounded-full shadow-none gap-1.5"
				onclick={() => (activeFilter = 'ALL')}
			>
				<span>All Confirmed</span>
				<span class="font-mono text-[10px] opacity-80">({counts.all})</span>
			</Button>
			<Button
				variant={activeFilter === 'DISPATCHED' ? 'default' : 'outline'}
				size="sm"
				class="h-8 text-xs px-3 rounded-full shadow-none gap-1.5"
				onclick={() => (activeFilter = 'DISPATCHED')}
			>
				<span>DPWH Dispatched</span>
				<span class="font-mono text-[10px] opacity-80">({counts.dispatched})</span>
			</Button>
			<Button
				variant={activeFilter === 'RESOLVED' ? 'default' : 'outline'}
				size="sm"
				class="h-8 text-xs px-3 rounded-full shadow-none gap-1.5"
				onclick={() => (activeFilter = 'RESOLVED')}
			>
				<span>Patched &amp; Resolved</span>
				<span class="font-mono text-[10px] opacity-80">({counts.resolved})</span>
			</Button>
		</div>

		<div class="relative w-full sm:w-52">
			<SearchIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Filter liked reports..."
				class="text-xs pl-8 h-8 bg-card border-border shadow-none"
				bind:value={searchQuery}
			/>
		</div>
	</div>

	<!-- Single-Column Swiss Minimalist Feed Cards (Image 13 Pattern) -->
	<div class="space-y-6">
		{#if filteredItems.length === 0}
			<Card class="border border-border bg-card shadow-none p-10 text-center space-y-3">
				<p class="text-sm font-semibold text-foreground">No confirmed hazards in this view.</p>
				<p class="text-xs text-muted-foreground">
					Upvote road hazards in the Civic Feed to follow their municipal repair status here.
				</p>
				<div class="pt-1">
					<Button href="/community" variant="outline" size="sm" class="text-xs border-border shadow-none">
						Explore Civic Feed
					</Button>
				</div>
			</Card>
		{:else}
			{#each filteredItems as post (post.id)}
				<div
					class="rounded-xl border border-border bg-card transition-all duration-200 overflow-hidden hover:border-foreground/25 shadow-xs"
					role="article"
				>
					<!-- Post Header -->
					<div class="p-4 sm:p-5 pb-3 flex items-center justify-between gap-3">
						<div class="flex items-center gap-2.5">
							<div class="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-xs text-foreground font-mono shrink-0">
								{post.author.avatarInitials}
							</div>
							<div class="flex flex-col">
								<div class="flex items-center gap-1.5 text-xs">
									<span class="text-sm font-bold text-foreground leading-none">{post.author.name}</span>
									<span class="text-muted-foreground leading-none">•</span>
									<span class="text-muted-foreground font-mono leading-none">{post.timeAgo}</span>
								</div>
								<span class="text-[11px] font-mono text-muted-foreground mt-1">{post.likedAt}</span>
							</div>
						</div>

						<div class="flex items-center gap-2">
							<Badge
								variant="outline"
								class="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full {getVruBadgeClass(post.vruRisk)} shadow-none"
							>
								{post.severity.toFixed(1)} {post.vruRisk}
							</Badge>
						</div>
					</div>

					<!-- Media Gallery with Inset Vertical Dock (Image 13 Signature) -->
					<div class="px-4 sm:px-5 pb-3">
						<div class="relative w-full h-64 sm:h-72 rounded-lg overflow-hidden border border-border bg-muted group">
							<button
								type="button"
								class="w-full h-full block p-0 cursor-pointer text-left"
								onclick={() =>
									(previewImage = {
										src: post.mainImage,
										title: post.title,
										meta: `${post.astmCode} • ${post.depthEstimate}`
									})}
							>
								<img
									src={post.mainImage}
									alt={post.title}
									class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
								/>
								<div class="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 pointer-events-none">
									<span class="text-[11px] font-mono text-white flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-md backdrop-blur-xs">
										<Maximize2Icon class="h-3.5 w-3.5" />
										Inspect Full Defect Photo
									</span>
								</div>
							</button>

							<!-- Inset Vertical Column Dock (Top-Right Inside Photo) -->
							<div class="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5 p-1 rounded-lg bg-black/45 backdrop-blur-md border border-white/20 shadow-lg">
								<button
									type="button"
									class="relative w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden border border-white/20 bg-black/60 cursor-pointer hover:ring-2 hover:ring-primary transition-all p-0"
									onclick={() =>
										(previewImage = {
											src: post.secondaryImages[0]?.src || post.mainImage,
											title: post.title,
											meta: post.secondaryImages[0]?.label || post.astmCode
										})}
								>
									<img
										src={post.secondaryImages[0]?.src || post.mainImage}
										alt="Secondary angle"
										class="w-full h-full object-cover"
									/>
								</button>

								<button
									type="button"
									class="relative w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden border border-white/20 bg-black/80 cursor-pointer hover:ring-2 hover:ring-primary transition-all p-0"
									onclick={() =>
										(previewImage = {
											src: post.secondaryImages[1]?.src || post.mainImage,
											title: post.title,
											meta: post.secondaryImages[1]?.label || post.astmCode
										})}
								>
									<img
										src={post.secondaryImages[1]?.src || post.mainImage}
										alt="More angles"
										class="w-full h-full object-cover opacity-35"
									/>
									<div class="absolute inset-0 flex flex-col items-center justify-center text-white font-mono leading-none">
										<span class="text-xs sm:text-sm font-bold">+{Math.max(post.totalPhotosCount - 2, 1)}</span>
										<span class="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/80 mt-0.5">more</span>
									</div>
								</button>

								<a
									href="/?incident={post.id}"
									class="relative w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden border border-white/30 bg-background/95 hover:bg-background flex flex-col items-center justify-between p-1 transition-all hover:ring-2 hover:ring-primary text-foreground"
									title="Open {post.corridorName} in Map Playground"
								>
									<div class="relative z-10 w-full flex items-center justify-center pt-1">
										<MapPinIcon class="h-4 w-4 sm:h-5 sm:w-5 text-destructive fill-destructive" />
									</div>
									<div class="relative z-10 w-full text-center">
										<span class="text-[9px] sm:text-[10px] font-mono font-bold text-foreground uppercase tracking-wider block">
											MAP
										</span>
									</div>
								</a>
							</div>
						</div>
					</div>

					<!-- Title, Description & DPWH Repair Tracker -->
					<div class="px-4 sm:px-5 pb-3 space-y-2">
						<h3 class="text-base sm:text-lg font-bold text-foreground tracking-tight leading-snug">
							{post.title}
						</h3>

						<p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
							{post.description}
						</p>

						<div class="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
							<MapPinIcon class="h-3.5 w-3.5 text-muted-foreground shrink-0" />
							<span class="font-medium text-foreground/85">{post.location}</span>
							<span>•</span>
							<a
								href="/?incident={post.id}"
								class="font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
							>
								<span>{post.coordinatesString}</span>
								<ArrowUpRightIcon class="h-3 w-3" />
							</a>
						</div>

						<!-- Live Repair Progress Pill -->
						<div class="mt-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 flex items-center justify-between gap-2 text-xs">
							<div class="flex items-center gap-2 min-w-0">
								<CheckCircleIcon
									class="h-3.5 w-3.5 shrink-0 {post.status === 'RESOLVED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}"
								/>
								<span class="text-muted-foreground truncate">{post.dpwhNote}</span>
							</div>
							<Badge variant="outline" class="font-mono text-[10px] shrink-0 border-border">
								{post.status}
							</Badge>
						</div>
					</div>

					<Separator />

					<!-- Action Bar -->
					<div class="px-4 sm:px-5 py-3 bg-card/60 flex items-center justify-between gap-3 text-xs">
						<Button
							variant="outline"
							size="sm"
							class="text-xs h-8 px-3.5 gap-1.5 rounded-full shadow-none transition-all bg-foreground text-background font-bold border-foreground hover:bg-foreground/90"
							onclick={() => toggleConfirm(post.id)}
							title="Click to remove from your Confirmed History"
						>
							<ArrowUpIcon class="h-3.5 w-3.5 text-background" />
							<span>{post.confirmations} Confirmed</span>
						</Button>

						<div class="flex items-center gap-1">
							<Button
								href="/community#post-{post.id}"
								variant="ghost"
								size="sm"
								class="text-xs h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground rounded-full"
							>
								<MessageSquareIcon class="h-3.5 w-3.5" />
								<span class="font-mono">{post.commentsCount}</span>
							</Button>

							<Button
								variant="ghost"
								size="icon"
								class="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
								onclick={() => copyShare(post.id)}
								title="Copy permalink"
							>
								{#if copiedId === post.id}
									<CheckIcon class="h-3.5 w-3.5 text-foreground" />
								{:else}
									<Share2Icon class="h-3.5 w-3.5" />
								{/if}
							</Button>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

{#if previewImage}
	<div
		class="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-3xl flex items-center justify-between text-white pb-3">
			<div>
				<p class="text-xs font-mono text-white/70">{previewImage.meta}</p>
				<h3 class="text-sm font-bold">{previewImage.title}</h3>
			</div>
			<Button
				variant="ghost"
				size="icon"
				class="h-8 w-8 text-white hover:bg-white/10 rounded-full"
				onclick={() => (previewImage = null)}
			>
				<XIcon class="h-4 w-4" />
			</Button>
		</div>
		<img
			src={previewImage.src}
			alt={previewImage.title}
			class="max-h-[75vh] max-w-full rounded-lg border border-white/15 object-contain"
		/>
	</div>
{/if}
