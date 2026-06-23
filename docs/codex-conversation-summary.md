# Rabbit Holes Development Summary

## Project Overview

Rabbit Holes is a browser extension and web application that turns messy browsing sessions into structured investigations. Instead of treating browser history as a flat list of tabs, Rabbit Holes captures searches, pages, navigation paths, and session metadata, then clusters them into named “rabbit holes” with maps, timelines, summaries, and replayable research trails.

The product direction evolved toward a premium, minimal, editorial aesthetic: warm paper textures, dark-brown ink tones, watercolor rabbit-hole artwork, strong serif typography, and calm interface motion.

## Core Product Goal

Build a smart browser history product that helps users answer:

- What was I researching?
- How did I get from one page to another?
- What pages, searches, and topics belonged together?
- Can I return to a past investigation without reconstructing everything manually?

The extension is intended to behave like an always-on browser companion: quietly capturing useful research context in the background, then letting the user generate structured rabbit holes when needed.

## Main Work Completed

### 1. Landing Page and Visual Direction

The initial landing page went through multiple iterations to establish the final brand feel.

Final direction:

- Premium editorial layout.
- Large serif title treatment.
- Off-white paper background with subtle texture.
- Watercolor rabbit and rabbit-hole artwork.
- Minimal navigation and CTA structure.
- Support for light and dark modes.
- Consistent tagline: `Smart history for your research.`

Major visual decisions:

- Removed distracting or inconsistent rabbit animations.
- Replaced overly complex sprite-based rabbit motion with a cleaner static/watercolor visual direction.
- Cleaned up buttons to avoid image thumbnails inside CTAs.
- Standardized button labels to text-only where possible.
- Simplified popup and app branding to use clean text rather than broken or crowded logo marks.

### 2. Watercolor Asset Cleanup

Several rabbit and rabbit-hole image directions were tested and replaced. The final implementation uses a single primary watercolor rabbit-hole hero image stored as a named asset.

Completed asset cleanup:

- Removed unused duplicate rabbit images.
- Moved active image assets into appropriate public/asset folders.
- Renamed active assets clearly.
- Replaced old inconsistent hole/rabbit compositions.
- Removed image thumbnails from buttons.
- Regenerated favicons using the watercolor rabbit asset.

### 3. Dashboard and App UI Polish

The dashboard and internal pages were cleaned up to reduce dead space and better match the product aesthetic.

Completed improvements:

- Expanded and polished the left sidebar.
- Added consistent dark-mode styling across app pages.
- Cleaned up dashboard cards and empty states.
- Added live session stats to match extension counters.
- Added profile/account placement in the sidebar.
- Improved settings page styling based on the desired reference layout.
- Reduced clutter in the Chrome extension popup.
- Added play, pause, and stop recording controls.
- Made buttons align better with the dark/light theme system.

### 4. Chrome Extension Popup

The Chrome extension popup was rebuilt to match the web app’s visual language.

Final popup behavior:

- Shows Rabbit Holes branding.
- Displays current session stats:
  - Pages
  - Searches
  - Tabs
- Shows current capture state:
  - Capturing
  - Paused
  - Stopped
- Includes recording controls:
  - Play/resume
  - Pause
  - Stop
- Includes a `Build rabbit holes` action.
- Includes sign-in and sign-out flows.
- Opens the web dashboard from a compact top-right arrow button.

Important fixes:

- Removed cluttered settings button from popup.
- Replaced it with a cleaner dashboard/open action.
- Fixed session-expired handling so the user is prompted to sign in again.
- Improved popup theme consistency.
- Removed image icons from buttons.
- Fixed broken wordmark rendering in the popup.

### 5. Authentication and Accounts

Supabase authentication was added to support persistent user accounts.

Implemented account features:

- Supabase project connected.
- Google OAuth configured.
- Email/password account flow added.
- Login page created.
- Signup page created.
- Auth callback routes added.
- Settings/profile areas added.
- Sidebar account card added.
- Sign-in/sign-out transitions improved to reduce flashing and redirect glitches.

Production OAuth work completed:

- Supabase redirect URLs configured for production Railway URL.
- Google OAuth client configured.
- App renamed consistently to `Rabbit Holes`.

