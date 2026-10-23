<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance, type SubmitFunction } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { WORK_ORDER_STATUSES, workOrderStatusLabel, type WorkOrderStatus } from '$lib/types/work-orders';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import PrinterIcon from '@lucide/svelte/icons/printer';
	import SearchIcon from '@lucide/svelte/icons/search';
	let { data, form }: PageProps = $props();
	let busy = $state(false);
	let estimateDetails = $state<HTMLDetailsElement>();
	let estimateWasOpen = false;
	function beforePrint() { if (estimateDetails) { estimateWasOpen = estimateDetails.open; estimateDetails.open = true; } }
	function afterPrint() { if (estimateDetails) estimateDetails.open = estimateWasOpen; }
	const ticket = $derived(data.tickets.find((item) => item.id === data.selectedId));
	const query = $derived(new URLSearchParams({ q: data.filters.q, status: data.filters.status }).toString());
	const submit: SubmitFunction = () => {
		busy = true;
		return async ({ update }) => { try { await update(); } finally { busy = false; } };
	};
	function statusLabel(status: string) { return workOrderStatusLabel[status as WorkOrderStatus] || status.replaceAll('_', ' '); }
	function timestamp(value: string | Date) { return new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }); }
	function pesos(value: number) { return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value); }
</script>

<svelte:head><title>Work orders — SuriOS</title></svelte:head>
<svelte:window onbeforeprint={beforePrint} onafterprint={afterPrint} />

