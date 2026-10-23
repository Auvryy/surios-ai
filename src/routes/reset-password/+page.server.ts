import { resetPasswordAction } from '$lib/server/password-security';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = ({ setHeaders }) => { setHeaders({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }); };
export const actions: Actions = { default: resetPasswordAction };
