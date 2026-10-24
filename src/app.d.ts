import type { User, Session } from '$lib/server/db/schema';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
			session: Session | null;
			authMethod: 'cookie' | 'bearer' | null;
		}
		interface PageData {
			user?: User | null;
		}
		// interface PageState {}
		interface Platform {
			req?: import('node:http').IncomingMessage;
		}
	}
}

export {};
