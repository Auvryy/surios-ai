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

export const SeverityEvidenceSchema = z.object({
	visibleDefects: z.array(z.string().trim().min(1).max(160)).max(4),
	criticalDangerVisible: z.boolean(),
	confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']),
	limitations: z.string().max(240)
});

export const TriageAnalysisSchema = z.object({
	severityEvidence: SeverityEvidenceSchema.optional(),
	isValidInfrastructure: z
		.boolean()
		.describe('True if image depicts public road/civil infrastructure; false if non-road spam or indoor photo.'),
	rejectionReason: z
		.string()
		.nullable()
		.optional()
		.describe('Explanation if isValidInfrastructure is false.'),
	distressType: DistressTypeSchema.default('other'),
	hazardSeverity: z
		.number()
		.int()
		.min(1)
		.max(10)
		.default(1),
	riskLevel: z.preprocess((val) => typeof val === 'string' ? val.toUpperCase() : val, RiskLevelSchema).default('LOW'),
	vruLethality: z.preprocess((val) => typeof val === 'string' ? val.toUpperCase() : val, VruLethalitySchema).default('NONE'),
	vruDetails: z
		.string()
		.default('No rider threat detected.'),
	estimatedDimensions: z.object({
		depthEstimate: z.string().default('N/A'),
		surfaceAreaEstimate: z.string().default('N/A')
	}).default({ depthEstimate: 'N/A', surfaceAreaEstimate: 'N/A' }),
	recommendedAction: z
		.string()
		.default('No municipal repair required.'),
	materialsChecklist: z
		.array(z.string())
		.default([]),
	urgency: z.preprocess((val) => typeof val === 'string' ? val.toUpperCase() : val, UrgencySchema).default('ROUTINE'),
	summary: z.string().default('Analysis complete.')
});

// New AI results require an auditable explanation; older saved assessments remain readable.
export const AIAssessmentSchema = TriageAnalysisSchema.extend({ severityEvidence: SeverityEvidenceSchema }).superRefine((analysis, context) => {
	if (analysis.hazardSeverity >= 8 && (!analysis.severityEvidence.criticalDangerVisible || analysis.severityEvidence.confidence !== 'HIGH' || !analysis.severityEvidence.visibleDefects.length)) {
		context.addIssue({ code: 'custom', path: ['hazardSeverity'], message: 'Critical severity requires clearly visible serious danger, high confidence, and specific supporting evidence.' });
	}
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
		imagePath: string;
		latitude: number;
		longitude: number;
		analysis: TriageAnalysis;
	};
	error?: string;
	analysis?: TriageAnalysis;
}
