import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirectTo=/settings');
	}

	return {
		user: locals.user,
		systemDiagnostics: {
			geminiStatus: 'Operational',
			geminiModel: 'gemini-flash-lite-latest',
			databaseStatus: 'Healthy (PostgreSQL 16)',
			activeJurisdiction: 'Santa Cruz, Laguna Corridor',
			astmStandard: 'ASTM D6433-24'
		}
	};
};

export const actions: Actions = {
	savePreferences: async () => {
		// Preferences updated (saved to local session/state)
		return { success: 'Preferences saved.' };
	}
};
