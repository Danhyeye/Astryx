---
name: Quản lý đất đai — Matcha
description: Astryx Matcha theme for the rental management workspace
colors:
  primary: "#3E481D"
  secondary: "#707E46"
  soft: "#C0CBA9"
  canvas: "#F0F0E0"
  surface: "#FFFFFF"
---

## Overview

The app offers Astryx Matcha (default) and Neutral, installed with `astryx theme add`. Users switch themes in profile settings; a browser cookie persists the choice and the root layout restores it on the server. Sources live in `src/themes/matcha/` and `src/themes/neutral/`; build both themes after changing their sources.

## Colors

Use the selected theme's semantic tokens for surfaces, actions, borders and statuses. Light/dark mode follows the device by default; a profile-settings toggle uses `next-themes` to persist an explicit choice in browser storage and passes the resolved mode to Astryx. The old `theme/workspace.*` files are inactive reference files.

## Typography

Both themes use Montserrat body text, Be Vietnam Pro headings, and JetBrains Mono code, loaded with Next fonts and connected through CSS variables.

Both themes use the same typography scale (base 16, ratio 1.25) to keep text sizes consistent when switching themes.

Spacing and control sizes are shared through `src/themes/layoutTokens.ts` so padding, margins, gaps, and control heights stay consistent across themes.

## Layout

Preserve the existing mobile record lists, two-column details, compact calendar, and BottomSheet detail/history views. Desktop retains tables and side panels. The responsive CSS rule on AppShell prevents the desktop sidebar from appearing on phones before hydration.

## Shapes

Use the selected theme's component defaults; Matcha includes rounded buttons and cards.

## Components

Keep Vietnamese labels, comma-grouped financial amounts, clear payment status, and accessible form controls. Build the theme after editing its source. Do not edit generated CSS.

## Do's and Don'ts

Use Astryx layout components and semantic tokens. Preserve all rental/payment functionality. Do not restore the earlier custom palette through page-level overrides.
