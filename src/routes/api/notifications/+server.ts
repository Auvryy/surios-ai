import { json } from '@sveltejs/kit';
import { readApiJson, requireApiUser, requireMutationOrigin } from '$lib/server/api-access';
import { loadNotifications, notificationReadSchema, readNotifications } from '$lib/server/notifications';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => json(await loadNotifications(requireApiUser(event).id, event.url));

export const PATCH: RequestHandler = async (event) => {
	const user = requireApiUser(event);
	requireMutationOrigin(event);
	const input = await readApiJson(event, notificationReadSchema);
	return json(await readNotifications(user.id, input));
};
