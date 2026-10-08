<p align="center">
  <img src="public/images/astryx-dark.svg" alt="Astryx logo" width="96" height="96" />
</p>

# Astryx

A workspace for managing land, plots, customers, rental contracts, and payments. Astryx brings property records and rental activity together so you can check availability, track upcoming payments, and review contract history in one place.

Built with a responsive interface and the Matcha theme: olive green, sage, and warm cream, with light and dark modes.

## What you can do

| Area | Features |
| --- | --- |
| Overview | Open the dashboard for a summary of your rental operations. |
| Land and plots | Organize land records and their plots, view details, and check rental availability. |
| Customers | Maintain customer records and review their related contracts. |
| Contracts | Create and edit rental contracts, calculate rental end dates, and manage attached files. |
| Payments | Track scheduled dues, record partial or full payments, and review invoice history and outstanding balances. |
| Payment calendar | View payment dates and connect Google Calendar through a separate authorization flow. |
| Profile and access | Sign in with Google, view your profile, and see the list of accounts allowed to access the app. |

## A typical workflow

1. Add land and the plots available for rent.
2. Create a customer record.
3. Create a contract with the customer, plots, rental dates, and payment cycle.
4. Follow the payment schedule and record payments as they arrive.
5. Review invoices, upcoming dues, and plot availability as contracts progress.

## Access control

Sign-in is available only to verified Google accounts whose email matches an active row in Supabase's `public.app_users` table. All allowed users share the same application data; there are no separate application roles.

Manage access in **Supabase → Table Editor → app_users**:

- Add an email in lowercase with `is_active = true` to grant access.
- Set `is_active = false`, or delete the row, to revoke access on the user's next request.
- The migration seeds `danhtcse171725@fpt.edu.vn`; review this entry when setting up another installation.

The **Cài đặt hồ sơ** page shows a read-only user list with active and disabled account counts. Users cannot register themselves or edit access permissions through the app. Google's OAuth test-user list is not the app's access list.

## Technology

- **Application:** Next.js 16 App Router, React 19, TypeScript
- **Interface:** Astryx Design, Matcha theme, Tailwind CSS, StyleX, Lucide icons
- **Data:** Supabase PostgreSQL and Storage, TanStack Query
- **Authentication:** NextAuth / Auth.js v5 beta with Google OAuth
- **Charts:** Chart.js and react-chartjs-2

## Run locally

Use a Node.js version that supports the project's `--env-file` and `--experimental-strip-types` scripts, such as Node.js 22.19 or newer. You also need a Supabase project and a Google OAuth web application client.

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` using [.env.example](.env.example) as the reference:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key from the environment template. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side database and storage access. Keep this secret. |
| `AUTH_SECRET` | Session encryption secret; generate with `openssl rand -base64 32`. |
| `AUTH_GOOGLE_ID` | Google OAuth client ID for sign-in. |
| `AUTH_GOOGLE_SECRET` | Matching Google OAuth client secret. |
| `AUTH_URL` | The deployed app's origin, such as `https://your-domain.example`. |

Sign-in can reuse `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` if the `AUTH_GOOGLE_*` values are omitted. For Calendar integration, configure the `GOOGLE_*` variables documented in `.env.example`.

Register these authorized redirect URIs on the corresponding Google OAuth client:

```text
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/calendar/google/callback
```

The first callback handles app sign-in; the second handles Google Calendar authorization. Calendar scopes may require adding test users while the OAuth application is in Testing mode.

Apply the SQL migrations in [supabase/migrations](supabase/migrations) in order to your intended Supabase project before using the app. In particular:

- `20260924100000_release_finished_plot_rentals.sql` enforces rental availability rules.
- `20260924110000_payment_invoices.sql` enables invoice-based payments and migrates legacy paid records.
- `20261008000000_owner_only_access.sql` restricts direct database access and makes app storage private.
- `20261008010000_app_users.sql` creates the application access list.

The access migration assumes the Supabase public schema is dedicated to this app. It revokes anonymous and Supabase-user access to application tables and RPCs; older clients that query Supabase directly will stop working. Database access now goes through authenticated server APIs.

Start the app:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000) and sign in with an active account from `app_users`.

## Rental and payment rules

- **Rental dates:** an end date is calculated as the start date plus the duration in calendar months, minus one day. Month overflow is clamped. A blank duration keeps the rental open-ended.
- **Availability:** the end date is inclusive; a plot becomes available the following day. Overlapping active or pending rentals and sold plots remain blocked. Completed or cancelled contracts do not reserve plots. Manually rented plots without contract history remain unavailable because their release date is unknown.
- **Payment cycles:** monthly, quarterly, and yearly schedules advance by 1, 3, and 12 months. The configured amount applies to each scheduled due date. Short months clamp the due day.
- **Outstanding dues:** the next payment is the earliest unpaid scheduled date. Partial payments leave the remaining balance due, including when overdue.
- **Invoices:** one scheduled due can have multiple payment receipts. The app rejects future payment dates, non-positive amounts, and overpayments. Recorded invoice history is append-only; payments use `pay_contract_invoice`, not a manually changed paid flag.
- **Legacy custom schedules:** existing custom contracts retain their schedules, but creating a new custom schedule is not currently available.

Rental and payment date handling uses Vietnam time. Existing recorded payment schedules remain visible when contract dates change.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Build for production. |
| `npm start` | Run the production build. |
| `npm run lint` | Run ESLint. |
| `npx tsc --noEmit` | Check TypeScript types. |
| `npm test` | Run the configured test suites. |

With the local server running, check authentication and protected routes:

```bash
node --env-file=.env.local scripts/auth/smoke.mjs
```

The smoke script checks anonymous and unlisted requests, page redirects, allowed-user reads, CSRF protection, and sign-out. It uses temporary test cookies rather than a real Google consent flow. Set `AUTH_SMOKE_EMAIL` to an active account if you are not using the seeded account.

Database fixtures in [supabase/tests](supabase/tests) are intended for a migrated local test database, not production.

## Deployment

1. Apply the database migrations to the target Supabase project.
2. Configure the environment variables in your hosting provider; local `.env.local` values are not automatically deployed.
3. Set a production `AUTH_SECRET` and `AUTH_URL=https://your-domain.example`.
4. Register the production Google callbacks, replacing `http://localhost:3000` with the deployed origin. Update `GOOGLE_REDIRECT_URI` for Calendar as well.
5. Build and deploy, then verify sign-in with an active account.

Keep service-role and OAuth secrets server-only. Uploaded images are served through an authenticated API, and contract downloads use short-lived signed links.

If sign-in shows `Configuration`, inspect the deployment logs for the underlying `[auth][error]` message and check the production environment variables.
