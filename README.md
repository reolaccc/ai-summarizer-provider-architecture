# AI Summarizer Provider Architecture

Experimental, fully isolated workspace for exploring provider abstraction in the existing AI Summarizer app without modifying the original project.

## What This Project Is

- A separate copy of the current app behavior
- A backend architecture experiment focused on provider and model flexibility
- A place to refactor safely while keeping the frontend contract stable

The frontend still calls:

- `/api/summarize`
- `/api/chat`

The response schema is intentionally kept compatible with the existing app.

## Current Scope

- OpenAI is the primary validated provider
- DeepSeek is included as a placeholder skeleton provider entry point
- Provider selection is backend-only
- UI behavior is intentionally left almost unchanged

## Environment Variables

```env
LLM_PROVIDER=openai

# Recommended experiment defaults:
SUMMARY_PROVIDER=deepseek
CHAT_PROVIDER=openai

OPENAI_API_KEY=
DEEPSEEK_API_KEY=

OPENAI_BASE_URL=
# Optional. DeepSeek defaults to https://api.deepseek.com in code.
DEEPSEEK_BASE_URL=

SUMMARY_MODEL=
CHAT_MODEL=

OPENAI_MOCK_RESPONSES=false
```

Selection rules:

- `SUMMARY_PROVIDER` overrides `LLM_PROVIDER` for `/api/summarize`
- `CHAT_PROVIDER` overrides `LLM_PROVIDER` for `/api/chat`
- `SUMMARY_MODEL` and `CHAT_MODEL` override provider defaults

Recommended split for this project:

- Summary uses `deepseek` because it can tolerate slight formatting drift and usually handles long inputs cost-effectively
- Chat uses `openai` because follow-up answers benefit more from stronger instruction following and consistency
- You can still switch either one later without touching frontend code
- DeepSeek usage and billing are managed in the DeepSeek Platform dashboard: https://platform.deepseek.com/sign_in

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`

3. Start the experimental app:

```bash
npm run dev
```

4. Optional smoke test:

```bash
npm run test:smoke
```

## Project Structure

```text
experimental-provider-architecture
├── config
│   ├── models.js
│   └── providers.js
├── prompts
│   ├── chatPrompt.js
│   └── summarizePrompt.js
├── providers
│   ├── createOpenAICompatibleProvider.js
│   ├── deepseek.js
│   ├── index.js
│   └── openai.js
├── routes
│   ├── chat.js
│   └── summarize.js
├── services
│   ├── chatService.js
│   ├── sourceService.js
│   ├── spendLedger.js
│   └── summarizeService.js
├── utils
│   ├── mockResponses.js
│   ├── normalizeOutput.js
│   └── text.js
├── scripts
│   └── site-smoke.mjs
├── src
├── .env.example
├── package.json
├── render.yaml
└── server.mjs
```

## What Was Copied

Copied from the original project:

- frontend app files in `src/`
- Vite and TypeScript config
- `index.html`
- `render.yaml`
- smoke test script as a starting point
- dependency manifest files

Copied behavior, but refactored backend:

- `/api/summarize`
- `/api/chat`
- spend guard
- URL summarization support
- PDF/text frontend flow
- standard summary mixed-format behavior

## What Was Added

New backend architecture layers:

- `config/` for provider and model resolution
- `providers/` for provider-specific SDK handling
- `prompts/` for route-independent prompt construction
- `services/` for summarize/chat/source/spend workflows
- `utils/` for normalization, parsing, and mock behavior

## Extension Points

To add a future provider:

1. Add a new file in `providers/`
2. Register it in `providers/index.js`
3. Add env metadata in `config/providers.js`
4. Optionally define provider-specific default models in `config/models.js`

To change prompting:

- edit `prompts/summarizePrompt.js`
- edit `prompts/chatPrompt.js`

To make output normalization stricter:

- edit `utils/normalizeOutput.js`

## Notes

- The original project remains untouched
- The OpenAI API key stays server-side
- DeepSeek support is intentionally scaffolded, not treated as fully validated in this iteration
- Mock responses are preserved for testing and smoke validation
- The new product should use a different public domain from the original app.
- See [docs/project-playbook.md](./docs/project-playbook.md) for GitHub, Render, environment, and branching guidance.
- See [docs/release-checklist.md](./docs/release-checklist.md) when you are ready to promote the experiment.
- See [docs/repo-init-guide.md](./docs/repo-init-guide.md) for the initial GitHub repo setup and commit/ignore checklist.
- See [docs/migration-plan.md](./docs/migration-plan.md) for the concrete step-by-step migration path.
- See [docs/commit-plan.md](./docs/commit-plan.md) for the recommended Git commit sequence.

## GitHub And Render Guidance

- Recommended for long-running experimentation: create a separate GitHub repo for `experimental-provider-architecture` instead of mixing it into the stable app's repo history.
- Recommended for deployment isolation: create a separate Render service for the experimental project, so the stable app and the experiment can fail or iterate independently.
- If you want to stay inside one GitHub repo temporarily, use a dedicated branch plus a dedicated subdirectory, but treat that as short-lived and avoid merging experimental Render changes into production by accident.
- Keep environment variables separate between stable and experimental deployments.
- Do not reuse the production Render service for this experiment unless you are intentionally replacing the stable app.

## Environment Migration Strategy

- Start with a copy of the current `.env.example` for the experimental project.
- Add `LLM_PROVIDER`, `SUMMARY_PROVIDER`, `CHAT_PROVIDER`, `SUMMARY_MODEL`, and `CHAT_MODEL` without removing the existing OpenAI key yet.
- Keep `OPENAI_API_KEY` required for the initial validated path.
- Add `DEEPSEEK_API_KEY` and `DEEPSEEK_BASE_URL` only for the experimental project until DeepSeek is fully validated.
- Use the experimental project's Render environment variables separately from the stable app.

## Version Control Strategy

- Commit the experimental project as a clean, isolated set of changes.
- Use small commits if you continue iterating on provider abstraction, route extraction, or model routing.
- Keep the stable project on a separate branch or separate deploy target so you can compare behavior safely.
- If the experiment becomes the new production direction, promote it deliberately instead of editing the stable project in place.
