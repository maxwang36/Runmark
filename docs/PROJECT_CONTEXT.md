# Runmark project context

Last updated: 2026-10-08

This document is the persistent source of truth for product direction and implementation status. Future contributors and coding agents should read it before making product or architecture decisions, then update it when those decisions change.

## Product thesis

Runmark is an interactive playbook runner. It turns procedural notes into a guided workflow that helps a person complete operational work safely and consistently.

It is intentionally not a general notes app. The defining capabilities are:

1. required checks before a run can advance;
2. critical run-specific variables kept visible throughout execution;
3. conditional branches based on earlier answers;
4. screenshots and evidence attached to the step where they matter;
5. resumable run state and a clear completion history.

The initial audience is a single technical operator executing infrastructure and cloud runbooks. Multi-user collaboration may come later but should not complicate the first usable version.

## Experience principles

- Open directly on the working surface, not a marketing page.
- Run mode is the primary experience; editing supports it.
- Make the current action, account/context, prerequisites, and risk obvious.
- Prevent accidental advancement when required checks or variables are missing.
- Keep warnings exceptional and visually distinct.
- Preserve a useful export path so user data is never trapped in one provider.
- Never store AWS credentials, tokens, private keys, or other secrets as playbook variables.

## Current implementation: Phase 1 local-first authoring

The repository contains a localhost-first application built with Next.js, TypeScript, React, Tailwind CSS, and accessible UI primitives. It intentionally uses the standard Next.js development and build commands so a later Vercel deployment remains straightforward.

Implemented:

- playbook library with create, edit, duplicate, delete, JSON import, and JSON export;
- generic playbook and step schema separated from the UI;
- structured builder for steps, checks, variables, warnings, conditions, and screenshots;
- action, verification, decision, and high-risk step types;
- outline paste that converts one numbered line into one draft step;
- conditional steps driven by a variable key and expected value;
- guided runner with gated progression and pinned variables;
- per-step notes, template screenshots, and run-specific screenshot evidence;
- one resumable run per playbook;
- IndexedDB repository for playbooks, Blob images, and run state;
- editable Transit Gateway migration stored as ordinary seed data;
- responsive desktop and mobile layouts.

Prototype limitations:

- there is one resumable run per playbook rather than a named run history;
- outline paste handles one step per non-empty line and does not yet retain nesting;
- variable values do not yet have AWS ID or CIDR format validation;
- Markdown import/export is not yet implemented;
- the builder uses explicit Save rather than autosave or revision history;
- IndexedDB is device-local and has no synchronization or authentication;
- no Vercel or other hosted deployment has been configured.

## Planned phases

### Phase 1: Editable local playbooks — functional, with follow-up polish

Goal: prove that a user can turn existing notes into a reusable playbook without cloud services.

- Improve outline parsing to retain nested steps and descriptions.
- Add named run history rather than one active run per playbook.
- Add Markdown import/export alongside the implemented JSON format.
- Add lightweight validation for AWS account IDs, resource IDs, and CIDRs.
- Add autosave, dirty-state protection, and simple playbook revision history.
- Add file-size validation and clearer storage-usage feedback for screenshots.
- Keep persistence local while the interaction model is still changing rapidly.

### Phase 2: Hosted personal application

Goal: make Runmark privately available across devices.

- Deploy the web app to Vercel.
- Use Supabase for passwordless authentication, Postgres data, and private file storage.
- Enforce ownership through Row Level Security.
- Use signed URLs for private screenshots.
- Compress images before upload and define file-size limits.
- Add migrations, error states, loading states, and export/backup flows.

This phase requires a fresh review of provider limits and security settings before implementation. Free-plan availability must not be assumed permanently.

### Phase 3: Team and governance features

Only pursue after the personal workflow is proven useful.

- shared playbooks and role-based access;
- immutable playbook versions for active runs;
- approvals for high-risk gates;
- comments, run history, and audit records;
- organization templates and ownership transfer.

### Phase 4: Optional intelligence and integrations

- AI-assisted conversion of rough documentation into a draft schema;
- suggested variables, checks, and branches;
- optional read-only AWS validation using a deliberately scoped integration;
- never require AI or an AWS connection for the core product to work.

## Current local domain model

```text
Playbook
  id, title, description, version, status, timestamps, steps[]

PlaybookStep
  id, type, title, instructions, context, warning
  checks[], variables[], condition?, attachments[]

VariableDefinition
  id, key, label, type, placeholder, options[], required

PlaybookRun
  id, playbook_id, playbook_version, status, current_step_id
  values{}, checked{}, notes{}, evidence{}, timestamps

StoredImage
  id, name, MIME type, Blob
```

For the hosted multi-run phase, playbook versions should become immutable once used by a run. Editing a published playbook should create a new version so old run history remains understandable.

## Safety and privacy decisions

- Treat screenshots as private by default.
- Strip or avoid relying on image metadata where practical.
- Use explicit file type and size validation on both client and server.
- Do not place secret values in browser storage, logs, URLs, analytics, or error reports.
- Variables should support a `sensitive` classification; truly secret variable types should be disallowed rather than merely masked.
- Destructive builder actions require confirmation once durable persistence exists.

## Near-term success criteria

Before introducing a backend, the local application should demonstrate that a user can:

1. create a useful playbook from existing notes in under ten minutes;
2. start and resume a named run;
3. understand exactly why the next step is blocked;
4. see every critical variable without searching through prior steps;
5. attach a screenshot to the correct template step or run step;
6. export the playbook and run data.

## Persistence boundary

`lib/runmark/repository.ts` defines the `PlaybookRepository` interface and its IndexedDB implementation. UI components depend on repository operations rather than directly accessing IndexedDB. The hosted phase should introduce a Supabase-backed implementation for Postgres records, private object storage, and authentication while retaining JSON export as an escape hatch.

## Next recommended implementation slice

Use the local builder on several real workflows and fix authoring friction first. The most valuable follow-up is nested outline parsing plus named run history. After the schema feels stable, implement Supabase authentication, Postgres persistence, private screenshot storage, and a one-time “upload local playbooks” migration before deploying to Vercel.
