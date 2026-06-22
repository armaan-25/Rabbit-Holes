# Chrome Web Store launch checklist

## Package

Run from the repo root:

```bash
./scripts/package-extension.sh
```

Upload `dist/rabbit-holes-chrome-extension.zip` in the Chrome Web Store developer dashboard.

## Current production URLs

- Web app: `https://web-production-bde52.up.railway.app`
- Backend API: `https://rabbit-holes-production.up.railway.app`
- Supabase project: `xlxjzxnlcplqmdoedhqm`

## Listing copy

- Name: `Rabbit Holes`
- Short description: `Smart browser history for research sessions.`
- Description: `Rabbit Holes turns tabs, searches, and pages into structured investigations so you can retrace how an idea developed, review the map of your research, and return to the most important links.`
- Category: `Productivity`
- Language: `English`
- Support email: `aa5851@columbia.edu`

## Permission justifications

- `tabs`: reads tab titles, URLs, and active tab state so Rabbit Holes can capture the current research session.
- `history`: detects visited pages for session reconstruction and deduplication.
- `storage`: stores authentication state, capture status, session counters, and queued events locally.
- `webNavigation`: records click/navigation flow so maps can show how one page led to another.
- `alarms`: periodically flushes queued capture events to the backend.
- `idle`: pauses capture behavior when the browser is idle.
- `<all_urls>` host permission: needed to capture research flow across arbitrary sites the user visits.

## Privacy disclosures

Use the privacy policy in the app footer/legal pages. State clearly that Rabbit Holes captures browsing URLs, page titles, searches, timestamps, and tab/session metadata for the signed-in user to generate research maps and summaries.

## Store assets still needed manually

- 128x128 icon: already in `extension/assets/icon-128.png`.
- Screenshots: capture clean screenshots of the popup, dashboard, map, and generated rabbit hole.
- Promotional image: optional but useful for launch.

## Manual submission steps

1. Create or open the Chrome Web Store Developer account.
2. Create a new item and upload `dist/rabbit-holes-chrome-extension.zip`.
3. Fill listing copy and privacy disclosures.
4. Add screenshots and icon assets.
5. Confirm permissions and data-use declarations.
6. Submit for review.

## Pre-submit smoke test

1. In Chrome, open `chrome://extensions`.
2. Enable Developer Mode.
3. Load unpacked extension from `extension/`.
4. Sign in through the popup.
5. Browse a few pages and searches.
6. Confirm popup counters match the web app dashboard.
7. Click `Build rabbit holes` and confirm no `Session expired` state appears.
