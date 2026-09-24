---
target: components/table-filter/LoadingRows.tsx
total_score: 19
max_score: 28
na_heuristics: 3,5,10
p0_count: 0
p1_count: 1
target_identity: "file:/Applications/Development/astryx/components/table-filter/LoadingRows.tsx"
target_fingerprint: "sha256:7c9d27ad7f7ae19cfb964a5ee17ea512cefd281e3d5c7c9774b27c91176ff70e"
target_path: /Applications/Development/astryx/components/table-filter/LoadingRows.tsx
timestamp: 2026-09-24T11-26-22Z
slug: components-table-filter-loadingrows-tsx
---
Method: dual-agent (A: /root/loading_design · B: /root/loading_evidence)

Target: components/table-filter/LoadingRows.tsx

The desktop skeleton is restrained and appropriate for a rental-management workspace. The biggest problem is that it previews a desktop table even when the finished screen will be a mobile list.

## Design health

| Heuristic | Score | Evidence |
|---|---:|---|
| System status | 2 | Header reports zero results during a pending request. |
| Match with real world | 3 | Placeholders resemble record rows. |
| User control | n/a | Passive fragment. |
| Consistency | 2 | Mobile loading and loaded structures differ. |
| Error prevention | n/a | No inputs. |
| Recognition over recall | 3 | Configured column order preserved. |
| Flexibility/efficiency | 2 | Desktop-only placeholder layout. |
| Minimalist design | 4 | Quiet, uncluttered skeleton. |
| Error recovery | 3 | Parent provides retry. |
| Help/documentation | n/a | No instructional task. |

Total: 19/28, acceptable; scoped assessment, not an app-wide score.

## What works

Column widths, order and density follow the table configuration. Localized status semantics and hidden decorative rows avoid exposing fake data. Library Skeleton supports reduced motion and forced colors. Parent provides separate empty and error states.

## Priority issues

1. **P1 — Mobile placeholders are clipped.** LoadingRows keeps a horizontal column layout at every width. Browser verification at 390px confirmed inner clipping, not document overflow. The loaded screen instead uses stacked list records. Use the same responsive branch for skeletons and loaded records. Relevant source: LoadingRows.tsx:44–58 and TableFilterClient.tsx loading/list branches. Suggested command: impeccable adapt.
2. **P2 — Zero results is shown before results are known.** The parent header displays “0 kết quả” while the request is pending. Replace the count with “Đang tải…” until resolved; retain the numeric count once known. Suggested command: impeccable clarify.

## Cognitive load and personas

There are no decisions inside the skeleton. Busy operators benefit from desktop spatial continuity. Phone users face a misleading shape and clipped placeholders. Screen-reader users have a named status region, but actual live announcement needs assistive-technology verification.

## Minor observations

A short visible loading label would reassure users on slow connections, especially with reduced motion. Do not introduce extra animation. No need to replace the olive/cream palette. Initial screen-reader announcement was not verified and is not asserted to be defective.

Detector: zero findings for the target TSX. Browser: fresh headless desktop and mobile pages with delayed read-only GET; screenshots show mobile clipping and pending zero count. No source changed.
