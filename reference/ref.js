/*
 * Reference page chrome. Not part of canon.
 *
 * - Loads Canon's stylesheet, applies the color scheme (?scheme=light|dark,
 *   else the one chosen last, else the system's) and the contract check
 *   (?debug). The top bar's controls change them in place, without a reload.
 * - A theme (?theme=canon|carbon|material|fluent|ant|bootstrap, else the one chosen last) restyles
 *   the content, not the top bar or the navigation: the Playground's preview
 *   is a page of its own, in an iframe; the rest of the content takes the
 *   theme's rules scoped to it.
 * - Stress modes for the fixtures (?long-text, ?rtl), from the search:
 *   every component's text longer and accented, or the page right to left.
 * - Renders the docs chrome: a top bar, the navigation (pages that exist),
 *   and "On this page" from the sections' headings.
 * - Frames each section's examples in a preview.
 * - Splits the main view into two tabs (?view=): the reference examples and
 *   a playground built from reference/playground/<page>.js.
 *
 * Everything lives in the URL, so any view is a shareable link. Load with a
 * plain <script src> in <head> so the theme stylesheet is render-blocking.
 */
(() => {
  /* Planned components. Those with a page are links; the rest are listed,
     marked "Soon" (and left out of Search). */
  const pages = {
    Introduction: "introduction.html",
    "Getting started": "getting-started.html",
    Themes: "themes.html",
    Components: "components.html",
    Build: "build.html",
    Button: "button.html",
    "Button Group": "button-group.html",
    "Split Button": "split-button.html",
    "Segmented Control": "segmented-control.html",
    Link: "link.html",
    "Toggle Chip": "toggle-chip.html",
    "Filter Bar": "filter-bar.html",
    Label: "label.html",
    "Text Input": "text-input.html",
    Textarea: "textarea.html",
    Time: "time.html",
    "Rich Text": "rich-text.html",
    Password: "password.html",
    "Number Input": "number-input.html",
    Select: "select.html",
    Combobox: "combobox.html",
    Field: "field.html",
    Fieldset: "fieldset.html",
    "Form Layout": "form-layout.html",
    "Save Bar": "save-bar.html",
    "List → Detail → Edit": "list-detail-edit.html",
    "Master–Detail": "master-detail.html",
    "Settings Page": "settings-page.html",
    "Sign-in Page": "sign-in-page.html",
    Checkbox: "checkbox.html",
    Radio: "radio.html",
    Switch: "switch.html",
    Slider: "slider.html",
    "Range Slider": "range-slider.html",
    "Color Picker": "color-picker.html",
    Swatches: "swatches.html",
    "Input OTP": "input-otp.html",
    "Form Repeater": "form-repeater.html",
    "Date family": "date.html",
    Menu: "menu.html",
    Popover: "popover.html",
    Dialog: "dialog.html",
    Drawer: "drawer.html",
    "Command Palette": "command-palette.html",
    Menubar: "menubar.html",
    "Nav List": "nav-list.html",
    Breadcrumb: "breadcrumb.html",
    Tabs: "tabs.html",
    Pagination: "pagination.html",
    "App Shell": "app-shell.html",
    Sidebar: "sidebar.html",
    "Top Bar": "top-bar.html",
    "Page Header": "page-header.html",
    Section: "section.html",
    "Split Pane": "split-pane.html",
    "Stack / Cluster / Grid": "stack.html",
    Card: "card.html",
    Toolbar: "toolbar.html",
    Tooltip: "tooltip.html",
    Toast: "toast.html",
    Kbd: "kbd.html",
    "Code Block": "code-block.html",
    Avatar: "avatar.html",
    "Avatar Group": "avatar-group.html",
    Table: "table.html",
    "Description List": "description-list.html",
    "Data Table": "data-table.html",
    "Empty State": "empty-state.html",
    Skeleton: "skeleton.html",
    Tag: "tag.html",
    "Stat": "stat.html",
    "Status Indicator": "status.html",
    Accordion: "accordion.html",
    Alert: "alert.html",
    Banner: "banner.html",
    Spinner: "spinner.html",
    Separator: "separator.html",
  };
  const components = {
    "Getting started": ["Introduction", "Getting started", "Themes", "Components", "Build"],
    Layout: ["App Shell", "Page Header", "Section", "Separator", "Sidebar", "Split Pane", "Stack / Cluster / Grid", "Toolbar", "Top Bar"],
    Actions: ["Button", "Button Group", "Link", "Segmented Control", "Split Button", "Toggle Chip"],
    Forms: ["Checkbox", "Color Picker", "Combobox", "Date family", "Field", "Fieldset", "File / Dropzone", "Form Layout", "Form Repeater", "Input OTP", "Label", "Number Input", "Password", "Radio", "Range Slider", "Rich Text", "Save Bar", "Select", "Slider", "Swatches", "Switch", "Text Input", "Textarea", "Time"],
    "Data display": ["Accordion", "Avatar", "Avatar Group", "Card", "Code Block", "Data Table", "Description List", "Empty State", "Filter Bar", "Kbd", "Meter / Progress", "Rating", "Stat", "Status Indicator", "Table", "Tag", "Timeline", "Tree View"],
    Navigation: ["Breadcrumb", "Command Palette", "Menubar", "Nav List", "Pagination", "Steps", "Tabs"],
    Overlays: ["Dialog", "Drawer", "Menu", "Popover", "Tooltip"],
    Feedback: ["Alert", "Banner", "Skeleton", "Spinner", "Status Pages", "Toast"],
    Patterns: ["List → Detail → Edit", "Master–Detail", "Settings Page", "Sign-in Page", "Wizard"],
  };

  /* Each component's tier, as its specification gives it: what it needs
     beyond HTML and CSS. Two when its parts differ (a Button is T0, its
     toggle and copy T2). */
  const tiers = {
    "app-shell.html": "T0/T2",
    "page-header.html": "T0/T2",
    "section.html": "T0",
    "separator.html": "T0",
    "sidebar.html": "T0/T2",
    "split-pane.html": "T0/T2",
    "stack.html": "T0",
    "toolbar.html": "T0",
    "top-bar.html": "T0/T2",
    "button.html": "T0/T2",
    "button-group.html": "T0",
    "link.html": "T0",
    "segmented-control.html": "T0",
    "split-button.html": "T1",
    "toggle-chip.html": "T0",
    "checkbox.html": "T0",
    "color-picker.html": "T2",
    "combobox.html": "T2",
    "date.html": "T2",
    "field.html": "T0",
    "fieldset.html": "T0",
    "form-layout.html": "T0",
    "form-repeater.html": "T2",
    "input-otp.html": "T2",
    "label.html": "T0",
    "number-input.html": "T2",
    "password.html": "T0/T2",
    "radio.html": "T0",
    "range-slider.html": "T0/T2",
    "rich-text.html": "T2",
    "save-bar.html": "T0/T2",
    "select.html": "T0/T1",
    "slider.html": "T0",
    "swatches.html": "T0",
    "switch.html": "T0",
    "text-input.html": "T0",
    "textarea.html": "T0",
    "time.html": "T2",
    "accordion.html": "T0",
    "avatar.html": "T0",
    "avatar-group.html": "T0",
    "card.html": "T0",
    "code-block.html": "T0/T2",
    "data-table.html": "T2",
    "description-list.html": "T0",
    "empty-state.html": "T0",
    "filter-bar.html": "T2",
    "kbd.html": "T0",
    "stat.html": "T0",
    "status.html": "T0",
    "table.html": "T0",
    "tag.html": "T0",
    "breadcrumb.html": "T0",
    "command-palette.html": "T3",
    "menubar.html": "T1",
    "nav-list.html": "T0/T2",
    "pagination.html": "T0/T2",
    "tabs.html": "T0/T2",
    "dialog.html": "T1",
    "drawer.html": "T1",
    "menu.html": "T1",
    "popover.html": "T1",
    "tooltip.html": "T1",
    "alert.html": "T0/T2",
    "banner.html": "T0/T2",
    "skeleton.html": "T0",
    "spinner.html": "T0",
    "toast.html": "T2",
  };
  const tierMeaning = {
    T0: "HTML and CSS only: it works without canon.js.",
    T1: "The browser's own features: popovers, dialogs, commands. canon.js fills them in where a browser lacks one.",
    T2: "Works without JavaScript, and canon.js adds more: keyboard, live values, behavior.",
    T3: "Needs JavaScript.",
  };

  /* Other words people search a page by. */
  const keywords = { Stat: "KPI metric", "Stack / Cluster / Grid": "layout spacing gap columns" };

  const params = new URLSearchParams(location.search);
  /* The page's state in its URL: the query only when there's some, the
     section (#…) kept. */
  const save = () => {
    const query = params.toString();
    history.replaceState(history.state, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
  };
  /* The content's theme: the URL's, else the one chosen last (this browser),
     else Canon's. Each is a folder in css/, named for it, holding its
     stylesheet. The top bar and the navigation are always in Canon's. */
  const themes = { canon: "Canon", carbon: "Carbon-inspired", material: "Material-inspired", fluent: "Fluent-inspired", ant: "Ant Design-inspired", bootstrap: "Bootstrap-inspired" };
  const storedTheme = (() => {
    try { return localStorage.getItem("canon-docs-theme"); } catch { return null; }
  })();
  const chosenTheme = Object.hasOwn(themes, params.get("theme") ?? "") ? params.get("theme") : Object.hasOwn(themes, storedTheme ?? "") ? storedTheme : "canon";
  const themeHref = (theme) => `../css/${theme}/${theme}.css`;
  let previewDocument = null;
  /* What a theme restyles on the page itself: the reference, or the whole
     page where there are no tabs, and toasts, which canon.js puts in the body. */
  const themedContent = ":is(#ref-panel-reference, .ref-page:not(:has(#ref-panel-reference)), body > .canon-toaster)";
  /* The tokens Canon works out on :root from others: scoped again, or they
     would inherit Canon's values. */
  const derivedTokens = () => {
    const found = [];
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule instanceof CSSImportRule) {
          /* Only canon.core.css: a font service's sheet can't be read. */
          if (rule.href.endsWith("canon.core.css")) walk(rule.styleSheet.cssRules);
        }
        else if (rule instanceof CSSLayerBlockRule) walk(rule.cssRules);
        else if (rule.selectorText?.includes(":root")) {
          for (const name of rule.style) {
            const value = rule.style.getPropertyValue(name);
            if (name.startsWith("--") && value.includes("var(")) found.push(`${name}: ${value};`);
          }
        }
      }
    };
    walk(document.getElementById("ref-theme").sheet.cssRules);
    return found.join(" ");
  };
  /* The theme's stylesheet, its one canon.theme block in an @scope (which adds
     no specificity, so its rules meet Canon's as they would on a page of its
     own) and its URLs made absolute. A theme is built on canon.css, already here. */
  const themeContent = async (theme) => {
    let style = document.getElementById("ref-content-theme");
    if (!style) style = document.head.appendChild(Object.assign(document.createElement("style"), { id: "ref-content-theme" }));
    if (theme === "canon") {
      style.textContent = "";
      return;
    }
    const url = new URL(themeHref(theme), location.href);
    const text = (await (await fetch(url)).text())
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/@import[^;]*;/g, "")
      .replace(/url\("(?!data:|https?:)([^"]+)"\)/g, (_, path) => `url("${new URL(path, url)}")`);
    const open = "@layer canon.theme {";
    const at = text.indexOf(open);
    const rules = text.slice(at + open.length, text.lastIndexOf("}")).replaceAll(":root", ":scope");
    style.textContent = `${text.slice(0, at)}\n@layer canon.theme { @scope (${themedContent}) { :scope { ${derivedTokens()} color: var(--canon-theme-ink); } ${rules} } }`;
  };
  /* Held back until its theme is in, so the page doesn't flash Canon's. */
  if (chosenTheme !== "canon") document.write(`<style id="ref-theme-hold">.ref-page { visibility: hidden; }</style>`);
  document.write(`<link rel="stylesheet" id="ref-theme" href="${themeHref("canon")}">`);
  document.write(`<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">`);

  /* The color scheme: the URL's, else the one chosen last (this browser),
     else the system's. Set before the page draws, so it doesn't flash. */
  const storedScheme = (() => {
    try { return localStorage.getItem("canon-docs-scheme"); } catch { return null; }
  })();
  const chosenScheme = ["light", "dark"].includes(params.get("scheme")) ? params.get("scheme") : ["light", "dark"].includes(storedScheme) ? storedScheme : "";
  if (chosenScheme) document.documentElement.style.colorScheme = chosenScheme;
  if (params.has("debug")) document.write(`<link rel="stylesheet" id="ref-debug" href="../css/canon.debug.css"><script src="../js/canon.debug.js" defer></script>`);

  /* The syntax highlighter (twinkleplop) for the playground's HTML and the
     code in the notes. Pages work without it. */
  const twinkleplop = import("https://cdn.jsdelivr.net/npm/@twinkleplop/html@0.1.7/+esm");
  twinkleplop.catch(() => {});

  const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  document.addEventListener("DOMContentLoaded", () => {
    const page = location.pathname.split("/").pop();
    const release = () => document.getElementById("ref-theme-hold")?.remove();
    if (chosenTheme === "canon") release();
    else {
      const link = document.getElementById("ref-theme");
      const ready = link.sheet ? Promise.resolve() : new Promise((done) => link.addEventListener("load", done, { once: true }));
      ready.then(() => themeContent(chosenTheme)).catch(() => {}).finally(release);
    }

    /* The component's tier beside its title: a Tag each, its meaning in a
       Tooltip on hover or focus. */
    const title = document.querySelector(".ref-page > h1");
    if (title && tiers[page]) {
      const holder = document.createElement("span");
      holder.className = "ref-tiers";
      tiers[page].split("/").forEach((tier, i) => {
        const id = `ref-tier-${i}`;
        holder.insertAdjacentHTML("beforeend", `<button type="button" class="ref-tier" interestfor="${id}" aria-describedby="${id}"><span class="canon-tag" data-size="sm"><span class="canon-tag-label">${tier}</span></span></button>`);
        document.body.insertAdjacentHTML("beforeend", `<div class="canon-tooltip" id="${id}" popover="hint" role="tooltip" data-placement="block-end">${tier}: ${tierMeaning[tier]}</div>`);
      });
      title.append(" ", holder);
    }

    /* ------------------------------------------------------------------ */
    /* Chrome: top bar, navigation, "On this page"                         */
    /* ------------------------------------------------------------------ */

    const LOGO = `<svg class="ref-logo" viewBox="0 0 192 192.001" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M96 0.000976562C149.019 0.000976562 192 42.9816 192 96.001C192 149.02 149.019 192.001 96 192.001C42.9808 192.001 0.000263922 149.02 0 96.001C0 42.9816 42.9807 0.000976562 96 0.000976562ZM71.707 51.875C63.0173 60.3248 59.8471 72.9595 63.5186 84.5107L95.998 186.696L101.198 176.648L95.4434 158.541L113.326 141.151C122.016 132.702 125.186 120.068 121.515 108.517L109.33 70.1826L86.458 77.4521L105.695 58.7461L96.002 28.25L71.707 51.875Z"/></svg>`;
    const introduction = pages.Introduction;

    const top = document.createElement("header");
    top.className = "ref-top";
    top.innerHTML = `
      <button type="button" class="ref-top-menu canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon" aria-expanded="false" aria-controls="ref-nav">
        <span class="canon-icon" data-icon="list" aria-hidden="true"></span><span class="canon-button-label">Menu</span>
      </button>
      <a class="ref-brand" href="${introduction}" data-page="${introduction}">${LOGO}<span>Canon</span></a>
      <div class="ref-top-tools">
        <div class="canon-select ref-theme-select" data-size="sm">
          <select aria-label="Theme">
            ${Object.entries(themes).map(([value, name]) => `<option value="${value}"${value === chosenTheme ? " selected" : ""}>${name}</option>`).join("")}
          </select>
        </div>
        <button type="button" class="canon-button ref-search" data-emphasis="low" data-intent="neutral" data-size="sm" commandfor="ref-palette" command="show-modal" aria-label="Search" aria-keyshortcuts="Meta+K Control+K">
          <span class="canon-icon" data-icon="search" aria-hidden="true"></span><span class="canon-button-label">Search</span><kbd class="canon-kbd" aria-hidden="true">⌘K</kbd>
        </button>
        <button type="button" class="canon-button ref-scheme-toggle" data-emphasis="minimal" data-intent="neutral" data-display="icon" data-size="sm" aria-pressed="false">
          <span class="canon-icon" data-icon="moon" aria-hidden="true"></span><span class="canon-button-label">Dark mode</span>
        </button>
      </div>`;

    /* The navigation: every page in one list, getting started first and
       the patterns last. */
    const aside = document.createElement("aside");
    aside.className = "ref-aside";
    aside.id = "ref-nav";
    /* Narrow, the navigation is a drawer: the brand at its top, then the pages. */
    aside.innerHTML = `
      <div class="ref-aside-head"><a class="ref-brand" href="${introduction}" data-page="${introduction}">${LOGO}<span>Canon</span></a></div>
      <nav class="ref-nav" aria-label="Documentation">
        ${Object.entries(components).map(([group, names]) => `
        <h2>${group}</h2>
        <ul>
          ${names.map((name) => pages[name]
            ? `<li><a href="${pages[name]}" data-page="${pages[name]}"${pages[name] === page ? ' aria-current="page"' : ""}>${name}</a></li>`
            : `<li><span class="ref-nav-soon">${name}<span class="canon-tag" data-size="xs" data-emphasis="low"><span class="canon-tag-label">Soon</span></span></span></li>`).join("")}
        </ul>`).join("")}
      </nav>`;
    document.body.classList.add("ref-layout");
    /* Search: Canon's Command Palette, over every page, and the docs'
       own actions (the color scheme, the contract check). */
    const groupId = (group) => `ref-palette-${group.toLowerCase().replace(/[^a-z]+/g, "-")}`;
    const palette = document.createElement("dialog");
    palette.className = "canon-command-palette";
    palette.id = "ref-palette";
    palette.setAttribute("aria-label", "Search the docs");
    palette.innerHTML = `
      <div class="canon-command-search">
        <span class="canon-icon" data-icon="search" aria-hidden="true"></span>
        <input type="search" aria-label="Search pages and actions" placeholder="Search pages and actions">
      </div>
      <div class="canon-command-list">
        ${Object.entries(components)
          .map(([group, names]) => [group, names.filter((name) => pages[name])])
          .filter(([, names]) => names.length)
          .map(([group, names]) => `
        <div class="canon-command-group" aria-labelledby="${groupId(group)}">
          <p class="canon-command-heading" id="${groupId(group)}">${group}</p>
          ${names.map((name) => `<a class="canon-command-item" href="${pages[name]}" data-page="${pages[name]}"${keywords[name] ? ` data-keywords="${keywords[name]}"` : ""}><span class="canon-command-label">${name}</span></a>`).join("")}
        </div>`).join("")}
        <div class="canon-command-group" aria-labelledby="ref-palette-actions">
          <p class="canon-command-heading" id="ref-palette-actions">Actions</p>
          <button type="button" class="canon-command-item" data-action="scheme"><span class="canon-icon" data-icon="moon" aria-hidden="true"></span><span class="canon-command-label">Switch to dark mode</span></button>
          <button type="button" class="canon-command-item" data-action="debug" data-keywords="debug lint validate"><span class="canon-icon" data-icon="circle-check" aria-hidden="true"></span><span class="canon-command-label">Turn contract check on</span></button>
          <button type="button" class="canon-command-item" data-action="long-text" data-keywords="stress worst case translation pseudo localization"><span class="canon-icon" data-icon="text-wrap" aria-hidden="true"></span><span class="canon-command-label">Turn long text on</span></button>
          <button type="button" class="canon-command-item" data-action="rtl" data-keywords="stress right to left arabic hebrew direction"><span class="canon-icon" data-icon="align-end" aria-hidden="true"></span><span class="canon-command-label">Turn right to left on</span></button>
        </div>
      </div>`;
    document.body.prepend(top, aside);
    document.body.append(palette);

    /* Links carry the current settings and view (not the playground's
       state): from a Playground, another component opens on its
       Playground. A page without one shows its reference. */
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[data-page]");
      if (!link || !(top.contains(link) || aside.contains(link) || palette.contains(link))) return;
      const carry = new URLSearchParams(params);
      for (const key of [...carry.keys()]) if (key.startsWith("p.")) carry.delete(key);
      const query = String(carry);
      link.href = query ? `${link.dataset.page}?${query}` : link.dataset.page;
    });

    /* Narrow: the navigation is a drawer the Menu button opens, as an App
       Shell's sidebar is: focus goes to the current page; Escape, a click
       beside it or focus leaving it closes it (Escape returns focus to the
       button). */
    const menu = top.querySelector(".ref-top-menu");
    const narrow = matchMedia("(max-width: 56rem)");
    const navOpen = () => document.body.hasAttribute("data-nav-open");
    /* Wide: the current page in view in the list (a pattern is near its end). */
    const current = aside.querySelector('.ref-nav [aria-current="page"]');
    if (current && !narrow.matches) {
      const room = aside.getBoundingClientRect();
      const at = current.getBoundingClientRect();
      if (at.bottom > room.bottom - 48 || at.top < room.top) aside.scrollTop += at.top - room.top - room.height / 2 + at.height / 2;
    }

    const setNav = (open, refocus = false) => {
      menu.setAttribute("aria-expanded", String(open));
      document.body.toggleAttribute("data-nav-open", open);
      if (open) {
        const here = aside.querySelector('.ref-nav [aria-current="page"]') ?? aside.querySelector(".ref-nav a");
        here?.scrollIntoView({ block: "center" });
        here?.focus({ preventScroll: true });
      } else if (refocus) menu.focus();
    };
    menu.addEventListener("click", () => setNav(!navOpen()));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navOpen()) setNav(false, true);
    });
    document.addEventListener("click", (event) => {
      if (navOpen() && !aside.contains(event.target) && !menu.contains(event.target)) setNav(false);
    });
    aside.addEventListener("focusout", (event) => {
      if (navOpen() && event.relatedTarget && !aside.contains(event.relatedTarget) && !menu.contains(event.relatedTarget)) setNav(false);
    });
    narrow.addEventListener("change", () => { if (!narrow.matches && navOpen()) setNav(false); });

    /* Color scheme: a toggle between light and dark, starting from the
       system's; remembered in this browser and carried in the URL. */
    const schemeToggle = top.querySelector(".ref-scheme-toggle");
    const systemDark = matchMedia("(prefers-color-scheme: dark)");
    const currentScheme = () => document.documentElement.style.colorScheme || (systemDark.matches ? "dark" : "light");
    const paintToggle = () => {
      const dark = currentScheme() === "dark";
      schemeToggle.setAttribute("aria-pressed", String(dark));
      schemeToggle.querySelector(".canon-icon").dataset.icon = dark ? "sun" : "moon";
    };
    paintToggle();
    systemDark.addEventListener("change", paintToggle);
    const setScheme = (scheme) => {
      document.documentElement.style.colorScheme = scheme;
      if (previewDocument) previewDocument.documentElement.style.colorScheme = scheme;
      params.set("scheme", scheme);
      try { localStorage.setItem("canon-docs-scheme", scheme); } catch {}
      save();
      paintToggle();
    };
    /* Button flips aria-pressed first: it says what to show now. */
    schemeToggle.addEventListener("click", () => setScheme(schemeToggle.getAttribute("aria-pressed") === "true" ? "dark" : "light"));

    /* Theme: the content in another stylesheet, swapped in place; remembered
       in this browser and carried in the URL. */
    top.querySelector(".ref-theme-select select").addEventListener("change", (event) => {
      const theme = event.target.value;
      themeContent(theme).catch(() => {});
      if (previewDocument) previewDocument.getElementById("ref-theme").href = themeHref(theme);
      params.set("theme", theme);
      try { localStorage.setItem("canon-docs-theme", theme); } catch {}
      save();
    });

    /* Contract check: canon.debug.css, on or off (from the search, or ?debug). */
    const setDebug = (on) => {
      document.getElementById("ref-debug")?.remove();
      if (on) {
        params.set("debug", "");
        document.head.append(Object.assign(document.createElement("link"), {
          rel: "stylesheet", id: "ref-debug", href: "../css/canon.debug.css",
        }));
        /* Its warnings: once loaded, they follow the stylesheet. */
        if (!document.querySelector('script[src$="canon.debug.js"]')) {
          document.head.append(Object.assign(document.createElement("script"), { src: "../js/canon.debug.js" }));
        }
      } else params.delete("debug");
      if (previewDocument) {
        previewDocument.getElementById("ref-debug")?.remove();
        if (on) {
          previewDocument.head.append(Object.assign(previewDocument.createElement("link"), {
            rel: "stylesheet", id: "ref-debug", href: "../css/canon.debug.css",
          }));
          if (!previewDocument.querySelector('script[src$="canon.debug.js"]')) {
            previewDocument.head.append(Object.assign(previewDocument.createElement("script"), { src: "../js/canon.debug.js" }));
          }
        }
      }
      save();
    };
    /* The palette's actions say what they'll do, whichever way things are now. */
    const paintActions = () => {
      const dark = currentScheme() === "dark";
      const scheme = palette.querySelector("[data-action='scheme']");
      scheme.querySelector(".canon-icon").dataset.icon = dark ? "sun" : "moon";
      scheme.querySelector(".canon-command-label").textContent = dark ? "Switch to light mode" : "Switch to dark mode";
      palette.querySelector("[data-action='debug'] .canon-command-label").textContent = params.has("debug") ? "Turn contract check off" : "Turn contract check on";
      palette.querySelector("[data-action='long-text'] .canon-command-label").textContent = params.has("long-text") ? "Turn long text off" : "Turn long text on";
      palette.querySelector("[data-action='rtl'] .canon-command-label").textContent = params.has("rtl") ? "Turn right to left off" : "Turn right to left on";
    };
    paintActions();
    palette.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action === "scheme") setScheme(currentScheme() === "dark" ? "light" : "dark");
      if (action === "debug") setDebug(!params.has("debug"));
      /* Stress modes rewrite the fixtures: the page loads again. */
      if (action === "long-text" || action === "rtl") {
        if (params.has(action)) params.delete(action);
        else params.set(action, "");
        save();
        location.reload();
      }
      if (action) setTimeout(paintActions);
    });
    palette.addEventListener("toggle", paintActions);

    /* ------------------------------------------------------------------ */
    /* Browser support: what this browser lacks, said where it matters     */
    /* ------------------------------------------------------------------ */

    const supported = (test) => { try { return test(); } catch { return false; } };
    const missingEssentials = [
      ["cascade layers", () => "CSSLayerBlockRule" in window],
      [":has()", () => CSS.supports("selector(:has(*))")],
      ["light-dark()", () => CSS.supports("color", "light-dark(red, red)")],
      ["container queries", () => CSS.supports("container-type: inline-size")],
      ["popovers", () => "popover" in HTMLElement.prototype],
      ["dialogs", () => "showModal" in HTMLDialogElement.prototype],
    ].filter(([, test]) => !supported(test)).map(([name]) => name);
    const enhancements = {
      anchoring: supported(() => CSS.supports("anchor-name: --a")),
      "customizable-select": supported(() => CSS.supports("appearance: base-select")),
      "scroll-state": supported(() => CSS.supports("container-type: scroll-state")),
    };
    const pageNotes = {
      "select.html": ["customizable-select", "This browser shows its own list",
        "Where customizable selects are supported (Chrome and Edge for now), the list a Select opens is drawn in Canon's look. Here it's the browser's own: it works the same and looks like the system's."],
      "page-header.html": ["scroll-state", "No line under a stuck header in this browser",
        "A sticky Page Header draws a line under itself once it's stuck, with a scroll-state container query (Chrome and Edge for now). Here it sticks the same, without the line."],
      "save-bar.html": ["scroll-state", "No line over a stuck bar in this browser",
        "A Save Bar draws a line over itself once it sticks to the bottom of the window, with a scroll-state container query (Chrome and Edge for now). Here it sticks the same, without the line."],
    };
    const dismissedKey = "canon-docs-dismissed";
    const dismissed = () => { try { return (localStorage.getItem(dismissedKey) ?? "").split(" "); } catch { return []; } };
    const notice = (key, intent, title, description) => {
      if (dismissed().includes(key)) return;
      const alert = document.createElement("div");
      alert.className = "canon-alert ref-support";
      alert.dataset.intent = intent;
      alert.innerHTML = `<p class="canon-alert-title"></p><p class="canon-alert-description"></p><button type="button" class="canon-alert-close"></button>`;
      alert.querySelector(".canon-alert-title").textContent = title;
      alert.querySelector(".canon-alert-description").textContent = description;
      alert.addEventListener("canon-dismiss", () => {
        try { localStorage.setItem(dismissedKey, [...new Set([...dismissed(), key])].join(" ").trim()); } catch {}
      });
      const slot = document.getElementById("ref-controls");
      const lead = document.querySelector(".ref-page > h1 + p.ref-note") ?? document.querySelector(".ref-page > h1");
      if (slot) slot.before(alert);
      else lead?.after(alert);
    };
    if (missingEssentials.length) {
      notice("essentials", "warning", "This browser is too old for Canon",
        `It lacks ${missingEssentials.join(", ")}, which Canon needs, so these pages may look broken or not work. Canon supports current versions of Chrome, Edge, Firefox and Safari.`);
    } else {
      if (!enhancements.anchoring) {
        notice("anchoring", "info", "canon.js places popovers in this browser",
          "This browser doesn't support CSS anchor positioning yet, so canon.js places menus, popovers, lists and tooltips itself. They open in the same places; a tooltip's arrow may not point exactly at what it describes.");
      }
      const [feature, title, description] = pageNotes[page] ?? [];
      if (feature && !enhancements[feature]) notice(feature, "info", title, description);
    }

    /* ------------------------------------------------------------------ */
    /* Examples: each run of demos in a section, framed as a preview       */
    /* ------------------------------------------------------------------ */

    /* Prose, and what reads as part of it (.ref-plain: a code sample, a
       table of facts), stays out of the frames. */
    const prose = (node) => node.matches("h2, h3, p.ref-note, script, template, style, .ref-plain") && !node.matches(".ref-example");
    for (const section of document.querySelectorAll(".ref-page .ref-section")) {
      let frame = null;
      for (const node of [...section.children]) {
        if (prose(node)) {
          if (!node.matches("script, template, style")) frame = null;
          continue;
        }
        if (!frame) {
          frame = document.createElement("div");
          frame.className = "ref-example";
          node.before(frame);
        }
        frame.append(node);
      }
    }
    /* A resizable demo alone in its frame: the frame is what you drag,
       with its padding, not a box in it. A .ref-resizable box gives way to
       its content, the frame starting at the box's width (inline, or its
       narrow / wide class); a resizable page-like demo (.ref-resize) fills
       the frame edge to edge. */
    for (const frame of document.querySelectorAll(".ref-example")) {
      const shown = [...frame.children].filter((child) => !child.matches("dialog, [popover], template, script, style"));
      if (shown.length !== 1) continue;
      const [demo] = shown;
      if (demo.matches(".ref-resizable")) {
        const width = demo.style.inlineSize || (demo.matches(".ref-resizable-wide") ? "40rem" : demo.matches(".ref-resizable-narrow") ? "24rem" : "36rem");
        frame.style.setProperty("--ref-resizable-size", width);
        frame.setAttribute("data-resizable", "");
        demo.replaceWith(...demo.childNodes);
      } else if (demo.matches(".ref-resize")) {
        if (demo.style.inlineSize) frame.style.setProperty("--ref-resizable-size", demo.style.inlineSize);
        demo.style.removeProperty("inline-size");
        demo.classList.remove("ref-resize");
        frame.setAttribute("data-resizable", "");
      }
    }
    /* A frame holding only page-like demos (an app, a pane, a bar, a
       page's header or section) lets them fill the preview edge to edge:
       one frame, not a frame in a frame. */
    /* Demos stacked in a frame stand apart: a block that follows another
       with no margin between them takes the frame's gap. Inline demos (a
       row of buttons) and those with their own spacing are left alone. */
    for (const frame of document.querySelectorAll(".ref-example")) {
      const shown = [...frame.children].filter((child) => !child.matches("dialog, [popover], template, script, style") && getComputedStyle(child).display !== "none");
      shown.forEach((child, index) => {
        const before = shown[index - 1];
        if (!before) return;
        const block = (element) => !getComputedStyle(element).display.startsWith("inline");
        const touching = parseFloat(getComputedStyle(before).marginBlockEnd) === 0 && parseFloat(getComputedStyle(child).marginBlockStart) === 0;
        if (block(before) && block(child) && touching) child.classList.add("ref-apart");
      });
    }
    /* The contract check's warnings about a demo go right after its frame. */
    for (const frame of document.querySelectorAll(".ref-example")) frame.dataset.canonDebug = "after";
    const pageLike = ":is(.ref-shell-frame, .ref-split-frame, .ref-top-bar-frame, .ref-page-header-frame, .ref-section-demo, .ref-auth-frame):not(.ref-resize)";
    for (const frame of document.querySelectorAll(".ref-example")) {
      /* Closed dialogs and popovers take no place. */
      const shown = [...frame.children].filter((child) => !child.matches("dialog, [popover]"));
      if (shown.length && shown.every((child) => child.matches(pageLike))) frame.setAttribute("data-flush", "");
    }

    /* ------------------------------------------------------------------ */
    /* Tabs: Reference / Playground                                        */
    /* ------------------------------------------------------------------ */

    /* A page without the slot (a pattern) has no playground: no tabs. */
    const slot = document.getElementById("ref-controls");
    if (slot) {
    const reference = document.createElement("div");
    reference.id = "ref-panel-reference";
    reference.setAttribute("role", "tabpanel");
    reference.setAttribute("aria-labelledby", "ref-tab-reference");
    while (slot.nextSibling) reference.append(slot.nextSibling);

    const playground = document.createElement("div");
    playground.id = "ref-panel-playground";
    playground.setAttribute("role", "tabpanel");
    playground.setAttribute("aria-labelledby", "ref-tab-playground");

    const tabs = document.createElement("div");
    tabs.className = "ref-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.innerHTML = `
      <button type="button" role="tab" id="ref-tab-reference" aria-controls="ref-panel-reference" data-view="reference">Reference</button>
      <button type="button" role="tab" id="ref-tab-playground" aria-controls="ref-panel-playground" data-view="playground">Playground</button>`;
    /* Wide, the view switch sits in the top bar, at the start of the
       page's column: the same place in both views, and in reach while the
       reference scrolls, the page's name before it (on the Playground the
       page's own heading stays, for screen readers). Narrow, the
       switch stays above the views. */
    slot.replaceWith(tabs, reference, playground);
    const topBar = document.querySelector(".ref-top");
    const wideView = matchMedia("(min-width: 56.0625rem)");
    const topPage = document.createElement("div");
    topPage.className = "ref-top-page";
    const topTitle = document.createElement("span");
    topTitle.className = "ref-top-title";
    topTitle.setAttribute("aria-hidden", "true");
    /* The title's words, without its tier tags. */
    const titleWords = document.querySelector(".ref-page > h1")?.cloneNode(true);
    titleWords?.querySelector(".ref-tiers")?.remove();
    topTitle.textContent = titleWords?.textContent.trim() ?? "";
    const placeTabs = () => {
      if (wideView.matches && topBar) {
        topPage.append(topTitle, tabs);
        topBar.append(topPage);
      } else {
        reference.before(tabs);
        topPage.remove();
      }
    };
    placeTabs();
    wideView.addEventListener("change", placeTabs);

    const showView = (view) => {
      for (const tab of tabs.querySelectorAll("[role=tab]")) {
        const selected = tab.dataset.view === view;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      }
      reference.hidden = view !== "reference";
      playground.hidden = view !== "playground";
      document.body.dataset.view = view;
    };
    tabs.addEventListener("click", (event) => {
      const tab = event.target.closest("[role=tab]");
      if (!tab) return;
      if (tab.dataset.view === "reference") params.delete("view");
      else params.set("view", tab.dataset.view);
      save();
      showView(tab.dataset.view);
    });
    tabs.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const next = tabs.querySelector("[role=tab][aria-selected=false]");
      next.focus();
      next.click();
    });
    showView(params.get("view") === "playground" ? "playground" : "reference");


    /* A demo that would run past the window (a two-month calendar on a
       phone) scrolls in place, as a wide table does in its frame, so the
       page itself never scrolls sideways. A small overhang that stays in
       the gutter (a slider's value at the end) is left alone. Checked
       again whenever the panel or the window resizes, which includes the
       panel being shown. */
    const demos = reference.querySelectorAll(".ref-example > :not(.canon-table, .canon-data-table)");
    const contain = () => {
      for (const demo of demos) demo.classList.remove("ref-scroll");
      const page = document.documentElement.clientWidth;
      const wide = [...demos].filter((demo) => {
        const overflow = demo.scrollWidth - demo.clientWidth;
        const { left, right } = demo.getBoundingClientRect();
        return overflow > 1 && (getComputedStyle(demo).direction === "rtl" ? left - overflow < 0 : right + overflow > page);
      });
      for (const demo of wide) demo.classList.add("ref-scroll");
    };
    const containObserver = new ResizeObserver(contain);
    containObserver.observe(reference);
    containObserver.observe(document.documentElement);

    /* Static popovers: open each one against its anchor (a .ref-anchor, or
       a real trigger carrying data-ref-opens), so theme
       authors see every placement at once (after the panels are built:
       moving an open popover closes it). Anchor positioning keeps the last
       placement that fit, so one opened off screen, or before a scroll or
       resize, may stay flipped. They (re)open when their anchor comes into
       view and after each scroll or resize. */
    const visible = new Set();
    const open = (anchor) => {
      const popover = document.getElementById(anchor.dataset.refOpens);
      if (!popover) return;
      if (popover.matches(":popover-open")) popover.hidePopover();
      if (visible.has(anchor)) popover.showPopover({ source: anchor });
    };
    const opener = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        if (isIntersecting) visible.add(target);
        else visible.delete(target);
        open(target);
      }
    });
    for (const anchor of document.querySelectorAll("[data-ref-opens]")) opener.observe(anchor);
    let reopenTimer;
    const reopen = () => {
      clearTimeout(reopenTimer);
      reopenTimer = setTimeout(() => visible.forEach(open), 150);
    };
    addEventListener("scrollend", reopen);
    addEventListener("resize", reopen);

    /* ------------------------------------------------------------------ */
    /* Code in the notes                                                   */
    /* ------------------------------------------------------------------ */

    /* Markup (<dialog>) is highlighted as HTML; attributes (data-size,
       aria-current="page") as they'd read inside a tag; custom properties
       (--canon-label-width) and classes (.canon-nav-list-item) as CSS's. Other words (sm, end) stay plain.
       Code inside the components themselves is left alone. */
    twinkleplop.then(({ language, tokenize }) => {
      const markup = language();
      const tokens = tokenize();
      const attributes = (text) => {
        const source = `<i ${text}>`;
        const end = 3 + text.length;
        const result = tokens(source);
        let html = "";
        let at = 3;
        for (let i = 0; i < result.tokens.length; i += 3) {
          const start = Math.max(result.tokens[i + 1], at);
          const stop = Math.min(result.tokens[i + 2], end);
          if (stop <= start) continue;
          html += escape(source.slice(at, start));
          html += `<span class="tok ${result.token_types[result.tokens[i]]}">${escape(source.slice(start, stop))}</span>`;
          at = stop;
        }
        return html + escape(source.slice(at, end));
      };
      for (const code of document.querySelectorAll(".ref-page code:not(.ref-code code, [class*='canon-'] code)")) {
        if (code.children.length) continue;
        const text = code.textContent;
        if (text.startsWith("<")) code.innerHTML = markup(text, { structure: "inline" });
        else if (/^(data-|aria-)[\w-]+$|^[a-z][\w-]*="[^"]*"(\s+[a-z][\w-]*(="[^"]*")?)*$/i.test(text)) code.innerHTML = attributes(text);
        else if (/^--[\w-]+$/.test(text)) code.innerHTML = `<span class="tok css_variable">${escape(text)}</span>`;
        else if (/^\.[a-z][\w-]*$/i.test(text)) code.innerHTML = `<span class="tok selector_class">${escape(text)}</span>`;
        code.classList.add("ref-code");
      }
    }).catch(() => {});

    /* ------------------------------------------------------------------ */
    /* Playground                                                          */
    /* ------------------------------------------------------------------ */

    import(`./playground/${page.replace(/\.html$/, ".js")}`)
      .then((module) => buildPlayground(playground, module))
      .catch(() => { playground.innerHTML = `<p class="ref-note">No playground for this component yet.</p>`; });
    }

    /* "On this page": the reference's sections, the one in view marked. */
    const scope = document.getElementById("ref-panel-reference") ?? document.querySelector(".ref-page");

    /* Stress modes. Long text: every component's text about 40% longer,
       accented, between ⟦ and ⟧ so a clipped end shows, as translated or
       real-world text can be; the page's notes, code and keys stay.
       Right to left: the fixtures mirrored. */
    if (params.has("rtl")) scope.dir = "rtl";
    if (params.has("long-text")) {
      const accents = { a: "á", c: "ç", e: "é", i: "í", n: "ñ", o: "ö", s: "š", u: "ü", y: "ý", z: "ž", A: "Å", C: "Ç", E: "É", I: "Î", N: "Ñ", O: "Ø", S: "Š", U: "Ü", Y: "Ý", Z: "Ž" };
      const filler = "ŵíŧĥ ëxŧřå ŵöřðš ŧö ŧëšŧ ŧĥé łåýöüŧ";
      const lengthen = (text) => {
        const core = text.trim();
        if (!/[A-Za-z]/.test(core)) return text;
        const lead = text.slice(0, text.indexOf(core));
        const trail = text.slice(lead.length + core.length);
        const extra = filler.slice(0, Math.max(3, Math.ceil(core.length * 0.4))).trim();
        return `${lead}⟦${core.replace(/[A-Za-z]/g, (letter) => accents[letter] ?? letter)} ${extra}⟧${trail}`;
      };
      const kept = ".ref-note, pre, code, kbd, script, style, textarea, .canon-kbd, .canon-code-block, .ref-playground, .ref-inspector";
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => (node.parentElement.closest("[class*='canon-']") && !node.parentElement.closest(kept) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
      });
      const texts = [];
      while (walker.nextNode()) texts.push(walker.currentNode);
      for (const node of texts) node.data = lengthen(node.data);
      for (const field of scope.querySelectorAll("[placeholder]")) if (!field.closest(kept)) field.placeholder = lengthen(field.placeholder);
    }
    const headings = [...scope.querySelectorAll(".ref-section[id] > h2")];
    if (headings.length > 1) {
      const toc = document.createElement("nav");
      toc.className = "ref-toc";
      toc.setAttribute("aria-label", "On this page");
      toc.innerHTML = `<p>On this page</p><ul>${headings.map((h) => `<li><a href="#${h.parentElement.id}">${h.textContent}</a></li>`).join("")}</ul>`;
      document.body.append(toc);
      const links = new Map([...toc.querySelectorAll("a")].map((a) => [a.hash.slice(1), a]));
      const seen = new Set();
      const observer = new IntersectionObserver((entries) => {
        for (const { target, isIntersecting } of entries) (isIntersecting ? seen.add(target.id) : seen.delete(target.id));
        const first = headings.map((h) => h.parentElement.id).find((id) => seen.has(id));
        for (const [id, a] of links) {
          if (id === first) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        }
      }, { rootMargin: "-72px 0px -55% 0px" });
      for (const h of headings) observer.observe(h.parentElement);
      const showToc = () => { toc.hidden = !scope.checkVisibility(); };
      showToc();
      document.querySelector(".ref-tabs")?.addEventListener("click", () => setTimeout(showToc));
    }

    function buildPlayground(panel, { controls, render, enhance, width: stageWidth }) {
      /* State from the URL (p.<name>), falling back to defaults. */
      const state = {};
      for (const control of controls) {
        const stored = params.get(`p.${control.name}`);
        if (control.type === "checkbox") state[control.name] = stored === null ? Boolean(control.default) : stored === "1";
        else state[control.name] = stored ?? String(control.default ?? "");
        /* A value the menu no longer offers (an old link) is the default. */
        if (control.type === "select" && !control.options.some((option) => String(Array.isArray(option) ? option[0] : option) === state[control.name])) {
          state[control.name] = String(control.default ?? "");
        }
      }

      /* Long lines in the HTML wrap while the toggle is pressed. Carried
         between pages. */
      const wrapped = params.has("wrap");

      /* The preview's width: the full canvas, or a frame of any width, set
         from the ruler's presets or by dragging the frame's sides. Carried
         between pages. */
      const presets = [["full", "Full width"], ["360", "Mobile"], ["720", "Tablet portrait"], ["1024", "Tablet landscape"], ["1280", "Desktop"]];
      const minWidth = 360;
      const asWidth = (value) => {
        const number = Number.parseInt(value, 10);
        return Number.isFinite(number) ? String(Math.max(minWidth, number)) : "full";
      };
      const width = asWidth(params.get("w"));

      const groups = [...new Set(controls.map((control) => control.group))];
      panel.innerHTML = `
        <div class="ref-playground">
          <div class="ref-pg-output">
            <div class="ref-pg-preview">
              <div class="ref-pg-ruler">
                <button type="button" class="ref-pg-width" id="ref-pg-width" popovertarget="ref-pg-presets" aria-haspopup="menu" aria-expanded="false">
                  <span class="canon-visually-hidden">Preview width: </span><span class="ref-pg-width-value"></span>
                </button>
                <div class="canon-menu" id="ref-pg-presets" popover role="menu" aria-labelledby="ref-pg-width" data-size="sm">
                  ${presets.map(([value, label]) => `
                  <button type="button" class="canon-menu-item" role="menuitemradio" aria-checked="${value === width}" data-width="${value}">
                    <span class="canon-menu-label">${label}</span>${value === "full" ? "" : `<span class="ref-pg-preset-size">${value}px</span>`}
                  </button>`).join("")}
                </div>
              </div>
              <div class="ref-pg-canvas" data-width="${width}">
                <div class="ref-pg-frame">
                  <span class="ref-pg-side" data-side="start" role="slider" tabindex="0" aria-label="Preview width" aria-valuemin="${minWidth}"></span>
                  <iframe class="ref-pg-view" title="Preview"></iframe>
                  <span class="ref-pg-side" data-side="end" role="slider" tabindex="0" aria-label="Preview width" aria-valuemin="${minWidth}"></span>
                </div>
              </div>
            </div>
            <div class="ref-pg-grip" role="separator" aria-orientation="horizontal" aria-label="Preview and HTML" aria-controls="ref-pg-code" tabindex="0"></div>
            <div class="ref-pg-code">
              <div class="ref-pg-bar">
                <label for="ref-pg-code">HTML</label>
                <span class="ref-pg-edited" hidden>
                  Edited
                  <button type="button" class="canon-button ref-pg-revert" data-emphasis="minimal" data-intent="neutral" data-size="sm">
                    <span class="canon-button-label">Revert</span>
                  </button>
                </span>
                <button type="button" class="canon-button ref-pg-wrap" data-emphasis="minimal" data-intent="neutral" data-display="icon" data-size="sm"
                        aria-pressed="${wrapped}">
                  <span class="canon-icon" data-icon="text-wrap" aria-hidden="true"></span>
                  <span class="canon-button-label">Wrap lines</span>
                </button>
                <button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon" data-size="sm"
                        commandfor="ref-pg-code" command="--canon-copy">
                  <span class="canon-icon" data-icon="copy" aria-hidden="true"></span>
                  <span class="canon-button-label">Copy HTML</span>
                </button>
              </div>
              <div class="ref-pg-editor"${wrapped ? " data-wrap" : ""}>
                <div class="ref-pg-highlight ref-code" aria-hidden="true"></div>
                <textarea id="ref-pg-code" class="ref-pg-source" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off"></textarea>
              </div>
            </div>
          </div>
        </div>`;

      /* The inspector's own small controls, as in a design tool. Each
         parameter gets the control that suits its options, unless the
         playground names one (widget):
         - meanings (data-intent's values): tiles, each its color and icon;
         - emphasis (high … minimal): tiles drawing the button it gives;
         - icons: the chosen one in a field that opens a grid of them;
         - an ordered scale (sm, md, lg; compact … spacious): a slider
           with a stop for each, the theme's choice its own stop only when
           it isn't one of them;
         - a few short options: a segmented control;
         - numbers: a field with − and +, its label dragged to scrub;
         - everything else: a menu, a text field or a switch.
         An option that would show nothing yet can be off, with its reason
         (unavailable).
         A label's note in parentheses ("Title (empty: none)") becomes the
         control's description and tooltip, or, for "empty: …", its
         placeholder. A changed parameter's label is in the text color. */
      const intents = ["neutral", "info", "success", "warning", "danger"];
      const emphases = ["high", "medium", "low", "minimal"];
      const scales = [["none", "xs", "sm", "md", "lg", "xl", "2xl"], ["compact", "comfortable", "spacious"]];
      const optionsOf = (control) => (control.options ?? []).map((option) => (Array.isArray(option) ? option : [option, option]).map(String));
      const defaultOf = (control) => control.type === "checkbox" ? Boolean(control.default) : String(control.default ?? "");
      /* An option's short name: "(theme decides)" is Auto, "(none: …)"
         None, "(medium)" medium, "error: aria-invalid…" error, "high
         (solid)" high. */
      function shortName(label) {
        const inner = label.match(/^\((.*)\)$/)?.[1];
        if (inner !== undefined) {
          const head = inner.split(":")[0].trim();
          if (/^(theme decides|default)\b/.test(head)) return "Auto";
          return head === "none" ? "None" : head;
        }
        return { "Left to right": "LTR", "Right to left": "RTL" }[label] ?? label.split(/:\s| \(/)[0];
      }
      /* An icon is a name Canon draws. */
      function isIcon(name) {
        if (!/^[a-z][a-z0-9-]*$/.test(name)) return false;
        const probe = document.createElement("span");
        probe.className = "canon-icon";
        probe.dataset.icon = name;
        document.body.append(probe);
        const drawn = getComputedStyle(probe).getPropertyValue("--canon-theme-icon").trim() !== "";
        probe.remove();
        return drawn;
      }
      /* A slider's stops. When the theme's choice is one of them ("(theme
         decides)" is md, "(theme decides: sm)" is sm), that stop is it,
         written as no attribute; otherwise the choice is a stop of its
         own, Auto, first ("(the text's size)"). */
      function stopsOf(control) {
        const options = optionsOf(control);
        const auto = options.find(([value]) => value === "");
        const same = auto?.[1].match(/^\(theme decides(?::\s*([a-z0-9-]+))?\)$/);
        const target = same && (same[1] ?? "md");
        if (!target || !options.some(([value]) => value === target)) return options.map(([value, label]) => [value, label, value ? shortName(label) : "Auto"]);
        return options.filter(([value]) => value).map(([value, label]) =>
          value === target ? ["", `${label}: the default, so no attribute`, shortName(label)] : [value, label, shortName(label)]);
      }
      const ordered = (values, scale) => values.every((value, i) => scale.includes(value) && (i === 0 || scale.indexOf(value) > scale.indexOf(values[i - 1])));
      function widgetOf(control) {
        if (control.widget) return control.widget;
        if (control.type === "checkbox") return "switch";
        if (control.type !== "select") return control.type;
        const options = optionsOf(control);
        const values = options.map(([value]) => value).filter(Boolean);
        const attribute = control.label.replace(/\s*\(.*$/, "");
        if (values.length >= 2 && values.every((value) => intents.includes(value))) return "intent";
        if (values.length >= 2 && values.every((value) => emphases.includes(value))) return "emphasis";
        if (/icon$/i.test(attribute) && values.length >= 2 && values.every(isIcon)) return "icons";
        if (values.length >= 2 && scales.some((scale) => ordered(values, scale))) return "scale";
        const names = options.map(([, label]) => shortName(label));
        if (options.length <= 5 && names.every((name) => name.length <= Math.min(10, Math.floor(32 / options.length)))) return "segmented";
        return "select";
      }
      /* A short slider (a few short stops: sm md lg) sits beside its label. */
      const stacked = (widget, control) => ["intent", "emphasis"].includes(widget)
        || (widget === "scale" && (stopsOf(control).length > 4 || stopsOf(control).some(([, , name]) => name.length > 4)))
        || (widget === "segmented" && (optionsOf(control).length > 2 || optionsOf(control).map(([, label]) => shortName(label)).join("").length > 12));

      function controlHTML(control) {
        const id = `ref-pg-${control.name}`;
        const value = state[control.name];
        const widget = widgetOf(control);
        const [, name, note = ""] = control.label.match(/^(.*?)\s*(?:\((.*)\))?\s*$/);
        const empty = note.match(/^empty:\s*(.*)$/)?.[1];
        const hint = empty === undefined ? note : "";
        const tip = escape(control.label);
        const described = hint ? ` aria-description="${escape(hint)}"` : "";
        const grouped = ["segmented", "intent", "emphasis", "icons"].includes(widget);
        const label = grouped
          ? `<span class="ref-ins-label" id="${id}-label" title="${tip}">${escape(name)}</span>`
          : `<label class="ref-ins-label" for="${id}" title="${tip}">${escape(name)}</label>`;
        const isStacked = stacked(widget, control);
        /* Tiles name their value beside the label; the others show it. */
        const shown = ["intent", "emphasis"].includes(widget) ? `<span class="ref-ins-value" aria-hidden="true"></span>` : "";
        const row = (body) => `<div class="ref-ins-row" data-control="${control.name}" data-widget="${widget}"${isStacked ? " data-stack" : ""}>${label}${shown}${body}</div>`;
        const options = optionsOf(control);
        const radio = (optionValue, optionLabel, content, extra = "") =>
          `<label class="ref-ins-option" title="${escape(optionLabel)}"${extra}><input type="radio" name="${control.name}" value="${escape(optionValue)}"${optionValue === value ? " checked" : ""} aria-label="${escape(optionLabel)}">${content}</label>`;
        const group = (className, inner, style = "") => `<div class="${className}" role="radiogroup" aria-labelledby="${id}-label"${described}${style}>${inner}</div>`;

        if (widget === "switch") {
          return `<div class="ref-ins-row" data-control="${control.name}" data-widget="switch" data-switch>${label}<input class="ref-ins-switch" type="checkbox" role="switch" id="${id}" name="${control.name}"${value ? " checked" : ""}${described}></div>`;
        }
        if (widget === "segmented") {
          return row(group("ref-ins-seg", options.map(([optionValue, optionLabel]) =>
            radio(optionValue, optionLabel, `<span>${escape(shortName(optionLabel))}</span>`)).join(""), ` style="--n: ${options.length}"`));
        }
        if (widget === "intent") {
          return row(group("ref-ins-tiles", options.map(([optionValue, optionLabel]) =>
            radio(optionValue, optionLabel, `<span class="ref-ins-glyph" aria-hidden="true"></span>`, ` data-tone="${escape(optionValue || "auto")}"`)).join("")));
        }
        if (widget === "emphasis") {
          return row(group("ref-ins-tiles", options.map(([optionValue, optionLabel]) =>
            radio(optionValue, optionLabel, `<span class="ref-ins-pill" data-emphasis="${escape(optionValue || "auto")}" aria-hidden="true"></span>`)).join("")));
        }
        if (widget === "icons") {
          return row(`<button type="button" class="ref-ins-picker" popovertarget="${id}-icons" aria-labelledby="${id}-label ${id}-picked"${described}>`
            + `<span class="ref-ins-picked-icon" aria-hidden="true"></span><span class="ref-ins-picked-name" id="${id}-picked"></span></button>`
            + `<div class="ref-ins-pop" id="${id}-icons" popover>${group("ref-ins-tiles ref-ins-icons", options.map(([optionValue, optionLabel]) =>
              radio(optionValue, optionLabel, optionValue
                ? `<span class="canon-icon" data-icon="${escape(optionValue)}" aria-hidden="true"></span>`
                : `<span class="ref-ins-none" aria-hidden="true"></span>`)).join(""))}</div>`);
        }
        if (widget === "scale") {
          const stops = stopsOf(control);
          const index = Math.max(0, stops.findIndex(([stopValue]) => stopValue === value));
          return row(`<div class="ref-ins-scale" style="--stops: ${stops.length}">
            <input type="range" id="${id}" min="0" max="${stops.length - 1}" step="1" value="${index}" data-scale="${control.name}"${described}>
            <div class="ref-ins-ticks">${stops.map(([stopValue, stopLabel, stopName], i) =>
              `<button type="button" class="ref-ins-tick" tabindex="-1" data-stop="${i}" style="--i: ${i}" title="${escape(stopLabel)}"${stopValue || stopName !== "Auto" ? "" : " data-auto"}>${escape(stopName)}</button>`).join("")}</div>
          </div>`);
        }
        if (widget === "select") {
          const list = options.map(([optionValue, optionLabel]) =>
            `<option value="${escape(optionValue)}"${optionValue === value ? " selected" : ""}>${escape(optionLabel)}</option>`).join("");
          return row(`<span class="ref-ins-select"><select id="${id}" name="${control.name}"${described}>${list}</select></span>`);
        }
        const placeholder = empty ? ` placeholder="${escape(empty[0].toUpperCase() + empty.slice(1))}"` : "";
        if (widget === "number") {
          return row(`<span class="ref-ins-number"><input class="ref-ins-input" type="number" id="${id}" name="${control.name}" value="${escape(value)}" min="${control.min ?? 1}" max="${control.max ?? 20}"${placeholder}${described} autocomplete="off">`
            + `<button type="button" data-nudge="-1" tabindex="-1" aria-label="Decrease"><span class="canon-icon" data-icon="minus" aria-hidden="true"></span></button>`
            + `<button type="button" data-nudge="1" tabindex="-1" aria-label="Increase"><span class="canon-icon" data-icon="plus" aria-hidden="true"></span></button></span>`);
        }
        return row(`<input class="ref-ins-input" type="text" id="${id}" name="${control.name}" value="${escape(value)}"${placeholder}${described} autocomplete="off" spellcheck="false">`);
      }

      /* Puts a control (and its state) to a value, as Reset does. */
      const controlNamed = new Map(controls.map((control) => [control.name, control]));
      function setControl(control, value) {
        state[control.name] = value;
        const row = form.querySelector(`[data-control="${control.name}"]`);
        if (control.type === "checkbox") form.elements[control.name].checked = value;
        else if (row.dataset.widget === "scale") row.querySelector("input").value = String(Math.max(0, stopsOf(control).findIndex(([stopValue]) => stopValue === value)));
        else form.elements[control.name].value = value;
      }

      /* What a control shows beyond its input: the dot when changed, the
         value beside a stacked label, the slider's current stop, the
         segmented control's indicator, Reset only with something to reset. */
      function reflect() {
        let anyChanged = false;
        for (const control of controls) {
          const row = form.querySelector(`[data-control="${control.name}"]`);
          const changed = state[control.name] !== defaultOf(control);
          anyChanged ||= changed && !row.hidden;
          row.toggleAttribute("data-changed", changed);
          const widget = row.dataset.widget;
          if (widget === "switch" || control.type !== "select") continue;
          const options = optionsOf(control);
          const index = Math.max(0, options.findIndex(([optionValue]) => optionValue === state[control.name]));
          const shown = row.querySelector(".ref-ins-value");
          if (shown) shown.textContent = shortName(options[index][1]);
          if (widget === "scale") {
            const stops = stopsOf(control);
            const at = Math.max(0, stops.findIndex(([stopValue]) => stopValue === state[control.name]));
            row.querySelector("input").setAttribute("aria-valuetext", stops[at][1]);
            for (const tick of row.querySelectorAll(".ref-ins-tick")) tick.toggleAttribute("data-current", Number(tick.dataset.stop) === at);
          }
          if (widget === "segmented") row.querySelector(".ref-ins-seg").style.setProperty("--at", index);
          /* An option that can't show anything yet is off, its reason on
             hover (unavailable: { value: (state) => reason or "" }). */
          for (const [optionValue, reasonOf] of Object.entries(control.unavailable ?? {})) {
            const reason = reasonOf(state) || "";
            const choice = [...row.querySelectorAll("input[type=radio], option")].find((element) => element.value === optionValue);
            if (!choice) continue;
            const holder = choice.matches("option") ? choice : choice.parentElement;
            holder.dataset.title ??= holder.title || choice.getAttribute("aria-label") || choice.textContent;
            choice.disabled = Boolean(reason);
            holder.title = reason ? `${holder.dataset.title}: ${reason}` : holder.dataset.title;
            if (!choice.matches("option")) choice.setAttribute("aria-description", reason);
          }
          if (widget === "icons") {
            const [optionValue, optionLabel] = options[index];
            row.querySelector(".ref-ins-picked-name").textContent = optionValue || shortName(optionLabel);
            const picked = row.querySelector(".ref-ins-picked-icon");
            picked.className = optionValue ? "ref-ins-picked-icon canon-icon" : "ref-ins-picked-icon ref-ins-none";
            if (optionValue) picked.dataset.icon = optionValue; else delete picked.dataset.icon;
          }
        }
        form.querySelector(".ref-pg-reset").disabled = !anyChanged;
        /* Emphasis tiles take the chosen meaning's color. */
        inspector.dataset.tone = intents.includes(state.intent) ? state.intent : "";
      }

      /* The controls: an inspector in the page's right column (where "On
         this page" is on the Reference tab), shown with the Playground. */
      const inspector = document.createElement("aside");
      inspector.className = "ref-inspector";
      inspector.setAttribute("aria-labelledby", "ref-inspector-title");
      inspector.innerHTML = `
        <form class="ref-pg-controls">
          <div class="ref-inspector-head">
            <h2 id="ref-inspector-title">Controls</h2>
            <button type="button" class="ref-ins-reset ref-pg-reset" title="Reset to defaults">Reset</button>
          </div>
          ${groups.map((group) => `
          <fieldset>
            <legend>${group}</legend>
            ${controls.filter((control) => control.group === group).map(controlHTML).join("")}
          </fieldset>`).join("")}
        </form>`;
      document.body.append(inspector);

      const form = inspector.querySelector(".ref-pg-controls");
      /* The preview: a page of its own, with one theme's stylesheet and
         canon.js, as an app's would be. Written, not loaded, so the stage is
         there at once. */
      previewDocument = panel.querySelector(".ref-pg-view").contentDocument;
      previewDocument.open();
      previewDocument.write(`<!doctype html>
        <html lang="${escape(document.documentElement.lang)}">
        <head>
          <meta charset="utf-8">
          <base href="${escape(new URL(".", location.href).href)}">
          <link rel="stylesheet" id="ref-theme" href="${themeHref(chosenTheme)}">
          ${[...document.querySelectorAll('link[href*="i18n/"]')].map((link) => `<link rel="stylesheet" href="${escape(link.getAttribute("href"))}">`).join("")}
          <link rel="stylesheet" href="ref.css">
          ${params.has("debug") ? `<link rel="stylesheet" id="ref-debug" href="../css/canon.debug.css"><script src="../js/canon.debug.js" defer></script>` : ""}
          <script src="../js/canon.js" defer></script>
        </head>
        <body class="ref-pg-page"><div class="ref-pg-stage" data-canon-debug="after"></div></body>
        </html>`);
      previewDocument.close();
      if (document.documentElement.style.colorScheme) previewDocument.documentElement.style.colorScheme = document.documentElement.style.colorScheme;
      const stage = previewDocument.querySelector(".ref-pg-stage");
      stage.style.inlineSize = stageWidth || "";
      const code = panel.querySelector("#ref-pg-code");
      const canvas = panel.querySelector(".ref-pg-canvas");
      const edited = panel.querySelector(".ref-pg-edited");
      const editor = panel.querySelector(".ref-pg-editor");
      const highlightLayer = panel.querySelector(".ref-pg-highlight");

      /* The HTML is a plain textarea over its highlighted copy (twinkleplop).
         Until the highlighter loads, or if it can't, the textarea shows its
         own text. */
      let highlight = null;
      twinkleplop
        .then(({ language }) => {
          highlight = language();
          paint();
          editor.dataset.highlighted = "";
        })
        .catch(() => {});
      function paint() {
        if (!highlight) return;
        /* A trailing newline needs a character after it to get its line. */
        highlightLayer.innerHTML = highlight(code.value.endsWith("\n") ? `${code.value} ` : code.value);
        highlightLayer.scrollTop = code.scrollTop;
        highlightLayer.scrollLeft = code.scrollLeft;
      }
      code.addEventListener("scroll", () => {
        highlightLayer.scrollTop = code.scrollTop;
        highlightLayer.scrollLeft = code.scrollLeft;
      });

      function update() {
        for (const control of controls) {
          const wrapper = form.querySelector(`[data-control="${control.name}"]`);
          wrapper.hidden = control.when ? !control.when(state) : false;
        }
        for (const fieldset of form.querySelectorAll("fieldset")) {
          fieldset.hidden = ![...fieldset.querySelectorAll("[data-control]")].some((wrapper) => !wrapper.hidden);
        }
        stage.dir = state.dir === "rtl" ? "rtl" : "";
        stage.lang = state.dir === "rtl" ? "ar" : "";
                code.value = render(state).trim();
        edited.hidden = true;
        paint();
        show(code.value);

        for (const control of controls) {
          const value = state[control.name];
          const isDefault = control.type === "checkbox" ? value === Boolean(control.default) : value === String(control.default ?? "");
          if (isDefault) params.delete(`p.${control.name}`);
          else params.set(`p.${control.name}`, control.type === "checkbox" ? (value ? "1" : "0") : value);
        }
        reflect();
        save();
      }

      function show(html) {
        stage.innerHTML = html;
        /* State HTML can't express (e.g. indeterminate) is set after rendering;
           edited HTML may no longer have what it expects. */
        try { enhance?.(stage, state); } catch {}
      }

      /* Editing the HTML renders it as you type; changing a control (or
         Revert) draws it from the controls again. */
      code.addEventListener("input", () => {
        edited.hidden = false;
        paint();
        show(code.value);
      });
      edited.querySelector(".ref-pg-revert").addEventListener("click", () => {
        update();
        code.focus();
      });

      /* canon.js flips aria-pressed before click listeners run; read it. */
      panel.querySelector(".ref-pg-wrap").addEventListener("click", (event) => {
        const wrap = event.currentTarget.getAttribute("aria-pressed") === "true";
        editor.toggleAttribute("data-wrap", wrap);
        if (wrap) params.set("wrap", "");
        else params.delete("wrap");
        save();
      });

      /* The width: "full" or a number of pixels, from 360 up to the room
         the canvas has (the full width). A width chosen wider than that
         room shows at the full width until there's room again; presets
         wider than it are off. The readout and the sliders say the width
         the stage has now. */
      const frame = panel.querySelector(".ref-pg-frame");
      const ruler = panel.querySelector(".ref-pg-ruler");
      const readout = panel.querySelector(".ref-pg-width-value");
      const sides = [...panel.querySelectorAll(".ref-pg-side")];
      const presetItems = [...panel.querySelectorAll("#ref-pg-presets [data-width]")];
      let chosen = width;
      const fullWidth = () => {
        const style = getComputedStyle(canvas);
        const room = canvas.clientWidth - Number.parseFloat(style.paddingInlineStart) - Number.parseFloat(style.paddingInlineEnd);
        /* Less the sides and the gaps beside them (none while the sides are hidden). */
        const gaps = sides[0].offsetWidth ? 2 * Number.parseFloat(getComputedStyle(frame).columnGap) : 0;
        return Math.floor(room - sides.reduce((sum, side) => sum + side.offsetWidth, 0) - gaps);
      };
      const shownWidth = () => Math.round(Number.parseFloat(getComputedStyle(frame).gridTemplateColumns.split(" ")[1]) || stage.getBoundingClientRect().width);
      const apply = () => {
        const full = fullWidth();
        const shown = chosen === "full" || Number(chosen) >= full ? "full" : chosen;
        canvas.dataset.width = shown;
        canvas.style.setProperty("--ref-pg-w", shown === "full" ? "" : `${shown}px`);
        for (const item of presetItems) {
          const off = item.dataset.width !== "full" && Number(item.dataset.width) > full;
          item.setAttribute("aria-disabled", String(off));
          item.setAttribute("aria-checked", String(item.dataset.width === shown));
        }
        const now = shownWidth();
        readout.textContent = `${now}px`;
        ruler.style.setProperty("--ref-pg-w", `${now}px`);
        for (const side of sides) {
          side.setAttribute("aria-valuemax", String(Math.max(minWidth, full)));
          side.setAttribute("aria-valuenow", String(now));
          side.setAttribute("aria-valuetext", shown === "full" ? `Full width, ${now} pixels` : `${now} pixels`);
        }
      };
      const setWidth = (value) => {
        const next = asWidth(value);
        chosen = next !== "full" && Number(next) >= fullWidth() ? "full" : next;
        if (chosen === "full") params.delete("w");
        else params.set("w", chosen);
        apply();
        save();
      };
      apply();
      new ResizeObserver(apply).observe(canvas);
      panel.querySelector("#ref-pg-presets").addEventListener("click", (event) => {
        const item = event.target.closest("[data-width]");
        if (!item || item.getAttribute("aria-disabled") === "true") return;
        setWidth(item.dataset.width);
        /* A choice made: the menu goes (a checked item keeps it open). */
        event.currentTarget.hidePopover();
      });

      /* Dragging a side grows or shrinks the frame from its middle, both
         sides moving, from 360 to the full width; near a preset or the
         full width it holds there. The arrow keys move it 1px (Shift
         10px), Page Up and Down 100px, Home and End to the ends. A double
         click goes back to the full width. */
      const snap = (value) => [...presets.slice(1).map(([each]) => Number(each)), fullWidth()].find((each) => Math.abs(each - value) <= 6) ?? value;
      for (const side of sides) {
        const outward = side.dataset.side === "end" ? 1 : -1;
        side.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          side.setPointerCapture(event.pointerId);
          const startX = event.clientX;
          const startWidth = shownWidth();
          frame.dataset.dragging = "";
          const move = (moved) => setWidth(snap(Math.round(startWidth + 2 * outward * (moved.clientX - startX))));
          const stop = () => {
            delete frame.dataset.dragging;
            side.removeEventListener("pointermove", move);
            side.removeEventListener("pointerup", stop);
            side.removeEventListener("pointercancel", stop);
          };
          side.addEventListener("pointermove", move);
          side.addEventListener("pointerup", stop);
          side.addEventListener("pointercancel", stop);
        });
        side.addEventListener("dblclick", () => setWidth("full"));
        side.addEventListener("keydown", (event) => {
          const now = shownWidth();
          const step = event.shiftKey ? 10 : 1;
          const next = {
            ArrowLeft: now - outward * step, ArrowRight: now + outward * step,
            ArrowDown: now - step, ArrowUp: now + step,
            PageDown: now - 100, PageUp: now + 100,
            Home: minWidth, End: "full",
          }[event.key];
          if (next === undefined) return;
          event.preventDefault();
          setWidth(next);
        });
      }

      /* The divider between the preview and the HTML: drag it, or use the
         arrow keys (Home and End to the ends); a double click puts it back.
         Its place is remembered in this browser. */
      const output = panel.querySelector(".ref-pg-output");
      const grip = panel.querySelector(".ref-pg-grip");
      const splitKey = "canon-docs-playground-split";
      const setSplit = (fraction, keep = true) => {
        if (fraction == null) {
          output.style.removeProperty("--ref-pg-split");
          grip.setAttribute("aria-valuenow", "60");
        } else {
          const clamped = Math.min(0.85, Math.max(0.15, fraction));
          output.style.setProperty("--ref-pg-split", String(clamped));
          grip.setAttribute("aria-valuenow", String(Math.round(clamped * 100)));
        }
        if (!keep) return;
        try {
          if (fraction == null) localStorage.removeItem(splitKey);
          else localStorage.setItem(splitKey, String(fraction));
        } catch {}
      };
      grip.setAttribute("aria-valuemin", "15");
      grip.setAttribute("aria-valuemax", "85");
      setSplit((() => { try { const stored = Number(localStorage.getItem(splitKey)); return stored > 0 ? stored : null; } catch { return null; } })(), false);
      const fractionAt = (y) => {
        const box = output.getBoundingClientRect();
        return (y - box.top) / box.height;
      };
      grip.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        grip.setPointerCapture(event.pointerId);
        grip.dataset.dragging = "";
        const move = (moved) => setSplit(fractionAt(moved.clientY), false);
        const end = (ended) => {
          grip.removeEventListener("pointermove", move);
          delete grip.dataset.dragging;
          setSplit(fractionAt(ended.clientY));
        };
        grip.addEventListener("pointermove", move);
        grip.addEventListener("pointerup", end, { once: true });
        grip.addEventListener("pointercancel", end, { once: true });
      });
      grip.addEventListener("dblclick", () => setSplit(null));
      grip.addEventListener("keydown", (event) => {
        const now = Number(grip.getAttribute("aria-valuenow")) / 100;
        const next = { ArrowUp: now - 0.05, ArrowDown: now + 0.05, Home: 0.15, End: 0.85 }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        setSplit(next);
      });

      stage.addEventListener("click", (event) => {
        if (event.target.closest("a[href]")) event.preventDefault();
      });
      /* Demo forms don't navigate; blocking the submit (not the button's
         click) lets the forms canon.js draws still hear it. */
      stage.addEventListener("submit", (event) => {
        /* A dialog's form (method="dialog") only closes its dialog. */
        if (event.target.method !== "dialog") event.preventDefault();
      });
      form.addEventListener("input", (event) => {
        const { name, type, checked, value, dataset } = event.target;
        if (dataset.scale) {
          state[dataset.scale] = stopsOf(controlNamed.get(dataset.scale))[Number(value)][0];
          update();
          return;
        }
        if (!name || !controlNamed.has(name)) return;
        state[name] = type === "checkbox" ? checked : value;
        update();
        /* Picking an icon closes the grid, back on its field. */
        const pop = event.target.closest(".ref-ins-pop");
        if (pop && event.target.checked) {
          pop.hidePopover();
          pop.previousElementSibling.focus();
        }
      });
      /* The icon grid opens under its field, its end at the field's end
         (above it when there's no room below), on the chosen icon. */
      for (const pop of form.querySelectorAll(".ref-ins-pop")) {
        pop.addEventListener("toggle", (event) => {
          if (event.newState !== "open") return;
          const box = pop.previousElementSibling.getBoundingClientRect();
          const below = box.bottom + 4 + pop.offsetHeight <= innerHeight;
          pop.style.top = `${below ? box.bottom + 4 : box.top - 4 - pop.offsetHeight}px`;
          pop.style.left = `${Math.max(8, box.right - pop.offsetWidth)}px`;
          (pop.querySelector("input:checked") ?? pop.querySelector("input")).focus();
        });
      }
      form.addEventListener("click", (event) => {
        /* A slider's stop names are a click away from it. */
        const tick = event.target.closest(".ref-ins-tick");
        if (tick) {
          const input = tick.closest(".ref-ins-scale").querySelector("input");
          input.value = tick.dataset.stop;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.focus();
          return;
        }
        const nudge = event.target.closest("[data-nudge]");
        if (nudge) {
          const input = nudge.parentElement.querySelector("input");
          if (nudge.dataset.nudge === "1") input.stepUp(); else input.stepDown();
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
      /* A number's label scrubs: drag it sideways, a step every 6px. A
         click without a drag still focuses the field. */
      form.addEventListener("pointerdown", (event) => {
        const label = event.target.closest('[data-widget="number"] > .ref-ins-label');
        if (!label || event.button !== 0) return;
        const input = label.parentElement.querySelector("input");
        const startX = event.clientX;
        const startValue = Number(input.value) || 0;
        let scrubbing = false;
        label.setPointerCapture(event.pointerId);
        const move = (moved) => {
          const steps = Math.trunc((moved.clientX - startX) / 6);
          if (!scrubbing && Math.abs(moved.clientX - startX) < 3) return;
          scrubbing = true;
          label.parentElement.dataset.scrubbing = "";
          const min = Number(input.min), max = Number(input.max);
          const next = String(Math.min(max, Math.max(min, startValue + steps)));
          if (next !== input.value) {
            input.value = next;
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        };
        label.addEventListener("pointermove", move);
        label.addEventListener("pointerup", (ended) => {
          label.removeEventListener("pointermove", move);
          delete label.parentElement.dataset.scrubbing;
          if (scrubbing) label.addEventListener("click", (click) => click.preventDefault(), { once: true, capture: true });
        }, { once: true });
      });
      /* An old link's explicit default (p.size=md) is the default stop. */
      for (const control of controls) {
        if (widgetOf(control) === "scale" && !stopsOf(control).some(([stopValue]) => stopValue === state[control.name])) state[control.name] = "";
      }
      form.querySelector(".ref-pg-reset").addEventListener("click", () => {
        for (const control of controls) setControl(control, defaultOf(control));
        update();
      });
      update();
    }
  });
})();
