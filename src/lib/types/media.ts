export const PHOTO_BYTES = 5 * 1024 * 1024;
export const VIDEO_BYTES = 25 * 1024 * 1024;
export const TOTAL_MEDIA_BYTES = 50 * 1024 * 1024;
export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
export const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime';
export function mediaLimitError(files: { size: number; type: string }[]) {
	if (files.length > 6) return 'Choose up to 6 photos or videos.';
	if (files.some((file) => ![...PHOTO_ACCEPT.split(','), ...VIDEO_ACCEPT.split(',')].includes(file.type))) return 'Use JPEG, PNG, WebP, MP4, WebM, or MOV files.';
	if (files.some((file) => file.size > (file.type.startsWith('video/') ? VIDEO_BYTES : PHOTO_BYTES))) return 'Images must be 5 MB or less; videos must be 25 MB or less.';
	if (files.reduce((total, file) => total + file.size, 0) > TOTAL_MEDIA_BYTES) return 'Attachments must total 50 MB or less.';
	return '';
}
