# Button

Tier: **T0** (toggle behavior is T2, or T0 via a form round trip; copy is T2)

## Elements

| Element | When |
|---|---|
| `<button type="…">` | It **does** something: submit, open, delete, toggle |
| `<a href="…">` | It **goes** somewhere |

- `type` is **required** on every `<button>` (`button`, `submit` or `reset`).
- Not allowed: `<input type="submit">`, `<div role="button">`, `<a>` for actions.

## Anatomy

```
canon-button
├── canon-icon            optional · leading
├── canon-button-label    required, always (also on icon-only buttons)
├── canon-icon            optional · trailing
└── accessory             optional · canon-kbd (canon-count reserved)
```

```html
<button type="button" class="canon-button">
  <span class="canon-icon" data-icon="plus" aria-hidden="true"></span>
  <span class="canon-button-label">New user</span>
</button>
```

- At most one icon on each side of the label.
- Icon position is DOM order. Themes detect leading/trailing structurally and may override it.
- The trailing icon is for icons that carry meaning ("Next →", "Export ⬇"). Indicator icons are never written (see "Drawn by the theme").
- A keyboard shortcut is a `canon-kbd` accessory with `aria-hidden="true"`; the button gets `aria-keyshortcuts` (e.g. `"Meta+K"`) so assistive tech announces it once, and only where the shortcut really works. See [kbd.md](kbd.md).

```html
<button type="button" class="canon-button" aria-keyshortcuts="Meta+K">
  <span class="canon-icon" data-icon="search" aria-hidden="true"></span>
  <span class="canon-button-label">Search</span>
  <kbd class="canon-kbd" aria-hidden="true">⌘K</kbd>
</button>
```

## Attributes

| Attribute | Values | Default | Inherited from containers |
|---|---|---|---|
| `data-emphasis` | `high` · `medium` · `low` · `minimal` | `medium` | no |
| `data-intent` | `neutral` · `success` · `warning` · `danger` | none (the accent) | no |
| `data-size` | `sm` · `md` · `lg` | theme decides | yes |
| `data-display` | `icon` | theme decides | yes |

### Emphasis: how strongly the action asks for attention relative to its neighbors

| Value | Meaning | Examples |
|---|---|---|
| `high` | **The** action of this view (one per view, by convention) | Save, Create user |
| `medium` | An alternative action | Export, Duplicate |
| `low` | Available, not encouraged | Cancel, Back |
| `minimal` | Repeated or ambient actions | Row actions, toolbars, dialog close |

### Intent: what kind of consequence the action has (independent of emphasis)

| Value | Consequence | Examples |
|---|---|---|
| none | Ordinary, in the theme's accent | Save, Export, Create |
| `neutral` | Ordinary, without an accent: actions that shouldn't draw the eye | Cancel, a toolbar's buttons, a data table's Filter and Columns, a search trigger, Close |

