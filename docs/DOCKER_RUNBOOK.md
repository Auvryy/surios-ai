# SuriOS — Docker Command Runbook

This runbook contains all explicit Docker commands for running SuriOS locally and on your Azure VM. **No hidden magic scripts**—use these standard commands directly.

---

## Azure shortcuts

From the repository checkout on the Azure VM, use the executable helper:

```bash
./surios.sh build
./surios.sh admin
```

`build` builds the production image, starts/waits for PostgreSQL, applies pending migrations, and starts the web container. Existing data and uploads remain. `admin` prompts for an email and a password of at least 12 characters, creates an active administrator, and keeps existing administrator passwords unchanged. Sign in normally and open **Account approvals** (`/admin`). There is no public admin signup or default production admin password. For automation, supply `ADMIN_EMAIL` and `ADMIN_PASSWORD` through the process environment; do not put real passwords into command history or commit them.

```bash
./surios.sh seed      # Build, migrate, import the presentation snapshot, start
./surios.sh migrate   # Apply pending schema changes without seeding
./surios.sh status
./surios.sh logs
./surios.sh restart
./surios.sh stop      # Stop services while retaining data
```

`seed` requires an empty database or the same complete snapshot; it refuses different existing community content. It includes the bundled photos, road sections, comments, government updates and interactions. It does not automatically create an administrator; use `./surios.sh admin`.

For an intentional complete demo reset:

```bash
./surios.sh fresh
```

This asks you to type `fresh`, then **permanently deletes the production database and uploaded media**, builds, migrates, seeds and starts the app. Existing admin accounts are removed too; recreate one with `./surios.sh admin`. Unattended resets require the explicit `./surios.sh fresh --yes` form. Normal `build`, `migrate`, `admin` and `seed` commands never delete the database volume.

The helper always uses `docker-compose.prod.yml` and resolves paths relative to itself, even when called from another directory. It does not pull or push Git changes or change the VM's Nginx/TLS setup. Pull your chosen branch before building. Port 3000 remains the app's container port.

Migrations use `scripts/migrate.mjs` and `_surios_migrations`, with transactional application, a database lock, and stored migration hashes. A deployment previously initialized by the manual SQL instructions or `db:push` is adopted only through a structurally matching checked-in schema snapshot; new migrations then run normally. An unknown/partial schema fails rather than deleting data. On a fresh database, do not combine the old manual SQL loop with the helper; choose one initialization flow.

---

## 1. Local Development (Your Laptop / Machine)

### Start Local PostgreSQL (Port 5433)
```bash
docker compose up -d
```
> [!NOTE]
> Local Postgres runs on **port 5433** (`localhost:5433`) to ensure it does not conflict with existing containers running on standard port 5432.

### Check Container Status
```bash
docker compose ps
```

### View Database Logs
```bash
docker compose logs -f surios-db
```

### Push Database Schema (Apply Tables to Postgres)
```bash
npm run db:push
```

### Stop Local PostgreSQL
```bash
docker compose down
```

### Reset / Wipe Local Database (Fresh Start)
```bash
docker compose down -v
```

---

## 2. Production Deployment (Ubuntu Azure VM)

When logged into your Azure Virtual Machine via SSH (`ssh andy@<azure-ip>`):

### Step 1: Pull Latest Code from GitHub
```bash
cd /path/to/surios-ai
git fetch origin
git checkout main
git pull --ff-only origin main
```

To deploy this account-approval branch directly before merging it, use `feat/account-approval` in those three Git commands instead of `main`.

### Step 2: Start PostgreSQL
```bash
docker compose -f docker-compose.prod.yml up -d db
```

### Fresh Azure database: apply schema and load the presentation snapshot

Use this section only when creating a new, empty production database. It creates the same demo reports, feed posts, road sections, comments, official updates, reactions, and referenced media as the checked-in snapshot. It does not run automatically at app startup.

