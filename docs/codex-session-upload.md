# Coding Agent Session: Building and Launch-Hardening Rabbit Holes

## Submission Context

This is a cleaned and redacted transcript of a long-form coding-agent session used to build, refine, deploy, and launch-harden **Rabbit Holes**, a browser extension and web app for turning browsing sessions into structured research investigations.

Sensitive information has been removed or replaced with placeholders, including:

- API keys.
- Supabase keys.
- Database connection strings.
- OAuth client secrets.
- Personal email addresses.
- Local machine paths where not relevant.
- Production project identifiers where not necessary.

The transcript has also been lightly edited for clarity and professionalism. The intent is to preserve the actual engineering process, decisions, fixes, and iteration style without including raw frustration, credentials, or private setup details.

---

# 1. Initial Product Direction

## User

I want this to be a browser extension/web app called Rabbit Holes. The idea is that it watches my browsing and turns searches, tabs, and pages into structured investigations. It should feel premium, minimal, and not like a generic dashboard.

## Codex

I’ll start by treating this as both a product and engineering task: establish the UI direction, then make sure the extension, backend, and dashboard actually work together. The main constraints are:

- Browser extension captures activity.
- Web app displays investigations.
- Backend clusters browsing context.
- Accounts and persistence are required for launch.
- Visual style should be warm, editorial, and consistent.

The product framing should be:

> Smart browser history for your research.

---

# 2. Landing Page and Visual Identity

## User

Make the landing page better. It should have login, logo and name on the top left, and as you scroll text pops up about what the app does. It should be pitched as smart browser history.

## Codex

I’ll keep the existing aesthetic and improve the landing page rather than redesigning the entire product. The landing page should clearly explain:

- What Rabbit Holes does.
- Why browser history is not enough.
- How the extension captures browsing context.
- How the app turns that context into maps, timelines, and summaries.

I’ll add:

- Top-left branding.
- Authentication actions.
- Download extension CTA.
- Scroll sections explaining capture, clustering, maps, replay, and summaries.
- Dark-mode support.

## Result

The landing page was refined into a premium editorial page with:

- Serif wordmark.
- Warm paper background.
- Watercolor rabbit-hole artwork.
- Install and sign-in CTAs.
- Browser support messaging.
- Product copy centered around smart browser history.

---

# 3. Visual Asset Iteration

## User

Use the watercolor rabbit and hole image. Remove the extra rabbit stuff. Make the website look clean.

## Codex

I’ll consolidate the visuals around one main watercolor rabbit-hole asset instead of mixing sprite sheets, duplicate rabbits, and inconsistent animations.

The cleanup should:

- Keep one primary watercolor hero image.
- Remove unused generated images.
- Rename active images clearly.
- Stop putting full images inside buttons.
- Keep artwork in hero/loading areas where it belongs.

## Result

The app moved from fragmented rabbit sprites and inconsistent visual states to a single coherent watercolor direction. Buttons were later simplified to text-only for a cleaner interface.

---

# 4. Chrome Extension Popup Cleanup

## User

The Chrome popup is cluttered. It should match the app, use the same color scheme and fonts, and have play/pause/stop for recording sessions.

## Codex

I’ll align the popup with the app’s existing design system and make the controls practical. The popup needs to show current capture state without feeling like a separate product.

The popup should include:

- Rabbit Holes branding.
- Pages/searches/tabs counters.
- Capturing/paused/stopped state.
- Play/pause/stop controls.
- Build rabbit holes button.
- Account state.
- Compact dashboard open action.

## Result

The popup was rebuilt with:

- Dark warm theme.
- Matching typography.
- Live counters.
- Capture controls.
- Sign-in/sign-out state.
- Dashboard open button.
- Text-only button labels.

A broken custom wordmark was replaced with plain `Rabbit Holes` in the popup for readability.

---

# 5. Account System and Authentication

## User

I want to start implementing account stuff. I made a Supabase org. Give me the flow for Supabase and Google OAuth, plus letting people make accounts.

## Codex

I’ll implement the account flow in stages:

1. Supabase client setup.
2. Login and signup pages.
3. Google OAuth.
4. Auth callback handling.
5. Sidebar/profile state.
6. Extension auth relay.
7. Backend verification of Supabase tokens.

You’ll need to configure:

- Supabase Site URL.
- Supabase Redirect URLs.
- Google OAuth authorized origins.
- Google OAuth redirect URLs.
- Railway environment variables.

Sensitive values should go in environment variables, not committed files.

## Result

Implemented:

