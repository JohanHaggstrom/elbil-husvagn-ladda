# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Elbil. Husvagn. Ladda." is a Swedish web app helping electric vehicle owners with caravans find suitable charging stations. It integrates with the NOBIL API for charging point data.

## Commands

### Frontend (`/frontend`)

```bash
npm start          # Dev server on port 4200
npm run build      # Production build
npm test           # Run unit tests (Karma/Jasmine)
npm run clean-start  # Clear Angular cache and restart
```

Run a single test file by passing `--include` to the test command or by using the Karma test runner's focus feature (`fdescribe`/`fit`).

### Backend (`/backend/ElbilHusvagnLadda.WebApi`)

```bash
dotnet run         # Dev server on port 5171
dotnet build       # Build
dotnet test        # Run tests (from solution root)
```

## Architecture

### Frontend (Angular 21)

Feature-based folder structure under `frontend/src/app/`:

- `charge-points/` — Charging station list and detail views
- `map/` — Leaflet-based map with marker clustering
- `services/` — All API calls and shared business logic
- `models/` — TypeScript interfaces/DTOs
- `auth/` — Login, token handling
- `admin/`, `admin-feedback/`, `admin-suggestions/` — Admin views
- `interceptors/` — HTTP interceptors (auth token injection, error handling)
- `dialogs/` — Reusable Angular Material dialogs
- `shared/` — Layout primitives and reusable UI building blocks

State management uses Angular Signals. HTTP calls go through services, which talk to the backend REST API. The NOBIL API is proxied through the backend (cached 7 days).

### Backend (.NET 8 Web API)

Layered structure under `backend/ElbilHusvagnLadda.WebApi/`:

- `Controllers/` — REST endpoints (10 controllers)
- `Services/` — Business logic (NOBIL integration, email, password)
- `Models/` — DTOs, entities, request/response types
- `Data/AppDbContext.cs` — Entity Framework Core (MariaDB via Pomelo)
- `Middleware/` — API key validation
- `Migrations/` — EF Core migrations

On startup (`Program.cs`): migrations run automatically and a default superadmin is created if no users exist. JWT Bearer is used for auth; an API key middleware adds an additional security layer.

## Coding Standards

### General
- 4-space indentation

### Angular / TypeScript
- Use Angular **control flow syntax** (`@if`, `@for`, `@switch`) — never `*ngIf`, `*ngFor`
- Standalone components only — no NgModules
- Use `inject()` for dependency injection — not constructor injection
- Use Angular Signals for state — prefer over RxJS where possible
- `ChangeDetectionStrategy.OnPush` by default
- No `any` — strict typing throughout

### C#
- Use `string.Empty` instead of `""`
- Nullable reference types are enabled — handle nulls explicitly

## UI Design System

Every routed subpage uses the same shell so the layout, spacing and back navigation stay consistent. Home (`/`) is the layout reference; login is the only intentional exception (hero page with its own backdrop).

### Page layout

Every page (except home and login) wraps content like this:

```html
<app-page-layout variant="form">
    <app-page-header title="Page title" />
    <!-- page content -->
</app-page-layout>
```

- `PageLayoutComponent` (`shared/page-layout/`) — outer chrome at 1400px max-width with 1rem horizontal gutters. The `variant` input (`form` | `list` | `wide`) controls the inner content max-width. Today all three resolve to 1400px; tune the tokens in `styles.scss` if you want to narrow forms again.
- `PageHeaderComponent` (`shared/page-header/`) — back button + title + projected slots for badges (`pageHeaderBadge`) and action buttons (`pageHeaderActions`). Defaults to `Location.back()`; pass `backTo="/some/route"` for an explicit destination, or `[customBack]="true"` plus a `(back)` handler when the parent owns navigation.

### Shared UI primitives

- `EmptyStateComponent` — dashed-border card with icon, title, message, and an action slot. Use for "no data" placeholders.
- `LoadingStateComponent` — centered spinner with optional message. Use while async data loads.
- `VoteButtonComponent` — up/down vote button paired with semantic colour tokens; takes `variant` and `selected` inputs.
- `.form-row` (global utility class in `styles.scss`) — multi-column form row that collapses to a single column at ≤600px. Use instead of per-page flex CSS for side-by-side `mat-form-field`s.

### Design tokens

Defined as CSS variables in `styles.scss`. Never hardcode colours, page widths or spacing — reach for the token. Add new tokens rather than introducing one-off values.

- Layout: `--page-max-width-form/list/wide`, `--page-padding-block/inline`
- Spacing: `--space-xs` (4px) through `--space-2xl` (48px)
- Typography: `--font-size-h1/h2/h3`, `--font-weight-heading` (global `h1/h2/h3` rules already apply these)
- Semantic colours: `--color-success`, `--color-danger`, `--color-warn`, `--color-info`, `--color-accent-gradient-start/end`, `--color-primary-gradient-start/end`
- Theme surfaces: `--bg-primary`, `--bg-secondary`, `--card-bg`, `--input-bg`, `--text-primary`, `--text-secondary`, `--border-color`, `--shadow`

For semi-transparent variants use `color-mix(in srgb, var(--color-X) 10%, transparent)` rather than inventing a new hex.

### Button conventions

- Primary action on a page: `mat-raised-button color="primary"`
- Secondary action: `mat-button`
- Destructive action: `mat-stroked-button color="warn"`, or `mat-icon-button color="warn"` in list rows
- Row-level actions (approve, delete, mark handled) inside lists: always `mat-icon-button`. Do not use `mat-mini-fab` for these — it looked floating and inconsistent with the rest of admin.

### Lists: cards vs `mat-table`

- Use card lists (`mat-card` per item) when entries have long free text, descriptions, or comments (e.g. `admin-feedback`, `admin-suggestions`).
- Use `mat-table` for tabular records with short, scannable fields (e.g. `user-list`).
- Pagination uses `mat-paginator` — styling lives in the global rule in `styles.scss`, don't re-declare per page.

## Behavioral Guidelines

### Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If something is unclear, name what's confusing and ask rather than guessing.

### Simplicity First
- Minimum code that solves the problem — nothing speculative.
- No abstractions for single-use code.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

### Surgical Changes
- Touch only what you must. Match existing style.
- Don't refactor adjacent code that isn't broken.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove imports/variables/functions that **your** changes made unused, but not pre-existing dead code.

### Goal-Driven Execution
- Transform vague tasks into verifiable goals before starting.
- For multi-step tasks, state a brief plan with verification steps.
- Clarifying questions come **before** implementation, not after mistakes.

## Git Commits

- **Language**: English
- **Subject line**: Clear and concise summary of what changed (imperative mood, e.g. "Add filter for cable type")
- **Body**: Describe how the change affects the user — what they can now do, what no longer happens, or what changed behavior they'll notice. Not a list of files touched.

Example:
```
Add filter for cable type on map view

Users can now filter charging stations by cable type directly from the
map, making it easier to find stations compatible with their vehicle.
```
