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
}

export type CommunityFeedItem = { kind: 'post'; id: string; post: CommunityPost } | { kind: 'repost'; id: string; repost: CommunityRepost };
