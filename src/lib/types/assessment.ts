export interface ReporterContext { headline: string; caption: string }
export function reporterContext(headline: string, caption: string): ReporterContext {
	return { headline: headline.trim().slice(0, 120), caption: caption.trim().slice(0, 2000) };
}
export function sameReporterContext(a: ReporterContext, b: ReporterContext) {
	return a.headline === b.headline && a.caption === b.caption;
}
export function suggestedHeadline(distressType: string) {
	return distressType.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}
