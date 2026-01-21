import { neon } from "@neondatabase/serverless";

function parseArg(name: string): string | undefined {
  const idx = process.argv.findIndex((a) => a === name || a.startsWith(name + "="));
  if (idx === -1) return undefined;
  const arg = process.argv[idx];
  if (arg.includes("=")) return arg.slice(arg.indexOf("=") + 1);
  return process.argv[idx + 1];
}

function csv(arg: string | undefined): string[] {
  if (!arg) return [];
  return arg
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(2);
  }

  const defaultTables = [
    "users",
    "user_profiles",
    "wallets",
    "accounts",
    "wallet_snapshots",
    "wallet_transactions",
    "models",
    "calls",
    "messages",
    "audit_events",
    "kyc_applications",
    "dmca_notices",
    "sessions",
    "transactions",
    "cards",
    "model_ratings",
  ];

  const tables = csv(parseArg("--tables"));
  const required = csv(parseArg("--required"));

  const list = (tables.length ? tables : defaultTables).map((t) =>
    t.includes(".") ? t : `public.${t}`,
  );

  const sql = neon(url);

  const results: Array<{ name: string; exists: boolean }> = [];
  for (const name of list) {
    const rows = await sql`select to_regclass(${name}) as regclass`;
    const regclass = (rows as any)?.[0]?.regclass as string | null | undefined;
    results.push({ name, exists: !!regclass });
  }

  const missing = results.filter((r) => !r.exists).map((r) => r.name);
  const requiredMissing = required.length
    ? required
        .map((t) => (t.includes(".") ? t : `public.${t}`))
        .filter((t) => missing.includes(t))
    : missing;

  for (const r of results) {
    console.log(`${r.exists ? "OK" : "MISSING"} ${r.name}`);
  }

  if (requiredMissing.length) {
    console.error("\nMissing tables:");
    for (const t of requiredMissing) console.error(`- ${t}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
