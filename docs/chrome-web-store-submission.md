# Chrome Web Store Submission: Rabbit Holes

## Upload package

Use this zip in the Chrome Web Store Developer Dashboard:

`dist/rabbit-holes-chrome-extension.zip`

The public website also serves the same package at:

`web/public/downloads/rabbit-holes-extension.zip`

## Basic listing

### Name

Rabbit Holes

### Short description

Turn browsing sessions into structured research trails.

### Detailed description

Rabbit Holes helps you remember what you researched, how you got there, and what connects across tabs.

The extension quietly captures your browsing trail while you research, then lets you build a rabbit hole from related pages, searches, and tabs. Instead of losing context in browser history, Rabbit Holes turns a session into a map, timeline, summary, and source trail you can revisit later.

Use Rabbit Holes for:

- research projects
- job searches
- technical deep dives
- startup/customer research
- paper and GitHub exploration
- any session where tabs turn into a trail

Core features:

- capture pages, searches, tabs, and navigation paths
- build rabbit holes from recent browsing sessions
- view maps of how one source led to another
- replay the timeline of an investigation
- see summaries, key concepts, and source breakdowns
- pause, resume, or stop capture from the extension popup
- sign in to sync sessions to your account

Rabbit Holes is designed as smart browser history for research. It does not replace your browser. It makes the path you already took easier to understand later.

## Category

Productivity

## Language

English

## Website

https://userabbitholes.com

## Privacy policy

https://userabbitholes.com/privacy

## Support email

aa5851@columbia.edu

## Single purpose statement

Rabbit Holes captures browsing activity during research sessions and turns that activity into structured investigations, including maps, timelines, summaries, and source trails.

## Permission justifications

### `tabs`

Required to detect tab opens, active tab changes, and tab URLs so Rabbit Holes can count tabs and reconstruct the browsing session.

### `history`

Required to understand visited pages and search/navigation history so Rabbit Holes can build a research trail rather than only a current-tab snapshot.

### `storage`

Required to store session events, auth state, capture state, and user settings locally in Chrome before syncing to the backend.

### `webNavigation`

Required to capture navigation transitions between pages, including how one page led to another, which powers the map and discovery chain features.

### `alarms`

Required for periodic flushing of locally buffered browsing events to the backend.

### `idle`

Required to support idle-aware capture behavior and avoid recording when the user is inactive if that setting is enabled.

### `<all_urls>` host permission

Required because Rabbit Holes is a browser-history/research tool that can be used across arbitrary websites. The extension needs URL access across sites to identify pages, domains, searches, and navigation chains. It excludes known sensitive/auth domains and strips identifiers when privacy settings are enabled.

## Data usage answers

Use these if the Chrome Web Store asks what data is collected.

### Personally identifiable information

Collected: yes, only account email/user ID for sign-in and syncing.

Purpose: account management and associating captured sessions with the signed-in user.

### Web history

Collected: yes.

Purpose: core functionality. Rabbit Holes uses URLs, page titles, search queries, timestamps, tab events, and navigation chains to build rabbit holes.

### Website content

Collected: no full page bodies by default. Rabbit Holes captures metadata such as URL, title, search query, timestamp, and navigation relationships.

### Authentication information

Collected: yes, stored locally as Supabase access/refresh tokens to keep the extension signed in.

Purpose: syncing captured sessions to the user's account.

### User activity

Collected: yes.

Purpose: session capture, pause/resume/stop state, activity counts, and rabbit-hole generation.

## Data handling commitments

Use these statements in the Privacy tab where applicable.

- Data is used only for Rabbit Holes functionality.
- Data is not sold to third parties.
- Data is not used for advertising.
- Data is not used for creditworthiness or lending decisions.
- Users can pause, resume, or stop capture.
- Users can sign out from the extension popup.
- The app includes settings for capture and privacy controls.

## Store assets needed

Required:

- Extension icon: already included in `extension/assets/icon-128.png`.
- Screenshot: create at least one 1280×800 or 640×400 screenshot showing the popup/dashboard.
- Small promotional image: create one 440×280 image.

Recommended:

- 3 to 5 screenshots showing popup, dashboard, map, timeline, and generated rabbit hole.
- Optional marquee promo image: 1400×560.

## Recommended screenshots

1. Chrome popup showing pages/searches/tabs and Build rabbit holes button.
2. Dashboard with generated rabbit hole summary.
3. Map view showing search/page/repo/paper flow.
4. Timeline/replay view.
5. Settings/privacy controls.

## Pre-submit checklist

- Confirm `https://userabbitholes.com` loads the live app.
- Confirm `/privacy` and `/terms` load publicly.
- Confirm Google/Supabase sign-in works from the website.
- Reload unpacked extension and sign in.
- Browse 3 to 5 related pages/searches.
- Click Build rabbit holes from the extension.
- Confirm dashboard opens and creates a rabbit hole.
- Confirm pause/resume/stop buttons work.
- Confirm sign out works.
- Upload `dist/rabbit-holes-chrome-extension.zip`.
- Fill Store Listing, Privacy, and Distribution tabs.
- Choose Unlisted for friend/testing launch, or Public for full launch.
- Submit for review.
