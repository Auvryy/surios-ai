import type { TriageAnalysis } from './triage';
import type { PostMedia } from './community';
export interface MatchDecision {
	method: 'new' | 'exact' | 'ai' | 'unverified' | 'legacy';
	confidence: number;
	newEvidence?: boolean;
	reason: string;
}
export interface MapHazard {
	id: string;
	title: string;
	location: string;
	latitude: number;
	longitude: number;
	distressType: string;
	severity: number;
	riskLevel: 'LOW' | 'MODERATE' | 'CRITICAL';
	vruLethality: string;
	status: string;
	support: number;
	observations: number;
	priority: number;
	createdAt: string;
	updatedAt: string;
	imageUrl: string;
	mediaKind: 'photo' | 'video';
	analysis: TriageAnalysis;
	posts: { id: string; title: string; author: string; createdAt: string; match: MatchDecision | null }[];
	media: PostMedia[];
}

/** Product triage bands, not a certified pavement condition index. */
export function normalizeSeverity(analysis: TriageAnalysis): TriageAnalysis {
	const riskFloor = { LOW: 1, MODERATE: 4, CRITICAL: 8 }[analysis.riskLevel];
	const riderFloor = { NONE: 1, LOW: 1, MODERATE: 4, HIGH: 6, CRITICAL: 8 }[analysis.vruLethality];
	const hazardSeverity = Math.min(10, Math.max(1, Math.round(analysis.hazardSeverity), riskFloor, riderFloor));
	return { ...analysis, hazardSeverity, riskLevel: hazardSeverity >= 8 ? 'CRITICAL' : hazardSeverity >= 4 ? 'MODERATE' : 'LOW' };
}
export function hazardPriority(severity: number, support: number) {
	return Math.min(10, severity + Math.min(2, Math.max(0, support - 1) * .25));
}
export function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
	const radians = (degrees: number) => degrees * Math.PI / 180;
	const deltaLat = radians(b.latitude - a.latitude), deltaLng = radians(b.longitude - a.longitude);
	const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(deltaLng / 2) ** 2;
	return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
