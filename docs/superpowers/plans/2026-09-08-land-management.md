# Land Management Implementation Plan

**Goal:** Deliver the approved Vietnamese land management changes in Astryx.
**Architecture:** Keep existing Next.js routes, Supabase schema, shared table and query hooks. Add repeatable fixtures, reuse customer flows, simplify shared controls, and introduce a shared form stepper.
**Tech Stack:** Next.js 16.3, React 19, Astryx 0.5.2, Supabase.
**Spec:** User's eight requirements and approved design in this conversation.

## Constraints
- Work in this Astryx checkout; preserve the user's deleted calendar tests.
- Preserve dashboard behavior and layout, translating its text only.
- Use Astryx components and token spacing; read installed Next.js docs before code.
- Vietnamese text, VND formatting and m² throughout.

## Tasks
- [x] Seed: create deterministic generator and importer for 30 lands, 600 plots, 400 customers, 450 contracts and one year of payments. Validate references, amounts, dates and status consistency. Do not clear existing data.
- [x] Pages/tables: reuse TableFilterClient for /customers; add /lands/[id] with plot count and paginated rows. Standardize search plus status and pagination across datasets.
- [x] Calendar: one next unpaid future/today payment for each active contract, including custom schedules. Add date boundary and paid-payment regression coverage.
- [x] Forms: shared stepper with grouped fields, per-step validation, preserved values, two desktop columns and one mobile column; update all eight entity dialogs.
- [x] Localization: translate visible strings, labels, errors and formats without changing stored enums or dashboard calculations.
- [x] Verify: focused behavior tests, TypeScript, lint, production build and browser walkthrough where available.

## Verification and decisions
- Imported and verified all stable seed IDs via the running app: 30 lands, 600 plots, 400 customers, 450 contracts, 5,120 payments. Existing one record in each entity table was retained.
- Calendar payment records are authoritative; recurrence fallback supports contracts with no saved payment schedule. Both local calendar and Google sync use the same next-date selection. Google sync itself was not executed.
- Dashboard layout and calculations are preserved; data loading fetches all API pages so seed records are counted.
- Same-origin `/api` avoids the local environment's stale hardcoded port 3000.
- Browser verified page 2, customer search, create/save/cleanup, form back/reset/validation, all eight dialogs, land detail with 20 plots and 15+5 pagination, contract edit steps, and desktop/mobile columns. Temporary test customers were deleted.
- Review fixes: contract date ordering and merged PATCH checks, custom payment dates, and separate keyed Next/Submit buttons to prevent early native form submission.
- ESLint, TypeScript, focused test suites, and production build pass. User's original deleted calendar test files remain untouched.

## Final requested table navigation adjustment

- Removed the dataset dropdown and replaced it with a fixed Vietnamese heading.
- DATASET_META supplies page labels and canonical routes, also used by navigation.
- Lands, Contracts, Customers, and the new Plots route keep their own dataset. Cross-entity links navigate to the correct route and preserve selected records.
- Shared contract date validation now honors implicit lease end dates; custom edits use actual payment presence; PATCH parsing does not inject create defaults.
- Final verification: 31 tests pass; lint, TypeScript, diff check, and production build pass. Production browser verified all four headings, absence of the dataset dropdown, and selected-record routing.
