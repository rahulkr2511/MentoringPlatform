# Playwright end-to-end testing

This document describes how Playwright is set up for the **Client** app, how to run tests, and what each suite expects from the environment.

## Location and tooling

<table style="border-collapse:collapse;width:100%;max-width:42rem;margin:0.75rem 0 1rem;font-size:0.95em;">
  <thead>
    <tr style="background:#f4f6f8;">
      <th style="border:1px solid #cfd8dc;padding:0.65rem 1rem;text-align:left;font-weight:600;">Item</th>
      <th style="border:1px solid #cfd8dc;border-left:none;padding:0.65rem 1rem;text-align:left;font-weight:600;">Path / command</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #cfd8dc;border-top:none;padding:0.65rem 1rem;vertical-align:top;">Config</td>
      <td style="border:1px solid #cfd8dc;border-top:none;border-left:none;padding:0.65rem 1rem;vertical-align:top;"><code>Client/playwright.config.ts</code></td>
    </tr>
    <tr style="background:#fafbfc;">
      <td style="border:1px solid #cfd8dc;border-top:none;padding:0.65rem 1rem;vertical-align:top;">Spec files</td>
      <td style="border:1px solid #cfd8dc;border-top:none;border-left:none;padding:0.65rem 1rem;vertical-align:top;"><code>Client/tests/*.spec.ts</code></td>
    </tr>
    <tr>
      <td style="border:1px solid #cfd8dc;border-top:none;padding:0.65rem 1rem;vertical-align:top;">NPM scripts</td>
      <td style="border:1px solid #cfd8dc;border-top:none;border-left:none;padding:0.65rem 1rem;vertical-align:top;"><code>Client/package.json</code> → <code>test:e2e</code>, <code>test:e2e:ui</code></td>
    </tr>
    <tr style="background:#fafbfc;">
      <td style="border:1px solid #cfd8dc;border-top:none;padding:0.65rem 1rem;vertical-align:top;">Dev dependency</td>
      <td style="border:1px solid #cfd8dc;border-top:none;border-left:none;padding:0.65rem 1rem;vertical-align:top;"><code>@playwright/test</code></td>
    </tr>
  </tbody>
</table>

Install browser binaries once (after `npm install` in `Client`):

```bash
cd Client && npx playwright install
```

## Configuration summary

`playwright.config.ts` sets:

- **`testDir`**: `./tests` (relative to `Client/`).
- **`baseURL`**: `http://localhost:3000` — `page.goto('/')` resolves to the React dev server root.
- **`webServer`**: runs `npm run start` with `BROWSER=none`, waits until `http://localhost:3000` responds, then runs tests.
- **`reuseExistingServer`**: `!process.env.CI` — locally, if something is already listening on port **3000**, Playwright reuses it instead of failing. In CI (`CI` set), it always tries to start the dev server; the port must be free.
- **`projects`**: Chromium, Firefox, and WebKit — each spec runs across all three unless you narrow with `--project`.
- **`use.trace`**: `on-first-retry` — a trace is captured when a failed test is retried (retries are enabled when `CI` is set).
- **Reporter**: HTML report (see [Reports](#reports)).

## How to run

From the **Client** directory:

```bash
# All browsers, all tests
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Single file or grep
npx playwright test tests/home.spec.ts
npx playwright test tests/auth.spec.ts
npx playwright test -g "mentee"

# One browser only (faster local feedback)
npx playwright test --project=chromium
```

If you see an error that **port 3000 is already in use** and Playwright refuses to start:

- Stop the other process on 3000, **or**
- Unset `CI` so reuse is allowed: `CI= npm run test:e2e` (macOS/Linux).

## Backend and API URL

The React app talks to the Spring API via `Client/src/config/env.js`:

- Default **`API_BASE_URL`**: `http://localhost:8080/monitoringPlatform`
- Override with **`REACT_APP_API_BASE_URL`** when starting the client (including the Playwright-started dev server — set it in your shell or in a `.env` file that Create React App loads).

### Suite requirements

<table style="border-collapse:collapse;width:100%;max-width:42rem;margin:0.75rem 0 1rem;font-size:0.95em;">
  <thead>
    <tr style="background:#f4f6f8;">
      <th style="border:1px solid #cfd8dc;padding:0.65rem 1rem;text-align:left;font-weight:600;">Suite</th>
      <th style="border:1px solid #cfd8dc;border-left:none;padding:0.65rem 1rem;text-align:left;font-weight:600;">Needs API (port 8080)</th>
      <th style="border:1px solid #cfd8dc;border-left:none;padding:0.65rem 1rem;text-align:left;font-weight:600;">Needs database</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #cfd8dc;border-top:none;padding:0.65rem 1rem;vertical-align:top;"><code>tests/home.spec.ts</code></td>
      <td style="border:1px solid #cfd8dc;border-top:none;border-left:none;padding:0.65rem 1rem;vertical-align:top;">No</td>
      <td style="border:1px solid #cfd8dc;border-top:none;border-left:none;padding:0.65rem 1rem;vertical-align:top;">No</td>
    </tr>
    <tr style="background:#fafbfc;">
      <td style="border:1px solid #cfd8dc;border-top:none;padding:0.65rem 1rem;vertical-align:top;"><code>tests/auth.spec.ts</code></td>
      <td style="border:1px solid #cfd8dc;border-top:none;border-left:none;padding:0.65rem 1rem;vertical-align:top;">Yes</td>
      <td style="border:1px solid #cfd8dc;border-top:none;border-left:none;padding:0.65rem 1rem;vertical-align:top;">Yes (signup/login persist users)</td>
    </tr>
  </tbody>
</table>

Start the **Server** separately with a working datasource (see `Server/src/main/resources/application.properties`). Playwright does **not** start the JVM or Postgres.

## What each spec file does

### `home.spec.ts`

Smoke tests for the **marketing home** view and client-side navigation (the app does not use path-based routes for these screens; the URL stays `/`).

- Verifies document title.
- **Get Started** and **Login** open the auth experience.
- From auth, **Sign up** exposes the create-account flow.

These tests do not call the registration API.

### `auth.spec.ts`

Full-stack flows: **sign up** (POST `/monitoringPlatform/auth/signup`) then **sign in** (POST `/monitoringPlatform/auth/login`), for both **MENTEE** and **MENTOR** (role chosen in the signup form).

Assertions after login:

- Mentee: mentee dashboard heading and welcome copy.
- Mentor: mentor dashboard heading and welcome copy.

Usernames are generated to stay within server validation (length, uniqueness) and to reduce collisions when tests run in parallel.

## Reports and debugging

- **HTML report**: after a run, open the report path printed in the terminal, or run `npx playwright show-report` from `Client`.
- **UI mode**: `npm run test:e2e:ui` — pick tests, watch steps, time travel.
- **Trace viewer**: when a retry runs, use the trace file Playwright points to, or `npx playwright show-trace <file.zip>`.

## CI notes

When `CI` is set:

- `forbidOnly`: `test.only` fails the run.
- **Retries**: 2 per failed test.
- **Workers**: 1 (serial-ish parallelism).
- **`reuseExistingServer`**: false — ensure port 3000 is free or run the client another way and adjust config if needed.

## Troubleshooting

- **Auth tests fail with network or 4xx/5xx**: Confirm the Spring app is up, CORS and SockJS settings allow the client origin (default dev: `http://localhost:3000` vs API on `:8080`; see `SecurityConfig` / `WebSocketConfig`), and the DB matches `application.properties` (user, database name, Postgres running). A local `psql` “role does not exist” error means your OS user or Postgres roles do not match that file — align credentials or use the commented H2 profile for isolated runs.
- **Flaky timing**: Increase timeouts in the spec or stabilize the app (e.g. wait for specific API responses — `auth.spec.ts` already waits for signup/login responses).
- **Wrong API host in tests**: Set `REACT_APP_API_BASE_URL` before `npm run start` / Playwright so the bundle points at the correct server.

## Related files

- `Client/playwright.config.ts` — global Playwright options.
- `Client/tests/` — spec implementations.
- `Client/src/config/env.js` — API base URL for the SPA.
