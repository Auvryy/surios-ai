# SuriOS — Docker Command Runbook

This runbook contains all explicit Docker commands for running SuriOS locally and on your Azure VM. **No hidden magic scripts**—use these standard commands directly.

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
git pull origin main
```

### Step 2: Build and Start Production Containers in Background
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Step 3: Check Production Containers
```bash
docker compose -f docker-compose.prod.yml ps
```

### Step 4: View Production Web Logs (Live Stream)
```bash
docker compose -f docker-compose.prod.yml logs -f web
```

### Step 5: Stop Production Containers
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
