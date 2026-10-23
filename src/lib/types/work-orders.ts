export const WORK_ORDER_STATUSES = ['REPORTED', 'DISPATCHED', 'IN_REPAIR', 'AWAITING_REVIEW', 'RESOLVED'] as const;
export type WorkOrderStatus = typeof WORK_ORDER_STATUSES[number];

export const workOrderStatusLabel: Record<WorkOrderStatus, string> = {
	REPORTED: 'Unassigned', DISPATCHED: 'Assigned', IN_REPAIR: 'In repair',
	AWAITING_REVIEW: 'Needs review', RESOLVED: 'Resolved'
};

export interface MaterialEstimateInput {
	length: number;
	width: number;
	depth: number;
	density: number;
	bagWeight: number;
	bagPrice: number;
	wastePercent: number;
}
export interface MaterialEstimate extends MaterialEstimateInput {
	volume: number;
	mass: number;
	bags: number;
	cost: number;
}

/** Planning arithmetic using entered measurements and supplier specifications. */
export function calculateMaterialEstimate(input: MaterialEstimateInput): MaterialEstimate {
	const volume = input.length * input.width * input.depth / 1000;
	const mass = volume * input.density * (1 + input.wastePercent / 100);
	const bags = Math.ceil(mass / input.bagWeight);
	return { ...input, volume, mass, bags, cost: Math.round(bags * input.bagPrice * 100) / 100 };
}
