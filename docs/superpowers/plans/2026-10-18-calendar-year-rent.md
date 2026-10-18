# Calendar-year rent settings

User confirmed calendar years with one independent percentage per year, based on starting rent. Missing years use 0%; no compounding or overlap. Existing recorded payments stay unchanged.

- [x] Add failing calendar-year calculation, validation and round-trip tests.
- [x] Add normalized contract_rent_years table and atomic contract/settings save RPC with server-only permissions. Keep legacy annual terms compatible until replaced.
- [x] Map yearly settings through contract APIs, form state, calendar sync and rent calculations.
- [x] Replace annual input with an editable year/percentage/rent table, including add/remove, duplicate validation, mobile rows and read-only preview/details.
- [x] Verify TypeScript, ESLint, JavaScript tests and transactional SQL tests in isolated PostgreSQL.

Verified: JavaScript recurrence, form round-trip and validation tests; TypeScript; ESLint; SQL tests for calendar-year amounts, atomic rollback, duplicates, permissions and invoice preservation. SQL executed only in the isolated /tmp PostgreSQL test database, then the server was stopped. No application database migration was applied. Browser execution tools are unavailable, so visual browser QA was not performed.
