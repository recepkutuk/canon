# Spinner

Tier: **T0** (the browser's `<progress>`: no JavaScript)

Something is working, and how long it will take isn't known: a panel waiting for an answer, a "Loading more…" row, "Checking availability…" beside a field. Shown only if the wait lasts: it appears after 0.4s.

## Elements

```html
<!-- Alone: named by aria-label -->
<progress class="canon-spinner" aria-label="Loading invoices"></progress>

<!-- With words: a label around it names it -->
<label class="canon-spinner-label">
  <progress class="canon-spinner"></progress>
  Loading invoices…
</label>
```

| Element | Required | Notes |
|---|---|---|
| `progress.canon-spinner` | yes | No `value`, no `max`: a progress whose amount is unknown, which screen readers announce as busy. Named by what's loading: `aria-label`, or the words of the label around it. |
| `label.canon-spinner-label` | no | Around the spinner, the spinner first, then the words ("Loading invoices…"): they show and name it. Use words where the spinner stands alone in a space (a panel); inline, beside text that says it already, the spinner alone does. |

- **Which loading signal?** A Button running its action: the Button's own `aria-busy="true"`. The shape of what's coming is known (a list, a profile): [Skeleton](skeleton.md). How much is done is known ("3 of 8 uploaded"): Progress. Nothing known but that it's working: a Spinner.
- **The region that's loading** says so: `aria-busy="true"` on it while it loads (as with Skeleton), and the spinner goes when the content comes.
- **Not for waits that end at once:** it appears only after 0.4s, so a quick answer never flashes it. `data-delay="none"` shows it at once (a wait known to be long).

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `aria-label` | the spinner | what's loading ("Loading invoices") | — (required without words) | no |
| `data-delay` | the spinner, its label or a container | `none`: shown at once | absent: after 0.4s | yes |
| `data-size` | the spinner, its label or a container | `sm` · `md` · `lg` | the text's size | yes |

## Core

- The browser's bar is cleared; the theme draws on the element. It's the text's size (1em), on its line.
- The label lines the spinner and its words up, half the text's size apart.
- It appears 0.4s after it's put in the page or shown (`@starting-style`); `data-delay="none"` shows it at once.

## Behavior (T0, the browser)

- No JavaScript: the spinner turns while it's in the page; the app puts it in, or takes it out (or `hidden`), as loading starts and ends.

## Accessibility

- A `<progress>` without a value is announced as busy, with its name: "Loading invoices, busy".
- The region that's loading carries `aria-busy="true"`; when the content arrives, it goes, with the spinner.
- With reduced motion it turns three times slower: it still says it's working.

## Theme obligations

- Visibly moving (it says "still working"), and calmer with reduced motion, never still.
- In forced colors, it still shows.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| A known amount done | Progress |
| A full-page loading screen | If it comes up: a large spinner with words, centered in the page |
| A spinner over content (a dimmed overlay) | If it comes up |

## Look

**Sizes:** the text's size (1em) unless a `data-size` sets it: 16 / 20 / 32px (sm / md / lg), its words 13 / 14 / 16px on 20 / 20 / 24px lines; half the words' size between them.

Button's loading ring: Lucide's loader-circle (a 300° arc) over the same circle at 20%, turning once every 0.8s (2.4s with reduced motion), in zinc-500 (dark zinc-400). Its words beside it in the same color. A Button's `aria-busy` indicator is the same ring. Forced colors: the ring in the text's color.
