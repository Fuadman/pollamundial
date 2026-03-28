#!/usr/bin/env bash
set -euo pipefail

# Clears gameplay data while preserving admin users.
# Deletes: predictions, match results, and non-admin users.
# Also resets remaining user scores and match status consistency.

COMPOSE_FILE="docker-compose.yml"
DB_SERVICE="postgres"
DB_USER="user"
DB_NAME="copa_prediction"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "No se encontro docker-compose.yml en el directorio actual."
  echo "Ejecuta este script desde la raiz del proyecto."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker no esta instalado o no esta en PATH."
  exit 1
fi

if ! docker compose ps "$DB_SERVICE" >/dev/null 2>&1; then
  echo "No se pudo acceder al servicio '$DB_SERVICE'."
  echo "Verifica que Docker Compose este levantado."
  exit 1
fi

echo "Limpiando datos de juego (resultados, pronosticos, usuarios no-admin)..."

docker compose exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" <<'SQL'
BEGIN;

-- 1) Borrar resultados de partidos
DELETE FROM match_results;

-- 2) Borrar pronosticos
DELETE FROM predictions;

-- 3) Borrar usuarios no-admin
DELETE FROM users
WHERE role IS DISTINCT FROM 'admin';

-- 4) Limpiar/normalizar puntajes remanentes (ej. admin)
UPDATE user_scores
SET total_points = 0,
    group_stage_points = 0,
    elimination_points = 0;

-- 5) Evitar partidos finalizados sin resultado
UPDATE matches
SET status = 'scheduled'
WHERE status = 'completed';

COMMIT;
SQL

echo "Limpieza completada. Resumen actual:"
docker compose exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) AS users_total FROM users;"
docker compose exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) AS users_admin FROM users WHERE role = 'admin';"
docker compose exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) AS predictions_total FROM predictions;"
docker compose exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) AS results_total FROM match_results;"

echo "Listo."
