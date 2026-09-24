# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A property management team managing rentals for multiple owners. Confirmed by the user on 24 September 2026. Owner-specific accounts and tenant portals are not established requirements.

## Product Purpose

Manage Vietnamese land rentals: land, constituent plots, customers, contracts, scheduled dues and received payments. Help staff identify rental availability and outstanding balances accurately.

## Operating Context

Vietnamese interface; VND amounts use comma grouping. Business dates use Asia/Ho_Chi_Minh. Payment entry records money already received; it does not transfer funds.

## Capabilities and Constraints

Preserve existing content and features: dashboard, search/filter/saved views, land and plot management, customer records, contract creation/editing/preview, calendar and Google synchronization, images and files, scheduled dues and installment invoice history. Land owns plots; contracts can rent multiple plots or the whole land. Availability respects rental periods. Invoice totals determine payment status.

The existing codebase uses Next.js, React, Supabase and Astryx. Follow AGENTS.md and use Astryx components and theme tokens. Do not invent ownership-management capabilities, testimonials or business metrics.

## Brand Commitments

Keep the product name Quản lý đất đai and Vietnamese content. The user requests a modern, bold replacement for the plain black visual identity, a fresh color palette, mobile-first responsive behavior and clearer hierarchy. Preserve the BottomSheet invoice history and plot badges.

## Product Principles

- Put the next operational task and relevant financial context first.
- Make customer, property and rental-period identity clear before recording changes.
- Preserve financial safeguards and confirmed payment history.
- Make the same capabilities usable on phones and desktop.

## Evidence on Hand

Existing application routes and components, README.md business rules, Supabase schema and user-confirmed workflows. Demo seed data is illustrative, not business proof.

## Confirmed palette

Use olive green `#A3B565` for primary areas and actions, with cream `#FDF8E2` for the main canvas and pale olive `#D0D6A3` for supporting cards, muted panels and table headers. Use dark olive text for contrast. This replaces the earlier blue direction.
