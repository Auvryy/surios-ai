import fs from 'node:fs/promises';
import path from 'node:path';
import { error, fail, isHttpError, type RequestEvent } from '@sveltejs/kit';
import { asc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db, reports, users, workOrders, workOrderEvents } from './db';
import { loadMapHazards } from './map-hazards';
import { isGovernmentUser } from './workspace';
import { MEDIA_DIR, readUploadForm, validateMedia } from './community-media';
import { calculateMaterialEstimate, WORK_ORDER_STATUSES } from '$lib/types/work-orders';

export function requireGovernmentUser(event: RequestEvent) {
	if (!event.locals.user) error(401, 'Sign in to manage work orders.');
	if (!isGovernmentUser(event.locals.user.role)) error(403, 'Government access required.');
	if (event.request.method !== 'GET' && event.request.headers.get('origin') !== event.url.origin) error(403, 'Invalid request origin.');
	return event.locals.user;
}

export async function loadWorkOrders(url: URL) {
	const { hazards } = await loadMapHazards();
	const ids = hazards.map(({ id }) => id);
	const records = ids.length ? await db.select({ id: reports.id, afterImage: reports.resolvedImagePath, order: workOrders })
		.from(reports).leftJoin(workOrders, eq(workOrders.reportId, reports.id)).where(inArray(reports.id, ids)) : [];
	const byId = new Map(records.map((record) => [record.id, record]));
	const q = (url.searchParams.get('q') || '').trim().slice(0, 160);
	const rawStatus = url.searchParams.get('status') || '';
	const status = WORK_ORDER_STATUSES.some((item) => item === rawStatus) ? rawStatus : '';
	const tickets = hazards.map((hazard) => {
		const record = byId.get(hazard.id);
		return { ...hazard, afterImage: record?.afterImage || null, order: record?.order || null };
	}).filter((ticket) => (!status || ticket.status === status) && (!q ||
		`${ticket.id} ${ticket.title} ${ticket.location} ${ticket.order?.assignedCrew || ''}`.toLowerCase().includes(q.toLowerCase())))
		.sort((a, b) => b.priority - a.priority || b.createdAt.localeCompare(a.createdAt));
	const selectedId = tickets.find(({ id }) => id === url.searchParams.get('report'))?.id || tickets[0]?.id || null;
	const activity = selectedId ? await db.select({
		id: workOrderEvents.id, event: workOrderEvents.event, description: workOrderEvents.description,
		imagePath: workOrderEvents.imagePath, createdAt: workOrderEvents.createdAt, actor: users.name
	}).from(workOrderEvents).leftJoin(users, eq(users.id, workOrderEvents.actorId))
		.where(eq(workOrderEvents.reportId, selectedId)).orderBy(asc(workOrderEvents.createdAt), asc(workOrderEvents.id)) : [];
	return { tickets, selectedId, activity, filters: { q, status }, limit: 1000 };
}

class WorkOrderError extends Error {
	constructor(public status: 400 | 404 | 409, message: string) { super(message); }
}
const reportIdSchema = z.uuid();
const notesSchema = z.string().trim().min(5, 'Add at least 5 characters of notes.').max(2000);
const estimateSchema = z.object({
	length: z.coerce.number().positive().max(1000), width: z.coerce.number().positive().max(1000),
	depth: z.coerce.number().positive().max(1000), density: z.coerce.number().positive().max(10000),
	bagWeight: z.coerce.number().positive().max(10000), bagPrice: z.coerce.number().positive().max(1000000),
	wastePercent: z.coerce.number().min(0).max(100)
});
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
	const parsed = schema.safeParse(value);
	if (!parsed.success) throw new WorkOrderError(400, parsed.error.issues[0]?.message || 'Check the form values.');
	return parsed.data;
}

export type WorkOrderAction = 'assign' | 'startRepair' | 'submitRepair' | 'review' | 'saveEstimate';