### 6. Backend and Database Integration

The backend was connected to Supabase Postgres through Railway environment variables.

Implemented backend work:

- Added production database schema initialization.
- Added persistent app user records.
- Added sessions table.
- Added events table.
- Added rabbit holes table.
- Added backend health endpoint reporting database status.
- Added event ingestion from extension.
- Added clustering endpoint.
- Added backend stats endpoint.
- Added export and clear endpoints.

Production health result:

```json
{"ok":true,"db":{"configured":true,"available":true,"disabled_reason":null}}
```

### 7. Session Capture and Rabbit Hole Generation

The extension captures browsing events and sends them to the backend.

Captured event types include:

- Page visits.
- Search events.
- Page titles.
- Tab opens.
- Tab closes.
- Navigation/referrer metadata.

Rabbit hole generation flow:

1. User browses normally.
2. Extension captures pages/searches/tabs.
3. User clicks `Build rabbit holes`.
4. Extension flushes queued events.
5. Backend clusters the session.
6. Web dashboard displays generated rabbit holes.
7. User can inspect maps, timelines, summaries, and related pages.

Important fix:

Duplicate detection was moved beyond frontend-only `localStorage`. The backend now stores source signatures so repeat clustering can detect when there is no meaningful new browsing context.

### 8. Rabbit Hole Library Management

The dashboard library was expanded with controls for managing generated holes.

Implemented features:

- Search rabbit holes.
- Filter by:
  - Active
  - Favorites
  - Archived
  - All
- Sort by:
  - Recent
  - Pages
  - Confidence
- Favorite rabbit holes.
- Archive rabbit holes.
- Delete rabbit holes.
- Bulk select multiple holes.
- Bulk favorite/archive/delete actions.

Backend persistence added:

- `GET /holes`
- `PATCH /holes/{client_id}`
- `POST /holes/bulk`

Persistent metadata fields added:

- `client_id`
- `favorite`
- `archived`
- `deleted_at`

### 9. Map, Timeline, Replay, and Summary Views

Several product views were implemented or improved to make Rabbit Holes feel like more than a history list.

Implemented or improved views:

- Dashboard.
- Map page.
- Timeline page.
- Heatmap page.
- Settings page.
- Individual rabbit hole detail pages.
- Shareable rabbit hole pages.
- Discovery/replay-style components.
- “You Are Here” floating context component.

Product concepts implemented:

- Rabbit Hole Maps.
- Discovery chains.
- Investigation replay.
- End-of-hole style summaries.
- Session DNA-style stats cards.
- Curiosity heatmap.
- Shareable rabbit hole pages.
- Persistent browsing context indicator.

### 10. Loading and Discovery Overlay

The rabbit-hole generation loading screen was redesigned.

Final direction:

- Darker backdrop.
- Defined premium card instead of washed-out full-screen haze.
- Larger centered watercolor rabbit-hole image.
- Words flow subtly toward the hole.
- Strong bottom panel with title and subtitle.
- Cleaner progress accent.

Removed from buttons:

- Rabbit-hole image thumbnails.
- Decorative image icons.
- Broken rabbit-ear logo usage in button text.

### 11. Deployment and Infrastructure

The app was deployed through Railway.

Production URLs:

- Web app: `https://web-production-bde52.up.railway.app`
- Backend API: `https://rabbit-holes-production.up.railway.app`

Railway configuration completed:

- Backend service configured.
- Web service configured.
- Database URL added.
- Environment variables updated.
- Backend health verified.
- Rate-limit variables added.

Rate limits configured:

```text
RATE_LIMIT_EVENTS_PER_MIN=240
RATE_LIMIT_CLUSTER_PER_HOUR=20
RATE_LIMIT_AI_PER_HOUR=60
RATE_LIMIT_READS_PER_MIN=120
```

Security/build fix:

- Updated Next.js from `14.2.5` to `^14.2.35` to address Railway vulnerability scanner failures.
- Regenerated lockfile.
- Confirmed production build passes.

### 12. Legal and Launch Readiness

Basic legal/support pieces were added.

Completed:

