# Page Header

Tier: **T0** · folding when narrow and renaming in place are **T2** (canon.js)

The top of a page: what it is, what state it's in, and what you can do here. It sits at the top of the page's `<main>`, under the [Top Bar](top-bar.md). What stays the same on every page goes in the bar; what belongs to this page goes here.

## Elements

```html
<main>
  <header class="canon-page-header">
    <a class="canon-page-header-back" href="/invoices">
      <span class="canon-icon" data-icon="chevron-left" aria-hidden="true"></span>Invoices
    </a>
    <div class="canon-page-header-title">
      <h1 id="title">INV-2041</h1>
      <span class="canon-tag" data-intent="warning"><span class="canon-tag-label">Overdue</span></span>
      <button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon"
              commandfor="title" command="--canon-edit">
        <span class="canon-icon" data-icon="pencil" aria-hidden="true"></span>
        <span class="canon-button-label">Rename</span>
      </button>
    </div>
    <p class="canon-page-header-description">Globex Corporation · Due 3 October · €12,400</p>
    <div class="canon-page-header-actions">
      <button type="button" class="canon-button" data-intent="neutral">…Download…</button>
      <button type="button" class="canon-button" data-emphasis="high">…Send reminder…</button>
    </div>
  </header>
  …
</main>
```

| Element | Required | Notes |
|---|---|---|
| `header.canon-page-header` | yes | A `<header>` inside `<main>` (so not a banner landmark). |
| `a.canon-page-header-back` | no | First: one step up ("Invoices"), its icon decorative. |
| [Breadcrumb](breadcrumb.md) | no | First, instead of the back link, when the trail is deeper. Where people are is the page's: a Breadcrumb goes here, not in the Top Bar. |
| `.canon-page-header-title` | no | One heading (`<h1>` on a page; another level where the header heads a part of one), then optional status ([Tag](tag.md)s) and a rename Button. |
| `p.canon-page-header-description` | no | One line of facts: who, when, how much. More facts go in a [Description List](description-list.md) under the header. |
| `.canon-page-header-actions` | no | [Buttons](button.md) (also Split Buttons, Button Groups, and the Menus they open): what you can do to this page or record. Neutral by default; at most one primary (`data-emphasis="high"`), last, and only when one action is what the page is for. A view only to read (a log, a report) has none, or no actions at all. |

- **Two pages, one header.** A collection's page has the collection as its title ("Invoices"), a line of facts, and its actions ("New invoice"; a list only to read, like an audit log, may have just "Export", or nothing). A record's page has the record as its title ("INV-2041"), a back link or a trail, its status, and what you can do to it. Same parts, different choices.
- **The title is optional.** Some pages need no visible title, like a dashboard named by its sidebar link. Keep one for screen readers anyway: a visually hidden `<h1 class="canon-visually-hidden">` in the title, so people can still find where the page starts.
- **Tabs** for the page's parts go right under the header, in the page, not in the header.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-sticky` | the header | present | absent | no |
| `data-size` | the header or a container | `sm` · `md` · `lg` | theme decides | yes |
| `--canon-sticky-offset` | a container (a style) | a length: where sticky things in the page start | `0`; an App Shell's theme sets it to its Top Bar's height | yes (CSS) |
| `--canon-page-inset` | a container (a style) | a length: the page's side padding | `0` | yes (CSS) |

## Core

- A grid: the back link or trail over the title, the actions beside the title, the description under both. Under 24rem of its own width (a container query), the actions go under it all.
- The title's parts wrap; a long title wraps too, and is never cut.
- **Sticky** (`data-sticky`): it sticks under `--canon-sticky-offset`, with the back link or trail tucked away above it, so only the title, the description and the actions stay in sight. It reaches across the page's side padding (`--canon-page-inset`), so the page doesn't show beside it as it scrolls.

## Behavior (T2, canon.js)

- **Folding**, each part on its own, undone as room comes back:
  - `actions`: when the actions leave the title less room than it needs (its own width, up to 20rem), they go into one **More** menu where the first of them was, the primary action staying. Shared with the [Top Bar](top-bar.md#behavior-t2-canonjs): a toggle as a check, a Button opening a Menu as a submenu, and only when two or more would fold.
  - `breadcrumb`: a trail that doesn't fit its row keeps its last page, after a "more" button whose Menu lists the rest in order.
  - `data-fold` on the header lists the steps taken; folded things get `data-folded`.
- **Sticky:** canon.js measures how far the title starts below the trail and sets `--canon-page-header-tuck`, so exactly the trail tucks away. Without it the whole header sticks.
- **Rename in place:** a Button with `command="--canon-edit"`, `commandfor` the heading, edits the heading's text where it is.
  - A text field takes its place, named by the button ("Rename"), the text selected.
  - Enter or leaving the field keeps the change; Escape drops it. Enter and Escape bring focus back to the button.
  - `canon-edit` fires on the heading first (`detail.value`, `detail.previous`, cancelable). Cancel it to keep the old name, for example when saving fails. An empty or unchanged value changes nothing.
  - The heading and its button are `data-editing` (hidden) meanwhile.
- Without JavaScript nothing folds (the actions go under the title when narrow), the whole header sticks, and the rename button does nothing.

## Accessibility

- The heading is where the page starts, and the title's `<h1>` the page's name, heard first. Keep one even when it isn't shown.
- The back link's name is where it goes ("Invoices"); its chevron is decorative.
- A status is a Tag's text, read with the title: "INV-2041, Overdue".
- Folded, every action keeps its name, as an item of the More menu ("More", `--canon-text-more`).
- Renaming: the field is named by its button and holds the old name selected; the new name is the heading's text, so it is what screen readers hear next.

## Theme obligations

- The title clearly the most prominent text on the page; the back link and the description quieter.
- A primary action, when there is one, visibly primary; the rest quieter.
- Sticky, a background that hides the page scrolling under it.
- Use logical properties: in right-to-left the back link's chevron points right and the actions sit on the left.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Tabs under the header | Tabs, next |
| An avatar or icon beside a record's title | If it comes up |
| Editing other text in place (a description, a table cell) | `--canon-edit` works on any text; a contract for it when it comes up |

## Look

**Sizes:** sm / md / lg: the title 20 / 24 / 30px on 28 / 32 / 36px lines; the trail and description in the control's type (12 / 14 / 16px); the shell's inset above and below, and between the trail and the title (8 / 12 / 16); 6 / 8 / 10 between the title and the description; 16px between the title and the actions; 8px between actions and between the title's parts.

Canon's own type and the shell's measures. The title semibold zinc-900 (dark white); the back link and description zinc-500 (dark zinc-400), the back link darkening on hover. Sticky: the page's color behind it, and the shell's line under it once stuck (a scroll-state query; browsers without one show no line). Renaming: the field in the title's type, on a zinc-100 fill (dark zinc-800), inside the focus ring.
