---
target: Mobile tables across pages and calendar
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Applications/Development/astryx/components/table-filter/TableFilterClient.tsx"
target_fingerprint: "sha256:7a356e090c424df03aca2fd342801c43fc103d5dfe5faa00bfadbfa0c5750571"
target_path: /Applications/Development/astryx/components/table-filter/TableFilterClient.tsx
timestamp: 2026-09-24T11-42-06Z
slug: components-table-filter-tablefilterclient-tsx
---
Method: dual-agent (A: /root/mobile_review_a · B: /root/mobile_review_b)

Scope: mobile main record lists, grouped views, land-detail plots/contracts, rental-availability table, contract payments/invoice history, customer/plot details, and calendar.

Overall: responsive conversion is partly complete. The olive/cream theme is coherent; information density and consistency across related screens are the main weaknesses.

Health: 23/40, acceptable but needs improvement. Scores out of four: system status2, real-world match3, control2, consistency2, prevention2, recognition3, efficiency2, minimalism2, recovery3, help2. These are heuristic judgments, not measured usability outcomes.

Strengths: main mobile records wrap without document overflow; financial actions have explicit labels; payment rows and invoice history already have mobile list variants; statuses include text; errors and retry are handled on main lists.

Priority issues:
1. P1 Calendar agenda is buried below a desktop-height month. Browser confirms160px day cells at390px wide, with selected-day details beyond the first viewport. Use compact month cells and place the selected agenda immediately below; optionally provide agenda-first mobile mode. Source ContractCalendarClient.tsx:151. Command: impeccable adapt.
2. P1 Related and grouped tables lack consistent mobile layouts. LandContracts has seven columns; LandDetailClient plots and ContractRentalSchedule retain Tables. Grouped TableFilter views bypass the mobile List. Source-confirmed structural risk; no reproduced detail-table overflow claimed. Use labeled mobile rows with group headings and dates/conflict status kept together. Command: impeccable adapt.
3. P2 Main mobile rows are too tall for comparison. Browser contract row approximately405px; only one complete record fits below the toolbar. Prioritize customer/property, status, amount and next due date; make secondary fields expandable. Selection and detail actions must remain readily accessible. Source TableFilterClient.tsx:1156. Command: impeccable distill.
4. P2 Calendar controls fragment and have small tap areas. Previous arrow wraps separately from Today/Next; day/count buttons measure28px tall. Keep navigation in a single deliberate row; use a larger single interactive day target with date/count accessible name. Source ContractCalendarClient.tsx:109,155–164. Command: impeccable layout.
5. P2 Invoice history lacks customer/property identity. Only due date identifies the schedule; customer/land/plot context is commented out. Restore a compact identity summary above totals while retaining the BottomSheet and date/amount history. Source PaymentInvoicesDrawer.tsx:29–83. Source-only finding. Command: impeccable clarify.

Additional source observations: calendar contract filtering changes the displayed date to contract start; preserve current month by default or make that jump explicit. Fixed side labels in customer/plot metadata may squeeze long content; verify before changing.

Personas: busy property managers cannot quickly compare long records; phone users tap a date without its result appearing nearby; motor-access users face short calendar targets. Actual screen-reader behavior was not tested.

Evidence: detector zero findings; browser390x844 main lands/contracts/customers/calendar no document overflow or page errors. Standalone plot query resolved to lands, so plots plus detail/payment screens were source reviewed only. No app code/data changed.
