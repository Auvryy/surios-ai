import nodemailer from 'nodemailer';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
if (existsSync('.env')) loadEnvFile('.env');
const env = process.env;
import { and, eq, lte, lt, gte } from 'drizzle-orm';
import { db, emailOutbox, users } from './db';

export function mailConfiguration() {
	if (!env.SMTP_HOST || !env.SMTP_FROM || !env.APP_ORIGIN) return null;
	try {
		const origin = new URL(env.APP_ORIGIN);
		if (origin.protocol !== 'https:' && !(env.NODE_ENV !== 'production' && origin.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname))) return null;
		const port = Number(env.SMTP_PORT || 587);
		if (!Number.isInteger(port) || port < 1 || port > 65535 || Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASS)) return null;
		return { origin: origin.origin, host: env.SMTP_HOST, from: env.SMTP_FROM, port };
	} catch { return null; }
}
export function emailPreferences(settings: unknown) {
	const value = settings as Record<string, unknown> | null;
	return { emailComments: value?.emailComments === true, emailConfirmations: value?.emailConfirmations === true };
}
export async function sendEmail(to: string, subject: string, text: string, id?: string) {
	const config = mailConfiguration();
	if (!config) throw new Error('Email delivery is unavailable.');
	const secure = env.SMTP_SECURE === 'true' || config.port === 465;
	const transport = nodemailer.createTransport({
		host: config.host, port: config.port, secure,
		requireTLS: env.NODE_ENV === 'production' && !secure,
		auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
		connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 10000,
		disableFileAccess: true, disableUrlAccess: true
	});
	const result = await transport.sendMail({ from: config.from, to, subject, text, messageId: id ? `<${id}@${new URL(config.origin).hostname}>` : undefined });
	if (!result.accepted?.length) throw new Error('Email delivery was not accepted.');
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export async function queuePostEmail(tx: Transaction, input: { recipients: string[]; actorId: string; actorName: string; postId: string; postTitle: string; eventKey: string; topic: 'comments' | 'confirmations'; reply?: boolean }) {
	const config = mailConfiguration();
	if (!config) return;
	for (const userId of new Set(input.recipients.filter((id) => id !== input.actorId))) {
		const subject = input.topic === 'confirmations' ? 'Your road update was confirmed' : input.reply ? 'New reply on SuriOS' : 'New comment on SuriOS';
		const action = input.topic === 'confirmations' ? 'confirmed' : input.reply ? 'replied to a comment on' : 'commented on';
		await tx.insert(emailOutbox).values({ userId, topic: input.topic, eventKey: `${input.eventKey}:${userId}`, subject,
			body: `${input.actorName} ${action} “${input.postTitle}”.\n\nOpen the conversation:\n${config.origin}/community?q=${input.postId}#post-${input.postId}\n\nEmail preferences:\n${config.origin}/settings`
		}).onConflictDoNothing();
	}
}
let delivering = false;
export async function deliverPendingEmails() {
	if (delivering || !mailConfiguration()) return;
	delivering = true;
	try {
		await db.update(emailOutbox).set({ status: 'failed' }).where(and(eq(emailOutbox.status, 'pending'), gte(emailOutbox.attempts, 5), lte(emailOutbox.nextAttemptAt, new Date())));
		const pending = await db.transaction(async (tx) => {
			const rows = await tx.select().from(emailOutbox).where(and(eq(emailOutbox.status, 'pending'), lte(emailOutbox.nextAttemptAt, new Date()), lt(emailOutbox.attempts, 5))).limit(5).for('update', { skipLocked: true });
			for (const row of rows) await tx.update(emailOutbox).set({ attempts: row.attempts + 1, nextAttemptAt: new Date(Date.now() + 120000) }).where(eq(emailOutbox.id, row.id));
			return rows;
		});
		for (const mail of pending) {
			const [user] = await db.select({ email: users.email, settings: users.settings }).from(users).where(eq(users.id, mail.userId));
			const preferences = emailPreferences(user?.settings);
			if (!user || !(mail.topic === 'comments' ? preferences.emailComments : preferences.emailConfirmations)) {
				await db.update(emailOutbox).set({ status: 'skipped' }).where(eq(emailOutbox.id, mail.id)); continue;
			}
			try {
				await sendEmail(user.email, mail.subject, mail.body, mail.id);
				await db.update(emailOutbox).set({ status: 'sent', sentAt: new Date() }).where(eq(emailOutbox.id, mail.id));
			} catch {
				await db.update(emailOutbox).set({ status: mail.attempts >= 4 ? 'failed' : 'pending', nextAttemptAt: new Date(Date.now() + 60000 * 2 ** mail.attempts) }).where(eq(emailOutbox.id, mail.id));
			}
		}
	} finally { delivering = false; }
}
let worker: ReturnType<typeof setInterval> | undefined;
export function startEmailWorker() {
	if (worker) return;
	worker = setInterval(() => { void deliverPendingEmails().catch(() => console.warn('[Email] Delivery will retry.')); }, 5000);
	worker.unref?.();
}
