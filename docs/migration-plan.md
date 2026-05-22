# Migration Plan

This is the practical sequence for moving the experimental architecture into its own repo, its own Render service, and its own domain.

## Phase 1: Prepare The New Repo

1. Create a new GitHub repository for `ai-summarizer-provider-architecture`.
2. Clone that repository locally or connect the current workspace to it.
3. Copy the contents of `experimental-provider-architecture/` into the new repo root.
4. Confirm the root contains:
   - `package.json`
   - `server.mjs`
   - `src/`
   - `config/`
   - `providers/`
   - `prompts/`
   - `routes/`
   - `services/`
   - `utils/`
   - `docs/`
5. Confirm `.gitignore` excludes build output, node modules, local ledger files, and OS metadata.

## Phase 2: Install And Verify

1. Install dependencies with `npm install`.
2. Run `npm run build`.
3. Run `npm run test:smoke`.
4. Only after both checks pass, create the first commit.

Suggested first commit message:

- `Initialize provider architecture experiment`

## Phase 3: Configure Environment Variables

Use the experimental project's own environment settings:

```env
LLM_PROVIDER=openai
SUMMARY_PROVIDER=openai
CHAT_PROVIDER=openai
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
OPENAI_BASE_URL=
DEEPSEEK_BASE_URL=
SUMMARY_MODEL=
CHAT_MODEL=
OPENAI_MOCK_RESPONSES=false
```

Guidance:

- Keep the OpenAI key for the validated chat path.
- Add the DeepSeek key only in the experimental environment.
- Keep provider selection backend-only.
- Keep the frontend calling `/api/summarize` and `/api/chat`.

## Phase 4: Create A Separate Render Service

1. Create a new Render web service for the experimental repo.
2. Do not reuse the stable app's service.
3. Set the build command and start command from the experimental repo's `render.yaml`.
4. Add the experimental environment variables in Render.
5. Verify the service uses the experimental repo and not the stable repo.

## Phase 5: Use A Separate Domain

1. Use the service's free `onrender.com` URL first.
2. Do not point it at the stable app's existing domain.
3. Skip custom domains until you actually need a branded domain.
4. If you later buy a domain, attach that new domain only to this new service.
5. Keep SSL/certificate setup isolated to the new product.

## Phase 6: Promote Deliberately

1. Verify build and smoke tests again after deployment.
2. Verify summary uses DeepSeek and chat uses OpenAI if that is still the desired split.
3. Verify the stable app remains available separately.
4. Only after confidence is high, decide whether the old domain should redirect.

## Safety Rules

- Do not batch-delete files during migration.
- Do not spend money on new services or upgrades without explicit manual approval.
- Keep the stable app isolated until the experiment is proven.
