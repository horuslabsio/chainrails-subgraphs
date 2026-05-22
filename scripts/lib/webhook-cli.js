/** Parse flags shared by create-webhooks.js and create-webhooks-all.js */
function parseWebhookCliArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const envIdx = argv.indexOf("--env");
  const environment =
    (envIdx >= 0 ? argv[envIdx + 1] : undefined) || process.env.WEBHOOK_ENV;

  const entityFilterIdx = argv.indexOf("--entity");
  const entityFilter =
    entityFilterIdx >= 0 ? argv[entityFilterIdx + 1] : undefined;

  const positional = argv.filter((a, i) => {
    if (a === "--dry-run") return false;
    if (a === "--env") return false;
    if (envIdx >= 0 && i === envIdx + 1) return false;
    if (a === "--entity") return false;
    if (entityFilterIdx >= 0 && i === entityFilterIdx + 1) return false;
    return true;
  });

  return { dryRun, environment, entityFilter, positional };
}

module.exports = { parseWebhookCliArgs };
