  /* ------------------------------------------------------------------ */
  /* Command Palette                                                     */
  /*                                                                     */
  /* The search field is a combobox over the list (a listbox): typing    */
  /* narrows the items to those holding every word (label, hint and      */
  /* data-keywords; case and accents ignored) and marks the words in the */
  /* labels; ↑ ↓ move the active item (aria-selected, scrolled into      */
  /* view), Enter runs it (a click: a link goes, a button does), and the */
  /* palette closes. Focus stays in the field. Groups without a match    */
  /* hide; with none at all, the empty message says so. Each change      */
  /* fires canon-search (a quarter second after typing stops) for the    */
  /* app's own results: items it puts in a group with data-remote are    */
  /* shown as they come. Opening empties the field; a click beside the   */
  /* palette closes it (closedby="any" unless the author set another).   */
  /* A trigger's                                                         */
  /* aria-keyshortcuts (Meta+K, Control+K) opens it from anywhere.       */
  /* ------------------------------------------------------------------ */

  const palettes = new WeakSet();
  let paletteCount = 0;
  const setUpCommandPalette = (palette) => {
    if (palettes.has(palette)) return;
    const input = palette.querySelector(":scope > .canon-command-search > input");
    const list = palette.querySelector(":scope > .canon-command-list");
    if (!input || !list) return;
    palettes.add(palette);
    const id = palette.id || `canon-command-${++paletteCount}`;
    const say = (key, fallback, values) => (values ? fill(text(palette, key, fallback), values) : text(palette, key, fallback));
    let observer = null;
    const quietly = (fn) => {
      fn();
      observer?.takeRecords();
    };

    /* Nothing to lose: a click beside it closes it, as Escape does. */
    if (!palette.hasAttribute("closedby")) palette.setAttribute("closedby", "any");
    if (!list.id) list.id = `${id}-list`;
    list.setAttribute("role", "listbox");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-controls", list.id);
    input.setAttribute("aria-expanded", "true");
    input.setAttribute("aria-autocomplete", "list");
    input.autocomplete = "off";

    const items = () => [...list.querySelectorAll(".canon-command-item")];
    const shown = () => items().filter((item) => !item.hidden && !item.closest(".canon-command-group[hidden]"));
    let itemCount = 0;
    const prepare = () => {
      for (const item of items()) {
        item.setAttribute("role", "option");
        item.tabIndex = -1;
        if (!item.id) item.id = `${id}-item-${++itemCount}`;
      }
      for (const group of list.querySelectorAll(":scope > .canon-command-group")) group.setAttribute("role", "group");
    };

    let empty = palette.querySelector(":scope > .canon-command-empty");
    let active = null;
    const activate = (item, scroll = true) => {
      for (const each of items()) each.setAttribute("aria-selected", String(each === item));
      active = item;
      if (item) {
        input.setAttribute("aria-activedescendant", item.id);
        if (scroll) item.scrollIntoView({ block: "nearest" });
      } else input.removeAttribute("aria-activedescendant");
    };
    /* Marking only splits the label, so its text stays the original: an app
       can rename an item at any time. */
    const mark = (label, words) => {
      const original = label.textContent;
      const folded = fold(original);
      const ranges = [];
      for (const word of words) {
        const at = folded.indexOf(word);
        if (at >= 0) ranges.push([at, at + word.length]);
      }
      ranges.sort((a, b) => a[0] - b[0]);
      label.replaceChildren();
      let from = 0;
      for (const [start, end] of ranges) {
        if (start < from) continue;
        label.append(original.slice(from, start));
        const match = document.createElement("mark");
        match.className = "canon-command-match";
        match.textContent = original.slice(start, end);
        label.append(match);
        from = end;
      }
      label.append(original.slice(from));
    };

    let announceTimer = null;
    const filter = () => {
      const words = fold(input.value).split(/\s+/).filter(Boolean);
      for (const item of items()) {
        const label = item.querySelector(":scope > .canon-command-label");
        if (item.closest("[data-remote]")) {
          item.hidden = false;
        } else {
          const haystack = fold([label?.textContent ?? "", item.querySelector(":scope > .canon-command-hint")?.textContent ?? "", item.dataset.keywords ?? ""].join(" "));
          item.hidden = !words.every((word) => haystack.includes(word));
        }
        if (label) mark(label, item.hidden ? [] : words);
      }
      for (const group of list.querySelectorAll(":scope > .canon-command-group")) {
        group.hidden = !group.querySelector(".canon-command-item:not([hidden])");
      }
      const visible = shown();
      if (!empty && words.length) {
        empty = document.createElement("p");
        empty.className = "canon-command-empty";
        list.after(empty);
      }
      if (empty) {
        empty.hidden = visible.length > 0 || !words.length;
        if (!empty.dataset.authored) empty.textContent = say("command-no-results", "No results for “{query}”", { query: input.value.trim() });
      }
      activate(visible[0] ?? null, false);
      list.scrollTop = 0;
      clearTimeout(announceTimer);
      if (words.length) {
        announceTimer = setTimeout(() => {
          announce(visible.length === 1 ? say("command-result", "1 result") : say("command-results", "{count} results", { count: visible.length }));
        }, 500);
      }
    };
    if (empty) empty.dataset.authored = "";

    let searchTimer = null;
    input.addEventListener("input", () => {
      quietly(filter);
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => palette.dispatchEvent(new CustomEvent("canon-search", { bubbles: true, detail: { query: input.value.trim() } })), 250);
    });
    input.addEventListener("keydown", (event) => {
      if (event.isComposing) return;
      const visible = shown();
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!visible.length) return;
        const at = visible.indexOf(active);
        const next = event.key === "ArrowDown" ? visible[(at + 1) % visible.length] : visible[(at - 1 + visible.length) % visible.length];
        quietly(() => activate(next));
      } else if (event.key === "Enter") {
        if (!active || active.hidden) return;
        event.preventDefault();
        active.click();
      }
    });
    list.addEventListener("pointermove", (event) => {
      const item = event.target.closest?.(".canon-command-item");
      if (item && item !== active && !item.hidden) quietly(() => activate(item, false));
    });
    /* Running an item closes the palette, unless the app cancels the click
       or the item has data-keep-open. */
    list.addEventListener("click", (event) => {
      const item = event.target.closest?.(".canon-command-item");
      if (!item || item.hidden) return;
      setTimeout(() => {
        if (!event.defaultPrevented && !item.hasAttribute("data-keep-open") && palette.open) palette.close(item.dataset.value ?? item.textContent.trim());
      });
    });
    /* The field keeps focus: a pointer press on an item doesn't move it. */
    list.addEventListener("pointerdown", (event) => {
      if (event.target.closest?.(".canon-command-item")) event.preventDefault();
    });
    palette.addEventListener("toggle", (event) => {
      if (event.newState !== "open") return;
      input.value = "";
      quietly(filter);
      input.focus();
    });

    observer = new MutationObserver(() => quietly(() => {
      prepare();
      filter();
    }));
    observer.observe(list, { childList: true, subtree: true, characterData: true });
    quietly(() => {
      prepare();
      filter();
    });
  };

  /* Shortcuts: a palette's trigger with aria-keyshortcuts (Meta+K,
     Control+K, …) opens it from anywhere; pressed again, it closes. */
  document.addEventListener("keydown", (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.repeat) return;
    for (const trigger of document.querySelectorAll("button[commandfor][command='show-modal'][aria-keyshortcuts]")) {
      const palette = document.getElementById(trigger.getAttribute("commandfor"));
      if (!palette?.matches?.(".canon-command-palette")) continue;
      if (!trigger.getAttribute("aria-keyshortcuts").split(/\s+/).some((shortcut) => shortcutMatches(event, shortcut))) continue;
      event.preventDefault();
      if (palette.open) palette.close();
      else {
        for (const other of document.querySelectorAll("dialog.canon-command-palette[open]")) other.close();
        palette.showModal();
      }
      return;
    }
  });

  const setUpCommandPalettes = (root) => {
    const found = [...(root.matches?.(".canon-command-palette") ? [root] : []), ...(root.querySelectorAll?.(".canon-command-palette") ?? [])];
    for (const palette of found) setUpCommandPalette(palette);
  };
