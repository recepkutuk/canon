# Description List

Tier: **T0**

Facts about one thing, as terms and their values: a record's details, a profile, an invoice's totals, a settings overview. The read-only side of a form: with the same `data-label` it lines up the same way, so a page can switch between showing and editing without moving. To compare many records, a [Table](table.md).

## Elements

```html
<dl class="canon-description-list" data-label="start">
  <div><dt>Invoice</dt><dd>INV-2041</dd></div>
  <div><dt>Status</dt><dd><span class="canon-tag" data-intent="success">…Paid…</span></dd></div>
  <div><dt>Participants</dt><dd>Ada Lovelace</dd><dd>Grace Hopper</dd></div>
  <div>
    <dt>Email</dt><dd>ada@example.com</dd>
    <button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral">…Change<span class="canon-visually-hidden"> email</span>…</button>
  </div>
</dl>
```

| Element | Required | Notes |
|---|---|---|
| `dl.canon-description-list` | yes | The list. Its only children are `<div>` items. |
| `<div>` | yes | An item: one term, then its values, then an optional action. |
| `<dt>` | yes | The term. Text; or an icon (`canon-icon`, `aria-hidden="true"`) with its words in a `canon-visually-hidden` span, for a panel where the icons say enough at a glance (an event, a contact card). |
| `<dd>` | yes | A value, one or more per term. Any inline content: text, a [Tag](tag.md), a [Link](link.md), a `<time>`, an [Avatar](avatar.md) and a name, a copy button. Empty (`<dd></dd>`): a dash, heard as "Not set" (the `--canon-text-not-set` string). |
| Action | no | A [Button](button.md) (minimal and neutral, or low for something weightier: Export, Delete) or [Link](link.md) after the values, at the item's end ("Change"); named for its item where several are alike ("Change email"). |

- **Not for** a list of things (a list, Nav List, Timeline) or headline numbers ([Stat](stat.md)).

## Attributes

| Attribute | On | Values | Default | Inherited from containers |
|---|---|---|---|---|
| `data-label` | the list or a container | `start`: terms beside their values, in Field's label column (`--canon-label-width`, a third), while the list has 32rem; above below that · `above` | terms above | yes ([Field](field.md#label-beside-the-box-author-hint)'s hint) |
| `data-columns` | the list | `2` · `3`: items side by side, as many columns as fit at 16rem each, up to that number | one | no |
| `data-lines` | the list | `none`: no lines between items | lines | no |
| `data-size` | the list or a container | `sm` · `md` · `lg`: Table's type and row heights | theme decides | yes |

## Core

- The list is a grid of items (`--canon-description-list-gap` between columns, 2rem); it is a size container for `data-label`. Each item is a grid: term and values in a column, an action at the end; an icon term sits beside its values, as every term does with `data-label="start"`.
- Values wrap, even unbroken ones (an address, a key).

## Accessibility

- A description list: screen readers announce the list and its number of items, each term with its values. An icon term's words are hidden visually only, so the pair still reads ("Date, 10 October 2026").
- An empty value is announced as "Not set" rather than skipped.

## Theme obligations

- Terms read as labels (quieter than values); items read as separate (lines or space).
- An empty value is visible as empty (a dash), not a blank.
- Use logical properties: in right-to-left, terms are on the right.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Groups of items under a heading | Headings between lists, or a Section / Panel |
| Editing a value in place | A form with `data-label="start"` in its place |
| Headline numbers | [Stat](stat.md) |

## Look

**Sizes (sm / md / lg):** Items a Table row's height (48 / 56 / 64), 8px inside; stacked, the value 4px under its term; beside, 16px apart; an icon term a control-sized square (32 / 40 / 48), 8px from its values; columns 32px apart.

Table's look and the event sheet's details: a hairline rule between items (black at 10%, dark white at 10%); terms in Table's header type (zinc-500 medium, dark zinc-400), values zinc-900 (dark white) in Text Input's type; icons zinc-500 (dark zinc-400), the value's first line level with the icon; an action centered on the item when its term is stacked over its value, and on the item's line when they sit beside each other (`data-label="start"`); empty values zinc-400 (dark zinc-500).
