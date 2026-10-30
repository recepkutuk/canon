# Avatar Group

Tier: **T0** · the spotlight's tooltip and keyboard reach are **T2** (canon.js)

Several avatars in a row (members, reviewers, people online), usually ending with a count of the rest.

## Elements

```html
<div class="canon-avatar-group" role="group" aria-label="Project members" data-size="sm">
  <span class="canon-avatar" data-seed="1">
    <img class="canon-avatar-image" src="ada.jpg" alt="">
    <span class="canon-avatar-fallback" role="img" aria-label="Ada Lovelace">AL</span>
  </span>
  <span class="canon-avatar" data-seed="2">
    <span class="canon-avatar-fallback" role="img" aria-label="Grace Hopper">GH</span>
  </span>
  <span class="canon-avatar">
    <span class="canon-avatar-fallback" role="img" aria-label="5 more">5+</span>
  </span>
</div>
```

- `.canon-avatar-group` with `role="group"` and a label that says who they are.
- Direct children are [avatars](avatar.md), in order: the first is in front.
- **The rest:** a last avatar with no seed (neutral) whose fallback says how many ("5+") and whose label says it ("5 more"). It may be a `<button>` that opens the full list (`aria-haspopup="dialog"` or `"menu"`).
- How many to show before "the rest" is the app's call.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-size` | group or a container | `xs` · `sm` · `md` · `lg` · `xl` · `2xl` | theme decides | yes (reaches every avatar) |
| `data-density` | group or a container | `compact` · `comfortable` · `spacious` | theme decides | yes |
| `data-spotlight` | group | (present) the avatar under the pointer or with focus comes forward and shows its name | — | no |
| `interestfor` | an avatar in a spotlight group | the id of the author's own [Tooltip](tooltip.md) for it (more than the name) | a tooltip of its name | no |

### `data-density`: how tightly they sit

Independent of size: any size at any density. A hint, like `data-size`; the theme decides what each means for avatars and what to do without one.

| Value | Typically |
|---|---|
| `compact` | Overlapping |
| `comfortable` | Touching |
| `spacious` | Apart |

## Spotlight (`data-spotlight`)

For groups whose avatars people want to tell apart (who's on this project, who reviewed).

- **Coming forward** (the theme, CSS): the avatar under the pointer or with keyboard focus is drawn on top of the others, a little bigger, no longer cut by the one before it; the others step back.
- **Its name** (canon.js): a [Tooltip](tooltip.md) over it, after a short wait for the first, at once while moving along the group. The name comes from the avatar (its fallback's `aria-label`); `interestfor` on an avatar points at the author's own Tooltip instead (a role, a status, the names behind "5+").
- **Keyboards** (canon.js): avatars that aren't links or buttons become focusable images, named by their person (with their status, badge and count: "Ada Lovelace, Online"). The group is one Tab stop; the arrow keys, Home and End move between them. Links and buttons keep their own Tab stops. Escape hides the tooltip.
- **Touch:** no hover, so no tooltip; a tap on a link or button does what it does.

## Theme obligations

- Keep each avatar readable where they overlap. Canon cuts a gap into the avatar behind (and around the status, badge or count of the one in front) rather than drawing a ring in a background color, so groups work on any surface.
- The first avatar reads as in front, in both directions.
- Clickable avatars need room for their focus ring; without `data-density`, themes may spread them out.
- With `data-spotlight`, the avatar in front reads as in front wherever it sits (no cut of its own, its neighbours cut around it), and the others are still recognizable.

## Not in the contract

| Thing | Where it goes |
|---|---|
| Overlap amounts per density | Theme |
| Counting the rest, truncation | App |
| Spreading the avatars apart on hover | Out of scope (`data-spotlight` brings one forward) |

## Look

compact: overlapping by 2 / 4 / 6 / 8 / 10 / 12px (xs → 2xl); comfortable: touching; spacious: two rings apart. Each avatar is cut by the one before it plus a ring of 2 / 3 / 4 / 4 / 5 / 6px. Default compact; groups of links or buttons default to spacious. The rest: zinc.

**Spotlight:** the avatar under the pointer or with focus scales to 110% on top of the others, its own cut gone and the one before it cut around it by the same ring (the one after it, its cut grown to match); the others fade to 40%. 0.15s; with reduced motion only the fade. Avatars that aren't links or buttons get Button's focus ring. The name in a [Tooltip](tooltip.md) above it.
