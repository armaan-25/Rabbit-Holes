# Rabbit Holes

Rabbit Holes is a local-first browser companion for learning on the internet.

It keeps the trail behind a research session: searches, pages, jumps, maps, timelines, and summaries. The extension is the product. The website is documentation, onboarding, and a viewer.

## Positioning

Rabbit Holes is not a hosted AI browser-history platform. It is closer to developer tooling like GitLens, Continue, Aider, Browser Use, or MCP Inspector:

- install the extension
- capture research locally
- bring your own AI provider
- keep your data portable
- self-host or hack on the stack if you want

## Bring your own AI

The AI layer is provider-agnostic. The intended configuration shape is:

```yaml
provider:
  type: openrouter
apiKey: sk-or-...
model: anthropic/claude-sonnet-4
```

Supported provider targets:

- OpenAI
- Anthropic
- OpenRouter
- Gemini
- Ollama
- LM Studio
- OpenAI-compatible endpoints

The model is an interchangeable component. Rabbit Holes owns the capture, investigation detection, replay, organization, and UX.

## Repository layout

```text
extension/   Chrome extension: capture, popup UI, local event trail.
web/         Next.js app: landing/docs, local settings, dashboard/viewer.
backend/     FastAPI prototype: hosted clustering path while local-provider core is being extracted.
```

## Current architecture direction

```text
Browser Extension
  -> Rabbit Hole Core
  -> Local Storage
  -> AI Provider Adapter
       -> Anthropic
       -> OpenAI
       -> OpenRouter
       -> Gemini
       -> Ollama
       -> LM Studio
       -> OpenAI-compatible
  -> Optional Cloud Sync later
```

## Run the web app

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`.

## Load the extension manually

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked**.
4. Select the `extension/` folder.
5. Open Rabbit Holes settings and configure your AI provider.

## Backend status

The backend still exists as a prototype service for clustering and synthesis. The staging pivot is moving the product toward local-first provider adapters so hosted inference, accounts, usage limits, and paid plans are not required for the core product.

## Security notes

Do not commit API keys. User provider keys should live in local extension/app storage or an explicit self-hosted environment.
