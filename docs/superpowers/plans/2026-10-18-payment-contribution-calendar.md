# Payment contribution calendar

Show a selectable calendar year as a GitHub-style grid: weekday rows, weekly columns and month labels. Green means paid; yellow scheduled today/future; red means unpaid past due (including partial payments); gray past days without a payment. Future non-payment days and padding remain visually quiet. Color is supplemented by labels, tooltips and the payment sheet.

- [x] Test a pure year-grid builder: leap years, Monday alignment, status priority, partial overdue payments, historical records and year boundaries.
- [x] Replace the payment table/list with a year selector, accessible contribution grid, status legend and yearly totals. Retain indefinite-lease extension and existing payment success feedback.
- [x] Open the existing BottomSheet for every scheduled payment, including unpaid/future dates. Show amount, status, remaining balance, invoice history and an invoice detail view. Preserve the existing payment-recording dialog and refresh flow.
- [x] Run tests, TypeScript, ESLint and diff checks. Browser execution tools are unavailable in this session; report visual verification limitations.

Use Astryx layout, StatusDot, IconButton, Tooltip, Selector and BottomSheet components. Use token-backed utilities; horizontal scrolling stays inside the calendar on narrow screens. No database or payment calculation changes.

Verification: 8 tests passed, including real invoice-derived partial/full payment states. TypeScript, ESLint and diff checks passed. The production build stalled at optimization without reporting an error and was stopped. Browser execution tools are unavailable, so no visual browser QA was performed.
