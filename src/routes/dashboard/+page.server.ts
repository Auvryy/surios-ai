import type { Actions, PageServerLoad } from './$types';
import { loadWorkOrders, requireGovernmentUser, updateWorkOrder } from '$lib/server/work-orders';

export const load: PageServerLoad = async (event) => {
	requireGovernmentUser(event);
	return loadWorkOrders(event.url);
};

export const actions: Actions = {
	assign: (event) => updateWorkOrder(event, 'assign'),
	startRepair: (event) => updateWorkOrder(event, 'startRepair'),
	submitRepair: (event) => updateWorkOrder(event, 'submitRepair'),
	review: (event) => updateWorkOrder(event, 'review'),
	saveEstimate: (event) => updateWorkOrder(event, 'saveEstimate')
};
