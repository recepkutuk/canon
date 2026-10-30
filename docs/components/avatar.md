# Avatar

Tier: **T0** (photo fallback and the spotlight's tooltip are T2: canon.js)

A person, team or bot, shown as a photo, initials or an icon, optionally with a status dot, a badge and a count.

## Elements

```html
<span class="canon-avatar" data-seed="4821">
  <img class="canon-avatar-image" src="ada.jpg" alt="">
  <span class="canon-avatar-fallback" role="img" aria-label="Ada Lovelace">AL</span>
  <span class="canon-avatar-status" data-status="online"><span class="canon-visually-hidden">Online</span></span>
  <span class="canon-count">3<span class="canon-visually-hidden"> unread</span></span>
</span>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-avatar` | yes | `<span>`, or `<a href>` / `<button type="button">` when it does something (profile link, account menu) |
| `img.canon-avatar-image` | no | The photo. Always `alt=""`: the fallback carries the name. Comes before the fallback. |
| `.canon-avatar-fallback` | yes | Initials, or **empty** (no whitespace) for the theme's icon. Carries the name with `role="img"` and `aria-label`; `aria-hidden="true"` instead when the name is written beside the avatar. |
| `.canon-avatar-status` | no | `data-status` + visually hidden text |
| `.canon-avatar-badge` | no | A `canon-icon` + visually hidden text (what it means: "Verified") |
| `.canon-count` | no | See [count.md](count.md) |

- **Type comes from the content.** Photo when there is an `<img>`, initials when the fallback has text, the icon when it is empty. Nothing to declare.
- The fallback always sits under the photo, so its name is read whatever the photo does. While a photo loads, the fallback shows.
- **Many photos:** `loading="lazy"` on the `<img>` (a long list or a table of people) waits to fetch each photo until it nears the window; the initials show until it comes.
- **Broken photos:** canon.js sets `data-state="error"` on the avatar when its photo fails (or has no `src`); the fallback shows instead of the browser's broken-image icon. It clears if a new `src` loads. A photo still loading when canon.js starts marks the avatar `data-state="loading"` until it comes.
- canon.js also sets, on the avatar, for themes to use (never written by authors):
  - `--canon-count-inline-size`: the count's width, so a cut-out can follow "12" or "99+".
  - `data-seed-slot`: the seed modulo the theme's `--canon-seed-colors`, for browsers that can't compute it in CSS (typed `attr()`, `if()`). Both paths give the same slot; a seed that isn't an integer gets none (neutral).
- Status and badge share the bottom-end corner: use one or the other. The count sits top-end. All three move to the other side in right-to-left text.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-seed` | avatar | an integer (a user id) | none: neutral | no |
| `data-kind` | avatar | `person` · `team` · `bot` | `person` | no |
| `data-spotlight` | avatar | (present) under the pointer or with focus it grows a little and shows its name (see [Avatar Group](avatar-group.md#spotlight-data-spotlight)) | — | no |
| `data-size` | avatar or a container | `xs` · `sm` · `md` · `lg` · `xl` · `2xl` | theme decides | yes |
| `data-status` | status | `online` · `away` · `busy` · `offline` | required | no |
| `data-intent` | badge | `info` · `success` · `warning` · `danger` | theme decides | no |

### `data-seed`: a color that stays the same

Avatar colors tell people apart; they don't mean anything. The app passes a stable number (a user id), and the theme picks one of its colors from it, the same one every time and on every page. Two themes may pick different colors for the same seed. Without a seed the avatar is neutral (also used for "+3" overflow avatars).

- Integers only (`data-seed="4821"`). Hash other ids (UUIDs, emails) to an integer in the app.
- Themes declare how many colors they have with `--canon-seed-colors` on `:root`.
- [Tags](tag.md) take the same seeds: a theme gives a seed the same hue on both, so a person's avatar and their tag match.

### `data-kind`

What the avatar stands for, not its shape. Themes typically draw people round and teams and bots as rounded squares (GitHub, Slack), and give an empty fallback a matching icon.

## States

| State | Hook | Notes |
|---|---|---|
| Photo failed | `data-state="error"` | Set by canon.js |
| Photo loading | `data-state="loading"` | Set by canon.js |
| Focus (link, button; any avatar with `data-spotlight`) | `:focus-visible` | Same ring as buttons |
| Menu open | `aria-expanded` | On a `<button>` with `aria-haspopup` |

## Accessibility

- "AL" means nothing read aloud: the fallback's `aria-label` is the full name.
- The status and badge text is read after the name ("Ada Lovelace, Online, 3 unread").
- Decorative avatars (the name is printed right beside them): fallback `aria-hidden="true"`, no `role`, no `aria-label`.
- With `data-spotlight`, an avatar that isn't a link or button becomes a focusable image named by its person, its status, badge and count included ("Ada Lovelace, Online"); its tooltip shows the name, or the author's own Tooltip (`interestfor`), which also describes it.
- A clickable avatar's name is its content, so the link or button needs nothing more. Make the label say what it does when that differs ("Your account, Ada Lovelace").

## Theme obligations

- Keep status, badge and count readable on photos: Canon's own themes cut a gap around them into the avatar rather than drawing a ring in a background color, so it works on any surface.
- Draw the icon for an empty fallback, per `data-kind`.
- Map every seed to a color; with no seed, use a neutral one.

## Not in the contract

| Thing | Where it goes |
|---|---|
| A color chosen by the author | Not offered: use `data-seed` |
| Shape as an option | Theme, from `data-kind` |
| Stacks, "+3" | Avatar Group |
| Presence updates (live status) | App (change `data-status`) |

## Look

**Sizes:** 24 / 32 / 40 / 48 / 56 / 64; md by default. Initials 10 / 12 / 14 / 16 / 16 / 24px. Icon half the size (Lucide `user-round`, `users-round`, `bot`).

Seeds pick one of 17 hues (light: tone-400 at 15% with tone-700 text; dark: tone-500 at 20% with tone-300). No seed: zinc-100 / zinc-500 (dark zinc-700 / zinc-300). Status green / amber / red / hollow zinc; badge a green-tinted 16px circle; count rose-600. Each cut into the avatar with a 2px gap. Every face has a hairline inner rim (0.5px on sharp screens, else 1px), so a light face doesn't bleed into the page: on initials and icons their own color at 20% (a seeded avatar's rim in its hue), on a photo black at 15% (dark white at 15%); it follows the face's shape, and the holes cut it too. The pointer over an avatar that isn't a link or button is the arrow, not the text cursor. Teams and bots: radius 20% of the size.

**Motion:** a photo still loading waits unseen over the initials, then fades in (0.2s) when it comes; a fade, so also with reduced motion.

**Spotlight:** under the pointer or with focus it scales to 110% (0.15s; not with reduced motion) and shows its name in a [Tooltip](tooltip.md) above it; Button's focus ring.
