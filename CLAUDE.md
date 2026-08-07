# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`GiBruGa/Functional-Breakdown-Structure` hosts two UrBizia tools sharing one Supabase backend and
one static deploy (GitHub Pages):

- **FBS** (`FBS.html`, v12.0) — the functional-breakdown-structure tree editor. This is the
  reference tool: it owns the FBS tree (EF/CC nodes), the acronym/lexique/competence reference
  data, and the "contractors + scope of work" data used to solicit bureaux d'études.
- **RFQ** (`rfq.html`, v7.6) — "Request for Quotation" / "Demande de Devis". A read-only view of
  the FBS tree for a bureau d'études, plus a form to declare interest and answer SOW (scope of
  work) questions per function. Answers are written straight to Supabase (`sow` table), which FBS
  then displays.

Both are single-page, no-build-step static web apps (open the HTML file or serve the directory —
no npm/webpack/bundler). `index.html` is a trivial redirect to `FBS.html`.

Access to both tools is gated behind **EkoMa**: there's no local login UI here, users sign in on
EkoMa and are redirected in with an existing Supabase session. See "Auth gate" below.

## File layout

```
index.html          redirect to FBS.html — don't touch
FBS.html             FBS markup only (<head> links/scripts, <body> markup)
fbs.css / fbs.js      FBS-specific styles / logic
rfq.html              RFQ markup only
rfq.css / rfq.js      RFQ-specific styles / logic
common.css / common.js  shared between both apps — see "common.* contents" below
exceljs.min.js        vendored, minified ExcelJS bundle (+ its own deps: buffer, ieee754,
                       JSZip/pako, xmlchars) — used only by fbs.js's exportExcel(). Not modified
                       by us; treat as an opaque third-party blob, don't hand-edit it.
scripts/migrate.js    one-time legacy-data migration helper — see its header comment, not needed
                       for day-to-day use
.claude/static-server.ps1  minimal local static file server for manual verification (no Node/Python
                       in this environment) — `powershell -File .claude/static-server.ps1 -Root . -Port 8792`,
                       then open http://localhost:8792/FBS.html
```

`FBS.html`/`rfq.html` used to each embed their own `<style>`/`<script>` inline (up to ~2500 and
~1200 lines respectively, including a ~300KB embedded seed-data JSON blob and a ~140KB embedded
logo image as base64). They were split into the files above (2026-08) purely for readability —
same load order, same behavior, nothing renamed at the DOM/API level.

**Editing `fbs.js`/`rfq.js`**: both files still contain large embedded base64/JSON blobs on single
lines (`INITIAL_RAW` in `fbs.js` — legacy local seed data, still used as the `localStorage`
fallback when nothing is cached yet; `LOGO_B64` in both — logo fallback before the SVG identity
loads from Supabase). Don't try to read or hand-edit those lines directly; if you need to move code
around them, use line-range shell extraction (`sed -n`) and verify with checksums rather than
copy-pasting through an LLM context window, the same way this split was done.

## common.* contents

Shared code/styles used by both apps, following the existing convention (see the header comment in
each file). Roughly two layers:

