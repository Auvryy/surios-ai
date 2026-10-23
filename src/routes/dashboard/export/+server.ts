import type { RequestHandler } from './$types';
import { csvCell, loadWorkOrders, requireGovernmentUser } from '$lib/server/work-orders';

export const GET: RequestHandler = async (event) => {
	requireGovernmentUser(event);
	const { tickets } = await loadWorkOrders(event.url);
	const headers = ['Report ID', 'Title', 'Location', 'Latitude', 'Longitude', 'Severity', 'Status', 'Assigned crew', 'Material bags', 'Material cost PHP', 'After photo', 'Updated at'];
	const rows = tickets.map((ticket) => [ticket.id, ticket.title, ticket.location, ticket.latitude, ticket.longitude,
		ticket.severity, ticket.status, ticket.order?.assignedCrew, ticket.order?.estimate?.bags,
		ticket.order?.estimate?.cost, ticket.afterImage, ticket.updatedAt]);
	const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
	return new Response('\uFEFF' + csv, { headers: {
		'Content-Type': 'text/csv; charset=utf-8',
		'Content-Disposition': `attachment; filename="surios-work-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
		'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'
	} });
};
