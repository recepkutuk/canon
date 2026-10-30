# Alert

Tier: **T0** · dismissing is **T2** (canon.js)

A message in the page that stays while it's true: "This invoice is overdue", "2 fields need attention", "Changes apply to new invoices only". It sits with what it's about, in the flow of the page, and goes when the thing it reports is fixed, or when someone dismisses it.

## Elements

```html
<div class="canon-alert" data-intent="warning">
  <p class="canon-alert-title">This invoice is overdue</p>
  <p class="canon-alert-description">It was due on 3 October. Globex hasn't paid yet.</p>
  <div class="canon-alert-actions">
    <button type="button" class="canon-button" data-emphasis="high" data-intent="neutral" data-size="sm">…Send reminder…</button>
  </div>
  <button type="button" class="canon-alert-close"></button>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-alert` | yes | A `<div>`. The theme draws its icon from `data-intent`. |
| `.canon-alert-title` | one of the two | What's true, a short sentence. A `<p>`, or a heading (`h2`–`h6`) when the alert heads a part of the page (an error summary). |
| `.canon-alert-description` | one of the two | More: why, what next. A `<p>`, or a `<div>` holding paragraphs or a list (an error summary's links to its fields). An alert can be only a description: one sentence, no title. |
| `.canon-alert-actions` | no | [Buttons](button.md) or [Links](link.md) that deal with it: Send reminder, Retry, Review. |
| `.canon-alert-close` | no | Last, an empty `<button type="button">`: the theme draws the X, canon.js names it ("Dismiss", `--canon-text-dismiss`). Only for alerts that can be put away without fixing anything (a tip, news); one that reports a problem stays until the problem goes. |

- **Alert, Toast or Banner?** An Alert is about a part of this page and stays while it's true. A [Toast](toast.md) is news about what just happened, and goes by itself. A Banner is about the whole app (maintenance tonight, a trial ending) and sits above every page.
- **A callout** (a note in a settings page: "Changes apply to new invoices only") is an Alert with `data-intent="info"`, or none.
- **Placement:** right before what it's about: above the form it summarizes, at the top of the record it describes, inside the Card or Section it belongs to.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-intent` | the alert | `info` · `success` · `warning` · `danger` | none: a plain note, no icon | no |
| `data-emphasis` | the alert | `medium` · `high` (solid: it must not be missed) | medium | no |
| `role` | the alert | `alert` · `status`, only for one shown while the page is open (see Accessibility) | none | no |
| `hidden` | the alert | present once dismissed (canon.js), or before the app shows it | absent | no |
| `data-state` | the alert | `opening` (shown while the page is open) · `closing` (dismissed): while its animations run (canon.js) | absent | no |

## Core

- The icon, then the title with the description under it, the actions after them (centered on the text), the close button at the end. Under 20rem the actions go under the text, so long labels don't squeeze it. A part that isn't there leaves its column empty: no intent, no icon; no close button, nothing at the end.
- **Actions are small high neutral Buttons** (`data-emphasis="high" data-intent="neutral" data-size="sm"`), or Links. One is best; two at most.
- The icon is named for screen readers with the intent's word: "Information:", "Success:", "Warning:", "Error:" (`--canon-text-intent-*`, translated in `i18n/`), so the intent isn't told by color and shape alone.
- `hidden` hides it.
- Without scripting the close button isn't shown (it couldn't work).

## Behavior (T2, canon.js)

- **Dismissing:** the close button fires `canon-dismiss` on the alert (`detail.reason: "close"`), then closes its room (`data-state="closing"` while the theme's animations run) and hides it (`hidden`). The event is cancelable: an app that removes the alert itself, or remembers it was dismissed, calls `preventDefault()`.
- **Focus:** if focus was in the alert, it moves to the next thing in the page (or the one before), never lost.
- **Showing one later** is the app's: insert the alert with a `role` (see Accessibility), or remove its `hidden`. canon.js opens its room (`data-state="opening"` while the theme's animations run); one there from the start (no `role`) just appears with the page.

## Accessibility

- **There from the start** (part of the page as it loads): no `role`. It's read in its place, with its intent's word first.
- **Shown while the page is open** (after a submit, when a save fails): `role="alert"` when it needs attention now (warning, danger), `role="status"` otherwise. Insert it with its text, or unhide it; screen readers announce it once.
- **An error summary** after a submit that failed: a `danger` alert with a heading as its title and links to each field in its description; move focus to it (`tabindex="-1"` on the alert) so people start there. Each field still has its own message ([Field](field.md)).
- The intent is in words as well as color and icon. The title should still say what's wrong, not just "Error".
- The close button is named ("Dismiss").

## Theme obligations

- Set apart from the page around it, without looking like something over it (no shadow).
- Each intent told apart at a glance, and by shape as well as color (the icon).
- In forced colors, the intent still shows by shape.
- Use logical properties: in right-to-left the icon and the intent's mark are on the right.
- Coming and going without a jump: what's under it moves to make or give back room, not all at once. Calmer with reduced motion.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Remembering a dismissal across visits | The app (`canon-dismiss`, then `hidden` in its markup) |
| Alerts about the whole app | Banner |
| News that goes by itself | [Toast](toast.md) |

## Look

**Sizes:** 12px inside (the close button 8px in); icons 20px; text 14px on 20px lines; actions 12px after the text, centered on it, 8px apart (under 20rem, 8px under the text).

A [Toast](toast.md)'s look, in the page. The Card's surface (white, dark zinc-900) and a hairline edge (black at 12%, dark white at 12%), 12px corners, no shadow: it's part of the page. With an intent, a shadow 4px out at its start in the intent's 500 (dark 400), its own edge untouched, and the intent's icon: info blue-600 (a circle with i), success green-600 (a check), warning amber-500 (a triangle), danger red-600 (a circle with !); the 400s in dark. Title medium zinc-900 (dark white); description zinc-500 (dark zinc-400). `data-emphasis="high"`: Toast's solid fill, in the intent's 600 (warning amber-400 with amber-950 text), white text and icon, the description at 80%; no intent, inverted. Forced colors: the line 4px thick at the start, the icon in the text's color.

**Motion:** dismissed, it fades out (0.15s), then its room closes (0.2s) and what's under it moves up; shown while the page is open, its room opens (0.2s), then it fades in (0.15s). In a column of them, the gap goes and comes with it. With reduced motion it only fades.
