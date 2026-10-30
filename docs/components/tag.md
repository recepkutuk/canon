# Tag

Tier: **T0**

A short label in a chip: a category ("Design"), a status ("Active"), a person ("Ada Lovelace"). It shows something; the one thing it can do is be removed (a remove button). Other libraries often call it a badge.

## Elements

```html
<span class="canon-tag" data-emphasis="high" data-intent="success">
  <span class="canon-icon" data-icon="circle-check" aria-hidden="true"></span>
  <span class="canon-tag-label">Approved</span>
</span>
```

In order, all optional but the label:

| Element | Notes |
|---|---|
| `.canon-avatar` | First. A face for a person tag: photo or initials, no status, badge or count. The label already says the name, so its fallback is `aria-hidden="true"` (see [avatar.md](avatar.md)). The theme sizes it. |
| `.canon-icon` | Leading and/or trailing, `aria-hidden="true"` |
| `.canon-tag-dot` | Empty, right before the label. Decoration in the text color: the label carries the meaning. |
| `.canon-tag-label` | **Required.** The text. One line; it truncates with an ellipsis when the tag runs out of room. |
| `.canon-kbd` | Last. Read with the tag. See [kbd.md](kbd.md). |
| `.canon-tag-remove` | Last (instead of a key). `<button type="button">` with a name that says what goes: `aria-label="Remove Design"`. Empty: the theme draws the icon. The app (or [Combobox](combobox.md), which makes its own) removes the tag on click. |

```html
<span class="canon-tag" data-seed="4821">
  <span class="canon-avatar">
    <img class="canon-avatar-image" src="ada.jpg" alt="">
    <span class="canon-avatar-fallback" aria-hidden="true">AL</span>
  </span>
  <span class="canon-tag-label">Ada Lovelace</span>
</span>
```

- **Several tags** are a list: `<ul>` with one tag per `<li>`, so screen readers say how many.
- **Icon only:** `data-display="icon"` on the tag (or a container) hides the label visually; it is still read.
- **Removable:**

```html
<span class="canon-tag" data-seed="15">
  <span class="canon-tag-label">Design</span>
  <button type="button" class="canon-tag-remove" aria-label="Remove Design"></button>
</span>
```

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-emphasis` | tag | `high` · `medium` · `low` | theme decides | no |
| `data-intent` | tag | `info` · `success` · `warning` · `danger` | none: neutral | no |
| `data-seed` | tag | an integer (a label id, a user id) | none: neutral | no |
| `data-size` | tag or a container | `xs` · `sm` · `md` · `lg` · `xl` · `2xl` (three-size themes: xs is sm, xl and 2xl are lg) | theme decides | yes |
| `data-display` | tag or a container | `icon` | label shown | yes |

### Color: meaning or identity, never both

- **`data-intent`** when the color means something: a status ("Approved", "Overdue"). Many statuses in a list (a column of a table) are lighter as a [Status Indicator](status.md): the same words, a dot instead of a chip. The same words as buttons and messages. Themes may give statuses their own look (shape, case), so a status never reads as a category. A status has no avatar and no key.
- **`data-seed`** when it only tells tags apart: categories, labels, people. The app passes a stable number and the theme picks one of its colors, always the same one, and the **same hue an avatar with that seed gets**. Integers only; hash other ids in the app. canon.js writes `data-seed-slot` for browsers that can't compute it in CSS (as for avatars).
- **Neither:** neutral.

### `data-emphasis`

| Value | Typically |
|---|---|
| `high` | Solid |
| `medium` | Tinted |
| `low` | Outlined |

The same words as buttons, so a theme's emphasis reads the same across components.

## Accessibility

- A tag is text: the label is read in place, with nothing announced around it. Don't rely on color alone; the label (or an icon's hidden text) says what the color means.
- Icons and the dot are decorative. An icon-only tag keeps its label, visually hidden.
- The remove button's name says which tag it removes ("Remove Design", not "Remove"). After a removal, move focus somewhere that makes sense (the next tag's button, or the control that added it): the button it was on is gone.

## Theme obligations

- Every emphasis readable in every color, on the page and on gray, tinted and dark surfaces.
- Keep the box the same across emphases (an outline doesn't make a tag bigger).
- A status may look different from a category, but never only by color.
- A key inside a solid tag stays readable.
- The remove button is the size of an icon, in reach of the tag's edge, with a visible focus ring; its icon contrasts with the tag on every emphasis and color.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Clickable tags (links, filters) | Not decided yet |
| A color chosen by the author | Not offered: `data-seed` or `data-intent` |
| Choosing the pill or uppercase look | Theme, from `data-intent` |
| Counts ("12") | [Count](count.md) |
| Tag input (typing to add tags) | [Combobox](combobox.md) with free values |

## Look

**Sizes (sm / md / lg):** 24 / 32 / 40px tall; padding 4 / 6 / 8, gap 2 / 4 / 6, radius 2 / 4 / 8; text 12 / 14 / 16 medium; icons and avatar 16 / 20 / 24; dot 6 / 8 / 10. sm by default.

Medium by default. Hues (17 seeds; intents info blue, success green, warning amber, danger red): high tone-600 with white; medium tone-400 at 15% with tone-700 (dark: tone-500 at 20%, tone-300); low a tone-700 border (dark: tone-300 at 50%) with the medium text. Neutral is derived from the surrounding text, like Kbd, so it reads on any surface; on the plain page it lands on zinc within a few RGB units: high zinc-600 / zinc-100 (dark zinc-500 / white), medium zinc-100 / zinc-900 (dark zinc-700 / white), low zinc-300 border / zinc-900 (dark zinc-600 / white). Only a solid tag's text is fixed (zinc-100, dark white): it contrasts with the fill. **Remove** (the badge's x): Lucide x at the icon size, the text color at 65% (dark 50%: zinc-500 / zinc-400 on the plain page), full on hover; on a hued tag (a status too) it is a segment of its own in zinc-100 with a zinc-500 x (dark zinc-700, zinc-400), the tag's padding around it and the tag's end corners (round on a status). **Statuses** (`data-intent`) are pills with uppercase 10 / 11 / 12px semibold text, tracking 0.03em, label 8 / 12 / 16px from the edge; same heights.
