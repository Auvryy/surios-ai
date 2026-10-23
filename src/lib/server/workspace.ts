const governmentRoles = new Set(['ENGINEER', 'OFFICER', 'ADMIN']);
const retiredPages = ['/verification', '/analytics', '/docs', '/crews'];
const sharedPages = ['/', '/community', '/map', '/report', '/liked', '/profile', '/settings'];

export function isGovernmentUser(role?: string | null) {
	return governmentRoles.has(role || '');
}

export function isRetiredPage(pathname: string) {
	return retiredPages.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Preserve local return URLs without reopening removed pages or external sites. */
export function workspaceRedirect(value: unknown, role?: string | null): string {
	if (typeof value !== 'string') return '/community';
	const target = value.trim();
	if (!target.startsWith('/') || target.startsWith('//') || /[\\\u0000-\u0020]/.test(target)) return '/community';
	try {
		const url = new URL(target, 'https://surios.invalid');
		if (url.origin !== 'https://surios.invalid') return '/community';
		const pathname = url.pathname.replace(/\/$/, '') || '/';
		if (isRetiredPage(pathname)) return isGovernmentUser(role) ? '/dashboard' : '/community';
		const shared = sharedPages.includes(pathname) || /^\/profile\/[^/]+$/.test(pathname);
		if (!shared && !(isGovernmentUser(role) && pathname === '/dashboard')) return '/community';
		return url.pathname + url.search + url.hash;
	} catch {
		return '/community';
	}
}
