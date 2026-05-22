# Repository Init Guide

Use this as the first pass for turning the experimental architecture into its own clean GitHub repository.

## Commit These Files

These are the core project files that should live in the new repo:

- `README.md`
- `.env.example`
- `.gitignore`
- `package.json`
- `package-lock.json`
- `render.yaml`
- `index.html`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.app.json`
- `server.mjs`
- `scripts/site-smoke.mjs`
- `src/`
- `config/`
- `providers/`
- `prompts/`
- `routes/`
- `services/`
- `utils/`
- `docs/`

## Ignore These Files

These should stay out of Git:

- `dist/`
- `node_modules/`
- `spend-ledger.json`
- `*.tsbuildinfo`
- `.DS_Store`

## New Repository Setup Steps

1. Create a new empty GitHub repository for the experimental project.
2. Clone or connect that repository locally.
3. Copy the contents of `experimental-provider-architecture/` into the new repo root.
4. Confirm `.gitignore` matches the ignore list above.
5. Run `npm install` in the new repo.
6. Run `npm run build`.
7. Run `npm run test:smoke`.
8. Commit the baseline only after both checks pass.

## Suggested First Commit

Keep the first commit small and clear:

- `Initialize provider architecture experiment`

## Follow-up Commit Strategy

After the baseline, make focused commits for:

- provider routing
- model switching
- prompt changes
- normalization changes
- deployment settings

## Notes

- Keep the stable app in its own repository or branch.
- Keep the experimental repo isolated from production deploys.
- Use a separate Render service and a separate public domain for the experimental product.
