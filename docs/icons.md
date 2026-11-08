# Icons

The icon names Canon's stylesheet draws. Name one on a `canon-icon`: `<span class="canon-icon" data-icon="trash" aria-hidden="true"></span>`. A name that isn't here draws nothing, unless you add it (below). Directional names are logical (`arrow-forward`, not arrow-right), so right-to-left pages mirror them. This list is written from the stylesheet; another theme may draw more.

- `align-center`
- `align-end`
- `align-justify`
- `align-start`
- `arrow-back`
- `arrow-forward`
- `baseline`
- `bell`
- `bold`
- `book-user`
- `building`
- `calendar`
- `chevron-down`
- `chevron-left`
- `chevron-right`
- `chevron-up`
- `chevrons-left`
- `chevrons-right`
- `circle-alert`
- `circle-check`
- `circle-help`
- `close`
- `copy`
- `crown`
- `download`
- `eraser`
- `external`
- `eye`
- `gauge`
- `globe`
- `grip-vertical`
- `house`
- `inbox`
- `indent-decrease`
- `indent-increase`
- `info`
- `italic`
- `link`
- `list`
- `list-filter`
- `list-ordered`
- `loader`
- `log-out`
- `mail`
- `minus`
- `moon`
- `more`
- `panel-left-close`
- `panel-left-open`
- `pencil`
- `pin`
- `plus`
- `receipt`
- `redo`
- `refresh`
- `search`
- `search-x`
- `settings`
- `sparkles`
- `square-chevron-left`
- `square-chevron-right`
- `square-kanban`
- `star`
- `strikethrough`
- `subscript`
- `sun`
- `superscript`
- `table`
- `tag`
- `text-cursor`
- `text-wrap`
- `trash`
- `underline`
- `undo`
- `user`

## Adding an icon

Each icon is one custom property, set for its name. To add one, give the name an image in your own CSS. App CSS outside Canon's layers wins over the theme without a specificity fight:

```css
[data-icon="users"] {
  --canon-theme-icon: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>…</svg>");
}
```

- The image is a mask: its shape takes the text's color, so draw it in one color on a transparent background.
- Canon's own icons are Lucide icons at stroke 1.5 on a 24px grid, so a Lucide icon with `stroke-width='1.5'` matches them.
- The contract check (`css/canon.debug.css` with `js/canon.debug.js`) outlines an icon that has no image: a misspelled name, or one you haven't added.