- Supabase auth integration.
- Login page.
- Signup page.
- Google OAuth.
- Auth callback route.
- Extension auth flow.
- Sidebar account card.
- Sign-in/sign-out handling.

Later, auth was hardened so production fails closed if Supabase auth is not configured.

---

# 6. Backend Persistence

## User

Start building it and tell me what I need to do to make a persistent database of users.

## Codex

I’ll add database-backed persistence using Supabase Postgres. The first version needs durable users, sessions, events, and generated rabbit holes.

The schema should include:

- `app_users`
- `sessions`
- `events`
- `rabbit_holes`

The backend should self-initialize the schema so Railway can deploy without a manual migration step for the initial version.

## Result

Implemented database-backed storage for:

- Users.
- Sessions.
- Raw browser events.
- Generated rabbit holes.
- Favorite/archive/delete metadata.
- Source signatures for duplicate detection.

Backend health endpoint confirmed DB availability:

```json
{"ok":true,"db":{"configured":true,"available":true,"disabled_reason":null}}
```

---

# 7. Browser Capture and Rabbit Hole Generation

## User

It doesn’t really do anything when I click Build rabbit holes. The actual functionality doesn’t seem to be functioning.

## Codex

I’ll trace the full path:

1. Extension captures events.
2. Popup flushes events.
3. Backend receives events.
4. Backend clusters pages/searches.
5. Web app reads the generated result.
6. Dashboard updates without a broken redirect.

The key failure modes are usually:

- Extension not signed in.
- Token expired.
- Events not flushed.
- Backend URL missing.
- Supabase redirect mismatch.
- Frontend built with localhost API URL.

I’ll make the extension handle expired sessions more gracefully and make the dashboard receive generated holes reliably.

## Result

Fixed and improved:

- Extension auth state checks.
- Session-expired handling.
- Event flushing before clustering.
- Popup-to-dashboard clustering flow.
- Dashboard handling of `?cluster=1`.
- Backend duplicate detection.

---

# 8. Duplicate Detection

## User

Duplicate detection is currently frontend/localStorage-based. Stronger version should be backend-side using stored source signatures.

## Codex

I’ll move duplicate detection to the backend. The backend can compute a deterministic signature from captured pages and searches. If the signature matches the last clustered session, the backend can return `no_change` instead of generating duplicate rabbit holes.

Implementation plan:

- Add `source_signature` to sessions.
- Compute signature from sorted pages/searches.
- Store signature when clustering succeeds.
- Return `no_change: true` for repeated context.
- Keep localStorage as a UX optimization, not the source of truth.

## Result

Implemented backend-side source signatures. This made duplicate detection durable across browser refreshes and less dependent on local app state.

---

# 9. Rabbit Hole Library Management

## User

Archive/favorite/delete are local app-state actions for now. They should eventually persist to Supabase. No bulk actions yet for large libraries.

## Codex

I’ll add backend persistence for rabbit-hole metadata and bulk actions while keeping the UI responsive.

The frontend should update immediately, then persist in the background.

Backend endpoints:

```text
GET    /holes
PATCH  /holes/{client_id}
POST   /holes/bulk
```

Metadata fields:

- `client_id`
- `favorite`
- `archived`
- `deleted_at`

## Result

Implemented:

- Favorite persistence.
- Archive persistence.
- Delete persistence.
- Bulk favorite/archive/delete.
- Stable backend `client_id`s.
- Dashboard search/filter/sort controls.

---

# 10. Dashboard and Sidebar Polish

## User

There’s too much dead space. Make the left tab bigger, decrease dead space, and make the elements consistent.

## Codex

I’ll keep the existing aesthetic but tighten the layout. The goal is not a redesign; it’s visual consistency and density.

Changes:

- Larger, more useful sidebar.
- Cleaner dashboard header.
- Better cards.
- Less empty space.
- Sidebar profile card at the bottom.
- Live stats in the sidebar.
- Capture controls in the app, matching the extension.

## Result

The sidebar now includes:

- Navigation.
- Rabbit hole list.
- Live capture status.
- Pages/searches/tabs counters.
- Pause/resume/stop controls.
- Theme toggle.
- Account card.

Mobile navigation was also added and later fixed to include Settings.

---

# 11. Map, Timeline, Replay, and Summary Views

## User

The map should show the flow from one website to another and let me click a node to see how the user flowed. It should look like the real thing.

## Codex

The map should not feel like generic analytics. It should visualize the browsing journey:

- Search nodes.
- Page nodes.
- Website/repo/paper/document types.
- Edges for discovered-from, clicked-from, and related-to relationships.
- Node inspection.
- Flow explanation.

