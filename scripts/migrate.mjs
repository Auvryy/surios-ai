import postgres from 'postgres';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../drizzle/', import.meta.url);
const journal = JSON.parse(await readFile(new URL('meta/_journal.json', root), 'utf8'));
const migrations = await Promise.all(journal.entries.map(async entry => {
	const name = `${entry.tag}.sql`;
	const source = await readFile(new URL(name, root), 'utf8');
	const snapshot = JSON.parse(await readFile(new URL(`meta/${String(entry.idx).padStart(4, '0')}_snapshot.json`, root), 'utf8'));
	return { name, source, snapshot, hash: createHash('sha256').update(source).digest('hex') };
}));
const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/surios', { max: 1 });
const normalize = value => value.replace(/\s/g, '').toLowerCase();
try {
	await sql.begin(async tx => {
		await tx`select pg_advisory_xact_lock(76489217)`;
		await tx`create table if not exists _surios_migrations (name text primary key, hash text not null, applied_at timestamptz not null default now())`;
		let applied = await tx`select name,hash from _surios_migrations`;
		if (!applied.length) {
			// Adopt deployments initialized with the old manual SQL/db:push flow.
			// Only baseline snapshots whose full recorded structure is present.
			const columns = await tx`select c.relname as table_name, a.attname as column_name, format_type(a.atttypid,a.atttypmod) as type, a.attnotnull as not_null from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and a.attnum>0 and not a.attisdropped`;
			const constraints = await tx`select conname as name from pg_constraint where connamespace='public'::regnamespace union select indexname as name from pg_indexes where schemaname='public'`;
			const objects = new Set(constraints.map(row => row.name));
			const names = new Map(columns.map(row => [`${row.table_name}.${row.column_name}`, row]));
			let baseline = -1;
			for (const [index, migration] of migrations.entries()) {
				const matches = Object.values(migration.snapshot.tables).every(table =>
					Object.values(table.columns).every(column => {
						const actual = names.get(`${table.name}.${column.name}`);
						return actual && normalize(actual.type) === normalize(column.type) && (!column.notNull || actual.not_null);
					}) && ['indexes', 'foreignKeys', 'compositePrimaryKeys', 'uniqueConstraints'].every(key => Object.values(table[key] || {}).every(item => objects.has(item.name.slice(0, 63))))
				);
				if (matches) baseline = index;
			}
			if (baseline >= 0) {
				for (const migration of migrations.slice(0, baseline + 1)) await tx`insert into _surios_migrations (name,hash) values (${migration.name},${migration.hash})`;
				console.log(`Adopted existing schema through ${migrations[baseline].name}; existing records retained.`);
				applied = await tx`select name,hash from _surios_migrations`;
			}
		}
		const saved = new Map(applied.map(row => [row.name, row.hash]));
		for (const migration of migrations) {
			if (saved.has(migration.name)) {
				if (saved.get(migration.name) !== migration.hash) throw new Error(`Previously applied migration changed: ${migration.name}`);
				continue;
			}
			for (const statement of migration.source.split('--> statement-breakpoint').map(value => value.trim()).filter(Boolean)) await tx.unsafe(statement);
			await tx`insert into _surios_migrations (name,hash) values (${migration.name},${migration.hash})`;
			console.log(`Applied ${migration.name}`);
		}
		console.log('Database migrations complete.');
	});
} finally { await sql.end(); }
