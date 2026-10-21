# Runmark

Runmark turns operational documentation into guided, verifiable playbook runs. It is a local-first Next.js application: create any workflow in the builder, save it in the browser, and run it with required checks, critical variables, branches, notes, and screenshots.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js, normally `http://localhost:3000`.

## What works now

- Playbook library with create, edit, duplicate, delete, import, and export
- Generic step builder with action, verification, decision, and high-risk step types
- Required checks and critical text or choice variables
- Conditional steps based on variable values
- Paste a numbered outline to create several draft steps quickly
- Reference screenshots stored with a playbook
- Guided runner with gated progression, notes, and run-specific evidence
- One resumable local run per playbook
- IndexedDB persistence for structured data and image blobs
- Editable Transit Gateway migration included as sample data

## Local data model

All playbooks, screenshot blobs, and run state are stored in IndexedDB for the current browser profile. Data survives reloads and browser restarts but does not sync across devices. Clearing site data removes it, so use **Export JSON** for backups.

The persistence API lives behind `PlaybookRepository` in `lib/runmark/repository.ts`. A future Supabase implementation can replace it without coupling the builder or runner to a specific database.

## Project direction

The durable product decisions, implementation status, data model, and roadmap live in [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md). Update that document whenever scope or architecture changes so future work does not depend on chat history.

## Useful commands

```bash
npm run dev
npm run build
npm run lint
```
