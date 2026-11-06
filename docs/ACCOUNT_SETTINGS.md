# Account settings

`/settings` requires sign-in and contains only **Email notifications** and **Password & security**. The old diagnostics, jurisdiction labels, map-layout controls, engineering thresholds, multipliers, forwarding switches, and reset-to-engineering-defaults UI have been removed. The app uses a fixed light appearance.

## Email notifications

Both categories are off until the user opts in:

- **Comments and replies:** comments on the user's posts, and replies to the user's comments.
- **Post confirmations:** another person confirms the user's post.

Preferences are stored in the signed-in user's `users.settings` JSON. Saves merge only these two fields, preserving unrelated legacy preferences. The returned appearance is always light. No target user can be supplied. The destination is the account's email address; public profiles do not expose it.

Post/comment mutations and outbox events commit together. Self-notifications are excluded, recipients are deduplicated, and toggling the same user's confirmation does not send repeated emails. Each message links to the exact saved community post and to Settings. The delivery worker rechecks preferences before sending, so queued messages can be skipped after opting out.

The Node server polls the persisted outbox every five seconds. Workers claim batches under database locks with a two-minute lease. Failed sends retry with backoff, up to five attempts. The queue survives restarts; an interrupted SMTP acknowledgement can cause an at-least-once delivery, so delivery is not claimed to be exactly once. Failed and skipped messages retain their state for inspection.

## Mail setup

SuriOS sends mail through its existing Nodemailer SMTP transport. For Resend, verify a sending domain in the Resend dashboard and publish the DNS records it provides. Create a sending API key, then store it server-side as `SMTP_PASS`; do not put it in this repository, the mobile app, or a chat message. Resend's SMTP settings are documented in its [SMTP guide](https://resend.com/docs/send-with-smtp).

Configure these server-only values in the production environment or the VM's ignored `.env` file:

```dotenv
APP_ORIGIN=https://surios.site
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_FROM="SuriOS <no-reply@your-verified-domain>"
SMTP_USER=resend
SMTP_PASS=your-resend-sending-api-key
SMTP_SECURE=true
```

Replace the example sender with an address at the domain Resend verified for sending. Port 465 uses implicit TLS; port 587 uses STARTTLS. Production requires an HTTPS `APP_ORIGIN`; localhost HTTP is supported in development. Production Compose already forwards these variables to the web container. Recreate the web service after changing the configuration.

Without mail configuration, existing accounts can still sign in, but new registrations are paused because they cannot complete verification. Password recovery and optional notification email also need the sender configuration. Notification events generated while mail is unconfigured are not backfilled later. Ordinary password changes remain available. No credentials are committed or printed.

## Email verification

New citizen and government registrations receive a 6-digit email code that expires after 10 minutes. The `users` row is created only after the code is confirmed; government applicants then remain pending administrator approval. Codes allow five attempts and five sends per hour, with at least one minute between sends. Migration `0015_email-verification.sql` marks existing users verified so deployment does not lock out current accounts. `/verify-email` remains available for legacy verification links that were already sent.

## Password security

**Change password** verifies the current password and requires matching new passwords of 8–128 characters. Passwords use the existing salted scrypt storage. Successful changes revoke other sessions, keep the current session, and invalidate outstanding reset links. The legacy profile password action delegates to the same implementation.

**Email reset code** in Settings and **Forgot password?** on the sign-in page open a code-entry modal to choose a new password. Responses do not reveal whether an email address exists. Recovery requests are limited per IP (ten per fifteen minutes per Node process); successful code issuance is limited per account (five per hour with at least a minute between requests). For multiple server instances, put the IP limit in a shared limiter; account limits already use database locks.

New password reset codes expire after 10 minutes, allow five attempts, and are stored only as salted hashes in `password_resets`. Each new request invalidates previous codes. Previously issued 30-minute reset links remain valid for backward compatibility. Recovery pages disable caching and referrer forwarding. Successful resets revoke all sessions and require signing in again. Failed email delivery invalidates the new code. The signed-in Settings action reports delivery errors. The public recovery form keeps the same neutral response for existing and unknown accounts, including delivery failures, to avoid disclosing account existence.

## Upgrade and verification

The production build migration runner applies `0015_email-verification.sql` and `0016_email_otp.sql` after migration `0014`. The first marks existing users verified and adds legacy verification tokens. The second adds pending registrations and OTP reset fields; it preserves existing accounts, posts, sessions and uploads. Deployments that still apply SQL files manually must apply all earlier migrations in order before `0015`.

For older deployments that have not yet applied the email outbox and password-recovery change, apply migration `0005` after `0004` before starting that version:

```bash
docker compose exec -T surios-db psql -U postgres -d surios -v ON_ERROR_STOP=1 -1 < drizzle/0005_account-settings.sql
```

Use the normal migration runner instead if the database is managed by Drizzle's journal. The migration adds the email outbox and password-reset tables and changes new-account preference defaults; existing users/posts/comments are preserved.

Run `npm run check`, `npm run build`, and `npm run test:community`. Browser tests use a loopback-only SMTP receiver and isolated accounts. They verify preference persistence and ownership, responsive settings, actual SMTP messages and OTPs, opt-outs, self-alert suppression, confirmation deduplication, retrying failed sends, current-password verification, session revocation, single-use reset flows, and failure feedback. Test configuration overrides SMTP values to prevent sending real email. Fixtures and sessions are removed afterward.


## Registration and government approval

`/register` offers Citizen and Government in development and production. Both account types require a password and matching confirmation. Each field has its own Show/Hide eye button, preserving the entered value without submitting the form. Matching is enforced server-side, including without JavaScript; failed forms never return password values. Citizens become active immediately. Government applications require a full name, email/password, office/department, municipal/city or barangay level, work location/jurisdiction, and a government ID number. The location uses the existing `government_profile` fields, so it appears on the approved office profile. The ID number is stored privately in `badge_number`, visible only to its owner and administrators, and is excluded from public profile/feed payloads. No ID image upload is required.

New government applications use role `OFFICER` with `account_status=PENDING`. Pending/rejected accounts land on `/account-status` and cannot use protected application routes or APIs, including government posting and profile mutations. Admins review the submitted location/office/ID at `/admin`, then approve or reject. Approval records the reviewer and timestamp. It is a human review workflow; SuriOS does not claim automated identity verification. Public signup cannot create admins or bypass status checks.

Admins can deactivate/reactivate existing citizen and government accounts. Deactivation removes sessions and blocks sign-in; reactivation requires a new sign-in. Pending accounts can only be approved/rejected, not activated through the status toggle. Admin accounts cannot be changed through this screen. Existing accounts remain active when migration `0012_account-approval.sql` is applied.

Create the initial administrator on Azure with `./surios.sh admin`; it prompts privately for credentials. There is no fixed production admin password. Direct script usage is `node --env-file-if-exists=.env scripts/create-admin.mjs` with `ADMIN_EMAIL` and `ADMIN_PASSWORD` provided in the process environment. It refuses to promote an existing non-admin email and never resets an existing admin's password.

Verification: `DATABASE_URL=<isolated-test-db> npx playwright test -c playwright.approval.config.ts` exercises signup, required government details, pending access denial, admin review, approval, rejection, activation/deactivation and mobile layouts. `node --test tests/docker-helper.mjs` checks deployment ordering, reset confirmation, credential handling and failure propagation without touching Docker resources.
