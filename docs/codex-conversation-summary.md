# Rabbit Holes: Development Summary

## Executive Summary

Rabbit Holes is a browser extension and web application that transforms fragmented browsing history into structured research investigations. Instead of presenting browser history as a flat chronological list, Rabbit Holes captures searches, visited pages, tab activity, and navigation paths, then organizes that activity into coherent “rabbit holes” that users can revisit, inspect, summarize, and share.

The product is positioned as:

> Smart browser history for your research.

The project evolved from an early visual prototype into a functioning full-stack product with a Chrome extension, authenticated web app, production backend, Supabase-backed persistence, OAuth login, rate limiting, legal pages, and Chrome Web Store packaging preparation.

The final product direction is intentionally premium, calm, and editorial: paper-like backgrounds, warm ink tones, strong serif typography, watercolor rabbit-hole artwork, restrained animation, and a minimal interface that emphasizes clarity over dashboard clutter.

## Product Problem

Modern browsing sessions often become scattered across tabs, searches, documents, papers, repositories, and articles. Browser history records individual events, but it does not explain the research thread behind them.

Rabbit Holes addresses this gap by helping users understand:

- What they were actually researching.
- Which pages and searches belonged to the same investigation.
- How one page led to another.
- What key concepts, sources, and questions emerged.
- How to return to an investigation days or weeks later without reconstructing it manually.

The goal is not to replace bookmarks, notes, or browser history. The goal is to create a structured memory layer for curiosity-driven browsing.

## Product Vision

Rabbit Holes should feel like an always-on browser companion that quietly records useful research context in the background. When the user is ready, they can generate a structured rabbit hole from their browsing session.

A generated rabbit hole should include:

- A named investigation.
- The searches that started or shaped it.
- The pages visited during the investigation.
- A visual map of how sources connect.
- A chronological replay of the research journey.
- A summary of key concepts, entities, links, and open questions.
- A way to revisit or share the investigation.

The intended feeling is closer to replaying a research journey than reading a raw browser-history log.

## Design Direction

The visual direction was refined through multiple iterations. Early versions included overly complex rabbit animations, inconsistent sprite sheets, and visual treatments that felt too cluttered or cartoonish. The final direction moved toward a more restrained and polished identity.

### Final Visual Principles

- Premium and editorial rather than playful or game-like.
- Warm paper textures instead of flat white or generic dark UI.
- Watercolor rabbit-hole artwork as the main visual motif.
- Strong serif typography for brand distinction.
- Minimal motion used only where it improves clarity.
- Dark and light themes that feel part of the same system.
- Buttons and controls that are text-first and visually streamlined.

### Key Design Decisions

- Removed excessive rabbit pose animations.
- Removed inconsistent sprite rotations.
- Removed image thumbnails from buttons.
- Replaced broken or crowded logo treatments with clean text branding where appropriate.
- Consolidated around a single primary watercolor rabbit-hole asset.
- Reduced visual noise in the extension popup.
- Improved dashboard spacing, hierarchy, and card styling.
- Added a more polished loading state for rabbit-hole generation.

## Core User Flow

The intended user flow is now:

1. The user installs the browser extension.
2. The user signs into Rabbit Holes.
3. The extension quietly captures browsing context while the user researches normally.
4. The popup displays live session stats such as pages, searches, and tabs.
5. The user can pause, resume, or stop capture.
6. The user clicks `Build rabbit holes`.
7. The extension flushes captured events to the backend.
8. The backend clusters the session into rabbit holes.
9. The web app displays the resulting investigations.
10. The user can inspect maps, timelines, summaries, source pages, and related entities.

## Frontend Work Completed

### Landing Page

The landing page was redesigned to communicate the product as a smart browser-history tool rather than a generic productivity app.

Completed improvements:

- Added a premium editorial layout.
- Added top-left branding.
- Added clear install and sign-in calls to action.
- Added browser-support messaging for Chromium browsers.
- Added scrollable content explaining how the product works.
- Added watercolor rabbit-hole artwork on the right side of the hero.
- Removed confusing headline language and overly derivative copy.
- Removed unnecessary glow effects and distracting decorative elements.
- Added support for dark mode.

