# Combobox

Tier: **T2** (without canon.js it is a [Select](select.md))

Pick one or several options from a list. The author writes a `<select>`, as for a Select; canon.js adds a box that opens a styled list (on touch screens too) and shows several values as tags. Search is optional: a field on top of the list, or typing in the box itself. With a search it can offer to add new values, and let the app supply the options as people type. With no options at all it is a tag input (free values). The select stays the source of truth: its options, its value (submitted with the form), `required`, `disabled` and validation.

## Elements

```html
<div class="canon-combobox">
  <span class="canon-icon" data-icon="globe" aria-hidden="true"></span>      <!-- optional -->
  <select id="country" name="country" required>                             <!-- multiple: several values -->
    <option value="" hidden>Choose a country</option>                        <!-- placeholder, optional -->
    <optgroup label="Europe">
      <option value="ie">Ireland</option>
      <option value="de">Germany</option>
    </optgroup>
    <hr class="canon-separator">
    <optgroup label="Asia">
      <option value="jp" disabled>Japan</option>
    </optgroup>
  </select>
  <button type="button" class="canon-button" data-emphasis="minimal" data-display="icon"
          commandfor="country" command="--canon-clear">                     <!-- optional -->
    <span class="canon-icon" data-icon="close" aria-hidden="true"></span>
    <span class="canon-button-label">Clear</span>
  </button>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `.canon-combobox` | yes | The box: [Select](select.md)'s box (Text Input's frame, sizes and states, the arrow). |
| `<select>` | yes | One value, or several with `multiple`. No `size`. (One value, no search, nothing else: a [Select](select.md) does the same natively.) Named by a `<label for>` (in a Field), `aria-labelledby` or `aria-label`; canon.js passes the name on. |
| `.canon-icon` | no | Leading, `aria-hidden="true"`. |
| `<option value="">` | no | **Placeholder:** first, with an empty value, `hidden`. Shown in the box while nothing is chosen (with `multiple` too). |
| `<optgroup label>`, `<hr class="canon-separator">` | no | Groups with a caption, [Separators](separator.md): as in a Select. |
| Clear button | no | After the select: a [Button](button.md) with `command="--canon-clear"` and `commandfor` the select (as in [Text Input](text-input.md)). Clears every value, or goes back to the placeholder. Hidden while nothing is chosen (keeping its space); themes may also show it only on hover and focus. The only button a box takes. |

### Options

Select's options: plain text, or `.canon-icon` / `.canon-avatar`, `.canon-option-label`, `.canon-option-description`, with spaces between. `disabled` works the same. No destructive options: picking a value isn't an action (a choice with a destructive result belongs in a Select; actions in a Menu). Then:

| On an option | With | Means |
|---|---|---|
| `data-seed` | `multiple` | Colors its tag, as on a [Tag](tag.md). |
| `data-intent` (`info` · `success` · `warning` · `danger`) | `multiple` | A **status**: shown as a status tag, in the list and in the box (a filter on a table: "Waiting", "Done"). It may start with a `.canon-tag-dot` or an icon. A status has no seed. |

### What canon.js adds

Themes style these; authors don't write them.

```html
<div class="canon-combobox">
  <select … tabindex="-1" aria-hidden="true">…</select>                       <!-- out of sight, still in the form -->
  <ul class="canon-combobox-tags">                                            <!-- multiple -->
    <li><span class="canon-tag" data-seed="15"><span class="canon-tag-label">Design</span>
      <button type="button" class="canon-tag-remove" tabindex="-1" aria-label="Remove Design"></button></span></li>
    <li class="canon-combobox-more" aria-hidden="true" hidden>
      <button type="button" class="canon-combobox-more-button" tabindex="-1" interestfor="…"><span class="canon-tag"><span class="canon-tag-label">+2</span></span></button>
      <div class="canon-tooltip" id="…" popover="hint" role="tooltip">Writing, Legal</div></li>
    <li class="canon-combobox-input-item"><input class="canon-combobox-input" role="combobox" …></li>   <!-- inline -->
  </ul>
  <button type="button" class="canon-combobox-trigger" role="combobox" aria-haspopup="listbox" …>   <!-- not inline; "dialog" with a search field -->
    <span class="canon-combobox-value">…</span>                               <!-- the value, or .canon-combobox-placeholder -->
  </button>
  <input class="canon-combobox-input" role="combobox" …>                      <!-- inline, one value -->
  <div class="canon-combobox-popup" popover>
    <div class="canon-combobox-search"><input role="combobox" …></div>        <!-- data-search="list" -->
    <div class="canon-combobox-list" role="listbox">
      <div role="group" aria-labelledby="…">
        <div class="canon-combobox-caption" id="…">Europe</div>
        <div class="canon-combobox-option" role="option" aria-selected="true"><mark class="canon-combobox-match">Ir</mark>eland</div>
      </div>
      <hr class="canon-separator" aria-hidden="true" hidden>
      <div class="canon-combobox-option canon-combobox-create" role="option" hidden>…Add “…”</div>
    </div>
    <div class="canon-combobox-loading" hidden>…Loading…</div>
    <div class="canon-combobox-empty" hidden>…No results for “…”</div>
  </div>