I’ll preserve the product style and make the map feel like a native part of Rabbit Holes.

## Result

Added and refined:

- Map view.
- Timeline view.
- Heatmap view.
- Rabbit hole detail pages.
- Shareable pages.
- Discovery path panels.
- Investigation replay components.
- Summary and Session DNA cards.
- Floating “You Are Here” context.

---

# 12. Loading State Polish

## User

The loading screen looks bad. Make it cleaner.

## Codex

I’ll replace the washed-out full-screen haze with a defined loading card.

The loading state should feel premium and focused:

- Dark backdrop.
- Centered card.
- Watercolor rabbit-hole artwork.
- Subtle words flowing into the hole.
- Strong title panel.
- Progress accent.

## Result

The rabbit-hole generation overlay was redesigned into a more polished card-based loading state. Later refinements improved sizing and removed images from buttons.

---

# 13. Rate Limiting and Launch Hardening

## User

Add rate limits using Railway CLI and add rate limits.

## Codex

For launch, rate limits need to protect:

- Event ingestion.
- Clustering.
- AI calls.
- Read endpoints.

The initial limiter is environment-configurable. Later I’ll strengthen it so it is durable across restarts and shared across instances.

## Later User Follow-Up

Duplicate detection is frontend/localStorage-based. Archive/favorite/delete should persist. No backend pagination. Mobile nav needs work. Chrome Web Store packaging is manual. Help me do this.

## Codex

I’ll implement what can be handled in code before launch:

- Backend duplicate signatures.
- Persistent hole metadata.
- Bulk actions.
- Paginated backend reads.
- Mobile navigation.
- Chrome Web Store packaging docs.

## Result

Implemented:

- Durable Postgres-backed rate limiting.
- In-memory fallback for local dev.
- Fail-closed backend auth when Supabase is missing.
- Extension-to-web capture controls.
- Mobile Settings access.
- Cleaner launch env examples.

Rate limit variables:

```text
RATE_LIMIT_EVENTS_PER_MIN=240
RATE_LIMIT_CLUSTER_PER_HOUR=20
RATE_LIMIT_AI_PER_HOUR=60
RATE_LIMIT_READS_PER_MIN=120
```

---

# 14. Deployment

## User

Launch the app. Update the OAuth for the Railway production URL.

## Codex

I’ll align the deployed URLs across:

- Railway web app.
- Railway backend API.
- Supabase redirect URLs.
- Google OAuth authorized origins.
- Extension manifest matches.
- Backend CORS.

For production, the frontend must be built with the deployed backend URL. If `NEXT_PUBLIC_BACKEND_URL` is missing, the app will call localhost after deployment.

## Result

Deployment work included:

- Railway web service.
- Railway backend service.
- Supabase auth redirect configuration.
- Google OAuth setup.
- Backend health verification.
- Next.js security upgrade.

Next.js was upgraded from an outdated vulnerable version to a patched version so Railway’s security scanner would allow the build.

---

# 15. Chrome Web Store Preparation

## User

Chrome Web Store packaging/submission is still manual. Help me do this.

## Codex

I can prepare the extension package and submission checklist. The actual upload and review submission still must be done manually in the Chrome Web Store dashboard.

I’ll add:

- Packaging script.
- Store listing copy.
- Permission justifications.
- Privacy disclosure guidance.
- Manual submission checklist.
- Smoke-test checklist.

## Result

Added:

```text
scripts/package-extension.sh
docs/chrome-web-store.md
```

Packaging command:

```bash
./scripts/package-extension.sh
```

Generated extension package:

```text
dist/rabbit-holes-chrome-extension.zip
```

---

# 16. Legal and Privacy

## User

Add legal stuff. Support email is [redacted].

## Codex

I’ll add basic Terms and Privacy pages and include a support contact. The privacy language needs to be clear because the extension captures browsing-related metadata.

Captured data should be disclosed as:

- URLs.
- Page titles.
- Search queries.
- Timestamps.
- Tab/session metadata.
- Navigation/referrer relationships.

## Result

Added:

- Terms page.
- Privacy page.
- Support contact.
- Chrome permission justifications.
- Privacy disclosure checklist.

The support email is redacted in this submission copy.

---

# 17. Visual Consistency Scan

## User

Do a scan and make sure elements are consistent. There’s not much visual clutter.

## Codex

I’ll scan for old palette usage, dead components, mismatched visual primitives, and surfaces that don’t follow the current warm paper/dark editorial system.

Findings:

