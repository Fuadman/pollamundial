#!/bin/bash
# Limpia la tabla de partidos dejando solo los 6 partidos únicos por grupo (para 4 equipos)
# AJUSTA los valores de DB_USER, DB_NAME y DB_HOST según tu entorno

DB_USER="postgres"
DB_NAME="pollamundial"
DB_HOST="localhost"

# Haz backup antes de ejecutar
pg_dump -U "$DB_USER" -h "$DB_HOST" "$DB_NAME" > backup_matches_before_cleanup.sql

# Ejecuta el script de limpieza
psql -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -c "
DELETE FROM match
WHERE id NOT IN (
  SELECT min_id FROM (
    SELECT MIN(id) as min_id
    FROM match
    WHERE group_stage_group IS NOT NULL
    GROUP BY group_stage_group, LEAST(team1_id, team2_id), GREATEST(team1_id, team2_id)
  ) AS keepers
);
"

echo "Limpieza completada. Backup guardado en backup_matches_before_cleanup.sql."
