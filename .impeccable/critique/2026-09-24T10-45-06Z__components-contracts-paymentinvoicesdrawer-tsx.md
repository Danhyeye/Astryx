---
target: Invoice bottom sheet and payment flow
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Applications/Development/astryx/components/contracts/PaymentInvoicesDrawer.tsx"
target_fingerprint: "sha256:2db0f6ebedc0e7aa89378601a25a3ced201a09ccb081cc49d52050bdea5adc73"
target_path: /Applications/Development/astryx/components/contracts/PaymentInvoicesDrawer.tsx
timestamp: 2026-09-24T10-45-06Z
slug: components-contracts-paymentinvoicesdrawer-tsx
---
Method: dual-agent (A: /root/design_review · B: /root/evidence_review)

# Invoice payment flow critique

Target: components/contracts/PaymentInvoicesDrawer.tsx, with PayInvoiceDialog.tsx and ContractPayments.tsx as supporting flow. Source-based review; browser rendering and interaction are unverified. No UI changes made.

## Design specificity
The Vietnamese rental terminology, plot badges, installment status and date/amount history fit the product. The main weakness is hierarchy: contract background precedes financial evidence. Preserve the explicitly requested BottomSheet and plot badges. Independent detector assessment found zero findings across all three components; this does not establish visual correctness.

## Design health
| Heuristic | Score /4 | Main observation |
|---|---:|---|
| System status | 3 | Pending/partial states clear; success closes silently |
| Real-world match | 3 | Payment recording versus initiating payment is ambiguous |
| User control | 2 | Close/cancel available; correction path not visible |
| Consistency | 3 | Cohesive Astryx components; amount alignment differs |
| Error prevention | 3 | Validation, defaults and retry protection |
| Recognition | 2 | Identity missing in payment modal; totals missing in history |
| Efficiency | 2 | History requires scanning background sections |
| Minimalist design | 3 | Clear sections, misplaced priorities |
| Error recovery | 2 | Raw server errors lack dependable next steps |
| Help | 2 | Recording semantics and correction procedure unexplained |
| Total | 25/40 | Usable; task hierarchy and reassurance need work |

## Strengths
- Today and remaining-balance defaults keep entry short.
- Partial payment status includes remaining money and overdue context.
- Existing components, Vietnamese labels, missing-data fallbacks and newest-first history are consistent.

## Priority issues
### P2: Financial evidence is buried
PaymentInvoicesDrawer.tsx:31-65 puts customer, property, plot badges and unrestricted notes before transaction history. Total due, paid and remaining are absent. Put a compact balance summary and history below the title; retain requested customer/property/notes afterward. Suggested command: $impeccable layout.

### P2: Recording a payment lacks identity/context
PayInvoiceDialog.tsx:19-20,52 shows period and amount but not customer/property. After interruption, users must recall the target. Add customer and land/plot identity. Confirm whether the action merely records received money before proposing a label change to Ghi nhận thanh toán. Suggested command: $impeccable clarify.

### P2: Completion and errors lack clear next steps
PayInvoiceDialog.tsx:39-47,62 closes on success and passes raw server errors through. Confirm saved amount and period, link to history, and translate expected errors into recovery guidance. Distinguish confirmed failure from unknown connection outcomes. Suggested command: $impeccable harden.

## Cognitive load and emotional journey
Two inputs are appropriate and badges are informational, not competing choices. The main memory burden is losing customer identity in the payment dialog and financial totals in history. Metadata-first history adds scanning; silent dismissal weakens reassurance after a high-stakes action.

## Persona risks
Frequent administrators must repeatedly scroll to reconcile payments. Interrupted mobile users lack identifying context in the payment dialog. Keyboard/screen-reader users need contextual action labels and confirmed success announcements; actual focus behavior remains unverified.

## Minor observations
Right-align schedule amounts consistently with history. Empty history is not a normal-flow defect because its trigger requires invoices. Do not infer unsupported multi-customer requirements from array types.

## Questions to consider
Should opening history prioritize payment reconciliation or contract background? Does Thanh toán hóa đơn record an external payment or initiate a money transfer?