- Terms page.
- Privacy page.
- Support email added: `aa5851@columbia.edu`.
- Chrome Web Store checklist added.
- Extension packaging script added.

Chrome packaging:

```bash
./scripts/package-extension.sh
```

Output:

```text
dist/rabbit-holes-chrome-extension.zip
```

Chrome Web Store documentation created:

```text
docs/chrome-web-store.md
```

Includes:

- Listing copy.
- Permission justifications.
- Privacy disclosures.
- Manual submission checklist.
- Pre-submit smoke test.

## Key Technical Files Changed

Major frontend areas:

```text
web/app/page.tsx
web/app/dashboard/page.tsx
web/app/settings/page.tsx
web/app/login/page.tsx
web/app/signup/page.tsx
web/app/layout.tsx
web/components/Sidebar.tsx
web/components/DiscoverButton.tsx
web/components/HoleCard.tsx
web/components/Logo.tsx
web/lib/api.ts
web/lib/discovery.ts
web/lib/store.ts
```

Major backend areas:

```text
backend/app/main.py
backend/app/db.py
backend/app/store.py
backend/app/schemas.py
backend/app/rate_limit.py
backend/.env
```

Extension areas:

```text
extension/manifest.json
extension/popup.html
extension/popup.js
extension/background.js
extension/config.js
extension/auth-relay.js
extension/stats-bridge.js
```

Docs/scripts added:

```text
docs/chrome-web-store.md
scripts/package-extension.sh
```

## Validation Completed

Repeated checks were run throughout development.

Successful checks included:

```bash
npm run build --prefix web
python3 -m py_compile backend/app/*.py
./scripts/package-extension.sh
curl https://rabbit-holes-production.up.railway.app/health
```

Confirmed:

- Frontend production build passes.
- Backend Python compile passes.
- Extension package builds.
- Production backend health endpoint reports database available.
- GitHub commits pushed to `main`.

## Current Status

Rabbit Holes now has:

- A polished landing page.
- A functioning web app dashboard.
- Supabase authentication.
- Google OAuth.
- A connected production backend.
- Database-backed event/session storage.
- Chrome extension popup and capture flow.
- Rabbit hole generation flow.
- Dashboard library management.
- Map/timeline/settings/detail/share pages.
- Legal pages.
- Chrome packaging docs and script.

## Remaining Launch Blockers

### 1. Chrome Web Store Submission

Still manual:

- Create/open Chrome Web Store Developer account.
- Pay developer registration fee if needed.
- Upload packaged extension zip.
- Add screenshots.
- Fill privacy and permissions declarations.
- Submit for review.

### 2. Store Screenshots and Promotional Assets

Need final screenshots of:

- Chrome popup.
- Dashboard.
- Map page.
- Generated rabbit hole detail.
- Settings page.

Optional but useful:

- Promotional tile.
- Short demo GIF/video.

### 3. Cross-Device Hole Rehydration

Backend now persists hole metadata and event data, but the frontend still primarily uses locally generated hole objects for rich rendering. The next backend step is to persist and rehydrate complete rabbit hole objects, including pages, searches, maps, summaries, and timeline data.

### 4. Browser Support Beyond Chrome

Current packaged path is Chrome/Chromium.

Supported or near-supported:

- Chrome.
- Edge.
- Brave.
- Arc.
- Opera.

Still future work:

- Firefox extension packaging.
- Safari extension packaging.

### 5. Mobile Navigation Polish

A mobile bottom nav was added, but a dedicated mobile UX pass is still needed for:

- Dashboard density.
- Map interactions.
- Sidebar replacement.
- Settings/account layout.

### 6. Production Domain Setup

If a custom domain is purchased, update:

- Railway web domain.
- Railway backend CORS/env vars.
- Supabase Site URL.
- Supabase Redirect URLs.
- Google OAuth authorized origins.
- Google OAuth redirect URLs.
- Extension manifest externally connectable URLs.
- Extension content script matches.
- Chrome Web Store listing URLs.

## Final Product Positioning

Rabbit Holes should be pitched as:

> Smart browser history for your research.

It is not just a bookmarking tool or browser history viewer. It is a structured memory layer for curiosity, turning scattered sessions into coherent investigations that users can revisit, understand, and share.
