import { GoogleGenAI } from '@google/genai';
import { TriageAnalysisSchema, type TriageAnalysis } from '$lib/types/triage.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
	console.warn('[Gemini Service] Warning: GEMINI_API_KEY environment variable is not set.');
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

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
	if (!apiKey) {
		throw new Error('GEMINI_API_KEY is not configured on the server.');
	}

	const base64Data = imageBuffer.toString('base64');
	const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-pro'];

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

			const rawText = response.text?.trim();
			if (!rawText) {
				throw new Error('Received empty response from Gemini Vision API.');
			}

			const parsedJson = JSON.parse(rawText);
			const validated = TriageAnalysisSchema.parse(parsedJson);

			// Deterministic clamping on hazard severity (1-10)
			validated.hazardSeverity = Math.min(Math.max(Math.round(validated.hazardSeverity), 1), 10);

			return validated;
		} catch (err: any) {
			console.warn(`[Gemini Service] Model ${modelName} failed:`, err?.message || err);
			lastError = err;
			// Continue to next fallback model
		}
	}

	throw new Error(
		`Failed to analyze image with Gemini vision models: ${lastError?.message || 'Unknown error'}`
	);
}