### Dashboard

The dashboard was refined into a more usable library view for generated investigations.

Completed improvements:

- Reduced dead space.
- Increased sidebar usability.
- Added cleaner empty states.
- Added dashboard stats that match the extension popup.
- Added library search.
- Added filtering by active, favorite, archived, and all holes.
- Added sorting by recent activity, page count, and confidence.
- Added favorite, archive, and delete actions.
- Added bulk selection and bulk actions.
- Improved card visual hierarchy.

### Settings Page

The settings page was redesigned to match the requested reference style: clean sections, large readable controls, and a premium paper-card feel.

Settings now includes sections for:

- Extension and privacy status.
- Capture preferences.
- Privacy preferences.
- Data sources.
- User data actions.
- Account/profile controls.

### App Navigation

Navigation was improved across desktop and mobile.

Completed improvements:

- Sidebar navigation refined for desktop.
- Profile card moved to the bottom of the sidebar.
- Live capture stats added to the sidebar.
- Dark-mode toggle added.
- Mobile bottom navigation added to cover smaller screens.

Mobile still needs a dedicated refinement pass, but the app is no longer without navigation on small screens.

## Chrome Extension Work Completed

The Chrome extension popup was rebuilt to feel consistent with the web app.

### Popup Features

The popup now includes:

- Rabbit Holes branding.
- Live page/search/tab counters.
- Capture status display.
- Play, pause, and stop controls.
- A `Build rabbit holes` action.
- Sign-in and sign-out states.
- Dashboard open button.
- Account email display.

### Popup Design Improvements

Completed improvements:

- Reduced clutter.
- Removed the settings button from the popup.
- Made the dashboard button compact.
- Standardized dark theme colors.
- Removed decorative images from buttons.
- Fixed broken wordmark rendering.
- Simplified the popup logo to readable text.
- Improved session-expired messaging.

### Extension Behavior

The extension captures browsing events and stores them locally before flushing to the backend.

Captured data includes:

- Page visits.
- Search queries.
- Page titles.
- Tab opens.
- Tab closes.
- Navigation/referrer metadata.
- Session timing metadata.

The popup can now trigger clustering by sending captured context to the backend.

## Backend Work Completed

The backend was expanded from a basic API into a production-connected service with persistence, authentication, health checks, and rate limits.

### Backend Capabilities

Implemented endpoints and capabilities include:

- User session creation.
- Event ingestion.
- Rabbit-hole clustering.
- Live stats.
- Data export.
- Data clearing.
- Rabbit-hole listing.
- Rabbit-hole metadata updates.
- Bulk rabbit-hole actions.
- Backend health checks.

### Important Endpoints

```text
GET    /health
GET    /me
POST   /sessions
POST   /events
POST   /cluster
GET    /signals
GET    /stats
GET    /export
POST   /clear
GET    /holes
PATCH  /holes/{client_id}
POST   /holes/bulk
```

### Duplicate Detection

Duplicate rabbit-hole generation was initially handled locally in the frontend through `localStorage`. This was strengthened by adding backend-side source signatures.

The backend now computes a deterministic signature from captured pages and searches. If the user has not generated any meaningful new browsing context, the backend can return `no_change` instead of generating duplicate rabbit holes.

This improves reliability because duplicate detection is no longer only tied to a single browser’s local state.

## Database Work Completed

Supabase Postgres is connected through Railway environment variables.

### Tables Added

The backend initializes the core schema for:

- `app_users`
- `sessions`
- `events`
- `rabbit_holes`

### Rabbit-Hole Persistence Fields

Additional fields were added to support library management:

- `client_id`
- `favorite`
- `archived`
- `deleted_at`
- `source_signature`

### Persistence Status

The backend now persists:

- Users.
- Sessions.
- Raw browsing events.
- Rabbit-hole records.
- Favorite/archive/delete state.
- Source signatures for duplicate detection.

A future improvement is to persist the complete enriched frontend rabbit-hole object so users can fully rehydrate all maps, summaries, timelines, and generated UI state across devices.