<div class="work-orders mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
	<header class="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
		<div><h1 class="text-xl font-semibold tracking-tight">Work orders</h1><p class="mt-1 text-sm text-muted-foreground">Assign, repair, and review road reports.</p></div>
		<div class="flex items-center gap-2"><Button variant="ghost" size="sm" onclick={() => invalidateAll()}>Refresh</Button><Button href="/dashboard/export?{query}" download variant="outline" size="sm"><DownloadIcon class="size-4" />Export CSV</Button></div>
	</header>
	{#if form?.error}<p role="alert" class="no-print mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{form.error}</p>{/if}
	{#if form?.success}<p role="status" class="no-print mb-4 rounded-lg border border-border p-3 text-sm">{form.success}</p>{/if}
	<form action="/dashboard" method="GET" class="no-print mb-5 flex flex-wrap gap-2">
		<div class="relative min-w-48 flex-1"><SearchIcon class="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input name="q" value={data.filters.q} aria-label="Search work orders" placeholder="Search reports, locations, or crews" class="h-10 pl-9" /></div>
		<select name="status" value={data.filters.status} aria-label="Work order status" class="h-10 max-w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">All statuses</option>{#each WORK_ORDER_STATUSES as status}<option value={status}>{statusLabel(status)}</option>{/each}</select>
		<Button type="submit" variant="outline" class="h-10">Filter</Button>
	</form>
	{#if data.tickets.length}
		<div class="workspace-grid grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
			<section aria-label="Work order queue" class="no-print overflow-hidden rounded-xl border border-border bg-card">
				<div class="border-b border-border px-4 py-3 text-xs text-muted-foreground">{data.tickets.length} matching {data.tickets.length === 1 ? 'report' : 'reports'}{data.tickets.length === data.limit ? ' · latest 1,000' : ''}</div>
				<div class="max-h-72 overflow-y-auto lg:max-h-[75vh]">
					{#each data.tickets as item (item.id)}
						<a href="/dashboard?{query}&report={item.id}#work-order" aria-current={ticket?.id === item.id ? 'true' : undefined} class="block border-b border-border px-4 py-4 last:border-b-0 hover:bg-secondary {ticket?.id === item.id ? 'bg-primary/5' : ''}">
							<span class="flex items-start justify-between gap-3"><span class="line-clamp-2 text-sm font-medium">{item.title}</span><span class="shrink-0 text-xs font-medium {item.severity >= 8 ? 'text-destructive' : 'text-muted-foreground'}">{item.severity}/10</span></span>
							<span class="mt-1.5 block truncate text-xs text-muted-foreground">{item.location}</span><span class="mt-2 block text-xs text-muted-foreground">{statusLabel(item.status)}</span>
						</a>
					{/each}
				</div>
			</section>
			{#if ticket}
				{#key ticket.id}
				<section id="work-order" aria-label="Work order details" class="print-record min-w-0 scroll-mt-20 rounded-xl border border-border bg-card">
					<header class="border-b border-border p-4 sm:p-5">
						<div class="flex flex-wrap items-start justify-between gap-3"><div class="min-w-0 flex-1"><p class="break-all font-mono text-[10px] text-muted-foreground">{ticket.id}</p><h2 class="mt-1 text-lg font-semibold leading-snug">{ticket.title}</h2><p class="mt-1 text-sm text-muted-foreground">{ticket.location}</p></div><button onclick={() => window.print()} class="no-print flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs hover:bg-secondary"><PrinterIcon class="size-4" />Print record</button></div>
						<div class="mt-4 flex flex-wrap items-center gap-2 text-xs"><span class="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">{statusLabel(ticket.status)}</span><span class="rounded-md bg-secondary px-2 py-1">Severity {ticket.severity}/10</span><span class="text-muted-foreground">Reported {timestamp(ticket.createdAt)}</span></div>
						<div class="no-print mt-3 flex flex-wrap gap-4 text-xs font-medium text-primary"><a href="/map?report={ticket.id}">View on map</a>{#if ticket.posts[0]}<a href="/community?q={ticket.posts[0].id}">View citizen report</a>{/if}</div>
					</header>
					<div class="space-y-6 p-4 sm:p-5">
						<section class="space-y-3" aria-label="Repair evidence">
							<div class="grid gap-3 {ticket.afterImage ? 'sm:grid-cols-2' : ''}">
								<figure><div class="aspect-[3/2] overflow-hidden rounded-lg border border-border bg-muted">{#if ticket.mediaKind === 'video'}<video src={ticket.imageUrl} controls muted playsinline class="size-full object-cover"></video>{:else}<img src={ticket.imageUrl} alt="Reported road damage" class="size-full object-cover" />{/if}</div><figcaption class="mt-2 text-xs text-muted-foreground">Before · reported damage</figcaption></figure>
								{#if ticket.afterImage}<figure><a href={ticket.afterImage} target="_blank" rel="noreferrer"><img src={ticket.afterImage} alt="Submitted road repair" class="aspect-[3/2] w-full rounded-lg border border-border object-cover" /></a><figcaption class="mt-2 text-xs text-muted-foreground">After · {ticket.status === 'RESOLVED' ? 'reviewed repair' : 'submitted evidence'}</figcaption></figure>{/if}
							</div>
							<p class="text-sm leading-relaxed">{ticket.analysis.recommendedAction}</p>
						</section>
						<section aria-label="Assignment" class="border-t border-border pt-5">
							<h3 class="mb-3 text-sm font-semibold">Assignment</h3>
							{#if ['REPORTED', 'DISPATCHED', 'IN_REPAIR'].includes(ticket.status)}
								<form method="POST" action="/dashboard?{query}&report={ticket.id}&/assign" use:enhance={submit} class="no-print flex flex-wrap items-end gap-2"><input type="hidden" name="reportId" value={ticket.id} /><label class="min-w-40 flex-1 space-y-1 text-xs"><span>Crew</span><Input name="crew" aria-label="Crew" value={ticket.order?.assignedCrew || ''} required minlength={2} maxlength={120} placeholder="Crew or maintenance team" /></label><Button type="submit" disabled={busy} variant="outline">{ticket.order?.assignedCrew ? 'Update crew' : 'Assign crew'}</Button></form>
								<p class="print-only text-sm">{ticket.order?.assignedCrew || 'Unassigned'}</p>
							{:else}<p class="text-sm">{ticket.order?.assignedCrew || 'Unassigned'}</p>{/if}
							{#if ticket.status === 'DISPATCHED'}<form method="POST" action="/dashboard?{query}&report={ticket.id}&/startRepair" use:enhance={submit} class="no-print mt-3"><input type="hidden" name="reportId" value={ticket.id} /><Button type="submit" disabled={busy}>Start repair</Button></form>{/if}
						</section>
						{#if ticket.status === 'IN_REPAIR'}
							<form method="POST" action="/dashboard?{query}&report={ticket.id}&/submitRepair" enctype="multipart/form-data" use:enhance={submit} class="no-print space-y-3 border-t border-border pt-5"><h3 class="text-sm font-semibold">Submit repair</h3><input type="hidden" name="reportId" value={ticket.id} /><label class="block space-y-1 text-xs"><span>After photo</span><Input type="file" name="afterImage" aria-label="After photo" accept="image/jpeg,image/png,image/webp" required class="h-auto py-2" /></label><p class="text-xs text-muted-foreground">JPEG, PNG or WebP · up to 10 MB</p><label class="block space-y-1 text-xs"><span>Repair notes</span><textarea name="notes" aria-label="Repair notes" required minlength={5} maxlength={2000} rows={3} class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Work completed and any remaining issues"></textarea></label><Button type="submit" disabled={busy}>Submit for review</Button></form>
						{/if}
						{#if ticket.status === 'AWAITING_REVIEW'}
							<form method="POST" action="/dashboard?{query}&report={ticket.id}&/review" use:enhance={submit} class="no-print space-y-3 border-t border-border pt-5"><h3 class="text-sm font-semibold">Review repair</h3><input type="hidden" name="reportId" value={ticket.id} /><input type="hidden" name="expectedImage" value={ticket.afterImage || ''} /><label class="block space-y-1 text-xs"><span>Review notes</span><textarea name="notes" aria-label="Review notes" required minlength={5} maxlength={2000} rows={3} class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Record your assessment of the repair evidence"></textarea></label><div class="flex flex-wrap gap-2"><Button type="submit" name="decision" value="approve" disabled={busy || !ticket.afterImage}>Approve repair</Button><Button type="submit" name="decision" value="return" variant="outline" disabled={busy || !ticket.afterImage}>Return for repair</Button></div></form>
						{/if}
						<details bind:this={estimateDetails} class="border-t border-border pt-5">
							<summary class="cursor-pointer text-sm font-semibold">Material estimate{#if ticket.order?.estimate}<span class="ml-2 text-xs font-normal text-muted-foreground">{ticket.order.estimate.bags} bags · {pesos(ticket.order.estimate.cost)}</span>{/if}</summary>
							<p class="mt-3 text-xs leading-relaxed text-muted-foreground">Planning estimate from entered measurements and supplier values. Materials only; excludes labor and base repairs.</p>
							{#if ticket.order?.estimate}<p class="mt-3 text-sm">{ticket.order.estimate.volume.toFixed(3)} m³ · {ticket.order.estimate.mass.toFixed(1)} kg including allowance</p>{/if}
							{#if ticket.status !== 'RESOLVED'}<form method="POST" action="/dashboard?{query}&report={ticket.id}&/saveEstimate" use:enhance={submit} class="no-print mt-4 space-y-3"><input type="hidden" name="reportId" value={ticket.id} /><div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
								{#each [{ name: 'length', label: 'Length (m)', max: 1000 }, { name: 'width', label: 'Width (m)', max: 1000 }, { name: 'depth', label: 'Depth (mm)', max: 1000 }, { name: 'density', label: 'Density (kg/m³)', max: 10000 }, { name: 'bagWeight', label: 'Bag weight (kg)', max: 10000 }, { name: 'bagPrice', label: 'Price per bag (PHP)', max: 1000000 }, { name: 'wastePercent', label: 'Allowance (%)', max: 100 }] as field}<label class="space-y-1 text-xs"><span>{field.label}</span><Input type="number" name={field.name} aria-label={field.label} value={ticket.order?.estimate?.[field.name as keyof typeof ticket.order.estimate] ?? (field.name === 'wastePercent' ? 0 : '')} required step="any" min={field.name === 'wastePercent' ? 0 : 0.001} max={field.max} /></label>{/each}
							</div><Button type="submit" variant="outline" disabled={busy}>Save estimate</Button></form>{/if}
						</details>
						<section aria-label="Activity" class="border-t border-border pt-5"><h3 class="mb-3 text-sm font-semibold">Activity</h3>{#if data.activity.length}<ol class="space-y-4">{#each data.activity as event (event.id)}<li><p class="whitespace-pre-wrap text-sm leading-relaxed">{event.description}</p><p class="mt-1 text-xs text-muted-foreground">{event.actor || 'Former team member'} · {timestamp(event.createdAt)}</p>{#if event.imagePath}<a href={event.imagePath} target="_blank" rel="noreferrer" class="mt-1 inline-block text-xs font-medium text-primary">View submitted evidence</a>{/if}</li>{/each}</ol>{:else}<p class="text-xs text-muted-foreground">No work recorded yet.</p>{/if}</section>
					</div>
				</section>
				{/key}
			{/if}
		</div>
	{:else}<div class="rounded-xl border border-border bg-card px-5 py-16 text-center"><h2 class="text-sm font-medium">No matching work orders</h2><p class="mt-2 text-sm text-muted-foreground">{data.filters.q || data.filters.status ? 'Try another search or status.' : 'Saved road reports will appear here.'}</p>{#if data.filters.q || data.filters.status}<Button href="/dashboard" variant="outline" class="mt-4">Clear filters</Button>{/if}</div>{/if}
</div>

<style>
	.print-only { display: none; }
	@media print {
		.no-print { display: none !important; }
		.print-only { display: block; }
		.workspace-grid { display: block; }
		.work-orders { max-width: none; padding: 0; }
		.print-record { border: 0; border-radius: 0; }
		.print-record figure, .print-record li { break-inside: avoid; }
		.print-record details { display: block; }
		.print-record details > * { display: block; }
	}
</style>
