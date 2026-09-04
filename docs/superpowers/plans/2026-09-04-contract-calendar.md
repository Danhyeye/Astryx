# Contract Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/calendar` page that shows contract due dates, lets the user focus one contract, and prepares the UI for Google Calendar connection.

**Architecture:** Keep recurrence logic in a pure utility so it can be tested without React. Build the calendar page as a client component that fetches contracts, uses Astryx `Calendar` for range/date context, and renders due-date records beside it. Add navigation through the existing `AppFrame` side nav.

**Tech Stack:** Next.js App Router, React 19, Astryx core, TanStack Query, Node test runner.

**Spec:** Approved chat design on 2026-09-04.

## Global Constraints

- Import Astryx calendar as `import {Calendar} from '@astryxdesign/core/Calendar';`.
- Use existing contract fields: `start_date`, `end_date`, `rent_amount`, `payment_frequency`, `payment_due_day`, and `due_day`.
- Generate due dates for `MONTHLY`, `QUARTERLY`, and `YEARLY`.
- Treat `payment_due_day || due_day` as the due day.
- Only include due dates between `start_date` and `end_date`.
- Keep Google Calendar as a connect/sync-ready UI state for this pass; full OAuth needs Google credentials and secure refresh-token handling.

---

### Task 1: Contract Due-Date Utility

**Files:**
- Create: `components/calendar/contractCalendarData.ts`
- Test: `components/calendar/contractCalendarData.test.mjs`

**Interfaces:**
- Consumes: `Contract` from `@/types/contract`
- Produces:
  - `type ContractCalendarEvent`
  - `buildContractCalendarEvents(contracts: readonly Contract[]): ContractCalendarEvent[]`
  - `buildContractOptions(contracts: readonly Contract[]): {label: string; value: string}[]`
  - `eventDateKey(value: string | Date): string`

- [ ] **Step 1: Write the failing test**

```js
test('buildContractCalendarEvents expands monthly quarterly and yearly due dates', () => {
  const events = buildContractCalendarEvents([
    createContract({
      id: 'monthly',
      rent_amount: 1000,
      payment_frequency: 'MONTHLY',
      payment_due_day: 5,
      due_day: 1,
      start_date: '2026-01-01',
      end_date: '2026-03-31',
    }),
    createContract({
      id: 'quarterly',
      rent_amount: 3000,
      payment_frequency: 'QUARTERLY',
      payment_due_day: 10,
      due_day: 1,
      start_date: '2026-01-01',
      end_date: '2026-07-31',
    }),
    createContract({
      id: 'yearly',
      rent_amount: 12000,
      payment_frequency: 'YEARLY',
      payment_due_day: 15,
      due_day: 1,
      start_date: '2026-01-01',
      end_date: '2027-12-31',
    }),
  ]);

  assert.deepEqual(
    events.map(event => [event.contractId, event.date, event.amount]),
    [
      ['monthly', '2026-01-05', 1000],
      ['monthly', '2026-02-05', 1000],
      ['monthly', '2026-03-05', 1000],
      ['quarterly', '2026-01-10', 3000],
      ['quarterly', '2026-04-10', 3000],
      ['quarterly', '2026-07-10', 3000],
      ['yearly', '2026-01-15', 12000],
      ['yearly', '2027-01-15', 12000],
    ],
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test components/calendar/contractCalendarData.test.mjs`

Expected: FAIL because `components/calendar/contractCalendarData.ts` does not exist.

- [ ] **Step 3: Implement the utility**

Create a pure TypeScript module that parses UTC dates, clamps invalid/empty `end_date`, maps frequency to month step, builds event metadata with customer/land/plot labels, and sorts by date then contract label.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test components/calendar/contractCalendarData.test.mjs`

Expected: PASS.

### Task 2: Calendar Page UI

**Files:**
- Create: `components/calendar/ContractCalendarClient.tsx`
- Create: `app/calendar/page.tsx`
- Modify: `components/app-frame/navigation.ts`

**Interfaces:**
- Consumes: `buildContractCalendarEvents`, `buildContractOptions`
- Produces: `/calendar` route and SideNav item

- [ ] **Step 1: Write the failing navigation test**

Add a test assertion that `getAppNavItems()` contains `{label: 'Calendar', href: '/calendar'}` and that `isAppRouteSelected('/calendar/month', '/calendar')` returns `true`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test appNavigation.test.mjs`

Expected: FAIL because the Calendar nav item is missing.

- [ ] **Step 3: Add the page and nav item**

Add `CalendarDays` icon from `lucide-react` to `components/app-frame/navigation.ts`, create `app/calendar/page.tsx` with `AppFrame contentPadding={0}` and `QueryProvider`, and create `ContractCalendarClient.tsx`.

- [ ] **Step 4: Build the client UI**

Use `useContracts({page: 1, pageSize: 100})`, `Selector` for contract filtering, `Calendar` in range mode for a selected contract or single mode for all contracts, and Astryx `Layout`, `Section`, `Card`, `List`, and text primitives for the event list and Google connect status.

- [ ] **Step 5: Run focused checks**

Run: `node --test components/calendar/contractCalendarData.test.mjs appNavigation.test.mjs`

Expected: PASS.

### Task 3: Project Verification

**Files:**
- No new files.

**Interfaces:**
- Consumes: completed Tasks 1 and 2.
- Produces: verified implementation.

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Expected: PASS or only pre-existing unrelated warnings noted in final response.

- [ ] **Step 2: Run build**

Run: `npm run build`

Expected: PASS. If build hangs because of the existing Next/dev environment issue, report that exact limitation.

- [ ] **Step 3: Self-check Astryx rules**

Inspect new UI files for raw `<div>`, inline `style`, hardcoded raw colors, and arbitrary pixel spacing. Replace with Astryx primitives or token-backed utilities before finishing.
