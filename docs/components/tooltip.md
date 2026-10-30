# Tooltip

Tier: **T1** (interest invokers, `popover="hint"`, anchor positioning; canon.js polyfills interest invokers)

A short text that appears next to a button or link while the pointer rests on it or it has keyboard focus. It names or briefly explains the trigger. Nothing in it can be clicked.

## Elements

| Element | Role |
|---|---|
| Trigger: `<button>` or `<a href>` | Points at the tooltip with `interestfor="<id>"` |
| Tooltip: any element (`<div>`, or `<span>` inside phrasing content) | `class="canon-tooltip"`, an `id`, `popover="hint"`, `role="tooltip"` |

```html
<button type="button" class="canon-button" data-display="icon" interestfor="tip-delete">
  <span class="canon-icon" data-icon="trash" aria-hidden="true"></span>
  <span class="canon-button-label">Delete</span>
</button>
<div class="canon-tooltip" id="tip-delete" popover="hint" role="tooltip">Delete</div>
```

- The browser shows the hint popover when interest starts (hover or focus, after a delay), hides it when interest ends, and makes the trigger its implicit anchor. Escape dismisses it. Opening one hint closes the others.
- Put the tooltip right after its trigger. It renders in the top layer, so it never affects layout and is never clipped by `overflow`.
- `popover="manual"` is allowed for tooltips that are always open (documentation, onboarding). Never `popover="auto"`: it would close on the first click elsewhere and close other popovers.
- Not allowed: `title` as a tooltip, tooltips on elements that can't receive focus (`<span>`, `<div>`, icons), tooltips on `disabled` buttons.

## Anatomy

```
canon-tooltip
├── text          required, phrasing content
└── accessory     optional · canon-kbd (keyboard shortcut, after the text)
```

- Text only. No links, buttons or inputs: nobody can reach them. That is a Popover.
- Keep it short: a name, or one sentence. Information people need to finish a task belongs on the page, not in a tooltip.
- Indicators (an arrow pointing at the trigger) are drawn by the theme.

## Two uses

| The tooltip says | Example | `aria-describedby` on the trigger |
|---|---|---|
| **The trigger's label** | Icon-only buttons: "Bold", "Settings" | No. The label is already the accessible name; a description would read it twice. |
| **More than the label** | "Archive" → "Hidden from the list, kept for 30 days" | Yes, pointing at the tooltip's id. |

Explaining why an action is unavailable is a description: use `aria-disabled="true"` (the button stays focusable and hoverable) and `aria-describedby`.

```html
<button type="button" class="canon-button" data-emphasis="high" aria-disabled="true"
        interestfor="tip-publish" aria-describedby="tip-publish">
  <span class="canon-button-label">Publish</span>
</button>
<div class="canon-tooltip" id="tip-publish" popover="hint" role="tooltip">Add a title before publishing</div>
```

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-placement` | tooltip | `block-start` · `block-end` · `inline-start` · `inline-end`; `block-start` or `block-end` followed by `inline-start` or `inline-end` | theme decides | no |
| `data-size` | tooltip or a container | `sm` · `md` · `lg` | theme decides | yes |

### `data-placement`: where it prefers to go

A hint, like `data-size`: only the author knows what a tooltip must not cover (a vertical rail wants `inline-end`, a toolbar at the bottom of the screen wants `block-start`). The first word is the side; a second one aligns it to an edge of the trigger.

| Value | Side | Aligned |
|---|---|---|
| `block-start` · `block-end` | above · below the trigger | centered |
| `block-start inline-start` · `block-end inline-start` | above · below | to the trigger's start edge |
| `block-start inline-end` · `block-end inline-end` | above · below | to the trigger's end edge |
| `inline-start` · `inline-end` | before · after the trigger in the reading direction | centered vertically |

- Logical: `inline-start` is on the left in left-to-right text and on the right in right-to-left text; `block-start` is above in horizontal text.
- It is a preference. When the tooltip doesn't fit, it flips to the other side (and alignment), then to both.

## Behavior

| Moment | What happens | Who |
|---|---|---|
| Pointer rests on the trigger, or the trigger gets focus | Shows after a delay | Browser (`interestfor`); canon.js where missing |
| Pointer moves onto the tooltip | Stays (WCAG 1.4.13: hoverable) | Browser; canon.js |
| Pointer and focus leave both | Hides after a short delay | Browser; canon.js |
| Escape | Hides | Browser; canon.js |
| Another tooltip shows | This one hides | Browser (`hint`); canon.js |
| Touch | Nothing (long-press where the browser supports it) | Browser |

- Delays belong to the theme: `interest-delay-start` and `interest-delay-end` on triggers. The canon.js polyfill uses 500 ms and 250 ms.
- canon.js's polyfill anchors the tooltip to its trigger by name (`anchor-name` / `position-anchor`) for browsers without implicit popover anchors.

## Positioning (core)

- Anchor positioning: `position-area` from `data-placement` (above and centered without it), in `self-` keywords so it follows the tooltip's own direction (the containing block is the viewport), `position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline`.
- The tooltip is an anchored container (`container-type: anchored`), so themes can follow a flip: `@container anchored(fallback: flip-block) { … }` turns an arrow around.
- **Aiming at the trigger.** The implicit anchor has no name, so a theme's arrow (a pseudo-element) can't reach the trigger on its own. Just before a tooltip opens, canon.js gives its trigger a unique `anchor-name` and sets `--canon-tooltip-anchor` on the tooltip to that name. A `position: fixed` arrow with `position-anchor: auto` (the tooltip itself) can then aim with `anchor(var(--canon-tooltip-anchor, --canon-none) center, anchor(center))` and clamp against the tooltip's own `anchor(left)` / `anchor(right)`. Without canon.js the fallback keeps it on the tooltip's center.
- A `filter` (or `transform`) on the tooltip would become the arrow's containing block and cut it off from the trigger: use `box-shadow` on the tooltip and filters on the arrow.
- Anchor positioning keeps the last placement that fit while it still fits. A tooltip that flipped near an edge stays flipped until it closes.

## Theme obligations

- Draw the gap between trigger and tooltip on the side facing the trigger (margins flip with the fallbacks).
- If the theme draws an arrow, it points at the trigger (`--canon-tooltip-anchor`), and follows the placement, the direction and the fallbacks.
- Set a maximum width; long text wraps. If the theme draws an arrow, set a minimum width too, so a one-word tooltip ("OK", "5") is never narrower than the arrow and the room it keeps from the corners.
- Show the same tooltip for hover and focus. Respect `prefers-reduced-motion` for any entry animation.
- `pointer-events` stay on: people must be able to move the pointer onto the tooltip.

## Not in the contract

| Thing | Where it goes |
|---|---|
| Interactive content, rich previews, hover cards | Popover component |
| Inverse colors ("dark tooltip on a light page") | Theme |
| Show and hide delays | Theme (`interest-delay`) |
| Animation | Theme |
| Validation errors | Field message |

## Look

**Sizes (sm / md / lg):** 12 / 14 / 16px text, 4 / 6 / 8 radius; sm by default

**Arrow:** 14 × 10 rounded tab aimed at the trigger's center, at least 8px in from the tooltip's edges; so the tooltip is at least 30px wide, and text shorter than that is centered

**Gap:** 4px

white with a zinc-200 border (dark: zinc-900, zinc-700 border), the raised shadow (0 1px 2px at 6%, 0 1px 3px at 4%)

**Motion:** it fades in (0.12s) and goes at once. Opacity only, so its arrow keeps aiming at the trigger.
