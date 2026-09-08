import { pathToFileURL } from "node:url";

import { createClient } from "@supabase/supabase-js";

import { generateSeedData } from "./generate.mjs";

const TABLES = [
  ["lands", "lands"],
  ["plots", "plots"],
  ["customers", "customers"],
  ["contracts", "contracts"],
  ["contract_payments", "contractPayments"],
];

export function detectSupabaseEnvironment(env = process.env) {
  const url = Boolean(env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
  return { url, serviceRoleKey, ready: url && serviceRoleKey };
}

function parseArguments(args) {
  const options = { apply: false, asOf: undefined, help: false };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--apply") options.apply = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--as-of") options.asOf = args[++index];
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (args.at(-1) === "--as-of") throw new Error("--as-of requires YYYY-MM-DD");
  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/seed/import.mjs [--as-of YYYY-MM-DD] [--apply]\n\nWithout --apply, validates and summarizes the deterministic seed without writing.\nWith --apply, upserts stable IDs and preserves all unrelated database rows.`);
}

function printSummary(data, environment, mode) {
  console.log(`Seed mode: ${mode}`);
  console.log(`Window: ${data.metadata.historyStart} through ${data.metadata.scheduleEnd} (as of ${data.metadata.asOf})`);
  console.log(`Rows: ${data.lands.length} lands, ${data.plots.length} plots, ${data.customers.length} customers, ${data.contracts.length} contracts, ${data.contractPayments.length} payments`);
  console.log(`Supabase environment: URL ${environment.url ? "present" : "missing"}; service role key ${environment.serviceRoleKey ? "present" : "missing"}`);
}

async function upsertBatches(client, table, rows, batchSize = 500) {
  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    const { error } = await client.from(table).upsert(batch, { onConflict: "id" });
    if (error) throw new Error(`${table} batch ${start / batchSize + 1}: ${error.message}`);
  }
  console.log(`Upserted ${rows.length} rows into ${table}`);
}

export async function main(args = process.argv.slice(2), env = process.env) {
  const options = parseArguments(args);
  if (options.help) {
    printHelp();
    return;
  }

  const data = generateSeedData(options.asOf ? { asOf: options.asOf } : undefined);
  const environment = detectSupabaseEnvironment(env);
  printSummary(data, environment, options.apply ? "apply" : "dry run");
  if (!options.apply) return;
  if (!environment.ready) {
    throw new Error("Apply requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }

  const client = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  for (const [table, key] of TABLES) await upsertBatches(client, table, data[key]);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  });
}
