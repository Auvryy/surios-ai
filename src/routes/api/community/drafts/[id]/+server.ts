import { error } from '@sveltejs/kit';
import { z } from 'zod';
import { requireCommunityUser } from '$lib/server/community';
import { cancelAssessment, discardAssessment } from '$lib/server/community-assessments';
import type { RequestHandler } from './$types';
export const DELETE: RequestHandler = async (event) => {
	const user = requireCommunityUser(event);
	if (!z.uuid().safeParse(event.params.id).success) error(400, 'Invalid assessment.');
	cancelAssessment(user.id, event.params.id);
	await discardAssessment(user.id, event.params.id);
	return new Response(null, { status: 204 });
};
