# Account settings

`/settings` requires sign-in and contains only **Email notifications** and **Password & security**. The old diagnostics, jurisdiction labels, map-layout controls, engineering thresholds, multipliers, forwarding switches, and reset-to-engineering-defaults UI have been removed. Appearance remains available in the app navigation.

## Email notifications

Both categories are off until the user opts in:

- **Comments and replies:** comments on the user's posts, and replies to the user's comments.
- **Post confirmations:** another person confirms the user's post.

Preferences are stored in the signed-in user's `users.settings` JSON. Saves merge only these two fields, preserving existing theme and legacy preferences. No target user can be supplied. The destination is the account's email address; public profiles do not expose it.

Post/comment mutations and outbox events commit together. Self-notifications are excluded, recipients are deduplicated, and toggling the same user's confirmation does not send repeated emails. Each message links to the exact saved community post and to Settings. The delivery worker rechecks preferences before sending, so queued messages can be skipped after opting out.

The Node server polls the persisted outbox every five seconds. Workers claim batches under database locks with a two-minute lease. Failed sends retry with backoff, up to five attempts. The queue survives restarts; an interrupted SMTP acknowledgement can cause an at-least-once delivery, so delivery is not claimed to be exactly once. Failed and skipped messages retain their state for inspection.

## Mail setup

Configure these server-only values in `.env` or deployment environment variables:

```dotenv
APP_ORIGIN=https://your-app.example
SMTP_HOST=your-mail-provider-host
SMTP_PORT=587
SMTP_FROM=your-verified-sender@example.com
SMTP_USER=your-provider-user
SMTP_PASS=your-provider-password
SMTP_SECURE=false
```

Use the sender and credentials supplied by your email provider. Port 465 uses implicit TLS; port 587 uses STARTTLS, which is required in production. The integration uses the documented [Nodemailer SMTP transport](https://nodemailer.com/smtp). Production links require an HTTPS `APP_ORIGIN`; localhost HTTP is supported in development. Links never use an untrusted request host. Docker Compose forwards these variables to the web container. Restart after changing the configuration.

No real mail service is configured by this change. Without mail configuration, preferences still save, the UI explains that delivery is unavailable, and password-recovery buttons are disabled. Notification events generated while mail is unconfigured are not backfilled later. Ordinary password changes remain available. No credentials are committed or printed.

## Password security

**Change password** verifies the current password and requires matching new passwords of 8–128 characters. Passwords use the existing salted scrypt storage. Successful changes revoke other sessions, keep the current session, and invalidate outstanding reset links. The legacy profile password action delegates to the same implementation.

**Email reset link** in Settings sends a reset link to the current account. **Forgot password?** on the sign-in page opens `/forgot-password`. Responses do not reveal whether an email address exists. Recovery requests are limited per IP (ten per fifteen minutes per Node process); successful reset-link issuance is limited per account (five per hour with at least a minute between requests). For multiple server instances, put the IP limit in a shared limiter; account limits already use database locks.

Reset tokens contain 32 random bytes. Only SHA-256 hashes are stored in `password_resets`; raw tokens are sent by SMTP without being persisted in the outbox. Tokens expire in 30 minutes and are single-use. New requests invalidate previous links. Reset links use a URL fragment so tokens are not sent in HTTP URLs; the reset page removes the fragment after reading it. Recovery pages disable caching and referrer forwarding. Successful resets revoke all sessions and require signing in again. Expired, missing, replayed, and malformed tokens are rejected. Failed email delivery invalidates the new token. The signed-in Settings action reports the delivery error. The public recovery form retains the same neutral response for existing and unknown accounts, including delivery failures, to avoid disclosing account existence.

## Upgrade and verification

Apply migration 0005 after 0004 before starting this version:

```bash
docker compose exec -T surios-db psql -U postgres -d surios -v ON_ERROR_STOP=1 -1 < drizzle/0005_account-settings.sql
```

Use the normal migration runner instead if the database is managed by Drizzle's journal. The migration adds the email outbox and password-reset tables and changes new-account preference defaults; existing users/posts/comments are preserved.

Run `npm run check`, `npm run build`, and `npm run test:community`. Browser tests use a loopback-only SMTP receiver and isolated accounts. They verify preference persistence and ownership, responsive settings, actual SMTP messages and links, opt-outs, self-alert suppression, confirmation deduplication, retrying failed sends, current-password verification, session revocation, single-use/expired reset links, and failure feedback. Test configuration overrides SMTP values to prevent sending real email. Fixtures and sessions are removed afterward.


## Registration and government approval

`/register` offers Citizen and Government in development and production. Both account types require a password and matching confirmation. Each field has its own Show/Hide eye button, preserving the entered value without submitting the form. Matching is enforced server-side, including without JavaScript; failed forms never return password values. Citizens become active immediately. Government applications require a full name, email/password, office/department, municipal/city or barangay level, work location/jurisdiction, and a government ID number. The location uses the existing `government_profile` fields, so it appears on the approved office profile. The ID number is stored privately in `badge_number`, visible only to its owner and administrators, and is excluded from public profile/feed payloads. No ID image upload is required.

New government applications use role `OFFICER` with `account_status=PENDING`. Pending/rejected accounts land on `/account-status` and cannot use protected application routes or APIs, including government posting and profile mutations. Admins review the submitted location/office/ID at `/admin`, then approve or reject. Approval records the reviewer and timestamp. It is a human review workflow; SuriOS does not claim automated identity verification. Public signup cannot create admins or bypass status checks.

Admins can deactivate/reactivate existing citizen and government accounts. Deactivation removes sessions and blocks sign-in; reactivation requires a new sign-in. Pending accounts can only be approved/rejected, not activated through the status toggle. Admin accounts cannot be changed through this screen. Existing accounts remain active when migration `0012_account-approval.sql` is applied.

Create the initial administrator on Azure with `./surios.sh admin`; it prompts privately for credentials. There is no fixed production admin password. Direct script usage is `node --env-file-if-exists=.env scripts/create-admin.mjs` with `ADMIN_EMAIL` and `ADMIN_PASSWORD` provided in the process environment. It refuses to promote an existing non-admin email and never resets an existing admin's password.

Verification: `DATABASE_URL=<isolated-test-db> npx playwright test -c playwright.approval.config.ts` exercises signup, required government details, pending access denial, admin review, approval, rejection, activation/deactivation and mobile layouts. `node --test tests/docker-helper.mjs` checks deployment ordering, reset confirmation, credential handling and failure propagation without touching Docker resources.
