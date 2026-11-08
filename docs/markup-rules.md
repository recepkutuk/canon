# Writing Canon markup

The rules every page that uses Canon follows. They are short on purpose: for people and for AI assistants writing Canon's HTML. Each component's specification (`docs/components/<component>.md`) gives its exact elements and attributes; the [decisions](decisions.md) explain why.

## Setup

Two lines in the page, no build step:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/canon-ui@0.2.1/css/canon/canon.css">
<script src="https://cdn.jsdelivr.net/npm/canon-ui@0.2.1/js/canon.js" defer></script>
```

Any server or framework that writes HTML can use it. There is nothing to import or call.

## Copy the specification

- **Write each component as its specification shows**, with every required element, in order. Don't invent elements, classes or wrappers.
- **Start from the specification's own markup** (its Elements section), then change the text and values. Each component's reference page (`reference/<component>.html`) shows the same markup working, in every variant and state, with its HTML under each example.

## Say what it is, never how it looks

- **`class` is what a thing is:** `canon-button`, `canon-field`, `canon-label-text`. Only `canon-` classes, never variant or state classes.
- **`data-*` is what it means:** `data-emphasis="high | medium | low | minimal"` (how strongly it asks for attention; `medium` is the default), `data-intent="info | success | warning | danger"` (or `neutral` where a component has it). Each component lists the values it takes.
- **Never write a look in the markup:** no `outline`, `ghost`, `primary`, `rounded`, `blue`, `large`, no `style`. A theme decides how every meaning looks.
- **One `high` emphasis per view**, for what the view is for (Save, Create). Cancel, Back, Close and buttons that open menus or dialogs are `neutral`.
- **Never pick colors.** Where a color means something, it is `data-intent`; where it tells things apart (an avatar, a tag), it is `data-seed`, a stable number from the app.
- **Hints are optional:** `data-size`, `data-density`, `data-display="icon"` and the like say what only the author knows. Put them on a container and they apply to everything in it. Leave them out and the theme decides.

## State is native or ARIA

- Use the platform's attributes: `disabled`, `checked`, `required`, `aria-invalid`, `aria-busy`, `aria-pressed`, `aria-expanded`, `aria-current`, `aria-selected`.
- Never state classes (`active`, `is-open`). `data-state` is canon.js's, not yours.

## Indicators come from attributes

- Don't write chevrons, spinners or external-link icons. The theme draws them from the attribute that declares the behavior: `aria-haspopup="menu"` gives a chevron, `aria-busy="true"` a spinner, `target="_blank"` the external mark.
- **Icons are named, not drawn:** `<span class="canon-icon" data-icon="trash" aria-hidden="true"></span>`. Use only the names in [the icon list](icons.md): a name that isn't there draws nothing. Directional ones are logical (`arrow-forward`, `arrow-back`), so right-to-left pages mirror them.

## Accessibility is part of the markup

- **Every control has a name:** a `<label for>` (in a Field), or `aria-label` where a component's specification says so.
- **Icon-only buttons keep their text:** `data-display="icon"` on the button or a container, and the `canon-button-label` stays, as the button's name.
- **Write the roles and ARIA the specification lists**, every one. Canon's styles hang on them, so markup without them looks wrong as well as being inaccessible.
- **Real elements:** `<button>` for actions, `<a href>` for navigation, `<table>` for tables, `<dialog>`, `popover`, `<details>`, `<select>`, `<input type="…">` for what they are.

## Behavior is declared

- **Use invoker commands, not `onclick`:** `commandfor="<id>"` with `command="show-modal"`, `"close"`, `"toggle-popover"`, or Canon's own (`"--canon-copy"`, `"--canon-clear"`, …) as the specification gives them. canon.js fills them in where the browser lacks them.
- **Tooltips use interest invokers:** `interestfor="<id>"` on the trigger and `popover="hint"` on the tooltip.
- **Pages work without canon.js.** Forms submit, links go, dialogs open. Don't make anything depend on the script that a native element can do.
- **Canon has no data or state:** saving, fetching and routing are the app's. Swapping HTML in (htmx, Turbo, a framework) is fine; canon.js picks up new markup.

## Layout belongs to containers

- Components never set the space around themselves. Put them in a [Stack, Cluster or Grid](components/stack.md) with `data-gap` (`none`, `sm`, `md`, `lg`, `xl`: the theme's steps, never lengths), or in an App Shell, Section, Card or Form Layout.
- **The page's own margins are yours,** in an App Shell or not: pad your `<main>` in your CSS, and set `--canon-page-inset` to the same side padding, so a sticky Page Header reaches across it.
- Don't add margins, widths or flex rules to `canon-` elements. Write layout CSS for your own containers, and app CSS without layers, which beats Canon's without specificity fights.

## Text is the author's

- Every word people see (labels, "(optional)", empty states, button text) is written in the markup. Canon writes none, except its own announcements ("Copied"), which `i18n/<lang>.css` translates.

## Check it

- In development, load `css/canon.debug.css` and `js/canon.debug.js` from the repository. They outline any markup that breaks a component's contract (a missing name, a part in the wrong place, a second primary action) and say why. Never load them in production.

## What Canon isn't for

Marketing sites (hero sections, pricing tables, mega menus) and anything that needs a client-side framework's components. Use Canon for internal tools: tables, forms, records, dashboards and the shell around them.
