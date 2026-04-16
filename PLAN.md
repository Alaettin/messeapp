# Digitaler Messe-Pass — Projektplan

## Vision

Mobile Web-Applikation zur Erfassung von Besucherdaten auf Messen. Die Daten werden strukturiert gespeichert und über eine API im Connector-Muster für externe Systeme (z.B. Besucher-Ansicht, AAS) bereitgestellt.

## Scope

**In Scope:**
- Erfassungs-App (4-Schritte-Workflow, mobile-first)
- Admin-Bereich (Konfiguration der Inhalte)
- REST-API (Connector-Muster, für externe Systeme)
- Docker-Deployment (ein Container, alles drin)

**Out of Scope:**
- Besucher-Ansicht (separate Applikation, greift auf unsere API zu)
- On-Demand-Funktionen wie Gastro-Check, Local Lunch, Wetter (werden während der Implementierung ergänzt)
- Domain-/DNS-Konfiguration

---

## Tech-Stack

| Komponente | Technologie |
|---|---|
| Frontend | React 18 + TypeScript + TailwindCSS |
| Backend | Node.js + Express |
| Datenbank | SQLite (better-sqlite3) |
| File Storage | Lokales Dateisystem (Docker Volume) |
| OCR | OpenAI GPT-4o Vision |
| Bildgenerierung | OpenAI DALL-E |
| Containerisierung | Docker (Single Container) |
| Design | Neoception-Stil (Dark Navy, Cyan-Akzente, clean industrial) |

---

## Design

Orientierung an www.neoception.com:
- Dunkles Farbschema (Navy/Dunkelblau als Basis)
- Cyan/Türkis als Akzentfarbe
- Weiß für Text und Kontraste
- Klare Typografie, viel Whitespace
- Industriell-modern, kein typischer AI-Look
- Mobile-first, Touch-optimiert (Einsatz am Messestand auf Smartphone)

---

## Architektur

### Verzeichnisstruktur Docker Volume

```
/data
  /db
    messepass.db
  /storage
    /avatars              # DALL-E generierte Profilbilder
    /business-cards       # Originale Visitenkarten-Fotos
    /documents            # Vom Admin hochgeladene PDFs, Datenblätter etc.
```

### Projekt-Struktur

```
messepass/
  ├── client/                   # React Frontend
  │   ├── src/
  │   │   ├── components/
  │   │   │   ├── steps/        # Step 1–4 Komponenten
  │   │   │   ├── admin/        # Admin-Bereich Komponenten
  │   │   │   └── ui/           # Shared UI Komponenten
  │   │   ├── pages/
  │   │   │   ├── Capture.tsx   # Erfassungs-Workflow (4 Schritte)
  │   │   │   └── Admin.tsx     # Admin-Bereich
  │   │   ├── hooks/
  │   │   ├── services/         # API-Client, OpenAI-Calls
  │   │   └── types/
  │   └── index.html
  ├── server/                   # Express Backend
  │   ├── routes/
  │   │   ├── capture.ts        # Erfassungs-Endpunkte
  │   │   ├── admin.ts          # Admin-Endpunkte
  │   │   └── api.ts            # Externe API (Connector-Muster)
  │   ├── services/
  │   │   ├── ocr.ts            # GPT-4o Vision OCR
  │   │   └── avatar.ts         # DALL-E Avatar-Generierung
  │   ├── db/
  │   │   ├── schema.ts         # SQLite Schema
  │   │   └── index.ts          # DB-Verbindung
  │   └── index.ts
  ├── Dockerfile
  ├── docker-compose.yml
  ├── .env.example
  └── package.json
```

---

## Datenmodell (SQLite)

### visitors

| Feld | Typ | Beschreibung |
|---|---|---|
| id | TEXT PK | Identifier aus QR-Code (z.B. "12kjo213asd") |
| name | TEXT | Name des Besuchers |
| company | TEXT | Firma |
| position | TEXT | Position/Titel |
| address | TEXT | Adresse |
| email | TEXT | E-Mail |
| phone | TEXT | Telefon |
| website | TEXT | Webseite |
| business_card_path | TEXT | Pfad zum Visitenkarten-Foto |
| avatar_path | TEXT | Pfad zum generierten Avatar |
| avatar_prompt | TEXT | Verwendeter Prompt für Reproduzierbarkeit |
| notes | TEXT | Freitext-Notizen |
| created_at | DATETIME | Erfassungszeitpunkt |
| updated_at | DATETIME | Letzte Änderung |

### documents

