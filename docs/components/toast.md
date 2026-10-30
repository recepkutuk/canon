# Toast

Tier: **T2** (canon.js shows, times and dismisses toasts)

Short news about what just happened ("Invoice saved", "Link copied"), in a corner of the window for a few seconds, sometimes with one thing to do about it ("Undo"). It never asks for anything: what needs an answer is a [Dialog](dialog.md); what must stay until fixed is an Alert in the page.

## Elements

```html
<div class="canon-toast" data-intent="success">
  <p class="canon-toast-title">Invoice deleted</p>
  <p class="canon-toast-description">INV-2037 is in the bin for 30 days.</p>
  <div class="canon-toast-actions">
    <button type="button" class="canon-button" data-emphasis="high" data-intent="neutral" data-size="sm">…Undo…</button>
  </div>
  <button type="button" class="canon-toast-close" aria-label="Dismiss"></button>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-toast` | yes | A `<div>`. The theme draws its icon from `data-intent`. |
| `p.canon-toast-title` | yes | What happened, a short sentence. |
| `p.canon-toast-description` | no | One more line: which, where, what next. |
| `.canon-toast-actions` | no | One (at most two) Buttons or links: Undo, View, Retry. Choosing one dismisses the toast. |
| `.canon-toast-close` | — | Last, an empty `<button type="button">` named "Dismiss" (`aria-label`). canon.js adds one when it's missing (`--canon-text-dismiss`). |
| `section.canon-toaster` | — | Where toasts show. canon.js makes one at the end of the `<body>` when the page has none, named "Notifications" (`--canon-text-notifications`): a region people can jump to. Write one to place or name it yourself. |

### Showing one

- **From markup:** a Button with `command="--canon-toast"` and `commandfor` a `<template>` holding a `.canon-toast` shows a copy (so it can show again).
- **From app code** (most toasts: after the server answered):

```js
const detail = {
  intent: "success",
  title: "Invoice deleted",
  description: "INV-2037 is in the bin for 30 days.",
  emphasis: "", // or "high"
  timer: true, // show the time running out
  action: { label: "Undo", onClick: undo },
  duration: 10000, // milliseconds, or "none"
};
document.dispatchEvent(new CustomEvent("canon-toast", { detail }));
detail.toast; // the toast shown
```

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-intent` | the toast | `info` · `success` · `warning` · `danger` | none: plain news, no icon | no |
| `data-emphasis` | the toast | `medium` · `high` (solid: the rare toast that must be noticed) | medium | no |
| `data-timer` | the toast | present: show the time running out | absent | no |
| `data-duration` | the toast | milliseconds, or `none` (stays until closed) | 5000; 10000 with an action | no |
| `--canon-toaster-inset` | the toaster (a style) | a length from the window's edges | theme decides | — |

## Core

- The toaster is a `popover="manual"`, pinned to the window's bottom-end corner, toasts stacked with the newest last. It lets clicks through except on its toasts.
- A toast: the icon, the title with the description under it, the action after them (centered on the text), the close button at the end. Under 20rem the actions go under the text.

## Behavior (T2, canon.js)

- **Showing:** the toast joins the toaster, which shows over the page (again on top of a modal dialog opened since). At most three at once: a fourth sends the oldest away.
- **Timing:** it goes after its duration, timed only while it can be read. The time stops while the pointer or focus is on the toaster, and while the page is hidden; the toast is `data-paused` meanwhile, and gets its duration as `--canon-toast-duration`. Let go, it has at least a second more, unless it shows its timer (`data-timer`): then it ends exactly when the timer does.
- **Dismissing:** the close button, Escape with focus in the toast, or one of its actions. `canon-dismiss` fires on the toast first (`detail.reason`: `timeout`, `close`, `action`, `escape`, `overflow`).
- **Focus:** a toast never takes focus. If it had focus when it went, focus moves to the toast beside it, or back to the page.
- **Stacking (for themes):** canon.js gives each toast its place from the front, `--canon-toast-index` (0 the newest), and how far above the toaster's bottom it sits when the toasts are spread out, the newest highest, `--canon-toast-offset` (the heights of the older ones and the toaster's gaps); and the toaster how many there are, `--canon-toaster-count`, the front toast's height, `--canon-toaster-front-height`, and all of theirs, `--canon-toaster-height`. A theme can lay the toasts over each other with these and spread them while the pointer or focus is on the toaster. A toast's own height is measured when it comes (its place is set before it joins, so it comes in from there) and again when the window's size changes.

## Accessibility

- Each toast is announced politely as it shows: its title, then its description. A toast never interrupts.
- The toaster is a named region ("Notifications"), so keyboard and screen reader users can reach a toast while it's there. Reaching it stops the time.
- Toasts with an action stay longer (10 seconds). Never put something only in a toast that people must do or can't find elsewhere: Undo is also in the bin, a link also in the page.
- The close button is named ("Dismiss"); the icon is decoration (the title says what happened).

## Theme obligations

- A toast set apart from the page under it (a shadow, a line).
- Each intent told apart at a glance, and by shape as well as color (the icon).
- Its coming and going calm, and still with reduced motion.
- Use logical properties: in right-to-left the toaster sits at the bottom-left.
- Stacked, every toast still reachable: spread out on hover and while focus is in the toaster, so keyboard users get the whole list.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| A key to jump to the newest toast | If it comes up (the region is reachable already) |
| Progress in a toast ("Uploading 3 of 8") | Meter / Progress, if it comes up |
| Toasts at another corner | A theme's `.canon-toaster` position |
| Messages that must stay until something is fixed | Alert, Banner |

## Look

**Sizes:** The toaster 16px from the corner, at most 384px wide; toasts 8px apart when spread, 12px inside (the close button 8px in; with `data-timer`, 24px at the bottom, so an action's button stays 12px clear of the timer's line); icons 20px; text 14px on 20px lines.

**Stacked:** the newest in front, lifted so up to two older ones peek out under it, each 12px lower, 5% smaller and 25% fainter (75%, then 50%), cut to the front one's height with their content and intent bar hidden. While the pointer or focus is on the toaster they spread out into a column, the newest at the top, 8px apart, the toaster taking their height so moving between them keeps them open. Moving 0.35s, fast then settling; a new toast rises 8px into its place (0.2s); a toast going fades and shrinks to 96% (0.2s) while the others take its place. With reduced motion nothing moves: a toast just appears, and going it only fades (0.15s).

A Menu's panel. White (dark zinc-800), 12px corners, no frame: a hairline edge (black at 12%, dark white at 12%) and the floating shadow. With an intent, a shadow 4px out at its start in the intent's 500 (dark 400), its own edge untouched, so toasts tell apart at a glance. Icons in the intent's color: info blue-600 (a circle with i), success green-600 (a check), warning amber-500 (a triangle), danger red-600 (a circle with !); the 400s in dark. Title medium zinc-900 (dark white); description zinc-500 (dark zinc-400); actions small high neutral Buttons (`data-emphasis="high" data-intent="neutral"`), 12px after the text. `data-emphasis="high"`: solid in the intent's 600 (warning amber-400 with amber-950 text), white text and icon, the description at 80%, the close button in its colors, actions the inverse (filled in its text color); no intent, inverted (zinc-900 with white text; dark the reverse). `data-timer`: a 2px line 4px above the bottom and 12px in from the sides, on a zinc-200 track (dark zinc-700) like the password strength meter's, running out with the time, in the intent's color (no intent zinc-400; high emphasis its text, on a 25% track), stopping while held; it tells the time, so it stays with reduced motion.
