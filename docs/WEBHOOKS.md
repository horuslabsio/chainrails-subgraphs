# Goldsky subgraph webhooks

## Prerequisites

- Subgraph deployed for the chain (`yarn deploy:<chain>`)
- Goldsky CLI authenticated (same as deploy)
- Public HTTPS URL for the backend: `POST /api/v1/goldsky/webhooks`

## Multiple environments on the same subgraph

Local, dev, and prod can all subscribe to the **same mainnet subgraph** (e.g. `chainrails/base-v1.3.1`) using **different webhook names** and URLs.

| Environment | Webhook name example | Config file |
| ----------- | -------------------- | ----------- |
| local | `cr-local-ft-base` | `config/webhooks.local.json` |
| dev | `cr-dev-ft-base` | `config/webhooks.dev.json` |
| prod | `cr-prod-ft-base` | `config/webhooks.prod.json` |

Goldsky limits webhook names to **42 characters**. The script uses short entity slugs (`ft`, `dft`, …) and validates length.

Each backend must use the **same** `GOLDSKY_WEBHOOK_SECRET` as the secret passed when creating that environment’s webhooks.

## Configure per environment

1. Copy the examples (do not commit secrets):

   ```bash
   cp config/webhooks.local.example.json config/webhooks.local.json
   cp config/webhooks.dev.example.json config/webhooks.dev.json
   cp config/webhooks.prod.example.json config/webhooks.prod.json
   ```

2. Set `webhookUrl` and `webhookSecret` in each file. For **local**, use your ngrok (or similar) URL pointing at `localhost`.

Optional per-env overrides in `config/webhooks.overrides.json` (gitignored):

```json
{
  "environments": {
    "local": {
      "webhookUrl": "https://new-subdomain.ngrok-free.app/api/v1/goldsky/webhooks"
    }
  }
}
```

Env vars still override file config: `WEBHOOK_URL`, `WEBHOOK_SECRET` / `GOLDSKY_WEBHOOK_SECRET`.

## Create webhooks (one chain)

```bash
yarn create-webhooks:base --env local
yarn create-webhooks:base --env dev
yarn create-webhooks:base --env prod
```

Or:

```bash
export WEBHOOK_ENV=local
yarn create-webhooks:base
```

Creates five webhooks per chain per environment. Re-run skips names that already exist.

## Create webhooks (all mainnet chains)

```bash
yarn create-webhooks:all:mainnet:local
yarn create-webhooks:all:mainnet:dev
yarn create-webhooks:all:mainnet:prod
```

## Migrate from non-environment names (`cr-ft-base`)

Old webhooks without an environment suffix still point at whatever URL they were created with. Delete them before relying on env-scoped names:

```bash
goldsky subgraph webhook list
goldsky subgraph webhook delete cr-ft-base
# repeat for cr-dft-base, cr-bc-base, ...
```

Then create local/dev/prod webhooks as above.

## List entity names for a subgraph

```bash
yarn list-webhook-entities:base
```

## Delete a webhook

```bash
goldsky subgraph webhook delete <webhook-name>
```
