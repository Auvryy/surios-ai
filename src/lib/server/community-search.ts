import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { communityPosts, users } from './db';

export const communitySorts = ['relevance', 'newest', 'oldest', 'severity', 'confirmations'] as const;
export type CommunitySort = typeof communitySorts[number];

export function normalizeSearch(value: string) {
	return value.trim().replace(/\s+/g, ' ').slice(0, 100);
}

function pattern(value: string) {
	return `%${value.replace(/[\\%_]/g, '\\$&')}%`;
}

// All words must match, but they can occur in different fields and any order.
// PostgreSQL English stemming handles pothole/potholes and crack/cracking;
// literal matching also supports partial names, local place names and IDs.
export function communitySearch(query: string) {
	const title = sql`coalesce(${communityPosts.title}, '')`;
	const location = sql`coalesce(${communityPosts.locationName}, '')`;
	const author = sql`coalesce(${users.name}, '')`;
	const details = sql`concat_ws(' ', ${communityPosts.body}, replace(${communityPosts.analysis}->>'distressType', '_', ' '))`;
	const document = sql`concat_ws(' ', ${title}, ${location}, ${author}, ${details})`;
	const vector = sql`(setweight(to_tsvector('english', ${title}), 'A') || setweight(to_tsvector('english', ${location}), 'A') || setweight(to_tsvector('english', ${author}), 'B') || setweight(to_tsvector('english', ${details}), 'C'))`;
	const stopWords = new Set(['a', 'an', 'the', 'at', 'in', 'on', 'near', 'of', 'and', 'for', 'to', 'is', 'with']);
	const words = [...new Set(query.toLowerCase().match(/[\p{L}\p{N}]+(?:[-_][\p{L}\p{N}]+)*|[%_\\]+/gu) || [])];
	const meaningful = words.filter((word) => !stopWords.has(word));
	const terms = meaningful.length ? meaningful : words;
	const identifier = query.toLowerCase();
	const identifiers = or(eq(sql`${communityPosts.id}::text`, identifier), eq(sql`${communityPosts.reportId}::text`, identifier), eq(sql`${communityPosts.draftId}::text`, identifier));
	const matches = terms.map((term) => or(
		ilike(document, pattern(term)),
		sql`${vector} @@ plainto_tsquery('english', ${term})`
	)!);
	const phrase = pattern(query);
	const fieldScores = terms.map((term) => sql`(
		case when ${title} ilike ${pattern(term)} or to_tsvector('english', ${title}) @@ plainto_tsquery('english', ${term}) then 8 else 0 end +
		case when ${location} ilike ${pattern(term)} or to_tsvector('english', ${location}) @@ plainto_tsquery('english', ${term}) then 5 else 0 end +
		case when ${author} ilike ${pattern(term)} or to_tsvector('english', ${author}) @@ plainto_tsquery('english', ${term}) then 3 else 0 end
	)`);
	const rank = sql<number>`(
		case when ${identifiers} then 200 else 0 end +
		case when lower(${title}) = lower(${query}) then 60 when ${title} ilike ${phrase} then 30 else 0 end +
		case when ${location} ilike ${phrase} then 20 else 0 end +
		case when ${author} ilike ${phrase} then 15 else 0 end +
		${fieldScores.length ? sql.join(fieldScores, sql` + `) : sql`0`} +
		ts_rank_cd(${vector}, plainto_tsquery('english', ${terms.join(' ')}))
	)`;
	return { where: or(identifiers, terms.length ? and(...matches) : sql`false`)!, rank };
}
