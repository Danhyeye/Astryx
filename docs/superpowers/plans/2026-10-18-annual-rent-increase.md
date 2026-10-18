# Annual rent increase implementation plan

Goal: An optional annual percentage in create/edit contracts, applied to the starting rent after each completed rental year. A 10% increase yields 10, 11, 12 million in years 1–3.

- [x] Add tests for anniversaries, leap dates, zero/default increases, payment schedules and recorded amounts.
- [x] Add one shared rent calculation, with anniversary dates clamped like contract dates and amounts rounded to two decimal places; reuse it in calendar, schedules, dashboard and preview.
- [x] Persist annual_rent_increase_percent (default 0) through validation, API, database types, contract mapping and form state.
- [x] Add an Astryx percentage input for terms exceeding 12 months (including indefinite terms), plus year 2/year 3 previews and contract detail metadata.
- [x] Add a migration updating newly generated invoice schedule amounts; preserve persisted payment amounts and permissions. Add transactional SQL fixtures.
- [x] Run tests, TypeScript, ESLint and diff checks; report database verification limitations.

Payment amounts remain per payment period. Increases apply at the contract anniversary, not January 1; no proration or change to payment dates. Shorter contracts retain the saved percentage, which has no effect before the first anniversary.

Verification: 25 JavaScript tests passed; TypeScript and ESLint passed. Annual increase, all 12 payment intervals, and invoice protection SQL fixtures passed in a temporary PostgreSQL database seeded with the required app tables, functions, and service-role permissions. Browser execution tools were unavailable, so no visual browser check was performed. Application database migrations have not been applied.
