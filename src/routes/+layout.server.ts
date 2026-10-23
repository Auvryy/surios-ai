import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const sidebarCollapsed = cookies.get('surios_nav') === 'collapsed';
	if (!locals.user) return { user: null, sidebarCollapsed };
	const { passwordHash, ...user } = locals.user;
	return { user, sidebarCollapsed };
};
