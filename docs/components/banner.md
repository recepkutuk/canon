# Banner

Tier: **T0** (a strip at the top) · staying in view over an App Shell and dismissing are **T2** (canon.js)

A message about the whole app, not one page: "Maintenance tonight, 22:00–23:00", "Viewing as Ana Duarte", "The last payment failed". It sits across the top, above the [App Shell](app-shell.md), the same on every page, while it's true.

## Elements

```html
<body>
  <div class="canon-banner" data-intent="warning">
    <p class="canon-banner-title">Maintenance tonight, 22:00–23:00</p>
    <p class="canon-banner-description">Invoices can't be sent during that hour.</p>
    <div class="canon-banner-actions">
      <a class="canon-link" href="/status">Details</a>
    </div>
    <button type="button" class="canon-banner-close"></button>
  </div>
  <div class="canon-app-shell">…</div>
</body>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-banner` | yes | A `<div>`, first in what holds the app (the `<body>`, before the App Shell): it runs across the top and is read first. The theme draws its icon from `data-intent`. |
| `p.canon-banner-title` | one of the two | What's true, a few words. |
| `p.canon-banner-description` | one of the two | One more sentence, beside the title (under it when narrow). |
| `.canon-banner-actions` | no | One or two small [Buttons](button.md) or [Links](link.md), at the end: Details, Update the card, Stop viewing. |
| `.canon-banner-close` | no | Last, an empty `<button type="button">`: the theme draws the X, canon.js names it ("Dismiss"). Only for news that can be put away; a banner about a state (read-only, viewing as someone) stays while the state does. |

- **Banner, Alert or Toast?** A Banner is about the whole app and is on every page. An [Alert](alert.md) is about a part of this page. A [Toast](toast.md) is news about what just happened, and goes by itself. If it would make sense on only one page, it's an Alert.
- **Several:** they stack, the most important first. Two at most: three banners say something else is wrong.
- **Short:** a banner takes room from every page. One line where it fits; the details behind a Link.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-intent` | the banner | `info` · `success` · `warning` · `danger` | none: plain news, no icon | no |
| `data-emphasis` | the banner | `medium` · `high` (solid: it must not be missed) | medium | no |
| `role` | the banner | `alert` · `status`, only for one shown while the page is open | none | no |
| `hidden` | the banner | present once dismissed (canon.js) | absent | no |
| `data-state` | the banner | `opening` (shown while the page is open) · `closing` (dismissed): while its animations run (canon.js) | absent | no |
| `--canon-banners-height` | their parent (canon.js) | the banners' height, which the App Shell's sticky parts start under | `0px` | yes (CSS) |

## Core

- One line that wraps: the icon, the title, the description beside it, the actions and the close button at the end.
- The icon is named for screen readers with the intent's word ("Warning:"), as Alert's is.
- `hidden` hides it. Without scripting the close button isn't shown.

## Behavior (T2, canon.js)

- **Staying in view:** canon.js marks the banners' parent `data-canon-banners` and measures them. Each sticks to the top of the window under the ones before it; their height (`--canon-banners-height` on the parent) moves the App Shell's sidebar, Top Bar and sticky parts (a sticky [Page Header](page-header.md)) under them, the sidebar as tall as the room left. Measured again when a banner changes size, is dismissed, comes or goes.
- **Dismissing:** as [Alert](alert.md)'s: the close button fires `canon-dismiss` (cancelable), then hides the banner after its closing animations (`data-state="closing"`); focus moves on; the shell moves back up with it. Remembering it across pages is the app's (`canon-dismiss`, then no banner in its markup). One shown while the page is open (unhidden, or put in with a `role`) opens its room first (`data-state="opening"`).
- **Without canon.js** banners scroll away with the page, and the App Shell sticks at the top as it does without them.

## Accessibility

- **There from the start** (almost always: the app puts it in every page): no `role`. First in the page, it's read first, with its intent's word.
- **Shown while the page is open** (the session is about to expire): `role="alert"` when it needs attention now, `role="status"` otherwise.
- The intent is in words as well as color and icon; the close button is named ("Dismiss").

## Theme obligations

- Across the top, set apart from the app under it (a fill, a line).
- Each intent told apart by shape as well as color (the icon).
- Use logical properties: in right-to-left the icon is on the right, the actions and the close button on the left.
- Coming and going without a jump: the app under it moves with it. Calmer with reduced motion.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Remembering a dismissal | The app (`canon-dismiss`, then no banner in its markup) |
| A banner at the bottom of the window | If it comes up |
| Several messages behind one banner ("1 of 3") | If it comes up |
| Messages about one page | [Alert](alert.md) |

## Look

**Sizes:** at least 40px tall, 8px above and below; the shell's side inset (+4px) at the sides, the close button 8px from the end; 12px between the parts; icons 20px; text 14px on 20px lines.

A strip across the top, no corners, a line under it. No intent: zinc-100 (dark zinc-900) with a hairline rule (black at 10%, dark white at 10%). With an intent, tinted: the intent's 50 (dark its 950, 70% over the page) with its 200 line (dark 900), and its icon as Alert's (info blue-600, success green-600, warning amber-500, danger red-600; the 400s in dark). Title medium in the text's color; description zinc-600 (dark zinc-300); actions small high neutral Buttons (`data-emphasis="high" data-intent="neutral"`) or Links; on a solid banner an action is the inverse, filled in its text color. `data-emphasis="high"`: Alert's solid fill (the intent's 600, warning amber-400 with amber-950 text; no intent, inverted), white text and icon, the description at 80%. Forced colors: the icon and the X in the text's color.

**Motion:** as Alert's: dismissed, it fades out (0.15s), then closes (0.2s); shown while the page is open, it opens (0.2s), then fades in (0.15s); the shell follows it. With reduced motion it only fades.
