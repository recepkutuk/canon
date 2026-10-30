# Pagination

Tier: **T0** (written links) · drawn from a page count, fitting, rows per page and jump in place are **T2** (canon.js)

Moving through a long list a page at a time: numbered pages, a compact "Page 2 of 30", or a table footer with rows per page. For feeds, [Load more](#load-more) is in this spec too.

## Elements

```html
<nav class="canon-pagination" aria-label="Pagination">
  <ol>
    <li><a class="canon-pagination-prev" href="?page=1" rel="prev">
      <span class="canon-icon" data-icon="chevron-left" aria-hidden="true"></span>
      <span class="canon-pagination-label">Previous</span>
    </a></li>
    <li><a href="?page=1" aria-label="Page 1">1</a></li>
    <li><a href="?page=2" aria-label="Page 2" aria-current="page">2</a></li>
    <li><a href="?page=3" aria-label="Page 3">3</a></li>
    <li class="canon-pagination-gap">…</li>
    <li><a href="?page=30" aria-label="Page 30">30</a></li>
    <li><a class="canon-pagination-next" href="?page=3" rel="next">
      <span class="canon-pagination-label">Next</span>
      <span class="canon-icon" data-icon="chevron-right" aria-hidden="true"></span>
    </a></li>
  </ol>
</nav>
```

| Element | Required | Notes |
|---|---|---|
| `nav.canon-pagination` | yes | Named "Pagination" (`aria-label`, in the page's language): a navigation landmark. |
| `<ol>` | yes | The controls in order, each in an `<li>`. Drawn by canon.js with `data-pages` (below). |
| A page | yes | `<a href>` (or a `<button type="button">` in an app), its number as text, `aria-label` "Page 3" recommended. The current page `aria-current="page"`. |
| `.canon-pagination-prev`, `.canon-pagination-next` | yes | A link (`rel="prev"` / `rel="next"`) with an icon (`chevron-left`, `chevron-right`) and its words in `.canon-pagination-label`. The icon goes on the outer side: before "Previous", after "Next". |
| `.canon-pagination-first`, `.canon-pagination-last` | no | The same, to the ends of the list (`chevrons-left`, `chevrons-right`), outside Previous and Next. |
| `.canon-pagination-gap` | no | An `<li>` where pages are left out ("…"). Not a control. |
| `.canon-pagination-current` | no | "Page 2 of 30" between the arrows, in place of the pages (compact). |
| `.canon-pagination-summary` | no | Before the list: "1–10 of 300". |
| `.canon-pagination-size` | no | Before the list: a `<label>` and a [Select](select.md) of rows per page. |
| `.canon-pagination-jump` | no | After the list: a `<form>` with a `<label>` ("Go to page") and a [Text Input](text-input.md) `type="number"` named `page`. |

- **Nowhere to go:** on the first page, Previous (and First) is a link without `href`, `aria-disabled="true"` (a disabled `<button>` in an app); on the last page, Next and Last. They stay, so the row doesn't move.
- **Which pages to show** is the author's when writing them: the first and last, a few around the current one, gaps between. canon.js draws the same with `data-pages`.
- **Table footer:** a summary or rows-per-page select before the list sends the list to the far end of the row; the row wraps when narrow.
- **Not tabs, not steps:** pages are the same list cut in parts. Views of different content are Tabs; a sequence to complete is Steps.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-pages` | the pagination | the page count: canon.js draws the list | — | no |
| `data-total`, `data-per-page` | the pagination | rows in all, rows per page: canon.js counts the pages and writes the summary | —, 10 | no |
| `data-page` | the pagination | the current page | 1 | no |
| `data-siblings` | the pagination | pages shown on each side of the current one | 1 | no |
| `data-ends` | the pagination | (present) First and Last | — | no |
| `data-href` | the pagination | a link pattern, `{page}` and `{per-page}` filled in (`?page={page}`) | absent: buttons | no |
| `data-layout` | the pagination | `compact`: "Page 2 of 30" always | — | no |
| `data-display` | the pagination, an arrow or a container | `icon`: arrows only · `label`: their words too | theme decides | yes |
| `data-size` | the pagination or a container | `sm` · `md` · `lg` | theme decides | yes |

## Behavior

**T0:** links. The jump form is a plain `GET` form: Enter sends `?page=12` to the page's address (the browser checks `min` and `max`).

**canon.js (T2), with `data-pages` or `data-total`:**

- **Draws the list:** First (with `data-ends`), Previous, the first and last pages, `data-siblings` pages around the current one, gaps, Next, Last. Always `siblings × 2 + 5` pages and gaps (or all the pages when there are fewer), so the arrows don't move from page to page. Numbers in the page's language: page numbers without thousands separators (page 12480, a name), counts of rows with them ("9,871–9,880 of 124,800"); arrows named "Previous", "Next", "First page", "Last page", pages "Page 3" (strings `pagination-*`).
- **Fits:** when the list doesn't fit on one row, fewer pages around the current one, then "Page 2 of 30". Again on each resize.
- **Links or buttons:** with `data-href` the pages are links to the pattern. Without it they are buttons: a press fires **`canon-page`** on the pagination (`detail: { page, perPage }`, bubbling, cancelable); unless cancelled, `data-page` changes and the list is drawn again. The app shows that page's rows. Focus stays on the control pressed (on the current page when it can go no further), and the new page is announced ("Page 3 of 30", or the summary).
- **The app moves it** by setting `data-page` (or `data-pages`, `data-total`, `data-per-page`); the list follows.
- **Summary:** with `data-total`, canon.js writes "1–10 of 300" into `.canon-pagination-summary`.
- **Rows per page:** a change to the select sets `data-per-page` (through `canon-page`, or the link pattern's `{per-page}`), keeping the first row shown in view (from page 3 of 10 rows, rows 21–30, to page 1 of 25).
- **Jump:** the form goes to the page (through `canon-page` or the link pattern); canon.js sets the field's `min` and `max`, so a page out of range gets the browser's message.

## Load more

```html
<ul>…the first 20 results…</ul>
<div class="canon-load-more" data-shown="20" data-total="300">
  <p class="canon-load-more-status">Showing 20 of 300</p>
  <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral"><span class="canon-button-label">Load more</span></button>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-load-more` | yes | Under the list it adds to. |
| `.canon-load-more-status` | no | How many are shown. With `data-shown` and `data-total`, canon.js writes it ("Showing 20 of 300", string `load-more-status`) and makes it a polite status. |
| A [Button](button.md) | yes | `<button type="button">`; or, without canon.js, a link to the next page (`<a class="canon-button" href="?page=2">`). |

| Attribute | On | Values | Default |
|---|---|---|---|
| `data-shown`, `data-total` | the box | numbers | — |
| `data-auto` | the box | (present) load on scrolling near the button | — |

**canon.js (T2):**

- A press fires **`canon-load-more`** on the box (bubbling) and makes the button busy (`aria-busy`, `aria-disabled`: Button's loading state).
- The app adds the rows, then sets `data-shown`: the button is ready again, the status updates. At `data-total` the button goes (focus on it moves to the status). On failure the app removes `aria-busy` and `aria-disabled` itself.
- **`data-auto`** (infinite scroll): the button loads by itself as it comes within 400px of view, and again while the list is still too short to push it away. The button stays: the way in for keyboards, and what a screen reader finds.
- A link is left to the browser.

## States

| State | Hook |
|---|---|
| Current page | `aria-current="page"` |
| Nowhere to go | `a:not([href])` (`aria-disabled="true"`), `button:disabled` |
| Focus | `:focus-visible` |
| Loading more | `aria-busy="true"` on the Button |

## Core

- The nav: a wrapping flex row. The list: a wrapping flex row, no markers or indent; after a summary or select it takes `margin-inline-start: auto`. Pages and arrows: inline flex, at least the control's height square, tabular figures, link and button styles reset. The arrows' icons mirror in right-to-left.
- Load more: a centered column.

## Accessibility

- A `<nav>` named "Pagination" around a list: screen readers hear the landmark and how many items.
- The current page is `aria-current="page"`; pages named "Page 3", arrows by their words (visually hidden with `data-display="icon"`).
- Arrows with nowhere to go stay, unavailable, so the layout and the reading order don't change; gaps are text, not controls.
- Buttons keep focus where it was and announce the new page; content changes are the app's to manage.
- Load more keeps a button even with `data-auto`, and announces the new count.

## Theme obligations

- The current page distinguishable from the other pages without color alone; a visible focus ring; unavailable arrows visibly so.
- Arrows pointing the reading direction.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| A gap that opens a jump field or the pages it hides | If it comes up (Breadcrumb's "more" menu is the model) |
| Cursor paging (no total: Previous and Next only) | Written today (two arrows); a drawn variant if it comes up |
| Updating the address in a button app (`history.pushState`) | The app's (on `canon-page`) |
| Dots for a carousel | Carousel |

## Look

**Sizes (sm / md / lg):** Squares 32 / 40 / 48 (wider for long numbers), 8px apart; Button's type (12 / 14 / 16px medium) and corners (4 / 8 / 12); icons 16 / 20 / 24. The summary, select and jump field 16px from the list. Load more: the status a field step (12 / 16 / 20) above the Button.

Numbers zinc-900 (dark white), arrows zinc-500 (dark zinc-300), the gap Lucide ellipsis in zinc-400; the current page framed zinc-200 (dark zinc-700), no fill. Arrows icons only by default. Hover zinc-100 (dark zinc-800), pressed zinc-200 (dark zinc-700), focus Button's ring; unavailable arrows zinc-300 (dark zinc-600); "Page 2 of 30" Text Input's type in zinc-900; the summary and the labels zinc-500 (dark zinc-400); First and Last Lucide chevrons-left / chevrons-right; the jump field as wide as its number, centered, without spin buttons.
