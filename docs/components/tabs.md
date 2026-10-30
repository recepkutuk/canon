# Tabs

Tier: **T0** (links) · in-page tabs and folding are **T2** (canon.js)

The parts of one page or record, one shown at a time: a record's Overview, Payments and Activity; a settings page's General, Billing and Members. Under a [Page Header](page-header.md), in the page.

## Elements

In-page, a tablist and its panels:

```html
<div class="canon-tabs">
  <div class="canon-tabs-list" role="tablist" aria-label="Invoice INV-2041">
    <button type="button" class="canon-tab" role="tab" id="tab-overview" aria-controls="overview" aria-selected="true">
      <span class="canon-tab-label">Overview</span>
    </button>
    <button type="button" class="canon-tab" role="tab" id="tab-activity" aria-controls="activity" aria-selected="false" tabindex="-1">
      <span class="canon-icon" data-icon="list" aria-hidden="true"></span>
      <span class="canon-tab-label">Activity</span>
      <span class="canon-count">14<span class="canon-visually-hidden"> new</span></span>
    </button>
  </div>
  <div class="canon-tabs-panel" role="tabpanel" id="overview" aria-labelledby="tab-overview" tabindex="0">…</div>
  <div class="canon-tabs-panel" role="tabpanel" id="activity" aria-labelledby="tab-activity" tabindex="0" hidden>…</div>
</div>
```

Links, each part its own page:

```html
<nav class="canon-tabs-list" aria-label="Invoice INV-2041">
  <a class="canon-tab" href="/invoices/2041"><span class="canon-tab-label">Overview</span></a>
  <a class="canon-tab" href="/invoices/2041/activity" aria-current="page"><span class="canon-tab-label">Activity</span></a>
</nav>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-tabs` | in-page | Around the strip (first) and its panels. |
| `.canon-tabs-list` | yes | The strip, named (`aria-label` or `aria-labelledby`): `role="tablist"` in-page, a `<nav>` for links. Two or more tabs, its only children. |
| `.canon-tab` | yes | In-page: a `<button type="button" role="tab">` with an `id`, `aria-controls` its panel and `aria-selected`; the chosen one `aria-selected="true"`, the others `tabindex="-1"`. Links: an `<a href>`, the current one `aria-current="page"`, no tab roles. |
| `.canon-icon` | no | Before the text, `aria-hidden="true"`. |
| `.canon-tab-label` | yes | The tab's text, also when only the icon shows (it stays as the tab's name). |
| [Count](count.md) | no | After the text: how many in that part, with what it counts visually hidden ("14 new"). |
| `.canon-tabs-panel` | in-page | One per tab: `role="tabpanel"`, its `id`, `aria-labelledby` its tab, `tabindex="0"`; all but the chosen one `hidden`. |

- **In-page or links?** Links when each part has its own address (it can be bookmarked, shared, reloaded) or loads separately. In-page when the parts are already on the page and switching is instant.
- **Not a Segmented Control:** both are "one of these", but a Segmented Control sets a value (a form value, the same content seen differently), while Tabs show a different part. In Canon they share the raised card on a track; Tabs are told apart by what they carry (icons, counts) and where they sit (heading a page's parts).
- **Not a Nav List:** Tabs are the parts of one thing; the app's places are its [Sidebar](sidebar.md).

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-fill` | the strip | present: the tabs share its width equally | absent: each as wide as its text, from the start | no |
| `data-size` | the strip or a container | `sm` · `md` · `lg` | theme decides | yes |
| `data-display` | the strip or a container | `icon`: the text hidden, square tabs | theme decides | yes |
| `aria-disabled` | an in-page tab | `true`: not available yet, still announced | — | — |

## Core

- The strip is one row that never wraps, at most its place's width (a theme may draw it as wide as its tabs); the tabs are as wide as their text (`data-fill`: the strip's full width, the tabs equal, cutting their text with … when narrow).
- Without JavaScript, in-page tabs can't switch: the strip doesn't show and every panel does, one after the other. Links work as links.

## Behavior (T2, canon.js)

- **Choosing (in-page):** a click, or the arrow keys moving and choosing at once (Left and Right, mirrored in right-to-left; Home and End to the ends; wrapping; skipping `aria-disabled` tabs). The chosen tab is the strip's one Tab stop; Tab goes on to its panel. Its panel shows, the others are `hidden`; canon.js makes them `hidden="until-found"` where the browser has it, so find in page reaches their text and chooses the tab it's in. `canon-tab` fires on `.canon-tabs` (`detail.tab`, `detail.panel`), for an app that loads a part when it's first shown.
- **Folding:** tabs that don't fit go into a **More** menu at the strip's end, from the last, one at a time; the current tab never folds. Choosing one from the menu shows it (it takes a place in the strip, another folding instead) and focuses it; for links, the menu's items are the links. One at a time rather than all at once, so as many parts as fit stay one click away. The More button is in the `<nav>` for links; beside the tablist for in-page tabs (a tablist may only hold tabs), over the strip's end, which keeps room for it (`--canon-tabs-more-size`).
- Folded tabs get `data-folded`, the strip `data-fold`.

## Accessibility

- In-page: heard as "Activity, tab, 3 of 5, selected", then the panel, named by its tab. The arrows move between tabs; Tab goes to the panel.
- Links: a named navigation landmark; the current part heard as "current page".
- A Count reads with its tab ("Activity, 14 new").
- Folded, every tab keeps its name, as an item of the More menu ("More", `--canon-text-more`).
- A disabled tab stays in the strip and is announced as unavailable; it is skipped by the arrows.

## Theme obligations

- The current tab unmistakable, by more than color; hover clearly weaker.
- Focus visible on the tab, over its neighbours; on a panel too.
- In forced colors, the current tab still shows.
- Use logical properties: in right-to-left the tabs run from the right.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| The chosen tab in the address (`#activity`) | The app, on `canon-tab`; or links |
| Vertical tabs | If it comes up (a Nav List may fit better) |
| Closing or reordering tabs | Not for parts of one thing |

## Look

**Sizes (sm / md / lg):** The strip 32 / 40 / 48 tall with 3px inside and 2px between tabs, its corners Button's plus 2px (6 / 10 / 14); tabs 26 / 34 / 42, corners 3px tighter, padded 8 / 10 / 12, set as a button (12 / 14 / 16px medium); icon, text and count 6px apart; icon only, square. The panel 12 / 16 / 20 under the strip.

A raised card on a track: a zinc-100 strip (dark zinc-800) as wide as its tabs (the full width with `data-fill`, and while tabs fold into More, so More sits at its end). Tabs zinc-500 (dark zinc-400); hover darkens the text to zinc-950 (dark white), pressing adds zinc-200 at 60% (dark zinc-700 at 60%). The current tab a white card (dark zinc-700) lifted by a ring of black at 6% (dark white at 6%) and a soft shadow, zinc-950 (dark white). A Count in a tab is neutral: zinc-200 with zinc-600 text (dark zinc-700, zinc-300), on the current tab zinc-900 with white (dark the reverse). Disabled zinc-400 (dark zinc-600). The More button one more tab at the end, with a chevron. The current card is drawn once by the strip and anchored to the current tab, so it glides to the tab chosen (0.3s, fast then settling; none with reduced motion); without anchor positioning, and in forced colors, each tab draws its own. Focus: the button's ring. Forced colors: the current tab in Highlight.
