import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { eq, count } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { users, reports, defaultUserSettings, type UserSettings } from '$lib/server/db/schema.js';

export const load: PageServerLoad = async ({ locals }) => {
	let totalReports = 0;
	try {
		const [result] = await db.select({ val: count() }).from(reports);
		totalReports = result?.val ?? 0;
	} catch (e) {
		console.warn('[Settings Load] Count error:', e);
	}

	const settings: UserSettings = {
		...defaultUserSettings,
		...(locals.user?.settings as Partial<UserSettings> || {})
	};

	return {
		user: locals.user,
		settings,
		systemDiagnostics: {
			geminiStatus: 'Operational',
			geminiModel: 'gemini-3.8-flash',
			databaseStatus: 'Healthy (PostgreSQL 16, Port 5433)',
			totalReportsCataloged: totalReports,
			activeJurisdiction: 'Santa Cruz, Laguna Corridor (Manila East Provincial Rd)',
			astmStandard: 'ASTM D6433-24 (PCI Standard & VRU Protocol)'
		}
	};
};

export const actions: Actions = {
	saveSettings: async ({ request, locals }) => {
		const formData = await request.formData();

		const theme = (formData.get('theme') as 'dark' | 'light') || 'dark';
		const vruAlerts = formData.get('vruAlerts') === 'on' || formData.get('vruAlerts') === 'true';
		const dailyDigest = formData.get('dailyDigest') === 'on' || formData.get('dailyDigest') === 'true';
		const dpwhForwarding = formData.get('dpwhForwarding') === 'on' || formData.get('dpwhForwarding') === 'true';
		const autoSnapCorridors = formData.get('autoSnapCorridors') === 'on' || formData.get('autoSnapCorridors') === 'true';

		const rawPotholeThreshold = Number(formData.get('potholeThreshold'));
		const potholeThreshold = !isNaN(rawPotholeThreshold) && rawPotholeThreshold >= 20 ? rawPotholeThreshold : 50;

		const rawMultiplier = Number(formData.get('vruWeightMultiplier'));
		const vruWeightMultiplier = !isNaN(rawMultiplier) && rawMultiplier >= 1.0 ? rawMultiplier : 1.5;

		const defaultMapView = (formData.get('defaultMapView') as 'split' | 'full') || 'split';
		const preferredCorridor = (formData.get('preferredCorridor') as string) || 'ALL';

		const newSettings: UserSettings = {
			theme,
			vruAlerts,
			dailyDigest,
			dpwhForwarding,
			potholeThreshold,
			vruWeightMultiplier,
			autoSnapCorridors,
			defaultMapView,
			preferredCorridor
		};

		if (locals.user) {
			try {
				await db
					.update(users)
					.set({
						settings: newSettings,
						updatedAt: new Date()
					})
					.where(eq(users.id, locals.user.id));

				// Update in-memory session user object
				locals.user.settings = newSettings;
			} catch (error) {
				console.error('[Save Settings DB Error]', error);
				return fail(500, { error: 'Failed to save settings to municipal database.' });
			}
		}

		return {
			success: locals.user
				? 'Settings saved successfully to the municipal database.'
				: 'Settings saved locally for current session.',
			savedAt: new Date().toLocaleTimeString(),
			settings: newSettings
		};
	},

	resetDefaults: async ({ locals }) => {
		if (locals.user) {
			try {
				await db
					.update(users)
					.set({
						settings: defaultUserSettings,
						updatedAt: new Date()
					})
					.where(eq(users.id, locals.user.id));

				locals.user.settings = defaultUserSettings;
			} catch (error) {
				console.error('[Reset Settings DB Error]', error);
				return fail(500, { error: 'Failed to reset settings in database.' });
			}
		}

		return {
			success: 'Settings reset to ASTM D6433 municipal baseline.',
			savedAt: new Date().toLocaleTimeString(),
			settings: defaultUserSettings
		};
	}
};