| Feld | Typ | Beschreibung |
|---|---|---|
| id | INTEGER PK | Auto-Increment |
| name | TEXT | Anzeigename (z.B. "Produktkatalog 2025") |
| filename | TEXT | Originaler Dateiname |
| file_path | TEXT | Pfad in /data/storage/documents/ |
| category | TEXT | Optionale Kategorie |
| active | BOOLEAN | Sichtbar in der Erfassungs-App |
| sort_order | INTEGER | Reihenfolge in der Liste |
| created_at | DATETIME | Hochladezeitpunkt |

### contacts

| Feld | Typ | Beschreibung |
|---|---|---|
| id | INTEGER PK | Auto-Increment |
| name | TEXT | Name (z.B. "Adrian Grüner") |
| role | TEXT | Rolle (z.B. "Director Sales & Marketing") |
| email | TEXT | E-Mail |
| phone | TEXT | Telefon |
| photo_path | TEXT | Optional: Foto des Ansprechpartners |
| active | BOOLEAN | Sichtbar in der Erfassungs-App |
| sort_order | INTEGER | Reihenfolge in der Liste |

### visitor_documents

| Feld | Typ | Beschreibung |
|---|---|---|
| visitor_id | TEXT FK | → visitors.id |
| document_id | INTEGER FK | → documents.id |

### visitor_contacts

| Feld | Typ | Beschreibung |
|---|---|---|
| visitor_id | TEXT FK | → visitors.id |
| contact_id | INTEGER FK | → contacts.id |

### avatar_options

| Feld | Typ | Beschreibung |
|---|---|---|
| id | INTEGER PK | Auto-Increment |
| category | TEXT | z.B. "hair_color", "face_shape", "features" |
| label | TEXT | Anzeige-Label (z.B. "Blond", "Oval", "Brille") |
| prompt_value | TEXT | Wert für den DALL-E Prompt |
| active | BOOLEAN | Sichtbar im Konfigurator |
| sort_order | INTEGER | Reihenfolge |

---

## Workflow — Erfassungs-App (4 Schritte)

### Schritt 1: QR-Scan / Identifikation

- Kamera öffnen via Browser-API (`getUserMedia`)
- QR-Code-Library: `html5-qrcode` oder `jsQR`
- URL parsen → Identifier extrahieren (alles nach dem letzten `/`)
- **Fallback:** Manuelle Eingabe des Identifiers über Textfeld
- Prüfung: Existiert der Identifier schon in der DB? Wenn ja → Meldung "bereits erfasst" mit Option zum Überschreiben
- Weiter zu Schritt 2

### Schritt 2: Visitenkarten-Scan & OCR

- Kamera öffnen für Fotoaufnahme der Visitenkarte
- Foto wird lokal in `/data/storage/business-cards/{identifier}.jpg` gespeichert
- Foto an GPT-4o Vision senden mit strukturiertem Prompt:
  ```
  Extrahiere folgende Felder aus dieser Visitenkarte als JSON:
  name, company, position, address, email, phone, website
  Gib nur das JSON zurück, keine weiteren Erklärungen.
  ```
- Ergebnis in editierbarem Formular anzeigen
- Nutzer korrigiert/bestätigt → Daten werden in `visitors`-Tabelle gespeichert
- Weiter zu Schritt 3

### Schritt 3: Handover Documentation + Contact

- Multi-Select-Liste der aktiven Dokumente aus `documents`-Tabelle
- Multi-Select-Liste der aktiven Ansprechpartner aus `contacts`-Tabelle
- Auswahl wird in `visitor_documents` und `visitor_contacts` gespeichert
- Weiter zu Schritt 4

### Schritt 4: Avatar-Konfigurator

- Auswahlfelder basierend auf `avatar_options`-Tabelle (gruppiert nach `category`):
  - Haarfarbe (Blond, Braun, Schwarz, Grau, ...)
  - Gesichtsform (Oval, Eckig, Rund, ...)
  - Merkmale (Brille, Bart, Kleidungsstil, ...)
- Freitext-Feld für Charakterzüge, Hobbys etc.
- Prompt wird zusammengebaut und an DALL-E gesendet
- Generiertes Bild wird heruntergeladen und in `/data/storage/avatars/{identifier}.png` gespeichert
- Vorschau anzeigen mit Option "Neu generieren"
- Abschluss → Zusammenfassung aller erfassten Daten

---

## Admin-Bereich

### Authentifizierung

Einfacher Passwort-Schutz (konfigurierbar über Env-Variable `ADMIN_PASSWORD`). Kein komplexes Auth-System nötig für eine Demo-App.

### Verwaltung

