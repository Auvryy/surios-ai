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
	reportStatus: string;
	governmentUpdateLink: string | null;
	grouping?: MatchDecision | null;
	createdAt: string;
	author: { id: string; name: string; avatarUrl: string | null; role: string };
	confirmations: number;
	userConfirmed: boolean;
	reposts: number;
	userReposted: boolean;
	comments: CommunityComment[];
}

export interface CommunityComment {
	id: string;
	parentId: string | null;
	body: string;
	createdAt: string;
	likes: number;
	userLiked: boolean;
	replies: number;
	author: { id: string; name: string; avatarUrl: string | null };
}

export interface CommunityRepost {
	id: string;
	body: string;
	media: PostMedia[];
	createdAt: string;
	author: CommunityPost['author'];
	post: CommunityPost;
	governmentUpdate?: GovernmentUpdate | null;
}

export type CommunityFeedItem = { kind: 'post'; id: string; post: CommunityPost } | { kind: 'repost'; id: string; repost: CommunityRepost };

export interface BudgetItem { label: string; amount: number }
export interface GovernmentAttachment { id: string; url: string; name: string; mimeType: string; kind: 'photo' | 'document' }
export interface GovernmentUpdate {
	status: 'IN_PROGRESS' | 'RESOLVED';
	budget: BudgetItem[];
	budgetType: 'ESTIMATED' | 'ACTUAL';
	attachments: GovernmentAttachment[];
}
export interface GovernmentProfile { level: 'MUNICIPAL' | 'BARANGAY'; jurisdiction: string; bio: string }
export interface PublicProfile {
	id: string; name: string; avatarUrl: string | null; coverUrl: string | null; role: string;
	governmentProfile: GovernmentProfile | null;
}
export const isGovernment = (role?: string) => ['ENGINEER', 'OFFICER', 'ADMIN'].includes(role || '');
export const budgetTotal = (items: BudgetItem[]) => items.reduce((total, item) => total + Math.round(item.amount * 100), 0) / 100;
export const pesos = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
