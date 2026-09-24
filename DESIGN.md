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

The app uses the Astryx Matcha theme, installed with `astryx theme add matcha`. This replaces the custom workspace palette. Theme source: `src/themes/matcha/matchaTheme.ts`; generated stylesheet: `src/themes/matcha/matcha.css`.

## Colors

Use Matcha semantic tokens for surfaces, actions, borders and statuses. System light/dark mode remains enabled. The old `theme/workspace.*` files are inactive reference files.

## Typography

DM Sans body text, Playwrite US Trad headings, and JetBrains Mono code are loaded with Next fonts and connected through CSS variables.

## Layout

Preserve the existing mobile record lists, two-column details, compact calendar, and BottomSheet detail/history views. Desktop retains tables and side panels. The responsive CSS rule on AppShell prevents the desktop sidebar from appearing on phones before hydration.

## Shapes

Use the Matcha component defaults, including rounded buttons and cards.

## Components

Keep Vietnamese labels, comma-grouped financial amounts, clear payment status, and accessible form controls. Build the theme after editing its source. Do not edit generated CSS.

## Do's and Don'ts

Use Astryx layout components and semantic tokens. Preserve all rental/payment functionality. Do not restore the earlier custom palette through page-level overrides.