Apply each checked-in migration in order from the repository checkout:

```bash
docker compose -f docker-compose.prod.yml up -d db
for migration in drizzle/*.sql; do
  docker compose -f docker-compose.prod.yml exec -T db psql -v ON_ERROR_STOP=1 -U postgres -d surios < "$migration"
done
```

Build the web image and run the importer as a one-off container against the empty schema:

```bash
docker compose -f docker-compose.prod.yml run --build --rm web node scripts/seed-presentation.mjs
```

The importer is safe to rerun after a complete import. It refuses to mix the snapshot into a database containing different reports or community content. For a fresh Compose installation, use a new database volume; do not delete a volume that contains data you need. Demo sign-in: `citizen@surios.gov` or `municipality@surios.gov`, password `Password123!`.

For an existing production database, preserve its named volume and apply only migrations that have not already been applied before restarting the updated application. Do not run the full initialization loop or the presentation seed against an existing database with different content.

### Step 3: Build and start the production web container
```bash
docker compose -f docker-compose.prod.yml up -d web
```

When updating an existing deployment, use `docker compose -f docker-compose.prod.yml up -d --build web` after applying any pending migrations.

### Step 4: Check Production Containers
```bash
docker compose -f docker-compose.prod.yml ps
```

### Step 5: View Production Web Logs (Live Stream)
```bash
docker compose -f docker-compose.prod.yml logs -f web
```

### Step 6: Stop Production Containers
```bash
docker compose -f docker-compose.prod.yml down
```

### Clean Up Dangling Docker Images (Free VM Disk Space)
```bash
docker image prune -f
```

---

## 3. Quick Reference Cheat Sheet

| Action | Local Dev Command | Azure Production Command |
| :--- | :--- | :--- |
| **Start Services** | `docker compose up -d` | `docker compose -f docker-compose.prod.yml up -d --build` |
| **Stop Services** | `docker compose down` | `docker compose -f docker-compose.prod.yml down` |
| **View Logs** | `docker compose logs -f` | `docker compose -f docker-compose.prod.yml logs -f web` |
| **Check Health** | `docker compose ps` | `docker compose -f docker-compose.prod.yml ps` |
| **Restart Web** | `npm run dev` | `docker compose -f docker-compose.prod.yml restart web` |

## Account email and password recovery

Migration `drizzle/0005_account-settings.sql` adds the persisted email outbox and password-reset tokens. Configure the server-only `APP_ORIGIN`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_SECURE` variables before enabling live delivery. Production Compose forwards these variables to the web container. See [Account settings](./ACCOUNT_SETTINGS.md) for configuration, migration, and verification details.

## Road reporting deployment

Apply `drizzle/0010_road-segments.sql` before starting the updated app. It is additive and retains existing seeded accounts/posts. Production Compose accepts `52M` request bodies for the 50 MiB total media limit; configure Nginx or another front proxy with `client_max_body_size 52m;` as well. The app uses OpenStreetMap street tiles and bounded cached public OSM geometry requests, with no map API key required. The optional labeled road demo is seeded explicitly with `node --env-file-if-exists=.env scripts/seed-road.mjs` from the repository checkout; it is never inserted on startup.

For a local production preview after `npm run build`, run:

```bash
npm run preview:production
```

This launcher serves the actual production build on `http://localhost:5173`, with production authentication and the 52 MiB body limit. It binds only to localhost and supplies the HTTP protocol internally, so ordinary sign-in forms pass CSRF validation without weakening checks. Set `PORT` to use another local port.

The installed adapter-node 6 / SvelteKit 3 derives the origin from forwarded protocol/host headers or build-time `kit.paths.origin`; the old runtime `ORIGIN` setting is not used. For deployment, keep HTTPS and configure the trusted reverse proxy headers or a fixed build origin. `APP_ORIGIN` configures email links separately. Use the regular container entrypoint for deployment, not the loopback preview launcher.
