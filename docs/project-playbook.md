# Project Playbook

This document is for keeping the experimental architecture isolated, safe, and easy to evolve without destabilizing the stable AI Summarizer app.

## Recommended Repository Setup

- Create a separate GitHub repository for this experimental project.
- Keep the stable app in its current repository.
- Do not merge experimental Render configuration into the stable app's deploy target.

## Recommended Render Setup

- Create a separate Render web service for this experimental repo.
- Use the experimental service only for architecture exploration.
- Keep the stable service untouched so production behavior stays predictable.

## Recommended Domain Setup

- Start with Render's free `onrender.com` subdomain for the new product.
- Do not point the experimental product at the stable app's current domain.
- Keep DNS records, SSL certificates, and Render custom domains isolated per product.
- If you later decide to buy a custom domain, add it deliberately and separately.
- Treat domain separation as part of release safety, not just branding.

## Recommended Environment Strategy

Start with these variables in the experimental project:

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

Guidelines:

- Keep `OPENAI_API_KEY` in place for the validated path.
- Add `DEEPSEEK_API_KEY` only when you are ready to try DeepSeek.
- Use the same frontend contract, but keep provider selection backend-only.

## Enable DeepSeek For Summary Later

When you have a DeepSeek API key and want Summary to use DeepSeek while Chat stays on OpenAI:

- In Render `Environment`, set `DEEPSEEK_API_KEY` to your DeepSeek key.
- Set `SUMMARY_PROVIDER=deepseek`.
- Keep `CHAT_PROVIDER=openai`.
- Wait for redeploy, then confirm:
  - `GET /api/health` shows `requested.summary=deepseek`, `requested.chat=openai`.
  - `configured.deepseek=true`, `configured.openai=true`.

## Recommended Branching Workflow

- Commit the initial experimental extraction as a clean baseline.
- Make small follow-up commits for provider routing, normalization, and prompt changes.
- If you want to compare behavior, keep one branch per major experiment idea.
- Avoid mixing stable-app fixes into the experimental branch unless the change is intentional.

## Safe Experiment Rules

- Keep the frontend API paths stable: `/api/summarize` and `/api/chat`.
- Avoid changing the stable app directly while this experiment is still in motion.
- Keep provider-specific behavior inside `providers/`.
- Keep prompt text out of routes.
- Keep output cleanup in `utils/normalizeOutput.js`.
- Keep the free `onrender.com` URL active until you intentionally choose a custom domain.

## Promotion Checklist

If this experiment becomes the new direction:

- Verify summarize/chat parity again.
- Confirm the provider split is still correct.
- Decide whether to promote the experimental repo or port the changes back deliberately.
- Only then consider replacing the stable app's deploy target.
- Only then decide whether to keep using the free `onrender.com` URL or move to a custom domain.