</div>
```

A one-value combobox can also sit in a [Text Input](text-input.md), first or last, like a Select (a searchable country code: `data-search="list"`). It keeps the width of its widest option.

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-size` | box or a container | `xs` · `sm` · `md` · `lg` · `xl` · `2xl` (three-size themes: xs is sm, xl and 2xl are lg) | theme decides | yes (the list and the tags follow) |
| `data-intent` | box | `warning` · `success` | none | no |
| `data-search` | box | `list`: a search field on top of the list · `inline`: type in the box itself | no search (typing jumps) | no |
| `data-creatable` | box | (present, with `data-search`) offer to add a value no option has | off | no |
| `data-filter` | box | `none` (with `data-search`): the app filters (see below) | canon.js filters | no |
| `data-tags` | box | `collapse`: tags on one row, the rest as "+N" (`multiple`) | tags wrap | no |
| `data-max` | select | a positive number: at most that many values (`multiple`) | no limit | no |
| `data-intent`, `data-seed` | option | see Options | none | no |

## Behavior

- **Opening:** clicking the box, Enter, Space, Up, Down or Alt+Down on it, or typing (with a search, what was typed starts it). The keyboard's place starts on the chosen option.
- **Without search** (the default): focus stays on the box while the list is open. Up, Down, Home and End move; typing jumps to the next option that starts with what was typed in the last half second (the same letter again: the next one with it); Enter or Space picks.
- **Searching** (`data-search`): the list keeps the options whose label or description contains what was typed, ignoring case and accents, and marks the match. Groups with nothing left go, and so do separators with nothing on one side. With nothing left: "No results for “…”". The number of results is announced (polite) after a pause in typing.
- **In the list:** Up and Down move (disabled options are skipped), Enter (or Space, without search) or a click picks. One value: the list closes. Several: the option is added or removed and the list stays open. Escape closes, Tab closes and moves on.
- **Typing in the box** (`data-search="inline"`): the box is a text field. With one value it shows the value's label; typing opens the list, and closing it without picking puts the label back (Escape does too). With several values the field follows the tags; after a pick it empties for the next one, and Backspace in the empty field removes the last value (announced). Leaving the box closes the list. The box shows labels only, not the option's icon or avatar.
- **New values** (`data-creatable`): when what was typed isn't an option's name, the list ends with "Add “…”" (also when nothing else matches). Picking it adds an `<option>` with that text as its value and label, chosen. If an option has that name (ignoring case and accents), it is chosen instead. An added value stays an option only while it is chosen: removing it (or picking another value) takes it out of the select and the list, so there is nothing to delete later. To keep it as an option for next time, the app adds it to its own options (on `change`).
- **Options from the app** (`data-filter="none"`): canon.js doesn't filter. It fires `canon-search` on the select (bubbling; `event.detail.query`) when the list opens and as people type. The app sets `aria-busy="true"` on the select while it loads (the list shows "Loading…"), replaces the options, and removes `aria-busy`. The app keeps the chosen options in the select, or their values are lost. Matches are still marked.
- **Free values** (a tag input): several values (`multiple`), typed in the box (`data-search="inline"`), new values allowed (`data-creatable`), and **no options to pick**: the select holds only a placeholder and the values to start with (chosen). There is no list, and the field is a plain text field, not a combobox. Enter or a comma adds what was typed, and so does leaving the box (nothing typed is lost); an empty field lets Enter submit the form. A paste with commas or line breaks adds each part, keeping the last unfinished part (and any past a limit) in the field. A name already chosen (ignoring case and accents) isn't added twice. Backspace in the empty field removes the last value and Escape clears what was typed, as inline. Every value is an option of the select only while chosen, the starting ones too, so the form submits them under the select's name. If the app adds options later (`data-filter="none"` is not free), it becomes a combobox again and they are suggestions. Without canon.js the empty select can't take values: keep this for forms that need JavaScript, or offer a text field there.
- **A limit** (`data-max`): once that many values are chosen, the other options (and "Add") can't be picked until one is removed.
- **Tags:** each has a remove button (a click removes the value and focus returns to the box). Tags still chosen stay as they are when the value changes; a removed one closes its room sideways (`data-state="closing"`) where it was, and one chosen later opens its room (`"opening"`). When they take more rows or fewer, the box is `data-resizing` (`"opening"` or `"closing"`) while its height follows, from `--canon-motion-from-height` to `--canon-motion-to-height`. The buttons are out of the tab order: keyboard users remove a value from the list (or with Backspace, inline). With `data-tags="collapse"` the tags that don't fit give way to "+N", whose [Tooltip](tooltip.md) lists them; the last tag left is cut short. Clicking "+N" opens the list.
- **Clear:** the clear button empties the select (or picks the placeholder), fires `input` and `change`, and returns focus to the box.
- **The select:** picking sets its options and fires `input` and `change` on it. If the app changes the select in code, it fires `change` (or edits the options or attributes, which canon.js sees). Form resets are followed.
- **Names and states:** the select's label, `aria-describedby`, `aria-invalid`, `required` and `disabled` are mirrored on the box's control. Focus that reaches the select (its label, a failed submit) goes to that control. In a Field, validation messages work as for a Select.

