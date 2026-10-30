# Canon

Component library for internal tools: tables, forms, records.

**The markup is the contract.**

Canon builds tables, forms and dialogs once, in plain HTML: the browser does the work, a theme decides the look, and the markup outlives both.

## Start

Two lines, then the markup each component's page shows.

```html
<link rel="stylesheet" href="css/canon/canon.css">
<script src="js/canon.js" defer></script>
```

A primary action:

```html
<button type="button" class="canon-button" data-emphasis="high">
  <span class="canon-icon" data-icon="plus" aria-hidden="true"></span>
  <span class="canon-button-label">New invoice</span>
</button>
```

## Why Canon

- **Write it once, keep it.** A `<button>` written today still works in ten years. Canon is unopinionated about your stack and your look: it's markup, so it works with whatever renders it and outlives the framework of the moment.
- **Accessible by nature.** This is where Canon is opinionated: names, roles, focus and keys are part of each component's markup. No one has to remember them, and no theme can lose them.
- **Less JavaScript every year.** Browsers keep doing more on their own. Canon uses what they do, and its script steps back as they catch up.
- **Works the way you expect.** A table should read like a table, a form should never lose what was typed, and the keyboard should always work.

## What the markup gives you

```html
<div class="canon-segmented" role="radiogroup" aria-label="Calendar view">
  <label class="canon-segmented-option">
    <input type="radio" name="view" value="day">
    <span class="canon-segmented-label">Day</span>
  </label>
  <label class="canon-segmented-option">
    <input type="radio" name="view" value="week" checked>
    <span class="canon-segmented-label">Week</span>
  </label>
</div>
```

- **You write the markup.** A radio group: plain HTML, the classes and attributes the Segmented Control page shows.
- **Names come with it.** `aria-label` names the group and each label names its option, so a screen reader says where you are.
- **Keys and state come with it.** The arrow keys choose, and the indicator slides to the new option. The browser and Canon keep the state; no code of yours.

## Without JavaScript

67 of 68 components work without it. Each component's specification gives its tier: what it does with HTML and CSS alone, and what canon.js adds. When a script doesn't load, the page still works.

| Tier | Components | What it needs |
| --- | ---: | --- |
| T0 | 49 | HTML and CSS only |
| T1 | 7 | The browser's own popovers and dialogs |
| T2 | 11 | Plain controls, more with canon.js |
| T3 | 1 | Needs JavaScript: the command palette's search |

## Components

- **Layout:** App Shell, Page Header, Section, Separator, Sidebar, Split Pane, Stack, Cluster and Grid, Toolbar, Top Bar
- **Actions:** Button, Button Group, Link, Segmented Control, Split Button, Toggle Chip
- **Forms:** Checkbox, Color Picker, Combobox, Date family, Field, Fieldset, Form Layout, Form Repeater, Input OTP, Label, Number Input, Password, Radio, Range Slider, Rich Text, Save Bar, Select, Slider, Swatches, Switch, Text Input, Textarea, Time
- **Data display:** Accordion, Avatar, Avatar Group, Card, Code Block, Data Table, Description List, Empty State, Filter Bar, Kbd, Stat, Status Indicator, Table, Tag
- **Navigation:** Breadcrumb, Command Palette, Menubar, Nav List, Pagination, Tabs
- **Overlays:** Dialog, Drawer, Menu, Popover, Tooltip
- **Feedback:** Alert, Banner, Skeleton, Spinner, Toast
- **Patterns:** List → Detail → Edit, Master–Detail, Settings Page, Sign-in Page

## Not included

What Canon leaves to others, on purpose.

- **A JavaScript component library.** There's nothing to import or call, and no build step. Your framework or server renders the HTML.
- **Locked to its look.** The look lives in one stylesheet. Change its colors, or replace it with your own theme, and no page changes.
- **Utility classes.** Markup says what a thing is (`data-intent`), never how it looks: no "outline", "rounded" or "blue".
- **An app framework.** No routing, data loading or state. canon.js keeps the interface honest; saving and fetching are your app's.
- **For marketing sites.** Tables, forms, records and dashboards. Hero sections and pricing tables are out of scope.
- **A pile of effects.** Motion in the components explains a change, like a tab's indicator sliding across, or it isn't there.

## Origins

The name comes from fiction, where canon is the body of work officially accepted as authoritative within a story's universe. Here, the markup is canon. Themes can retell it however they like, but what the markup says stays true in all of them.

In 2003, Dave Shea published [CSS Zen Garden](https://csszengarden.com/): one HTML document, and a gallery of designs that changed nothing but the stylesheet. Each looked like a different site, and the markup never moved.

Canon is an homage to that page. It asks the same of the things internal tools are made of: write a table, a form or a dialog once, then let a theme redraw all of it without touching a line of HTML.

## Documentation

The reference is a set of HTML pages with a live example, a playground and the full specification for each component. To browse it, serve this folder and open the introduction:

```bash
python3 -m http.server 4174
```

Then go to <http://localhost:4174/reference/introduction.html>.

- [Introduction](reference/introduction.html)
- [Getting started](reference/getting-started.html)
- [Components](reference/components.html)
- [Themes](reference/themes.html)
