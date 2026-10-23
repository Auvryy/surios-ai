import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const temp = mkdtempSync(path.join(root, '.svelte-kit/helper-test-'));
writeFileSync(path.join(temp, 'package.json'), '{"type":"commonjs"}');
const log = path.join(temp, 'docker.jsonl');
const fake = path.join(temp, 'docker');
writeFileSync(fake, `#!/usr/bin/env node\nrequire('node:fs').appendFileSync(process.env.DOCKER_TEST_LOG,JSON.stringify({args:process.argv.slice(2),hasPassword:!!process.env.ADMIN_PASSWORD})+'\\n');\nif(process.env.FAIL_DOCKER==='1')process.exit(9);\n`, { mode: 0o755 });
function run(args, input = '', extra = {}) {
	writeFileSync(log, '');
	const result = spawnSync('bash', [path.join(root, 'surios.sh'), ...args], { cwd: temp, encoding: 'utf8', input, env: { ...process.env, ADMIN_EMAIL: '', ADMIN_PASSWORD: '', PATH: `${temp}:${process.env.PATH}`, DOCKER_TEST_LOG: log, ...extra } });
	return { ...result, calls: readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) };
}
test('build migrates before starting, retains volumes, works from another directory', () => {
	const result = run(['build']); assert.equal(result.status, 0);
	const calls = result.calls.map(call => call.args);
	assert(calls.every(args => args.includes(path.join(root, 'docker-compose.prod.yml'))));
	assert.deepEqual(calls.map(args => args.slice(5)), [['build', 'web'], ['up', '-d', '--wait', 'db'], ['run', '--rm', 'web', 'node', 'scripts/migrate.mjs'], ['up', '-d', 'web']]);
});
test('seed runs migrations before importing and then starts web', () => {
	const result = run(['seed']); assert.equal(result.status, 0);
	const commands = result.calls.map(call => call.args.join(' '));
	assert(commands[2].endsWith('node scripts/migrate.mjs'));
	assert(commands[3].endsWith('node scripts/seed-presentation.mjs'));
	assert(commands[4].endsWith('up -d web'));
});
test('fresh requires confirmation and explicitly resets database and uploads', () => {
	assert.equal(run(['fresh'], 'cancel\n').status, 1);
	assert.equal(run(['fresh'], 'cancel\n').calls.length, 0);
	const accepted = run(['fresh'], 'fresh\n'); assert.equal(accepted.status, 0);
	assert(accepted.calls[0].args.join(' ').endsWith('down -v'));
	assert.equal(run(['fresh', '--yes']).status, 0);
	assert.equal(run(['build', '--yes']).status, 2);
	assert.equal(run(['nonsense']).calls.length, 0);
});
test('admin prompts privately and passes credentials through environment instead of command arguments', () => {
	const result = run(['admin'], 'admin@example.test\nPrivateAdmin123!\nPrivateAdmin123!\n');
	assert.equal(result.status, 0);
	const call = result.calls.find(call => call.args.includes('scripts/create-admin.mjs'));
	assert(call); assert.equal(call.hasPassword, true);
	assert(!JSON.stringify(result.calls).includes('PrivateAdmin123!'));
	assert(!(result.stdout + result.stderr).includes('PrivateAdmin123!'));
	assert.equal(run(['admin'], 'admin@example.test\none\ntwo\n').calls.length, 0);
});
test('Docker failures stop deployment before further commands', () => {
	const result = run(['build'], '', { FAIL_DOCKER: '1' }); assert.equal(result.status, 9); assert.equal(result.calls.length, 1);
});
process.on('exit', () => rmSync(temp, { recursive: true, force: true }));