## States

| State | Hook | Notes |
|---|---|---|
| Open | `.canon-combobox-popup:popover-open` | Shown like focus; the arrow turns. |
| Focus | the trigger's or the field's `:focus` | |
| Placeholder | `.canon-combobox-placeholder` in the value, or the field's placeholder | Muted |
| Error | `aria-invalid="true"` on the select, or `:user-invalid` | |
| Warning, success | `data-intent` on the box, or a field's message | |
| Disabled | `disabled` on the select | Tags lose their color and their remove buttons. |
| Loading | `aria-busy="true"` on the select | The "Loading…" row |
| Option chosen | `aria-selected="true"` | Marked by the theme (a check, with several values too) |
| Option highlighted | `data-state="active"` | The keyboard's place, also where the pointer is |
| Option disabled | `aria-disabled="true"` | Also the options a limit blocks |
| Filtered out | `hidden` | |

## Core

- The select is visually hidden once canon.js has run; the trigger takes its place and owns the whole box, as the select does in a Select (`--canon-select-start` / `-end`). Inline, the field owns the box as a text input does.
- With tags, the trigger lies under the whole box (a click anywhere opens the list) and its text, the values, is for screen readers; tags let clicks through except on their remove buttons. Inline, the field follows the tags and is at least 4rem wide.
- `data-tags="collapse"`: the tags row doesn't wrap and clips; canon.js hides the tags that don't fit.
- The clear button sits above the trigger and hides while nothing is chosen.
- The popup is a popover anchored to the box (canon.js names the anchor), at least as wide, below it, flipping above when there's no room. The search field stays; the list scrolls.
- Rows hidden by the search are hidden whatever display the theme gives them.

