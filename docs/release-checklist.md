# Release Checklist

Use this checklist when the experimental architecture is ready to become a product.

## Before Release

- Confirm the experiment still passes build and smoke tests.
- Confirm `SUMMARY_PROVIDER=deepseek` and `CHAT_PROVIDER=openai` are still the intended defaults.
- Confirm the frontend still only uses `/api/summarize` and `/api/chat`.
- Confirm the stable app is still running separately.

## GitHub

- Create or keep a separate repository for this product.
- Make sure the stable app repository is not being deployed from the same branch by accident.
- Tag the first release only after the provider split is stable.

## Render

- Create a separate Render web service for this product.
- Use separate environment variables from the stable app.
- Keep the stable service untouched until the new service is verified.

## Domain

- Use a different public domain for the new product.
- Do not reuse the stable app's primary domain.
- Set DNS and SSL intentionally for the new product only.

## Promotion

- Move traffic deliberately.
- If you want the old domain to redirect, do that as a separate change.
- If the experiment is not ready, keep it isolated and keep iterating.