## Authentication Work Completed

Supabase authentication was added for persistent accounts.

Implemented auth features:

- Google OAuth login.
- Email/password signup.
- Login page.
- Signup page.
- Auth callback handling.
- Extension auth relay flow.
- Sidebar account card.
- Sign-in/sign-out handling.
- Production redirect URL configuration.

The app name was standardized as `Rabbit Holes` across the web app, extension, and OAuth setup.

## AI and Clustering Flow

The app clusters browsing context into investigations.

The clustering flow is:

1. Extension captures browsing events.
2. Events are flushed to the backend.
3. Backend deduplicates and organizes pages/searches.
4. Backend sends structured context to the clustering layer.
5. Clustering returns one or more rabbit-hole objects.
6. Rabbit holes are saved and rendered in the web app.

Rabbit-hole objects include:

- Title.
- Description.
- Topics.
- Questions.
- Entities.
- Assigned page IDs.
- Confidence score.

The frontend then turns those cluster results into richer UI objects with pages, searches, graph nodes, edges, timelines, summaries, and display metadata.

## Map, Timeline, Summary, and Replay Work

The app now includes several investigation views intended to make Rabbit Holes more than a history list.

Implemented or improved areas:

- Map view.
- Timeline view.
- Heatmap view.
- Individual rabbit-hole pages.
- Shareable rabbit-hole pages.
- Discovery path panels.
- Investigation replay components.
- Summary cards.
- Session DNA-style analysis cards.
- “You Are Here” floating context component.

These features establish the core product concept: a user should be able to see how a research thread developed, not just what pages they opened.

## Loading and Interaction Polish

The rabbit-hole generation loading state was redesigned to feel premium and intentional.

Final loading state includes:

- Darkened background overlay.
- Defined centered card.
- Watercolor rabbit-hole image.
- Subtle word motion toward the hole.
- Strong bottom title panel.
- Progress accent bar.

This replaced an earlier washed-out full-screen overlay that made the app hard to read.

## Deployment Work Completed

The project is deployed through Railway.

Production services:

```text
Web app:     https://web-production-bde52.up.railway.app
Backend API: https://rabbit-holes-production.up.railway.app
```

Backend production health was verified:

```json
{"ok":true,"db":{"configured":true,"available":true,"disabled_reason":null}}
```

### Security and Build Fixes

Railway initially blocked deployment because the project used an outdated Next.js version with known high-severity CVEs.

Completed fix:

- Updated Next.js from `14.2.5` to `^14.2.35`.
- Regenerated `package-lock.json`.
- Confirmed production build passes.

### Rate Limits

Rate limits were configured through Railway environment variables:

```text
RATE_LIMIT_EVENTS_PER_MIN=240
RATE_LIMIT_CLUSTER_PER_HOUR=20
RATE_LIMIT_AI_PER_HOUR=60
RATE_LIMIT_READS_PER_MIN=120
```

These limits are intended to protect the backend from excessive event ingestion, repeated clustering calls, and high-frequency AI requests.

## Legal, Privacy, and Support Work

Basic launch-support materials were added.

Completed:

- Privacy page.
- Terms page.
- Support email added: `aa5851@columbia.edu`.
- Chrome Web Store checklist.
- Permission justifications.
- Privacy disclosure notes.

The privacy positioning is especially important because the extension captures browsing-related data. The product should clearly communicate what is captured and why.

Captured data includes:

- URLs.
- Page titles.
- Search queries.
- Timestamps.
- Tab/session metadata.
- Navigation/referrer relationships.

## Chrome Web Store Preparation

A packaging script and submission checklist were added.

Packaging command:

```bash
./scripts/package-extension.sh
```

Generated output:

```text
dist/rabbit-holes-chrome-extension.zip
```

Documentation added:

```text
docs/chrome-web-store.md
```

The checklist includes:

- Store listing copy.
- Permission justifications.
- Privacy disclosures.
- Required assets.
- Manual submission steps.
- Pre-submit smoke test.

## Validation Completed

The following checks were run repeatedly during development:

