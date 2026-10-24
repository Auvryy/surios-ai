import { json } from '@sveltejs/kit';
import { PHOTO_BYTES, VIDEO_BYTES, TOTAL_MEDIA_BYTES, PHOTO_ACCEPT, VIDEO_ACCEPT } from '$lib/types/media';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => json({
	name: 'SuriOS API', version: 1,
	authentication: { scheme: 'Bearer', login: '/api/auth/login', register: '/api/auth/register', session: '/api/auth/session', logout: '/api/auth/logout' },
	features: ['community-feed', 'liked-posts', 'post-threads', 'assessment-drafts', 'reports', 'maps', 'road-selection', 'reactions', 'comments', 'reposts', 'profiles', 'account-settings', 'password-recovery', 'government-updates', 'account-administration'],
	mediaLimits: { files: 6, photoBytes: PHOTO_BYTES, videoBytes: VIDEO_BYTES, totalBytes: TOTAL_MEDIA_BYTES, acceptedTypes: [...PHOTO_ACCEPT.split(','), ...VIDEO_ACCEPT.split(',')] }
});
