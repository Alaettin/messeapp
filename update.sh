#!/bin/bash
# NeoPass Update Script — aktualisiert die App ohne Datenverlust
# Verwendung: ./update.sh

set -e

echo "=== NeoPass Update ==="

# 1. Backup der Datenbank aus dem Docker Volume
CONTAINER=$(docker compose ps -q messepass 2>/dev/null || echo "")
if [ -n "$CONTAINER" ]; then
    BACKUP="messepass-backup-$(date +%Y%m%d-%H%M%S).db"
    docker cp "$CONTAINER:/data/db/messepass.db" "./$BACKUP" 2>/dev/null && \
        echo "Backup erstellt: $BACKUP" || \
        echo "Keine bestehende DB gefunden — erster Start."
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
