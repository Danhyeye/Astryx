import * as stylex from '@stylexjs/stylex';
import {
  borderVars,
  colorVars,
  durationVars,
  easeVars,
  fontWeightVars,
  radiusVars,
  spacingVars,
  typeScaleVars,
} from '@astryxdesign/core/theme/tokens.stylex';

export const styles = stylex.create({
  // height="fill" resolves to height:100%, which needs a definite height the
  // host's <html>/<body> don't set. Without it the shell grows to fit the
  // table, the document scrolls, and the end panel rides away with it.
  pageShell: {
    height: '100dvh',
    // Layout is transparent by design, so without this the shell inherits
    // whatever the host paints. That reads fine on a bare UA canvas but puts
    // dark-mode text on a light page the moment the host has a background of
    // its own. Owning the surface makes the page legible wherever it is
    // embedded.
    backgroundColor: colorVars['--color-background-surface'],
    // A pinned cell paints an opaque base so scrolled content cannot show
    // through it, and that base defaults to the card token — right for a table
    // inside a card, wrong for this one, which sits on the page surface. Both
    // tokens are the same white in light mode, so the mismatch only surfaces
    // in dark, as a darker band exactly where the frozen columns are.
    '--table-sticky-background': colorVars['--color-background-surface'],
  },
  // A wrapped row's `gap` sets both axes, and 8px between stacked lines is more
  // air than these need; the row gap is tightened back to 6 on its own.
  bar: {
    rowGap: 6,
  },
  // Wraps rather than collapsing (see the note in filterBar): clauses that no
  // longer fit move to a second line, keeping the count beside the last one.
  filterRow: {
    rowGap: 6,
  },
  // Queried rather than @media: opening the detail panel narrows this header
  // without the viewport changing, and that is the width the toolbar actually
  // has to fit in.
  toolbarContainer: {
    containerName: 'toolbar',
    containerType: 'inline-size',
  },
  // Taking the full line forces the trailing cluster onto a second row. Below
  // this the filter row and the view controls were splitting the width so
  // evenly that neither had enough: the filters were collapsing into overflow
  // while the buttons still had room to spare.
  toolbarPrimary: {
    flexBasis: {
      default: 0,
      '@container toolbar (max-width: 860px)': '100%',
    },
  },
  // Holds the cluster against the end edge on its own row, where it would
  // otherwise sit under the filters at the start.
  toolbarEnd: {
    marginInlineStart: 'auto',
  },
  filterMeta: {
    flexShrink: 0,
  },
  // A saved view can carry more clauses than the dialog is wide.
  tokenWrap: {
    flexWrap: 'wrap',
    rowGap: 4,
  },
  // Token ellipsises on overflow, but only once it is allowed to shrink below
  // its content; without this a long clause runs past the dialog edge instead.
  filterToken: {
    minWidth: 0,
    maxWidth: '100%',
  },
  progress: {
    position: 'absolute',
    insetBlockStart: 0,
    insetInline: 0,
  },
  headerWrap: {
    position: 'relative',
  },
  // The bulk bar now sits inside the header's 16px gutter, so it needs a
  // corner radius to read as a band rather than a clipped full-bleed strip.
  bulkBand: {
    borderRadius: radiusVars['--radius-element'],
  },
  // The bar mounts the moment the first row is checked, so its entry is a
  // `@starting-style` transition rather than a keyframe or a mount flag: the
  // settled value is the one written here, so an interrupted transition still
  // lands correctly. Reduced motion collapses the duration instead of the
  // property — a media query can't nest inside `@starting-style`, so the
  // duration is what gets conditioned (same form as ToastViewport/Markdown).
  bulkBandEnter: {
    opacity: 1,
    transform: 'translateY(0)',
    transitionProperty: 'opacity, transform',
    transitionDuration: {
      default: durationVars['--duration-medium'],
      '@media (prefers-reduced-motion: reduce)': '0s',
    },
    transitionTimingFunction: easeVars['--ease-standard'],
    '@starting-style': {
      opacity: 0,
      transform: `translateY(${spacingVars['--spacing-3']})`,
    },
  },
  // Sits at the width of the filter selectors beside it so the row reads as
  // one family of controls, and widens on focus for typing room. `xstyle`
  // lands on the input's own wrapper, so `:focus-within` is already in scope
  // and no React state is needed. TextInput's `width` prop is the sanctioned
  // way to size a field, but it takes one static value and cannot express a
  // focus variant, so the width lives here instead.
  searchInput: {
    width: {
      default: 120,
      ':focus-within': 240,
    },
    transitionProperty: 'width',
    transitionDuration: {
      default: durationVars['--duration-fast'],
      '@media (prefers-reduced-motion: reduce)': '0s',
    },
    transitionTimingFunction: easeVars['--ease-standard'],
  },
  // ButtonVariantMap has no outline variant, so the Button-backed toggles in
  // the row paint the field chrome the selectors beside them draw natively —
  // same border token, same radius — rather than reading as a different
  // family of control.
  filterChrome: {
    borderWidth: borderVars['--border-width'],
    borderStyle: 'solid',
    borderColor: colorVars['--color-border-emphasized'],
    borderRadius: radiusVars['--radius-element'],
  },
  filterSurface: {
    backgroundColor: colorVars['--color-background-surface'],
  },
  // The fill a control switches to once it carries a value. This is the token
  // ToggleButton paints for its own pressed state, so a set selector and a
  // pressed preset land on the same value over the same backdrop instead of
  // two neighbouring shades of engaged.
  filterFill: {
    backgroundColor: colorVars['--color-overlay-pressed'],
  },
  // ComplexSelector's popup only floors its width at the trigger's. A range
  // slider needs a track long enough to resolve $100 steps under the thumb, so
  // the popup states one.
  rangePopover: {
    width: 300,
  },
  // A Selector states its own emptiness typographically — placeholder weight
  // and secondary text unset, body weight and primary text once it holds a
  // value. Button labels are medium and always primary, so without this the
  // unpressed toggles sit heavier and darker than the unset selectors they
  // are meant to match.
  filterLabelValue: {
    fontWeight: fontWeightVars['--font-weight-normal'],
  },
  filterLabelEmpty: {
    fontWeight: fontWeightVars['--font-weight-normal'],
    color: colorVars['--color-text-secondary'],
  },
  // Popover paints a 12px gutter on its content container and publishes no
  // padding prop, so the only way to a flush container is xstyle. It lands on
  // that same container, and these are the exact longhands Popover sets — a
  // `padding` shorthand would compile to the physical properties and leave the
  // logical ones standing. Flush, the rail's divider and the footer rule reach
  // the popover edges, and each region below re-states its own gutter.
  viewPopoverSurface: {
    paddingBlockStart: 0,
    paddingBlockEnd: 0,
    paddingInlineStart: 0,
    paddingInlineEnd: 0,
  },
  // The popover's height is set here rather than left to each section, so it
  // doesn't resize under the pointer as the reader moves down the rail — the
  // trigger is at the top right, so a shrinking panel would walk the rail out
  // from under the cursor. Columns fills this height and scrolls inside it;
  // the other three are shorter and are padded out to it.
  //
  // A fixed height, not a minimum: min-height alone is a floor, so a long
  // column list would still push the popover past it, and a panel can only
  // scroll once some ancestor gives it a height to scroll within.
  viewPopover: {
    blockSize: 448,
  },
  // ESCAPE HATCH (see report): DialogHeader takes no `padding`, and inside a
  // Dialog its LayoutHeader adds the dialog's own gutter a second time — the
  // title lands at 32px while a Section body lands at 16px. Section escapes
  // this by negative-margining out of the container padding before it pads
  // itself; Layout does the same, which is why the canonical block puts one
  // between Dialog and DialogHeader. Same escape, applied to the header
  // directly, so its own 16px is the only gutter. Block-end is left alone —
  // the header's bottom padding is real spacing, not an edge to cancel.
  dialogHeaderBleed: {
    marginInlineStart: 'calc(-1 * var(--container-padding-inline-start, 0px))',
    marginInlineEnd: 'calc(-1 * var(--container-padding-inline-end, 0px))',
    marginBlockStart: 'calc(-1 * var(--container-padding-block-start, 0px))',
  },
  // Wide enough for "Sticky Columns" on one line once the rail carries its own
  // gutter rather than borrowing the popover's.
  viewRail: {
    width: 184,
    flexShrink: 0,
  },
  // Pairs with the rail's 4px gutter: the item keeps Button's own
  // --radius-element and sits inside the popover's --radius-container, so the
  // two corners curve together instead of the item squaring off in a rounded
  // box. Both tokens move with the theme's radius multiplier, so the pairing
  // survives a theme swap.
  railItem: {
    width: '100%',
    justifyContent: 'flex-start',
  },
  // Full height so the transfer panels can reach the popover floor: sized to
  // its content instead, the pane stops short and the rule between the panels
  // ends in mid-air — most visibly when a search empties both sides.
  viewPanel: {
    blockSize: '100%',
    flexGrow: 1,
    minWidth: 0,
  },
  // --- Columns transfer list -------------------------------------------------
  // Copies the lab TransferList's panel chrome rather than importing it: that
  // package is unpublished and does not resolve from the template viewer, so
  // the visual contract is restated here against the same tokens.
  // The lab component stacks its panels under `@container (max-width: 40rem)`.
  // That query is not carried over: this pane is the popover's 660px less the
  // 184px rail and its gutters — about 28rem — so the stacked branch would be
  // the only one that ever ran, and side by side is the layout this panel is
  // for. The pane has no other width to respond to; the popover is fixed.
  transferRoot: {
    flexGrow: 1,
    minHeight: 0,
    minWidth: 0,
  },
  // The pair runs to the pane's edges, so the rule between them is full height
  // and each panel's header rule reaches its own edges. Nothing here is padded:
  // the gutter lives on the header, the rows and the empty state instead, via
  // the two Pad styles below.
  transferPanels: {
    flexGrow: 1,
    minHeight: 0,
    minWidth: 0,
  },
  // flexBasis 0 with grow splits the row into two equal halves; the two minimums
  // then let a half shrink below its content instead of pushing the popover
  // wider or taller than the height every other section is held to, which is
  // what lets a long column list scroll inside its own panel.
  transferPanel: {
    flexBasis: 0,
    flexGrow: 1,
    minBlockSize: 0,
    minWidth: 0,
    overflow: 'hidden',
  },
  // 16px against the pane's outer edge, 12px against the divider: the outer
  // gutter matches the heading above, and the inner one only has to clear a
  // 1px rule.
  transferPadStart: {
    paddingInlineEnd: spacingVars['--spacing-3'],
    paddingInlineStart: spacingVars['--spacing-4'],
  },
  transferPadEnd: {
    paddingInlineEnd: spacingVars['--spacing-4'],
    paddingInlineStart: spacingVars['--spacing-3'],
  },
  transferPanelDivider: {
    borderInlineStartColor: colorVars['--color-border'],
    borderInlineStartStyle: 'solid',
    borderInlineStartWidth: borderVars['--border-width'],
  },
  transferPanelHeader: {
    borderBlockEndColor: colorVars['--color-border'],
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: borderVars['--border-width'],
  },
  // The bulk action sits on the header rule beside a label, where button chrome
  // would outweigh the list it acts on. Stripped to a text link, it reads as
  // secondary to the rows without losing the accent that marks it actionable.
  transferHeaderAction: {
    backgroundImage: {
      default: 'none',
      ':hover:where(:not(:disabled,[aria-disabled="true"]))': 'none',
      ':active': 'none',
    },
    borderRadius: 0,
    color: colorVars['--color-text-accent'],
    fontSize: typeScaleVars['--text-body-size'],
    fontWeight: typeScaleVars['--text-body-weight'],
    height: 'auto',
    lineHeight: typeScaleVars['--text-body-leading'],
    paddingBlock: 0,
    paddingInline: 0,
    textDecoration: {
      default: 'none',
      ':hover:where(:not(:disabled,[aria-disabled="true"]))': 'underline',
    },
  },
  // Each panel scrolls its own rows within whatever height the pane gives it,
  // so adding columns lengthens a list instead of growing the popover past the
  // viewport. The floor is the popover's own minHeight rather than a size set
  // here, which is what keeps the four tabs the same height.
  transferPanelBody: {
    flexGrow: 1,
    minBlockSize: 0,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    scrollbarGutter: 'stable',
  },
  // Padded by transferPadStart/End rather than Item's own gutter, so a row's
  // hover and selected fill runs the full width of the panel while its text
  // stays on the header's start line. The grip and the end action then pull
  // back by their own button inset (transferGrip, transferEndAction) so it is
  // the glyph that lands on the line, not the invisible button box.
  transferItem: {
    minWidth: 0,
    transitionDuration: {
      default: durationVars['--duration-fast'],
      '@media (prefers-reduced-motion: reduce)': '0s',
    },
    transitionProperty: 'background-color, opacity',
    transitionTimingFunction: easeVars['--ease-standard'],
  },
  // A keyboard pick-up has no pointer under it to say what is moving, so the
  // row itself carries the state.
  transferItemPicked: {
    backgroundColor: colorVars['--color-accent-muted'],
  },
  transferEmpty: {
    textAlign: 'center',
  },
  // A ghost IconButton insets its glyph by --spacing-1-5; cancelling that puts
  // the grip itself on the panel's start line rather than the button box.
  transferGrip: {
    marginInlineStart: `calc(-1 * ${spacingVars['--spacing-1-5']})`,
  },
  // Same cancellation at the other edge, so the row's action lands on the end
  // line that "Restore" and "Select all" sit on.
  transferEndAction: {
    marginInlineEnd: `calc(-1 * ${spacingVars['--spacing-1-5']})`,
  },
  clickableRow: {
    cursor: 'pointer',
  },
  // One step past hover in the same neutral ramp. A muted fill can't carry
  // this on its own — --color-background-muted resolves to the identical
  // value as --color-overlay-hover. Row background belongs to this state
  // alone: selection opts out of its wash so the two never compete.
  activeRow: {
    backgroundColor: colorVars['--color-overlay-pressed'],
    // A pinned cell paints an opaque background of its own, which would cover
    // the row's. Publishing the overlay is how the sticky plugin picks it up
    // and replays it, the same way TableRow does for striping and hover.
    '--table-row-overlay': colorVars['--color-overlay-pressed'],
  },
  // A flex child has no definite width for AspectRatio to derive a height
  // from, so the tile is pinned here and told not to give the width back when
  // the cell runs short.
  rowMedia: {
    backgroundColor: colorVars['--color-background-muted'],
    borderRadius: radiusVars['--radius-element'],
    flexShrink: 0,
    width: spacingVars['--spacing-12'],
  },
  detailPanel: {
    minWidth: 0,
  },
  skeletonRow: {
    // The table drops the divider under its last row, so each placeholder
    // carries its own on top — one line between every row, none trailing.
    borderBlockStartColor: colorVars['--color-border'],
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: borderVars['--border-width'],
  },
  // The table bleeds past this container to the layout edge and re-applies the
  // inset on its outer cells. Matching that keeps the two grids on one axis.
  skeletonBleed: {
    marginInline: 'calc(-1 * var(--container-padding-inline-start, 0px))',
  },
  skeletonEdgeStart: {
    paddingInlineStart: 'var(--container-padding-inline-start, 0px)',
  },
  skeletonEdgeEnd: {
    paddingInlineEnd: 'var(--container-padding-inline-end, 0px)',
  },
});