- **Dokumente verwalten:** Upload, Umbenennen, Löschen, Reihenfolge ändern, Aktivieren/Deaktivieren
- **Ansprechpartner verwalten:** Erstellen, Bearbeiten, Löschen, Reihenfolge, Aktivieren/Deaktivieren
- **Avatar-Optionen verwalten:** Kategorien und Optionen pflegen (Haarfarben, Gesichtsformen etc.)
- **Erfasste Besucher:** Übersicht aller erfassten Besucher mit Suchfunktion, Detail-Ansicht, Löschen
- **Weitere Einstellungen:** Ergibt sich während Implementierung und Testing

---

## API — Connector-Muster

Die API stellt alle erfassten Daten für externe Systeme bereit.

### Endpunkte

```
GET    /api/visitors                    # Liste aller Besucher (paginiert)
GET    /api/visitors/:id                # Einzelner Besucher (alle Daten inkl. Dokumente, Kontakte, Avatar)
GET    /api/visitors/:id/documents      # Zugewiesene Dokumente eines Besuchers
GET    /api/visitors/:id/contacts       # Zugewiesene Ansprechpartner
GET    /api/visitors/:id/avatar         # Avatar-Bild

GET    /api/documents                   # Alle verfügbaren Dokumente
GET    /api/documents/:id/file          # Dokument-Download

GET    /api/contacts                    # Alle Ansprechpartner

GET    /api/storage/avatars/:file       # Statischer Datei-Zugriff
GET    /api/storage/business-cards/:file
GET    /api/storage/documents/:file
```

### Response-Format (Beispiel)

```json
GET /api/visitors/12kjo213asd

{
  "id": "12kjo213asd",
  "name": "Max Mustermann",
  "company": "Musterfirma GmbH",
  "position": "Leiter Digitalisierung",
  "address": "Musterstraße 1, 12345 Musterstadt",
  "email": "m.mustermann@musterfirma.de",
  "phone": "+49 123 456789",
  "website": "www.musterfirma.de",
  "avatar_url": "/api/storage/avatars/12kjo213asd.png",
  "business_card_url": "/api/storage/business-cards/12kjo213asd.jpg",
  "documents": [
    {
      "id": 1,
      "name": "Produktkatalog 2025",
      "url": "/api/storage/documents/produktkatalog-2025.pdf"
    }
  ],
  "contacts": [
    {
      "id": 1,
      "name": "Adrian Grüner",
      "role": "Director Sales & Marketing",
      "email": "agruener@neoception.com"
    }
  ],
  "created_at": "2025-04-15T10:30:00Z"
}
```

---

## Docker

### docker-compose.yml

```yaml
version: "3.8"
services:
  messepass:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - messepass-data:/data
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
    restart: unless-stopped

volumes:
  messepass-data:
```

### Dockerfile

- Node.js 20 Alpine
- Multi-Stage Build: Frontend bauen → in Express static einbinden
- Single Container: Express served Frontend + API
- Port 3000

### .env.example

```
OPENAI_API_KEY=sk-...
ADMIN_PASSWORD=neoception2025
```

---

## Sprints

### Sprint 1 — Basis

- Projektstruktur aufsetzen (Monorepo: client + server)
- Docker-Setup (Dockerfile, docker-compose.yml)
- Express-Server mit SQLite, Schema erstellen
- Neoception-Design: Farbpalette, Typografie, Basis-Komponenten
- Grundlayout: Navigation, Step-Indicator, Mobile-Optimierung

### Sprint 2 — Erfassungs-Workflow

- Schritt 1: QR-Scanner + manuelle Eingabe
- Schritt 2: Kamera-Aufnahme + GPT-4o Vision OCR + editierbares Formular
- Schritt 3: Dokumente + Ansprechpartner Multi-Select
- Schritt 4: Avatar-Konfigurator + DALL-E Generierung
- Abschluss-Screen mit Zusammenfassung

### Sprint 3 — Admin-Bereich

- Login (Passwort-Schutz)
- Dokumente verwalten (CRUD + Upload)
- Ansprechpartner verwalten (CRUD)
- Avatar-Optionen verwalten
- Besucher-Übersicht + Detail-Ansicht

### Sprint 4 — API + Docker + Polish

- REST-API Endpunkte (Connector-Muster)
- Statischer File-Serving für Bilder/Dokumente
- Docker Build optimieren
- Error-Handling, Loading-States, Edge-Cases
- Mobile-Testing, Touch-Optimierung

### Sprint 5 — On-Demand-Funktionen (TBD)

- Gastro-Check, Local Lunch, Wetter etc.
- Details werden während der Implementierung definiert
