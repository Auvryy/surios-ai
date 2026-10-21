import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { reports } from '$lib/server/db/schema.js';
import { desc } from 'drizzle-orm';

export interface FeedIncident {
	id: string;
	rawId?: string;
	title: string;
	distressType: string;
	astmCode: string;
	locationName: string;
	latitude: number;
	longitude: number;
	hazardSeverity: number;
	riskLevel: 'LOW' | 'MODERATE' | 'CRITICAL';
	vruLethality: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
	vruDetails: string;
	recommendedAction: string;
	materialsChecklist: string[];
	status: 'REPORTED' | 'DISPATCHED' | 'IN_REPAIR' | 'RESOLVED';
	communityConfirmations: number;
	createdAt: string;
	imageUrl?: string;
}

const defaultIncidents: FeedIncident[] = [
	{
		id: 'TKT-7821',
		title: 'LSPU Main Entrance Pothole',
		distressType: 'Deep Pothole (Edge Breakdown)',
		astmCode: 'ASTM D6433 (Pothole - High)',
		locationName: 'LSPU Main Entrance, Santa Cruz',
		latitude: 14.2813,
		longitude: 121.4173,
		hazardSeverity: 9,
		riskLevel: 'CRITICAL',
		vruLethality: 'CRITICAL',
		vruDetails: 'Severe rim and suspension strike zone for motorcycles; 68mm depth exceeds safe trajectory.',
		recommendedAction: 'Emergency Cold/Hot Asphalt Patch (ASTM D6433 Section 8)',
		materialsChecklist: ['Tack Coat Emulsion (0.2 gal/yd²)', 'Cold/Hot Asphalt Mix (0.35 tonnes)', 'Vibratory Plate Compactor', 'Asphalt Rake & Tamper'],
		status: 'REPORTED',
		communityConfirmations: 5,
		createdAt: '12m ago',
		imageUrl: '/uploads/1792497053187-c0f0987e311e.jpeg'
	},
	{
		id: 'TKT-7819',
		title: 'National Highway Pagsanjan Junction Fatigue',
		distressType: 'Alligator Cracking & Rutting',
		astmCode: 'ASTM D6433 (Alligator - Med)',
		locationName: 'National Highway, Pagsanjan Junction',
		latitude: 14.2765,
		longitude: 121.4312,
		hazardSeverity: 7,
		riskLevel: 'MODERATE',
		vruLethality: 'HIGH',
		vruDetails: 'Interconnected polygon cracking causing traction loss during monsoon rain.',
		recommendedAction: 'Full-Depth Mill & Overlay Repair',
		materialsChecklist: ['Asphalt Milling Machine', 'Bituminous Base Course', 'Hot Mix Asphalt Surface Course', 'Joint Sealant'],
		status: 'DISPATCHED',
		communityConfirmations: 3,
		createdAt: '45m ago',
		imageUrl: '/uploads/1792498308438-da49636d411c.jpeg'
	},
	{
		id: 'TKT-7814',
		title: 'Bubukal Edge Defect & Scour',
		distressType: 'Drainage Failure / Edge Drop-off',
		astmCode: 'ASTM D6433 (Edge Defect)',
		locationName: 'Barangay Bubukal Corridor',
		latitude: 14.269,
		longitude: 121.4021,
		hazardSeverity: 5,
		riskLevel: 'MODERATE',
		vruLethality: 'MODERATE',
		vruDetails: 'Shoulder erosion causing sudden 75mm grade drop for two-wheelers overtaking on side.',
		recommendedAction: 'Granular Shoulder Reconstitution and Edge Seal',
		materialsChecklist: ['Aggregate Base Coarse Type A', 'Pneumatic Roller', 'Bituminous Primer'],
		status: 'REPORTED',
		communityConfirmations: 2,
		createdAt: '2h ago',
		imageUrl: '/uploads/1792498021617-5b77bb42b306.jpeg'
	},
	{
		id: 'TKT-7798',
		title: 'Pedro Guevara Transverse Crack',
		distressType: 'Transverse Thermal Crack',
		astmCode: 'ASTM D6433 (Crack - Low)',
		locationName: 'Pedro Guevara Ave, Santa Cruz',
		latitude: 14.284,
		longitude: 121.419,
		hazardSeverity: 2,
		riskLevel: 'LOW',
		vruLethality: 'LOW',
		vruDetails: 'Hairline crack perpendicular to traffic centerline; low hazard.',
		recommendedAction: 'Hot-Poured Rubberized Asphalt Crack Fill',
		materialsChecklist: ['ASTM D6690 Type II Crack Sealant', 'Air Lance Compressor', 'Pour Pot / Applicator Wand'],
		status: 'RESOLVED',
		communityConfirmations: 4,
		createdAt: '5h ago',
		imageUrl: '/uploads/1792497981972-7aa635807eb0.jpeg'
	},
	{
		id: 'TKT-7782',
		title: 'Public Market Access Rutting',
		distressType: 'Severe Pothole & Subgrade Rutting',
		astmCode: 'ASTM D6433 (Pothole - High)',
		locationName: 'Santa Cruz Public Market Feeder',
		latitude: 14.2721,
		longitude: 121.415,
		hazardSeverity: 8,
		riskLevel: 'CRITICAL',
		vruLethality: 'CRITICAL',
		vruDetails: 'Heavy tricycle wheel path rutting with standing muddy water obscuring pothole depth.',
		recommendedAction: 'Subgrade Stabilization and Asphalt Surface Re-capping',
		materialsChecklist: ['Crushed Gravel Base', 'Tack Coat', 'Hot Mix Asphalt Wearing Coarse'],
		status: 'IN_REPAIR',
		communityConfirmations: 7,
		createdAt: '1d ago',
		imageUrl: '/uploads/1792498042266-dce0cd7802f6.jpeg'
	}
];

export const load: PageServerLoad = async () => {
	try {
		const dbItems = await db
			.select()
			.from(reports)
			.orderBy(desc(reports.createdAt))
			.limit(20);

		if (dbItems.length > 0) {
			const formatted: FeedIncident[] = dbItems.map((r) => ({
				id: `TKT-${r.id.slice(0, 6).toUpperCase()}`,
				rawId: r.id,
				title: `${r.distressType} at Santa Cruz`,
				distressType: r.distressType,
				astmCode: `ASTM D6433 (${r.distressType})`,
				locationName: `Corridor (${Number(r.latitude).toFixed(4)}° N, ${Number(r.longitude).toFixed(4)}° E)`,
				latitude: Number(r.latitude),
				longitude: Number(r.longitude),
				hazardSeverity: r.hazardSeverity,
				riskLevel: (r.riskLevel as any) || 'MODERATE',
				vruLethality: (r.vruLethality as any) || 'MODERATE',
				vruDetails: r.vruDetails || 'Assessed by Google Gemini Multimodal Vision.',
				recommendedAction: r.recommendedAction,
				materialsChecklist: r.materialsChecklist || ['Cold Patch Asphalt Mix', 'Compactor', 'Safety Cones'],
				status: (r.status as any) || 'REPORTED',
				communityConfirmations: r.communityConfirmations || 1,
				createdAt: 'Just now',
				imageUrl: r.imagePath || undefined
			}));

			return {
				incidents: [...formatted, ...defaultIncidents]
			};
		}
	} catch (e) {
		console.error('[MapFeed Load Error]', e);
	}

	return {
		incidents: defaultIncidents
	};
};
