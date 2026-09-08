# Deterministic demo seed

This seed produces 30 lands, 600 plots, 400 fictional customers, 450 contracts, and coherent payment activity (5,120 payments with `--as-of 2026-09-08`). By default, its reporting window starts on the first day of the month 11 months before the current month and includes payment schedules through the end of the twelfth future month. The future year ensures even yearly contracts have an upcoming dashboard and calendar event.

Preview the counts, date window, and whether the required environment variables are present. The command prints presence only and never prints credential values:

```sh
node --env-file=.env.local scripts/seed/import.mjs
```

Use a fixed date for a reproducible preview or import:

```sh
node --env-file=.env.local scripts/seed/import.mjs --as-of 2026-09-08
```

Apply the seed only when you intend to write to the configured Supabase project:

```sh
node --env-file=.env.local scripts/seed/import.mjs --apply
```

The importer upserts in foreign-key order using stable IDs. It does not truncate tables or delete existing data. Re-running it updates the same seed-owned rows. Use a service role key because normal application sessions are subject to row-level security.

Run the integrity suite with:

```sh
node --test scripts/seed/seed.test.mjs
```

The seed was applied to the configured project for 2026-09-08. The reporting year is October 2025–September 2026, with schedules through September 2027. Historical creation timestamps and paid dates are included. Existing unrelated rows remain intact.

Convenience commands: `npm run seed` previews, `npm run seed -- --apply` imports, and `npm test` runs the regression suites.