- **Generic DOM helpers**: `makeEl`, `app` (chain-append children), `makeInput`/`makeSelect`/
  `makeTextarea`/`makeFF` (form-field builders), `clone` (deep clone via JSON), `showModal`/
  `closeModal` (the `#mo`/`#modal`/`#modal-title`/`#modal-body`/`#modal-foot` modal contract both
  apps' markup provides).
- **Acronym badges**: `buildAcrMap`, `acrIconSrc`, `makeBadgeEl`, `makePillsEl` — rendering the
  small colored/icon badges (application/besoin/risque/phase) next to FBS tree nodes.
- `common.css` mirrors this: a shared design system (CSS variables, toolbar, buttons, filters,
  detail panel, SOW cards, modal, form fields, scrollbar, context menu) plus the tree-node/badge
  styles. `fbs.css`/`rfq.css` hold only what genuinely differs between the two apps' layouts
  (column widths, a couple of app-specific panels).

Only move code here if it's byte-identical (or trivially parameterizable) between FBS and RFQ —
don't force two different things to share an implementation.

## Auth gate (EkoMa)

Both apps load `https://gibruga.github.io/EkoMa/auth-gate.js` (published from the `EkoMa` repo) and
call `initEkoGate({ sb, tool, onGranted, onSignedOut, ... })` once their Supabase client `sb` is
created. That module owns the `#auth-overlay` show/hide logic, the `has_tool_access` RPC check, and
the session-change listener — see its own header comment for the exact contract. The `#auth-overlay`
markup itself (styling, "Aller sur EkoMa" link text) stays in `FBS.html`/`rfq.html` since it's
app-specific chrome, just not the JS behind it.

App-specific code that stays local: `doSignOut()` (calls `sb.auth.signOut()` then
`gate.showAuthOverlay()`), and whatever each app does once access is granted — FBS calls
`refreshFromSupabase()` then `maybeRunBackup()`; RFQ calls `refreshFromSupabase()` then
`initSplitter()`.

**Dependency**: `auth-gate.js` lives in the `EkoMa` repo, not this one. Changes here that depend on
it (e.g. its exact callback contract) must land after EkoMa's `auth-gate.js` is merged and deployed
to `https://gibruga.github.io/EkoMa/`, or the pages will fail to load `initEkoGate` at all.

## Supabase

Single project, referenced directly by URL + anon key in both `fbs.js`/`rfq.js` (`SUPABASE_URL`/
`SUPABASE_ANON_KEY` — the anon key is meant to be public, access control is via RLS + `tool_access`,
not key secrecy).

Tables in use:
- **Reference data** (shared across all users, admin-writable): `fbs` (the tree nodes), `pcrm`
  (parent/child links + manual order), `acronymes`, `competences`, `lexique`, `lexique_domaines`.
  As of the "Extract admin/reference-data editing to EkoMa" change, these are edited from EkoMa's
  admin panel, not from FBS/RFQ — `syncReferenceToSupabase()` in `fbs.js` is now admin-only and
  deliberately does **not** touch acronymes/competences/lexique/lexique_domaines (see its comment)
  to avoid clobbering concurrent edits made from EkoMa.
- **Work data**: `contractors` (bureaux d'études) and `sow` (scope-of-work answers, keyed by
  contractor + FBS node) — visible to everyone, writable only by their `owner_id`.
- **Access control**: `tool_access` (per-user, per-tool grants) via the `has_tool_access(p_tool,
  p_min_role)` RPC — same mechanism used by the other UrBizia tools (EkoMa/SpotSan/StatSan).
- **Edge function**: `backup-database`, triggered best-effort from FBS on login if the last backup
  is >7 days old (`maybeRunBackup()`), storing to the `db-backups` Storage bucket.

## Known leftover code (not removed, flagged in place)

A repo-wide grep found a cluster of functions in `fbs.js` (and one in `rfq.js`, `iconImg`) with no
call sites anywhere in the repo — see the comment block near the top of `fbs.js` for the full list.
They look like remnants of UI removed in earlier commits (an old context-menu "Editer"/"Ajouter un
lien", an old per-contractor "scope" checkbox UI superseded by RFQ's `declareInterest` flow, and
admin forms extracted to EkoMa). Left in place rather than deleted blind — verify each is truly
unreachable before removing.

## Conventions specific to this codebase

- French throughout: UI strings, comments, domain terms (EF/CC = "Elément Fonctionnel"/"Contrainte
  de Conception", BE = "bureau d'études", SOW = scope of work). Match this for new code/comments.
- No framework, no bundler, no minifier — plain `var`/`function`, DOM built with `makeEl`/`app`
  rather than template strings or a UI library. Keep new code the same style.
- State lives in one global `state` object per app, persisted to `localStorage` (`persist()`) and
  debounced-synced to Supabase (`persistToSupabase()`). Both apps' `refreshFromSupabase()` overwrite
  `state` wholesale from the latest server data — there's no merge/conflict-resolution logic beyond
  "last write wins" and the admin-only reference-data guard mentioned above.
