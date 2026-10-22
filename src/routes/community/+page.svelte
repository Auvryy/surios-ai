<script lang="ts">
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	import { SANTA_CRUZ_CORRIDORS } from '$lib/data/corridors.js';

	import AwardIcon from '@lucide/svelte/icons/award';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import BikeIcon from '@lucide/svelte/icons/bike';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import NavigationIcon from '@lucide/svelte/icons/navigation';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import SearchIcon from '@lucide/svelte/icons/search';
	import CameraIcon from '@lucide/svelte/icons/camera';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import AlertCircleIcon from '@lucide/svelte/icons/circle-alert';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import TrophyIcon from '@lucide/svelte/icons/trophy';
	import CoinsIcon from '@lucide/svelte/icons/coins';
	import CheckIcon from '@lucide/svelte/icons/check';
	import Share2Icon from '@lucide/svelte/icons/share-2';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import SendIcon from '@lucide/svelte/icons/send';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import XIcon from '@lucide/svelte/icons/x';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import CrosshairIcon from '@lucide/svelte/icons/crosshair';
	import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
	import CloudRainIcon from '@lucide/svelte/icons/cloud-rain';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import FlagIcon from '@lucide/svelte/icons/flag';

	// Guardian Leaderboard Interface
	interface GuardianLeader {
		rank: number;
		name: string;
		handle: string;
		role: string;
		badgeName: string;
		hazardScore: number;
		verifiedReports: number;
		preventedAccidents: number;
		accuracyRate: number;
		topCorridor: string;
		isCurrentUser?: boolean;
	}

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

	interface LightboxData {
		isOpen: boolean;
		images: { src: string; label: string }[];
		currentIndex: number;
		title: string;
		astmCode: string;
		depth: string;
		severity: number;
		location: string;
	}

	// Personal Citizen Impact State
	let verifiedSubmissionsCount = $state(3);
	let accidentsPreventedCount = $state(14);
	let damageAvertedPesos = $state(84000);
	let personalUpvotesGiven = $state(28);
	let personalScore = $state(210);

	// Feed Controls & Filter State
	type FeedFilterType = 'ALL' | 'CRITICAL_VRU' | 'TRICYCLE_CORRIDORS' | 'RECENTLY_VERIFIED';
	let feedTab = $state<FeedFilterType>('ALL');
	let feedSearch = $state('');

	// Guardians Leaderboard Expansion State
	let showGuardiansDrawer = $state(false);
	let leaderboardTab = $state<'ALL_TIME' | 'THIS_MONTH' | 'SANTA_CRUZ'>('ALL_TIME');
	let leaderboardSearch = $state('');

	// UI Interactive States
	let activeHazardId = $state<string | null>(null);
	let highlightedPostId = $state<string | null>(null);
	let openMenuPostId = $state<string | null>(null);
	let copiedPostId = $state<string | null>(null);
	let toastMessage = $state<string | null>(null);
	let toastTimer: any = null;
	let newCommentInput = $state<Record<string, string>>({});

	// Lightbox Modal State
	let lightbox = $state<LightboxData>({
		isOpen: false,
		images: [],
		currentIndex: 0,
		title: '',
		astmCode: '',
		depth: '',
		severity: 0,
		location: ''
	});

	// Leaflet Radar Map State
	let mapContainer = $state<HTMLDivElement | null>(null);
	let leafletLib: any = null;
	let mapInstance: any = null;
	let tileLayerInstance: any = null;
	let corridorsGroup: any = null;
	let markersGroup: any = null;
	let markerMap = new Map<string, any>();
	let isDarkMode = $state(false);

	// Guardians Honor Roll Data
	let guardians = $state<GuardianLeader[]>([
		{
			rank: 1,
			name: 'Mark Bautista',
			handle: '@rider_mark_laguna',
			role: 'Motorcycle Commuter & Two-Wheeler Safety Lead',
			badgeName: 'Laguna Gold Guardian',
			hazardScore: 940,
			verifiedReports: 38,
			preventedAccidents: 62,
			accuracyRate: 99.4,
			topCorridor: 'Manila East Rd / National Highway'
		},
		{
			rank: 2,
			name: 'Ria Santos',
			handle: '@ria_commutes',
			role: 'Student Corridor Watch Coordinator',
			badgeName: 'Silver Sentinel',
			hazardScore: 780,
			verifiedReports: 29,
			preventedAccidents: 45,
			accuracyRate: 98.2,
			topCorridor: 'Quezon Ave – Bubukal Student Corridor'
		},
		{
			rank: 3,
			name: 'Kuya Jojo & TODASCL Patrol',
			handle: '@toda_santa_cruz',
			role: 'Santa Cruz Tricycle Operators Federation',
			badgeName: 'Bronze Advocate',
			hazardScore: 650,
			verifiedReports: 24,
			preventedAccidents: 39,
			accuracyRate: 96.8,
			topCorridor: 'Pedro Guevara Avenue (Poblacion)'
		},
		{
			rank: 4,
			name: 'Engr. Mateo Cruz',
			handle: '@cruz_civil',
			role: 'LSPU Civil Engineering Faculty Volunteer',
			badgeName: 'Civil Inspector Sentinel',
			hazardScore: 520,
			verifiedReports: 19,
			preventedAccidents: 28,
			accuracyRate: 100,
			topCorridor: 'San Pablo Norte Lakefront Bypass'
		},
		{
			rank: 5,
			name: 'Carla Dizon',
			handle: '@carla_cycling',
			role: 'Santa Cruz Active Mobility Advocate',
			badgeName: 'Active Mobility Sentinel',
			hazardScore: 440,
			verifiedReports: 16,
			preventedAccidents: 22,
			accuracyRate: 97.0,
			topCorridor: 'Aguinaldo St / Public Market Feeder'
		},
		{
			rank: 12,
			name: 'Juan Dela Cruz (You)',
			handle: '@juan_guardian',
			role: 'Verified Barangay Citizen Sentinel',
			badgeName: 'Active Road Guardian',
			hazardScore: 210,
			verifiedReports: 3,
			preventedAccidents: 14,
			accuracyRate: 100,
			topCorridor: 'Pedro Guevara Avenue',
			isCurrentUser: true
		}
	]);

	// Civic Social Hazard Posts Stream (Santa Cruz, Laguna)
	let posts = $state<SocialHazardPost[]>([
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
				{ src: '/uploads/pothole-pre-repair.jpg', label: 'Lip Gauge: 68mm' },
				{ src: '/uploads/1792498062533-be2a7a728e3e.jpeg', label: 'Wheel Track Cross-Section' },
				{ src: '/uploads/patch-post-repair.jpg', label: 'Previous Cold-Patch Failure' }
			],
			totalPhotosCount: 5,
			confirmations: 43,
			userConfirmed: false,
			isTricycleCorridor: true,
			escalatedToDpwh: true,
			dpwhTicket: 'DPWH-IV-A-2026-9041',
			crewAssigned: 'Crew Alpha (Cold-Patch Squad)',
			showComments: true,
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
			mainImage: '/uploads/1792498308438-da49636d411c.jpeg',
			secondaryImages: [
				{ src: '/samples/pothole-severe.jpg', label: 'Gutter Spall' },
				{ src: '/uploads/1792497053187-c0f0987e311e.jpeg', label: 'Trench Line' },
				{ src: '/uploads/1792589063756-8b8a8dcd0e4e.jpeg', label: 'Approach Angle' }
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
			id: 'REP-9032',
			title: 'Sunken Crosswalk Utility Trench near Elementary School',
			location: 'Quezon Ave – Bubukal Student Corridor, Santa Cruz',
			corridorName: 'Quezon Avenue Corridor',
			corridorId: 'CORR-03',
			coordinatesString: '14.2690° N, 121.4021° E',
			latitude: 14.2690,
			longitude: 121.4021,
			severity: 8.9,
			vruRisk: 'CRITICAL',
			astmCode: 'ASTM D6433 (Utility Cut Depression)',
			depthEstimate: '52mm transverse trench',
			safetyTags: ['VRU CRITICAL 8.9/10', 'School Zone Danger', 'Tricycle Alert', 'Rim Catch Hazard'],
			description: 'Uncompacted transverse water utility trench intersecting the pedestrian school crosswalk. Causes sudden steering jerk for e-trikes and scooters carrying elementary students during morning peak.',
			author: {
				name: 'Ria Santos',
				handle: '@ria_commutes',
				roleTag: 'Student Mobility Coordinator',
				avatarInitials: 'RS',
				isVerified: true
			},
			timeAgo: '1h 10m ago',
			mainImage: '/uploads/pothole-pre-repair.jpg',
			secondaryImages: [
				{ src: '/uploads/patch-post-repair.jpg', label: 'Crosswalk Alignment' },
				{ src: '/samples/pothole-severe.jpg', label: 'Trench Depth Lip' }
			],
			totalPhotosCount: 3,
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
				{ src: '/uploads/1792498062533-be2a7a728e3e.jpeg', label: 'Aggregate Dispersion' },
				{ src: '/uploads/1792589063756-8b8a8dcd0e4e.jpeg', label: 'Market Corner View' }
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
			mainImage: '/uploads/1792589063756-8b8a8dcd0e4e.jpeg',
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

	// Filtered Social Stream Posts
	const filteredPosts = $derived(
		posts.filter((post) => {
			let matchesTab = true;
			if (feedTab === 'CRITICAL_VRU') {
				matchesTab = post.severity >= 8.0;
			} else if (feedTab === 'TRICYCLE_CORRIDORS') {
				matchesTab = post.isTricycleCorridor;
			} else if (feedTab === 'RECENTLY_VERIFIED') {
				matchesTab = post.confirmations >= 25 || post.timeAgo.includes('m ago');
			}

			const query = feedSearch.trim().toLowerCase();
			const matchesQuery =
				!query ||
				post.title.toLowerCase().includes(query) ||
				post.location.toLowerCase().includes(query) ||
				post.astmCode.toLowerCase().includes(query) ||
				post.author.name.toLowerCase().includes(query) ||
				post.author.handle.toLowerCase().includes(query);

			return matchesTab && matchesQuery;
		})
	);

	// Currently Active Defect in Radar
	const activePost = $derived(
		posts.find((p) => p.id === activeHazardId) || null
	);

	// Filtered Guardians Leaderboard
	const filteredGuardians = $derived(
		guardians.filter((g) => {
			const query = leaderboardSearch.trim().toLowerCase();
			return (
				!query ||
				g.name.toLowerCase().includes(query) ||
				g.handle.toLowerCase().includes(query) ||
				g.topCorridor.toLowerCase().includes(query) ||
				g.badgeName.toLowerCase().includes(query)
			);
		})
	);

	// Tab counts for quick metrics
	const counts = $derived({
		all: posts.length,
		critical: posts.filter((p) => p.severity >= 8.0).length,
		tricycle: posts.filter((p) => p.isTricycleCorridor).length,
		verified: posts.filter((p) => p.confirmations >= 25 || p.timeAgo.includes('m ago')).length
	});

	// Toast notification trigger
	function showToast(msg: string) {
		if (toastTimer) clearTimeout(toastTimer);
		toastMessage = msg;
		toastTimer = setTimeout(() => {
			toastMessage = null;
		}, 3000);
	}

	// Interactive Upvote Handler: '+1 Confirmed'
	function toggleConfirm(postId: string) {
		const post = posts.find((p) => p.id === postId);
		if (!post) return;

		post.userConfirmed = !post.userConfirmed;
		if (post.userConfirmed) {
			post.confirmations += 1;
			personalUpvotesGiven += 1;
			personalScore += 10;
			if (post.confirmations >= 5 && !post.escalatedToDpwh) {
				post.escalatedToDpwh = true;
				post.crewAssigned = 'Crew Alpha (Cold-Patch Squad)';
			}
			showToast(`Confirmed! +10 Civic Telemetry added to your Laguna Guardian profile.`);
		} else {
			post.confirmations = Math.max(0, post.confirmations - 1);
			personalUpvotesGiven = Math.max(0, personalUpvotesGiven - 1);
			personalScore = Math.max(0, personalScore - 10);
		}
	}

	// Toggle inline comments expansion
	function toggleComments(postId: string) {
		const post = posts.find((p) => p.id === postId);
		if (post) {
			post.showComments = !post.showComments;
		}
	}

	// Add new inline comment
	function handleAddComment(postId: string) {
		const text = (newCommentInput[postId] || '').trim();
		if (!text) return;

		const post = posts.find((p) => p.id === postId);
		if (!post) return;

		const newComment: CommunityComment = {
			id: 'cmt-' + Date.now(),
			author: 'Juan Dela Cruz (You)',
			handle: '@juan_guardian',
			role: 'Verified Barangay Citizen Sentinel',
			avatarInitials: 'JD',
			timeAgo: 'Just now',
			text
		};

		post.comments.push(newComment);
		newCommentInput[postId] = '';
		post.showComments = true;
		showToast('Comment submitted to civil community thread.');
	}

	// Copy post permalink
	function copyPostShare(postId: string) {
		copiedPostId = postId;
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(`${window.location.origin}/community#${postId}`);
		}
		showToast(`Permalink copied to clipboard: #${postId}`);
		setTimeout(() => {
			if (copiedPostId === postId) copiedPostId = null;
		}, 2500);
	}

	// Copy GPS coordinates
	function copyGps(lat: number, lng: number) {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
		}
		openMenuPostId = null;
		showToast(`GPS coordinates copied: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
	}

	// Copy Defect ID
	function copyPostId(id: string) {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(id);
		}
		openMenuPostId = null;
		showToast(`Ticket ${id} copied to clipboard.`);
	}

	// Flag post as duplicate or inaccurate
	function flagPost(postId: string) {
		openMenuPostId = null;
		showToast(`Defect ${postId} flagged for DPWH civil auditor re-inspection.`);
	}

	// Lightbox actions
	function openLightbox(post: SocialHazardPost, initialIndex: number = 0) {
		const allImages = [
			{ src: post.mainImage, label: 'Primary Field Photo' },
			...post.secondaryImages
		];
		lightbox = {
			isOpen: true,
			images: allImages,
			currentIndex: Math.min(initialIndex, allImages.length - 1),
			title: post.title,
			astmCode: post.astmCode,
			depth: post.depthEstimate,
			severity: post.severity,
			location: post.location
		};
	}

	function closeLightbox() {
		lightbox.isOpen = false;
	}

	function nextLightboxImage() {
		if (lightbox.images.length === 0) return;
		lightbox.currentIndex = (lightbox.currentIndex + 1) % lightbox.images.length;
	}

	function prevLightboxImage() {
		if (lightbox.images.length === 0) return;
		lightbox.currentIndex = (lightbox.currentIndex - 1 + lightbox.images.length) % lightbox.images.length;
	}

	// Leaflet Map Interactivity
	function updateTileLayer() {
		if (!mapInstance || !leafletLib) return;
		if (tileLayerInstance) {
			mapInstance.removeLayer(tileLayerInstance);
			tileLayerInstance = null;
		}

		tileLayerInstance = leafletLib.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19,
			subdomains: ['a', 'b', 'c']
		}).addTo(mapInstance);
	}

	function renderCorridors() {
		if (!mapInstance || !leafletLib || !corridorsGroup) return;
		corridorsGroup.clearLayers();

		SANTA_CRUZ_CORRIDORS.forEach((corridor) => {
			const polyline = leafletLib.polyline(corridor.coordinates, {
				color: corridor.color,
				weight: 4,
				opacity: 0.75,
				dashArray: corridor.dashArray,
				lineCap: 'round',
				lineJoin: 'round'
			});

			polyline.bindTooltip(`
				<div class="text-[11px] font-mono leading-tight">
					<strong style="color: ${corridor.color}">${corridor.name}</strong><br/>
					<span>PCI: ${corridor.pci}/100 • ${corridor.status}</span>
				</div>
			`, { sticky: true, className: 'surios-radar-tooltip' });

			polyline.addTo(corridorsGroup);
		});
	}

	function renderMarkers() {
		if (!mapInstance || !leafletLib || !markersGroup) return;
		markersGroup.clearLayers();
		markerMap.clear();

		filteredPosts.forEach((post) => {
			const isCritical = post.severity >= 8.0;
			const isSelected = activeHazardId === post.id;
			const color = isCritical ? '#ef4444' : post.severity >= 6.0 ? '#f59e0b' : '#64748b';

			const customIcon = leafletLib.divIcon({
				className: 'surios-radar-marker-container',
				html: `
					<div class="radar-squircle-node ${isSelected ? 'is-active' : ''} ${isCritical ? 'is-critical' : ''}" data-id="${post.id}">
						${isCritical ? '<div class="radar-ping-ring"></div>' : ''}
						<div class="radar-squircle-box" style="background-color: ${color}">
							<span>${post.severity.toFixed(1)}</span>
						</div>
					</div>
				`,
				iconSize: [32, 32],
				iconAnchor: [16, 16]
			});

			const marker = leafletLib.marker([post.latitude, post.longitude], {
				icon: customIcon,
				title: post.title,
				zIndexOffset: isSelected ? 1000 : isCritical ? 500 : 100
			});

			marker.on('click', () => {
				selectPostFromMap(post.id);
			});

			const popupHtml = `
				<div class="surios-radar-card-popup">
					<div class="flex items-center justify-between gap-2 border-b border-border/40 pb-1 mb-1">
						<span class="font-mono text-[10px] text-muted-foreground font-bold">${post.id}</span>
						<span class="text-[9px] font-mono px-1 py-0.5 rounded text-white font-bold" style="background-color: ${color}">
							VRU ${post.severity.toFixed(1)}/10
						</span>
					</div>
					<h4 class="font-bold text-xs text-foreground leading-snug">${post.title}</h4>
					<p class="text-[11px] text-muted-foreground mt-0.5">${post.location}</p>
					<div class="text-[10px] font-mono text-primary font-semibold mt-1">${post.astmCode}</div>
					<div class="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between gap-2">
						<button class="radar-scroll-btn text-[10px] font-medium text-primary hover:underline" data-id="${post.id}">
							Scroll to Post &darr;
						</button>
						<a href="/?incident=${post.id}" class="text-[10px] font-mono text-muted-foreground hover:text-foreground">
							GIS Map &rarr;
						</a>
					</div>
				</div>
			`;

			marker.bindPopup(popupHtml, {
				className: 'surios-radar-leaflet-popup',
				closeButton: false,
				offset: [0, -10]
			});

			marker.addTo(markersGroup);
			markerMap.set(post.id, marker);
		});
	}

	// Smoothly fly right-side map to post GPS coordinates and highlight
	function focusHazard(hazardId: string, shouldFly: boolean = true) {
		activeHazardId = hazardId;
		const post = posts.find((p) => p.id === hazardId);
		if (!post || !mapInstance || !leafletLib) return;

		if (shouldFly) {
			mapInstance.flyTo([post.latitude, post.longitude], 16, {
				duration: 0.8,
				easeLinearity: 0.25
			});
		}

		renderMarkers();

		const marker = markerMap.get(hazardId);
		if (marker) {
			marker.openPopup();
		}
	}

	// Clicking map pin smoothly scrolls left-side feed to post card
	function selectPostFromMap(hazardId: string) {
		activeHazardId = hazardId;
		renderMarkers();

		const element = document.getElementById(`post-${hazardId}`);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'center' });
			highlightedPostId = hazardId;
			setTimeout(() => {
				if (highlightedPostId === hazardId) highlightedPostId = null;
			}, 2500);
		}
	}

	function resetRadarView() {
		activeHazardId = null;
		if (mapInstance && leafletLib) {
			mapInstance.setView([14.2813, 121.4173], 14, { animate: true });
			renderMarkers();
		}
	}

	// Leaflet dynamic mount & theme sync
	$effect(() => {
		if (typeof window === 'undefined' || !mapContainer) return;

		isDarkMode = document.documentElement.classList.contains('dark');

		const observer = new MutationObserver(() => {
			const dark = document.documentElement.classList.contains('dark');
			if (dark !== isDarkMode) {
				isDarkMode = dark;
				updateTileLayer();
				renderCorridors();
				renderMarkers();
			}
		});

		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

		import('leaflet').then((L) => {
			if (!mapContainer) return;
			leafletLib = L;

			mapInstance = L.map(mapContainer, {
				center: [14.2813, 121.4173],
				zoom: 14,
				minZoom: 12,
				maxZoom: 19,
				zoomControl: false
			});

			L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

			updateTileLayer();

			corridorsGroup = L.featureGroup().addTo(mapInstance);
			markersGroup = L.featureGroup().addTo(mapInstance);

			renderCorridors();
			renderMarkers();

			// Auto focus first critical defect
			const firstCrit = posts.find((p) => p.severity >= 8.0);
			if (firstCrit) {
				activeHazardId = firstCrit.id;
				setTimeout(() => {
					focusHazard(firstCrit.id, false);
				}, 400);
			}

			// Delegate popup scroll button clicks
			mapInstance.on('popupopen', (e: any) => {
				const el = e.popup.getElement();
				if (!el) return;
				const btn = el.querySelector('.radar-scroll-btn');
				if (btn) {
					btn.addEventListener('click', () => {
						const id = btn.getAttribute('data-id');
						if (id) selectPostFromMap(id);
					});
				}
			});
		});

		return () => {
			observer.disconnect();
			if (mapInstance) {
				mapInstance.remove();
				mapInstance = null;
			}
		};
	});

	// Re-render markers if filter changes
	$effect(() => {
		if (mapInstance && leafletLib && markersGroup) {
			renderMarkers();
		}
	});

	function getVruBadgeClass(risk: SocialHazardPost['vruRisk']): string {
		switch (risk) {
			case 'CRITICAL':
				return 'bg-destructive/15 text-destructive border-destructive/30 font-semibold';
			case 'HIGH':
				return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold';
			case 'MODERATE':
				return 'bg-secondary text-foreground border-border';
			case 'LOW':
				return 'bg-muted text-muted-foreground border-border';
			default:
				return 'bg-secondary text-foreground border-border';
		}
	}
</script>

<svelte:window
	onclick={() => (openMenuPostId = null)}
	onkeydown={(e) => {
		if (!lightbox.isOpen) return;
		if (e.key === 'Escape') closeLightbox();
		if (e.key === 'ArrowRight') nextLightboxImage();
		if (e.key === 'ArrowLeft') prevLightboxImage();
	}}
/>

<svelte:head>
	<title>Civic Social Stream & Radar Map — Santa Cruz, Laguna — SuriOS</title>
</svelte:head>

<div class="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8 py-5 space-y-6 font-sans">
	<!-- Top Navigation Bar & Civic Action Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
		<div class="space-y-1">
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant="outline" class="text-xs font-mono border-primary text-primary bg-primary/5">
					Option 2: Civic Social Stream & Live Radar
				</Badge>
				<span class="text-xs text-muted-foreground font-mono">Santa Cruz, Laguna • SDG 9 / SDG 11</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
				<AwardIcon class="h-6 w-6 text-primary shrink-0" />
				Laguna Road Guardians Social Stream
			</h1>
			<p class="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
				Crowdsourced road hazard consensus, two-wheeler accident triage, and synchronized live GIS radar mapping.
			</p>
		</div>

		<!-- Action Buttons: Report Defect & Leaderboard Pill -->
		<div class="flex flex-wrap items-center gap-2.5">
			<Button
				variant="outline"
				class="text-xs h-9 border-border gap-1.5 shadow-none"
				onclick={() => (showGuardiansDrawer = !showGuardiansDrawer)}
			>
				<TrophyIcon class="h-3.5 w-3.5 text-primary" />
				<span>Top Guardians & Telemetry</span>
				{#if showGuardiansDrawer}
					<ChevronUpIcon class="h-3.5 w-3.5 text-muted-foreground" />
				{:else}
					<ChevronDownIcon class="h-3.5 w-3.5 text-muted-foreground" />
				{/if}
			</Button>

			<a href="/report" class="inline-flex">
				<Button class="text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-none">
					<CameraIcon class="h-3.5 w-3.5" />
					<span>Report Road Hazard</span>
				</Button>
			</a>

			<a href="/" class="inline-flex">
				<Button variant="outline" class="text-xs h-9 border-border gap-1.5 shadow-none">
					<NavigationIcon class="h-3.5 w-3.5 text-primary" />
					<span>Full GIS</span>
					<ArrowUpRightIcon class="h-3.5 w-3.5 text-muted-foreground" />
				</Button>
			</a>
		</div>
	</div>

	<!-- Expandable Section: Top Laguna Road Guardians & Personal Telemetry -->
	{#if showGuardiansDrawer}
		<div class="border border-border bg-card rounded-xl p-5 space-y-6 shadow-none animate-in slide-in-from-top-2 duration-200">
			<!-- Personal Citizen Impact Counter Grid (Required 3 Metrics) -->
			<div class="space-y-3">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
					<div>
						<div class="flex items-center gap-2">
							<Badge variant="outline" class="text-[10px] font-mono border-border">
								Personal Telemetry
							</Badge>
							<span class="text-xs text-muted-foreground">Citizen Impact Profile: Juan Dela Cruz</span>
						</div>
						<h3 class="text-base font-bold text-foreground mt-0.5 flex items-center gap-1.5">
							<ShieldCheckIcon class="h-4 w-4 text-primary" />
							Your Civic Infrastructure Impact
						</h3>
					</div>
					<div class="flex items-center gap-2 text-xs font-mono">
						<Badge variant="secondary" class="border-border text-foreground">
							Rank #12 • Active Sentinel
						</Badge>
						<span class="text-primary font-bold">{personalScore} pts</span>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
					<!-- Metric 1: '3 Verified Submissions' -->
					<Card class="border border-border bg-secondary/15 shadow-none">
						<CardHeader class="pb-2">
							<div class="flex items-center justify-between">
								<CardDescription class="text-xs font-medium text-muted-foreground">Field Submissions</CardDescription>
								<CheckCircleIcon class="h-4 w-4 text-primary" />
							</div>
							<CardTitle class="text-2xl font-bold tracking-tight text-foreground font-mono">
								{verifiedSubmissionsCount} <span class="text-xs font-normal text-muted-foreground">Verified Submissions</span>
							</CardTitle>
						</CardHeader>
						<CardContent class="text-xs text-muted-foreground pt-0">
							<p class="text-foreground font-medium text-[11px]">100% Gemini AI Civil Audit Pass Rate</p>
							<p class="text-[11px] leading-relaxed">
								Pedro Guevara Ave and Aguinaldo St defect verifications passed without spam rejection.
							</p>
						</CardContent>
					</Card>

					<!-- Metric 2: '14 Motorcycle Accidents Prevented' -->
					<Card class="border border-border bg-secondary/15 shadow-none">
						<CardHeader class="pb-2">
							<div class="flex items-center justify-between">
								<CardDescription class="text-xs font-medium text-muted-foreground">Two-Wheeler Safety Impact</CardDescription>
								<BikeIcon class="h-4 w-4 text-primary" />
							</div>
							<CardTitle class="text-2xl font-bold tracking-tight text-foreground font-mono">
								{accidentsPreventedCount} <span class="text-xs font-normal text-muted-foreground">Motorcycle Accidents Prevented</span>
							</CardTitle>
						</CardHeader>
						<CardContent class="text-xs text-muted-foreground pt-0">
							<p class="text-foreground font-medium text-[11px]">High-Risk VRU Pothole Profiling</p>
							<p class="text-[11px] leading-relaxed">
								Eliminated severe rim strike and loss-of-control hazards for tricycles and commuter riders.
							</p>
						</CardContent>
					</Card>

					<!-- Metric 3: '₱84,000 Pavement Damage Averted' -->
					<Card class="border border-border bg-secondary/15 shadow-none">
						<CardHeader class="pb-2">
							<div class="flex items-center justify-between">
								<CardDescription class="text-xs font-medium text-muted-foreground">LGU Budget Preservation</CardDescription>
								<CoinsIcon class="h-4 w-4 text-primary" />
							</div>
							<CardTitle class="text-2xl font-bold tracking-tight text-foreground font-mono">
								₱{damageAvertedPesos.toLocaleString()} <span class="text-xs font-normal text-muted-foreground">Pavement Damage Averted</span>
							</CardTitle>
						</CardHeader>
						<CardContent class="text-xs text-muted-foreground pt-0">
							<p class="text-foreground font-medium text-[11px]">Preventative Maintenance Economics</p>
							<p class="text-[11px] leading-relaxed">
								Calculated via early cold-patching (₱1,500/m²) vs structural subgrade base reconstruction (₱15,000/m²).
							</p>
						</CardContent>
					</Card>
				</div>
			</div>

			<!-- Top Laguna Road Guardians Table -->
			<div class="space-y-3">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h3 class="text-base font-bold text-foreground flex items-center gap-1.5">
							<TrophyIcon class="h-4 w-4 text-primary" />
							Top Laguna Road Guardians Leaderboard
						</h3>
						<p class="text-xs text-muted-foreground">ASTM D6433 Certified Citizen Reporters for Santa Cruz</p>
					</div>

					<div class="flex items-center gap-2">
						<div class="relative w-48">
							<SearchIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Search guardian..."
								class="text-xs pl-8 h-8 bg-background border-border shadow-none"
								bind:value={leaderboardSearch}
							/>
						</div>
						<div class="flex items-center gap-1">
							<Button
								variant={leaderboardTab === 'ALL_TIME' ? 'default' : 'outline'}
								size="sm"
								class="text-xs h-8 px-2 shadow-none"
								onclick={() => (leaderboardTab = 'ALL_TIME')}
							>
								All-Time
							</Button>
							<Button
								variant={leaderboardTab === 'THIS_MONTH' ? 'default' : 'outline'}
								size="sm"
								class="text-xs h-8 px-2 shadow-none"
								onclick={() => (leaderboardTab = 'THIS_MONTH')}
							>
								This Month
							</Button>
						</div>
					</div>
				</div>

				<div class="border border-border rounded-lg overflow-x-auto bg-background">
					<table class="w-full text-left border-collapse text-xs">
						<thead>
							<tr class="border-b border-border bg-secondary/40 font-mono text-[10px] text-muted-foreground">
								<th class="py-2 px-3 font-normal">RANK</th>
								<th class="py-2 px-3 font-normal">ROAD GUARDIAN</th>
								<th class="py-2 px-3 font-normal">HONOR BADGE</th>
								<th class="py-2 px-3 font-normal text-right">REPORTS</th>
								<th class="py-2 px-3 font-normal text-right">ACCIDENTS AVERTED</th>
								<th class="py-2 px-3 font-normal text-right">HAZARD SCORE</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each filteredGuardians as guardian}
								<tr class="hover:bg-secondary/20 transition-colors {guardian.isCurrentUser ? 'bg-primary/5 font-medium' : ''}">
									<td class="py-2.5 px-3 font-mono">
										{#if guardian.rank === 1}
											<span class="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/30">
												1
											</span>
										{:else if guardian.rank === 2}
											<span class="inline-flex items-center justify-center w-5 h-5 rounded bg-secondary text-foreground font-bold text-xs border border-border">
												2
											</span>
										{:else if guardian.rank === 3}
											<span class="inline-flex items-center justify-center w-5 h-5 rounded bg-secondary text-foreground font-bold text-xs border border-border">
												3
											</span>
										{:else}
											<span class="text-muted-foreground pl-1 font-mono">#{guardian.rank}</span>
										{/if}
									</td>
									<td class="py-2.5 px-3">
										<div class="flex items-center gap-2">
											<div class="w-6 h-6 rounded bg-secondary border border-border flex items-center justify-center font-bold text-[10px] text-foreground shrink-0">
												{guardian.name.slice(0, 2).toUpperCase()}
											</div>
											<div class="space-y-0.5">
												<div class="font-bold text-foreground flex items-center gap-1.5">
													<span>{guardian.name}</span>
													{#if guardian.isCurrentUser}
														<Badge variant="outline" class="text-[9px] py-0 px-1 border-primary text-primary">
															YOU
														</Badge>
													{/if}
												</div>
												<div class="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
													<span>{guardian.handle}</span>
													<span>•</span>
													<span class="truncate max-w-[180px]">{guardian.topCorridor}</span>
												</div>
											</div>
										</div>
									</td>
									<td class="py-2.5 px-3">
										<Badge variant="outline" class="text-[9px] font-mono {guardian.rank === 1 ? 'border-primary text-primary bg-primary/10' : 'border-border'}">
											{guardian.badgeName}
										</Badge>
									</td>
									<td class="py-2.5 px-3 text-right font-mono text-foreground">
										{guardian.verifiedReports} <span class="text-[10px] text-muted-foreground">({guardian.accuracyRate}%)</span>
									</td>
									<td class="py-2.5 px-3 text-right font-mono text-foreground">
										{guardian.preventedAccidents}
									</td>
									<td class="py-2.5 px-3 text-right font-mono font-bold text-primary">
										{guardian.hazardScore} pts
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	<!-- Section: Feed Filter Tabs & Search Controls -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
		<!-- Category Filter Tabs -->
		<div class="flex flex-wrap items-center gap-1">
			<Button
				variant={feedTab === 'ALL' ? 'default' : 'outline'}
				size="sm"
				class="text-xs h-8 px-3 shadow-none gap-1.5"
				onclick={() => (feedTab = 'ALL')}
			>
				<span>All Hazards</span>
				<Badge variant={feedTab === 'ALL' ? 'secondary' : 'outline'} class="h-4 px-1 text-[10px] font-mono">
					{counts.all}
				</Badge>
			</Button>

			<Button
				variant={feedTab === 'CRITICAL_VRU' ? 'default' : 'outline'}
				size="sm"
				class="text-xs h-8 px-3 shadow-none gap-1.5"
				onclick={() => (feedTab = 'CRITICAL_VRU')}
			>
				<span>VRU Critical (8+)</span>
				<Badge variant={feedTab === 'CRITICAL_VRU' ? 'secondary' : 'outline'} class="h-4 px-1 text-[10px] font-mono">
					{counts.critical}
				</Badge>
			</Button>

			<Button
				variant={feedTab === 'TRICYCLE_CORRIDORS' ? 'default' : 'outline'}
				size="sm"
				class="text-xs h-8 px-3 shadow-none gap-1.5"
				onclick={() => (feedTab = 'TRICYCLE_CORRIDORS')}
			>
				<span>Tricycle Corridors</span>
				<Badge variant={feedTab === 'TRICYCLE_CORRIDORS' ? 'secondary' : 'outline'} class="h-4 px-1 text-[10px] font-mono">
					{counts.tricycle}
				</Badge>
			</Button>

			<Button
				variant={feedTab === 'RECENTLY_VERIFIED' ? 'default' : 'outline'}
				size="sm"
				class="text-xs h-8 px-3 shadow-none gap-1.5"
				onclick={() => (feedTab = 'RECENTLY_VERIFIED')}
			>
				<span>Recently Verified</span>
				<Badge variant={feedTab === 'RECENTLY_VERIFIED' ? 'secondary' : 'outline'} class="h-4 px-1 text-[10px] font-mono">
					{counts.verified}
				</Badge>
			</Button>
		</div>

		<!-- Keyword Search Input -->
		<div class="relative w-full sm:w-64">
			<SearchIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search street, defect, or rider..."
				class="text-xs pl-8 h-8 bg-card border-border shadow-none"
				bind:value={feedSearch}
			/>
		</div>
	</div>

	<!-- Option 2 Split-Screen Layout: Left Feed (approx 58-60%) & Right Sticky Live Radar Map (approx 40-42%) -->
	<div class="flex flex-col lg:flex-row gap-6 items-start">
		<!-- LEFT SIDE: Civic Social Feed Stream (approx 58-60% width) -->
		<div class="w-full lg:w-[58%] xl:w-[60%] space-y-5">
			{#if filteredPosts.length === 0}
				<Card class="border border-border bg-card shadow-none p-10 text-center space-y-3">
					<p class="text-base font-semibold text-foreground">No road hazards match this filter.</p>
					<p class="text-xs text-muted-foreground">Try clearing your search query or selecting "All Hazards".</p>
					<Button
						variant="outline"
						size="sm"
						class="text-xs border-border shadow-none"
						onclick={() => {
							feedSearch = '';
							feedTab = 'ALL';
						}}
					>
						Reset Feed Filters
					</Button>
				</Card>
			{:else}
				{#each filteredPosts as post (post.id)}
					<div
						id="post-{post.id}"
						class="rounded-xl border bg-card transition-all duration-200 overflow-hidden {activeHazardId === post.id ? 'border-primary ring-1 ring-primary/40 shadow-sm' : highlightedPostId === post.id ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-foreground/25'}"
						onmouseenter={() => focusHazard(post.id, false)}
						role="article"
					>
						<!-- Post Header -->
						<div class="p-4 sm:p-5 pb-3">
							<div class="flex items-start justify-between gap-3">
								<div class="flex items-center gap-3">
									<!-- Author Avatar Squircle -->
									<div class="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center font-bold text-xs text-foreground font-mono shrink-0 shadow-none">
										{post.author.avatarInitials}
									</div>

									<div class="space-y-0.5">
										<div class="flex items-center gap-2">
											<span class="text-sm font-bold text-foreground">{post.author.name}</span>
											{#if post.author.isVerified}
												<span title="Verified Laguna Road Guardian" class="text-primary flex items-center">
													<CheckCircleIcon class="h-3.5 w-3.5 fill-primary/20" />
												</span>
											{/if}
										</div>

										<div class="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
											<span class="text-primary font-medium">{post.author.roleTag}</span>
											<span>•</span>
											<span class="font-mono">{post.timeAgo}</span>
										</div>
									</div>
								</div>

								<!-- Header Actions & Three-Dots Menu -->
								<div class="relative shrink-0 flex items-center gap-1.5">
									<Button
										variant="ghost"
										size="sm"
										class="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
										onclick={() => focusHazard(post.id, true)}
										title="Focus on right-side live radar map"
									>
										<NavigationIcon class="h-3.5 w-3.5 text-primary" />
										<span class="hidden sm:inline font-mono">Map Pin</span>
									</Button>

									<Button
										variant="ghost"
										size="icon"
										class="h-8 w-8 text-muted-foreground hover:text-foreground"
										title="Options"
										onclick={(e) => {
											e.stopPropagation();
											openMenuPostId = openMenuPostId === post.id ? null : post.id;
										}}
									>
										<EllipsisIcon class="h-4 w-4" />
									</Button>

									<!-- Three-dots Dropdown Popover -->
									{#if openMenuPostId === post.id}
										<div
											role="menu"
											tabindex="-1"
											onkeydown={(e) => { if (e.key === 'Escape') openMenuPostId = null; }}
											class="absolute right-0 top-9 z-50 w-52 rounded-lg border border-border bg-card p-1 shadow-lg text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
											onclick={(e) => e.stopPropagation()}
										>
											<button
												type="button"
												class="w-full text-left px-2.5 py-1.5 rounded hover:bg-secondary flex items-center gap-2 text-foreground"
												onclick={() => copyGps(post.latitude, post.longitude)}
											>
												<CopyIcon class="h-3.5 w-3.5 text-primary" />
												<span>Copy GPS Coordinates</span>
											</button>
											<button
												type="button"
												class="w-full text-left px-2.5 py-1.5 rounded hover:bg-secondary flex items-center gap-2 text-foreground"
												onclick={() => copyPostId(post.id)}
											>
												<CopyIcon class="h-3.5 w-3.5 text-muted-foreground" />
												<span>Copy Ticket ID</span>
											</button>
											<a
												href="/?incident={post.id}"
												class="w-full text-left px-2.5 py-1.5 rounded hover:bg-secondary flex items-center gap-2 text-foreground"
											>
												<ArrowUpRightIcon class="h-3.5 w-3.5 text-primary" />
												<span>Inspect on Full GIS Map</span>
											</a>
											<Separator class="my-1" />
											<button
												type="button"
												class="w-full text-left px-2.5 py-1.5 rounded hover:bg-destructive/10 text-destructive flex items-center gap-2"
												onclick={() => flagPost(post.id)}
											>
												<FlagIcon class="h-3.5 w-3.5" />
												<span>Report Duplicate / Inaccurate</span>
											</button>
										</div>
									{/if}
								</div>
							</div>
						</div>

						<!-- Media Gallery with Thumbnail Stack & Mini-Map Slot (Matching User Mockup) -->
						<div class="px-4 sm:px-5 pb-3">
							<!-- Desktop / Tablet 2-Column Split for Media -->
							<div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
								<!-- Main Prominent Header Image (approx 68% / 8 cols) -->
								<button
									type="button"
									class="sm:col-span-8 relative rounded-lg overflow-hidden border border-border bg-muted cursor-pointer group text-left p-0"
									onclick={() => openLightbox(post, 0)}
									title="Click to view full photo"
								>
									<img
										src={post.mainImage}
										alt={post.title}
										class="w-full h-56 sm:h-64 object-cover group-hover:scale-102 transition-transform duration-300"
									/>
									<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
										<span class="text-[11px] font-mono text-white flex items-center gap-1">
											<Maximize2Icon class="h-3.5 w-3.5" />
											Inspect Full Defect Photo
										</span>
									</div>
									<div class="absolute top-2 left-2 flex items-center gap-1.5">
										<Badge variant="outline" class="text-[10px] font-mono bg-black/70 text-white border-white/20">
											{post.astmCode}
										</Badge>
									</div>
									<div class="absolute bottom-2 right-2">
										<Badge variant="outline" class="text-[10px] font-mono bg-black/70 text-amber-400 border-amber-500/40">
											{post.depthEstimate}
										</Badge>
									</div>
								</button>

								<!-- Secondary Thumbnail Stack & 3rd Slot Mini-Map (approx 32% / 4 cols) -->
								<div class="sm:col-span-4 grid grid-cols-3 sm:grid-cols-1 gap-2">
									<!-- Slot 1: Secondary angle / ruler measurement photo -->
									<button
										type="button"
										class="relative h-20 rounded-lg overflow-hidden border border-border bg-muted cursor-pointer group text-left p-0"
										onclick={() => openLightbox(post, 1)}
										title="Secondary Angle / Measurement"
									>
										<img
											src={post.secondaryImages[0]?.src || post.mainImage}
											alt="Secondary Angle"
											class="w-full h-full object-cover group-hover:scale-105 transition-transform"
										/>
										<div class="absolute bottom-1 left-1.5 text-[9px] font-mono px-1 py-0.5 rounded bg-black/75 text-white truncate max-w-[90%]">
											{post.secondaryImages[0]?.label || 'Profile'}
										</div>
									</button>

									<!-- Slot 2: Multi-image thumbnail with darker overlay (+3 more) -->
									<button
										type="button"
										class="relative h-20 rounded-lg overflow-hidden border border-border bg-muted cursor-pointer group text-left p-0"
										onclick={() => openLightbox(post, 2)}
										title="View all {post.totalPhotosCount} photos"
									>
										<img
											src={post.secondaryImages[1]?.src || post.mainImage}
											alt="Additional angle"
											class="w-full h-full object-cover"
										/>
										<div class="absolute inset-0 bg-black/65 group-hover:bg-black/55 transition-colors flex flex-col items-center justify-center text-white font-mono">
											<span class="text-xs font-bold">+{post.totalPhotosCount - 2} more</span>
											<span class="text-[9px] text-white/80">photos</span>
										</div>
									</button>

									<!-- Slot 3: Compact embedded vector Mini-Map card -->
									<button
										type="button"
										class="relative h-20 rounded-lg border border-border bg-secondary/30 hover:border-primary hover:bg-primary/5 p-2 flex flex-col justify-between text-left transition-all group overflow-hidden cursor-pointer"
										onclick={() => focusHazard(post.id, true)}
										title="Focus Santa Cruz Live Radar Map on this defect"
									>
										<!-- Background stylized road grid vector -->
										<svg class="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
											<defs>
												<pattern id="road-grid-{post.id}" width="16" height="16" patternUnits="userSpaceOnUse">
													<path d="M 16 0 L 0 0 0 16" fill="none" stroke="currentColor" stroke-width="0.5" />
												</pattern>
											</defs>
											<rect width="100%" height="100%" fill="url(#road-grid-{post.id})" />
											<line x1="0" y1="50" x2="160" y2="20" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
											<line x1="0" y1="50" x2="160" y2="20" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,3" />
											<circle cx="70" cy="35" r="4" fill="#ef4444" />
											<circle cx="70" cy="35" r="8" fill="none" stroke="#ef4444" stroke-width="1" class="animate-ping" opacity="0.6" />
										</svg>

										<div class="relative z-10 flex items-center justify-between">
											<span class="text-[10px] font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1">
												<NavigationIcon class="h-2.5 w-2.5" />
												Radar Pin
											</span>
											<span class="text-[9px] font-mono text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-0.5">
												Focus &rarr;
											</span>
										</div>

										<div class="relative z-10 space-y-0.5">
											<div class="text-[10px] font-semibold text-foreground truncate max-w-[130px]">
												{post.corridorName}
											</div>
											<div class="text-[9px] font-mono text-muted-foreground">
												{post.coordinatesString}
											</div>
										</div>
									</button>
								</div>
							</div>
						</div>

						<!-- Severity & Safety Tags -->
						<div class="px-4 sm:px-5 pb-3 space-y-2">
							<div class="flex flex-wrap items-center gap-1.5">
								<!-- Prominent VRU CRITICAL 8.8/10 squircle badge -->
								<Badge variant="outline" class="text-xs font-mono font-bold {getVruBadgeClass(post.vruRisk)} px-2.5 py-0.5">
									VRU {post.vruRisk} {post.severity.toFixed(1)}/10
								</Badge>

								<Badge variant="outline" class="text-[10px] font-mono border-border text-foreground">
									{post.astmCode}
								</Badge>

								<!-- Commuter Safety Pills -->
								{#each post.safetyTags as tag}
									{#if !tag.startsWith('VRU')}
										<span class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary/80 border border-border text-foreground">
											{#if tag.includes('Tricycle')}
												<BikeIcon class="h-3 w-3 text-primary" />
											{:else if tag.includes('Night')}
												<MoonIcon class="h-3 w-3 text-amber-500" />
											{:else if tag.includes('Flooding')}
												<CloudRainIcon class="h-3 w-3 text-sky-500" />
											{:else if tag.includes('Rim')}
												<TriangleAlertIcon class="h-3 w-3 text-destructive" />
											{/if}
											<span>{tag}</span>
										</span>
									{/if}
								{/each}

								{#if post.escalatedToDpwh}
									<span class="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary text-primary font-bold">
										<TruckIcon class="h-3 w-3" />
										<span>DPWH Dispatched</span>
									</span>
								{/if}
							</div>

							<!-- Title & Detailed Road Context -->
							<h3 class="text-base font-bold text-foreground">
								{post.title}
							</h3>

							<p class="text-xs text-muted-foreground leading-relaxed">
								{post.description}
							</p>

							<div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
								<div class="flex items-center gap-1">
									<MapPinIcon class="h-3.5 w-3.5 text-primary shrink-0" />
									<span class="text-foreground font-medium">{post.location}</span>
								</div>
								<span>•</span>
								<button
									type="button"
									class="font-mono text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
									onclick={() => focusHazard(post.id, true)}
								>
									<span>{post.coordinatesString}</span>
								</button>
								{#if post.crewAssigned}
									<span>•</span>
									<span class="text-xs font-mono text-primary font-medium">{post.crewAssigned}</span>
								{/if}
							</div>
						</div>

						<Separator />

						<!-- Social Action Bar -->
						<div class="px-4 sm:px-5 py-2.5 bg-card/60 flex items-center justify-between gap-3 text-xs">
							<div class="flex items-center gap-2">
								<!-- Interactive '+1 Confirmed (43)' Upvote Button -->
								<Button
									variant={post.userConfirmed ? 'default' : 'outline'}
									size="sm"
									class="text-xs h-8 px-3 gap-1.5 shadow-none transition-all {post.userConfirmed ? 'bg-primary text-primary-foreground font-bold hover:bg-primary/90' : 'border-border hover:border-primary/50'}"
									onclick={() => toggleConfirm(post.id)}
								>
									{#if post.userConfirmed}
										<CheckIcon class="h-3.5 w-3.5" />
										<span>Confirmed ({post.confirmations})</span>
									{:else}
										<ThumbsUpIcon class="h-3.5 w-3.5 text-primary" />
										<span>+1 Confirmed ({post.confirmations})</span>
									{/if}
								</Button>

								<!-- Comments Toggle Button -->
								<Button
									variant={post.showComments ? 'secondary' : 'ghost'}
									size="sm"
									class="text-xs h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground"
									onclick={() => toggleComments(post.id)}
								>
									<MessageSquareIcon class="h-3.5 w-3.5 text-primary" />
									<span>Comments ({post.comments.length})</span>
								</Button>
							</div>

							<!-- Share / Copy Link Button -->
							<Button
								variant="ghost"
								size="sm"
								class="text-xs h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground"
								onclick={() => copyPostShare(post.id)}
								title="Copy post link"
							>
								{#if copiedPostId === post.id}
									<CheckIcon class="h-3.5 w-3.5 text-primary" />
									<span class="text-primary font-medium">Copied!</span>
								{:else}
									<Share2Icon class="h-3.5 w-3.5" />
									<span class="hidden sm:inline">Share</span>
								{/if}
							</Button>
						</div>

						<!-- Inline Community Comments Thread -->
						{#if post.showComments}
							<div class="border-t border-border bg-secondary/10 p-4 sm:p-5 space-y-3 animate-in fade-in duration-150">
								<div class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider flex items-center justify-between">
									<span>Community Consensus & Dispatch Updates ({post.comments.length})</span>
									<span class="text-primary font-medium">Santa Cruz Triage</span>
								</div>

								<!-- Comment List -->
								<div class="space-y-2.5">
									{#each post.comments as comment (comment.id)}
										<div class="flex items-start gap-2.5 text-xs bg-background/80 p-2.5 rounded-lg border border-border">
											<div class="w-6 h-6 rounded bg-secondary border border-border flex items-center justify-center font-bold text-[10px] text-foreground font-mono shrink-0">
												{comment.avatarInitials}
											</div>
											<div class="flex-1 space-y-1">
												<div class="flex flex-wrap items-center justify-between gap-1">
													<div class="flex items-center gap-1.5">
														<span class="font-bold text-foreground">{comment.author}</span>
														{#if comment.isOfficial}
															<Badge variant="outline" class="text-[9px] font-mono border-primary text-primary bg-primary/10">
																{comment.officialBadge || 'Official'}
															</Badge>
														{/if}
													</div>
													<span class="text-[10px] text-muted-foreground font-mono">{comment.timeAgo}</span>
												</div>
												<p class="text-xs text-foreground/90 leading-relaxed">
													{comment.text}
												</p>
											</div>
										</div>
									{/each}
								</div>

								<!-- Real-time Comment Input Box -->
								<form
									onsubmit={(e) => {
										e.preventDefault();
										handleAddComment(post.id);
									}}
									class="flex items-center gap-2 pt-1"
								>
									<Input
										type="text"
										placeholder="Add community observation or road condition update..."
										class="text-xs h-8.5 bg-background border-border shadow-none"
										bind:value={newCommentInput[post.id]}
									/>
									<Button
										type="submit"
										size="sm"
										class="h-8.5 px-3 bg-primary text-primary-foreground hover:bg-primary/90 text-xs shrink-0 shadow-none gap-1"
									>
										<SendIcon class="h-3 w-3" />
										<span class="hidden sm:inline">Post</span>
									</Button>
								</form>
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<!-- RIGHT SIDE: Sticky Live Radar Map of Santa Cruz, Laguna (approx 40-42% width) -->
		<div class="w-full lg:w-[42%] xl:w-[40%] lg:sticky lg:top-4 lg:h-[calc(100vh-3.5rem)] shrink-0">
			<div class="w-full h-[450px] lg:h-full rounded-xl border border-border bg-card overflow-hidden flex flex-col shadow-none relative">
				<!-- Radar Map Header Bar -->
				<div class="h-12 px-3.5 border-b border-border bg-card/95 backdrop-blur flex items-center justify-between shrink-0">
					<div class="flex items-center gap-2">
						<span class="relative flex h-2.5 w-2.5">
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
							<span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
						</span>
						<span class="font-bold text-xs tracking-tight text-foreground font-mono">
							SANTA CRUZ GIS RADAR
						</span>
						<Badge variant="outline" class="text-[9px] font-mono border-border text-muted-foreground">
							{filteredPosts.length} Pins
						</Badge>
					</div>

					<div class="flex items-center gap-1.5">
						<Button
							variant="ghost"
							size="sm"
							class="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
							onclick={resetRadarView}
							title="Reset Radar View"
						>
							<RotateCcwIcon class="h-3 w-3" />
							<span class="font-mono">Reset</span>
						</Button>

						<a
							href="/?incident={activeHazardId || ''}"
							class="inline-flex"
							title="Open full interactive GIS map"
						>
							<Button variant="outline" size="sm" class="h-7 px-2 text-[11px] border-border gap-1 font-mono">
								<span>Full View</span>
								<ArrowUpRightIcon class="h-3 w-3 text-primary" />
							</Button>
						</a>
					</div>
				</div>

				<!-- Leaflet Radar Canvas Container -->
				<div
					bind:this={mapContainer}
					class="w-full flex-1 relative surios-radar-map {isDarkMode ? 'surios-dark-map is-osm' : 'surios-light-map is-osm'}"
				></div>

				<!-- Radar Bottom Inspection HUD Overlay -->
				{#if activePost}
					<div class="absolute bottom-3 left-3 right-3 z-[1000] bg-card/95 backdrop-blur border border-border rounded-xl p-3 shadow-md space-y-2 animate-in slide-in-from-bottom-2 duration-150">
						<div class="flex items-start justify-between gap-2">
							<div class="space-y-0.5">
								<div class="flex items-center gap-2">
									<span class="text-[10px] font-mono font-bold text-primary">{activePost.id}</span>
									<Badge variant="outline" class="text-[9px] font-mono {getVruBadgeClass(activePost.vruRisk)}">
										VRU {activePost.severity.toFixed(1)}/10
									</Badge>
									<span class="text-[10px] text-muted-foreground font-mono">{activePost.coordinatesString}</span>
								</div>
								<h4 class="text-xs font-bold text-foreground line-clamp-1">{activePost.title}</h4>
								<p class="text-[11px] text-muted-foreground line-clamp-1">{activePost.location}</p>
							</div>
							<button
								type="button"
								class="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
								onclick={() => (activeHazardId = null)}
								title="Dismiss inspector"
							>
								<XIcon class="h-3.5 w-3.5" />
							</button>
						</div>

						<div class="flex items-center justify-between gap-2 pt-1 border-t border-border/50 text-[11px]">
							<Button
								variant="outline"
								size="sm"
								class="h-7 text-xs border-border gap-1 font-mono"
								onclick={() => selectPostFromMap(activePost.id)}
							>
								<span>Scroll to Post</span>
								<ChevronDownIcon class="h-3 w-3" />
							</Button>
							<a
								href="/?incident={activePost.id}"
								class="text-xs font-mono text-primary hover:underline flex items-center gap-1 font-medium"
							>
								<span>Open GIS Dispatch Canvas</span>
								<ArrowUpRightIcon class="h-3 w-3" />
							</a>
						</div>
					</div>
				{:else}
					<div class="absolute bottom-3 left-3 right-3 z-[1000] bg-card/90 backdrop-blur border border-border/80 rounded-xl px-3 py-2 shadow-sm flex items-center justify-between text-[11px] text-muted-foreground pointer-events-none">
						<span class="flex items-center gap-1.5 font-mono">
							<span class="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
							Radar Tracking Active
						</span>
						<span class="text-[10px]">Hover any post card to pan coordinates</span>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Image Lightbox Modal -->
{#if lightbox.isOpen}
	<div
		class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
		role="dialog"
		aria-modal="true"
	>
		<!-- Lightbox Top Navigation Bar -->
		<div class="w-full max-w-5xl flex items-center justify-between text-white pb-3 border-b border-white/10">
			<div class="space-y-0.5">
				<div class="flex items-center gap-2">
					<span class="text-xs font-mono font-bold text-amber-400">{lightbox.astmCode}</span>
					<span class="text-xs text-white/60">•</span>
					<span class="text-xs text-white/80 font-mono">Depth: {lightbox.depth}</span>
					<span class="text-xs text-white/60">•</span>
					<Badge variant="outline" class="text-[10px] font-mono border-white/20 text-white">
						VRU Severity: {lightbox.severity.toFixed(1)}/10
					</Badge>
				</div>
				<h3 class="text-sm sm:text-base font-bold text-white truncate max-w-xl">{lightbox.title}</h3>
				<p class="text-xs text-white/60">{lightbox.location}</p>
			</div>

			<div class="flex items-center gap-2">
				<span class="text-xs font-mono text-white/60 mr-2">
					{lightbox.currentIndex + 1} / {lightbox.images.length}
				</span>
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 text-white hover:bg-white/10 rounded-full"
					onclick={closeLightbox}
					title="Close Lightbox (Esc)"
				>
					<XIcon class="h-4 w-4" />
				</Button>
			</div>
		</div>

		<!-- Lightbox Image Viewport Stage -->
		<div class="relative w-full max-w-5xl flex-1 flex items-center justify-center my-3 min-h-0">
			{#if lightbox.images.length > 1}
				<button
					type="button"
					class="absolute left-2 sm:left-4 z-10 h-10 w-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors border border-white/20 cursor-pointer"
					onclick={prevLightboxImage}
					title="Previous photo (Left Arrow)"
				>
					<ChevronLeftIcon class="h-5 w-5" />
				</button>
			{/if}

			<img
				src={lightbox.images[lightbox.currentIndex]?.src}
				alt={lightbox.title}
				class="max-h-[68vh] max-w-full object-contain rounded-lg border border-white/10 shadow-2xl"
			/>

			{#if lightbox.images.length > 1}
				<button
					type="button"
					class="absolute right-2 sm:right-4 z-10 h-10 w-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors border border-white/20 cursor-pointer"
					onclick={nextLightboxImage}
					title="Next photo (Right Arrow)"
				>
					<ChevronRightIcon class="h-5 w-5" />
				</button>
			{/if}
		</div>

		<!-- Lightbox Thumbnail Filmstrip -->
		<div class="w-full max-w-2xl flex items-center justify-center gap-2 overflow-x-auto py-2">
			{#each lightbox.images as img, idx}
				<button
					type="button"
					class="h-12 w-16 rounded-md overflow-hidden border-2 transition-all shrink-0 cursor-pointer {idx === lightbox.currentIndex ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-white/20 opacity-60 hover:opacity-100'}"
					onclick={() => (lightbox.currentIndex = idx)}
				>
					<img src={img.src} alt={img.label} class="h-full w-full object-cover" />
				</button>
			{/each}
		</div>
	</div>
{/if}

<!-- Toast Feedback Bar -->
{#if toastMessage}
	<div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-4 py-2.5 rounded-lg shadow-xl border border-border flex items-center gap-2 text-xs font-medium animate-in slide-in-from-bottom-3 duration-200">
		<SparklesIcon class="h-4 w-4 text-primary shrink-0" />
		<span>{toastMessage}</span>
	</div>
{/if}

<style>
	/* Light Mode Map Canvas */
	:global(.surios-light-map.leaflet-container),
	:global(.surios-light-map .leaflet-container) {
		background-color: #f8fafc !important;
		font-family: inherit;
		outline: none;
	}

	:global(.surios-light-map.is-osm .leaflet-tile-pane) {
		filter: contrast(100%) brightness(100%) saturate(85%);
		-webkit-filter: contrast(100%) brightness(100%) saturate(85%);
	}

	/* Dark Mode Map Canvas */
	:global(.surios-dark-map.leaflet-container),
	:global(.surios-dark-map .leaflet-container) {
		background-color: #0c0e14 !important;
		font-family: inherit;
		outline: none;
	}

	:global(.surios-dark-map.is-osm .leaflet-tile-pane) {
		filter: invert(100%) hue-rotate(180deg) brightness(80%) contrast(125%) saturate(18%);
		-webkit-filter: invert(100%) hue-rotate(180deg) brightness(80%) contrast(125%) saturate(18%);
	}

	/* Squircle Defect Marker Styling */
	:global(.surios-radar-marker-container) {
		background: transparent !important;
		border: none !important;
	}

	:global(.radar-squircle-node) {
		position: relative;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	:global(.radar-squircle-box) {
		width: 28px;
		height: 28px;
		border-radius: 8px; /* Authentic Squircle */
		color: #ffffff;
		font-weight: 700;
		font-size: 11px;
		font-family: monospace;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1.5px solid rgba(255, 255, 255, 0.95);
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
		transition: all 0.2s ease;
	}

	:global(.radar-squircle-node:hover .radar-squircle-box),
	:global(.radar-squircle-node.is-active .radar-squircle-box) {
		transform: scale(1.15);
		border-color: #f59e0b; /* Safety Amber */
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.45), 0 4px 8px rgba(0, 0, 0, 0.35);
	}

	:global(.radar-ping-ring) {
		position: absolute;
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background-color: rgba(239, 68, 68, 0.35);
		animation: radar-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
		pointer-events: none;
	}

	@keyframes radar-ping {
		0% {
			transform: scale(0.8);
			opacity: 0.9;
		}
		100% {
			transform: scale(2.2);
			opacity: 0;
		}
	}

	/* Leaflet Radar Custom Popup */
	:global(.surios-radar-leaflet-popup .leaflet-popup-content-wrapper) {
		background: var(--card, #18181b) !important;
		color: var(--foreground, #fafafa) !important;
		border: 1px solid var(--border, #27272a) !important;
		border-radius: 10px !important;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35) !important;
		padding: 0 !important;
	}

	:global(.surios-radar-leaflet-popup .leaflet-popup-content) {
		margin: 10px !important;
		line-height: 1.4 !important;
	}

	:global(.surios-radar-leaflet-popup .leaflet-popup-tip) {
		background: var(--card, #18181b) !important;
	}

	:global(.surios-radar-tooltip) {
		background: var(--card, #18181b) !important;
		color: var(--foreground, #fafafa) !important;
		border: 1px solid var(--border, #27272a) !important;
		border-radius: 6px !important;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25) !important;
		padding: 4px 8px !important;
	}
</style>
