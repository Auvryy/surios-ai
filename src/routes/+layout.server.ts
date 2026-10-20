import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return {
			user: null
		};
	}

	// Safe serialization: strip password hash
	const { passwordHash, ...safeUser } = locals.user;

	return {
		user: safeUser
	};
};
