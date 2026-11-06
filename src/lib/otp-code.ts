/** Accept copied email codes with spacing or full-width digits; preserve leading zeroes. */
export function normalizeOtpCode(value: string) {
	return value.normalize('NFKC').replace(/[\s\u200B-\u200D\uFEFF-]/g, '');
}
