import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { analyzeRoadDistress } from '$lib/server/gemini.js';
import { db, reports } from '$lib/server/db/index.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Santa Cruz, Laguna coordinates as authentic default anchor
const DEFAULT_LAT = 14.2813;
const DEFAULT_LNG = 121.4173;

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const imageFile = formData.get('image');
		const rawLat = formData.get('latitude');
		const rawLng = formData.get('longitude');

		if (!imageFile || !(imageFile instanceof File)) {
			return json(
				{ success: false, error: 'No image file was provided in the request.' },
				{ status: 400 }
			);
		}

		// Validate file size (max 10MB)
		if (imageFile.size > 10 * 1024 * 1024) {
			return json(
				{ success: false, error: 'Image exceeds maximum allowed size of 10MB.' },
				{ status: 400 }
			);
		}

		// Validate MIME type
		const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
		if (!allowedMimes.includes(imageFile.type)) {
			return json(
				{
					success: false,
					error: 'Invalid image format. Please upload a JPEG, PNG, or WebP photo.'
				},
				{ status: 400 }
			);
		}

		const latitude = rawLat ? parseFloat(rawLat.toString()) : DEFAULT_LAT;
		const longitude = rawLng ? parseFloat(rawLng.toString()) : DEFAULT_LNG;

		// Convert File to Buffer
		const arrayBuffer = await imageFile.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Generate unique filename and save to static/uploads/
		const ext = imageFile.type.split('/')[1] || 'jpg';
		const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
		const uploadDir = path.resolve('static/uploads');
		await fs.mkdir(uploadDir, { recursive: true });
		const filePath = path.join(uploadDir, filename);
		await fs.writeFile(filePath, buffer);

		const relativeImagePath = `/uploads/${filename}`;

		// Execute Gemini Multimodal Vision Triage
		const analysis = await analyzeRoadDistress(buffer, imageFile.type);

		// If AI determined this is not public road infrastructure, reject without creating a ticket
		if (!analysis.isValidInfrastructure) {
			return json(
				{
					success: false,
					error: analysis.rejectionReason || 'Uploaded image does not depict valid road or civil infrastructure.',
					analysis
				},
				{ status: 422 }
			);
		}

		// Insert report into PostgreSQL
		let reportId: string | undefined;
		let rawId: string | undefined;
		try {
			const [inserted] = await db
				.insert(reports)
				.values({
					imagePath: relativeImagePath,
					latitude: latitude.toFixed(8),
					longitude: longitude.toFixed(8),
					distressType: analysis.distressType,
					hazardSeverity: analysis.hazardSeverity,
					riskLevel: analysis.riskLevel,
					vruLethality: analysis.vruLethality,
					vruDetails: analysis.vruDetails,
					recommendedAction: analysis.recommendedAction,
					materialsChecklist: analysis.materialsChecklist,
					status: 'REPORTED',
					communityConfirmations: 1,
					triagePayload: analysis
				})
				.returning({ id: reports.id });

			if (inserted?.id) {
				rawId = inserted.id;
				reportId = `TKT-${inserted.id.slice(0, 6).toUpperCase()}`;
			}
		} catch (dbError: any) {
			console.error('[Triage API] Database insertion warning:', dbError?.message || dbError);
			// Even if DB fails in offline mode, return AI analysis
		}

		return json({
			success: true,
			data: {
				reportId: reportId || 'TKT-PENDING',
				rawId,
				imageUrl: relativeImagePath,
				latitude,
				longitude,
				analysis,
				createdAt: new Date().toISOString()
			}
		});
	} catch (err: any) {
		console.error('[Triage API Error]:', err);
		return json(
			{
				success: false,
				error: err?.message || 'An unexpected error occurred during civil distress triage.'
			},
			{ status: 500 }
		);
	}
};
