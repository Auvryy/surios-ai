import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';
import { TriageAnalysisSchema, type TriageAnalysis } from '$lib/types/triage.js';

function getApiKey(): string {
	if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
		return process.env.GEMINI_API_KEY.trim();
	}

	try {
		const envPath = path.resolve('.env');
		if (fs.existsSync(envPath)) {
			const content = fs.readFileSync(envPath, 'utf8');
			const match = content.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
			if (match && match[1]) {
				const key = match[1].trim();
				process.env.GEMINI_API_KEY = key;
				return key;
			}
		}
	} catch (e) {
		console.warn('[Gemini Service] Could not read .env:', e);
	}

	return '';
}

const SYSTEM_PROMPT = `
You are the Chief Civil Infrastructure & Road Distress Inspector for SuriOS (aligned with UN SDG 9: Industry, Innovation, and Infrastructure).
You analyze user-uploaded photos of public roads, highways, pavements, bridges, and culverts according to ASTM D6433 standards (Standard Practice for Roads and Parking Lots Pavement Condition Index - PCI).

YOUR CORE RESPONSIBILITIES:
1. SPAM & NON-INFRASTRUCTURE REJECTION:
   - If the image is a selfie, animal/pet, indoor room, food, vehicle dashboard, computer screen, or does not clearly show public road/civil infrastructure, set isValidInfrastructure = false with a clear rejectionReason (e.g., "Image does not depict public road or civil pavement infrastructure."). For spam, provide safe default values for other fields.

2. CIVIL DISTRESS CLASSIFICATION (ASTM D6433):
   - Categorize the defect into one of: 'pothole', 'alligator_cracking', 'longitudinal_transverse_cracking', 'rutting', 'ravelling_weathering', 'drainage_culvert_failure', 'edge_break', 'other'.

3. TWO-WHEELER LETHALITY INDEX (VRU PROFILING - SDG 9.1):
   - Over 60% of Philippine and Southeast Asian commuters travel by motorcycle, scooter, tricycle, and bicycle.
   - Potholes with sharp vertical lips (>40mm depth) or longitudinal wheel-rut cracks can deflect a front motorcycle tire and cause fatal crashes, even if a 4-wheel vehicle ignores them.
   - Assign vruLethality: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'.
   - Detail the exact kinematic hazard in vruDetails (e.g. "Front tire capture risk; high potential for rider over-the-handlebar ejection at >30 km/h").

4. HAZARD SEVERITY INDEX (1 to 10):
   - 1-3 (LOW): Superficial hairline cracks, minor weathering, cosmetic ravelling.
   - 4-6 (MODERATE): Shallow potholes (<40mm), localized alligator cracking, edge spalling.
   - 7-10 (CRITICAL): Deep craters (>50mm), exposed sub-base/rebar, structural asphalt displacement, standing water pooling in base course.

5. ACTIONABLE REPAIR RECOMMENDATIONS & MATERIALS:
   - Provide concrete, professional public works recommendations (e.g., "Full-depth asphalt saw-cut, emulsion tack coat, 50mm compacted hot/cold-mix asphalt patch, vibratory plate compaction").
   - List the essential tools & materials (e.g., ["Cold-mix asphalt (50kg)", "Asphalt emulsion tack coat", "Plate compactor", "Traffic safety cones"]).

Output MUST be strictly valid JSON conforming to the requested schema.
`;

export async function analyzeRoadDistress(
	imageBuffer: Buffer,
	mimeType: string
): Promise<TriageAnalysis> {
	const apiKey = getApiKey();
	if (!apiKey) {
		throw new Error('GEMINI_API_KEY is not configured on the server. Please verify your .env file contains a valid GEMINI_API_KEY.');
	}

	const ai = new GoogleGenAI({ apiKey });
	const base64Data = imageBuffer.toString('base64');
	const modelsToTry = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.8-flash'];

	let lastError: Error | null = null;

	for (const modelName of modelsToTry) {
		try {
			const response = await ai.models.generateContent({
				model: modelName,
				contents: [
					{
						text: SYSTEM_PROMPT + '\n\nAnalyze this road pavement image and return valid JSON conforming to the schema.'
					},
					{
						inlineData: {
							mimeType: mimeType || 'image/jpeg',
							data: base64Data
						}
					}
				],
				config: {
					responseMimeType: 'application/json'
				}
			});

			const responseText = response.text;
			if (!responseText) {
				throw new Error(`Empty response from Gemini vision model ${modelName}`);
			}

			// Clean possible markdown code fences if model wrapped response
			const cleanedJson = responseText
				.replace(/^```json\s*/i, '')
				.replace(/^```\s*/i, '')
				.replace(/```\s*$/i, '')
				.trim();

			const parsedData = JSON.parse(cleanedJson);
			const validatedAnalysis = TriageAnalysisSchema.parse(parsedData);
			return validatedAnalysis;
		} catch (err: any) {
			console.warn(`[Gemini Service] Model ${modelName} failed:`, err?.message || err);
			lastError = err;
		}
	}

	throw new Error(`All vision models failed. Last error: ${lastError?.message || 'Unknown Gemini error'}`);
}
