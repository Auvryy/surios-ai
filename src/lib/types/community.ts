import type { MatchDecision } from './hazards';
import type { TriageAnalysis } from './triage';

export interface PostMedia {
	id: string;
	url: string;
	kind: 'photo' | 'video';
	name: string;
	mimeType: string;
}
export interface CommunityPost {
	id: string;
	title: string;
	body: string;
	locationName: string;
	latitude: number;
	longitude: number;
	media: PostMedia[];
	coverId: string;
	analysis: TriageAnalysis;
	reportId: string;
	grouping?: MatchDecision | null;
	createdAt: string;
	author: { id: string; name: string; avatarUrl: string | null; role: string };
	confirmations: number;
	userConfirmed: boolean;
	comments: { id: string; parentId: string | null; body: string; createdAt: string; author: { id: string; name: string; avatarUrl: string | null } }[];
}
