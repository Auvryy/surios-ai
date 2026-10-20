import { z } from 'zod';

export const DistressTypeSchema = z.enum([
	'pothole',
	'alligator_cracking',
	'longitudinal_transverse_cracking',
	'rutting',
	'ravelling_weathering',
	'drainage_culvert_failure',
	'edge_break',
	'other'
]);

export const RiskLevelSchema = z.enum(['LOW', 'MODERATE', 'CRITICAL']);

export const VruLethalitySchema = z.enum([
	'NONE',
	'LOW',
	'MODERATE',
	'HIGH',
	'CRITICAL'
]);

export const UrgencySchema = z.enum(['ROUTINE', 'PRIORITY', 'EMERGENCY']);

export const TriageAnalysisSchema = z.object({
	isValidInfrastructure: z
		.boolean()
		.describe('True if the image depicts a public civil road, highway, pavement, or culvert defect. False if it is a selfie, animal, indoor room, vehicle dashboard, or non-road spam.'),
	rejectionReason: z
		.string()
		.nullable()
		.describe('Explanation if isValidInfrastructure is false. Null if valid.'),
	distressType: DistressTypeSchema.describe('Civil distress category according to ASTM D6433 standards.'),
	hazardSeverity: z
		.number()
		.int()
		.min(1)
		.max(10)
		.describe('Hazard severity index from 1 (minor surface cosmetic issue) to 10 (catastrophic structural/safety failure).'),
	riskLevel: RiskLevelSchema.describe('General vehicular risk tier.'),
	vruLethality: VruLethalitySchema.describe('Specific threat rating for Vulnerable Road Users (motorcycles, tricycles, bicycles, and e-scooters).'),
	vruDetails: z
		.string()
		.describe('Specific explanation of why this defect threatens two-wheeler and tricycle stability or causes vehicle loss-of-control.'),
	estimatedDimensions: z.object({
		depthEstimate: z.string().describe('Visual depth estimate (e.g., "< 25mm", "25-50mm", "> 75mm deep").'),
		surfaceAreaEstimate: z.string().describe('Visual surface area (e.g., "0.5 sq m", "2.1 sq m").')
	}),
	recommendedAction: z
		.string()
		.describe('Civil engineering recommended repair action (e.g., "Cold-mix asphalt patch with tack coat", "Crack sealing", "Full-depth asphalt reclamation").'),
	materialsChecklist: z
		.array(z.string())
		.describe('Bullet list of materials and equipment required for public works road crews.'),
	urgency: UrgencySchema.describe('Municipal response priority category.'),
	summary: z.string().describe('Concise 1-2 sentence engineering summary of the hazard.')
});

export type DistressType = z.infer<typeof DistressTypeSchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export type VruLethality = z.infer<typeof VruLethalitySchema>;
export type Urgency = z.infer<typeof UrgencySchema>;
export type TriageAnalysis = z.infer<typeof TriageAnalysisSchema>;

export interface TriageApiResponse {
	success: boolean;
	data?: {
		reportId?: string;
		imageUrl: string;
		latitude: number;
		longitude: number;
		analysis: TriageAnalysis;
		createdAt: string;
	};
	error?: string;
}
