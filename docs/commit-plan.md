# Commit Plan

Use this sequence when you turn the experimental workspace into a new GitHub repository.

## Commit 1: Baseline App Copy

Purpose:

- capture the isolated experimental app as a stable starting point

Include:

- `src/`
- `server.mjs`
- `config/`
- `providers/`
- `prompts/`
- `routes/`
- `services/`
- `utils/`
- `package.json`
- `package-lock.json`
- `index.html`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.app.json`
- `render.yaml`
- `.env.example`
- `.gitignore`

Suggested message:

- `Initialize provider architecture experiment`

## Commit 2: Docs And Operating Rules

Purpose:

- document how the experiment is meant to be used

Include:

- `README.md`
- `docs/project-playbook.md`
- `docs/release-checklist.md`
- `docs/repo-init-guide.md`
- `docs/migration-plan.md`

Suggested message:

- `Add migration and deployment guidance`

## Commit 3: Provider Routing Tuning

Purpose:

- refine provider and model routing behavior

Include:

- provider mapping changes
- model default changes
- environment variable changes

Suggested message:

- `Refine provider and model routing`

## Commit 4: Prompt And Normalization Refinement

Purpose:

- improve summary formatting stability and output consistency

Include:

- prompt changes
- normalization changes
- JSON parsing adjustments

Suggested message:

- `Improve prompt and output normalization`

## Commit 5: Deployment Settings

Purpose:

- separate the experimental deployment from the stable app

Include:

- `render.yaml`
- any deployment-only environment notes

Suggested message:

- `Add experimental deployment settings`

## Good Commit Habits

- Keep each commit focused on one idea.
- Do not mix deploy changes with prompt changes in the same commit.
- Avoid large cleanup commits unless they are fixing a real problem.
- If you are unsure whether a file belongs in a commit, leave it for the next commit.
