<script lang="ts">
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	import AwardIcon from '@lucide/svelte/icons/award';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import BikeIcon from '@lucide/svelte/icons/bike';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import NavigationIcon from '@lucide/svelte/icons/navigation';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
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
			mainImage: '/uploads/pothole-pre-repair.jpg',
			secondaryImages: [
				{ src: '/uploads/patch-post-repair.jpg', label: 'Crosswalk Alignment' },
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
	<title>Civic Social Stream — Santa Cruz, Laguna — SuriOS</title>
</svelte:head>

<div class="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8 py-5 space-y-6 font-sans">
	<!-- Top Navigation Bar & Civic Action Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
		<div class="space-y-1">
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant="outline" class="text-xs font-mono border-primary text-primary bg-primary/5">
					Civic Social Stream
				</Badge>
				<span class="text-xs text-muted-foreground font-mono">Santa Cruz, Laguna • SDG 9 / SDG 11</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
				<AwardIcon class="h-6 w-6 text-primary shrink-0" />
				Laguna Road Guardians Social Stream
			</h1>
			<p class="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
				Crowdsourced road hazard consensus, two-wheeler accident triage, and citizen verified defect discussions.
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

	<!-- Centered Civic Social Feed Stream (Pure Social Media Feed with Zero Side Map) -->
	<div class="max-w-2xl mx-auto w-full space-y-6">
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
						class="rounded-xl border border-border bg-card transition-all duration-200 overflow-hidden hover:border-foreground/25 shadow-xs"
						role="article"
					>
						<!-- Post Header -->
						<div class="p-4 sm:p-5 pb-3">
							<div class="flex items-center justify-between gap-3">
								<div class="flex items-center gap-2.5">
									<!-- Author Avatar Circle -->
									<div class="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-xs text-foreground font-mono shrink-0 shadow-none">
										{post.author.avatarInitials}
									</div>

									<div class="flex items-center gap-1.5 text-xs">
										<span class="text-sm font-bold text-foreground leading-none">{post.author.name}</span>
										<span class="text-muted-foreground leading-none">•</span>
										<span class="text-muted-foreground font-mono leading-none">{post.timeAgo}</span>
									</div>
								</div>

								<!-- Header Actions: Minimalist Severity Badge & Three-Dots Menu -->
								<div class="relative shrink-0 flex items-center gap-2">
									<Badge
										variant="outline"
										class="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full {getVruBadgeClass(post.vruRisk)} shadow-none"
									>
										{post.severity.toFixed(1)} {post.vruRisk}
									</Badge>

									<Button
										variant="ghost"
										size="icon"
										class="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
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

						<!-- Media Gallery with Inset Vertical Dock (Choice A Vertical Minimalist) -->
						<div class="px-4 sm:px-5 pb-3">
							<div class="relative w-full h-64 sm:h-72 md:h-80 rounded-lg overflow-hidden border border-border bg-muted group">
								<!-- Primary Defect Photo -->
								<button
									type="button"
									class="w-full h-full block p-0 cursor-pointer text-left focus:outline-none"
									onclick={() => openLightbox(post, 0)}
									title="Click to view full photo in lightbox"
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

								<!-- Inset Vertical Column Dock (Inside Top-Right Corner of Main Image) -->
								<div class="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5 p-1 rounded-lg bg-black/45 backdrop-blur-md border border-white/20 shadow-lg">
									<!-- Slot 1: Secondary Photo Thumbnail -->
									<button
										type="button"
										class="relative w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden border border-white/20 bg-black/60 shadow-xs group/thumb cursor-pointer hover:ring-2 hover:ring-primary transition-all p-0"
										onclick={(e) => { e.stopPropagation(); openLightbox(post, 1); }}
										title="Secondary Angle: {post.secondaryImages[0]?.label || 'Detail'}"
									>
										<img
											src={post.secondaryImages[0]?.src || post.mainImage}
											alt="Secondary angle"
											class="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
										/>
									</button>

									<!-- Slot 2: Multi-image thumbnail (+X more) -->
									<button
										type="button"
										class="relative w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden border border-white/20 bg-black/80 shadow-xs group/thumb cursor-pointer hover:ring-2 hover:ring-primary transition-all p-0"
										onclick={(e) => { e.stopPropagation(); openLightbox(post, 2); }}
										title="View all {post.totalPhotosCount} photos"
									>
										<img
											src={post.secondaryImages[1]?.src || post.mainImage}
											alt="More angles"
											class="w-full h-full object-cover opacity-35 group-hover/thumb:opacity-50 transition-opacity"
										/>
										<div class="absolute inset-0 flex flex-col items-center justify-center text-white font-mono leading-none">
											<span class="text-xs sm:text-sm font-bold">+{Math.max(post.totalPhotosCount - 2, 1)}</span>
											<span class="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/80 mt-0.5">more</span>
										</div>
									</button>

									<!-- Slot 3: Compact embedded vector Mini-Map tile (Deep-links to separate full map) -->
									<a
										href="/?incident={post.id}"
										class="relative w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden border border-white/30 bg-background/95 hover:bg-background shadow-xs group/map cursor-pointer flex flex-col items-center justify-between p-1 transition-all hover:ring-2 hover:ring-primary text-foreground text-left"
										title="Open {post.corridorName} in Full GIS Map"
									>
										<!-- Stylized Vector Road Grid -->
										<svg class="absolute inset-0 w-full h-full opacity-25 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
											<defs>
												<pattern id="road-grid-inset-{post.id}" width="10" height="10" patternUnits="userSpaceOnUse">
													<path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" stroke-width="0.5" />
												</pattern>
											</defs>
											<rect width="100%" height="100%" fill="url(#road-grid-inset-{post.id})" />
											<line x1="0" y1="45" x2="65" y2="15" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
											<line x1="0" y1="45" x2="65" y2="15" stroke="#f59e0b" stroke-width="1" stroke-dasharray="2,2" />
										</svg>

										<div class="relative z-10 w-full flex items-center justify-center pt-1">
											<MapPinIcon class="h-4 w-4 sm:h-5 sm:h-5 text-destructive fill-destructive drop-shadow" />
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

						<!-- Title & Detailed Road Context (Minimalist, Zero Badge Clutter) -->
						<div class="px-4 sm:px-5 pb-3 space-y-1.5">
							<h3 class="text-base sm:text-lg font-bold text-foreground tracking-tight leading-snug">
								{post.title}
							</h3>

							<p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
								{post.description}
							</p>

							<div class="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
								<MapPinIcon class="h-3.5 w-3.5 text-muted-foreground shrink-0" />
								<span class="font-medium text-foreground/85">{post.location}</span>
								<span class="text-muted-foreground">•</span>
								<a
									href="/?incident={post.id}"
									class="font-mono text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
									title="Open in Full GIS Map"
								>
									<span>{post.coordinatesString}</span>
									<ArrowUpRightIcon class="h-3 w-3" />
								</a>
								{#if post.escalatedToDpwh}
									<span class="text-muted-foreground">•</span>
									<span class="text-xs font-mono text-primary font-medium">DPWH Dispatched</span>
								{/if}
							</div>
						</div>

						<Separator />

						<!-- Minimalist Social Action Bar -->
						<div class="px-4 sm:px-5 py-3 bg-card/60 flex items-center justify-between gap-3 text-xs">
							<!-- Interactive Upvote Button (Matching '↑ 27 Confirmed' Pill) -->
							<Button
								variant="outline"
								size="sm"
								class="text-xs h-8 px-3.5 gap-1.5 rounded-full shadow-none transition-all {post.userConfirmed ? 'bg-foreground text-background font-bold border-foreground hover:bg-foreground/90' : 'border-border text-foreground hover:bg-secondary/70'}"
								onclick={() => toggleConfirm(post.id)}
							>
								<ArrowUpIcon class="h-3.5 w-3.5 {post.userConfirmed ? 'text-background' : 'text-muted-foreground'}" />
								<span>{post.confirmations} Confirmed</span>
							</Button>

							<div class="flex items-center gap-1">
								<!-- Comments Toggle Button -->
								<Button
									variant={post.showComments ? 'secondary' : 'ghost'}
									size="sm"
									class="text-xs h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground rounded-full"
									onclick={() => toggleComments(post.id)}
									title="View discussion thread"
								>
									<MessageSquareIcon class="h-3.5 w-3.5" />
									<span class="font-mono">{post.comments.length}</span>
								</Button>

								<!-- Share Button -->
								<Button
									variant="ghost"
									size="icon"
									class="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
									onclick={() => copyPostShare(post.id)}
									title="Share defect link"
								>
									{#if copiedPostId === post.id}
										<CheckIcon class="h-3.5 w-3.5 text-primary" />
									{:else}
										<Share2Icon class="h-3.5 w-3.5" />
									{/if}
								</Button>
							</div>
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
