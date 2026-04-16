# NeoPass — Digitaler Messe-Pass

## Projekt

Mobile Web-App zur Erfassung von Besucherdaten auf Messen (Neoception). 4-Schritte-Workflow: QR-Scan → Visitenkarten-OCR → Dokumentenzuweisung → Avatar-Generierung. REST-API im Connector-Muster fuer externe Systeme.

## Tech-Stack

| Komponente | Technologie |
|---|---|
| Frontend | React 18 + TypeScript + TailwindCSS + Vite |
| Backend | Node.js + Express |
| Datenbank | SQLite (sql.js, WASM-basiert) |
| File Storage | Lokales Dateisystem (Docker Volume unter /data) |
| OCR | OpenAI GPT-4o Vision |
| Bildgenerierung | OpenAI DALL-E |
| Icons | lucide-react |
| Deployment | Docker (Single Container, node:20-alpine) |

## Konventionen

- **Monorepo:** npm workspaces (`client/` + `server/`)
- **Kein API-Versionsprefix:** `/api/visitors` nicht `/api/v1/visitors`
- **Design:** Neoception-Stil (Weiss #FFFFFF, Teal #00A587, Inter Font)
- **Mobile-first:** 48px Touch Targets, viewport-optimiert
- **NEVER push** ohne expliziten User-Befehl

## Projektstruktur

```
messeapp/
  client/src/
    components/ui/       # Button, Card, Input, StepIndicator
    components/layout/   # AppShell
    components/steps/    # Step 1-4 (Capture Workflow)
    components/admin/    # Admin-Bereich
    pages/               # Capture.tsx, Admin.tsx
    services/            # API-Client, OpenAI-Calls
    hooks/               # Custom Hooks
    types/               # TypeScript Interfaces
  server/src/
    routes/              # capture.ts, admin.ts, api.ts
    services/            # ocr.ts, avatar.ts
    db/                  # schema.ts, index.ts
    index.ts             # Express Entry
  /data/db/              # messepass.db (Docker Volume)
  /data/storage/         # avatars/, business-cards/, documents/
```

## Skills

### Workflow & Orchestration
- **workflow** → `/workflow` — Plan Mode, Subagents, Task Tracking

### Core Engineering
- **senior-fullstack** → `C:\Users\alaet\.claude\skills\engineering-team\senior-fullstack\SKILL.md`
- **senior-frontend** → `C:\Users\alaet\.claude\skills\engineering-team\senior-frontend\SKILL.md`
- **senior-backend** → `C:\Users\alaet\.claude\skills\engineering-team\senior-backend\SKILL.md`
- **senior-architect** → `C:\Users\alaet\.claude\skills\engineering-team\senior-architect\SKILL.md`
- **senior-devops** → `C:\Users\alaet\.claude\skills\engineering-team\senior-devops\SKILL.md`
- **senior-security** → `C:\Users\alaet\.claude\skills\engineering-team\senior-security\SKILL.md`
- **senior-prompt-engineer** → `C:\Users\alaet\.claude\skills\engineering-team\senior-prompt-engineer\SKILL.md`
- **code-reviewer** → `C:\Users\alaet\.claude\skills\engineering-team\code-reviewer\SKILL.md`

### Spezialisiert
- **database-schema-designer** → `C:\Users\alaet\.claude\skills\engineering\database-schema-designer\SKILL.md`
- **api-design-reviewer** → `C:\Users\alaet\.claude\skills\engineering\api-design-reviewer\SKILL.md`
- **ui-design-system** → `C:\Users\alaet\.claude\skills\product-team\ui-design-system\SKILL.md`