```bash
npm run build --prefix web
python3 -m py_compile backend/app/*.py
./scripts/package-extension.sh
curl https://rabbit-holes-production.up.railway.app/health
```

Confirmed:

- Frontend production build passes.
- Backend Python files compile.
- Extension package builds.
- Production backend reports healthy database connectivity.
- Changes were committed and pushed to GitHub.

## Important Files and Areas Changed

### Web App

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
web/hooks/useSessionStats.ts
```

### Backend

```text
backend/app/main.py
backend/app/db.py
backend/app/store.py
backend/app/schemas.py
backend/app/auth.py
backend/app/rate_limit.py
```

### Browser Extension

```text
extension/manifest.json
extension/popup.html
extension/popup.js
extension/background.js
extension/config.js
extension/auth-relay.js
extension/stats-bridge.js
```

### Documentation and Scripts

```text
docs/chrome-web-store.md
docs/codex-conversation-summary.md
scripts/package-extension.sh
```

## Current Product Status

Rabbit Holes currently has:

- A polished landing page.
- A functioning authenticated web app.
- A Chrome extension popup.
- Browser-event capture.
- Production backend deployment.
- Supabase-backed database persistence.
- Google OAuth and email/password authentication.
- Rabbit-hole generation flow.
- Dashboard library management.
- Map, timeline, heatmap, settings, detail, and share pages.
- Legal pages.
- Rate limits.
- Chrome extension packaging preparation.

The product is now in a credible pre-launch state, with the main remaining work concentrated around submission, packaging, cross-device rehydration, and final QA.

## Remaining Launch Blockers

### 1. Chrome Web Store Submission

This is still manual.

Required steps:

- Create or open a Chrome Web Store Developer account.
- Pay the developer registration fee if needed.
- Upload the packaged extension zip.
- Add final screenshots.
- Fill privacy/data-use declarations.
- Explain permissions.
- Submit for review.

### 2. Store Assets

Still needed:

- Final popup screenshot.
- Dashboard screenshot.
- Map screenshot.
- Rabbit-hole detail screenshot.
- Optional promotional tile.
- Optional short demo video or GIF.

### 3. Complete Cross-Device Rehydration

The backend persists core events and rabbit-hole metadata, but the frontend still relies heavily on locally generated rich rabbit-hole objects.

Future work:

- Persist full generated rabbit-hole objects.
- Rehydrate pages, searches, graph data, summaries, timelines, and source relationships from the backend.
- Make a signed-in user’s library consistent across devices.

### 4. Browser Support Beyond Chromium

Current package path targets Chrome and Chromium-based browsers.

Currently practical:

- Chrome.
- Edge.
- Brave.
- Arc.
- Opera.

Future work:

- Firefox extension packaging.
- Safari extension packaging.
- Browser-specific permission review.

### 5. Mobile UX Pass

Mobile navigation exists, but the app still needs a dedicated mobile polish pass for:

- Dashboard density.
- Map interactions.
- Timeline readability.
- Settings layout.
- Account controls.

### 6. Custom Domain Setup

If a custom domain is purchased, the following must be updated:

- Railway web domain.
- Railway backend CORS configuration.
- Supabase Site URL.
- Supabase redirect URLs.
- Google OAuth authorized origins.
- Google OAuth redirect URLs.
- Extension manifest URLs.
- Extension content-script match patterns.
- Extension externally-connectable origins.
- Chrome Web Store listing URLs.

## Recommended Next Steps

1. Perform one full manual QA pass with the unpacked Chrome extension.
2. Capture final Chrome Web Store screenshots.
3. Submit the Chrome extension for review.
4. Add full backend rehydration for generated rabbit holes.
5. Run a dedicated mobile UI pass.
6. Prepare a short launch demo showing a search session becoming a rabbit hole.

## Final Positioning

Rabbit Holes is best described as a structured memory layer for research browsing.

It is not simply a bookmarking tool. It is not a traditional analytics dashboard. It is a way to turn curiosity into a navigable, replayable, and reusable investigation.

The simplest product pitch is:

> Rabbit Holes turns your browsing into research trails you can actually understand later.
