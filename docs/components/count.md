# Count

Tier: **T0** · marking a changing number is **T2** (canon.js)

A number that says how many: unread messages, notifications, items waiting. A leaf: it never contains other components, so anything can hold it (avatars, icon buttons and tabs; nav items show a quiet number), and a Tag can hold an Avatar without a loop.

## Element

```html
<span class="canon-count">3<span class="canon-visually-hidden"> unread messages</span></span>
```

- Text only: the number as the app formats it (`3`, `12`, `99+`).
- Add what it counts as visually hidden text: "3" alone means nothing read aloud.
- Never wraps; numbers keep their width (tabular figures).

## Where it goes

| Host | Position |
|---|---|
| Avatar | Top-end corner, cut into the avatar (see [avatar.md](avatar.md)) |
| [Tab](tabs.md) | After its text, in the row ("Activity 14") |
| Icon-only [Button](button.md) | Top-end corner, over the button (Canon: 4px past it): notifications in a [Top Bar](top-bar.md). The button's name and the count read together ("Notifications, 3 unread"). |

## Behavior (T2, canon.js)

- **A changing number:** when the app changes the count's text, canon.js marks it `data-updated` while the theme's animations run (Canon: a short pop). Without canon.js the number just changes.

## Not in the contract

| Thing | Where it goes |
|---|---|
| Labels ("New", "Beta") | [Tag](tag.md) with `data-intent` |
| A dot without a number | Avatar status, or a tag's dot |
| Capping (`99+`) | App |

## Look

rose-600 pill, white 10px semibold, 16px tall, at least round (16px wide), 4px side padding. In a [Tab](tabs.md) it is neutral: zinc-200 with zinc-600 text (dark zinc-700, zinc-300), zinc-900 with white on the current tab (dark the reverse).

**Motion:** its number changing, it pops to 120% and back (0.25s). None with reduced motion.