/**
 * The insertion rule the drop indicator draws. Absolute inside the row it marks
 * and pulled half its own height clear of it, so it lands in the gap between
 * two rows rather than on top of either.
 */
const reorderIndicator = {
  backgroundColor: colorVars['--color-accent'],
  borderRadius: radiusVars['--radius-full'],
  content: '""',
  height: spacingVars['--spacing-0-5'],
  insetInline: 0,
  pointerEvents: 'none' as const,
  position: 'absolute' as const,
  zIndex: 2,
};

/**
 * The drag states a reorderable row moves through, mirroring the lab package's
 * shared reorderStyles: the row being dragged fades to half, the row the
 * pointer is over grows an accent rule on the side the drop would land, and the
 * grip carries the grab cursors.
 */
export const reorderStyles = stylex.create({
  source: {
    opacity: 0.5,
    userSelect: 'none',
  },
  dropBefore: {
    position: 'relative',
    '::before': {
      ...reorderIndicator,
      insetBlockStart: `calc(-1 * ${spacingVars['--spacing-0-5']})`,
    },
  },
  dropAfter: {
    position: 'relative',
    '::after': {
      ...reorderIndicator,
      insetBlockEnd: `calc(-1 * ${spacingVars['--spacing-0-5']})`,
    },
  },
  handle: {cursor: 'grab', touchAction: 'none'},
  handleActive: {cursor: 'grabbing', touchAction: 'none'},
});

/**
 * Widths come straight from the column definitions, so a placeholder cell
 * occupies the same track as the real one whatever the reader has configured.
 */
export const skeletonCell = stylex.create({
  row: (paddingBlock: number) => ({paddingBlock}),
  fixed: (width: number, paddingInline: number) => ({
    flexGrow: 0,
    flexShrink: 0,
    paddingInline,
    width,
  }),
  flexible: (flexGrow: number, minWidth: number, paddingInline: number) => ({
    flexBasis: 0,
    flexGrow,
    minWidth,
    paddingInline,
  }),
});
