const originalContentType = Symbol.for('surios.native-api-content-type');
const mutations = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const formTypes = new Set(['multipart/form-data', 'application/x-www-form-urlencoded', 'text/plain']);

/**
 * Kit checks form origins before hooks, including requests from native clients.
 * Only explicit API bearer requests take this path. The hook validates the token
 * and restores the body type before any endpoint can parse or mutate data.
 * Cookie-only requests and the actual Origin header are never changed.
 */
export function prepareNativeApiRequest(request) {
	if (!mutations.has(request.method) || !/^\/api(?:\/|\?|$)/.test(request.url || '')) return;
	if (!/^Bearer surios_mobile_[a-f0-9]{64}$/i.test(request.headers.authorization || '')) return;
	if (Object.hasOwn(request, originalContentType)) return;
	const type = request.headers['content-type'];
	if (type && !formTypes.has(type.split(';')[0].trim().toLowerCase())) return;
	// A Symbol on the raw Node request cannot be supplied through HTTP headers.
	request[originalContentType] = type || null;
	request.headers['content-type'] = 'application/vnd.surios.native-body';
}
