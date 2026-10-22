<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ImageIcon from '@lucide/svelte/icons/image';
	import VideoIcon from '@lucide/svelte/icons/video';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import Share2Icon from '@lucide/svelte/icons/share-2';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import XIcon from '@lucide/svelte/icons/x';
	import SendIcon from '@lucide/svelte/icons/send';

	let { data }: PageProps = $props();
	const currentName = $derived(data.user?.name || 'Guest');
	const currentInitials = $derived(currentName.split(' ').slice(0, 2).map((part) => part[0]).join(''));
	// Community Comment Interface
	interface CommunityComment {
		id: string;
		author: string;
		handle?: string;
		role: string;
		avatarInitials: string;
		isOfficial?: boolean;
		officialBadge?: string;
		timeAgo: string;
		text: string;
	}

	// Social Hazard Post Interface
	interface SocialHazardPost {
		id: string;
		title: string;
		location: string;
		corridorName: string;
		corridorId: string;
		coordinatesString: string;
		latitude: number;
		longitude: number;
		severity: number;
		vruRisk: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
		astmCode: string;
		depthEstimate: string;
		safetyTags: string[];
		description: string;
		author: {
			name: string;
			handle: string;
			roleTag: string;
			avatarInitials: string;
			isVerified: boolean;
		};
		timeAgo: string;
		mainImage: string;
		secondaryImages: {
			src: string;
			label: string;
		}[];
		totalPhotosCount: number;
		confirmations: number;
		userConfirmed: boolean;
		isTricycleCorridor: boolean;
		escalatedToDpwh: boolean;
		dpwhTicket?: string;
		crewAssigned?: string;
		comments: CommunityComment[];
		showComments?: boolean;
	}

	// Civic Social Hazard Posts Stream (Santa Cruz, Laguna)
	let posts = $state<SocialHazardPost[]>([
		{
			id: 'REP-9032',
			title: 'Sunken Crosswalk Utility Trench',
			location: 'Quezon Ave cor. EDSA, Diliman',
			corridorName: 'Quezon Avenue Corridor',
			corridorId: 'CORR-03',
			coordinatesString: '14.6507° N, 121.0345° E',
			latitude: 14.6507,
			longitude: 121.0345,
			severity: 8.9,
			vruRisk: 'CRITICAL',
			astmCode: 'ASTM D6433 (Utility Cut Depression)',
			depthEstimate: '52mm transverse trench',
			safetyTags: ['VRU CRITICAL 8.9/10', 'School Zone Danger', 'Tricycle Alert', 'Rim Catch Hazard'],
			description: 'Depression across eastbound pedestrian crosswalk causing wheel entrapment and trip hazards for pedestrians and cyclists.',
			author: {
				name: 'Ria Santos',
				handle: '@ria_commutes',
				roleTag: 'Student Mobility Coordinator',
				avatarInitials: 'RS',
				isVerified: true
			},
			timeAgo: '1h ago',
			mainImage: '/samples/pothole-severe.jpg',
			secondaryImages: [
				{ src: '/samples/pothole-severe.jpg', label: 'Crosswalk Alignment' },
				{ src: '/samples/pothole-severe.jpg', label: 'Trench Depth Lip' }
			],
			totalPhotosCount: 5,
			confirmations: 27,
			userConfirmed: true,
			isTricycleCorridor: true,
			escalatedToDpwh: true,
			dpwhTicket: 'DPWH-IV-A-2026-9032',
			crewAssigned: 'Laguna Water Utility Ops',
			showComments: false,
			comments: [
				{
					id: 'c6',
					author: 'Engr. Mateo Cruz',
					handle: '@cruz_civil',
					role: 'LSPU Civil Engineering Faculty Volunteer',
					avatarInitials: 'MC',
					isOfficial: true,
					officialBadge: 'Civil Inspector Volunteer',
					timeAgo: '55m ago',
					text: 'Subgrade moisture settling is evident beneath the asphalt skin. Requires full gravel re-compaction prior to hot asphalt resurfacing.'
				}
			]
		},
		{
			id: 'REP-9041',
			title: 'Deep 68mm Rim-Strike Crater & Submerged Ponding Hole',
			location: 'Pedro Guevara Ave (Near LSPU Main Gate 2), Santa Cruz',
			corridorName: 'Pedro Guevara Avenue',
			corridorId: 'CORR-02',
			coordinatesString: '14.2813° N, 121.4173° E',
			latitude: 14.2813,
			longitude: 121.4173,
			severity: 9.2,
			vruRisk: 'CRITICAL',
			astmCode: 'ASTM D6433 (Pothole - High)',
			depthEstimate: '68mm vertical lip strike',
			safetyTags: ['VRU CRITICAL 9.2/10', 'Tricycle Alert', 'Night Hazard', 'Rim Catch Hazard', 'Monsoon Flooding Risk'],
			description: 'Severe vertical lip directly in the primary two-wheeler and tricycle wheel path. During afternoon monsoon rains, turbid puddle water completely disguises the crater depth, causing sudden suspension bottoming and handlebar snatch.',
			author: {
				name: 'Mark Bautista',
				handle: '@rider_mark_laguna',
				roleTag: 'Brgy. Bubukal Tricycle Driver',
				avatarInitials: 'MB',
				isVerified: true
			},
			timeAgo: '14m ago',
			mainImage: '/samples/pothole-severe.jpg',
			secondaryImages: [
				{ src: '/samples/pothole-severe.jpg', label: 'Lip Gauge: 68mm' },
				{ src: '/samples/pothole-severe.jpg', label: 'Wheel Track Cross-Section' },
				{ src: '/samples/pothole-severe.jpg', label: 'Previous Cold-Patch Failure' }
			],
			totalPhotosCount: 5,
			confirmations: 43,
			userConfirmed: false,
			isTricycleCorridor: true,
			escalatedToDpwh: true,
			dpwhTicket: 'DPWH-IV-A-2026-9041',
			crewAssigned: 'Crew Alpha (Cold-Patch Squad)',
			showComments: false,
			comments: [
				{
					id: 'c1',
					author: 'Engr. Danilo Reyes',
					handle: '@danilo_dpwh',
					role: 'DPWH District 1 Engineering Office',
					avatarInitials: 'DR',
					isOfficial: true,
					officialBadge: 'DPWH Official Dispatch',
					timeAgo: '8m ago',
					text: 'Incident logged to DPWH Crew Alpha dispatch queue for 2:00 PM cold-patch tamp. Staging 0.45t polymer-modified asphalt at Santa Cruz municipal depot.'
				},
				{
					id: 'c2',
					author: 'Mark Bautista',
					handle: '@rider_mark_laguna',
					role: 'Brgy. Bubukal Tricycle Driver',
					avatarInitials: 'MB',
					timeAgo: '11m ago',
					text: 'Salamat Engr. Danilo! Paki-alalay din po yung mga pasahero sa tricycle pag lagpas ng LSPU bridge, malalim talaga.'
				},
				{
					id: 'c3',
					author: 'Kuya Jojo & TODASCL Patrol',
					handle: '@toda_santa_cruz',
					role: 'TODASCL Patrol Captain',
					avatarInitials: 'KJ',
					timeAgo: '12m ago',
					text: 'Noted from TODA Station 3. Drivers instructed to stay slightly to the right shoulder line until crew compaction is complete.'
				}
			]
		},
		{
			id: 'REP-9038',
			title: 'Longitudinal Shoulder Drop-off & Gutter Spall Fracture',
			location: 'National Highway (Pagsanjan Junction Approach), Santa Cruz',
			corridorName: 'Manila East Rd / National Highway',
			corridorId: 'CORR-01',
			coordinatesString: '14.2765° N, 121.4312° E',
			latitude: 14.2765,
			longitude: 121.4312,
			severity: 8.4,
			vruRisk: 'CRITICAL',
			astmCode: 'ASTM D6433 (Edge Defect - High)',
			depthEstimate: '75mm shoulder step-down',
			safetyTags: ['VRU CRITICAL 8.4/10', 'Tricycle Alert', 'Rim Catch Hazard', 'Shoulder Drop-off'],
			description: 'Severe edge breakdown between asphalt lane and concrete gutter line. Tricycle sidecars experience abrupt wheel drop when giving way to provincial buses and heavy container trucks.',
			author: {
				name: 'Kuya Jojo & TODASCL Patrol',
				handle: '@toda_santa_cruz',
				roleTag: 'TODASCL Patrol Captain',
				avatarInitials: 'KJ',
				isVerified: true
			},
			timeAgo: '42m ago',
			mainImage: '/samples/pothole-severe.jpg',
			secondaryImages: [
				{ src: '/samples/pothole-severe.jpg', label: 'Gutter Spall' },
				{ src: '/samples/pothole-severe.jpg', label: 'Trench Line' },
				{ src: '/samples/pothole-severe.jpg', label: 'Approach Angle' }
			],
			totalPhotosCount: 4,
			confirmations: 31,
			userConfirmed: false,
			isTricycleCorridor: true,
			escalatedToDpwh: true,
			dpwhTicket: 'DPWH-IV-A-2026-9038',
			crewAssigned: 'Crew Bravo (Edge & Curb Unit)',
			showComments: false,
			comments: [
				{
					id: 'c4',
					author: 'Brgy. Public Safety Officer',
					handle: '@poblacion_safety',
					role: 'Barangay Pagsanjan Junction Marshal',
					avatarInitials: 'BP',
					isOfficial: true,
					officialBadge: 'Barangay Public Safety',
					timeAgo: '28m ago',
					text: 'Reflectorized caution cones positioned 20 meters before the drop-off to guide night traffic away from the unpaved shoulder.'
				},
				{
					id: 'c5',
					author: 'Carla Dizon',
					handle: '@carla_cycling',
					role: 'Active Mobility Advocate',
					avatarInitials: 'CD',
					timeAgo: '35m ago',
					text: 'Commuter cyclists have to take the center lane here to avoid tire wedge. Glad this is confirmed for DPWH edge reconstitution.'
				}
			]
		},
		{
			id: 'REP-9029',
			title: 'Fatigue Alligator Cracking & Loose Ballast Pebbles',
			location: 'Aguinaldo St / Public Market Feeder, Santa Cruz',
			corridorName: 'Aguinaldo Street Market Bypass',
			corridorId: 'CORR-04',
			coordinatesString: '14.2801° N, 121.4154° E',
			latitude: 14.2801,
			longitude: 121.4154,
			severity: 6.8,
			vruRisk: 'MODERATE',
			astmCode: 'ASTM D6433 (Alligator Cracking - Med)',
			depthEstimate: '35mm localized spalling',
			safetyTags: ['MODERATE VRU 6.8/10', 'Skid Hazard', 'Loose Gravel', 'Market Corridor'],
			description: 'Interconnected polygon fatigue fractures generating loose basalt aggregate pebbles. Delivery motorcycles turning into the wet market slip when braking on loose surface stones.',
			author: {
				name: 'Juan Dela Cruz (You)',
				handle: '@juan_guardian',
				roleTag: 'Verified Barangay Citizen Sentinel',
				avatarInitials: 'JD',
				isVerified: true
			},
			timeAgo: '2h 15m ago',
			mainImage: '/samples/alligator-fatigue.jpg',
			secondaryImages: [
				{ src: '/samples/pothole-severe.jpg', label: 'Aggregate Dispersion' },
				{ src: '/samples/pothole-severe.jpg', label: 'Market Corner View' }
			],
			totalPhotosCount: 3,
			confirmations: 19,
			userConfirmed: true,
			isTricycleCorridor: true,
			escalatedToDpwh: false,
			showComments: false,
			comments: [
				{
					id: 'c7',
					author: 'Juan Dela Cruz (You)',
					handle: '@juan_guardian',
					role: 'Verified Barangay Citizen Sentinel',
					avatarInitials: 'JD',
					timeAgo: '2h 10m ago',
					text: 'Passed by on my motorbike this morning. The gravel marbles right at the corner curve make rear tires skid when turning.'
				}
			]
		},
		{
			id: 'REP-9025',
			title: 'Transverse Thermal Crack Across Main Travel Lane',
			location: 'San Pablo Norte Lakefront Bypass, Santa Cruz',
			corridorName: 'San Pablo Norte Lakefront Bypass',
			corridorId: 'CORR-05',
			coordinatesString: '14.2890° N, 121.4250° E',
			latitude: 14.2890,
			longitude: 121.4250,
			severity: 4.5,
			vruRisk: 'LOW',
			astmCode: 'ASTM D6433 (Transverse Crack - Low)',
			depthEstimate: '18mm crack aperture',
			safetyTags: ['LOW VRU 4.5/10', 'Preventative Bitumen Seal', 'Moisture Seepage'],
			description: 'Hairline transverse cracking across both lanes. Low immediate danger to two-wheelers, but preventative rubberized bitumen crack pour is recommended before monsoon water washes out subbase.',
			author: {
				name: 'Engr. Mateo Cruz',
				handle: '@cruz_civil',
				roleTag: 'LSPU Civil Engineering Faculty Volunteer',
				avatarInitials: 'MC',
				isVerified: true
			},
			timeAgo: '3h 40m ago',
			mainImage: '/samples/pothole-severe.jpg',
			secondaryImages: [
				{ src: '/samples/alligator-fatigue.jpg', label: 'Crack Width Gauge' }
			],
			totalPhotosCount: 2,
			confirmations: 12,
			userConfirmed: false,
			isTricycleCorridor: false,
			escalatedToDpwh: false,
			showComments: false,
			comments: [
				{
					id: 'c8',
					author: 'Engr. Danilo Reyes',
					handle: '@danilo_dpwh',
					role: 'DPWH District 1 Engineering Office',
					avatarInitials: 'DR',
					isOfficial: true,
					officialBadge: 'DPWH Official Dispatch',
					timeAgo: '3h ago',
					text: 'Scheduled for preventative crack-sealing run with elastomeric asphalt emulsion during next dry window.'
				}
			]
		}
	]);


	type FeedTab = 'ALL' | 'CRITICAL' | 'CONFIRMED';
	let feedTab = $state<FeedTab>('ALL');
	let search = $state('');
	let authorFilter = $state('');
	let mapViews = $state<Record<string, boolean>>({});
	let expanded = $state<Record<string, boolean>>({});
	let commentInputs = $state<Record<string, string>>({});
	let profile = $state<SocialHazardPost['author'] | null>(null);
	let profileOpen = $state(false);
	let viewerOpen = $state(false);
	let viewerImages = $state<{ src: string; label: string }[]>([]);
	let viewerIndex = $state(0);
	let toast = $state('');
	let toastTimer: ReturnType<typeof setTimeout>;

	const people = $derived([...new Map(posts.map((post) => [post.author.handle, post.author])).values()]);
	const filteredPosts = $derived(posts.filter((post) => {
		if (authorFilter && post.author.handle !== authorFilter) return false;
		if (feedTab === 'CRITICAL' && post.severity < 8) return false;
		if (feedTab === 'CONFIRMED' && !post.userConfirmed) return false;
		return `${post.title} ${post.location} ${post.author.name} ${post.author.handle}`.toLowerCase().includes(search.trim().toLowerCase());
	}));

	function notify(message: string) {
		clearTimeout(toastTimer);
		toast = message;
		toastTimer = setTimeout(() => toast = '', 3000);
	}
	function showProfile(author: SocialHazardPost['author']) {
		profile = author;
		profileOpen = true;
	}
	function showImages(post: SocialHazardPost, index = 0) {
		viewerImages = [{ src: post.mainImage, label: post.title }, ...post.secondaryImages];
		viewerIndex = index;
		viewerOpen = true;
	}
	function changeImage(direction: number) {
		viewerIndex = (viewerIndex + direction + viewerImages.length) % viewerImages.length;
	}
	function confirm(post: SocialHazardPost) {
		post.userConfirmed = !post.userConfirmed;
		post.confirmations += post.userConfirmed ? 1 : -1;
	}
	function comment(post: SocialHazardPost) {
		const text = commentInputs[post.id]?.trim();
		if (!text) return;
		post.comments.push({ id: crypto.randomUUID(), author: currentName, role: 'Community member', avatarInitials: currentInitials, timeAgo: 'Just now', text });
		commentInputs[post.id] = '';
	}
	async function share(post: SocialHazardPost) {
		try {
			await navigator.clipboard.writeText(`${window.location.origin}/community#post-${post.id}`);
			notify('Post link copied');
		} catch { notify('Unable to copy the link. You can copy this post’s address from your browser.'); }
	}
	function mapUrl(post: SocialHazardPost) {
		const { latitude: lat, longitude: lng } = post;
		return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - .004},${lat - .0025},${lng + .004},${lat + .0025}&layer=mapnik&marker=${lat},${lng}`;
	}
</script>

<svelte:window onkeydown={(event) => {
	if (viewerOpen && event.key === 'ArrowRight') changeImage(1);
	if (viewerOpen && event.key === 'ArrowLeft') changeImage(-1);
}} />

<svelte:head><title>Community Feed — SuriOS</title></svelte:head>

<div class="community-surface min-h-full bg-muted/35">
	<div class="feed-layout mx-auto grid max-w-[1040px] items-start gap-5 px-2 py-3 sm:px-5 sm:py-4">
		<section class="min-w-0 space-y-3" aria-label="Community feed">
			<h1 class="sr-only">Community feed</h1>
			<!-- Search and identity replace the large page banner. -->
			<div class="flex items-center gap-2">
				<div class="relative min-w-0 flex-1">
					<SearchIcon aria-hidden="true" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input aria-label="Search community" type="search" placeholder="Search people, roads, and posts" bind:value={search} class="h-11 rounded-full bg-card pl-10 shadow-none" />
				</div>
				<a href="/profile" aria-label="Your profile" class="avatar size-11 border-primary/30 bg-primary/10 text-primary">{currentInitials}</a>
			</div>

			<div class="rounded-xl border border-border bg-card px-3 pt-3">
				<div class="flex items-center gap-2.5">
					<a href="/profile" aria-label="Open your profile" class="avatar size-10">{currentInitials}</a>
					<a href="/report" class="flex min-h-11 flex-1 items-center rounded-full bg-muted px-4 text-sm text-muted-foreground transition-colors hover:bg-secondary">What’s happening on your road?</a>
				</div>
				<div class="mt-3 grid grid-cols-3 border-t border-border py-1">
					<a href="/report" class="composer-action"><ImageIcon aria-hidden="true" class="size-4 text-primary" />Photo</a>
					<a href="/report" class="composer-action"><VideoIcon aria-hidden="true" class="size-4 text-primary" />Video</a>
					<a href="/" class="composer-action"><MapPinIcon aria-hidden="true" class="size-4 text-primary" />Location</a>
				</div>
			</div>

			<div class="flex min-w-0 items-center justify-between gap-2">
				<div class="flex gap-1" aria-label="Feed filters">
					{#each [{ id: 'ALL', label: 'For you' }, { id: 'CRITICAL', label: 'Critical' }, { id: 'CONFIRMED', label: 'Confirmed' }] as tab}
						<button type="button" aria-pressed={feedTab === tab.id} class="min-h-11 rounded-full px-3 text-sm font-medium transition-colors {feedTab === tab.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary'}" onclick={() => feedTab = tab.id as FeedTab}>{tab.label}</button>
					{/each}
				</div>
				<span class="hidden text-xs text-muted-foreground sm:block">Community updates</span>
			</div>
			{#if authorFilter}
				<button class="flex min-h-11 max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 text-sm" onclick={() => authorFilter = ''} aria-label="Clear person filter"><span class="truncate">Posts by {people.find((person) => person.handle === authorFilter)?.name}</span><XIcon class="size-4 shrink-0" /></button>
			{/if}

			{#each filteredPosts as post (post.id)}
				<article id="post-{post.id}" class="post-card scroll-mt-4 overflow-hidden rounded-xl border border-border bg-card">
					<header class="flex items-center justify-between gap-2 px-3 py-3 sm:px-4">
						<button type="button" class="flex min-w-0 items-center gap-2.5 rounded-lg text-left" onclick={() => showProfile(post.author)} aria-label="View {post.author.name}'s profile">
							<span class="avatar size-10">{post.author.avatarInitials}</span>
							<span class="min-w-0"><span class="flex items-center gap-1 text-sm font-semibold"><span class="truncate">{post.author.name}</span>{#if post.author.isVerified}<CheckIcon aria-label="Verified contributor" class="size-3.5 shrink-0 text-primary" />{/if}</span><span class="block text-xs text-muted-foreground">{post.timeAgo} · Community</span></span>
						</button>
						<span class="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold {post.vruRisk === 'CRITICAL' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}">{post.severity.toFixed(1)} {post.vruRisk.toLowerCase()}</span>
					</header>

					<div class="space-y-1 px-3 pb-3 sm:px-4">
						<h2 class="text-sm font-semibold leading-snug">{post.title}</h2>
						<p class="text-sm leading-5 text-muted-foreground" class:line-clamp-2={!expanded[post.id]}>{post.description}</p>
						{#if post.description.length > 150}<button class="min-h-8 text-xs font-semibold hover:underline" onclick={() => expanded[post.id] = !expanded[post.id]}>{expanded[post.id] ? 'See less' : 'See more'}</button>{/if}
					</div>

					<div class="relative border-y border-border bg-muted">
						{#if mapViews[post.id]}
							<iframe title="Map of {post.location}" src={mapUrl(post)} loading="lazy" class="post-media w-full border-0"></iframe>
						{:else}
							<button class="block w-full cursor-zoom-in" onclick={() => showImages(post)} aria-label="Open photos of {post.title}"><img src={post.mainImage} alt={post.title} class="post-media w-full object-cover" loading="lazy" /></button>
							{#if post.secondaryImages.length}
								<button class="absolute bottom-3 left-3 flex min-h-10 items-center gap-2 rounded-lg border border-white/30 bg-black/65 px-3 text-xs font-medium text-white hover:bg-black/80" onclick={() => showImages(post, 1)} aria-label="View all {post.secondaryImages.length + 1} photos"><ImageIcon aria-hidden="true" class="size-4" />{post.secondaryImages.length + 1} photos</button>
							{/if}
						{/if}
						<button class="absolute right-3 top-3 flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium shadow-sm hover:bg-secondary" aria-pressed={!!mapViews[post.id]} onclick={() => mapViews[post.id] = !mapViews[post.id]}>{#if mapViews[post.id]}<ImageIcon aria-hidden="true" class="size-4" />Photos{:else}<MapPinIcon aria-hidden="true" class="size-4" />Map{/if}</button>
					</div>

					<div class="flex items-start gap-1.5 px-3 py-2 sm:px-4"><MapPinIcon aria-hidden="true" class="mt-0.5 size-3.5 shrink-0 text-primary" /><a class="min-w-0 text-xs text-muted-foreground hover:underline" href="https://www.openstreetmap.org/?mlat={post.latitude}&mlon={post.longitude}#map=17/{post.latitude}/{post.longitude}" target="_blank" rel="noreferrer">{post.location}</a></div>
					<div class="flex items-center justify-between px-3 pb-2 text-xs text-muted-foreground sm:px-4"><span>{post.confirmations} confirmations</span><button class="min-h-7 hover:underline" onclick={() => post.showComments = !post.showComments}>{post.comments.length} comments</button></div>
					<div class="mx-3 grid grid-cols-3 border-t border-border py-1 sm:mx-4">
						<button class="post-action {post.userConfirmed ? 'text-primary' : ''}" aria-pressed={post.userConfirmed} onclick={() => confirm(post)}><ThumbsUpIcon aria-hidden="true" class="size-4" />{post.userConfirmed ? 'Confirmed' : 'Confirm'}</button>
						<button class="post-action" aria-expanded={!!post.showComments} onclick={() => post.showComments = !post.showComments}><MessageSquareIcon aria-hidden="true" class="size-4" />Comment</button>
						<button class="post-action" onclick={() => share(post)}><Share2Icon aria-hidden="true" class="size-4" />Share</button>
					</div>
					{#if post.showComments}
						<div class="space-y-3 border-t border-border bg-muted/20 p-3 sm:p-4">
							{#each post.comments as entry (entry.id)}
								<div class="flex items-start gap-2"><span class="avatar size-8 text-[10px]">{entry.avatarInitials}</span><div class="min-w-0 rounded-xl bg-muted px-3 py-2"><p class="text-xs font-semibold">{entry.author}</p><p class="break-words text-sm">{entry.text}</p></div></div>
							{/each}
							<form class="flex items-center gap-2" onsubmit={(event) => { event.preventDefault(); comment(post); }}><span class="avatar size-8 text-[10px]">{currentInitials}</span><Input aria-label="Comment on {post.title}" placeholder="Write a comment…" bind:value={commentInputs[post.id]} class="h-11 min-w-0 flex-1 rounded-full bg-card" /><Button type="submit" variant="ghost" size="icon" class="size-11 shrink-0" aria-label="Send comment" disabled={!commentInputs[post.id]?.trim()}><SendIcon class="size-4" /></Button></form>
						</div>
					{/if}
				</article>
			{:else}
				<div class="rounded-xl border border-border bg-card p-6 text-center"><h2 class="font-semibold">No matching posts</h2><p class="mt-1 text-sm text-muted-foreground">Try a different name, road, or filter.</p><Button class="mt-3" variant="outline" onclick={() => { search = ''; feedTab = 'ALL'; authorFilter = ''; }}>Clear filters</Button></div>
			{/each}
		</section>

		<aside class="hidden space-y-4 xl:block" aria-label="Community people">
			<div class="sticky top-4 space-y-4">
				<div class="border-b border-border pb-3"><h2 class="text-sm font-semibold">Your community</h2><p class="mt-1 text-xs leading-5 text-muted-foreground">People keeping local roads safer.</p></div>
				<div class="space-y-1">{#each people as person}<button class="flex min-h-12 w-full items-center gap-2.5 rounded-lg px-2 text-left hover:bg-secondary" onclick={() => showProfile(person)}><span class="avatar size-9">{person.avatarInitials}</span><span class="min-w-0"><span class="block truncate text-sm font-medium">{person.name}</span><span class="block truncate text-xs text-muted-foreground">{person.roleTag}</span></span></button>{/each}</div>
				<a href="/liked" class="block rounded-xl border border-border bg-card p-3 text-sm font-medium hover:bg-secondary">Your confirmed hazards <span class="mt-1 block text-xs font-normal text-muted-foreground">Keep an eye on roads you care about.</span></a>
			</div>
		</aside>
	</div>
</div>

<Dialog bind:open={profileOpen}><DialogContent class="sm:max-w-md"><DialogHeader><DialogTitle>{profile?.name}</DialogTitle><DialogDescription>{profile?.roleTag}</DialogDescription></DialogHeader>{#if profile}<div class="flex items-center gap-3"><span class="avatar size-14 text-base">{profile.avatarInitials}</span><div><p class="text-sm font-medium">{profile.handle}</p><p class="text-xs text-muted-foreground">{posts.filter((post) => post.author.handle === profile?.handle).length} community posts</p></div></div><Button onclick={() => { authorFilter = profile?.handle || ''; search = ''; feedTab = 'ALL'; profileOpen = false; window.scrollTo({ top: 0, behavior: 'instant' }); }}>View posts</Button>{/if}</DialogContent></Dialog>

<Dialog bind:open={viewerOpen}><DialogContent class="max-h-[90svh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Road photos</DialogTitle><DialogDescription>{viewerImages[viewerIndex]?.label}</DialogDescription></DialogHeader><img src={viewerImages[viewerIndex]?.src} alt={viewerImages[viewerIndex]?.label} class="max-h-[60svh] w-full rounded-lg object-contain" /><div class="flex items-center justify-between"><Button variant="outline" size="icon" aria-label="Previous photo" onclick={() => changeImage(-1)} disabled={viewerImages.length < 2}><ChevronLeftIcon class="size-4" /></Button><span class="text-xs text-muted-foreground">{viewerIndex + 1} / {viewerImages.length}</span><Button variant="outline" size="icon" aria-label="Next photo" onclick={() => changeImage(1)} disabled={viewerImages.length < 2}><ChevronRightIcon class="size-4" /></Button></div></DialogContent></Dialog>

{#if toast}<div role="status" class="fixed bottom-4 left-1/2 z-50 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-lg">{toast}</div>{/if}

<style>
	.feed-layout { grid-template-columns: minmax(0, 680px); justify-content: center; }
	.avatar { display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center; border: 1px solid var(--border); border-radius: 9999px; background: var(--secondary); font-size: .75rem; font-weight: 600; }
	.composer-action, .post-action { display: flex; min-height: 44px; align-items: center; justify-content: center; gap: 6px; border-radius: 8px; font-size: .8125rem; font-weight: 500; cursor: pointer; transition: background-color .15s; }
	.composer-action:hover, .post-action:hover { background: var(--secondary); }
	.post-media { height: clamp(200px, 32svh, 300px); }
	@media (min-width: 1280px) { .feed-layout { grid-template-columns: minmax(0, 680px) 240px; } }
	@media (max-width: 400px) { .post-action { gap: 4px; font-size: .75rem; } }
	@media (prefers-reduced-motion: reduce) { .composer-action, .post-action { transition: none; } }
</style>
