# Neoception Passport

Mobile Web-App zur Erfassung von Besucherdaten auf Messen. Entwickelt für den Einsatz am Messestand auf Smartphones.

## Features

- **5-Schritte Erfassungs-Workflow**: QR-Scan → Visitenkarten-OCR → Dokumente → Kontakte → Avatar
- **GPT-4o Vision OCR**: Automatische Visitenkarten-Erkennung
- **DALL-E Avatar**: Cartoon-Avatar-Generator mit Konfigurator
- **Backoffice**: Dokumente, Ansprechpartner und Besucher verwalten
- **REST-API**: Connector-Muster für externe Systeme
- **Docker**: Single-Container Deployment

## Tech-Stack

| Komponente | Technologie |
|---|---|
| Frontend | React 18 + TypeScript + TailwindCSS + Vite |
| Backend | Node.js + Express |
| Datenbank | SQLite (sql.js, WASM) |
| OCR | OpenAI GPT-4o Vision |
| Bildgenerierung | OpenAI DALL-E 3 |
| Deployment | Docker (Single Container) |

## Setup

```bash
# Dependencies installieren
npm install

# .env erstellen
cp .env.example .env
# OpenAI API Key eintragen

# Dev-Server starten
npm run dev
# oder: start.bat (Windows)
```

Frontend: http://localhost:5173
Backend: http://localhost:3000

## Docker

```bash
docker compose up --build
```

App erreichbar unter http://localhost:3000

## Projektstruktur

```
client/src/
  components/ui/       # Button, Card, Input, StepIndicator
  components/steps/    # QR-Scan, Visitenkarte, Dokumente, Kontakte, Avatar
  components/admin/    # Backoffice-Komponenten
  pages/               # Capture, Admin
  services/            # API Client

server/src/
  routes/              # capture.ts, admin.ts
  services/            # ocr.ts, avatar.ts, openai.ts
  db/                  # schema.ts, index.ts
```