## Accessibility

- The box is a `role="combobox"` button with `aria-expanded`; its text is the value (several values: all of them, comma-separated). Without search it controls the listbox (`aria-haspopup="listbox"`) and points at the highlighted option with `aria-activedescendant`, keeping focus. Inline, the box's field is the combobox (`aria-autocomplete="list"`), and with several values the values are its description. With free values there is no list, so the field drops the combobox role (a plain text field, named like the select), and the values are still its description.
- With a search field in the list, the button opens a dialog (`aria-haspopup="dialog"`) named like the select; the search field controls the listbox and points at the highlighted option with `aria-activedescendant`, so focus never leaves the field.
- The listbox has `aria-multiselectable` with `multiple`; options say `aria-selected`; groups are named by their captions. "Add “…”" is an option; "Loading…" and "No results" are not, and the result count is announced instead.
- "+N" and its tooltip are hidden from screen readers, and out of the tab order: they get every value from the trigger or the field.
- Strings canon.js uses (`search`, `no-results`, `no-results-for`, `results-*`, `create-option`, `loading`, `remove-value`, `removed-value`, `more-values`) are translated in `i18n/` and follow `lang`. Counts use the language's plural forms.

## Theme obligations

- The box looks like a Select at rest; the list like a Select's, with the search field on top when there is one.
- Chosen options marked by more than color; the keyboard's place visible; the match visible on every row (highlighted, chosen, destructive).
- Tags of the box's size, wrapping inside it; the arrow and the clear button stay reachable.
- "No results", "Loading…" and "Add" read as part of the list; loading moves (gently under reduced motion).
- A list taller than its limit scrolls under the search field.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| The option's icon or avatar in an inline box | Not decided yet |
| Menus of actions | Menu |

## Look

**Sizes (sm / md / lg):** Box: Select's (32 / 40 / 48); free values: no arrow, ending as a text input does. Search field: the box's height, padding 8 / 10 / 12, a 16 / 20 / 24 search icon, text 30 / 38 / 44 from the edge. List: Select's; rows below the search field. Several values: tags of the box's size (24 / 32 / 40), 4px from the border, 4 / 8 / 12 apart; the arrow 4 / 4 / 8 past them, on the last row.

Search field: a hairline rule under it (black at 10%, dark white at 10%), icon zinc-400 (dark zinc-500), placeholder zinc-500 (dark zinc-400). Tags: [Tag](tag.md)'s medium emphasis with a remove button; on hued tags the button is a zinc-100 segment (dark zinc-700). **Built from the option row:** "No results for “…”" and "Loading…" are rows with an icon in the icon color (Lucide search-x; loader-circle, turning) and text in the caption's zinc-500 (dark zinc-400); "Add “…”" is an option with a plus, after a separator. Under the search field's line, a list starting with options (and these rows) keeps a separator's space: 5.5 / 5.5 / 9.5px. The list scrolls after 8.5 rows of the box's height (272 / 340 / 408px). The match: a tint of the text color behind it (14%, dark 24%), as Kbd's. Disabled tags: neutral, from the box's disabled text, without remove buttons. The clear button: Text Input's box button, before the arrow, shown while the box is hovered or focused (always on touch screens). Statuses: Tag's status pills, in the list too.

**Motion:** the list opens and closes as Select's: it fades in from 97% (0.15s) and out where it is (0.1s); filtering doesn't replay it. With reduced motion it only fades.

**Tags' motion:** a removed tag fades (0.12s), then narrows away (0.18s) as its neighbours close up; a new one widens (0.18s), then fades in (0.12s). When the tags take more rows or fewer, the box's height follows them (0.18s, as they narrow or widen) instead of jumping. With reduced motion they only fade and the box changes at once.