- Most active app pages use the current warm theme.
- Some older command palette styles still used cool-gray tokens.
- Some dead or plugin-mounted components still carried old styling.
- Buttons with images created visual clutter.

Fixes:

- Rethemed the command palette.
- Removed image marks from buttons.
- Simplified popup branding.
- Cleaned theme toggle sizing.
- Reduced visual noise in loading states.

## Result

The UI is now more consistent across:

- Landing page.
- Dashboard.
- Sidebar.
- Extension popup.
- Loading overlay.
- Settings.
- Mobile nav.

---

# 18. Final Wednesday Launch Blockers

## User

Tell me what to do if I’m targeting a Wednesday launch.

## Codex

The remaining blockers are mostly operational, not core product-code blockers.

## Current Launch Blockers

### 1. Chrome Web Store Submission

Manual steps still required:

- Open the Chrome Web Store Developer dashboard.
- Upload the packaged extension zip.
- Add final screenshots.
- Fill privacy/data-use declarations.
- Explain permissions.
- Submit for review.

### 2. Final Extension Smoke Test

Before submitting:

- Load unpacked extension from the `extension/` folder.
- Sign in through the extension flow.
- Browse/search for 5-10 minutes.
- Confirm popup counters update.
- Confirm web sidebar counters match.
- Click `Build rabbit holes`.
- Confirm the dashboard generates investigations.
- Confirm no `session expired` loop occurs.

### 3. Railway Environment Sanity

Production backend should have:

```text
DATABASE_URL
ANTHROPIC_API_KEY
WEB_ORIGIN=https://<production-web-origin>
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

Use either:

```text
SUPABASE_JWT_SECRET
```

or:

```text
SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY
```

Do not set this in production:

```text
RABBIT_HOLE_DEV_USER=1
```

### 4. OAuth Final Check

Verify:

- Login from production web URL.
- Login from extension auth flow.
- Sign out and sign back in.
- Popup does not get stuck on expired session.

### 5. Store Assets

Still needed:

- Popup screenshot.
- Dashboard screenshot.
- Map screenshot.
- Rabbit-hole detail screenshot.
- Settings screenshot.
- Optional promo tile.
- Optional short demo video.

### 6. Domain Decision

If launching Wednesday, avoid adding a custom domain unless it is already configured early enough to test.

Adding a domain requires updating:

- Railway web domain.
- Backend CORS / `WEB_ORIGIN`.
- Supabase Site URL.
- Supabase redirect URLs.
- Google OAuth origins and redirects.
- Extension manifest matches.
- Chrome Web Store listing URL.

The lower-risk launch path is to ship with the working production Railway URL first, then add a custom domain after review.

---

# 19. Skills Demonstrated in This Session

This session demonstrates the coding agent’s ability to work across the full product stack:

## Product and Design Judgment

- Refined positioning from a vague browser tool to a clear product promise.
- Reduced visual clutter without losing brand personality.
- Preserved an existing aesthetic while improving consistency.
- Converted frustrated design feedback into concrete UI changes.

## Frontend Engineering

- Built and refined Next.js pages.
- Implemented responsive navigation.
- Integrated dark mode.
- Improved dashboard state and library controls.
- Added loading states and polished motion.
- Cleaned button and popup UI systems.

## Extension Engineering

- Updated Manifest V3 Chrome extension behavior.
- Implemented popup state handling.
- Added extension-to-web messaging.
- Added capture controls.
- Improved auth/session handling.
- Packaged extension for Chrome Web Store submission.

## Backend Engineering

- Added FastAPI endpoints.
- Added Supabase/Postgres persistence.
- Added database schema initialization.
- Added durable rate limiting.
- Added auth verification.
- Added duplicate detection through source signatures.

## Launch Engineering

- Configured Railway deployment assumptions.
- Updated Next.js for security scanner compliance.
- Added environment examples.
- Added legal/support pages.
- Added Chrome Web Store packaging docs.
- Produced a clear launch blocker list.

---

# 20. Final Product Summary

Rabbit Holes is now a functioning pre-launch product with:

- A polished web app.
- A Chrome extension.
- Authentication.
- Production backend.
- Supabase-backed persistence.
- Rabbit-hole generation.
- Dashboard library management.
- Maps, timelines, summaries, and share views.
- Rate limits.
- Legal pages.
- Extension packaging.

The remaining work is primarily launch execution: final QA, screenshots, Chrome Web Store submission, and optional domain setup.

The cleanest final pitch remains:

> Rabbit Holes turns your browsing into research trails you can actually understand later.
