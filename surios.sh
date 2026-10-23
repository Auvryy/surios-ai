#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE=(docker compose --project-directory "$ROOT" -f "$ROOT/docker-compose.prod.yml")
usage() {
  cat <<'HELP'
SuriOS Azure Docker helper
  ./surios.sh build       Build, migrate safely, and start the app
  ./surios.sh migrate     Apply pending migrations; retain existing data
  ./surios.sh seed        Build, migrate, import presentation data, start
  ./surios.sh admin       Create an administrator (prompts for credentials)
  ./surios.sh fresh       ERASE database/uploads, build, migrate, seed, start
  ./surios.sh fresh --yes Same reset without the interactive confirmation
  ./surios.sh status      Show containers
  ./surios.sh logs        Follow web logs
  ./surios.sh stop        Stop containers; retain data
  ./surios.sh restart     Restart the web container
HELP
}
prepare() {
  "${COMPOSE[@]}" build web
  "${COMPOSE[@]}" up -d --wait db
  "${COMPOSE[@]}" run --rm web node scripts/migrate.mjs
}
start() { "${COMPOSE[@]}" up -d web; }
seed() { "${COMPOSE[@]}" run --rm web node scripts/seed-presentation.mjs; }
command="${1:-help}"
case "$command" in
  help|--help|-h) usage; exit 0 ;;
  build|migrate|seed|admin|fresh|status|logs|stop|restart) ;;
  *) usage >&2; exit 2 ;;
esac
if [[ $# -gt 2 || ( $# -eq 2 && ( "$command" != fresh || "$2" != --yes ) ) ]]; then usage >&2; exit 2; fi
command -v docker >/dev/null || { echo 'Docker with Compose is required.' >&2; exit 1; }
case "$command" in
  build) prepare; start ;;
  migrate) prepare ;;
  seed) prepare; seed; start ;;
  admin)
    if [[ -z "${ADMIN_EMAIL:-}" ]]; then
      read -r -p 'Admin email: ' ADMIN_EMAIL
    fi
    if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
      read -r -s -p 'Admin password (at least 12 characters): ' ADMIN_PASSWORD
      printf '\n'
      read -r -s -p 'Confirm password: ' ADMIN_PASSWORD_CONFIRM
      printf '\n'
      [[ "$ADMIN_PASSWORD" == "$ADMIN_PASSWORD_CONFIRM" ]] || { echo 'Passwords do not match.' >&2; exit 1; }
      unset ADMIN_PASSWORD_CONFIRM
    fi
    export ADMIN_EMAIL ADMIN_PASSWORD
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
    "${COMPOSE[@]}" down -v
    prepare
    seed
    start
    echo 'Fresh demo is ready. Create your administrator with ./surios.sh admin.'
    ;;
  status) "${COMPOSE[@]}" ps ;;
  logs) "${COMPOSE[@]}" logs -f web ;;
  stop) "${COMPOSE[@]}" down ;;
  restart) "${COMPOSE[@]}" restart web ;;
esac
