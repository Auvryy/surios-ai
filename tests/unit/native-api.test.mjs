import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareNativeApiRequest } from '../../scripts/native-api.mjs';

const ORIGINAL_CONTENT_TYPE = Symbol.for('surios.native-api-content-type');
const VALID_BEARER = `Bearer surios_mobile_${'a'.repeat(64)}`;

test('rewrites multipart form content-type for authenticated native API mutations', () => {
	const req = {
		method: 'POST',
		url: '/api/reports',
		headers: {
			authorization: VALID_BEARER,
			'content-type': 'multipart/form-data; boundary=----surios'
		}
	};

	prepareNativeApiRequest(req);

	assert.equal(req[ORIGINAL_CONTENT_TYPE], 'multipart/form-data; boundary=----surios');
	assert.equal(req.headers['content-type'], 'application/vnd.surios.broken-expectation');
});

test('leaves non-API routes and GET requests untouched', () => {
	const getReq = {
		method: 'GET',
		url: '/api/posts',
		headers: {
			authorization: VALID_BEARER,
			'content-type': 'application/x-www-form-urlencoded'
		}
	};
	const pageReq = {
		method: 'POST',
		url: '/community',
		headers: {
			authorization: VALID_BEARER,
			'content-type': 'application/x-www-form-urlencoded'
		}
	};

	prepareNativeApiRequest(getReq);
	prepareNativeApiRequest(pageReq);

	assert.equal(getReq.headers['content-type'], 'application/x-www-form-urlencoded');
	assert.equal(pageReq.headers['content-type'], 'application/x-www-form-urlencoded');
	assert.equal(Object.hasOwn(getReq, ORIGINAL_CONTENT_TYPE), false);
	assert.equal(Object.hasOwn(pageReq, ORIGINAL_CONTENT_TYPE), false);
});

test('ignores cookie-only requests and JSON payloads', () => {
	const cookieReq = {
		method: 'POST',
		url: '/api/posts',
		headers: {
			cookie: 'surios_session=abc',
			'content-type': 'application/x-www-form-urlencoded'
		}
	};
	const jsonReq = {
		method: 'PATCH',
		url: '/api/settings',
		headers: {
			authorization: VALID_BEARER,
			'content-type': 'application/json'
		}
	};

	prepareNativeApiRequest(cookieReq);
	prepareNativeApiRequest(jsonReq);

	assert.equal(cookieReq.headers['content-type'], 'application/x-www-form-urlencoded');
	assert.equal(jsonReq.headers['content-type'], 'application/json');
});

test('is idempotent when a request already recorded its original content-type', () => {
	const req = {
		method: 'DELETE',
		url: '/api/posts/123?force=true',
		headers: {
			authorization: VALID_BEARER,
			'content-type': 'text/plain'
		}
	};

	prepareNativeApiRequest(req);
	prepareNativeApiRequest(req);

	assert.equal(req[ORIGINAL_CONTENT_TYPE], 'text/plain');
	assert.equal(req.headers['content-type'], 'application/vnd.surios.native-body');
});
