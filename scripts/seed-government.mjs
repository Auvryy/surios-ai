import postgres from 'postgres';
import { randomUUID, scryptSync } from 'node:crypto';
import { mkdir, writeFile, rm } from 'node:fs/promises';

// Explicit presentation dataset only; never called by application startup.
const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const createdFiles = [];
function pdf(lines) {
	const content = `BT /F1 16 Tf 50 760 Td ${lines.map((line, index) => `${index ? '0 -28 Td ' : ''}(${line.replace(/[()\\]/g, '\\$&')}) Tj`).join('\n')} ET`;
	const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`];
	let text = '%PDF-1.4\n'; const offsets = [0];
	objects.forEach((object, i) => { offsets.push(Buffer.byteLength(text)); text += `${i + 1} 0 obj\n${object}\nendobj\n`; });
	const xref = Buffer.byteLength(text);
	text += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
	return text;
}
try {
	await sql.begin(async tx => {
		await tx`select pg_advisory_xact_lock(76489215)`;
		const email = 'municipality@surios.gov';
		const [existing] = await tx`select id from community_reposts where government_update->>'demoKey' = 'government-quotes-v1' limit 1`;
		if (existing) { console.log('Government presentation example already exists; retained its posts and status.'); return; }
		const [source] = await tx`select p.id, p.report_id from community_posts p join reports r on r.id = p.report_id where r.triage_payload->>'seedKey' = 'community-presentation-v1' and r.distress_type = 'pothole' order by p.created_at, p.id limit 1`;
		if (!source) throw new Error('Run the app and seed-community.mjs first. Only labeled demo reports can be used by this seed.');
		const salt = randomUUID();
		const passwordHash = `${salt}:${scryptSync('Password123!', salt, 64).toString('hex')}`;
		const profile = { level: 'MUNICIPAL', jurisdiction: 'Santa Cruz, Laguna (demo)', bio: 'Demonstration municipal account. Progress updates, evidence documents and illustrative budgets shown here are sample data, not real government actions.' };
		await tx`insert into users (email, name, password_hash, role, government_profile) values (${email}, 'Demo · Santa Cruz Municipal Office', ${passwordHash}, 'ENGINEER', ${tx.json(profile)}) on conflict (email) do nothing`;
		const [office] = await tx`select id, role from users where email = ${email}`;
		if (office.role !== 'ENGINEER') throw new Error('Demo office email is used by a different role.');
		await mkdir(new URL('../static/uploads/community/', import.meta.url), { recursive: true });
		for (const [index, status] of ['IN_PROGRESS', 'RESOLVED'].entries()) {
			const id = randomUUID();
			const name = status === 'RESOLVED' ? 'Demo completion record.pdf' : 'Demo work instruction.pdf';
			const file = new URL(`../static/uploads/community/${id}.pdf`, import.meta.url); createdFiles.push(file);
			await writeFile(file, pdf(['DEMONSTRATION ONLY - SuriOS', name.replace('.pdf', ''), 'Sample municipal road maintenance record', status === 'RESOLVED' ? 'Illustrative status: Resolved' : 'Illustrative status: In progress', 'Materials: PHP 2,500.00', 'Labor: PHP 1,500.00', 'Equipment and traffic control: PHP 1,000.00', 'Total illustrative budget: PHP 5,000.00', 'No actual work, spending or certification is claimed.']));
			const update = { demoKey: 'government-quotes-v1', status, budgetType: status === 'RESOLVED' ? 'ACTUAL' : 'ESTIMATED', budget: [{ label: 'Materials (demo)', amount: 2500 }, { label: 'Labor (demo)', amount: 1500 }, { label: 'Equipment and traffic control (demo)', amount: 1000 }], attachments: [{ id, url: `/media/${id}.pdf`, name, mimeType: 'application/pdf', kind: 'document' }] };
			const body = status === 'RESOLVED' ? 'DEMO · This sample pothole is marked resolved to demonstrate the complete workflow. The attached illustrative completion record and PHP 5,000 budget are not evidence of real repairs or actual government spending. All posts linked to this sample hazard now show Resolved.' : 'DEMO · Our sample municipal office has instructed maintenance on this reported pothole. The attached work instruction and estimated PHP 5,000 budget are illustrative. This update demonstrates In progress across linked posts.';
			await tx`insert into community_reposts (user_id, post_id, body, media, government_update, created_at) values (${office.id}, ${source.id}, ${body}, '[]', ${tx.json(update)}, clock_timestamp() - ${index ? '0 seconds' : '1 day'}::interval)`;
			await tx`insert into work_order_events (report_id, actor_id, event, description, image_path) values (${source.report_id}, ${office.id}, ${status}, ${body}, ${update.attachments[0].url})`;
		}
		await tx`update reports set status = 'RESOLVED', resolved_image_path = null, updated_at = now() where id = ${source.report_id}`;
		console.log('Seeded demo municipal profile, In progress and Resolved quote updates, PDFs and a PHP 5,000 illustrative budget. All linked demo posts share the resolved status.');
	});
} catch (error) { await Promise.all(createdFiles.map(file => rm(file, { force: true }))); throw error; }
finally { await sql.end(); }