**Accent or neutral?** The accent is for what the view is for (Save, Create, Apply, Publish, Invite people, an empty state's way forward). Everything that serves it is neutral: Cancel, Back, Discard; buttons that open a menu, a popover, a dialog or a drawer ("Options", "Filters", "Link"); toolbar and row actions, "…" menus; Close; Clear all, Load more, Add another, Change. Danger, warning and success keep their intents.
| `danger` | Destructive or irreversible | Delete user, Revoke access |
| `warning` | Risky, bypasses a safeguard | Force deploy, Override lock, Proceed anyway |
| `success` | Gives a positive verdict | Approve, Accept request, Mark resolved |

Themes design **4 emphasis × 5 intents = 20 variants**.

### `data-display="icon"`

Hides the label visually; the label stays in the DOM as the accessible name. It can come from the author (on the button or a container) or from the theme (context, container queries).

```html
<button type="button" class="canon-button" data-display="icon">
  <span class="canon-icon" data-icon="trash" aria-hidden="true"></span>
  <span class="canon-button-label">Delete</span>
</button>
```

## States

| State | Hook | Notes |
|---|---|---|
| Hover / active / focus | `:hover` · `:active` · `:focus-visible` | |
| Disabled | `disabled` or `aria-disabled="true"` | Styled the same. `aria-disabled` keeps focus (for tooltips) and is the only option for `<a>`. It does not block clicks; the author handles that. |
| Loading | `aria-busy="true"` | The theme draws the indicator ([Spinner](spinner.md)'s ring, in place of the leading icon). The author may change the label ("Saving…") and should add `aria-disabled="true"`. |
| Pressed (toggle) | `aria-pressed="true\|false"` | A toggle button is a Button. canon.js (T2) flips it on click, like a checkbox: before the click's listeners, and back if one calls `preventDefault()` (an app that keeps the state itself). Not command or submit buttons. In a [Button Group](button-group.md), `data-select="one"` keeps one pressed. |
| Expanded | `aria-expanded="true\|false"` | Set by JS or a polyfill. |
| Current | `aria-current="page"` | For button-styled links to the current page. |
| Copied | `data-state="copied"` | Set by canon.js for 2 seconds after `--canon-copy`. See "Copy". |

### Toggle button without JS (form round trip)

```html
<form method="post" action="/tickets/42/pin">
  <button type="submit" class="canon-button" aria-pressed="true" name="pinned" value="false">
    <span class="canon-icon" data-icon="pin" aria-hidden="true"></span>
    <span class="canon-button-label">Pinned</span>
  </button>
</form>
```

## Copy (T2, canon.js)

A copy button is a Button with the `--canon-copy` command ([invoker commands](field.md#box-actions-t2-canonjs)), not a component of its own. `commandfor` names what it copies: an input's or textarea's value, otherwise the element's text.

```html
<span id="invite-link">https://example.com/invite/7Fq2</span>
<button type="button" class="canon-button" data-emphasis="low" commandfor="invite-link" command="--canon-copy">
  <span class="canon-icon" data-icon="copy" aria-hidden="true"></span>
  <span class="canon-button-label">Copy link</span>
</button>
```

- **The confirmation:** the button gets `data-state="copied"` for 2 seconds and canon.js announces "Copied" (the string `--canon-text-copied`). The label stays; the theme shows the state (Canon: the `copy` icon becomes a check, popping in).
- **Say what it copies** when there are several ("Copy link", "Copy API key"), also on an icon-only button, whose label is its name.
- **In a field's box** (an API key, a token): a trailing button, see Field's [box actions](field.md#box-actions-t2-canonjs).
- Without scripting the button is hidden, like every Canon command button. Where the browser refuses the clipboard (an insecure page, a denied permission), nothing is copied and no confirmation shows.

## Drawn by the theme, never written in HTML

| Visual | Trigger |
|---|---|
| Menu indicator (chevron, triangle, …) | `[aria-haspopup]` |
| Loading indicator | `[aria-busy="true"]` |
| External-link indicator | `a[target="_blank"]`, heard as "(opens in new tab)" (`--canon-text-opens-in-new-tab`) |
| Focus ring | `:focus-visible` |

## Theme obligations

- Style `disabled` and `aria-disabled="true"` identically.
- Hide labels with the visually-hidden technique (clipping), **never** `display: none`.
- Render all 20 emphasis × intent variants. Variants **may look identical** when the theme's language calls for it (a theme whose main button is green may draw success + high as its default button).
- Draw the indicators listed above.
- Confirm `data-state="copied"` visibly (an icon change, a color), without changing the button's size.
- **Icons on labeled buttons may be hidden** (they are `aria-hidden`, i.e. decorative). Icons on icon-only buttons must always be shown.
- When the source system conflicts with the contract, the contract wins (e.g. `pointer-events: none` only on `disabled`, never on `aria-disabled`).

## Not in the contract

| Thing | Where it goes |
|---|---|
| Shape (pill, square, circle) | Theme |
| Full width | Container layout |
| Link-styled button | [Link](link.md) on a `<button>`: `class="canon-link"` |
| Inverse / on-dark | Theme, from context |
| Split button, button group | Separate components |
| Checkbox styled as a button | [Toggle Chip](toggle-chip.md) |
| Ripple | Out of scope |

**Lift:** a low button (the framed one) has a faint lift under it (0 1px 2px, black at 5%; dark 30%), gone while pressed and when disabled, like Text Input's; a Button Group has it under its frame.

**Motion:** pressed, a button with words gives a little (98%, 0.1s); icon buttons and the joined halves of a Button Group or a Split Button don't. Copied, the check pops in from 50% and fades in (0.2s). Neither with reduced motion.
