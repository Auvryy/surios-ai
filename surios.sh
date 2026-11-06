#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE=(docker compose --project-directory "$ROOT" -f "$ROOT/docker-compose.prod.yml")
usage() {
  cat <<'HELP'
SuriOS Azure Docker helper
  ./surios.sh build       Build, migrate safely, and start the app
  ./surios.sh migrate     Apply pending migrations; retain existing data
  ./surios.sh seed        Build, migrate, create citizen, municipality, and admin accounts only
  ./surios.sh seed-presentation Build, migrate, import the full presentation snapshot, start
  ./surios.sh admin       Create an administrator (prompts for credentials)
  ./surios.sh fresh       ERASE database/uploads, build, migrate, seed accounts only, start
  ./surios.sh fresh --yes Same reset without the reset confirmation; admin password is still prompted
  ./surios.sh status      Show containers
  ./surios.sh logs        Follow web logs
  ./surios.sh stop        Stop containers; retain data
  ./surios.sh restart     Restart the web container
HELP
}
build_web() { "${COMPOSE[@]}" build web; }
migrate_database() {
  "${COMPOSE[@]}" up -d --wait db
  "${COMPOSE[@]}" run --rm web node scripts/migrate.mjs
}
prepare() { build_web; migrate_database; }
start() { "${COMPOSE[@]}" up -d web; }
seed_presentation() { "${COMPOSE[@]}" run --rm web node scripts/seed-presentation.mjs; }
seed_accounts() {
  "${COMPOSE[@]}" run --rm -e ADMIN_EMAIL -e ADMIN_PASSWORD -e DEMO_ACCOUNT_PASSWORD web node scripts/seed-accounts.mjs
}
collect_admin_credentials() {
  if [[ -z "${ADMIN_EMAIL:-}" ]]; then
    read -r -p 'Admin email [admin@surios.gov]: ' ADMIN_EMAIL
    ADMIN_EMAIL="${ADMIN_EMAIL:-admin@surios.gov}"
  fi
  if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
    read -r -s -p 'Admin password (at least 12 characters): ' ADMIN_PASSWORD
    printf '\n'
    read -r -s -p 'Confirm password: ' ADMIN_PASSWORD_CONFIRM
    printf '\n'
    [[ "$ADMIN_PASSWORD" == "$ADMIN_PASSWORD_CONFIRM" ]] || { echo 'Passwords do not match.' >&2; return 1; }
    unset ADMIN_PASSWORD_CONFIRM
  fi
  if [[ ! "$ADMIN_EMAIL" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ || ${#ADMIN_EMAIL} -gt 254 ]]; then
    echo 'Enter a valid administrator email address.' >&2
    return 1
  fi
  case "${ADMIN_EMAIL,,}" in
    citizen@surios.gov|municipality@surios.gov) echo 'Admin email must differ from the seeded citizen and municipality accounts.' >&2; return 1 ;;
  esac
  if (( ${#ADMIN_PASSWORD} < 12 || ${#ADMIN_PASSWORD} > 256 )); then
    echo 'Admin password must contain 12–256 characters.' >&2
    return 1
  fi
  export ADMIN_EMAIL ADMIN_PASSWORD
}
command="${1:-help}"
case "$command" in
  help|--help|-h) usage; exit 0 ;;
  build|migrate|seed|seed-presentation|admin|fresh|status|logs|stop|restart) ;;
  *) usage >&2; exit 2 ;;
esac
if [[ $# -gt 2 || ( $# -eq 2 && ( "$command" != fresh || "$2" != --yes ) ) ]]; then usage >&2; exit 2; fi
command -v docker >/dev/null || { echo 'Docker with Compose is required.' >&2; exit 1; }
case "$command" in
  build) prepare; start ;;
  migrate) prepare ;;
  seed) collect_admin_credentials; prepare; seed_accounts; unset ADMIN_PASSWORD; start ;;
  seed-presentation) prepare; seed_presentation; start ;;
  admin)
    collect_admin_credentials
    prepare
    "${COMPOSE[@]}" run --rm -e ADMIN_EMAIL -e ADMIN_PASSWORD web node scripts/create-admin.mjs
    unset ADMIN_PASSWORD
    start
    ;;
  fresh)
    if [[ "${2:-}" != --yes ]]; then
      echo 'This permanently erases the SuriOS production database and all uploaded media.'
      read -r -p 'Type fresh to continue: ' CONFIRM_RESET
      [[ "$CONFIRM_RESET" == fresh ]] || { echo 'Reset cancelled.'; exit 1; }
    fi
    collect_admin_credentials
    build_web
    "${COMPOSE[@]}" down -v
    migrate_database
    seed_accounts
    unset ADMIN_PASSWORD
    start
    echo 'Fresh database is ready with citizen, municipality, and admin accounts only; no posts or presentation content were seeded.'
    ;;
  status) "${COMPOSE[@]}" ps ;;
  logs) "${COMPOSE[@]}" logs -f web ;;
  stop) "${COMPOSE[@]}" down ;;
  restart) "${COMPOSE[@]}" restart web ;;
esac
