# Custom day-based payment schedules

Goal: Support fixed installments and daily-rate installments every N days, prepaid from contract start. Fixed final installments retain their amount; daily final installments bill actual inclusive days.

Architecture: Optional custom_payment_mode and payment_interval_days preserve legacy CUSTOM contracts. One shared date/amount calculator serves calendars and next dues. A database migration validates the same rules when recording invoices; existing recorded dues remain authoritative.

- [ ] Test and implement UTC day-based schedule generation, partial final periods, legacy behavior, next unpaid dates.
- [ ] Add optional fields to storage, API validation, mapping and form state; migrate invoice RPC validation and calculation.
- [ ] Add shared custom schedule fields to create/edit dialogs and explain amounts in previews/details.
- [ ] Run scheduling, form and API tests, TypeScript and lint; report migration deployment status.
