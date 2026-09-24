# Contract form feedback — 24 September 2026

## Feedback checklist

- [x] **End date:** make it read-only in create/edit; calculate it from the start date and duration in months, including before submission.
- [x] **Plot availability:** release contract-backed occupancy after the inclusive end date; completed/cancelled contracts do not reserve plots. Keep overlapping active/pending rentals and sold plots blocked.
- [x] **Custom payment cycle:** hide it from new choices; preserve existing custom contracts without silently converting them.
- [x] **Next payment:** replace manual input with **Kỳ đến hạn chưa thanh toán gần nhất** (earliest unpaid due date), derived from the payment schedule and recorded payments.
- [x] **Layout:** group the contract stepper into clear sections: customer/status, adjacent land/plot selectors, and rental dates; stack fields on small screens. Keep payment and review steps single-column and remove duplicate payment-day and unnecessary editable date fields.
- [x] Apply and verify the plot-release migration in Supabase (`20260924100000`).
- [ ] Build a complete custom payment schedule editor before enabling Custom again.

## Business rules

**Rental term:** end date = start date + duration in calendar months − one day. Month overflow is clamped to the last day of the destination month. For example, 15 September 2026 + 12 months ends 14 September 2027. Blank duration retains the existing open-ended rental feature. End dates on an existing contract are recalculated when its edit form is opened and persisted only on save; no bulk rewrite of old contracts is performed.

**Availability:** the end date is inclusive; a plot can be rented again the following day. The app derives occupancy from contract dates in Vietnam time, without waiting for cron or rewriting plot status. A future reservation is shown as reserved and only blocks overlapping dates. A sold plot remains sold. A manually marked rented plot with no associated contract remains unavailable because its release date is unknown. Rental history (including completed/cancelled contracts) means a stale stored RENTED flag no longer permanently blocks the plot. The same rule is enforced by `20260924100000_release_finished_plot_rentals.sql` at save time. Refreshing the page/refetching the availability snapshot updates the displayed state.

**Next unpaid due:** monthly, quarterly and yearly schedules advance by 1, 3 and 12 months from the start month, using the contract's due day and clamping shorter months. Dates before the start or after the end are excluded. Paid dates are skipped; unpaid past dates remain visible until recorded as paid. The amount is the contract's configured amount per scheduled due date (no automatic multiplication). Existing custom schedules retain their recorded dates. Completed/cancelled contracts have no next due. The date is calculated for display rather than stored as a manually maintained recurring-payment override.

**Existing custom contracts:** the edit form shows their current cycle as a disabled legacy option. Users can deliberately switch to monthly/quarterly/yearly; otherwise the custom value and history are preserved. Backend support remains for existing records; hiding the option is not removal of their data.

## Verification

`npm test` checks date derivation, leap-year/month-end handling, paid-date skipping, expiry, completed/cancelled rentals, sold plots, and unknown manual rentals. `npx tsc --noEmit` and targeted ESLint check the changed UI. Database checks verify completed-history release, inclusive overlap rejection, next-day rentals and sold-plot protection. Browser visual review is still recommended.

## Invoice payments

- [x] Store every installment in `invoices`, linked through `payment_schedule_id` to `contract_payments` (one scheduled due, many invoices).
- [x] Replace the paid toggle with **Thanh toán hóa đơn**. Default the payment date to today in Vietnam; allow backdating; reject future dates.
- [x] Show total due, paid so far and remaining. Reject zero, negative and over-balance amounts in both the form and database.
- [x] Derive **Thanh toán một phần** / **Đã thanh toán** from invoice totals. Partial dues remain payable and remain the earliest unpaid due until completed.
- [x] Show **Xem hóa đơn** only when invoices exist. Open a right-side drawer showing payment dates and amounts.
- [x] Lock schedules during payments to prevent concurrent overpayments; use a stable request UUID so retries do not duplicate invoices.
- [x] Apply and verify the invoice migration in linked Supabase (`20260924110000`); all 1,906 legacy paid records were preserved.

Apply `20260924110000_payment_invoices.sql` before using the updated application. It converts existing paid records into one invoice each and retires the old paid-toggle RPC. Original payment timestamps determine the migrated payment date in Vietnam; records without a timestamp use their due date, capped at the migration date. Legacy status columns remain only for compatibility and are no longer authoritative. Do not create payments by writing a paid flag; use `pay_contract_invoice`.

Invoice history is append-only from the app. Each scheduled amount is the contract's configured amount for that cycle; an installment does not change it. A partial payment can also be overdue, so its remaining balance shows an overdue note. Existing recorded schedules remain visible even after contract dates change.

The demo seed importer also creates invoice receipts for paid fixtures and preserves existing invoice history on subsequent runs.

`npm test` includes invoice totals, amount/date validation, and advancing to the next unpaid period. `supabase/tests/payment_invoices.sql` verifies the RPC under the app's database role, including retries, backdating, overpayment, month-end dates, direct-insert guards and immutable paid history; run it only against a migrated local test database with `psql -v ON_ERROR_STOP=1 -f supabase/tests/payment_invoices.sql`.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
