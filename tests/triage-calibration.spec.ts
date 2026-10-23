import { test, expect } from '@playwright/test';
import { AIAssessmentSchema, TriageAnalysisSchema } from '../src/lib/types/triage';
import { normalizeSeverity } from '../src/lib/types/hazards';
const base = TriageAnalysisSchema.parse({ isValidInfrastructure: true, hazardSeverity: 2, riskLevel: 'LOW', vruLethality: 'LOW' });
const mild = { ...base, infrastructureType: 'ROAD_PAVEMENT' as const, severityEvidence: { visibleDefects: ['Fine surface cracks without visible displacement.'], reportedConditions: [], criticalDangerVisible: false, confidence: 'HIGH' as const, limitations: 'Depth is unmeasured.' } };
test('minor damage remains low even when generic risk labels exaggerate it', () => {
	for (const score of [1,2,3,4]) {
		const result = normalizeSeverity({ ...base, hazardSeverity: score, riskLevel: 'CRITICAL', vruLethality: 'CRITICAL' });
		expect(result.hazardSeverity).toBe(score);
		expect(result.riskLevel).toBe(score < 4 ? 'LOW' : 'MODERATE');
	}
});
test('critical AI scores require explicit serious danger, high confidence and visible evidence', () => {
	for (const score of [8,9,10]) {
		expect(AIAssessmentSchema.safeParse({ ...mild, hazardSeverity: score }).success).toBe(false);
		expect(AIAssessmentSchema.safeParse({ ...mild, hazardSeverity: score, severityEvidence: { ...mild.severityEvidence, criticalDangerVisible: true, confidence: 'LOW' } }).success).toBe(false);
		expect(AIAssessmentSchema.safeParse({ ...mild, hazardSeverity: score, severityEvidence: { ...mild.severityEvidence, criticalDangerVisible: true, visibleDefects: [] } }).success).toBe(false);
		const dangerous = { ...mild, hazardSeverity: score, severityEvidence: { ...mild.severityEvidence, criticalDangerVisible: true, visibleDefects: ['Large open void and a missing road surface across the visible wheel path.'] } };
		expect(AIAssessmentSchema.safeParse(dangerous).success).toBe(true);
		expect(normalizeSeverity(dangerous).hazardSeverity).toBe(score);
	}
});
test('mild and substantial hazards keep their evidence-supported scores without a forced low-score quota', () => {
	for (const score of [1,2,3,4,5,6,7]) expect(normalizeSeverity(AIAssessmentSchema.parse({ ...mild, hazardSeverity: score })).hazardSeverity).toBe(score);
	expect(AIAssessmentSchema.safeParse(base).success).toBe(false);
	expect(TriageAnalysisSchema.safeParse(base).success).toBe(true); // existing saved reports remain readable
});
