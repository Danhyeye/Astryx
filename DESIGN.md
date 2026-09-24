---
name: Quản lý đất đai
description: Olive and cream property management workspace
colors:
  primary: "#A3B565"
  primary-dark: "#A3B565"
  nav-olive: "#A3B565"
  nav-cream: "#FDF8E2"
  nav-on-cream: "#29321E"
  body: "#FDF8E2"
  body-dark: "#20251A"
  surface: "#FDF8E2"
  surface-dark: "#282E21"
  card: "#D0D6A3"
  card-dark: "#303827"
  muted: "#D0D6A3"
  muted-dark: "#3A442E"
  text: "#29321E"
  text-dark: "#FDF8E2"
  text-secondary: "#555F42"
  text-secondary-dark: "#D2D5BC"
  border: "#D1D6B8"
  border-dark: "#596348"
typography:
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.4286
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.4375rem"
    fontWeight: 700
    lineHeight: 1.3913
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  inner: "5px"
  element: "10px"
  container: "15px"
spacing:
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text}"
    rounded: "{rounded.element}"
    height: "44px"
  navigation-selected:
    backgroundColor: "{colors.nav-cream}"
    textColor: "{colors.nav-on-cream}"
    height: "48px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.container}"
    padding: "{spacing.4}"
---
# Design System: Quản lý đất đai

## Overview

**Creative North Star: "Olive and cream workspace"**

A clear operational workspace for Vietnamese property management teams. Olive anchors navigation and primary actions; cream marks the selected destination. Warm cream surfaces and dark olive text keep dense records readable while making the identity visibly bolder.

**Key Characteristics:**
- Bold navigation, calm working surfaces.
- Readable Vietnamese typography.
- Mobile-first access to operational features.

This is a scan of the implemented system, not a new visual proposal. Sources: `theme/workspace.theme.ts`, generated `theme/workspace.css`, `components/app-frame/AppFrame.tsx`, `app/globals.css`, and Astryx core primitives.

## Colors

Primary olive gives actions their emphasis. The navigation uses a deeper olive with cream selection and dark green selected text. Mint is a navigation accent, not a replacement for semantic payment status.

Neutral body, surface, card, muted, text and border roles each have a dark counterpart. `Theme` follows the system mode. The primary accent is pinned to the user’s exact olive; the main canvas uses the exact cream, and supporting cards, muted panels and table headers use pale olive `#D0D6A3`. Dark mode uses complementary olive neutrals. Make changes in the theme source and regenerate its output.

**The Semantic Color Rule.** Use semantic theme tokens and retain labeled status information; do not introduce page-local brand colors.

## Typography

Geist Sans supplies body and headings through the Next font variable. Bold first- and second-level headings establish hierarchy; supporting copy uses secondary text. The generated scale has a base of 16 and ratio of 1.2, rounded by Astryx. Keep financial values readable and preserve the application's number formatting.

## Layout

`AppShell` supplies the frame and collapsible `SideNav`. Navigation changes to the mobile treatment at Astryx's `md` breakpoint. Content uses Astryx stacks, grids and responsive component props. Let controls wrap and sections stack on narrow screens while retaining access to every action.

**The Records Rule.** Use tables or lists for dense collections; reserve cards for standalone summaries, charts and distinct detail groups.

The spacing frontmatter captures recurring scale steps. Medium controls use the theme's 44px element size; large controls and navigation items use 48px. These are component dimensions, not a guarantee about every existing hit area.

## Elevation & Depth

Tonal separation and warm olive borders supply the primary hierarchy. Cards inherit Astryx behavior with the workspace border override; dialogs, popovers and BottomSheet retain library elevation. No additional custom shadow system is defined.

## Shapes

The generated theme provides inner, element and container corner sizes recorded above. Use component defaults to preserve consistent forms rather than manually rounding individual controls. Larger page and fully rounded shapes remain available through the inherited theme where components require them.

## Components

- Buttons: olive primary actions, inherited secondary and ghost treatments, visible keyboard focus and Astryx disabled/loading states. Focus and accent text use a darker olive in light mode for contrast.
- Fields: use labeled Astryx form controls with their inherited focus, validation and disabled states.
- Navigation: olive surface, dark olive labels, cream selected destination, collapse control and mobile navigation supplied by AppShell.
- Tables: muted header surface and clear rows; maintain sort, search, filter and saved-view behavior.
- Cards: theme card surface and border, typically spacing step 4 or 5 for dashboard widgets.
- Status and identifiers: preserve plot identifiers; use Token or StatusDot for status and Badge for counts in new work.
- Invoice history: retain BottomSheet as the existing focused history surface.

Motion uses theme fast, medium and slow durations. Preserve the library's reduced-motion handling. The sidecar contains compact illustrative primitive previews; production implementation remains Astryx.

## Do's and Don'ts

### Do
- Do use Astryx layout components and token-backed spacing.
- Do preserve Vietnamese labels and clear property, customer and rental-period identity.
- Do keep dense records in tables or lists and standalone summaries in cards.
- Do keep invoice history in BottomSheet and preserve plot identifiers.

### Don't
- Don't add raw layout elements, inline styles or arbitrary color and spacing values.
- Don't use color alone to convey payment or availability status.
- Don't replace operational information with decorative imagery or invented metrics.