export async function updateWorkOrder(event: RequestEvent, action: WorkOrderAction) {
	const user = requireGovernmentUser(event);
	let savedImage: string | null = null;
	let reportId: string | undefined;
	try {
		const form = action === 'submitRepair' ? await readUploadForm(event.request) : await event.request.formData();
		reportId = parse(reportIdSchema, form.get('reportId'));
		const crew = action === 'assign' ? parse(z.string().trim().min(2, 'Enter a crew name.').max(120), form.get('crew')) : null;
		const notes = action === 'submitRepair' || action === 'review' ? parse(notesSchema, form.get('notes')) : null;
		const decision = action === 'review' ? parse(z.enum(['approve', 'return']), form.get('decision')) : null;
		const expectedImage = action === 'review' ? String(form.get('expectedImage') || '') : null;
		const estimate = action === 'saveEstimate' ? calculateMaterialEstimate(parse(estimateSchema, Object.fromEntries(form))) : null;
		if (estimate && ![estimate.volume, estimate.mass, estimate.bags, estimate.cost].every((value) => Number.isFinite(value) && value <= Number.MAX_SAFE_INTEGER)) {
			throw new WorkOrderError(400, 'Estimate is too large. Check the measurements and supplier values.');
		}
		let imageUrl: string | null = null;
		if (action === 'submitRepair') {
			const file = form.get('afterImage');
			if (!(file instanceof File) || !file.size || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new WorkOrderError(400, 'Attach an after photo in JPEG, PNG, or WebP format.');
			const [upload] = await validateMedia([file]);
			await fs.mkdir(MEDIA_DIR, { recursive: true });
			savedImage = path.join(MEDIA_DIR, upload.filename);
			await fs.writeFile(savedImage, upload.buffer, { flag: 'wx' });
			imageUrl = upload.media.url;
		}
		await db.transaction(async (tx) => {
			const [report] = await tx.select().from(reports).where(eq(reports.id, reportId!)).for('update');
			if (!report) throw new WorkOrderError(404, 'This report no longer exists.');
			const [order] = await tx.select().from(workOrders).where(eq(workOrders.reportId, report.id));
			const now = new Date();
			let nextStatus = report.status;
			let eventName: string;
			let description: string;
			const orderChanges: Partial<typeof workOrders.$inferInsert> = { updatedAt: now };
			const reportChanges: Partial<typeof reports.$inferInsert> = { updatedAt: now };
			switch (action) {
				case 'assign':
					if (!['REPORTED', 'DISPATCHED', 'IN_REPAIR'].includes(report.status)) throw new WorkOrderError(409, 'This work order cannot be assigned in its current state.');
					nextStatus = report.status === 'REPORTED' ? 'DISPATCHED' : report.status;
					orderChanges.assignedCrew = crew;
					eventName = 'ASSIGNED'; description = `Assigned to ${crew}.`;
					break;
				case 'startRepair':
					if (report.status !== 'DISPATCHED' || !order?.assignedCrew) throw new WorkOrderError(409, 'Assign a crew before starting repair.');
					nextStatus = 'IN_REPAIR'; eventName = 'STARTED'; description = 'Repair started.';
					break;
				case 'submitRepair':
					if (report.status !== 'IN_REPAIR') throw new WorkOrderError(409, 'Only a work order in repair can be submitted for review.');
					nextStatus = 'AWAITING_REVIEW'; orderChanges.repairNotes = notes; orderChanges.submittedAt = now; orderChanges.reviewedBy = null;
					reportChanges.resolvedImagePath = imageUrl;
					eventName = 'EVIDENCE_SUBMITTED'; description = notes!;
					break;
				case 'review':
					if (report.status !== 'AWAITING_REVIEW' || !report.resolvedImagePath) throw new WorkOrderError(409, 'A saved after photo and pending review are required.');
					if (expectedImage !== report.resolvedImagePath) throw new WorkOrderError(409, 'The repair evidence changed. Refresh and review the latest photo.');
					nextStatus = decision === 'approve' ? 'RESOLVED' : 'IN_REPAIR';
					orderChanges.reviewedBy = decision === 'approve' ? user.id : null;
					eventName = decision === 'approve' ? 'RESOLVED' : 'RETURNED'; description = notes!;
					break;
				case 'saveEstimate':
					if (report.status === 'RESOLVED') throw new WorkOrderError(409, 'Resolved work orders keep their saved estimate.');
					orderChanges.estimate = estimate;
					eventName = 'ESTIMATE_SAVED'; description = `Planning estimate: ${estimate!.bags} bags, PHP ${estimate!.cost.toFixed(2)} materials.`;
					break;
			}
			reportChanges.status = nextStatus;
			await tx.update(reports).set(reportChanges).where(eq(reports.id, report.id));
			await tx.insert(workOrders).values({ reportId: report.id, ...orderChanges }).onConflictDoUpdate({ target: workOrders.reportId, set: orderChanges });
			await tx.insert(workOrderEvents).values({ reportId: report.id, actorId: user.id, event: eventName, description, imagePath: imageUrl });
		});
		return { success: action === 'saveEstimate' ? 'Estimate saved.' : 'Work order updated.', reportId };
	} catch (cause) {
		if (savedImage) await fs.rm(savedImage, { force: true }).catch(() => {});
		if (cause instanceof WorkOrderError) return fail(cause.status, { error: cause.message, reportId });
		if (isHttpError(cause)) return fail(cause.status, { error: cause.body.message, reportId });
		throw cause;
	}
}

/** Quote CSV cells and neutralize spreadsheet formulas in user-entered text. */
export function csvCell(value: unknown) {
	let text = String(value ?? '');
	if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
	return `"${text.replaceAll('"', '""')}"`;
}
