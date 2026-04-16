#!/bin/bash
# NeoPass Update Script — aktualisiert die App ohne Datenverlust
# Verwendung: ./update.sh

set -e

echo "=== NeoPass Update ==="

# 1. Backup der Datenbank
VOLUME_PATH=$(docker volume inspect messepass-data --format '{{ .Mountpoint }}' 2>/dev/null || echo "")
if [ -n "$VOLUME_PATH" ] && [ -f "$VOLUME_PATH/db/messepass.db" ]; then
    BACKUP="messepass-backup-$(date +%Y%m%d-%H%M%S).db"
    cp "$VOLUME_PATH/db/messepass.db" "./$BACKUP"
    echo "Backup erstellt: $BACKUP"
else
    echo "Kein bestehendes Volume gefunden — erster Start oder Volume-Name anders."
fi

# 2. Code aktualisieren
echo "Pulling latest code..."
git pull

# 3. Container stoppen und neu bauen (Volume bleibt erhalten!)
echo "Rebuilding container..."
docker compose down
docker compose up -d --build

echo ""
echo "=== Update abgeschlossen ==="
echo "WICHTIG: Niemals 'docker compose down -v' verwenden — das löscht alle Daten!"
echo ""
docker compose ps
