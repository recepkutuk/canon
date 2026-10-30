/*
 * canon.js
 *
 * Behavior for Canon's T2 components. Optional: every page renders without it.
 *
 * Behavior is declared in HTML with the platform's invoker commands:
 *
 *   <button type="button" commandfor="search" command="--canon-clear">
 *
 * The browser fires a "command" event at the target; Canon handles its own
 * custom commands (the --canon- ones). Browsers without invoker commands get
 * a small polyfill that covers custom commands only.
 *
 * Sliders are enhanced without any markup of their own: canon.js keeps
 * the fill (--canon-slider-percent, or --canon-slider-start / -end for a
 * range), the <output> values and the named marks in step with the input.
 *
 * Avatars whose photo fails to load show their fallback (data-state="error").
 *
 * Fields show the browser's validation message in their own empty message
 * (instead of the browser's bubble), as an error. A field's counter shows
 * how much of its control's maxlength is used, and makes it a soft limit.
 *
 * Passwords: rules with data-rule are checked as people type (and block
 * submitting until met), a meter with data-score="rules" is scored from
 * them, Caps Lock is flagged, a confirmation (data-match) is compared, and
 * rules with data-reveal="focus" show only while they matter.
 *
 * Comboboxes: a <select> in .canon-combobox gets a list you can search
 * (in the list or in the box), tags for multiple, new values, loading
 * from the app; the select keeps the value.
 *
 * Tooltips use the platform's interest invokers (interestfor on the
 * trigger); browsers without them get a small polyfill.
 *
 * Load with <script src="canon.js" defer>.
 *
 * Built from src/js by tools/build.mjs: edit the sources, then run it.
 * A smaller build with only some components: node tools/build.mjs --list.
 */
(() => {
  const resetTimers = new WeakMap();

  /* Popups and the element each one is anchored to (see Popover anchors). */
  const popupAnchors = new WeakMap();

  /* Strings come from CSS custom properties (css/canon/canon.core.css, i18n/*.css),
     read on the element, so they follow its lang. */
  const text = (element, key, fallback) => {
    const value = getComputedStyle(element).getPropertyValue(`--canon-text-${key}`).trim();
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return value.replace(/^['"]|['"]$/g, "") || fallback;
    }
  };

  /* One shared, visually hidden live region for announcements. */
  let liveRegion;
  const announce = (text) => {
    if (!liveRegion) {
      liveRegion = document.createElement("div");
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.style.cssText =
        "position:absolute;inline-size:1px;block-size:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap";
      document.body.append(liveRegion);
    }
    liveRegion.textContent = "";
    requestAnimationFrame(() => { liveRegion.textContent = text; });
  };

  /* Fill a string's {placeholders}; the language an element is in. */
  const fill = (template, values) => template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
  /* A drawn value taking focus (Date's parts, Time's cells, editable
     only while focused): editing on, the caret at its end, so typing
     reaches it however focus came (Tab, a press, moving on). */
  const caretIn = (value, on) => {
    value.contentEditable = String(on);
    const selection = getSelection();
    if (!on || !selection || value.contains(selection.anchorNode)) return;
    selection.selectAllChildren(value);
    selection.collapseToEnd();
  };
  const langOf = (element) => element.closest("[lang]")?.lang || undefined;

  /* A count in the element's language, with its plural form. */
  const countText = (element, key, count) => {
    const lang = langOf(element);
    let form = "other";
    let number = String(count);
    try {
      form = new Intl.PluralRules(lang).select(count);
      number = new Intl.NumberFormat(lang).format(count);
    } catch {}
    const template = text(element, `${key}-${form}`, "") || text(element, `${key}-other`, `{count}`);
    return fill(template, { count: number });
  };

  /* Case and accents don't count: "o" finds "Ö". */
  const fold = (value) => value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();

  /* An element from markup. */
  const fromMarkup = (markup) => {
    const template = document.createElement("template");
    template.innerHTML = markup;
    return template.content.firstElementChild;
  };

  /* The elements an input's aria-describedby points at that match. */
  const describedBy = (input, selector) => (input.getAttribute("aria-describedby") ?? "")
    .split(/\s+/).filter(Boolean)
    .map((id) => document.getElementById(id))
    .filter((element) => element?.matches(selector));

  /* The first control a person can use in a part of the page. */
  const firstControl = (root) =>
    [...root.querySelectorAll("input:not([type='hidden']), select, textarea, button, a[href], [tabindex]:not([tabindex='-1'])")].find(
      (element) => !element.disabled && element.checkVisibility(),
    );
  const firstFocusable = (root) =>
    [...root.querySelectorAll("input, select, textarea, button, [contenteditable], [tabindex]")].find(
      (element) => element.tabIndex >= 0 && !element.disabled && !element.matches("[command='--canon-remove']") && element.checkVisibility(),
    );

  /* Whether a key press is a shortcut written as aria-keyshortcuts writes
     it ("Meta+K", "Control+S"). */
  const shortcutMatches = (event, shortcut) => {
    const parts = shortcut.split("+");
    const key = parts.pop();
    const want = new Set(parts.map((part) => part.toLowerCase()));
    return event.key.toLowerCase() === key.toLowerCase() &&
      event.metaKey === want.has("meta") && event.ctrlKey === want.has("control") &&
      event.altKey === want.has("alt") && event.shiftKey === want.has("shift");
  };

  /* Seeds (data-seed on an avatar or a tag): the slot of the theme's
     colors, for browsers that can't work it out in CSS. */
  const seeded = ".canon-avatar, .canon-tag";

  /* The theme's color count is read on the element, or on its future
     parent when it isn't in the page yet. */
  const seedSlot = (element, from = element) => {
    const seed = element.dataset.seed?.trim();
    const colors = Number.parseInt(getComputedStyle(from).getPropertyValue("--canon-seed-colors"), 10);
    if (!seed || !/^-?\d+$/.test(seed) || !(colors > 0)) {
      delete element.dataset.seedSlot;
      return;
    }
    const n = BigInt(colors);
    element.dataset.seedSlot = String(((BigInt(seed) % n) + n) % n);
  };

  /* How the page was last used: "keyboard" or "pointer". */
  let lastInput = "pointer";
  document.addEventListener("keydown", () => { lastInput = "keyboard"; }, true);
  document.addEventListener("pointerdown", () => { lastInput = "pointer"; }, true);

  /* Named anchors made for popups and tooltips (see Popover anchors). */
  const anchorNames = new WeakMap();
  let anchorCount = 0;

  /* What --canon-clear does on a Filter Bar (see Filter Bar). */
  const filterBarClears = new WeakMap();

  const commands = {
    /* Empty the target (a select: nothing chosen, or its placeholder),
       tell listeners, and return focus to it. */
    "--canon-clear"(target) {
      /* A Filter Bar: every filter in it. */
      if (filterBarClears.has(target)) return filterBarClears.get(target)();
      if (target.matches("select")) {
        for (const option of target.options) option.selected = false;
        if (!target.multiple && target.options[0]?.value === "") target.options[0].selected = true;
      } else target.value = "";
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
      target.focus();
    },

    /* Copy the target's value (or text). The button gets data-state="copied"
       for two seconds so themes can show a confirmation. */
    async "--canon-copy"(target, source) {
      const value = "value" in target ? target.value : target.textContent;
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        return;
      }
      source.dataset.state = "copied";
      announce(text(source, "copied", "Copied"));
      clearTimeout(resetTimers.get(source));
      resetTimers.set(source, setTimeout(() => {
        if (source.dataset.state === "copied") delete source.dataset.state;
      }, 2000));
    },
  };

  document.addEventListener("command", (event) => {
    const run = commands[event.command];
    if (!run || !event.source) return;
    if (event.source.getAttribute("aria-disabled") === "true") return;
    run(event.target, event.source);
  }, true);

  /* ------------------------------------------------------------------ */
  /* Toggle buttons                                                      */
  /*                                                                     */
  /* A Button with aria-pressed flips it when clicked, like a checkbox:  */
  /* before the click's listeners run (they read the new state), and     */
  /* back if one cancels the click (preventDefault: an app that keeps    */
  /* the state itself, as an editor does from the selection). In a       */
  /* Button Group with data-select="one", pressing one releases the      */
  /* others, and the pressed one stays pressed. Command buttons (their   */
  /* command sets the state) and submit buttons (the server does) are    */
  /* left alone.                                                         */
  /* ------------------------------------------------------------------ */

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.(".canon-button[aria-pressed]");
    if (!button || button.hasAttribute("command") || button.type === "submit" || button.getAttribute("aria-disabled") === "true") return;
    const group = button.closest(".canon-button-group");
    const one = group?.dataset.select === "one";
    const buttons = one ? [...group.querySelectorAll(".canon-button[aria-pressed]")].filter((each) => each.closest(".canon-button-group") === group) : [button];
    const before = buttons.map((each) => [each, each.getAttribute("aria-pressed")]);
    if (one) for (const each of buttons) each.setAttribute("aria-pressed", String(each === button));
    else button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
    /* After every listener has had the click. */
    setTimeout(() => {
      if (event.defaultPrevented) for (const [each, value] of before) each.setAttribute("aria-pressed", value);
    });
  }, true);

  /* ------------------------------------------------------------------ */
  /* Number Input                                                        */
  /*                                                                     */
  /* Buttons with command="--canon-step-down" / "--canon-step-up" step   */
  /* their input with the browser's stepDown() / stepUp() (min, max and  */
  /* step apply) and fire input and change. In a .canon-number they are  */
  /* out of the tab order (the arrow keys step the input), a button at   */
  /* its limit is disabled, both are while the input is disabled or      */
  /* read-only, and holding one down repeats the step.                   */
  /*                                                                     */
  /* A step (a button, the arrow keys; not typing) rolls the value: the  */
  /* box is data-rolling="up" or "down" while the theme's animations     */
  /* run. Whole numbers (shown the same in every language) get an        */
  /* aria-hidden .canon-number-ticker over the input holding the old     */
  /* value and the new one; others (the browser writes 3.5 its own way)  */
  /* roll the input's own text.                                          */
  /* ------------------------------------------------------------------ */

  const rolls = new WeakMap();
  const rollNumber = (input, from) => {
    const box = input.parentElement;
    const to = input.value;
    if (!box?.matches(".canon-number") || from === to) return;
    const roll = {};
    rolls.set(box, roll);
    box.querySelector(":scope > .canon-number-ticker")?.remove();
    box.removeAttribute("data-rolling");
    let ticker = null;
    if (/^-?\d+$/.test(from) && /^-?\d+$/.test(to)) {
      ticker = fromMarkup(`<span class="canon-number-ticker" aria-hidden="true"><span class="canon-number-ticker-from"></span><span class="canon-number-ticker-to"></span></span>`);
      ticker.firstElementChild.textContent = from;
      ticker.lastElementChild.textContent = to;
      input.after(ticker);
      /* Over the input's text: inside its border, measured from the box's
         padding edge (where the box, or the input, has the frame). */
      const boxRect = box.getBoundingClientRect();
      const inputRect = input.getBoundingClientRect();
      Object.assign(ticker.style, {
        left: `${inputRect.left - boxRect.left - box.clientLeft + input.clientLeft}px`,
        top: `${inputRect.top - boxRect.top - box.clientTop + input.clientTop}px`,
        width: `${input.clientWidth}px`,
        height: `${input.clientHeight}px`,
      });
    }
    /* Restarted when it steps again meanwhile. */
    void box.offsetWidth;
    box.setAttribute("data-rolling", Number(to) > Number(from) ? "up" : "down");
    const done = () => {
      if (rolls.get(box) !== roll) return;
      ticker?.remove();
      box.removeAttribute("data-rolling");
    };
    const running = ticker ? ticker.getAnimations({ subtree: true }) : input.getAnimations().filter((animation) => animation.animationName);
    if (running.length) Promise.all(running.map((animation) => animation.finished)).then(done, done);
    else done();
  };

  const stepNumber = (input, direction) => {
    if (!input?.matches?.("input[type='number']") || input.disabled || input.readOnly) return false;
    const before = input.value;
    try {
      if (direction > 0) input.stepUp();
      else input.stepDown();
    } catch {
      return false;
    }
    if (input.value === before) return false;
    rollNumber(input, before);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  };
  commands["--canon-step-up"] = (target) => stepNumber(target, 1);
  commands["--canon-step-down"] = (target) => stepNumber(target, -1);

  const numberBoxes = new WeakSet();

  const setUpNumber = (box) => {
    const input = box.querySelector(":scope > input[type='number']");
    if (!input || numberBoxes.has(box)) return;
    numberBoxes.add(box);
    const down = box.querySelector(":scope > [command='--canon-step-down']");
    const up = box.querySelector(":scope > [command='--canon-step-up']");

    const sync = () => {
      const off = input.disabled || input.readOnly;
      const value = input.valueAsNumber;
      const min = input.min === "" ? -Infinity : Number(input.min);
      const max = input.max === "" ? Infinity : Number(input.max);
      if (down) down.disabled = off || (Number.isFinite(value) && value <= min);
      if (up) up.disabled = off || (Number.isFinite(value) && value >= max);
    };

    for (const [button, direction] of [[down, -1], [up, 1]]) {
      if (!button) continue;
      button.tabIndex = -1;
      /* A press doesn't take focus from the input. */
      button.addEventListener("mousedown", (event) => event.preventDefault());
      let timer = null;
      let repeated = false;
      const stop = () => {
        clearTimeout(timer);
        clearInterval(timer);
        timer = null;
      };
      button.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || button.disabled) return;
        repeated = false;
        stop();
        timer = setTimeout(() => {
          timer = setInterval(() => {
            repeated = true;
            if (!stepNumber(input, direction)) stop();
            sync();
          }, 60);
        }, 400);
      });
      for (const type of ["pointerup", "pointerleave", "pointercancel"]) button.addEventListener(type, stop);
      /* After a hold, the click that ends it doesn't step once more. */
      button.addEventListener("click", (event) => {
        if (!repeated) return;
        repeated = false;
        event.preventDefault();
        event.stopImmediatePropagation();
      }, true);
    }

    /* The arrow keys step natively: the input that follows rolls. */
    let keyed = null;
    input.addEventListener("keydown", (event) => {
      keyed = ["ArrowUp", "ArrowDown"].includes(event.key) && !event.altKey && !event.metaKey ? input.value : null;
    });
    input.addEventListener("input", () => {
      if (keyed === null) return;
      rollNumber(input, keyed);
      keyed = null;
    });
    input.addEventListener("input", sync);
    input.addEventListener("change", sync);
    input.form?.addEventListener("reset", () => setTimeout(sync));
    new MutationObserver(sync).observe(input, { attributes: true, attributeFilter: ["disabled", "readonly", "min", "max", "value"] });
    sync();
  };

  const setUpNumbers = (root) => {
    const found = [...(root.matches?.(".canon-number") ? [root] : []), ...(root.querySelectorAll?.(".canon-number") ?? [])];
    for (const box of found) setUpNumber(box);
  };

  /* ------------------------------------------------------------------ */
  /* Table                                                               */
  /*                                                                     */
  /* A table wider than its frame scrolls sideways. Then the frame gets  */
  /* data-scrolls and becomes a region named by the table's caption (or  */
  /* label) that keyboards can focus and scroll; it stops being one when */
  /* the table fits again. Attributes the author wrote are left alone.   */
  /* ------------------------------------------------------------------ */

  const tableFrames = new WeakSet();
  let tableCount = 0;

  const setUpTable = (frame) => {
    const table = frame.querySelector(":scope > table");
    if (!table || tableFrames.has(frame)) return;
    tableFrames.add(frame);
    const own = { role: frame.hasAttribute("role"), tabindex: frame.hasAttribute("tabindex"), name: frame.hasAttribute("aria-label") || frame.hasAttribute("aria-labelledby") };

    const sync = () => {
      const scrolls = frame.scrollWidth > frame.clientWidth + 1;
      frame.toggleAttribute("data-scrolls", scrolls);
      if (!own.role) {
        if (scrolls) frame.setAttribute("role", "region");
        else frame.removeAttribute("role");
      }
      if (!own.tabindex) {
        if (scrolls) frame.tabIndex = 0;
        else frame.removeAttribute("tabindex");
      }
      if (!own.name) {
        frame.removeAttribute("aria-label");
        frame.removeAttribute("aria-labelledby");
        if (!scrolls) return;
        if (table.caption) {
          table.caption.id ||= `canon-table-${++tableCount}-caption`;
          frame.setAttribute("aria-labelledby", table.caption.id);
        } else if (table.hasAttribute("aria-labelledby")) frame.setAttribute("aria-labelledby", table.getAttribute("aria-labelledby"));
        else if (table.hasAttribute("aria-label")) frame.setAttribute("aria-label", table.getAttribute("aria-label"));
      }
    };

    const observer = new ResizeObserver(sync);
    observer.observe(frame);
    observer.observe(table);
  };

  const setUpTables = (root) => {
    const found = [...(root.matches?.(".canon-table") ? [root] : []), ...(root.querySelectorAll?.(".canon-table") ?? [])];
    for (const frame of found) setUpTable(frame);
  };

  /* ------------------------------------------------------------------ */
  /* Code Block                                                          */
  /*                                                                     */
  /* Code longer or wider than its box scrolls. Then the <pre> gets      */
  /* data-scrolls and becomes a region keyboards can focus and scroll,   */
  /* named by the block's title (else "Code"), as a Table's frame does.  */
  /* Attributes the author wrote are left alone.                         */
  /* ------------------------------------------------------------------ */

  /* Wrap a Code Block's long lines, or let them scroll again. The button
     is a toggle: its label stays ("Wrap lines") and aria-pressed carries
     the state, which the block's CSS follows. */
  commands["--canon-wrap"] = (target, source) => {
    source.setAttribute("aria-pressed", String(source.getAttribute("aria-pressed") !== "true"));
  };

  const codeBlocks = new WeakSet();
  let codeBlockCount = 0;

  const setUpCodeBlock = (block) => {
    const pre = block.querySelector(":scope > pre");
    const code = pre?.querySelector(":scope > code");
    if (!code || codeBlocks.has(block)) return;
    codeBlocks.add(block);
    const own = { role: pre.hasAttribute("role"), tabindex: pre.hasAttribute("tabindex"), name: pre.hasAttribute("aria-label") || pre.hasAttribute("aria-labelledby") };

    const sync = () => {
      const scrolls = pre.scrollWidth > pre.clientWidth + 1 || pre.scrollHeight > pre.clientHeight + 1;
      pre.toggleAttribute("data-scrolls", scrolls);
      if (!own.role) {
        if (scrolls) pre.setAttribute("role", "region");
        else pre.removeAttribute("role");
      }
      if (!own.tabindex) {
        if (scrolls) pre.tabIndex = 0;
        else pre.removeAttribute("tabindex");
      }
      if (!own.name) {
        pre.removeAttribute("aria-label");
        pre.removeAttribute("aria-labelledby");
        if (!scrolls) return;
        const title = block.querySelector(":scope > .canon-code-block-header > .canon-code-block-title");
        if (title) {
          title.id ||= `canon-code-block-${++codeBlockCount}-title`;
          pre.setAttribute("aria-labelledby", title.id);
        } else pre.setAttribute("aria-label", text(pre, "code", "Code"));
      }
    };

    const observer = new ResizeObserver(sync);
    observer.observe(pre);
    observer.observe(code);
  };

  const setUpCodeBlocks = (root) => {
    const found = [...(root.matches?.(".canon-code-block") ? [root] : []), ...(root.querySelectorAll?.(".canon-code-block") ?? [])];
    for (const block of found) setUpCodeBlock(block);
  };

  /* ------------------------------------------------------------------ */
  /* Data Table                                                          */
  /*                                                                     */
  /* .canon-data-table around a Table (and a Pagination). Headers with   */
  /* aria-sort get a sort button: none, ascending, descending, none;     */
  /* each press fires canon-sort (cancelable) and, with data-local (all  */
  /* rows are in the page), sorts the rows. A select column              */
  /* (data-column="select" on its header) gets select-all, Shift+click   */
  /* ranges and canon-select. Pinned columns (data-pin on a header, the  */
  /* select column at the start, the actions column at the end) stick;   */
  /* the frame says which side has rows under them (data-scroll-start,   */
  /* data-scroll-end). With data-local and a Pagination, canon.js shows  */
  /* one page of rows. While aria-busy="true", skeleton rows stand in.   */
  /* ------------------------------------------------------------------ */

  const dataTables = new WeakSet();
  let dataTableCount = 0;

  const setUpDataTable = (box) => {
    const frame = box.querySelector(":scope > .canon-table");
    const table = frame?.querySelector(":scope > table");
    if (!table || dataTables.has(box)) return;
    dataTables.add(box);
    const local = () => box.hasAttribute("data-local");
    let observer = null;
    const quietly = (fn) => {
      fn();
      observer?.takeRecords();
    };
    const headers = () => [...(table.tHead?.rows[0]?.cells ?? [])];
    const header = (column) => headers().find((cell) => cell.dataset.column === column);
    const bodies = () => [...table.tBodies].filter((body) => !body.hasAttribute("data-canon-skeleton") && !body.hasAttribute("data-canon-message"));
    /* Data rows: as many cells as the header (a message row spans them all). */
    const rows = () => bodies().flatMap((body) => [...body.rows]).filter((row) => row.cells.length === headers().length);
    const original = new WeakMap();
    let counter = 0;
    const remember = () => {
      for (const row of rows()) if (!original.has(row)) original.set(row, counter++);
    };

    /* Columns: copy data-column to every cell of the column; a row with one
       cell (an Empty State, a message) spans the table. */
    const markColumns = () => {
      const count = headers().length;
      headers().forEach((head, index) => {
        for (const row of table.rows) {
          if (row.cells.length !== count || row.parentElement === table.tHead) continue;
          const cell = row.cells[index];
          if (head.dataset.column) cell.dataset.column = head.dataset.column;
          /* A column's alignment and wrapping, written once on its header. */
          for (const key of ["align", "wrap"]) if (head.dataset[key] && !cell.dataset[key]) cell.dataset[key] = head.dataset[key];
          cell.hidden = head.hidden;
        }
      });
      const span = headers().filter((head) => !head.hidden).length;
      for (const body of bodies()) {
        for (const row of body.rows) {
          if (row.cells.length === 1 && count > 1) row.cells[0].colSpan = span;
        }
      }
    };

    /* Sorting */
    const sortValue = (cell) => {
      if (!cell) return "";
      if (cell.dataset.value !== undefined) return cell.dataset.value;
      const time = cell.querySelector("time[datetime]");
      return time ? time.dateTime : cell.textContent.trim();
    };
    const collator = new Intl.Collator(langOf(table), { numeric: true, sensitivity: "base" });
    const compare = (a, b) => {
      const x = Number(a);
      const y = Number(b);
      if (a !== "" && b !== "" && Number.isFinite(x) && Number.isFinite(y)) return x - y;
      return collator.compare(a, b);
    };
    const sortRows = () => {
      const sorted = headers().find((cell) => ["ascending", "descending"].includes(cell.getAttribute("aria-sort")));
      for (const body of bodies()) {
        const list = [...body.rows].filter((row) => row.cells.length === headers().length);
        if (sorted) {
          const index = sorted.cellIndex;
          const sign = sorted.getAttribute("aria-sort") === "descending" ? -1 : 1;
          list.sort((a, b) => sign * compare(sortValue(a.cells[index]), sortValue(b.cells[index])) || original.get(a) - original.get(b));
        } else {
          list.sort((a, b) => original.get(a) - original.get(b));
        }
        body.append(...list);
      }
      showPage();
    };
    const setUpSort = (cell) => {
      if (cell.querySelector(":scope > .canon-data-table-sort")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "canon-data-table-sort";
      button.append(...cell.childNodes);
      cell.append(button);
      button.addEventListener("click", () => {
        const next = { ascending: "descending", descending: "none" }[cell.getAttribute("aria-sort")] ?? "ascending";
        const event = new CustomEvent("canon-sort", {
          bubbles: true,
          cancelable: true,
          detail: { column: cell, index: cell.cellIndex, key: cell.dataset.key ?? button.textContent.trim(), direction: next },
        });
        if (!box.dispatchEvent(event)) return;
        for (const other of headers()) if (other !== cell && other.hasAttribute("aria-sort")) other.setAttribute("aria-sort", "none");
        cell.setAttribute("aria-sort", next);
        if (local()) quietly(sortRows);
      });
    };

    /* Selecting */
    const checkbox = (cell) => cell?.querySelector("input[type='checkbox']");
    const rowBox = (row) => {
      const index = header("select")?.cellIndex;
      return index === undefined ? null : checkbox(row.cells[index]);
    };
    const shownBoxes = () => rows().filter((row) => !row.hidden).map(rowBox).filter((box) => box && !box.disabled);
    const syncAll = () => {
      const all = checkbox(header("select"));
      if (!all) return;
      const boxes = shownBoxes();
      const checked = boxes.filter((box) => box.checked).length;
      all.checked = boxes.length > 0 && checked === boxes.length;
      all.indeterminate = checked > 0 && checked < boxes.length;
      all.disabled = boxes.length === 0;
    };
    const announceSelection = () => {
      const selected = rows().filter((row) => rowBox(row)?.checked);
      const all = everyMatching();
      box.dispatchEvent(new CustomEvent("canon-select", {
        bubbles: true,
        detail: { rows: selected, values: selected.map((row) => rowBox(row).value), allMatching: all, count: all ? matchingTotal() : selected.length },
      }));
      syncBulk();
    };

    /* The bulk bar: while rows are selected, a bar floats at the bottom of
       the window with Clear selection, the count (announced) and the app's
       actions. When the whole page is selected and more rows match, it
       offers to select them all: local rows are checked; for the app's
       rows, canon-select says allMatching (and rows it adds later come
       checked) until the selection changes. */
    const bulkBar = () => box.querySelector(":scope > .canon-data-table-bulk");
    let allRemote = false;
    let bulk = null;
    const formatCount = (n) => {
      try { return new Intl.NumberFormat(langOf(box)).format(n); } catch { return String(n); }
    };
    const matchingTotal = () => {
      if (local()) return rows().filter((row) => !excluded.has(row) && rowBox(row) && !rowBox(row).disabled).length;
      const total = parseInt(pagination()?.dataset.total, 10);
      return Number.isFinite(total) ? total : null;
    };
    const pageSelected = () => {
      const boxes = shownBoxes();
      return boxes.length > 0 && boxes.every((each) => each.checked);
    };
    const everyMatching = () => {
      if (!local()) return allRemote;
      const matching = rows().filter((row) => !excluded.has(row)).map(rowBox).filter((each) => each && !each.disabled);
      return matching.length > shownBoxes().length && matching.every((each) => each.checked);
    };
    const setUpBulk = () => {
      const bar = bulkBar();
      if (!bar || bulk?.bar === bar) return;
      bar.popover = "manual";
      const clear = element(`<button type="button" class="canon-button canon-data-table-bulk-clear" data-emphasis="minimal" data-intent="neutral" data-display="icon"><span class="canon-icon" data-icon="close" aria-hidden="true"></span><span class="canon-button-label"></span></button>`);
      clear.querySelector(".canon-button-label").textContent = say("data-table-clear-selection", "Clear selection");
      const count = element(`<span class="canon-data-table-bulk-count" role="status"></span>`);
      const all = element(`<button type="button" class="canon-link canon-data-table-bulk-all" hidden></button>`);
      const line = element(`<hr class="canon-separator" aria-orientation="vertical">`);
      bar.prepend(clear, count, all, line);
      clear.addEventListener("click", () => {
        allRemote = false;
        for (const row of rows()) {
          const each = rowBox(row);
          if (each && !each.disabled) each.checked = false;
        }
        syncAll();
        announceSelection();
      });
      all.addEventListener("click", () => {
        if (local()) {
          for (const row of rows()) {
            const each = rowBox(row);
            if (each && !each.disabled && !excluded.has(row)) each.checked = true;
          }
        } else allRemote = true;
        syncAll();
        announceSelection();
        clear.focus();
      });
      bulk = { bar, count, all };
    };
    const syncBulk = () => {
      if (!bulk || bulk.bar !== bulkBar()) return;
      const { bar, count, all } = bulk;
      const selected = rows().filter((row) => rowBox(row)?.checked).length;
      const total = matchingTotal();
      const every = everyMatching();
      const offer = !every && pageSelected() && total !== null && total > shownBoxes().length;
      if (every && total !== null) count.textContent = say("data-table-all-selected", "All {count} selected", { count: formatCount(total) });
      else if (offer) count.textContent = say("data-table-page-selected", "All {count} on this page selected", { count: formatCount(shownBoxes().length) });
      else count.textContent = say("data-table-selected", "{count} selected", { count: formatCount(selected) });
      all.hidden = !offer;
      if (offer) all.textContent = say("data-table-select-all", "Select all {count}", { count: formatCount(total) });
      const open = selected > 0 || every;
      if (open && !bar.matches(":popover-open")) bar.showPopover();
      if (!open && bar.matches(":popover-open")) {
        const inside = bar.contains(document.activeElement);
        bar.hidePopover();
        if (inside) (checkbox(header("select")) ?? frame).focus();
      }
    };
    let anchor = null;
    table.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;
      const row = target.closest("tr");
      if (!row || rowBox(row) !== target) return;
      if (event.shiftKey && anchor && anchor !== target) {
        const boxes = shownBoxes();
        const [from, to] = [boxes.indexOf(anchor), boxes.indexOf(target)].sort((a, b) => a - b);
        if (from >= 0) for (const each of boxes.slice(from, to + 1)) each.checked = target.checked;
      }
      anchor = target;
    });
    table.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;
      const all = checkbox(header("select"));
      if (target === all) {
        for (const each of shownBoxes()) each.checked = all.checked;
      } else if (!rowBox(target.closest("tr")) || rowBox(target.closest("tr")) !== target) return;
      allRemote = false;
      syncAll();
      announceSelection();
    });

    /* Pinning */
    const pinColumns = () => {
      const count = headers().length;
      const cells = (index) => [...table.rows].filter((row) => row.cells.length === count).map((row) => row.cells[index]);
      for (const row of table.rows) {
        for (const cell of row.cells) {
          delete cell.dataset.pinned;
          delete cell.dataset.pinEdge;
          cell.style.removeProperty("--canon-pin-offset");
        }
      }
      const start = headers().filter((cell) => cell.dataset.column === "select" || cell.hasAttribute("data-pin"));
      const end = headers().filter((cell) => cell.dataset.column === "actions").reverse();
      for (const [list, side] of [[start, "start"], [end, "end"]]) {
        let offset = 0;
        list.forEach((head, i) => {
          for (const cell of cells(head.cellIndex)) {
            cell.dataset.pinned = side;
            cell.style.setProperty("--canon-pin-offset", `${offset}px`);
            if (i === list.length - 1) cell.dataset.pinEdge = side;
          }
          offset += head.getBoundingClientRect().width;
        });
      }
    };
    const syncScroll = () => {
      const scrolled = Math.abs(frame.scrollLeft);
      const room = frame.scrollWidth - frame.clientWidth;
      frame.toggleAttribute("data-scroll-start", scrolled > 1);
      frame.toggleAttribute("data-scroll-end", room - scrolled > 1);
    };
    frame.addEventListener("scroll", syncScroll, { passive: true });

    /* Local paging: the Pagination counts the rows and shows one page. */
    const pagination = () => box.querySelector(":scope > .canon-pagination");
    let page = null;
    const showPage = () => {
      const nav = pagination();
      if (local()) {
        const all = rows().filter((row) => !excluded.has(row));
        for (const row of excluded) row.hidden = true;
        if (nav) {
          const perPage = Math.max(1, parseInt(nav.dataset.perPage, 10) || 10);
          const pages = Math.max(1, Math.ceil(all.length / perPage));
          page = Math.min(pages, Math.max(1, page ?? (parseInt(nav.dataset.page, 10) || 1)));
          if (nav.dataset.total !== String(all.length)) nav.dataset.total = all.length;
          if (nav.dataset.page !== String(page)) nav.dataset.page = page;
          all.forEach((row, i) => {
            row.hidden = Math.floor(i / perPage) + 1 !== page;
          });
        } else {
          for (const row of all) row.hidden = false;
        }
        syncMessage();
      }
      syncAll();
      syncBulk();
    };
    box.addEventListener("canon-page", (event) => {
      if (!local() || event.target !== pagination()) return;
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        page = event.detail.page;
        showPage();
      });
    });

    /* Loading: skeleton rows, as many as a page (or the rows shown, or 5). */
    let skeleton = null;
    const syncBusy = () => {
      const busy = box.getAttribute("aria-busy") === "true";
      if (!busy) {
        skeleton?.remove();
        skeleton = null;
        return;
      }
      if (skeleton) return;
      const nav = pagination();
      const count = parseInt(box.dataset.loadingRows, 10) || (nav && parseInt(nav.dataset.perPage, 10)) || rows().filter((row) => !row.hidden).length || 5;
      skeleton = document.createElement("tbody");
      skeleton.setAttribute("data-canon-skeleton", "");
      skeleton.setAttribute("aria-hidden", "true");
      const lengths = [80, 65, 90, 55, 75];
      for (let r = 0; r < count; r++) {
        const row = document.createElement("tr");
        headers().forEach((head, c) => {
          const cell = document.createElement("td");
          const shape = document.createElement("span");
          shape.className = "canon-skeleton";
          if (head.dataset.column) cell.dataset.column = head.dataset.column;
          if (head.dataset.column === "select") shape.dataset.shape = "square";
          else if (head.dataset.column === "actions") shape.dataset.shape = "circle";
          else cell.style.setProperty("--canon-skeleton-length", `${lengths[(r + c) % lengths.length]}%`);
          if (head.dataset.align) cell.dataset.align = head.dataset.align;
          cell.hidden = head.hidden;
          cell.append(shape);
          row.append(cell);
        });
        skeleton.append(row);
      }
      table.append(skeleton);
      announce(text(box, "data-table-loading", "Loading"));
    };

    /* ---------------------------------------------------------------- */
    /* Search, filters, columns, export (the toolbar)                    */
    /* ---------------------------------------------------------------- */

    const lang = langOf(box);
    const say = (key, fallback, values) => (values ? fill(text(box, key, fallback), values) : text(box, key, fallback));
    const fold = (value) => String(value).toLocaleLowerCase(lang).normalize("NFD").replace(/\p{M}/gu, "");
    /* A column's name: its header's text, without the buttons canon.js adds. */
    const headLabel = (head) => {
      const sort = head.querySelector(":scope > .canon-data-table-sort");
      if (sort) return sort.textContent.trim();
      return [...head.childNodes].filter((node) => !node.matches?.(".canon-data-table-filter")).map((node) => node.textContent).join("").trim();
    };
    const typed = () => headers().filter((head) => ["text", "number", "date", "choice"].includes(head.dataset.type));
    const operators = {
      text: ["contains", "not-contains", "is", "is-not", "starts", "ends"],
      number: ["eq", "ne", "lt", "le", "gt", "ge"],
      date: ["on", "before", "after"],
      choice: ["is", "is-not"],
    };
    const operatorText = {
      contains: "contains", "not-contains": "doesn't contain", is: "is", "is-not": "is not", starts: "starts with", ends: "ends with",
      eq: "=", ne: "≠", lt: "<", le: "≤", gt: ">", ge: "≥", on: "is", before: "is before", after: "is after",
    };
    const operatorLabel = (operator) => say(`data-table-op-${operator}`, operatorText[operator]);
    const choices = (head) => {
      if (head.dataset.options) return head.dataset.options.split(",").map((value) => value.trim()).filter(Boolean);
      const seen = new Set();
      for (const row of rows()) seen.add(sortValue(row.cells[head.cellIndex]));
      return [...seen].filter(Boolean).sort(compare);
    };
    const choiceLabel = (head, value) => {
      const cell = rows().map((row) => row.cells[head.cellIndex]).find((each) => sortValue(each) === value);
      return cell ? cell.textContent.trim() : value;
    };

    /* One filter per column: { column (its header), operator, values }. */
    let filters = [];
    let query = "";
    const passes = (row, filter) => {
      const cell = row.cells[filter.column.cellIndex];
      const value = sortValue(cell);
      const [wanted] = filter.values;
      switch (filter.column.dataset.type) {
        case "number": {
          const x = Number(value);
          const y = Number(wanted);
          return { eq: x === y, ne: x !== y, lt: x < y, le: x <= y, gt: x > y, ge: x >= y }[filter.operator];
        }
        case "date": {
          const day = value.slice(0, 10);
          return { on: day === wanted, before: day < wanted, after: day > wanted }[filter.operator];
        }
        case "choice": {
          const hit = filter.values.includes(value);
          return filter.operator === "is-not" ? !hit : hit;
        }
        default: {
          const have = fold(cell?.textContent.trim() ?? "");
          const want = fold(wanted);
          return {
            contains: have.includes(want), "not-contains": !have.includes(want), is: have === want,
            "is-not": have !== want, starts: have.startsWith(want), ends: have.endsWith(want),
          }[filter.operator];
        }
      }
    };
    const searchText = new WeakMap();
    const rowText = (row) => {
      if (!searchText.has(row)) {
        searchText.set(row, fold([...row.cells].filter((cell) => !cell.dataset.column).map((cell) => cell.textContent.trim()).join(" ")));
      }
      return searchText.get(row);
    };
    const excluded = new Set();
    const narrowed = () => query !== "" || filters.length > 0;
    const describe = (filter) => {
      const values = filter.column.dataset.type === "choice" ? filter.values.map((value) => choiceLabel(filter.column, value)).join(", ") : filter.values[0];
      return `${headLabel(filter.column)} ${operatorLabel(filter.operator)} ${values}`;
    };

    /* Local rows: hide those the search and filters leave out. The app
       hears canon-filter either way. */
    const exclude = () => {
      excluded.clear();
      if (!local()) return;
      const words = fold(query.trim()).split(/\s+/).filter(Boolean);
      for (const row of rows()) {
        const ok = words.every((word) => rowText(row).includes(word)) && filters.every((filter) => passes(row, filter));
        if (!ok) excluded.add(row);
      }
    };
    const applyFilters = (reset = true) => {
      box.dispatchEvent(new CustomEvent("canon-filter", {
        bubbles: true,
        detail: {
          query,
          filters: filters.map((filter) => ({ column: filter.column, key: filter.column.dataset.key ?? headLabel(filter.column), operator: filter.operator, values: [...filter.values] })),
        },
      }));
      exclude();
      if (reset) page = 1;
      if (!local()) allRemote = false;
      quietly(showPage);
      renderChips();
      for (const head of typed()) {
        const button = head.querySelector(":scope > .canon-data-table-filter");
        if (button) button.hidden = !filters.some((filter) => filter.column === head);
      }
    };

    /* A message when nothing local matches. */
    let message = null;
    const syncMessage = () => {
      const none = local() && narrowed() && rows().every((row) => excluded.has(row));
      if (!none) {
        message?.remove();
        message = null;
        return;
      }
      if (message) return;
      message = document.createElement("tbody");
      message.setAttribute("data-canon-message", "");
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = headers().filter((head) => !head.hidden).length;
      const custom = box.querySelector(":scope > template.canon-data-table-no-results");
      if (custom) cell.append(custom.content.cloneNode(true));
      else {
        cell.innerHTML = `<div class="canon-empty-state"><span class="canon-empty-state-icon" aria-hidden="true"><span class="canon-icon" data-icon="search-x" aria-hidden="true"></span></span><p class="canon-empty-state-title"></p><p class="canon-empty-state-description"></p><div class="canon-empty-state-actions"><button type="button" class="canon-button"><span class="canon-button-label"></span></button></div></div>`;
        cell.querySelector(".canon-empty-state-title").textContent = say("data-table-no-results", "No results");
        cell.querySelector(".canon-empty-state-description").textContent = say("data-table-no-results-hint", "Nothing matches the search or filters.");
        cell.querySelector(".canon-button-label").textContent = say("data-table-clear-filters", "Clear filters");
      }
      cell.querySelector(".canon-button:not([data-clear-filters])")?.setAttribute("data-clear-filters", "");
      row.append(cell);
      message.append(row);
      table.append(message);
    };
    const clearAll = () => {
      filters = [];
      query = "";
      const search = searchInput();
      if (search) search.value = "";
      applyFilters();
    };
    box.addEventListener("click", (event) => {
      if (event.target.closest?.("[data-clear-filters]") && box.contains(event.target)) clearAll();
    });

    /* Search: local rows narrow as you type; the app hears it after a pause. */
    const toolbar = () => box.querySelector(":scope > .canon-data-table-toolbar");
    const searchInput = () => toolbar()?.querySelector("input[type='search']");
    let searchTimer = null;
    box.addEventListener("input", (event) => {
      if (event.target !== searchInput()) return;
      clearTimeout(searchTimer);
      const run = () => {
        query = event.target.value;
        applyFilters();
      };
      if (local()) run();
      else searchTimer = setTimeout(run, 250);
    });

    /* Popovers canon.js draws live in the data table, after the table. */
    let popoverCount = 0;
    const tableId = box.id || `canon-data-table-${++dataTableCount}`;
    const makePopover = (className, label) => {
      const popover = document.createElement("div");
      popover.className = `canon-popover ${className}`;
      popover.id = `${tableId}-${className.replace("canon-data-table-", "")}-${++popoverCount}`;
      popover.popover = "auto";
      popover.setAttribute("role", "dialog");
      popover.setAttribute("aria-label", label);
      box.append(popover);
      return popover;
    };
    const element = (html) => {
      const holder = document.createElement("div");
      holder.innerHTML = html.trim();
      return holder.firstElementChild;
    };
    const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const selectBox = (label, options, value) =>
      element(`<div class="canon-select"><select aria-label="${escapeHtml(label)}">${options.map(([v, l]) => `<option value="${escapeHtml(v)}"${v === value ? " selected" : ""}>${escapeHtml(l)}</option>`).join("")}</select></div>`);
    const valueControl = (head, filter) => {
      const label = say("data-table-filter-value", "Value");
      const type = head.dataset.type;
      if (type === "choice") {
        const picked = filter?.values ?? [];
        return element(`<div class="canon-combobox"><select multiple aria-label="${escapeHtml(label)}">${choices(head).map((value) => `<option value="${escapeHtml(value)}"${picked.includes(value) ? " selected" : ""}>${escapeHtml(choiceLabel(head, value))}</option>`).join("")}</select></div>`);
      }
      if (type === "date") return element(`<div class="canon-date"><input type="date" aria-label="${escapeHtml(label)}" value="${escapeHtml(filter?.values[0] ?? "")}"></div>`);
      return element(`<div class="canon-text-input"><input type="${type === "number" ? "number" : "text"}" aria-label="${escapeHtml(label)}" value="${escapeHtml(filter?.values[0] ?? "")}"></div>`);
    };
    const readValues = (control) => {
      const select = control.querySelector("select");
      if (select) return [...select.selectedOptions].map((option) => option.value);
      const value = control.querySelector("input")?.value.trim() ?? "";
      return value === "" ? [] : [value];
    };
    const setFilter = (head, operator, values) => {
      filters = filters.filter((filter) => filter.column !== head);
      if (values.length) filters.push({ column: head, operator, values });
    };

    /* A column's own filter: its header's filter button and its chip open it. */
    const columnPopovers = new Map();
    const columnPopover = (head) => {
      if (columnPopovers.has(head)) return columnPopovers.get(head);
      const popover = makePopover("canon-data-table-filter-panel", say("data-table-filter-for", "Filter {column}", { column: headLabel(head) }));
      popover.addEventListener("beforetoggle", (event) => {
        if (event.newState !== "open") return;
        const filter = filters.find((each) => each.column === head);
        const form = element(`<form class="canon-data-table-filter-row"></form>`);
        form.append(
          selectBox(say("data-table-filter-operator", "Condition"), operators[head.dataset.type].map((op) => [op, operatorLabel(op)]), filter?.operator),
          valueControl(head, filter),
          element(`<button type="submit" class="canon-button" data-emphasis="high"><span class="canon-button-label">${escapeHtml(say("data-table-apply", "Apply"))}</span></button>`),
        );
        form.addEventListener("submit", (submit) => {
          submit.preventDefault();
          const [operatorBox, control] = form.children;
          setFilter(head, operatorBox.querySelector("select").value, readValues(control));
          popover.hidePopover();
          applyFilters();
          /* Its filter gone, the header button goes too: focus moves on. */
          if (!filters.some((filter) => filter.column === head)) (chips?.querySelector(".canon-data-table-chip-edit") ?? toolbar()?.querySelector("[data-panel='filters']") ?? frame).focus();
        });
        popover.replaceChildren(form);
      });
      columnPopovers.set(head, popover);
      return popover;
    };
    /* A filtered column shows a filter button in its header, which opens
       its filter; unfiltered columns have none. */
    const setUpHeaderFilter = (head) => {
      if (!head.dataset.type || head.querySelector(":scope > .canon-data-table-filter")) return;
      const button = element(`<button type="button" class="canon-data-table-filter" aria-haspopup="dialog" aria-expanded="false" hidden><span class="canon-visually-hidden"></span></button>`);
      button.firstElementChild.textContent = say("data-table-edit-column-filter", "Edit the {column} filter", { column: headLabel(head) });
      button.setAttribute("popovertarget", columnPopover(head).id);
      head.append(button);
    };

    /* Chips: one per filter, under the toolbar; a chip opens its filter, its
       x removes it; Clear all after them. */
    let chips = null;
    const renderChips = () => {
      if (!filters.length) {
        chips?.remove();
        chips = null;
        return;
      }
      if (!chips) {
        chips = document.createElement("div");
        chips.className = "canon-data-table-chips";
        chips.setAttribute("role", "group");
        chips.setAttribute("aria-label", say("data-table-filters", "Filters"));
        const after = toolbar();
        if (after) after.after(chips);
        else box.prepend(chips);
      }
      chips.replaceChildren(
        ...filters.map((filter) => {
          const chip = element(`<span class="canon-data-table-chip"><button type="button" class="canon-data-table-chip-edit" aria-haspopup="dialog" aria-expanded="false"></button><button type="button" class="canon-data-table-chip-remove"></button></span>`);
          const [edit, remove] = chip.children;
          const parts = [headLabel(filter.column), operatorLabel(filter.operator)];
          for (const part of parts) edit.append(Object.assign(document.createElement("span"), { textContent: part }));
          const value = document.createElement("span");
          if (filter.column.dataset.type === "choice") {
            value.className = "canon-data-table-chip-values";
            for (const each of filter.values.slice(0, 2)) {
              const sample = rows().map((row) => row.cells[filter.column.cellIndex]).find((cell) => sortValue(cell) === each)?.querySelector(".canon-tag");
              value.append(sample ? sample.cloneNode(true) : Object.assign(document.createElement("span"), { textContent: choiceLabel(filter.column, each) }));
            }
            if (filter.values.length > 2) value.append(Object.assign(document.createElement("span"), { className: "canon-tag", innerHTML: `<span class="canon-tag-label">+${filter.values.length - 2}</span>` }));
          } else {
            value.textContent = filter.values[0];
          }
          edit.append(value);
          edit.setAttribute("aria-label", say("data-table-edit-filter", "Edit filter: {filter}", { filter: describe(filter) }));
          edit.setAttribute("popovertarget", columnPopover(filter.column).id);
          remove.setAttribute("aria-label", say("data-table-remove-filter", "Remove filter: {filter}", { filter: describe(filter) }));
          remove.addEventListener("click", () => {
            filters = filters.filter((each) => each !== filter);
            applyFilters();
            (chips?.querySelector(".canon-data-table-chip-edit") ?? toolbar()?.querySelector("[data-panel='filters']"))?.focus();
          });
          return chip;
        }),
        element(`<button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-clear-filters><span class="canon-button-label">${escapeHtml(say("data-table-clear-all", "Clear all"))}</span></button>`),
      );
    };

    /* The filter builder: a row per filter (column, condition, value), Add
       filter, Apply filter. Nothing changes until Apply. */
    let builder = null;
    const builderRow = (head, filter) => {
      const row = element(`<div class="canon-data-table-filter-row"></div>`);
      const columnBox = selectBox(say("data-table-filter-column", "Column"), typed().map((each) => [String(typed().indexOf(each)), headLabel(each)]), String(typed().indexOf(head)));
      const fillRest = (column, current) => {
        const operatorBox = selectBox(say("data-table-filter-operator", "Condition"), operators[column.dataset.type].map((op) => [op, operatorLabel(op)]), current?.operator);
        const remove = element(`<button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon"><span class="canon-icon" data-icon="close" aria-hidden="true"></span><span class="canon-button-label">${escapeHtml(say("data-table-remove-row", "Remove filter"))}</span></button>`);
        remove.addEventListener("click", () => {
          row.remove();
          builder.querySelector(".canon-data-table-filter-row select")?.focus();
        });
        row.replaceChildren(columnBox, operatorBox, valueControl(column, current), remove);
      };
      columnBox.querySelector("select").addEventListener("change", (event) => fillRest(typed()[Number(event.target.value)]));
      fillRest(head, filter);
      return row;
    };
    const setUpBuilder = (button) => {
      if (builder) return;
      builder = makePopover("canon-data-table-filters", say("data-table-filters", "Filters"));
      button.setAttribute("popovertarget", builder.id);
      button.setAttribute("aria-expanded", "false");
      builder.addEventListener("beforetoggle", (event) => {
        if (event.newState !== "open") return;
        const form = element(`<form><div class="canon-data-table-filter-rows"></div><div class="canon-data-table-filter-footer"></div></form>`);
        const list = form.firstElementChild;
        const footer = form.lastElementChild;
        const start = filters.length ? filters : typed().length ? [{ column: typed()[0] }] : [];
        for (const filter of start) list.append(builderRow(filter.column, filter.values ? filter : null));
        const add = element(`<button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral"><span class="canon-icon" data-icon="plus" aria-hidden="true"></span><span class="canon-button-label">${escapeHtml(say("data-table-add-filter", "Add filter"))}</span></button>`);
        add.addEventListener("click", () => {
          const used = [...list.children].map((row) => typed()[Number(row.querySelector("select").value)]);
          const next = typed().find((head) => !used.includes(head)) ?? typed()[0];
          if (!next) return;
          const row = builderRow(next);
          list.append(row);
          row.querySelector("select").focus();
        });
        footer.append(add, element(`<button type="submit" class="canon-button" data-emphasis="high"><span class="canon-button-label">${escapeHtml(say("data-table-apply-filter", "Apply filter"))}</span></button>`));
        form.addEventListener("submit", (submit) => {
          submit.preventDefault();
          filters = [];
          for (const row of list.children) {
            const [columnBox, operatorBox, control] = row.children;
            setFilter(typed()[Number(columnBox.querySelector("select").value)], operatorBox.querySelector("select").value, readValues(control));
          }
          builder.hidePopover();
          applyFilters();
        });
        builder.replaceChildren(form);
      });
    };

    /* Columns: show, hide, order and pin the data columns. */
    const dataColumns = () => headers().filter((head) => !head.dataset.column);
    const moveColumn = (head, before) => {
      const count = headers().length;
      const from = head.cellIndex;
      /* Never past the actions column, which stays last. */
      const stop = before ?? header("actions");
      const to = stop ? stop.cellIndex : count;
      for (const row of table.rows) {
        if (row.cells.length !== count) continue;
        row.insertBefore(row.cells[from], to < count ? row.cells[to] : null);
      }
    };
    const pinnedEnd = () => {
      const start = headers().filter((head) => head.dataset.column === "select" || head.hasAttribute("data-pin"));
      return start.at(-1)?.cellIndex ?? -1;
    };
    const announceColumns = () => {
      box.dispatchEvent(new CustomEvent("canon-columns", {
        bubbles: true,
        detail: { columns: dataColumns().map((head) => ({ column: head, key: head.dataset.key ?? headLabel(head), hidden: head.hidden, pinned: head.hasAttribute("data-pin") })) },
      }));
    };
    const showColumn = (head, shown) => {
      const count = headers().length;
      const index = head.cellIndex;
      for (const row of table.rows) if (row.cells.length === count) row.cells[index].hidden = !shown;
      const span = headers().filter((each) => !each.hidden).length;
      for (const row of table.rows) if (row.cells.length === 1 && count > 1) row.cells[0].colSpan = span;
    };
    let columnsPanel = null;
    const renderColumns = (focusKey) => {
      if (!columnsPanel) return;
      const list = dataColumns();
      const pinned = list.filter((head) => head.hasAttribute("data-pin"));
      const rest = list.filter((head) => !head.hasAttribute("data-pin"));
      const visible = list.filter((head) => !head.hidden).length;
      const items = [];
      const item = (head, group) => {
        const name = headLabel(head);
        const id = `${columnsPanel.id}-${list.indexOf(head)}`;
        const row = element(`<div class="canon-data-table-column"><button type="button" class="canon-data-table-grip"><span class="canon-icon" data-icon="grip-vertical" aria-hidden="true"></span><span class="canon-visually-hidden"></span></button><div class="canon-choice"><input type="checkbox" id="${id}"><label class="canon-choice-label" for="${id}"></label></div><button type="button" class="canon-button" data-display="icon" data-emphasis="minimal" data-size="sm" aria-pressed="false"><span class="canon-icon" data-icon="pin" aria-hidden="true"></span><span class="canon-button-label"></span></button></div>`);
        const [grip, choice, pin] = row.children;
        grip.lastElementChild.textContent = say("data-table-move-column", "Move {column}", { column: name });
        grip.setAttribute("aria-keyshortcuts", "ArrowUp ArrowDown");
        grip.dataset.key = `grip-${list.indexOf(head)}`;
        const box_ = choice.querySelector("input");
        box_.checked = !head.hidden;
        box_.disabled = !head.hidden && visible === 1;
        choice.querySelector("label").textContent = name;
        pin.setAttribute("aria-pressed", String(head.hasAttribute("data-pin")));
        pin.lastElementChild.textContent = say("data-table-pin-column", "Pin {column}", { column: name });
        pin.dataset.key = `pin-${list.indexOf(head)}`;
        box_.addEventListener("change", () => {
          showColumn(head, box_.checked);
          quietly(() => pinColumns());
          announceColumns();
          renderColumns(box_.id);
        });
        pin.addEventListener("click", () => {
          const pinning = !head.hasAttribute("data-pin");
          quietly(() => {
            /* Pinned columns come first: pinning moves a column to the end
               of the pinned ones, unpinning to the start of the rest. */
            if (pinning) {
              moveColumn(head, headers()[pinnedEnd() + 1]);
              head.setAttribute("data-pin", "");
            } else {
              head.removeAttribute("data-pin");
              moveColumn(head, headers()[pinnedEnd() + 1]);
            }
            pinColumns();
          });
          announceColumns();
          renderColumns(pin.dataset.key);
        });
        const step = (direction) => {
          const siblings = group;
          const at = siblings.indexOf(head);
          const target = siblings[at + direction];
          if (!target) return;
          quietly(() => {
            moveColumn(head, direction < 0 ? target : headers()[target.cellIndex + 1]);
            pinColumns();
          });
          announceColumns();
          renderColumns(grip.dataset.key.replace(/\d+$/, String(dataColumns().indexOf(head))));
          announce(say("data-table-moved", "{column}, position {position} of {count}", { column: name, position: dataColumns().indexOf(head) + 1, count: dataColumns().length }));
        };
        grip.addEventListener("keydown", (event) => {
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            step(event.key === "ArrowUp" ? -1 : 1);
          }
        });
        /* Drag: the row follows the pointer within its group. */
        grip.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          grip.setPointerCapture(event.pointerId);
          row.dataset.dragging = "";
          const move = (moveEvent) => {
            const rowsInPanel = [...columnsPanel.querySelectorAll(".canon-data-table-column")];
            const mine = rowsInPanel.filter((each) => each.dataset.group === row.dataset.group);
            const over = mine.find((each) => {
              const rect = each.getBoundingClientRect();
              return moveEvent.clientY >= rect.top && moveEvent.clientY < rect.bottom;
            });
            if (!over || over === row) return;
            const direction = mine.indexOf(over) < mine.indexOf(row) ? -1 : 1;
            const target = group[group.indexOf(head) + direction];
            if (!target) return;
            quietly(() => {
              moveColumn(head, direction < 0 ? target : headers()[target.cellIndex + 1]);
              pinColumns();
            });
            if (direction < 0) over.before(row);
            else over.after(row);
            group.splice(group.indexOf(head), 1);
            group.splice(group.indexOf(target) + (direction < 0 ? 0 : 1), 0, head);
          };
          const end = () => {
            delete row.dataset.dragging;
            grip.removeEventListener("pointermove", move);
            grip.removeEventListener("pointerup", end);
            grip.removeEventListener("pointercancel", end);
            announceColumns();
          };
          grip.addEventListener("pointermove", move);
          grip.addEventListener("pointerup", end);
          grip.addEventListener("pointercancel", end);
        });
        row.dataset.group = group === pinned ? "pinned" : "rest";
        return row;
      };
      for (const head of pinned) items.push(item(head, pinned));
      if (pinned.length && rest.length) items.push(element(`<hr class="canon-separator">`));
      for (const head of rest) items.push(item(head, rest));
      columnsPanel.replaceChildren(...items);
      if (focusKey) (columnsPanel.querySelector(`[data-key="${focusKey}"]`) ?? columnsPanel.querySelector(`#${CSS.escape(focusKey)}`))?.focus();
    };
    const setUpColumns = (button) => {
      if (columnsPanel) return;
      columnsPanel = makePopover("canon-data-table-columns", say("data-table-columns", "Columns"));
      button.setAttribute("popovertarget", columnsPanel.id);
      button.setAttribute("aria-expanded", "false");
      columnsPanel.addEventListener("beforetoggle", (event) => {
        if (event.newState === "open") renderColumns();
      });
    };

    /* Export: an item with data-export fires canon-export; for "csv" canon.js
       downloads the rows that match (all pages), in the columns shown. */
    box.addEventListener("click", (event) => {
      const item = event.target.closest?.("[data-export]");
      if (!item || !box.contains(item)) return;
      const format = item.dataset.export;
      const columns = dataColumns().filter((head) => !head.hidden);
      const list = rows().filter((row) => !excluded.has(row));
      const exporting = new CustomEvent("canon-export", { bubbles: true, cancelable: true, detail: { format, rows: list, columns } });
      if (!box.dispatchEvent(exporting) || format !== "csv") return;
      const quote = (value) => (/[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
      const lines = [columns.map((head) => quote(headLabel(head))).join(",")];
      for (const row of list) lines.push(columns.map((head) => quote(row.cells[head.cellIndex].textContent.trim().replace(/\s+/g, " "))).join(","));
      const name = box.dataset.exportName || table.caption?.textContent.trim() || "table";
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
      link.download = `${name}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    });

    /* Truncated cells: the text in a span that ends in "…"; the full text
       as a tooltip (title) only while it is cut. data-wrap="middle" cuts
       plain text in its middle instead, keeping its end (its last third,
       at least 8 characters and a file name's extension with the 5
       before it), where file names, paths and ids differ. In an editable cell, its value. */
    const characters = (text) => ("Segmenter" in Intl ? [...new Intl.Segmenter().segment(text)].map((part) => part.segment) : [...text]);
    const cutMiddle = (span) => {
      const value = span.textContent.trim();
      if (span.children.length || !value) return;
      const all = characters(value);
      const extension = value.match(/\.[A-Za-z0-9]{1,5}$/);
      const keep = Math.min(all.length - 1, Math.max(8, Math.ceil(all.length / 3), extension ? characters(extension[0]).length + 5 : 0));
      if (keep < 1) return;
      span.dataset.cut = "middle";
      /* Its halves in the text's own direction: a file name reads left to
         right on a right-to-left page too. */
      span.dir = "auto";
      span.replaceChildren(
        Object.assign(document.createElement("span"), { textContent: all.slice(0, -keep).join("") }),
        Object.assign(document.createElement("span"), { textContent: all.slice(-keep).join("") }),
      );
    };
    const truncate = () => {
      for (const cell of table.querySelectorAll("tbody :is(td, th):is([data-wrap='truncate'], [data-wrap='middle'])")) {
        const holder = shownValue(cell) ?? cell;
        if (holder.querySelector(".canon-data-table-truncate")) continue;
        const span = document.createElement("span");
        span.className = "canon-data-table-truncate";
        span.append(...holder.childNodes);
        holder.append(span);
        if (cell.dataset.wrap === "middle") cutMiddle(span);
      }
    };
    table.addEventListener("pointerover", (event) => {
      const span = event.target.closest?.(".canon-data-table-truncate");
      if (!span) return;
      const cut = span.dataset.cut ? span.firstElementChild : span;
      if (cut.scrollWidth > cut.clientWidth) span.title = span.textContent.trim();
      else span.removeAttribute("title");
    });

    const setUpTools = () => {
      const bar = toolbar();
      const filterButton = bar?.querySelector("[data-panel='filters']");
      const columnsButton = bar?.querySelector("[data-panel='columns']");
      if (filterButton) setUpBuilder(filterButton);
      if (columnsButton) setUpColumns(columnsButton);
      for (const head of headers()) setUpHeaderFilter(head);
    };

    /* Editing cells: in a data-edit column (not data-edit="none" on the
       cell, its row or the data table), each cell's content goes in a
       button (.canon-data-table-edit > .canon-data-table-value) that
       opens an editor (data-canon-editor) in its place: the header's
       template, else one for its data-type. Enter or leaving saves,
       Escape puts the value back. Alone, each change fires canon-edit
       (cancelable: the app saves and answers canon-saved or
       canon-save-failed on the cell); in a form with a Save Bar it
       changes the cell's field instead. */
    const form = box.closest("form");
    const batch = () => !!form?.querySelector(".canon-save-bar");
    const editHint = document.createElement("span");
    editHint.className = "canon-data-table-edit-hint";
    const editId = box.id || `canon-data-table-${++dataTableCount}`;
    editHint.id = `${editId}-edit-hint`;
    editHint.hidden = true;
    editHint.textContent = say("data-table-edit", "Edit");
    box.append(editHint);
    const editColumn = (cell) => {
      const head = headers()[cell.cellIndex];
      return head?.hasAttribute("data-edit") && head.dataset.edit !== "none" && head.dataset.column !== "select" && cell.parentElement.parentElement !== table.tHead ? head : null;
    };
    const editable = (cell) => !!editColumn(cell) && !cell.closest("[data-edit='none']");
    const fieldOf = (cell) => cell.querySelector(":scope > input[hidden][name]");
    const valueOf = (cell) => fieldOf(cell)?.value ?? sortValue(cell);
    const editButton = (cell) => cell.querySelector(":scope > .canon-data-table-edit");
    const shownValue = (cell) => editButton(cell)?.firstElementChild;
    const rowName = (row) => (row.querySelector(":scope > th[scope='row']") ?? [...row.cells].find((cell) => !cell.dataset.column))?.textContent.trim() ?? "";
    /* An empty cell's button says so; the value is its name otherwise. */
    const nameEdit = (cell) => {
      const button = editButton(cell);
      if (!button) return;
      if (button.textContent.trim() || button.querySelector("img[alt]:not([alt='']), [role='img']")) button.removeAttribute("aria-label");
      else button.setAttribute("aria-label", say("data-table-empty", "Empty"));
    };
    const describeEdit = (cell, message) => {
      const button = editButton(cell);
      if (button) button.setAttribute("aria-describedby", message ? `${editHint.id} ${message.id}` : editHint.id);
      /* A checkbox or switch: the message alone. */
      const input = cell.querySelector(":scope > .canon-choice > input");
      if (!input) return;
      if (message) input.setAttribute("aria-describedby", message.id);
      else if (input.getAttribute("aria-describedby")?.startsWith(`${editId}-failed-`)) input.removeAttribute("aria-describedby");
    };
    const setUpEditing = () => {
      for (const row of rows()) {
        for (const cell of row.cells) {
          if (!editable(cell) || editButton(cell) || cell.dataset.state === "editing" || cell.querySelector(":scope > .canon-choice")) continue;
          const button = document.createElement("button");
          button.type = "button";
          button.className = "canon-data-table-edit";
          const shown = document.createElement("span");
          shown.className = "canon-data-table-value";
          const field = fieldOf(cell);
          shown.append(...[...cell.childNodes].filter((node) => node !== field));
          button.append(shown);
          cell.prepend(button);
          describeEdit(cell);
          nameEdit(cell);
        }
      }
      /* Cells no longer editable (data-edit="none" added) get their content back. */
      for (const button of table.querySelectorAll("tbody .canon-data-table-edit")) {
        const cell = button.parentElement;
        if (editable(cell)) continue;
        button.replaceWith(...button.firstElementChild.childNodes);
      }
    };

    /* What a column is edited with. */
    const typable = (head) => {
      const template = head.querySelector(":scope > template.canon-data-table-editor");
      if (template) return !!template.content.querySelector(":is(.canon-text-input, .canon-control, .canon-textarea) > :is(input:not([type]), input[type='text'], input[type='number'], input[type='email'], input[type='url'], input[type='tel'], textarea)");
      return !["choice", "date"].includes(head.dataset.type);
    };
    const choicesOf = (head) => (head.dataset.options
      ? head.dataset.options.split(",").map((option) => option.trim()).filter(Boolean)
      : [...new Set(rows().map((row) => sortValue(row.cells[head.cellIndex])).filter(Boolean))]);
    const makeEditor = (head) => {
      const template = head.querySelector(":scope > template.canon-data-table-editor");
      let editor = template?.content.firstElementChild?.cloneNode(true);
      if (!editor) {
        if (head.dataset.type === "choice") {
          editor = fromMarkup(`<div class="canon-select"><select></select></div>`);
          editor.firstElementChild.append(...choicesOf(head).map((option) => new Option(option, option)));
        } else if (head.dataset.type === "date") editor = fromMarkup(`<div class="canon-date"><input type="date"></div>`);
        else if (head.dataset.type === "number") editor = fromMarkup(`<div class="canon-text-input"><input type="number" step="any"></div>`);
        else editor = fromMarkup(`<div class="canon-text-input"><input type="text"></div>`);
      }
      editor.setAttribute("data-canon-editor", "");
      return editor;
    };

    /* The new value in the cell: a choice as another cell with that value
       shows it (its Tag), else its label; a number in the reader's format,
       kept in its words ("40 days", "$495.90") when the old one shows in
       them; a date as a <time>; text as it is. */
    const numberToken = /[-+−]?\d[\d.,  ' ]*\d|[-+−]?\d/;
    const drawValue = (cell, head, value, previous, control) => {
      const shown = shownValue(cell);
      const lang = langOf(cell);
      if (control.matches("select")) {
        const twin = rows().map((row) => row.cells[head.cellIndex]).find((other) => other !== cell && sortValue(other) === value && shownValue(other));
        if (twin) return shown.replaceChildren(...[...shownValue(twin).childNodes].map((node) => node.cloneNode(true)));
        const option = [...control.options].find((each) => each.value === value);
        if (!option?.firstElementChild) return shown.replaceChildren(option ? option.label : value);
        /* The option's own face (an avatar or icon, its label), sized as
           the column's other avatars are. */
        const face = [...option.childNodes].map((node) => node.cloneNode(true));
        const holder = document.createElement("span");
        holder.append(...face);
        holder.querySelectorAll(".canon-option-description").forEach((each) => each.remove());
        holder.querySelectorAll(".canon-option-label").forEach((each) => each.replaceWith(each.textContent));
        for (const node of [...holder.childNodes]) if (node.nodeType === 3 && !node.textContent.trim()) node.remove();
        const size = rows().map((row) => row.cells[head.cellIndex]?.querySelector(".canon-avatar[data-size]")).find(Boolean)?.dataset.size;
        if (size) holder.querySelectorAll(".canon-avatar:not([data-size])").forEach((avatar) => { avatar.dataset.size = size; });
        return shown.replaceChildren(...holder.childNodes);
      }
      if (control.matches("input[type='date']") && value) {
        const time = document.createElement("time");
        time.dateTime = value;
        const [y, m, d] = value.split("-").map(Number);
        time.textContent = new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(new Date(y, m - 1, d));
        return shown.replaceChildren(time);
      }
      if (control.matches("input[type='number']") && value !== "" && Number.isFinite(Number(value))) {
        const old = shown.textContent;
        const match = old.match(numberToken);
        const decimals = (text) => (text.match(/[.,](\d+)$/)?.[1].length ?? 0);
        if (match && previous !== "" && Number(previous) === Number(match[0].replace(/[^\d.,\-−]/g, "").replace(/,(?=\d{3}\b)/g, "").replace(",", ".").replace("−", "-"))) {
          const digits = decimals(match[0]);
          const formatted = new Intl.NumberFormat(lang, { minimumFractionDigits: digits, maximumFractionDigits: Math.max(digits, decimals(value)) }).format(Number(value));
          return shown.replaceChildren(old.replace(match[0], formatted));
        }
        return shown.replaceChildren(new Intl.NumberFormat(lang, { maximumFractionDigits: 20 }).format(Number(value)));
      }
      shown.replaceChildren(value);
    };

    let editing = null;
    let editMessage = null;
    const pending = new WeakMap();
    const originals = new Map();

    /* A message beside the editor (invalid) or the cell (failed): a Tooltip. */
    const showEditMessage = (anchor, message) => {
      if (!editMessage) {
        editMessage = fromMarkup(`<div class="canon-tooltip" popover="manual" role="tooltip" data-placement="block-end inline-start"></div>`);
        editMessage.id = `${editId}-edit-message`;
        box.append(editMessage);
      }
      editMessage.textContent = message;
      /* Anchored to the editor by a name of its own (kept beside the box's). */
      const name = `--${editId}-editor`;
      const names = anchor.style.anchorName && anchor.style.anchorName !== "none" ? anchor.style.anchorName.split(/\s*,\s*/) : [];
      if (!names.includes(name)) anchor.style.anchorName = [...names, name].join(", ");
      editMessage.style.positionAnchor = name;
      editMessage.style.setProperty("--canon-tooltip-anchor", name);
      if (editMessage.matches(":popover-open")) editMessage.hidePopover();
      try { editMessage.showPopover({ source: anchor }); } catch { editMessage.showPopover(); }
    };
    const hideEditMessage = () => { if (editMessage?.matches(":popover-open")) editMessage.hidePopover(); };
    const failedTips = new WeakMap();
    const clearFailed = (cell) => {
      if (cell.dataset.state === "failed") delete cell.dataset.state;
      failedTips.get(cell)?.remove();
      failedTips.delete(cell);
      editButton(cell)?.removeAttribute("interestfor");
      describeEdit(cell);
    };
    const markFailed = (cell, message) => {
      clearFailed(cell);
      cell.dataset.state = "failed";
      const tip = fromMarkup(`<div class="canon-tooltip" popover="hint" role="tooltip"></div>`);
      tip.id = `${editId}-failed-${++dataTableCount}`;
      tip.textContent = message;
      box.append(tip);
      failedTips.set(cell, tip);
      editButton(cell)?.setAttribute("interestfor", tip.id);
      describeEdit(cell, tip);
      announce(message);
    };

    const closeEditor = () => {
      const { cell, editor } = editing;
      editing = null;
      hideEditMessage();
      quietly(() => {
        editor.remove();
        if (cell.dataset.state === "editing") delete cell.dataset.state;
      });
    };
    const cancelEdit = (refocus) => {
      if (!editing) return;
      const { cell } = editing;
      closeEditor();
      if (refocus) editButton(cell)?.focus();
    };

    /* The edit stands: written in the cell, then saved by the app or the form. */
    const applyEdit = (cell, head, value, previous, control) => {
      const field = fieldOf(cell);
      const shown = shownValue(cell);
      const before = { nodes: [...shown.childNodes].map((node) => node.cloneNode(true)), dataValue: cell.getAttribute("data-value") };
      quietly(() => {
        cell.dataset.value = value;
        if (field) field.value = value;
        drawValue(cell, head, value, previous, control);
        nameEdit(cell);
        truncate();
      });
      const detail = { value, previous, row: cell.parentElement, column: head.cellIndex, key: head.dataset.key || headLabel(head), name: field?.name ?? "", content: shown };
      if (batch()) {
        if (!originals.has(cell)) originals.set(cell, before);
        field?.dispatchEvent(new Event("input", { bubbles: true }));
        field?.dispatchEvent(new Event("change", { bubbles: true }));
        if (field && field.value === field.defaultValue) delete cell.dataset.state;
        else cell.dataset.state = "changed";
        cell.dispatchEvent(new CustomEvent("canon-edit", { bubbles: true, detail }));
        return;
      }
      if (cell.dispatchEvent(new CustomEvent("canon-edit", { bubbles: true, cancelable: true, detail }))) return;
      pending.set(cell, { previous, before, restore: null });
      cell.dataset.state = "saving";
      editButton(cell)?.setAttribute("aria-disabled", "true");
    };

    const commitEdit = (refocus) => {
      if (!editing) return;
      const { cell, head, control, previous } = editing;
      if (!control.checkValidity()) {
        control.setAttribute("aria-invalid", "true");
        control.setAttribute("aria-describedby", `${editId}-edit-message`);
        showEditMessage(editing.editor, control.validationMessage);
        return;
      }
      const value = control.value;
      closeEditor();
      if (refocus) editButton(cell)?.focus();
      if (value !== previous) applyEdit(cell, head, value, previous, control);
    };

    const openEditor = (cell, { typed = null, pasted = null } = {}) => {
      const head = editColumn(cell);
      if (!head || !editable(cell) || box.getAttribute("aria-busy") === "true" || cell.dataset.state === "saving") return;
      if (editing) {
        if (editing.cell === cell) return;
        commitEdit(false);
        if (editing) return;
      }
      clearFailed(cell);
      const editor = makeEditor(head);
      const control = editor.querySelector("input, select, textarea");
      if (!control) return;
      const previous = valueOf(cell);
      control.removeAttribute("name");
      control.removeAttribute("id");
      control.setAttribute("aria-label", say("data-table-edit-cell", "{column} for {row}", { column: headLabel(head), row: rowName(cell.parentElement) }));
      const start = pasted ?? typed ?? previous;
      if (control.matches("select")) {
        const wanted = String(start).trim().toLocaleLowerCase();
        const option = [...control.options].find((each) => each.value === start) ?? [...control.options].find((each) => each.value.toLocaleLowerCase() === wanted || each.label.trim().toLocaleLowerCase() === wanted);
        if (option) option.selected = true;
        for (const each of control.options) each.toggleAttribute("selected", each.selected);
      } else {
        control.value = start;
        if (control.matches("input[type='date']")) control.setAttribute("value", control.value);
      }
      const unreadable = pasted !== null && String(pasted).trim() !== "" && control.value === "";
      cell.style.setProperty("--canon-edit-inline-size", `${cell.getBoundingClientRect().width}px`);
      quietly(() => {
        cell.dataset.state = "editing";
        cell.append(editor);
      });
      editing = { cell, head, editor, control, previous };
      const session = editing;

      editor.addEventListener("keydown", (event) => {
        if (editing !== session || event.defaultPrevented) return;
        const inPopup = event.target.closest("[popover], .canon-combobox-popup");
        if (event.key === "Escape" && !inPopup) {
          event.preventDefault();
          event.stopPropagation();
          cancelEdit(true);
        } else if (event.key === "Enter" && !inPopup && !event.target.matches("select, button, textarea")) {
          event.preventDefault();
          commitEdit(true);
        }
      });
      editor.addEventListener("input", () => {
        if (editing !== session || !control.hasAttribute("aria-invalid")) return;
        if (control.checkValidity()) {
          control.removeAttribute("aria-invalid");
          hideEditMessage();
        } else showEditMessage(editor, control.validationMessage);
      });
      /* A pick from a list, or from the date's calendar, saves at once. */
      editor.addEventListener("change", (event) => {
        if (editing !== session || event.target !== control) return;
        if (control.matches("select") || editor.querySelector(".canon-calendar:popover-open")) requestAnimationFrame(() => { if (editing === session) commitEdit(true); });
      });
      editor.addEventListener("focusout", (event) => {
        if (editing !== session || editor.contains(event.relatedTarget)) return;
        requestAnimationFrame(() => {
          if (editing !== session || editor.contains(document.activeElement)) return;
          commitEdit(false);
        });
      });

      requestAnimationFrame(() => {
        if (editing !== session) return;
        /* Wider than the room left in the frame: it grows the other way. */
        const room = frame.getBoundingClientRect();
        const box = editor.getBoundingClientRect();
        const rtl = getComputedStyle(cell).direction === "rtl";
        if (rtl ? box.left < room.left : box.right > room.right) Object.assign(editor.style, { insetInlineStart: "auto", insetInlineEnd: "0" });
        const target = editor.querySelector(".canon-combobox-trigger, .canon-combobox-input") ?? firstFocusable(editor) ?? control;
        target.focus();
        if (control.matches("input:not([type='date']), textarea")) {
          if (typed === null) control.select?.();
          else {
            try { control.setSelectionRange(control.value.length, control.value.length); } catch {}
          }
        }
        if (pasted !== null) {
          if (!unreadable) commitEdit(true);
          return;
        }
        if (typed !== null) return;
        if (control.matches("select") && !editor.matches(".canon-combobox")) {
          try { control.showPicker(); } catch {}
        } else if (editor.matches(".canon-combobox")) target.click?.();
      });
    };

    table.addEventListener("click", (event) => {
      const button = event.target.closest?.(".canon-data-table-edit");
      if (!button || !table.contains(button) || button.getAttribute("aria-disabled") === "true") return;
      openEditor(button.parentElement);
    });
    table.addEventListener("keydown", (event) => {
      const button = event.target.closest?.(".canon-data-table-edit");
      if (!button || event.target !== button || button.getAttribute("aria-disabled") === "true") return;
      const cell = button.parentElement;
      if (event.key === "F2") {
        event.preventDefault();
        openEditor(cell);
      } else if (event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey && !event.altKey && typable(editColumn(cell) ?? cell)) {
        event.preventDefault();
        openEditor(cell, { typed: event.key });
      }
    });
    table.addEventListener("paste", (event) => {
      const button = event.target.closest?.(".canon-data-table-edit");
      if (!button || button.getAttribute("aria-disabled") === "true") return;
      const text = (event.clipboardData?.getData("text") ?? "").split(/\r?\n/)[0].split("\t")[0].trim();
      if (!text) return;
      event.preventDefault();
      openEditor(button.parentElement, { pasted: text });
    });

    /* The app's answer to a cancelled canon-edit, on the cell (heard on
       the way down, so it needn't bubble). */
    table.addEventListener("canon-saved", (event) => {
      const cell = event.target.closest?.("td, th");
      if (!cell || !pending.has(cell)) return;
      pending.delete(cell);
      editButton(cell)?.removeAttribute("aria-disabled");
      cell.dataset.state = "saved";
      setTimeout(() => { if (cell.dataset.state === "saved") delete cell.dataset.state; }, 1000);
    }, true);
    table.addEventListener("canon-save-failed", (event) => {
      const cell = event.target.closest?.("td, th");
      const saving = cell && pending.get(cell);
      if (!saving) return;
      pending.delete(cell);
      editButton(cell)?.removeAttribute("aria-disabled");
      quietly(() => {
        const field = fieldOf(cell);
        if (saving.restore) saving.restore();
        else {
          shownValue(cell)?.replaceChildren(...saving.before.nodes);
          if (saving.before.dataValue === null) cell.removeAttribute("data-value");
          else cell.setAttribute("data-value", saving.before.dataValue);
          if (field) field.value = saving.previous;
        }
        nameEdit(cell);
      });
      markFailed(cell, event.detail?.message || say("save-failed", "Couldn't save"));
    }, true);

    /* Checkboxes and switches in an editable column save on change. */
    table.addEventListener("change", (event) => {
      const input = event.target.closest?.(".canon-choice > input");
      const cell = input?.closest("td, th");
      if (!cell || cell.parentElement.parentElement === table.tHead || !editable(cell) || cell.dataset.column === "select") return;
      const head = editColumn(cell);
      const value = input.checked;
      clearFailed(cell);
      const detail = { value, previous: !value, row: cell.parentElement, column: head.cellIndex, key: head.dataset.key || headLabel(head), name: input.name, content: input };
      if (batch()) {
        if (input.checked === input.defaultChecked) delete cell.dataset.state;
        else cell.dataset.state = "changed";
        cell.dispatchEvent(new CustomEvent("canon-edit", { bubbles: true, detail }));
        return;
      }
      if (cell.dispatchEvent(new CustomEvent("canon-edit", { bubbles: true, cancelable: true, detail }))) return;
      pending.set(cell, { previous: !value, restore: () => { input.checked = !value; } });
      cell.dataset.state = "saving";
      input.disabled = true;
      const enable = () => { input.disabled = false; };
      cell.addEventListener("canon-saved", enable, { once: true });
      cell.addEventListener("canon-save-failed", enable, { once: true });
    });

    /* In a form: Discard puts every cell back; a save makes them the values. */
    form?.addEventListener("reset", () => setTimeout(() => {
      if (editing) cancelEdit(false);
      quietly(() => {
        for (const [cell, before] of originals) {
          shownValue(cell)?.replaceChildren(...before.nodes);
          if (before.dataValue === null) cell.removeAttribute("data-value");
          else cell.setAttribute("data-value", before.dataValue);
          nameEdit(cell);
        }
      });
      originals.clear();
      for (const cell of table.querySelectorAll("[data-state='changed']")) delete cell.dataset.state;
    }));
    form?.addEventListener("canon-saved", (event) => {
      if (event.target !== form) return;
      originals.clear();
      for (const cell of table.querySelectorAll("[data-state='changed']")) delete cell.dataset.state;
    });

    const refresh = () => {
      markColumns();
      remember();
      setUpBulk();
      /* All matching rows selected: the app's new rows come checked. */
      if (allRemote) for (const row of rows()) if (rowBox(row) && !rowBox(row).disabled) rowBox(row).checked = true;
      for (const cell of headers()) if (cell.hasAttribute("aria-sort")) setUpSort(cell);
      setUpTools();
      truncate();
      setUpEditing();
      exclude();
      showPage();
      pinColumns();
      syncScroll();
    };

    /* Rows the app adds, removes or replaces are marked, pinned and (with
       data-local) sorted and paged; canon.js's own changes are skipped. */
    observer = new MutationObserver((records) => {
      const busy = records.some((record) => record.type === "attributes");
      /* Not an editor at work, or an edited value redrawn: rows stay put. */
      const changed = records.some((record) => record.type === "childList" && !record.target.closest?.("[data-canon-editor], .canon-data-table-edit"));
      quietly(() => {
        if (busy) {
          syncBusy();
          if (box.getAttribute("aria-busy") === "true") cancelEdit(false);
        }
        if (changed) {
          refresh();
          if (local()) sortRows();
        }
      });
    });
    observer.observe(box, { attributes: true, attributeFilter: ["aria-busy"] });
    observer.observe(table, { childList: true, subtree: true });
    new ResizeObserver(() => {
      pinColumns();
      syncScroll();
    }).observe(table);
    new ResizeObserver(syncScroll).observe(frame);

    quietly(() => {
      refresh();
      if (local()) sortRows();
      syncBusy();
    });
  };

  const setUpDataTables = (root) => {
    const found = [...(root.matches?.(".canon-data-table") ? [root] : []), ...(root.querySelectorAll?.(".canon-data-table") ?? [])];
    for (const box of found) setUpDataTable(box);
  };

  /* ------------------------------------------------------------------ */
  /* Pagination                                                          */
  /*                                                                     */
  /* Written pagination is links and needs nothing. With data-pages (or  */
  /* data-total and data-per-page) canon.js draws the list: Previous,    */
  /* the first and last pages and the ones around the current page with  */
  /* gaps between, always as many (so the row doesn't jump), Next, and   */
  /* First and Last with data-ends. When that doesn't fit it shows fewer */
  /* pages, then "Page 2 of 30" (data-layout="compact" always does).     */
  /* With data-href ("?page={page}") the pages are links; without, they  */
  /* are buttons that fire canon-page (cancelable) and move. The summary */
  /* ("1–10 of 300"), a rows-per-page select and a jump form follow.     */
  /* ------------------------------------------------------------------ */

  const paginations = new WeakSet();

  /* 1 … 4 5 6 … 30: siblings × 2 + 5 slots; null is a gap. */
  const pageWindow = (page, pages, siblings) => {
    const slots = siblings * 2 + 5;
    const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
    if (pages <= slots) return range(1, pages);
    if (page <= siblings + 3) return [...range(1, slots - 2), null, pages];
    if (page >= pages - siblings - 2) return [1, null, ...range(pages - slots + 3, pages)];
    return [1, null, ...range(page - siblings, page + siblings), null, pages];
  };

  const setUpPagination = (nav) => {
    if (paginations.has(nav) || !(nav.hasAttribute("data-pages") || nav.hasAttribute("data-total"))) return;
    paginations.add(nav);
    const integer = (value, fallback) => (Number.isFinite(parseInt(value, 10)) ? parseInt(value, 10) : fallback);
    const state = () => {
      const perPage = Math.max(1, integer(nav.dataset.perPage, 10));
      const total = nav.hasAttribute("data-total") ? Math.max(0, integer(nav.dataset.total, 0)) : null;
      const pages = total === null ? Math.max(1, integer(nav.dataset.pages, 1)) : Math.max(1, Math.ceil(total / perPage));
      const page = Math.min(pages, Math.max(1, integer(nav.dataset.page, 1)));
      return { perPage, total, pages, page, siblings: Math.max(0, integer(nav.dataset.siblings, 1)) };
    };
    /* Page numbers are names (page 12480); counts of rows are grouped (12,480). */
    const number = (n) => {
      try { return new Intl.NumberFormat(langOf(nav)).format(n); } catch { return String(n); }
    };
    const pageNumber = (n) => {
      try { return new Intl.NumberFormat(langOf(nav), { useGrouping: false }).format(n); } catch { return String(n); }
    };
    const hrefFor = (page, perPage) =>
      nav.dataset.href.replaceAll("{page}", page).replaceAll("{per-page}", perPage);

    /* Go to a page: a link pattern navigates; otherwise canon-page, then move. */
    const go = (page, perPage = state().perPage) => {
      if (nav.hasAttribute("data-href")) {
        location.assign(hrefFor(page, perPage));
        return;
      }
      const event = new CustomEvent("canon-page", { bubbles: true, cancelable: true, detail: { page, perPage } });
      if (!nav.dispatchEvent(event)) return false;
      nav.dataset.perPage = perPage;
      nav.dataset.page = page;
      return true;
    };

    let list = null;
    let siblings = null;

    const render = (fit) => {
      const s = state();
      const links = nav.hasAttribute("data-href");
      const compact = nav.dataset.layout === "compact" || siblings === -1;
      const shown = siblings ?? s.siblings;
      const focused = list?.contains(document.activeElement) ? document.activeElement.dataset.key : null;

      const control = (key, target, content, label) => {
        const element = document.createElement(links ? "a" : "button");
        element.dataset.key = key;
        if (links) {
          if (target) element.href = hrefFor(target, s.perPage);
          else element.setAttribute("aria-disabled", "true");
        } else {
          element.type = "button";
          element.disabled = !target;
          if (target) element.addEventListener("click", () => go(target));
        }
        if (label) element.setAttribute("aria-label", label);
        element.append(...content);
        const item = document.createElement("li");
        item.append(element);
        return item;
      };
      const arrow = (key, className, icon, labelKey, fallback, target) => {
        const glyph = document.createElement("span");
        glyph.className = "canon-icon";
        glyph.dataset.icon = icon;
        glyph.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.className = "canon-pagination-label";
        label.textContent = text(nav, labelKey, fallback);
        /* The arrow on the outer side: before Previous, after Next. */
        const item = control(key, target, key === "next" || key === "last" ? [label, glyph] : [glyph, label]);
        item.firstElementChild.className = className;
        if (key === "prev" && target) item.firstElementChild.rel = "prev";
        if (key === "next" && target) item.firstElementChild.rel = "next";
        return item;
      };

      const fresh = document.createElement("ol");
      const ends = nav.hasAttribute("data-ends");
      const before = s.page > 1 ? s.page - 1 : null;
      const after = s.page < s.pages ? s.page + 1 : null;
      if (ends) fresh.append(arrow("first", "canon-pagination-first", "chevrons-left", "pagination-first", "First page", s.page > 1 ? 1 : null));
      fresh.append(arrow("prev", "canon-pagination-prev", "chevron-left", "pagination-previous", "Previous", before));
      if (compact) {
        const current = document.createElement("span");
        current.className = "canon-pagination-current";
        current.textContent = fill(text(nav, "pagination-current", "Page {page} of {pages}"), { page: pageNumber(s.page), pages: pageNumber(s.pages) });
        const item = document.createElement("li");
        item.append(current);
        fresh.append(item);
      } else {
        for (const page of pageWindow(s.page, s.pages, shown)) {
          if (page === null) {
            const gap = document.createElement("li");
            gap.className = "canon-pagination-gap";
            gap.textContent = "…";
            fresh.append(gap);
            continue;
          }
          const item = control(`page-${page}`, page, [pageNumber(page)], fill(text(nav, "pagination-page", "Page {page}"), { page: pageNumber(page) }));
          if (page === s.page) item.firstElementChild.setAttribute("aria-current", "page");
          fresh.append(item);
        }
      }
      fresh.append(arrow("next", "canon-pagination-next", "chevron-right", "pagination-next", "Next", after));
      if (ends) fresh.append(arrow("last", "canon-pagination-last", "chevrons-right", "pagination-last", "Last page", s.page < s.pages ? s.pages : null));

      if (list?.isConnected) list.replaceWith(fresh);
      else {
        const jump = nav.querySelector(":scope > .canon-pagination-jump");
        nav.insertBefore(fresh, jump);
      }
      list = fresh;

      /* Focus stays on the control used, or the current page once it can't go further. */
      if (focused) {
        const same = list.querySelector(`[data-key="${focused}"]:not(:disabled)`);
        (same ?? list.querySelector("[aria-current='page']") ?? list.querySelector(":is(a[href], button:enabled)"))?.focus();
      }

      const summary = nav.querySelector(":scope > .canon-pagination-summary");
      if (summary && s.total !== null) {
        const first = s.total ? (s.page - 1) * s.perPage + 1 : 0;
        const last = Math.min(s.total, s.page * s.perPage);
        summary.textContent = fill(text(nav, "pagination-summary", "{first}–{last} of {total}"), { first: number(first), last: number(last), total: number(s.total) });
      }
      const size = nav.querySelector(":scope > .canon-pagination-size select");
      if (size && size.value !== String(s.perPage)) size.value = String(s.perPage);
      const jumpInput = nav.querySelector(":scope > .canon-pagination-jump input");
      if (jumpInput) {
        jumpInput.min = 1;
        jumpInput.max = s.pages;
      }

      if (fit) fitList();
    };

    /* Fewer pages until the list is one row, then "Page 2 of 30". */
    const wraps = () => {
      const items = [...list.children];
      return items.length > 1 && items.at(-1).offsetTop > items[0].offsetTop;
    };
    const fitList = () => {
      siblings = null;
      render(false);
      if (nav.dataset.layout === "compact") return;
      for (let next = state().siblings - 1; wraps() && next >= -1; next--) {
        siblings = next;
        render(false);
      }
    };

    let announced = null;
    new MutationObserver(() => {
      fitList();
      const s = state();
      const key = `${s.page}/${s.perPage}`;
      if (announced !== null && key !== announced && !nav.hasAttribute("data-href")) {
        const summary = nav.querySelector(":scope > .canon-pagination-summary");
        announce(summary && s.total !== null ? summary.textContent : fill(text(nav, "pagination-current", "Page {page} of {pages}"), { page: pageNumber(s.page), pages: pageNumber(s.pages) }));
      }
      announced = key;
    }).observe(nav, { attributes: true, attributeFilter: ["data-page", "data-pages", "data-total", "data-per-page", "data-siblings", "data-ends", "data-layout", "data-href", "lang", "dir"] });

    let width = 0;
    new ResizeObserver(() => {
      if (nav.clientWidth === width) return;
      width = nav.clientWidth;
      fitList();
    }).observe(nav);

    /* Rows per page: keep the first row in view. */
    nav.querySelector(":scope > .canon-pagination-size select")?.addEventListener("change", (event) => {
      const s = state();
      const perPage = Math.max(1, integer(event.target.value, s.perPage));
      const page = Math.floor(((s.page - 1) * s.perPage) / perPage) + 1;
      if (go(page, perPage) === false) event.target.value = String(s.perPage);
    });

    /* Jump to a page. */
    nav.querySelector(":scope > .canon-pagination-jump")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = event.target.querySelector("input");
      const s = state();
      const page = integer(input?.value, NaN);
      if (!Number.isFinite(page)) return;
      go(Math.min(s.pages, Math.max(1, page)));
      if (!nav.hasAttribute("data-href")) input.value = "";
    });

    fitList();
    announced = `${state().page}/${state().perPage}`;
  };

  const setUpPaginations = (root) => {
    const found = [...(root.matches?.(".canon-pagination") ? [root] : []), ...(root.querySelectorAll?.(".canon-pagination") ?? [])];
    for (const nav of found) setUpPagination(nav);
  };

  /* ------------------------------------------------------------------ */
  /* Load more                                                           */
  /*                                                                     */
  /* .canon-load-more with a Button: a press fires canon-load-more on    */
  /* the box and marks the button busy until the app sets data-shown;    */
  /* then the status ("Showing 40 of 300") updates and, at the total,    */
  /* the button goes. data-auto presses it when it scrolls near view.    */
  /* A link (href to the next page) is left to the browser.              */
  /* ------------------------------------------------------------------ */

  const loadMores = new WeakSet();

  const setUpLoadMore = (box) => {
    if (loadMores.has(box)) return;
    loadMores.add(box);
    const button = box.querySelector(":scope > button.canon-button");
    const status = box.querySelector(":scope > .canon-load-more-status");
    if (status) status.setAttribute("role", "status");
    const number = (n) => {
      try { return new Intl.NumberFormat(langOf(box)).format(n); } catch { return String(n); }
    };

    const sync = () => {
      const shown = parseInt(box.dataset.shown, 10);
      const total = parseInt(box.dataset.total, 10);
      const known = Number.isFinite(shown) && Number.isFinite(total);
      if (status && known) status.textContent = fill(text(box, "load-more-status", "Showing {shown} of {total}"), { shown: number(shown), total: number(total) });
      if (button) {
        button.removeAttribute("aria-busy");
        button.removeAttribute("aria-disabled");
        const focused = document.activeElement === button;
        button.hidden = known && shown >= total;
        /* At the end, focus on the gone button moves to the status. */
        if (focused && button.hidden && status) {
          status.tabIndex = -1;
          status.focus();
        }
      }
      watch();
    };

    const load = () => {
      if (!button || button.hidden || button.getAttribute("aria-busy") === "true") return;
      button.setAttribute("aria-busy", "true");
      button.setAttribute("aria-disabled", "true");
      box.dispatchEvent(new CustomEvent("canon-load-more", { bubbles: true }));
    };

    button?.addEventListener("click", (event) => {
      if (button.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
        return;
      }
      load();
    });

    /* data-auto: near the viewport, load; re-observing after each load
       loads again while the list is still too short to push it away. */
    let observer = null;
    const watch = () => {
      observer?.disconnect();
      observer = null;
      if (!button || !box.hasAttribute("data-auto") || button.hidden) return;
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) load();
      }, { rootMargin: "0px 0px 400px 0px" });
      observer.observe(button);
    };

    new MutationObserver(sync).observe(box, { attributes: true, attributeFilter: ["data-shown", "data-total", "data-auto", "lang"] });
    sync();
  };

  const setUpLoadMores = (root) => {
    const found = [...(root.matches?.(".canon-load-more") ? [root] : []), ...(root.querySelectorAll?.(".canon-load-more") ?? [])];
    for (const box of found) setUpLoadMore(box);
  };

  /* ------------------------------------------------------------------ */
  /* Filter Bar                                                          */
  /*                                                                     */
  /* A search form of facets: each facet's button shows what is chosen   */
  /* in its popover ("Status: Active +1"); a change fires canon-filter   */
  /* with the form's values (typing after a pause) instead of reloading  */
  /* the page, unless data-submit asks for the page to submit. Clear all */
  /* is --canon-clear on the bar.                                        */
  /* ------------------------------------------------------------------ */

  const filterBars = new WeakSet();
  const setUpFilterBar = (bar) => {
    if (filterBars.has(bar)) return;
    filterBars.add(bar);
    const say = (key, fallback, values) => (values ? fill(text(bar, key, fallback), values) : text(bar, key, fallback));
    const lang = () => langOf(bar);
    const facets = () => [...bar.querySelectorAll(":scope > .canon-filter-bar-facet")];
    const controls = (scope) => [...scope.querySelectorAll("input, select, textarea")].filter((control) => control.name && control.type !== "hidden");
    /* Filters: the facets, the chips and the search field (not, say, a
       sort select beside them). */
    const filters = () => controls(bar).filter((control) => control.closest(".canon-filter-bar-facet, .canon-toggle-chip") || control.type === "search");
    const typing = (control) => control.matches("input:is([type='search'], [type='text'], [type='number'], [type='range']), textarea");

    const labelOf = (control) =>
      (control.closest(".canon-toggle-chip")?.querySelector(".canon-toggle-chip-label") ?? control.labels?.[0])?.textContent.trim() || control.value;
    const formatValue = (control) => {
      try {
        if (control.type === "date" && /^\d{4}-\d{2}-\d{2}$/.test(control.value)) {
          const [y, m, d] = control.value.split("-").map(Number);
          const date = new Date(y, m - 1, d);
          const options = { month: "short", day: "numeric", ...(y !== new Date().getFullYear() ? { year: "numeric" } : {}) };
          return new Intl.DateTimeFormat(lang(), options).format(date);
        }
        if (control.type === "number" || control.type === "range") return new Intl.NumberFormat(lang()).format(control.valueAsNumber);
      } catch {}
      return control.value.trim();
    };
    /* A slider pair is off when it isn't at its full range. */
    const atEnd = (control) => {
      const pair = [...control.parentElement.querySelectorAll(":scope > input[type='range']")];
      const end = pair.length > 1 && control === pair[1] ? control.max || "100" : control.min || "0";
      return Number(control.value) === Number(end);
    };
    /* What a scope has chosen: labels for choices, values for the rest. */
    const chosen = (scope) => {
      const choices = [];
      const values = [];
      for (const control of controls(scope)) {
        if (control.disabled) continue;
        if (control.type === "checkbox" || control.type === "radio") {
          if (control.checked && control.value !== "") choices.push(labelOf(control));
        } else if (control.matches("select")) {
          for (const option of control.selectedOptions) if (option.value !== "") choices.push(option.textContent.trim());
        } else if (control.type === "range") {
          const pair = [...control.parentElement.querySelectorAll(":scope > input[type='range']")];
          if (control === pair[0] && pair.some((each) => !atEnd(each))) values.push(pair.map(formatValue).join(" – "));
        } else if (control.value.trim() !== "") values.push(formatValue(control));
      }
      if (values.length === 2 && !choices.length) return [values.join(" – ")];
      return [...choices, ...values];
    };

    const summarize = () => {
      let any = false;
      for (const facet of facets()) {
        const button = facet.querySelector(":scope > .canon-filter-bar-button");
        const panel = facet.querySelector(":scope > .canon-popover");
        if (!button || !panel) continue;
        const items = chosen(panel);
        let value = button.querySelector(":scope > .canon-filter-bar-value");
        if (!value) {
          value = document.createElement("span");
          value.className = "canon-filter-bar-value";
          button.querySelector(":scope > .canon-filter-bar-label")?.after(value);
        }
        const name = button.querySelector(":scope > .canon-filter-bar-label")?.textContent.trim() ?? "";
        if (items.length) {
          const shown = items.length > 1 ? say("filter-bar-more", "{value} +{count}", { value: items[0], count: items.length - 1 }) : items[0];
          value.textContent = say("filter-bar-value", ": {value}", { value: shown });
          button.setAttribute("aria-label", say("filter-bar-summary", "{facet}: {values}", { facet: name, values: items.join(", ") }));
          facet.dataset.active = "";
          any = true;
        } else {
          value.textContent = "";
          button.removeAttribute("aria-label");
          delete facet.dataset.active;
        }
      }
      for (const control of filters()) {
        if (control.closest(".canon-filter-bar-facet") || control.disabled) continue;
        if (control.type === "checkbox" || control.type === "radio" ? control.checked && control.value !== "" : control.value.trim() !== "") any = true;
      }
      if (any) bar.dataset.active = "";
      else delete bar.dataset.active;
    };

    const values = () => {
      const result = {};
      for (const [key, value] of new FormData(bar)) (result[key] ??= []).push(typeof value === "string" ? value : value.name);
      return result;
    };
    const emit = () => bar.dispatchEvent(new CustomEvent("canon-filter", { bubbles: true, detail: { values: values() } }));
    let timer = null;
    const changed = (now) => {
      summarize();
      clearTimeout(timer);
      if (bar.hasAttribute("data-submit")) {
        if (now) bar.requestSubmit();
        return;
      }
      if (now) emit();
      else timer = setTimeout(emit, 250);
    };

    bar.addEventListener("input", (event) => {
      if (typing(event.target)) changed(false);
      else summarize();
    });
    bar.addEventListener("change", (event) => {
      if (!typing(event.target) || event.target.type === "range") changed(true);
    });
    bar.addEventListener("submit", (event) => {
      if (bar.hasAttribute("data-submit")) return;
      event.preventDefault();
      clearTimeout(timer);
      summarize();
      emit();
    });
    bar.addEventListener("reset", () => setTimeout(() => changed(true)));

    /* Clear all: choices off (a radio group back to its "" option), fields
       empty, sliders to their full range; one change, then focus to the
       search field (else the bar's first control). */
    filterBarClears.set(bar, () => {
      for (const control of filters()) {
        if (control.disabled) continue;
        if (control.type === "checkbox") control.checked = false;
        else if (control.type === "radio") control.checked = control.value === "";
        else if (control.matches("select")) {
          for (const option of control.options) option.selected = false;
          if (!control.multiple && control.options[0]?.value === "") control.options[0].selected = true;
        } else if (control.type === "range") {
          const pair = [...control.parentElement.querySelectorAll(":scope > input[type='range']")];
          control.value = pair.length > 1 && control === pair[1] ? control.max || "100" : control.min || "0";
          control.dispatchEvent(new Event("input", { bubbles: true }));
        } else control.value = "";
        if (control.matches("input[type='date']")) control.dispatchEvent(new Event("input", { bubbles: true }));
      }
      changed(true);
      (bar.querySelector("input[type='search']") ?? controls(bar)[0])?.focus();
    });

    summarize();
  };

  const setUpFilterBars = (root) => {
    const found = [...(root.matches?.(".canon-filter-bar") ? [root] : []), ...(root.querySelectorAll?.(".canon-filter-bar") ?? [])];
    for (const bar of found) setUpFilterBar(bar);
  };

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

  /* ------------------------------------------------------------------ */
  /* Nav List                                                            */
  /*                                                                     */
  /* Links and native <details> work alone. canon.js opens the section   */
  /* holding the current page (aria-current) and marks its summary       */
  /* data-current, also when the app moves aria-current. In a rail       */
  /* (data-display="icon" on the list or a container) a section's        */
  /* sub-pages open beside it instead: one at a time, closing when focus */
  /* or a click goes elsewhere, on Escape (back to its summary) and on   */
  /* choosing a page; none opens by itself. Becoming a rail closes them; */
  /* leaving it opens the current page's section again.                  */
  /* ------------------------------------------------------------------ */

  const navLists = new WeakSet();
  const navListSyncs = new WeakMap();
  const inRail = (element) => element.closest("[data-display]")?.getAttribute("data-display") === "icon";

  const setUpNavList = (nav) => {
    if (navLists.has(nav)) return;
    navLists.add(nav);
    const sections = () => [...nav.querySelectorAll("details.canon-nav-list-section")];
    let rail = inRail(nav);
    const sync = () => {
      const wasRail = rail;
      rail = inRail(nav);
      for (const section of sections()) {
        const holds = Boolean(section.querySelector(":scope > ul [aria-current='page']"));
        if (rail) {
          if (!wasRail) section.open = false;
        } else if (holds && !section.open) section.open = true;
        section.querySelector(":scope > summary")?.toggleAttribute("data-current", holds);
      }
    };
    navListSyncs.set(nav, sync);
    new MutationObserver(sync).observe(nav, { subtree: true, attributes: true, attributeFilter: ["aria-current"], childList: true });

    /* The rail's open section. "toggle" doesn't bubble: listen while it
       comes down. */
    const close = (section, refocus) => {
      section.open = false;
      if (refocus) section.querySelector(":scope > summary")?.focus();
    };
    nav.addEventListener("toggle", (event) => {
      if (!rail || !event.target.matches?.("details.canon-nav-list-section") || !event.target.open) return;
      for (const other of sections()) if (other !== event.target) other.open = false;
    }, true);
    nav.addEventListener("keydown", (event) => {
      const section = rail && event.key === "Escape" && event.target.closest("details.canon-nav-list-section[open]");
      if (!section) return;
      event.preventDefault();
      close(section, true);
    });
    nav.addEventListener("focusout", (event) => {
      const section = rail && event.target.closest("details.canon-nav-list-section[open]");
      if (section && !section.contains(event.relatedTarget)) close(section);
    });
    nav.addEventListener("click", (event) => {
      const section = rail && event.target.closest(".canon-nav-list-section > ul a")?.closest("details");
      if (section) close(section);
    });
    document.addEventListener("click", (event) => {
      if (!rail) return;
      for (const section of sections()) if (section.open && !section.contains(event.target)) close(section);
    });
    sync();
  };

  /* A list becomes a rail, or stops being one, when data-display changes
     on it or a container (a Sidebar collapsing). */
  new MutationObserver((records) => {
    for (const { target } of records) {
      const found = [...(target.matches?.(".canon-nav-list") ? [target] : []), ...(target.querySelectorAll?.(".canon-nav-list") ?? [])];
      for (const nav of found) navListSyncs.get(nav)?.();
    }
  }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["data-display"] });

  const setUpNavLists = (root) => {
    const found = [...(root.matches?.(".canon-nav-list") ? [root] : []), ...(root.querySelectorAll?.(".canon-nav-list") ?? [])];
    for (const nav of found) setUpNavList(nav);
  };

  /* ------------------------------------------------------------------ */
  /* Folding                                                             */
  /*                                                                     */
  /* A Top Bar or a Page Header that doesn't fit folds, a step at a      */
  /* time, and unfolds as room comes back. Each folding lists its steps  */
  /* ({ name, applies(), apply(on) }) and how it knows it doesn't fit;   */
  /* it takes the fewest steps that make it fit, measuring with          */
  /* data-folding on the host (things keep their width meanwhile).       */
  /* data-fold on the host lists the steps taken, for themes; folded     */
  /* things get data-folded.                                             */
  /* ------------------------------------------------------------------ */

  let foldCount = 0;

  /* A menu of what folded, filled each time it opens (so it is never
     out of date). */
  const foldMenu = (id, fill) => {
    const menu = fromMarkup(`<div class="canon-menu" id="${id}" popover role="menu"></div>`);
    menu.addEventListener("beforetoggle", (event) => {
      if (event.newState === "open") menu.replaceChildren(...fill());
    });
    return menu;
  };

  /* A Breadcrumb keeps its last page; the others go into a menu at its
     start (an author's own "more" menu's pages among them, in order). */
  const trailFolding = (host, nav) => {
    const ol = nav.querySelector(":scope > ol");
    let more = null;
    const items = () => [...(ol?.children ?? [])].filter((li) => li !== more);
    return {
      name: "breadcrumb",
      watched: ol,
      applies: () => items().length > 1,
      apply(on) {
        const all = items();
        for (const li of all) li.toggleAttribute("data-folded", on && li !== all.at(-1));
        if (!on || !all.length) {
          more?.remove();
          more = null;
          return;
        }
        if (more) return;
        const id = `canon-fold-${++foldCount}`;
        const label = text(host, "more-pages", "More pages");
        more = fromMarkup(`<li><button type="button" class="canon-breadcrumb-more" popovertarget="${id}" aria-haspopup="menu" aria-expanded="false"><span class="canon-icon" data-icon="more" aria-hidden="true"></span><span class="canon-visually-hidden"></span></button></li>`);
        more.querySelector(".canon-visually-hidden").textContent = label;
        const menu = foldMenu(id, () => items().filter((li) => li.hasAttribute("data-folded")).flatMap((li) => {
          const own = li.querySelector(".canon-menu");
          if (own) return [...own.querySelectorAll(":scope > .canon-menu-item")].map((item) => item.cloneNode(true));
          const link = li.querySelector("a[href]");
          if (!link) return [];
          const item = fromMarkup(`<a class="canon-menu-item" role="menuitem"><span class="canon-menu-label"></span></a>`);
          item.setAttribute("href", link.getAttribute("href"));
          item.querySelector(".canon-menu-label").textContent = link.textContent.trim();
          return [item];
        }));
        menu.setAttribute("aria-label", label);
        more.append(menu);
        ol.prepend(more);
        setUpMenu(menu);
      },
    };
  };

  /* Buttons go into one More menu where the first of them was: a toggle
     (aria-pressed) as a check, a Button opening a Menu as a submenu;
     choosing an item clicks the Button it stands for. Only when two or
     more would fold (one folded saves no room). */
  const buttonFolding = (host, name, candidates) => {
    let more = null;
    const buttons = () => candidates().filter((button) => button !== more?.button);
    return {
      name,
      applies: () => buttons().length > 1,
      apply(on) {
        const all = buttons();
        for (const button of all) button.toggleAttribute("data-folded", on);
        if (!on || !all.length) {
          more?.button.remove();
          more?.menu.remove();
          more = null;
          return;
        }
        if (more) return;
        const id = `canon-fold-${++foldCount}`;
        const button = fromMarkup(`<button type="button" class="canon-button" data-display="icon" id="${id}-button" popovertarget="${id}" aria-haspopup="menu" aria-expanded="false"><span class="canon-icon" data-icon="more" aria-hidden="true"></span><span class="canon-button-label"></span></button>`);
        button.querySelector(".canon-button-label").textContent = text(host, "more", "More");
        for (const attribute of ["data-emphasis", "data-intent", "data-size"]) {
          if (all[0].hasAttribute(attribute)) button.setAttribute(attribute, all[0].getAttribute(attribute));
        }
        const menu = foldMenu(id, () => buttons().map((source) => {
          const pressed = source.getAttribute("aria-pressed");
          const item = fromMarkup(`<button type="button" class="canon-menu-item" role="${pressed === null ? "menuitem" : "menuitemcheckbox"}"><span class="canon-menu-label"></span></button>`);
          if (pressed !== null) item.setAttribute("aria-checked", String(pressed === "true"));
          const icon = source.querySelector(":scope > .canon-icon");
          if (icon) item.prepend(icon.cloneNode(true));
          item.querySelector(".canon-menu-label").textContent = (source.querySelector(":scope > .canon-button-label")?.textContent ?? source.getAttribute("aria-label") ?? "").trim();
          if (source.disabled || source.getAttribute("aria-disabled") === "true") item.setAttribute("aria-disabled", "true");
          const submenu = source.popoverTargetElement;
          if (submenu?.matches(".canon-menu") && submenu.id) {
            item.setAttribute("popovertarget", submenu.id);
            item.setAttribute("aria-haspopup", "menu");
            item.setAttribute("aria-expanded", "false");
          } else item.addEventListener("click", () => source.click());
          return item;
        }));
        menu.setAttribute("aria-labelledby", button.id);
        all[0].before(button, menu);
        setUpMenu(menu);
        more = { button, menu };
      },
    };
  };

  const setUpFolding = (host, steps, overflows, watched) => {
    const names = steps.map((step) => step.name);
    let taken = 0;
    const observer = new MutationObserver(() => fit());
    const fit = () => {
      observer.disconnect();
      host.toggleAttribute("data-folding", true);
      const all = steps.filter((step) => step.applies());
      const take = (count) => {
        const on = all.slice(0, count);
        const others = (host.getAttribute("data-fold") ?? "").split(" ").filter((each) => each && !names.includes(each));
        const fold = [...others, ...on.map((step) => step.name)].join(" ");
        if (fold) host.setAttribute("data-fold", fold);
        else host.removeAttribute("data-fold");
        for (const step of steps) step.apply(on.includes(step));
      };
      taken = Math.min(taken, all.length);
      take(taken);
      while (taken < all.length && overflows()) take(++taken);
      while (taken > 0) {
        take(taken - 1);
        if (overflows()) {
          take(taken);
          break;
        }
        taken--;
      }
      host.removeAttribute("data-folding");
      for (const element of [...watched(), ...steps.map((step) => step.watched)]) if (element) observer.observe(element, { childList: true });
    };
    let width = 0;
    new ResizeObserver(() => {
      if (host.clientWidth === width) return;
      width = host.clientWidth;
      fit();
    }).observe(host);
    document.fonts?.ready.then(fit);
    fit();
  };

  /* ------------------------------------------------------------------ */
  /* Top Bar                                                             */
  /*                                                                     */
  /* Folds when its things don't fit: the search's shortcut goes (kbd),  */
  /* then its label, the Button becoming icon only (search); then the    */
  /* end's Buttons go into one More menu, but for a Button carrying a    */
  /* Count and the account (end). The sidebar's toggle never folds.      */
  /* ------------------------------------------------------------------ */

  const topBars = new WeakSet();

  const setUpTopBar = (bar) => {
    if (topBars.has(bar)) return;
    topBars.add(bar);
    const start = bar.querySelector(":scope > .canon-top-bar-start");
    const end = bar.querySelector(":scope > .canon-top-bar-end");
    const iconed = new Set();
    const searches = () => [...(start?.querySelectorAll(":scope > .canon-button") ?? [])]
      .filter((button) => button.getAttribute("command") !== "--canon-toggle-sidebar" && (iconed.has(button) || button.getAttribute("data-display") !== "icon"));
    const steps = [
      { name: "kbd", applies: () => Boolean(start?.querySelector(":scope > .canon-button > .canon-kbd")), apply() {} },
      {
        name: "search",
        applies: () => searches().length > 0,
        apply(on) {
          for (const button of searches()) {
            if (on && !iconed.has(button)) {
              iconed.add(button);
              button.setAttribute("data-display", "icon");
            } else if (!on && iconed.has(button)) {
              iconed.delete(button);
              button.removeAttribute("data-display");
            }
          }
        },
      },
      buttonFolding(bar, "end", () => [...(end?.querySelectorAll(":scope > .canon-button") ?? [])].filter((button) => !button.querySelector(":scope > .canon-count"))),
    ];
    /* While measuring (data-folding), the start's things keep their
       width, so not fitting shows as overflow. */
    const overflows = () => (start && start.scrollWidth > start.clientWidth + 1) || bar.scrollWidth > bar.clientWidth + 1;
    setUpFolding(bar, steps, overflows, () => [start, end]);
  };

  const setUpTopBars = (root) => {
    const found = [...(root.matches?.(".canon-top-bar") ? [root] : []), ...(root.querySelectorAll?.(".canon-top-bar") ?? [])];
    for (const bar of found) setUpTopBar(bar);
  };

  /* ------------------------------------------------------------------ */
  /* Page Header                                                         */
  /*                                                                     */
  /* Folds when narrow, each part on its own: a Breadcrumb keeps its     */
  /* last page when its trail doesn't fit its row (breadcrumb); the      */
  /* actions go into one More menu, but for the primary one              */
  /* (data-emphasis="high"), when they leave the title less room than it */
  /* needs: its own width, up to 20rem (actions).                        */
  /* ------------------------------------------------------------------ */

  const pageHeaders = new WeakSet();

  const setUpPageHeader = (header) => {
    if (pageHeaders.has(header)) return;
    pageHeaders.add(header);
    /* Sticky, the trail tucks away above the bar's edge: by how far the
       rest starts below the header's top padding. */
    const trail = header.querySelector(":scope > :is(.canon-page-header-back, .canon-breadcrumb)");
    if (trail) {
      const tuck = () => {
        const rest = [...header.children].filter((child) => child !== trail && child.checkVisibility());
        if (!rest.length) return;
        const top = Math.min(...rest.map((child) => child.getBoundingClientRect().top));
        const offset = top - header.getBoundingClientRect().top - parseFloat(getComputedStyle(header).paddingBlockStart);
        header.style.setProperty("--canon-page-header-tuck", `${Math.max(0, offset)}px`);
      };
      new ResizeObserver(tuck).observe(trail);
      tuck();
    }
    const nav = header.querySelector(":scope > .canon-breadcrumb");
    if (nav) setUpFolding(header, [trailFolding(header, nav)], () => nav.scrollWidth > nav.clientWidth + 1, () => []);
    const actions = header.querySelector(":scope > .canon-page-header-actions");
    if (!actions) return;
    const title = header.querySelector(":scope > .canon-page-header-title");
    const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    /* While measuring (data-folding), the title is one line, so its
       scrollWidth is the width it wants, and the actions one row. */
    const overflows = () => header.scrollWidth > header.clientWidth + 1
      || actions.scrollWidth > actions.clientWidth + 1
      || Boolean(title && title.clientWidth + 1 < Math.min(title.scrollWidth, 20 * rem()));
    const fold = buttonFolding(header, "actions", () => [...actions.querySelectorAll(":scope > .canon-button")]
      .filter((button) => button.getAttribute("data-emphasis") !== "high"));
    setUpFolding(header, [fold], overflows, () => [actions]);
  };

  const setUpPageHeaders = (root) => {
    const found = [...(root.matches?.(".canon-page-header") ? [root] : []), ...(root.querySelectorAll?.(".canon-page-header") ?? [])];
    for (const header of found) setUpPageHeader(header);
  };

  /* ------------------------------------------------------------------ */
  /* Tabs                                                                */
  /*                                                                     */
  /* In-page (.canon-tabs-list role="tablist" in .canon-tabs, with its   */
  /* panels): a click or the arrows (Home, End) choose a tab and show    */
  /* its panel, hiding the others; one Tab stop, the chosen tab. Choosing*/
  /* fires canon-tab on the tabs (detail: tab, panel). Links            */
  /* (nav.canon-tabs-list): the browser's. Both fold when narrow: tabs   */
  /* go into a More menu from the last, one at a time, the current one   */
  /* never; the More button sits at the strip's end (inside a nav;       */
  /* beside a tablist, which may only hold tabs). Hidden panels are      */
  /* hidden="until-found" where the browser has it: find in page reaches */
  /* their text and chooses their tab.                                   */
  /* ------------------------------------------------------------------ */

  const tabLists = new WeakSet();
  const findable = "onbeforematch" in HTMLElement.prototype;

  const setUpTabList = (list) => {
    if (tabLists.has(list)) return;
    tabLists.add(list);
    const inPage = list.getAttribute("role") === "tablist";
    const box = inPage ? list.closest(".canon-tabs") : null;
    const tabs = () => [...list.querySelectorAll(":scope > .canon-tab")];
    const usable = (tab) => tab.getAttribute("aria-disabled") !== "true";
    const isCurrent = (tab) => tab.getAttribute(inPage ? "aria-selected" : "aria-current") === (inPage ? "true" : "page");
    const panelOf = (tab) => {
      const id = tab.getAttribute("aria-controls");
      return id ? document.getElementById(id) : null;
    };
    let fit = () => {};

    const select = (tab, { focus = false, announce: tell = true } = {}) => {
      for (const each of tabs()) {
        const chosen = each === tab;
        each.setAttribute("aria-selected", String(chosen));
        each.tabIndex = chosen ? 0 : -1;
        const panel = panelOf(each);
        if (!panel) continue;
        if (chosen) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", findable ? "until-found" : "");
      }
      fit();
      if (focus) tab.focus();
      if (tell) (box ?? list).dispatchEvent(new CustomEvent("canon-tab", { bubbles: true, detail: { tab, panel: panelOf(tab) } }));
    };

    if (inPage) {
      const first = tabs().find(isCurrent) ?? tabs().find(usable);
      if (first) select(first, { announce: false });
      /* Find in page matched text in a hidden panel: its tab is chosen as
         the browser shows it. */
      for (const tab of tabs()) {
        panelOf(tab)?.addEventListener("beforematch", () => {
          if (!isCurrent(tab)) select(tab);
        });
      }
      list.addEventListener("click", (event) => {
        const tab = event.target.closest(".canon-tab");
        if (tab && list.contains(tab) && usable(tab) && !isCurrent(tab)) select(tab);
      });
      list.addEventListener("keydown", (event) => {
        const tab = event.target.closest(".canon-tab");
        if (!tab) return;
        const rtl = getComputedStyle(list).direction === "rtl";
        const shown = tabs().filter((each) => usable(each) && !each.hasAttribute("data-folded"));
        const at = shown.indexOf(tab);
        let next = null;
        if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) next = shown[(at + 1) % shown.length];
        else if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) next = shown[(at - 1 + shown.length) % shown.length];
        else if (event.key === "Home") next = shown[0];
        else if (event.key === "End") next = shown.at(-1);
        if (!next) return;
        event.preventDefault();
        select(next, { focus: true });
      });
    }

    /* Folding: the More button, made when first needed. */
    let more = null;
    const makeMore = () => {
      const id = `canon-fold-${++foldCount}`;
      const button = fromMarkup(`<button type="button" class="canon-tabs-more" id="${id}-button" popovertarget="${id}" aria-haspopup="menu" aria-expanded="false"><span class="canon-tab-label"></span><span class="canon-icon" data-icon="chevron-down" aria-hidden="true"></span></button>`);
      button.querySelector(".canon-tab-label").textContent = text(list, "more", "More");
      const menu = foldMenu(id, () => tabs().filter((tab) => tab.hasAttribute("data-folded")).map((tab) => {
        const label = (tab.querySelector(":scope > .canon-tab-label")?.textContent ?? tab.textContent).trim();
        const item = fromMarkup(inPage
          ? `<button type="button" class="canon-menu-item" role="menuitem"><span class="canon-menu-label"></span></button>`
          : `<a class="canon-menu-item" role="menuitem"><span class="canon-menu-label"></span></a>`);
        item.querySelector(".canon-menu-label").textContent = label;
        const icon = tab.querySelector(":scope > .canon-icon");
        if (icon) item.prepend(icon.cloneNode(true));
        if (!usable(tab)) item.setAttribute("aria-disabled", "true");
        if (inPage) item.addEventListener("click", () => {
          select(tab);
          /* After the menu has closed (and given focus back to More). */
          requestAnimationFrame(() => tab.focus());
        });
        else item.setAttribute("href", tab.getAttribute("href"));
        return item;
      }));
      menu.setAttribute("aria-labelledby", button.id);
      if (inPage) list.after(button, menu);
      else list.append(button, menu);
      setUpMenu(menu);
      return { button, menu };
    };

    /* Whether the shown tabs (and, in a nav, More) end past the strip's
       content edge, the room kept for More beside a tablist included
       (overflow alone doesn't count the padding that keeps it). */
    const overflows = () => {
      if (list.scrollWidth > list.clientWidth + 1) return true;
      const style = getComputedStyle(list);
      const rtl = style.direction === "rtl";
      const box = list.getBoundingClientRect();
      const end = parseFloat(style.paddingInlineEnd) + parseFloat(rtl ? style.borderLeftWidth : style.borderRightWidth);
      const limit = rtl ? box.left + end : box.right - end;
      const shown = [...list.children].filter((child) => child.matches(".canon-tab, .canon-tabs-more") && !child.hasAttribute("data-folded"));
      return shown.some((child) => {
        const edge = child.getBoundingClientRect();
        return rtl ? edge.left < limit - 0.5 : edge.right > limit + 0.5;
      });
    };
    fit = () => {
      list.toggleAttribute("data-folding", true);
      const all = tabs();
      for (const tab of all) tab.removeAttribute("data-folded");
      more?.button.setAttribute("data-folded", "");
      list.style.removeProperty("--canon-tabs-more-size");
      if (overflows()) {
        more ??= makeMore();
        more.button.removeAttribute("data-folded");
        if (inPage) list.style.setProperty("--canon-tabs-more-size", `${more.button.offsetWidth}px`);
        for (const tab of [...all].reverse()) {
          if (!overflows()) break;
          if (isCurrent(tab) || all.filter((each) => !each.hasAttribute("data-folded")).length <= 1) continue;
          tab.setAttribute("data-folded", "");
        }
      }
      list.toggleAttribute("data-fold", Boolean(all.some((tab) => tab.hasAttribute("data-folded"))));
      list.removeAttribute("data-folding");
    };

    let width = 0;
    new ResizeObserver(() => {
      if (list.clientWidth === width) return;
      width = list.clientWidth;
      fit();
    }).observe(list);
    /* Tabs added or taken away, or the current link moved. */
    new MutationObserver((records) => {
      if (records.some((record) => [...record.addedNodes, ...record.removedNodes].some((node) => node !== more?.button && node !== more?.menu))) fit();
    }).observe(list, { childList: true });
    if (!inPage) new MutationObserver(() => fit()).observe(list, { attributes: true, subtree: true, attributeFilter: ["aria-current"] });
    document.fonts?.ready.then(() => fit());
    fit();
  };

  const setUpTabLists = (root) => {
    const found = [...(root.matches?.(".canon-tabs-list") ? [root] : []), ...(root.querySelectorAll?.(".canon-tabs-list") ?? [])];
    for (const list of found) setUpTabList(list);
  };

  /* ------------------------------------------------------------------ */
  /* Making and giving back room                                         */
  /*                                                                     */
  /* An alert, a banner, a toast, a repeater's item or a combobox's tag  */
  /* coming or going opens or closes its room: data-state="opening" or   */
  /* "closing" while the theme's animations run, its size on             */
  /* --canon-motion-height and --canon-motion-width and, in a flex row   */
  /* or column, the gap it brings on --canon-motion-gap-before (when     */
  /* it's the last) or --canon-motion-gap-after. Then the state goes and */
  /* done() runs; at once when the theme has no animation.               */
  /* ------------------------------------------------------------------ */

  const motionProperties = ["--canon-motion-height", "--canon-motion-width", "--canon-motion-gap-before", "--canon-motion-gap-after"];
  const playRoom = (element, state, done) => {
    const parent = element.parentElement;
    const layout = parent ? getComputedStyle(parent) : null;
    const others = parent ? [...parent.children].filter((other) => other !== element && other.checkVisibility()) : [];
    const flex = Boolean(layout?.display.endsWith("flex") && others.length);
    const column = flex && layout.flexDirection.startsWith("column");
    const last = flex && !others.some((other) => element.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING);
    const between = flex ? (column ? layout.rowGap : layout.columnGap) : "normal";
    const gap = between !== "normal" ? between : "0px";
    const box = element.getBoundingClientRect();
    element.style.setProperty("--canon-motion-height", `${box.height}px`);
    element.style.setProperty("--canon-motion-width", `${box.width}px`);
    element.style.setProperty("--canon-motion-gap-before", last ? gap : "0px");
    element.style.setProperty("--canon-motion-gap-after", last ? "0px" : gap);
    element.setAttribute("data-state", state);
    const finish = () => {
      /* Another state took over (closing while still opening): it finishes. */
      if (element.getAttribute("data-state") !== state) return;
      element.removeAttribute("data-state");
      for (const property of motionProperties) element.style.removeProperty(property);
      done?.();
    };
    const running = element.getAnimations();
    if (running.length) Promise.all(running.map((animation) => animation.finished)).then(finish, finish);
    else finish();
  };

  /* Something that just changed is marked (an attribute, data-updated   */
  /* by default) while the theme's animations on it and its parts run:   */
  /* a Count's number, the Save Bar's status, a calendar's new month,    */
  /* content that finished loading. Marked again meanwhile, they start   */
  /* over.                                                               */
  const marks = new WeakMap();
  const markMotion = (element, attribute = "data-updated", value = "", done) => {
    element.removeAttribute(attribute);
    void element.offsetWidth;
    element.setAttribute(attribute, value);
    const mark = {};
    marks.set(element, mark);
    const clear = () => {
      if (marks.get(element) !== mark) return;
      element.removeAttribute(attribute);
      done?.();
    };
    /* CSS animations that end (not a pulse or a sweep). */
    const running = element.getAnimations({ subtree: true }).filter((animation) => animation.animationName && animation.effect?.getComputedTiming().iterations !== Infinity);
    if (running.length) Promise.all(running.map((animation) => animation.finished)).then(clear, clear);
    else clear();
  };
  const markUpdated = (element) => markMotion(element);

  /* ------------------------------------------------------------------ */
  /* Toast                                                               */
  /*                                                                     */
  /* Short news about what just happened ("Invoice saved"), shown in the */
  /* toaster: a named <section class="canon-toaster"> (canon.js makes    */
  /* one if the page has none), a manual popover so it shows over the    */
  /* page. Two ways in: a Button with command="--canon-toast" aimed at a */
  /* <template> holding a .canon-toast (or at a .canon-toast), or a      */
  /* canon-toast event on the document whose detail says what to show   */
  /* (title, description, intent, emphasis, action, duration, timer);   */
  /* the toast made is put back on detail.toast. Each toast is announced */
  /* (politely), never takes focus, and goes after 5s (10s with an       */
  /* action; data-duration: milliseconds, or "none"), the time paused    */
  /* while the pointer or focus is on the toaster or the page is hidden  */
  /* (the toast data-paused); data-timer shows it running out.           */
  /* At most three at once, the oldest going first. Escape in a toast,   */
  /* its close button or one of its actions dismisses it; canon-dismiss  */
  /* fires on it first (detail.reason: "timeout", "close", "action",     */
  /* "escape", "overflow"). The theme may stack them: canon.js gives     */
  /* each its place from the front (--canon-toast-index, 0 the newest),  */
  /* how far above the toaster's bottom it sits when they're spread out, */
  /* the newest highest (--canon-toast-offset: the heights of the older  */
  /* ones and the toaster's gaps), and the toaster how many there are    */
  /* (--canon-toaster-count), the front one's height                     */
  /* (--canon-toaster-front-height) and all of theirs                    */
  /* (--canon-toaster-height). A toast's own height is measured when it  */
  /* comes (in front, at its own height; its place is set first, so it   */
  /* starts from there) and again when the window's size changes (a     */
  /* hidden copy, so nothing moves).                                     */
  /* ------------------------------------------------------------------ */

  const toastTimers = new WeakMap();
  const toastHeights = new WeakMap();
  let toaster = null;
  let toastsHeld = false;

  const getToaster = () => {
    if (toaster?.isConnected) return toaster;
    toaster = document.querySelector(".canon-toaster");
    if (!toaster) {
      toaster = fromMarkup(`<section class="canon-toaster"></section>`);
      document.body.append(toaster);
    }
    if (!toaster.hasAttribute("popover")) toaster.setAttribute("popover", "manual");
    if (!toaster.hasAttribute("aria-label") && !toaster.hasAttribute("aria-labelledby")) toaster.setAttribute("aria-label", text(toaster, "notifications", "Notifications"));
    /* Held while the pointer or focus is on it: no toast goes meanwhile. */
    const hold = (held) => {
      toastsHeld = held;
      for (const toast of toaster.querySelectorAll(":scope > .canon-toast")) toastTimers.get(toast)?.[held ? "pause" : "resume"]();
    };
    toaster.addEventListener("pointerenter", () => hold(true));
    toaster.addEventListener("pointerleave", () => { if (!toaster.contains(document.activeElement)) hold(false); });
    toaster.addEventListener("focusin", () => hold(true));
    toaster.addEventListener("focusout", (event) => { if (!toaster.contains(event.relatedTarget) && !toaster.matches(":hover")) hold(false); });
    toaster.addEventListener("keydown", (event) => {
      const toast = event.key === "Escape" && event.target.closest(".canon-toast");
      if (!toast) return;
      event.preventDefault();
      dismissToast(toast, "escape");
    });
    toaster.addEventListener("click", (event) => {
      const toast = event.target.closest(".canon-toast");
      if (!toast) return;
      if (event.target.closest(".canon-toast-close")) dismissToast(toast, "close");
      else if (event.target.closest(".canon-toast-actions :is(button, a)")) setTimeout(() => dismissToast(toast, "action"));
    });
    return toaster;
  };

  /* A toast's own height, from a hidden copy at the toaster's width: a
     toast behind the front one may be drawn cut to its height. */
  const measureToast = (toast) => {
    const twin = toast.cloneNode(true);
    twin.removeAttribute("data-state");
    twin.setAttribute("inert", "");
    twin.setAttribute("aria-hidden", "true");
    twin.style.cssText = "position: absolute; inset-inline: 0; inset-block-end: 0; visibility: hidden; block-size: auto; transition: none; animation: none;";
    toast.parentElement.prepend(twin);
    const height = twin.offsetHeight;
    twin.remove();
    return height;
  };
  const stackToasts = (box) => {
    if (!box) return;
    const toasts = [...box.querySelectorAll(":scope > .canon-toast:not([data-state='closing'])")];
    const gap = parseFloat(getComputedStyle(box).rowGap) || 0;
    box.style.setProperty("--canon-toaster-count", String(toasts.length));
    let offset = 0;
    toasts.forEach((toast, order) => {
      const front = order === toasts.length - 1;
      toast.style.setProperty("--canon-toast-index", String(toasts.length - 1 - order));
      toast.style.setProperty("--canon-toast-offset", `${offset}px`);
      if (!toastHeights.has(toast)) toastHeights.set(toast, front ? toast.offsetHeight : measureToast(toast));
      const height = toastHeights.get(toast);
      if (front) box.style.setProperty("--canon-toaster-front-height", `${height}px`);
      offset += height + gap;
    });
    box.style.setProperty("--canon-toaster-height", `${Math.max(0, offset - gap)}px`);
  };
  let restackFrame = 0;
  window.addEventListener("resize", () => {
    if (!toaster?.isConnected || restackFrame) return;
    restackFrame = requestAnimationFrame(() => {
      restackFrame = 0;
      for (const toast of toaster.querySelectorAll(":scope > .canon-toast")) toastHeights.delete(toast);
      stackToasts(toaster);
    });
  });

  const dismissToast = (toast, reason) => {
    if (!toast.isConnected || toast.getAttribute("data-state") === "closing") return;
    toastTimers.get(toast)?.stop();
    toast.dispatchEvent(new CustomEvent("canon-dismiss", { bubbles: true, detail: { reason } }));
    const box = toast.parentElement;
    /* Focus in it goes to the toast before (or after); else back to the page. */
    if (toast.contains(document.activeElement)) {
      const next = toast.previousElementSibling ?? toast.nextElementSibling;
      (next?.querySelector(".canon-toast-close") ?? document.body).focus?.();
    }
    playRoom(toast, "closing", () => {
      toast.remove();
      if (box && !box.querySelector(":scope > .canon-toast") && box.matches(":popover-open")) box.hidePopover();
    });
    if (box?.matches(".canon-toaster")) stackToasts(box);
  };

  const showToast = (toast) => {
    const box = getToaster();
    if (!toast.querySelector(":scope > .canon-toast-close")) {
      const close = fromMarkup(`<button type="button" class="canon-toast-close"></button>`);
      close.setAttribute("aria-label", text(box, "dismiss", "Dismiss"));
      toast.append(close);
    }
    /* Its place first, so it comes in from there: in front, above the
       two it will join when spread. */
    const staying = [...box.querySelectorAll(":scope > .canon-toast:not([data-state='closing'])")].slice(-2);
    const gap = parseFloat(getComputedStyle(box).rowGap) || 0;
    const below = staying.reduce((sum, old) => sum + (toastHeights.get(old) ?? measureToast(old)) + gap, 0);
    toast.style.setProperty("--canon-toast-index", "0");
    toast.style.setProperty("--canon-toast-offset", `${below}px`);
    box.style.setProperty("--canon-toaster-count", String(staying.length + 1));
    box.append(toast);
    /* Over a modal dialog opened since: shown again, so it is on top. */
    if (box.matches(":popover-open") && document.querySelector("dialog:modal")) box.hidePopover();
    if (!box.matches(":popover-open")) box.showPopover();
    const shown = [...box.querySelectorAll(":scope > .canon-toast:not([data-state='closing'])")];
    for (const old of shown.slice(0, Math.max(0, shown.length - 3))) dismissToast(old, "overflow");
    stackToasts(box);

    const said = [toast.querySelector(".canon-toast-title"), toast.querySelector(".canon-toast-description")].filter(Boolean).map((part) => part.textContent.trim()).join(". ");
    if (said) announce(said);

    const set = toast.getAttribute("data-duration");
    const hasAction = Boolean(toast.querySelector(".canon-toast-actions"));
    const total = set === "none" ? Infinity : Number.isFinite(parseFloat(set)) ? parseFloat(set) : hasAction ? 10000 : 5000;
    if (total === Infinity) {
      toast.removeAttribute("data-timer");
      return toast;
    }
    /* A shown timer (data-timer) runs from --canon-toast-duration and
       stops while the toast is data-paused, as the time does. */
    const visible = toast.hasAttribute("data-timer");
    toast.style.setProperty("--canon-toast-duration", `${total}ms`);
    let left = total;
    let started = 0;
    let timer = 0;
    const run = () => {
      started = performance.now();
      toast.removeAttribute("data-paused");
      timer = setTimeout(() => dismissToast(toast, "timeout"), left);
    };
    const pause = () => {
      toast.setAttribute("data-paused", "");
      if (!timer) return;
      clearTimeout(timer);
      timer = 0;
      /* Without a timer to watch, at least a second more once let go. */
      left = left - (performance.now() - started);
      if (!visible) left = Math.max(1000, left);
    };
    toastTimers.set(toast, { pause, resume: () => { if (!timer && !toastsHeld && !document.hidden) run(); }, stop: () => clearTimeout(timer) });
    if (!toastsHeld && !document.hidden) run();
    else toast.setAttribute("data-paused", "");
    return toast;
  };

  document.addEventListener("visibilitychange", () => {
    for (const toast of toaster?.querySelectorAll(":scope > .canon-toast") ?? []) toastTimers.get(toast)?.[document.hidden ? "pause" : "resume"]();
  });

  /* Show a toast: the target is a <template> holding one, or a toast
     (shown as a copy, so it can be shown again). */
  commands["--canon-toast"] = (target) => {
    const source = target instanceof HTMLTemplateElement ? target.content.querySelector(".canon-toast") : target.matches(".canon-toast") ? target : null;
    if (!source) return;
    const toast = source.cloneNode(true);
    toast.removeAttribute("id");
    showToast(toast);
  };

  /* From app code: a canon-toast event on the document. */
  document.addEventListener("canon-toast", (event) => {
    const { title = "", description = "", intent = "", emphasis = "", action = null, duration, timer = false } = event.detail ?? {};
    const toast = fromMarkup(`<div class="canon-toast"><p class="canon-toast-title"></p></div>`);
    if (intent) toast.setAttribute("data-intent", intent);
    if (emphasis) toast.setAttribute("data-emphasis", emphasis);
    if (timer) toast.setAttribute("data-timer", "");
    if (duration !== undefined) toast.setAttribute("data-duration", String(duration));
    toast.querySelector(".canon-toast-title").textContent = title;
    if (description) {
      const part = fromMarkup(`<p class="canon-toast-description"></p>`);
      part.textContent = description;
      toast.append(part);
    }
    if (action?.label) {
      const actions = fromMarkup(`<div class="canon-toast-actions"><button type="button" class="canon-button" data-emphasis="high" data-intent="neutral" data-size="sm"><span class="canon-button-label"></span></button></div>`);
      const button = actions.querySelector("button");
      button.querySelector(".canon-button-label").textContent = action.label;
      if (typeof action.onClick === "function") button.addEventListener("click", action.onClick);
      toast.append(actions);
    }
    event.detail.toast = showToast(toast);
  });

  /* ------------------------------------------------------------------ */
  /* Edit in place (--canon-edit)                                        */
  /*                                                                     */
  /* A Button with command="--canon-edit" edits its target's text (a     */
  /* Page Header's title): a text field takes the text's place, named by */
  /* the button; Enter or leaving the field keeps the change, Escape     */
  /* drops it. canon-edit fires on the target first (detail: value,      */
  /* previous); cancelling it keeps the old text. An empty or unchanged  */
  /* value changes nothing. The text and the button are data-editing     */
  /* (hidden) meanwhile; Enter and Escape bring focus back to the button.*/
  /* ------------------------------------------------------------------ */

  const startEdit = (target, source) => {
    if (target.hasAttribute("data-editing")) return;
    const previous = target.textContent.trim();
    const input = fromMarkup(`<input type="text" class="canon-inline-edit" autocomplete="off" spellcheck="false">`);
    input.value = previous;
    const name = (source.querySelector(":scope > .canon-button-label")?.textContent ?? source.getAttribute("aria-label") ?? "").trim();
    input.setAttribute("aria-label", name || previous);
    target.setAttribute("data-editing", "");
    source.setAttribute("data-editing", "");
    target.after(input);
    input.focus();
    input.select();
    let done = false;
    const finish = (keep, refocus) => {
      if (done) return;
      done = true;
      const value = input.value.trim();
      if (keep && value && value !== previous) {
        const event = new CustomEvent("canon-edit", { bubbles: true, cancelable: true, detail: { value, previous } });
        if (target.dispatchEvent(event)) target.textContent = value;
      }
      target.removeAttribute("data-editing");
      source.removeAttribute("data-editing");
      if (refocus) source.focus();
      input.remove();
    };
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        finish(true, true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        finish(false, true);
      }
    });
    input.addEventListener("blur", () => finish(true, false));
  };

  /* Edit the target's text in place (a Page Header's title). */
  commands["--canon-edit"] = (target, source) => {
    startEdit(target, source);
  };

  /* ------------------------------------------------------------------ */
  /* App Shell                                                           */
  /*                                                                     */
  /* Below the width its theme sets (--canon-sidebar-drawer: 1 on the    */
  /* sidebar, from a container query on the shell), the Sidebar is a     */
  /* drawer: data-drawer="closed" or "open". It takes no room and lies   */
  /* over the page at the shell's start, inside the shell (which may sit */
  /* inside something else), always open inside; a rail is one again    */
  /* when the shell widens. The toggle opens and closes it; Escape, a    */
  /* click or focus elsewhere, and choosing a page close it. Only with   */
  /* the toggle outside the sidebar (in the Top Bar): one inside would   */
  /* go with it.                                                         */
  /* ------------------------------------------------------------------ */

  const shells = new WeakSet();
  const drawers = new WeakMap();

  /* Collapse a Sidebar to its rail (data-display="icon"), or open it
     again; open or close it over the page where it is a drawer. The
     toggle says whether it is open (aria-expanded). */
  commands["--canon-toggle-sidebar"] = (target, source) => {
    /* On a narrow App Shell the sidebar is a drawer over the page. */
    if (target.hasAttribute("data-drawer")) return drawers.get(target)?.();
    const open = target.getAttribute("data-display") === "icon";
    if (open) target.removeAttribute("data-display");
    else target.setAttribute("data-display", "icon");
    source.setAttribute("aria-expanded", String(open));
  };

  const setUpAppShell = (shell) => {
    if (shells.has(shell)) return;
    shells.add(shell);
    const sidebar = shell.querySelector(":scope > .canon-sidebar");
    if (!sidebar?.id) return;
    const toggle = () => document.querySelector(`[command="--canon-toggle-sidebar"][commandfor="${CSS.escape(sidebar.id)}"]`);
    const isOpen = () => sidebar.getAttribute("data-drawer") === "open";
    let display = null;

    const setOpen = (open, refocus = false) => {
      if (!sidebar.hasAttribute("data-drawer") || open === isOpen()) return;
      sidebar.setAttribute("data-drawer", open ? "open" : "closed");
      toggle()?.setAttribute("aria-expanded", String(open));
      if (open && lastInput === "keyboard") {
        const links = [...sidebar.querySelectorAll("a[href], summary")].filter((each) => each.checkVisibility());
        (links.find((each) => each.matches("[aria-current='page']")) ?? links[0])?.focus();
      }
      if (!open && refocus) toggle()?.focus();
    };
    drawers.set(sidebar, () => setOpen(!isOpen()));

    const sync = () => {
      const button = toggle();
      const narrow = getComputedStyle(sidebar).getPropertyValue("--canon-sidebar-drawer").trim() === "1";
      const want = Boolean(narrow && button && !sidebar.contains(button));
      if (want === sidebar.hasAttribute("data-drawer")) return;
      if (want) {
        display = sidebar.getAttribute("data-display");
        sidebar.removeAttribute("data-display");
        sidebar.setAttribute("data-drawer", "closed");
        button.setAttribute("aria-expanded", "false");
      } else {
        sidebar.removeAttribute("data-drawer");
        if (display !== null) sidebar.setAttribute("data-display", display);
        button?.setAttribute("aria-expanded", String(display !== "icon"));
      }
    };

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !isOpen()) return;
      setOpen(false, sidebar.contains(document.activeElement));
    });
    document.addEventListener("click", (event) => {
      if (isOpen() && !sidebar.contains(event.target) && !toggle()?.contains(event.target)) setOpen(false);
    });
    sidebar.addEventListener("focusout", (event) => {
      const next = event.relatedTarget;
      if (isOpen() && next && !sidebar.contains(next) && !toggle()?.contains(next)) setOpen(false);
    });
    sidebar.addEventListener("click", (event) => {
      if (event.target.closest("a[href]")) setOpen(false);
    });
    new ResizeObserver(sync).observe(shell);
    sync();
  };

  const setUpAppShells = (root) => {
    const found = [...(root.matches?.(".canon-app-shell") ? [root] : []), ...(root.querySelectorAll?.(".canon-app-shell") ?? [])];
    for (const shell of found) setUpAppShell(shell);
  };

  /* ------------------------------------------------------------------ */
  /* Alert                                                               */
  /*                                                                     */
  /* Its close button gets a name when it has none (--canon-text-        */
  /* dismiss). Clicked, canon-dismiss fires on the alert (detail.reason: */
  /* "close"; cancelable, for an app that dismisses its own way); then   */
  /* focus that was in it moves to the next thing in the page (or the    */
  /* one before), and it closes its room and is hidden. One shown while  */
  /* the page is open (unhidden, or put in with a role) opens its room.  */
  /* ------------------------------------------------------------------ */

  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled], [type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

  const dismissAlert = (alert) => {
    if (alert.getAttribute("data-state") === "closing") return;
    const go = alert.dispatchEvent(new CustomEvent("canon-dismiss", { bubbles: true, cancelable: true, detail: { reason: "close" } }));
    if (!go) return;
    if (alert.contains(document.activeElement)) {
      const others = [...document.querySelectorAll(focusableSelector)].filter((element) => !alert.contains(element) && element.checkVisibility());
      const after = others.find((element) => alert.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
      (after ?? others.findLast((element) => alert.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING) ?? document.body).focus?.();
    }
    playRoom(alert, "closing", () => { alert.hidden = true; });
  };
  const openAlert = (alert) => {
    if (alert.checkVisibility()) playRoom(alert, "opening");
  };

  /* Banners' close buttons work the same way. */
  document.addEventListener("click", (event) => {
    const alert = event.target.closest?.(":is(.canon-alert-close, .canon-banner-close)")?.closest(".canon-alert, .canon-banner");
    if (alert) dismissAlert(alert);
  });

  const setUpAlerts = (root) => {
    const found = [...(root.matches?.(".canon-alert-close, .canon-banner-close") ? [root] : []), ...(root.querySelectorAll?.(".canon-alert-close, .canon-banner-close") ?? [])];
    for (const close of found) {
      if (!close.hasAttribute("aria-label") && !close.hasAttribute("aria-labelledby")) close.setAttribute("aria-label", text(close, "dismiss", "Dismiss"));
    }
  };

  /* ------------------------------------------------------------------ */
  /* Banner                                                              */
  /*                                                                     */
  /* Banners stay in view: their parent (the <body>, or what holds the   */
  /* App Shell) is marked data-canon-banners, each banner gets its       */
  /* offset under the ones before it (--canon-banner-offset), and the    */
  /* parent gets their total height (--canon-banners-height), which the  */
  /* App Shell's sidebar, bar and sticky parts start under. Measured     */
  /* again when one changes size, is dismissed, comes or goes.           */
  /* ------------------------------------------------------------------ */

  const bannerParents = new WeakSet();
  const measureBanners = (parent) => {
    let offset = 0;
    for (const banner of parent.querySelectorAll(":scope > .canon-banner")) {
      banner.style.setProperty("--canon-banner-offset", `${offset}px`);
      if (banner.checkVisibility()) offset += banner.getBoundingClientRect().height;
    }
    parent.style.setProperty("--canon-banners-height", `${offset}px`);
  };
  const bannerSizes = new ResizeObserver((entries) => {
    for (const parent of new Set(entries.map((entry) => entry.target.parentElement).filter(Boolean))) measureBanners(parent);
  });

  const setUpBanners = (root) => {
    const found = [...(root.matches?.(".canon-banner") ? [root] : []), ...(root.querySelectorAll?.(".canon-banner") ?? [])];
    for (const banner of found) {
      const parent = banner.parentElement;
      if (!parent) continue;
      bannerSizes.observe(banner);
      if (!bannerParents.has(parent)) {
        bannerParents.add(parent);
        parent.setAttribute("data-canon-banners", "");
        new MutationObserver(() => measureBanners(parent)).observe(parent, { childList: true });
      }
      measureBanners(parent);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Save Bar                                                            */
  /*                                                                     */
  /* A form's .canon-save-bar: its status, Discard (type="reset") and    */
  /* Save (type="submit"). The form's default values are what's saved:   */
  /* a control differing from its default is a change, counted in the   */
  /* status; Discard (the browser's reset) brings them back. data-state  */
  /* on the bar: "changed", "saving", "saved", "failed" (none: no        */
  /* changes). On submit it is "saving"; an app saving on its own        */
  /* (preventDefault) answers with canon-saved on the form (the values   */
  /* (Save and Discard are aria-disabled with nothing to save, or while   */
  /* saving: reachable, announced as unavailable, doing nothing.)         */
  /* become the new defaults) or canon-save-failed (detail.message), the */
  /* changes kept. With changes, leaving the page asks first. The Save   */
  /* button's aria-keyshortcuts (Meta+S Control+S) save the form focus   */
  /* is in, or the only one.                                             */
  /* ------------------------------------------------------------------ */

  const saveBars = new WeakMap();

  const controlsOf = (form) => [...form.elements].filter((control) => control.name && !control.disabled && !(control instanceof HTMLButtonElement) && !(control instanceof HTMLFieldSetElement) && control.type !== "hidden");
  const changedControls = (form) => controlsOf(form).filter((control) => {
    if (control.type === "checkbox" || control.type === "radio") return control.checked !== control.defaultChecked;
    if (control instanceof HTMLSelectElement) return [...control.options].some((option) => option.selected !== option.defaultSelected);
    return control.value !== control.defaultValue;
  });
  /* A change counts once per name (a radio group, a set of checkboxes). */
  const changeCount = (form) => new Set(changedControls(form).map((control) => control.name)).size;
  /* What is shown becomes what's saved. */
  const commitDefaults = (form) => {
    for (const control of controlsOf(form)) {
      if (control.type === "checkbox" || control.type === "radio") control.defaultChecked = control.checked;
      else if (control instanceof HTMLSelectElement) for (const option of control.options) option.defaultSelected = option.selected;
      else control.defaultValue = control.value;
    }
  };

  const setUpSaveBar = (bar) => {
    const form = bar.closest("form");
    if (!form || saveBars.has(form)) return;
    let status = bar.querySelector(":scope > .canon-save-bar-status");
    if (!status) {
      status = fromMarkup(`<p class="canon-save-bar-status"></p>`);
      bar.prepend(status);
    }
    status.setAttribute("role", "status");
    /* The status is shown as a Status Indicator, its intent the state's. */
    const indicator = fromMarkup(`<span class="canon-status"><span class="canon-status-label"></span></span>`);
    status.replaceChildren(indicator);
    const intents = { changed: "warning", saving: "info", saved: "success", failed: "danger" };
    let state = "";
    let message = "";
    const show = (next, words = "") => {
      if (next !== state) markUpdated(status);
      state = next;
      message = words;
      if (state) bar.setAttribute("data-state", state);
      else bar.removeAttribute("data-state");
      const count = changeCount(form);
      if (intents[state]) indicator.setAttribute("data-intent", intents[state]);
      else indicator.removeAttribute("data-intent");
      indicator.toggleAttribute("data-pulse", state === "saving");
      /* Nothing to save (or saving already): Save and Discard are
         unavailable, still reachable, the status saying why. */
      const idle = state === "saving" || count === 0;
      for (const button of bar.querySelectorAll(":scope > button:is([type='submit'], [type='reset'])")) {
        if (idle) button.setAttribute("aria-disabled", "true");
        else button.removeAttribute("aria-disabled");
      }
      indicator.firstElementChild.textContent = state === "saving" ? text(bar, "saving", "Saving…")
        : state === "failed" ? (message || text(bar, "save-failed", "Couldn't save"))
        : state === "saved" ? text(bar, "saved", "Changes saved")
        : count ? countText(bar, "unsaved-changes", count)
        : text(bar, "no-changes", "No changes");
    };
    const refresh = () => {
      if (state === "saving") return;
      const count = changeCount(form);
      if (count) show("changed");
      else if (state !== "saved") show("");
      else show("saved");
    };
    /* An unavailable Save or Discard does nothing: a click, or Enter in a
       field (which clicks Save). */
    bar.addEventListener("click", (event) => {
      const button = event.target.closest("button[aria-disabled='true']");
      if (button && bar.contains(button)) event.preventDefault();
    }, true);
    form.addEventListener("input", refresh);
    form.addEventListener("change", refresh);
    /* The values come back after the reset event: look then. */
    form.addEventListener("reset", () => setTimeout(() => { if (state === "failed") state = ""; refresh(); }));
    /* Saving: after the app's own submit listeners (bubbling, at the
       document), so a cancelled submit means the app saves itself. */
    document.addEventListener("submit", (event) => {
      if (event.target !== form) return;
      show("saving");
    });
    form.addEventListener("canon-saved", () => {
      commitDefaults(form);
      show("saved");
    });
    form.addEventListener("canon-save-failed", (event) => {
      show("failed", event.detail?.message ?? "");
    });
    saveBars.set(form, { bar, changed: () => changeCount(form) > 0 && state !== "saving" });
    show("");
  };

  const setUpSaveBars = (root) => {
    const found = [...(root.matches?.(".canon-save-bar") ? [root] : []), ...(root.querySelectorAll?.(".canon-save-bar") ?? [])];
    for (const bar of found) setUpSaveBar(bar);
  };

  /* Leaving with unsaved changes asks first. */
  window.addEventListener("beforeunload", (event) => {
    for (const form of document.querySelectorAll("form:has(.canon-save-bar)")) {
      if (!saveBars.get(form)?.changed()) continue;
      event.preventDefault();
      event.returnValue = "";
      return;
    }
  });

  /* Save's shortcut: the form focus is in, or the only one with a bar. */
  document.addEventListener("keydown", (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.repeat) return;
    const forms = [...document.querySelectorAll("form:has(.canon-save-bar)")];
    const form = forms.find((each) => each.contains(document.activeElement)) ?? (forms.length === 1 ? forms[0] : null);
    const save = form?.querySelector(".canon-save-bar [type='submit'][aria-keyshortcuts]");
    if (!save || !save.getAttribute("aria-keyshortcuts").split(/\s+/).some((shortcut) => shortcutMatches(event, shortcut))) return;
    event.preventDefault();
    if (save.getAttribute("aria-disabled") !== "true") form.requestSubmit(save);
  });

  /* ------------------------------------------------------------------ */
  /* Split Pane                                                          */
  /*                                                                     */
  /* .canon-split-pane: a pane, a handle (role="separator") and a pane.  */
  /* The handle's aria-valuenow is the first pane's size in percent      */
  /* (aria-valuemin, aria-valuemax its limits), written to the box as    */
  /* --canon-split-size. Dragging (a pointer), the arrows (2%; Shift     */
  /* 10%), Home and End (the limits) resize it; Enter collapses the      */
  /* first pane to its minimum and brings it back; a double click goes   */
  /* back to the size it started with. Left and right are mirrored in    */
  /* right-to-left. canon-resize fires on the box when a resize ends     */
  /* (detail.size), for the app to remember.                             */
  /* ------------------------------------------------------------------ */

  const splitHandles = new WeakSet();

  const setUpSplitHandle = (handle) => {
    const box = handle.parentElement;
    if (splitHandles.has(handle) || !box?.matches(".canon-split-pane")) return;
    splitHandles.add(handle);
    const number = (name, fallback) => {
      const value = parseFloat(handle.getAttribute(name));
      return Number.isFinite(value) ? value : fallback;
    };
    const min = () => number("aria-valuemin", 0);
    const max = () => number("aria-valuemax", 100);
    const clamp = (value) => Math.min(max(), Math.max(min(), value));
    const stacked = () => handle.getAttribute("aria-orientation") === "horizontal";
    const percent = (value) => {
      try {
        return new Intl.NumberFormat(langOf(handle), { style: "percent", maximumFractionDigits: 0 }).format(value / 100);
      } catch {
        return `${Math.round(value)}%`;
      }
    };
    let size = clamp(number("aria-valuenow", 50));
    const initial = size;
    let restore = null;
    const set = (value, tell = false) => {
      size = clamp(value);
      box.style.setProperty("--canon-split-size", `${size}%`);
      handle.setAttribute("aria-valuenow", String(Math.round(size)));
      handle.setAttribute("aria-valuetext", percent(size));
      if (tell) box.dispatchEvent(new CustomEvent("canon-resize", { bubbles: true, detail: { size } }));
    };
    set(size);

    handle.addEventListener("keydown", (event) => {
      const rtl = getComputedStyle(box).direction === "rtl";
      const step = event.shiftKey ? 10 : 2;
      const grow = stacked() ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
      const shrink = stacked() ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
      let next = null;
      if (event.key === grow) next = size + step;
      else if (event.key === shrink) next = size - step;
      else if (event.key === "Home") next = min();
      else if (event.key === "End") next = max();
      else if (event.key === "Enter") {
        if (size > min()) {
          restore = size;
          next = min();
        } else next = restore ?? initial;
      }
      if (next === null) return;
      event.preventDefault();
      set(next, true);
    });

    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      handle.focus({ preventScroll: true });
      box.setAttribute("data-state", "resizing");
      const move = (moveEvent) => {
        const rect = box.getBoundingClientRect();
        const rtl = getComputedStyle(box).direction === "rtl";
        const at = stacked()
          ? (moveEvent.clientY - rect.top) / rect.height
          : (rtl ? rect.right - moveEvent.clientX : moveEvent.clientX - rect.left) / rect.width;
        set(at * 100);
      };
      const end = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", end);
        handle.removeEventListener("pointercancel", end);
        box.removeAttribute("data-state");
        box.dispatchEvent(new CustomEvent("canon-resize", { bubbles: true, detail: { size } }));
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
    });
    handle.addEventListener("dblclick", () => set(initial, true));
  };

  const setUpSplitPanes = (root) => {
    const found = [...(root.matches?.(".canon-split-pane-handle") ? [root] : []), ...(root.querySelectorAll?.(".canon-split-pane-handle") ?? [])];
    for (const handle of found) setUpSplitHandle(handle);
  };

  /* ------------------------------------------------------------------ */
  /* Select: a steady width                                              */
  /*                                                                     */
  /* A Select that sizes to its content (outside a Field: in a toolbar,  */
  /* a pagination, a sentence) keeps the width of its longest choice, as */
  /* a plain select always has: a styled one is only as wide as the      */
  /* choice it shows, so the things after it would move as it changes.   */
  /* Measured once it's shown, and again when the page's fonts have      */
  /* loaded. A Field's own Select fills the field, so it's left alone    */
  /* (one deeper in a field, in an editor's toolbar, isn't).             */
  /* ------------------------------------------------------------------ */

  const steadied = new WeakSet();
  const steadyWidth = (select) => {
    if (!select.isConnected || !select.checkVisibility()) return;
    const chosen = select.selectedIndex;
    select.style.minInlineSize = "";
    let widest = 0;
    for (let index = 0; index < select.options.length; index++) {
      select.selectedIndex = index;
      widest = Math.max(widest, select.getBoundingClientRect().width);
    }
    select.selectedIndex = chosen;
    if (widest) select.style.minInlineSize = `${Math.ceil(widest)}px`;
  };
  /* Measured as soon as it's shown (it has a size), once. */
  const steadyOnScreen = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (!entry.contentRect.width) continue;
      steadyOnScreen.unobserve(entry.target);
      steadyWidth(entry.target);
      document.fonts?.ready.then(() => steadyWidth(entry.target));
    }
  });
  const setUpSteadySelects = (root) => {
    const found = [...(root.matches?.(".canon-select > select") ? [root] : []), ...(root.querySelectorAll?.(".canon-select > select") ?? [])];
    for (const select of found) {
      /* A field's own control fills the field: left alone. */
      if (select.multiple || select.parentElement.parentElement?.matches(".canon-field") || steadied.has(select)) continue;
      steadied.add(select);
      steadyOnScreen.observe(select);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Toolbar                                                             */
  /*                                                                     */
  /* One Tab stop (the control last used; the first, to start). Left and */
  /* Right (Up and Down in a vertical toolbar) move to the previous or   */
  /* next control, through button groups too, wrapping; Home and End to  */
  /* the ends. In a text field the arrows stay the field's.              */
  /* ------------------------------------------------------------------ */

  const toolbars = new WeakSet();
  const toolbarControls = (bar) =>
    [...bar.querySelectorAll("button, select, input:not([type='hidden']), textarea, a[href], [tabindex]")].filter(
      (element) => element.closest(".canon-toolbar") === bar && !element.closest("[popover], template") && !element.disabled && element.checkVisibility(),
    );

  const setUpToolbar = (bar) => {
    if (toolbars.has(bar)) return;
    toolbars.add(bar);
    let current = null;
    const stop = (item) => {
      const list = toolbarControls(bar);
      current = list.includes(item) ? item : list.includes(current) ? current : list[0];
      for (const each of list) each.tabIndex = each === current ? 0 : -1;
    };
    stop(null);
    bar.addEventListener("focusin", (event) => {
      if (toolbarControls(bar).includes(event.target)) stop(event.target);
    });
    bar.addEventListener("keydown", (event) => {
      const list = toolbarControls(bar);
      const at = list.indexOf(event.target);
      if (at < 0) return;
      const vertical = bar.getAttribute("aria-orientation") === "vertical";
      const rtl = getComputedStyle(bar).direction === "rtl";
      const next = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
      const previous = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
      const typing = event.target.matches("textarea, input:not([type='checkbox'], [type='radio'], [type='range'], [type='color'])");
      let target;
      if (event.key === next && !typing) target = list[(at + 1) % list.length];
      else if (event.key === previous && !typing) target = list.at(at - 1);
      else if (event.key === "Home" && !typing) target = list[0];
      else if (event.key === "End" && !typing) target = list.at(-1);
      if (!target) return;
      event.preventDefault();
      target.focus();
    });
    /* Controls added, removed, enabled or disabled keep one stop. */
    new MutationObserver(() => stop(current)).observe(bar, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "hidden"] });
  };

  const setUpToolbars = (root) => {
    const found = [...(root.matches?.(".canon-toolbar") ? [root] : []), ...(root.querySelectorAll?.(".canon-toolbar") ?? [])];
    for (const bar of found) setUpToolbar(bar);
  };

  /* ------------------------------------------------------------------ */
  /* Popover                                                             */
  /*                                                                     */
  /* A .canon-popover (role="dialog") opened by a button's               */
  /* popovertarget: the browser opens, anchors and dismisses it. canon.js */
  /* gives its button aria-expanded, moves focus into it when it opens    */
  /* (its first field or control, else the panel itself), and closes it  */
  /* when focus leaves it for somewhere other than its button; closing    */
  /* returns focus to the button.                                        */
  /* ------------------------------------------------------------------ */

  const popovers = new WeakSet();

  /* Several buttons can open the same popover: remember the one pressed. */
  const popoverOpeners = new WeakMap();
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("[popovertarget]");
    const target = button && document.getElementById(button.getAttribute("popovertarget"));
    if (target) popoverOpeners.set(target, button);
  }, true);

  const setUpPopover = (popover) => {
    if (popovers.has(popover)) return;
    popovers.add(popover);
    if (!popover.hasAttribute("tabindex")) popover.tabIndex = -1;
    const invoker = () => {
      const opener = popoverOpeners.get(popover);
      if (opener?.isConnected) return opener;
      return popover.id ? document.querySelector(`[popovertarget="${CSS.escape(popover.id)}"]`) : null;
    };

    popover.addEventListener("toggle", (event) => {
      invoker()?.setAttribute("aria-expanded", String(event.newState === "open"));
      if (popover.popover === "manual" || event.newState !== "open") return;
      const target = popover.querySelector("[autofocus]") ?? firstControl(popover) ?? popover;
      target.focus({ preventScroll: true });
    });
    popover.addEventListener("focusout", (event) => {
      const next = event.relatedTarget;
      if (!next || popover.contains(next) || next === invoker() || popover.popover === "manual") return;
      /* Focus went elsewhere in the page: the popover is done. */
      if (popover.matches(":popover-open")) popover.hidePopover();
    });
  };

  const setUpPopovers = (root) => {
    const found = [...(root.matches?.(".canon-popover") ? [root] : []), ...(root.querySelectorAll?.(".canon-popover") ?? [])];
    for (const popover of found) setUpPopover(popover);
  };

  /* ------------------------------------------------------------------ */
  /* Rich text (a Textarea with data-rich)                               */
  /*                                                                     */
  /* The <textarea> keeps the value: clean HTML, what the form submits.  */
  /* canon.js hides it (still the label's target, the form value and     */
  /* what validation checks) and draws, inside the box, a Toolbar of the */
  /* groups in data-tools (default "history block marks link lists")     */
  /* over an editable area (role="textbox") driven by the browser's      */
  /* editing commands. Only the HTML in richClean's lists is kept: paste */
  /* is cleaned, and so is what is written back to the textarea. The     */
  /* toolbar follows the selection; links, colors and images use         */
  /* Popovers, Insert a Menu.                                            */
  /* ------------------------------------------------------------------ */

  const richTools = ["history", "block", "align", "marks", "link", "color", "clear", "script", "lists", "indent", "insert"];
  const richDefault = "history block marks link lists";
  const richPalette = [["#dc2626", "red"], ["#ea580c", "orange"], ["#ca8a04", "yellow"], ["#16a34a", "green"], ["#2563eb", "blue"], ["#9333ea", "purple"], ["#71717a", "gray"]];

  /* Colors compared as the browser writes them. */
  const colorProbe = document.createElement("span");
  const normalColor = (value) => {
    colorProbe.style.color = "";
    colorProbe.style.color = value || "";
    return colorProbe.style.color;
  };
  const paletteColor = (value) => {
    const normal = normalColor(value);
    return normal ? richPalette.find(([hex]) => normalColor(hex) === normal)?.[0] ?? null : null;
  };
  const safeUrl = (value, image) => {
    const url = (value ?? "").trim();
    if (!url) return null;
    if (/^(https?:|\/|\.|#|\?)/i.test(url)) return url;
    if (!image && /^(mailto:|tel:)/i.test(url)) return url;
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null;
    return url;
  };

  /* Keep: p, h2-h4 (h1 becomes h2, h5 and h6 h4), blockquote, pre (its
     text), ul, ol, li, hr, img (src, alt), br, strong, em, u, s, sub,
     sup, a (href, and target="_blank" with rel="noopener"), span with a
     palette color; text-align on blocks (logical: start, end). Everything else is unwrapped or,
     for scripts, styles and embeds, dropped. */
  const richClean = (html, rtl = false) => {
    const source = document.createElement("template");
    source.innerHTML = html;
    const out = document.createElement("div");
    const drop = new Set(["SCRIPT", "STYLE", "TEMPLATE", "IFRAME", "OBJECT", "EMBED", "HEAD", "META", "LINK", "TITLE", "NOSCRIPT", "SVG", "MATH", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "FORM"]);
    const rename = { H1: "H2", H5: "H4", H6: "H4", B: "STRONG", I: "EM", STRIKE: "S", DEL: "S", FONT: "SPAN" };
    const keep = new Set(["P", "H2", "H3", "H4", "BLOCKQUOTE", "PRE", "UL", "OL", "LI", "HR", "IMG", "BR", "STRONG", "EM", "U", "S", "SUB", "SUP", "A", "SPAN"]);
    const aligned = new Set(["P", "H2", "H3", "H4", "BLOCKQUOTE", "LI"]);
    const blockish = /^(P|H[1-6]|BLOCKQUOTE|PRE|UL|OL|LI|HR|DIV|SECTION|ARTICLE|HEADER|FOOTER|MAIN|ASIDE|NAV|TABLE|FIGURE)$/;
    const walk = (from, to) => {
      for (const node of from.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          to.append(node.textContent);
          continue;
        }
        if (node.nodeType !== Node.ELEMENT_NODE || drop.has(node.tagName)) continue;
        let tag = rename[node.tagName] ?? node.tagName;
        /* A div of text is a paragraph; one holding blocks just goes. */
        if (/^(DIV|SECTION|ARTICLE|HEADER|FOOTER|MAIN|ASIDE|FIGURE)$/.test(tag)) {
          tag = [...node.children].some((child) => blockish.test(child.tagName)) ? null : "P";
          if (tag && to.closest?.("p, h2, h3, h4, li, pre")) tag = null;
        }
        if (!tag || !keep.has(tag)) {
          walk(node, to);
          continue;
        }
        if (tag === "PRE") {
          const pre = document.createElement("pre");
          pre.textContent = node.textContent;
          to.append(pre);
          continue;
        }
        const element = document.createElement(tag.toLowerCase());
        if (tag === "A") {
          const href = safeUrl(node.getAttribute("href"));
          if (!href) {
            walk(node, to);
            continue;
          }
          element.setAttribute("href", href);
          if (node.getAttribute("target") === "_blank") {
            element.setAttribute("target", "_blank");
            element.setAttribute("rel", "noopener");
          }
        } else if (tag === "IMG") {
          const src = safeUrl(node.getAttribute("src"), true);
          if (!src) continue;
          element.setAttribute("src", src);
          element.setAttribute("alt", node.getAttribute("alt") ?? "");
        } else if (tag === "SPAN") {
          const color = paletteColor(node.style?.color || node.getAttribute("color"));
          if (!color) {
            walk(node, to);
            continue;
          }
          element.setAttribute("style", `color: ${color}`);
        }
        if (aligned.has(tag)) {
          /* Logical: left and right become start and end for the text's
             direction; start is the default and isn't written. */
          let align = (node.style?.textAlign || node.getAttribute("align") || "").toLowerCase();
          if (align === "left") align = rtl ? "end" : "start";
          if (align === "right") align = rtl ? "start" : "end";
          if (["center", "justify", "end"].includes(align)) element.setAttribute("style", `text-align: ${align}`);
        }
        to.append(element);
        if (tag !== "BR" && tag !== "HR" && tag !== "IMG") walk(node, element);
      }
    };
    walk(source.content, out);
    /* Loose words between blocks go in paragraphs. */
    const isBlock = (node) => node.nodeType === Node.ELEMENT_NODE && /^(P|H2|H3|H4|BLOCKQUOTE|PRE|UL|OL|HR)$/.test(node.tagName);
    let run = null;
    for (const node of [...out.childNodes]) {
      if (isBlock(node)) {
        run = null;
        continue;
      }
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim() && !run) {
        node.remove();
        continue;
      }
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "LI") {
        run = null;
        const list = document.createElement("ul");
        node.replaceWith(list);
        list.append(node);
        continue;
      }
      if (!run) {
        run = document.createElement("p");
        node.before(run);
      }
      run.append(node);
    }
    for (const paragraph of out.querySelectorAll(":scope > p")) {
      if (!paragraph.textContent.trim() && !paragraph.querySelector("img, br")) paragraph.remove();
    }
    /* Nothing written: no value. */
    if (!out.textContent.trim() && !out.querySelector("img, hr")) return "";
    return out.innerHTML;
  };

  const richBoxes = new WeakSet();

  const setUpRich = (box) => {
    const textarea = box.querySelector(":scope > textarea");
    if (!textarea || richBoxes.has(box)) return;
    richBoxes.add(box);
    const label = (key, fallback) => text(box, `rich-${key}`, fallback);
    const id = textarea.id || `canon-rich-${Math.random().toString(36).slice(2, 8)}`;
    const tools = new Set((box.dataset.tools || richDefault).split(/\s+/).flatMap((tool) => (tool === "all" ? richTools : [tool])));
    const make = (tag, className, attributes = {}) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
      return element;
    };
    const iconOf = (name) => make("span", "canon-icon", { "data-icon": name, "aria-hidden": "true" });
    const button = (icon, name, attributes = {}) => {
      const element = make("button", "canon-button", { type: "button", ...attributes });
      element.append(iconOf(icon), Object.assign(make("span", "canon-button-label"), { textContent: name }));
      return element;
    };
    const group = (name, attributes = {}) => make("div", "canon-button-group", { role: "group", "aria-label": name, "data-display": "icon", ...attributes });

    /* The area. */
    const area = make("div", "canon-rich-area", {
      role: "textbox",
      "aria-multiline": "true",
      contenteditable: "true",
      spellcheck: "true",
    });
    const fieldLabel = textarea.labels?.[0];
    if (fieldLabel) {
      if (!fieldLabel.id) fieldLabel.id = `${id}-label`;
      area.setAttribute("aria-labelledby", fieldLabel.id);
    } else if (textarea.hasAttribute("aria-label")) area.setAttribute("aria-label", textarea.getAttribute("aria-label"));
    const placeholder = textarea.getAttribute("placeholder");
    if (placeholder) area.dataset.placeholder = placeholder;
    area.style.setProperty("--canon-rich-rows", textarea.rows || 2);
    const maxLines = textarea.dataset.maxLines;
    if (maxLines && maxLines !== "none") area.style.setProperty("--canon-rich-max-lines", maxLines);
    if (maxLines === "none") area.dataset.grow = "";

    /* The toolbar. */
    const toolbar = make("div", "canon-toolbar canon-rich-toolbar", { role: "toolbar", "aria-label": label("toolbar", "Formatting") });
    const boxSize = box.closest("[data-size]")?.dataset.size;
    toolbar.dataset.size = ["lg", "xl", "2xl"].includes(boxSize) ? "md" : "sm";
    toolbar.setAttribute("aria-controls", `${id}-area`);
    area.id = `${id}-area`;
    const controls = {};
    const pressed = [];

    if (tools.has("history")) {
      const history = group(label("history", "History"));
      controls.undo = button("undo", label("undo", "Undo"), { "aria-keyshortcuts": "Control+Z Meta+Z" });
      controls.redo = button("redo", label("redo", "Redo"), { "aria-keyshortcuts": "Control+Shift+Z Meta+Shift+Z" });
      history.append(controls.undo, controls.redo);
      toolbar.append(history);
    }
    if (tools.has("block")) {
      const select = make("select", "", { "aria-label": label("block", "Text style") });
      for (const [value, key, fallback] of [["p", "paragraph", "Paragraph"], ["h2", "heading-1", "Heading 1"], ["h3", "heading-2", "Heading 2"], ["h4", "heading-3", "Heading 3"], ["blockquote", "quote", "Quote"], ["pre", "code", "Code"]]) {
        select.append(new Option(label(key, fallback), value));
      }
      const selectBox = make("div", "canon-select");
      selectBox.append(iconOf("text-cursor"), select);
      controls.block = select;
      toolbar.append(selectBox);
    }
    if (tools.has("align")) {
      const align = group(label("align", "Alignment"), { "data-select": "one" });
      for (const [icon, key, fallback] of [["align-start", "align-start", "Align left"], ["align-center", "align-center", "Center"], ["align-end", "align-end", "Align right"], ["align-justify", "align-justify", "Justify"]]) {
        const each = button(icon, label(key, fallback), { "aria-pressed": "false", "data-command": key });
        controls[key] = each;
        pressed.push(each);
        align.append(each);
      }
      toolbar.append(align);
    }
    if (tools.has("marks")) {
      const marks = group(label("marks", "Character style"));
      for (const [icon, command, fallback, keys] of [["bold", "bold", "Bold", "Control+B Meta+B"], ["italic", "italic", "Italic", "Control+I Meta+I"], ["underline", "underline", "Underline", "Control+U Meta+U"], ["strikethrough", "strikeThrough", "Strikethrough"]]) {
        const each = button(icon, label(icon, fallback), { "aria-pressed": "false", "data-command": command, ...(keys ? { "aria-keyshortcuts": keys } : {}) });
        controls[command] = each;
        pressed.push(each);
        marks.append(each);
      }
      toolbar.append(marks);
    }

    /* Popovers: a link, a color, an image. Built only when their tool is. */
    const popover = (key, title) => {
      const element = make("div", "canon-popover", { id: `${id}-${key}`, popover: "", role: "dialog", "aria-labelledby": `${id}-${key}-title` });
      element.append(Object.assign(make("h2", "canon-popover-title", { id: `${id}-${key}-title` }), { textContent: title }));
      return element;
    };
    const textField = (key, name, type, hint) => {
      const field = make("div", "canon-field");
      const top = make("div", "canon-label");
      top.append(Object.assign(make("label", "canon-label-text", { for: `${id}-${key}` }), { textContent: name }));
      const input = make("input", "", { type, id: `${id}-${key}`, name: key, placeholder: type === "url" ? "https://" : "", size: "32" });
      if (hint) {
        top.append(Object.assign(make("p", "canon-label-description", { id: `${id}-${key}-hint` }), { textContent: hint }));
        input.setAttribute("aria-describedby", `${id}-${key}-hint`);
      }
      const inputBox = make("div", "canon-text-input");
      inputBox.append(input);
      field.append(top, inputBox);
      return [field, input];
    };
    const actionsRow = (...buttons) => {
      const row = make("div", "canon-form-actions");
      row.append(...buttons);
      return row;
    };
    const plainButton = (name, attributes = {}) => {
      const element = make("button", "canon-button", { type: "button", ...attributes });
      element.append(Object.assign(make("span", "canon-button-label"), { textContent: name }));
      return element;
    };

    let linkPopover;
    let linkUrl;
    let linkNewTab;
    let linkRemove;
    if (tools.has("link")) {
      controls.link = button("link", label("link", "Link"), { "data-display": "icon", popovertarget: `${id}-link`, "aria-haspopup": "dialog", "aria-keyshortcuts": "Control+K Meta+K" });
      toolbar.append(controls.link);
      linkPopover = popover("link", label("link-title", "Link"));
      const form = make("form", "canon-form");
      const [urlField, url] = textField("link-url", label("link-url", "Address"), "url");
      linkUrl = url;
      const choice = make("div", "canon-choice");
      linkNewTab = make("input", "", { type: "checkbox", id: `${id}-link-new` });
      choice.append(linkNewTab, Object.assign(make("label", "canon-choice-label", { for: `${id}-link-new` }), { textContent: label("link-new-tab", "Open in a new tab") }));
      linkRemove = plainButton(label("link-remove", "Remove link"), { "data-emphasis": "low", "data-intent": "danger" });
      form.append(urlField, choice, actionsRow(plainButton(label("apply", "Apply"), { type: "submit", "data-emphasis": "high" }), linkRemove));
      linkPopover.append(form);
    }

    let colorPopover;
    if (tools.has("color")) {
      controls.color = button("baseline", label("color", "Text color"), { "data-display": "icon", popovertarget: `${id}-color`, "aria-haspopup": "dialog" });
      toolbar.append(controls.color);
      colorPopover = make("div", "canon-popover", { id: `${id}-color`, popover: "", role: "dialog", "aria-label": label("color", "Text color") });
      const swatches = make("div", "canon-swatches", { role: "radiogroup", "aria-label": label("color", "Text color") });
      for (const [hex, name] of richPalette) {
        const radio = make("input", "", { type: "radio", name: `${id}-color`, value: hex, "aria-label": label(`color-${name}`, name[0].toUpperCase() + name.slice(1)) });
        swatches.append(radio);
      }
      const reset = plainButton(label("color-default", "Default color"), { "data-emphasis": "minimal", "data-intent": "neutral", "data-color": "" });
      colorPopover.append(swatches, reset);
    }
    if (tools.has("clear")) {
      controls.clear = button("eraser", label("clear", "Clear formatting"), { "data-display": "icon", "data-command": "removeFormat" });
      toolbar.append(controls.clear);
    }
    if (tools.has("script")) {
      const script = group(label("script", "Script"));
      for (const [icon, command, fallback] of [["subscript", "subscript", "Subscript"], ["superscript", "superscript", "Superscript"]]) {
        const each = button(icon, label(icon, fallback), { "aria-pressed": "false", "data-command": command });
        controls[command] = each;
        pressed.push(each);
        script.append(each);
      }
      toolbar.append(script);
    }
    if (tools.has("lists")) {
      const lists = group(label("lists", "Lists"));
      for (const [icon, command, key, fallback] of [["list-ordered", "insertOrderedList", "numbered", "Numbered list"], ["list", "insertUnorderedList", "bulleted", "Bulleted list"]]) {
        const each = button(icon, label(key, fallback), { "aria-pressed": "false", "data-command": command });
        controls[command] = each;
        pressed.push(each);
        lists.append(each);
      }
      toolbar.append(lists);
    }
    if (tools.has("indent")) {
      const indent = group(label("indentation", "Indentation"));
      controls.outdent = button("indent-decrease", label("outdent", "Decrease indent"), { "data-command": "outdent" });
      controls.indent = button("indent-increase", label("indent", "Increase indent"), { "data-command": "indent" });
      indent.append(controls.outdent, controls.indent);
      toolbar.append(indent);
    }

    let imagePopover;
    let imageUrl;
    let imageAlt;
    if (tools.has("insert")) {
      controls.insert = make("button", "canon-button", { type: "button", popovertarget: `${id}-insert`, "aria-haspopup": "menu", "aria-expanded": "false" });
      controls.insert.append(iconOf("plus"), Object.assign(make("span", "canon-button-label"), { textContent: label("insert", "Insert") }));
      const menu = make("div", "canon-menu", { id: `${id}-insert`, popover: "", role: "menu", "aria-label": label("insert", "Insert") });
      const item = (name, value) => {
        const element = make("button", "canon-menu-item", { type: "button", role: "menuitem", "data-insert": value });
        element.append(Object.assign(make("span", "canon-menu-label"), { textContent: name }));
        return element;
      };
      menu.append(item(label("insert-hr", "Horizontal line"), "hr"), item(label("insert-image", "Image…"), "image"));
      toolbar.append(controls.insert, menu);
      imagePopover = popover("image", label("image-title", "Image"));
      const form = make("form", "canon-form");
      const [urlField, url] = textField("image-url", label("image-url", "Address"), "url");
      url.required = true;
      const [altField, alt] = textField("image-alt", label("image-alt", "Description"), "text", label("image-alt-hint", "What the image shows, for people who can't see it."));
      imageUrl = url;
      imageAlt = alt;
      form.append(urlField, altField, actionsRow(plainButton(label("insert", "Insert"), { type: "submit", "data-emphasis": "high" }), plainButton(label("cancel", "Cancel"), { "data-emphasis": "low", "data-intent": "neutral", popovertarget: `${id}-image`, popovertargetaction: "hide" })));
      imagePopover.append(form);
    }

    for (const element of [linkPopover, colorPopover, imagePopover]) if (element) toolbar.append(element);
    /* Buttons on their own in the toolbar: low and neutral (Toolbar). */
    for (const single of toolbar.querySelectorAll(":scope > .canon-button")) {
      single.dataset.emphasis ??= "low";
      single.dataset.intent ??= "neutral";
    }
    if (toolbar.children.length) box.prepend(toolbar);
    box.append(area);

    /* The textarea: hidden, still the value; its focus (the label, a failed
       check) goes to the area. */
    textarea.tabIndex = -1;
    textarea.setAttribute("aria-hidden", "true");
    textarea.addEventListener("focus", () => area.focus());

    const rtl = () => getComputedStyle(area).direction === "rtl";

    /* Value: the area, cleaned, written to the textarea. */
    let writing = false;
    let lastValue = textarea.value;
    const render = (html) => {
      area.innerHTML = richClean(html, rtl());
      markEmpty();
    };
    const markEmpty = () => {
      area.toggleAttribute("data-empty", !area.textContent.trim() && !area.querySelector("img, hr, li"));
    };
    const write = () => {
      markEmpty();
      const value = richClean(area.innerHTML, rtl());
      if (value === textarea.value) return;
      writing = true;
      textarea.value = value;
      lastValue = value;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      writing = false;
    };
    render(textarea.value);
    area.addEventListener("input", write);
    area.addEventListener("blur", () => {
      if (textarea.value !== lastChange) {
        lastChange = textarea.value;
        textarea.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    let lastChange = textarea.value;
    textarea.addEventListener("input", () => {
      if (!writing && textarea.value !== lastValue) {
        lastValue = textarea.value;
        render(textarea.value);
      }
    });
    textarea.form?.addEventListener("reset", () => setTimeout(() => {
      lastValue = textarea.value;
      render(textarea.value);
    }));

    /* The selection: kept while focus is in the toolbar or a popover, put
       back before each command. */
    let saved = null;
    const inArea = (node) => node && (node === area || area.contains(node));
    document.addEventListener("selectionchange", () => {
      const selection = getSelection();
      if (selection.rangeCount && inArea(selection.anchorNode)) {
        saved = selection.getRangeAt(0).cloneRange();
        syncState();
      }
    });
    const restore = () => {
      area.focus({ preventScroll: true });
      if (!saved) return;
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(saved);
    };
    const run = (command, value = null) => {
      restore();
      document.execCommand("styleWithCSS", false, false);
      document.execCommand("defaultParagraphSeparator", false, "p");
      document.execCommand(command, false, value);
      write();
      syncState();
      /* After a cancelled toggle has put its old state back. */
      setTimeout(syncState);
    };
    const closestIn = (selector) => {
      const node = saved?.commonAncestorContainer;
      const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
      const found = element?.closest(selector);
      return found && area.contains(found) ? found : null;
    };

    /* The toolbar follows the selection. */
    const syncState = () => {
      if (!saved) return;
      const state = (command) => {
        try {
          return document.queryCommandState(command);
        } catch {
          return false;
        }
      };
      for (const command of ["bold", "italic", "underline", "strikeThrough", "subscript", "superscript", "insertOrderedList", "insertUnorderedList"]) {
        controls[command]?.setAttribute("aria-pressed", String(state(command)));
      }
      if (controls["align-start"]) {
        const block = closestIn("p, h2, h3, h4, blockquote, li, pre");
        const align = block ? getComputedStyle(block).textAlign : "start";
        const side = align === "center" ? "align-center" : align === "justify" ? "align-justify"
          : (align === "right" && !rtl()) || (align === "left" && rtl()) || align === "end" ? "align-end" : "align-start";
        for (const key of ["align-start", "align-center", "align-end", "align-justify"]) controls[key].setAttribute("aria-pressed", String(key === side));
      }
      if (controls.block) {
        const block = closestIn("p, h2, h3, h4, blockquote, pre");
        controls.block.value = block ? block.tagName.toLowerCase() : "p";
      }
      const inList = Boolean(closestIn("li"));
      if (controls.indent) controls.indent.disabled = !inList;
      if (controls.outdent) controls.outdent.disabled = !inList;
    };

    /* Buttons: a press keeps the selection; toggles are set from it. */
    toolbar.addEventListener("mousedown", (event) => {
      if (event.target.closest(".canon-button")) event.preventDefault();
    });
    toolbar.addEventListener("click", (event) => {
      const target = event.target.closest("[data-command]");
      if (!target || !toolbar.contains(target)) return;
      event.preventDefault();
      const command = target.dataset.command;
      const fromKeyboard = event.detail === 0;
      if (command.startsWith("align-")) {
        const physical = { "align-start": rtl() ? "justifyRight" : "justifyLeft", "align-end": rtl() ? "justifyLeft" : "justifyRight", "align-center": "justifyCenter", "align-justify": "justifyFull" };
        run(physical[command]);
      } else run(command);
      if (fromKeyboard) target.focus();
    });
    controls.undo?.addEventListener("click", () => run("undo"));
    controls.redo?.addEventListener("click", () => run("redo"));
    controls.block?.addEventListener("change", () => run("formatBlock", `<${controls.block.value}>`));

    /* Link. */
    const openLink = () => {
      if (!linkPopover) return;
      const link = closestIn("a");
      linkUrl.value = link?.getAttribute("href") ?? "";
      linkNewTab.checked = link?.getAttribute("target") === "_blank";
      linkRemove.hidden = !link;
      if (!linkPopover.matches(":popover-open")) controls.link.click();
    };
    if (linkPopover) {
      linkPopover.addEventListener("beforetoggle", (event) => {
        if (event.newState !== "open") return;
        const link = closestIn("a");
        linkUrl.value = link?.getAttribute("href") ?? "";
        linkNewTab.checked = link?.getAttribute("target") === "_blank";
        linkRemove.hidden = !link;
      });
      linkPopover.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault();
        const href = safeUrl(linkUrl.value);
        const existing = closestIn("a");
        linkPopover.hidePopover();
        restore();
        if (existing) {
          const range = document.createRange();
          range.selectNodeContents(existing);
          getSelection().removeAllRanges();
          getSelection().addRange(range);
          saved = range.cloneRange();
        }
        if (!href) {
          run("unlink");
          return;
        }
        if (getSelection().isCollapsed) {
          const anchor = document.createElement("a");
          anchor.href = href;
          anchor.textContent = href;
          run("insertHTML", anchor.outerHTML);
        } else run("createLink", href);
        const link = closestIn("a") ?? [...area.querySelectorAll("a")].find((each) => each.getAttribute("href") === href);
        if (link) {
          if (linkNewTab.checked) {
            link.target = "_blank";
            link.rel = "noopener";
          } else {
            link.removeAttribute("target");
            link.removeAttribute("rel");
          }
          write();
        }
      });
      linkRemove.addEventListener("click", () => {
        const existing = closestIn("a");
        linkPopover.hidePopover();
        restore();
        if (existing) {
          const range = document.createRange();
          range.selectNodeContents(existing);
          getSelection().removeAllRanges();
          getSelection().addRange(range);
        }
        run("unlink");
      });
    }

    /* Color. */
    if (colorPopover) {
      colorPopover.addEventListener("change", (event) => {
        if (!event.target.matches("input[type='radio']")) return;
        colorPopover.hidePopover();
        run("foreColor", event.target.value);
      });
      colorPopover.querySelector("[data-color]").addEventListener("click", () => {
        colorPopover.hidePopover();
        run("foreColor", "inherit");
      });
    }

    /* Insert. */
    if (controls.insert) {
      toolbar.querySelector(`#${CSS.escape(`${id}-insert`)}`).addEventListener("click", (event) => {
        const item = event.target.closest("[data-insert]");
        if (!item) return;
        if (item.dataset.insert === "hr") {
          setTimeout(() => run("insertHorizontalRule"));
          return;
        }
        imageUrl.value = "";
        imageAlt.value = "";
        setTimeout(() => {
          try {
            imagePopover.showPopover({ source: controls.insert });
          } catch {
            imagePopover.showPopover();
          }
        });
      });
      imagePopover.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault();
        const src = safeUrl(imageUrl.value, true);
        if (!src) return;
        imagePopover.hidePopover();
        const image = document.createElement("img");
        image.src = src;
        image.alt = imageAlt.value.trim();
        run("insertHTML", image.outerHTML);
      });
    }

    /* Keys and paste. */
    area.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "k" && linkPopover) {
        event.preventDefault();
        openLink();
      }
    });
    area.addEventListener("paste", (event) => {
      const data = event.clipboardData;
      if (!data) return;
      event.preventDefault();
      const html = data.getData("text/html");
      if (html) run("insertHTML", richClean(html, rtl()));
      else run("insertText", data.getData("text/plain"));
    });
    area.addEventListener("focus", () => {
      if (area.innerHTML.trim() === "") {
        area.innerHTML = "<p><br></p>";
        const range = document.createRange();
        range.setStart(area.firstChild, 0);
        getSelection().removeAllRanges();
        getSelection().addRange(range);
      }
    });

    /* Disabled and read-only, described, invalid, required: the textarea's. */
    const mirror = () => {
      const off = textarea.disabled || textarea.readOnly;
      area.setAttribute("contenteditable", off ? "false" : "true");
      area.toggleAttribute("aria-disabled", textarea.disabled);
      if (textarea.disabled) area.setAttribute("aria-disabled", "true");
      area.toggleAttribute("aria-readonly", textarea.readOnly);
      if (textarea.readOnly) area.setAttribute("aria-readonly", "true");
      area.tabIndex = textarea.disabled ? -1 : 0;
      for (const name of ["aria-describedby", "aria-invalid"]) {
        if (textarea.hasAttribute(name)) area.setAttribute(name, textarea.getAttribute(name));
        else area.removeAttribute(name);
      }
      if (textarea.required) area.setAttribute("aria-required", "true");
      else area.removeAttribute("aria-required");
      for (const control of toolbar.querySelectorAll("button, select")) {
        if (control.closest("[popover]")) continue;
        control.disabled = off;
      }
      if (!off) syncState();
    };
    new MutationObserver(mirror).observe(textarea, { attributes: true, attributeFilter: ["disabled", "readonly", "required", "aria-describedby", "aria-invalid"] });
    mirror();
  };

  const setUpRichs = (root) => {
    const found = [...(root.matches?.(".canon-textarea[data-rich]") ? [root] : []), ...(root.querySelectorAll?.(".canon-textarea[data-rich]") ?? [])];
    for (const box of found) setUpRich(box);
  };

  /* ------------------------------------------------------------------ */
  /* Menu                                                                */
  /*                                                                     */
  /* .canon-menu is a popover (role="menu") a button opens with          */
  /* popovertarget; the browser opens, closes and anchors it. canon.js   */
  /* adds the keyboard (arrows, Home / End, typing a label's start,      */
  /* Right / Left for submenus, Tab closes), focus (the first item when  */
  /* opened from the keyboard, the menu itself from a pointer), the     */
  /* pointer (hover moves the keyboard's place and opens submenus after  */
  /* a moment), checks (menuitemcheckbox flips aria-checked, a           */
  /* menuitemradio is the one checked in its group) and closing the      */
  /* whole menu after a choice, unless the click is cancelled. A menu    */
  /* opened by a menu item is a submenu (data-submenu: it opens beside   */
  /* the item); a Menubar's menus get data-menubar, a Split Button's     */
  /* data-split-button. data-contextmenu="<menu id>" on a region opens   */
  /* that menu at the pointer (or under the focused element, from the    */
  /* keyboard). Triggers get aria-expanded.                              */
  /* ------------------------------------------------------------------ */

  const menuItemSelector = "[role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio']";
  const menus = new WeakSet();
  const menuReturn = new WeakMap();
  let menuOpening = null;

  const menuOf = (element) => element.closest(".canon-menu");
  const itemsOf = (menu) =>
    [...menu.querySelectorAll(menuItemSelector)].filter((item) => menuOf(item) === menu && !item.closest("[hidden]"));
  const usableItem = (item) => !item.disabled && item.getAttribute("aria-disabled") !== "true";
  /* Several triggers can share one menu (a row's actions in every row):
     its invoker is the one that opened it (the toggle's source, or the
     trigger last clicked), else the first on the page. */
  const openedBy = new WeakMap();
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest?.("[popovertarget]");
    const menu = trigger && document.getElementById(trigger.getAttribute("popovertarget"));
    if (menu?.matches(".canon-menu")) openedBy.set(menu, trigger);
  }, true);
  const invokerOf = (menu) =>
    openedBy.get(menu)?.isConnected ? openedBy.get(menu)
      : menu.id ? document.querySelector(`[popovertarget="${CSS.escape(menu.id)}"]`) : null;
  const parentMenuOf = (menu) => {
    const invoker = invokerOf(menu);
    return invoker && menuOf(invoker) ? menuOf(invoker) : null;
  };
  const rootMenuOf = (menu) => {
    let root = menu;
    for (let parent = parentMenuOf(root); parent; parent = parentMenuOf(root)) root = parent;
    return root;
  };
  const isOpen = (menu) => menu.matches(":popover-open");
  /* Focus an item and keep it in view in a menu that scrolls. */
  const focusItem = (item) => {
    if (!item) return;
    item.focus({ preventScroll: true });
    const menu = menuOf(item);
    if (!menu) return;
    const box = menu.getBoundingClientRect();
    const at = item.getBoundingClientRect();
    const inset = parseFloat(getComputedStyle(menu).paddingBlockStart) + menu.clientTop;
    if (at.top < box.top + inset) menu.scrollTop -= box.top + inset - at.top;
    else if (at.bottom > box.bottom - inset) menu.scrollTop += at.bottom - (box.bottom - inset);
  };
  const forwardKey = (menu) => (getComputedStyle(menu).direction === "rtl" ? "ArrowLeft" : "ArrowRight");
  const backKey = (menu) => (getComputedStyle(menu).direction === "rtl" ? "ArrowRight" : "ArrowLeft");

  /* Close the whole menu, and put focus back where it came from. */
  const closeMenu = (menu) => {
    const root = rootMenuOf(menu);
    const back = menuReturn.get(root) ?? invokerOf(root);
    if (isOpen(root)) root.hidePopover();
    if (back?.isConnected) back.focus({ preventScroll: true });
  };

  /* Open an item's submenu (a click keeps the browser's anchor and
     nesting), then put the keyboard in it or leave it on the item. */
  const openSubmenu = (item, focus) => {
    const submenu = item.popoverTargetElement;
    if (!submenu) return;
    if (isOpen(submenu)) {
      if (focus) focusItem(itemsOf(submenu).filter(usableItem)[0]);
      return;
    }
    menuOpening = focus ? "first" : "stay";
    item.click();
  };

  const closeSubmenusOf = (menu) => {
    for (const item of itemsOf(menu)) {
      const submenu = item.popoverTargetElement;
      if (submenu && isOpen(submenu)) submenu.hidePopover();
    }
  };

  const setUpMenu = (menu) => {
    if (menus.has(menu)) return;
    menus.add(menu);
    if (!menu.hasAttribute("tabindex")) menu.tabIndex = -1;
    for (const item of itemsOf(menu)) item.tabIndex = -1;

    let typed = "";
    let typedAt = 0;
    let hoverTimer;

    menu.addEventListener("beforetoggle", (event) => {
      if (event.newState !== "open") return;
      if (event.source) openedBy.set(menu, event.source);
      const invoker = invokerOf(menu);
      if (invoker) {
        menu.toggleAttribute("data-submenu", Boolean(menuOf(invoker)));
        menu.toggleAttribute("data-menubar", Boolean(invoker.closest(".canon-menubar")));
        menu.toggleAttribute("data-split-button", invoker.parentElement?.matches(".canon-split-button") ?? false);
      }
      for (const item of itemsOf(menu)) item.tabIndex = -1;
    });

    menu.addEventListener("toggle", (event) => {
      const invoker = invokerOf(menu);
      if (event.newState === "open") invoker?.setAttribute("aria-expanded", "true");
      else if (menu.id) for (const trigger of document.querySelectorAll(`[popovertarget="${CSS.escape(menu.id)}"]`)) trigger.setAttribute("aria-expanded", "false");
      /* A manual popover (always open, as on a reference page) is left alone. */
      if (menu.popover === "manual") return;
      if (event.newState === "open") {
        /* Cut short where it opened (a long menu scrolls in the room it
           has, so the browser never tries the other side): open towards
           the side with more room. */
        menu.style.positionArea = "";
        if (invoker && menu.scrollHeight > menu.clientHeight + 1) {
          const at = invoker.getBoundingClientRect();
          const submenu = menu.hasAttribute("data-submenu");
          const below = innerHeight - (submenu ? at.top : at.bottom);
          const above = submenu ? at.bottom : at.top;
          if (above > below) menu.style.positionArea = submenu ? "self-inline-end span-self-block-start" : "self-block-start span-self-inline-end";
        }
        const mode = menuOpening ?? (lastInput === "keyboard" ? "first" : "menu");
        menuOpening = null;
        const items = itemsOf(menu).filter(usableItem);
        if (mode === "first") focusItem(items[0]);
        else if (mode === "last") focusItem(items.at(-1));
        else if (mode === "menu") menu.focus({ preventScroll: true });
      } else {
        clearTimeout(hoverTimer);
        const back = menuReturn.get(menu);
        menuReturn.delete(menu);
        if (back?.isConnected && (menu.contains(document.activeElement) || document.activeElement === document.body)) {
          back.focus({ preventScroll: true });
        }
      }
    });

    menu.addEventListener("keydown", (event) => {
      if (event.target !== menu && menuOf(event.target) !== menu) return;
      const items = itemsOf(menu).filter(usableItem);
      const at = items.indexOf(document.activeElement);
      const go = (index) => focusItem(items.at(index % items.length));
      const item = document.activeElement?.closest?.(menuItemSelector);
      let handled = true;
      if (event.key === "ArrowDown") go(at + 1);
      else if (event.key === "ArrowUp") go(at < 0 ? -1 : at - 1);
      else if (event.key === "Home" || event.key === "PageUp") go(0);
      else if (event.key === "End" || event.key === "PageDown") go(-1);
      else if (event.key === forwardKey(menu) && item?.popoverTargetElement) openSubmenu(item, true);
      else if (event.key === backKey(menu) && parentMenuOf(menu)) {
        const invoker = invokerOf(menu);
        menu.hidePopover();
        invoker?.focus({ preventScroll: true });
      } else if ((event.key === forwardKey(menu) || event.key === backKey(menu)) && invokerOf(rootMenuOf(menu))?.closest(".canon-menubar")) {
        /* In a menubar's menu, across to the next menu. */
        const from = invokerOf(rootMenuOf(menu));
        moveMenubar(from.closest(".canon-menubar"), from, event.key === forwardKey(menu) ? 1 : -1, true);
      } else if (event.key === "Tab") {
        closeMenu(menu);
        handled = false;
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const now = Date.now();
        typed = (now - typedAt > 600 ? "" : typed) + event.key.toLowerCase();
        typedAt = now;
        const label = (each) => (each.querySelector(".canon-menu-label") ?? each).textContent.trim().toLowerCase();
        const start = typed.length === 1 ? at + 1 : Math.max(at, 0);
        const ordered = [...items.slice(start), ...items.slice(0, start)];
        focusItem(ordered.find((each) => label(each).startsWith(typed)));
        if (event.key === " " && typed === " ") handled = false;
      } else handled = false;
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    });

    /* The pointer moves the keyboard's place; resting on an item with a
       submenu opens it, on another item closes the open one. */
    menu.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const item = event.target.closest(menuItemSelector);
      if (!item || menuOf(item) !== menu) return;
      if (!usableItem(item)) {
        if (document.activeElement !== menu) menu.focus({ preventScroll: true });
        return;
      }
      if (document.activeElement === item) return;
      item.focus({ preventScroll: true });
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        if (document.activeElement !== item) return;
        if (item.popoverTargetElement) openSubmenu(item, false);
        else closeSubmenusOf(menu);
      }, 150);
    });
    menu.addEventListener("pointerleave", (event) => {
      clearTimeout(hoverTimer);
      const item = document.activeElement?.closest?.(menuItemSelector);
      if (item && menuOf(item) === menu && !(item.popoverTargetElement && isOpen(item.popoverTargetElement)) && event.pointerType !== "touch") {
        menu.focus({ preventScroll: true });
      }
    });
    /* Reaching a submenu keeps it open. */
    menu.addEventListener("pointerenter", () => {
      const parent = parentMenuOf(menu);
      if (parent) parent.dispatchEvent(new CustomEvent("canon-menu-hold"));
    });
    menu.addEventListener("canon-menu-hold", () => clearTimeout(hoverTimer));

    /* Checks change before the click's listeners run (they read the new
       state); after them, the menu closes unless the click was cancelled. */
    menu.addEventListener("click", (event) => {
      const item = event.target.closest(menuItemSelector);
      if (!item || menuOf(item) !== menu) return;
      if (!usableItem(item)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      const role = item.getAttribute("role");
      if (role === "menuitemcheckbox") item.setAttribute("aria-checked", String(item.getAttribute("aria-checked") !== "true"));
      else if (role === "menuitemradio") {
        const scope = item.closest("[role='group']") ?? menu;
        for (const each of scope.querySelectorAll("[role='menuitemradio']")) {
          if (menuOf(each) === menu) each.setAttribute("aria-checked", String(each === item));
        }
      }
    }, true);
    menu.addEventListener("click", (event) => {
      const item = event.target.closest(menuItemSelector);
      if (!item || menuOf(item) !== menu) return;
      const submenu = item.popoverTargetElement;
      if (submenu) {
        /* An item with a submenu opens it; it never closes it. */
        if (isOpen(submenu)) event.preventDefault();
        else if (!menuOpening) menuOpening = lastInput === "keyboard" ? "first" : "stay";
        return;
      }
      if (event.defaultPrevented) return;
      closeMenu(menu);
    });
  };

  /* Menubar: one tab stop (the last item focused); Right and Left move
     along it, Home and End to its ends; Down, Up, Enter and Space open an
     item's menu. While one of its menus is open, the pointer resting on
     another item opens that one, and Right or Left in a menu (where they
     don't open or close a submenu) moves to the next menu. */
  const menubars = new WeakSet();
  const menubarItems = (bar) =>
    [...bar.querySelectorAll(".canon-menubar-item")].filter((item) => item.closest(".canon-menubar") === bar && !item.hidden);

  const moveMenubar = (bar, from, step, open) => {
    const list = menubarItems(bar).filter(usableItem);
    const next = list.at((list.indexOf(from) + step) % list.length);
    const current = from.popoverTargetElement;
    if (current && isOpen(current)) current.hidePopover();
    if (!next) return;
    next.focus({ preventScroll: true });
    if (open && next.popoverTargetElement) {
      menuOpening = "first";
      next.click();
    }
  };

  const setUpMenubar = (bar) => {
    if (menubars.has(bar)) return;
    menubars.add(bar);
    const stop = (item) => {
      for (const each of menubarItems(bar)) each.tabIndex = each === item ? 0 : -1;
    };
    stop(menubarItems(bar).find(usableItem) ?? menubarItems(bar)[0]);
    bar.addEventListener("focusin", (event) => {
      const item = event.target.closest(".canon-menubar-item");
      if (item) stop(item);
    });
    bar.addEventListener("keydown", (event) => {
      const item = event.target.closest(".canon-menubar-item");
      if (!item) return;
      const list = menubarItems(bar).filter(usableItem);
      const rtl = getComputedStyle(bar).direction === "rtl";
      let next;
      if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) next = list.at((list.indexOf(item) + 1) % list.length);
      else if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) next = list.at(list.indexOf(item) - 1);
      else if (event.key === "Home") next = list[0];
      else if (event.key === "End") next = list.at(-1);
      else return;
      event.preventDefault();
      next?.focus({ preventScroll: true });
    });
    bar.addEventListener("pointerover", (event) => {
      if (event.pointerType === "touch") return;
      const item = event.target.closest(".canon-menubar-item");
      if (!item || !usableItem(item) || !item.popoverTargetElement || isOpen(item.popoverTargetElement)) return;
      const open = menubarItems(bar).some((each) => each.popoverTargetElement && isOpen(each.popoverTargetElement));
      if (!open) return;
      item.focus({ preventScroll: true });
      menuOpening = "menu";
      item.click();
    });
  };

  const setUpMenubars = (root) => {
    const found = [...(root.matches?.(".canon-menubar") ? [root] : []), ...(root.querySelectorAll?.(".canon-menubar") ?? [])];
    for (const bar of found) setUpMenubar(bar);
  };

  const setUpMenus = (root) => {
    const found = [...(root.matches?.(".canon-menu") ? [root] : []), ...(root.querySelectorAll?.(".canon-menu") ?? [])];
    for (const menu of found) setUpMenu(menu);
  };

  /* Triggers: Down and Up open the menu at its first or last item. */
  document.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const trigger = event.target.closest?.("[aria-haspopup='menu'], [aria-haspopup='true']");
    const menu = trigger?.popoverTargetElement;
    if (!menu?.matches(".canon-menu") || menuOf(trigger)) return;
    event.preventDefault();
    const where = event.key === "ArrowDown" ? "first" : "last";
    if (isOpen(menu)) {
      const items = itemsOf(menu).filter(usableItem);
      focusItem(where === "first" ? items[0] : items.at(-1));
    } else {
      menuOpening = where;
      trigger.click();
    }
  });

  /* Context menus: at the pointer, kept inside the window. Where the menu
     event comes while the button is down (macOS), the menu opens once it
     is released: a popover opened in between would take the release for
     a click outside and close. */
  let pointerDown = false;
  document.addEventListener("pointerdown", () => { pointerDown = true; }, true);
  document.addEventListener("pointerup", () => { pointerDown = false; }, true);
  document.addEventListener("pointercancel", () => { pointerDown = false; }, true);
  document.addEventListener("contextmenu", (event) => {
    const region = event.target.closest?.("[data-contextmenu]");
    if (!region) return;
    const menu = document.getElementById(region.dataset.contextmenu);
    if (!menu?.matches(".canon-menu")) return;
    event.preventDefault();
    setUpMenu(menu);
    let x = event.clientX;
    let y = event.clientY;
    const fromKeyboard = lastInput === "keyboard" || (x === 0 && y === 0);
    if (fromKeyboard) {
      const box = event.target.getBoundingClientRect();
      x = box.left;
      y = box.bottom;
    }
    if (isOpen(menu)) menu.hidePopover();
    const back = document.activeElement;
    const open = () => {
      menuReturn.set(menu, back);
      menu.style.inset = "auto";
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
      menuOpening = fromKeyboard ? "first" : "menu";
      menu.showPopover();
      const box = menu.getBoundingClientRect();
      const margin = parseFloat(getComputedStyle(menu).marginTop) || 0;
      if (box.right > innerWidth) menu.style.left = `${Math.max(0, x - box.width)}px`;
      if (box.bottom > innerHeight) menu.style.top = `${Math.max(0, y - box.height - 2 * margin)}px`;
    };
    if (pointerDown && !fromKeyboard) document.addEventListener("pointerup", () => setTimeout(open), { once: true, capture: true });
    else open();
  });

  /* ------------------------------------------------------------------ */
  /* Avatar                                                              */
  /*                                                                     */
  /* - A photo that doesn't load: the avatar gets data-state="error" and */
  /*   the fallback shows instead of the browser's broken image. It      */
  /*   clears again if a new src loads. One still loading when canon.js */
  /*   starts gets data-state="loading" until it comes.                  */
  /* - A count's width, as --canon-count-inline-size on the avatar, so   */
  /*   themes can cut a gap the size of "12" or "99+".                   */
  /* - The seed's slot (avatars and tags): the theme says how many       */
  /*   colors it has (--canon-seed-colors); data-seed-slot is the seed   */
  /*   modulo that, for browsers that can't do it in CSS.                */
  /* ------------------------------------------------------------------ */

  const avatarImage = "img.canon-avatar-image";

  const markAvatar = (img) => {
    const avatar = img.closest(".canon-avatar");
    if (!avatar) return;
    const state = !img.complete ? "loading" : img.naturalWidth === 0 ? "error" : "";
    if (state) avatar.dataset.state = state;
    else if (["error", "loading"].includes(avatar.dataset.state)) delete avatar.dataset.state;
  };

  const countSizes = new ResizeObserver((entries) => {
    for (const { target } of entries) {
      target.parentElement?.style.setProperty("--canon-count-inline-size", `${target.offsetWidth}px`);
    }
  });

  const setUpAvatars = (root) => {
    if (root.matches?.(avatarImage)) markAvatar(root);
    for (const img of root.querySelectorAll?.(avatarImage) ?? []) markAvatar(img);
    const found = root.querySelectorAll?.(seeded) ?? [];
    for (const element of root.matches?.(seeded) ? [root, ...found] : found) {
      seedSlot(element);
      const count = element.querySelector(":scope.canon-avatar > .canon-count");
      if (count) countSizes.observe(count);
    }
  };

  document.addEventListener("error", (event) => {
    if (event.target.matches?.(avatarImage)) markAvatar(event.target);
  }, true);
  document.addEventListener("load", (event) => {
    if (event.target.matches?.(avatarImage)) markAvatar(event.target);
  }, true);

  /* ------------------------------------------------------------------ */
  /* Avatar spotlight                                                    */
  /*                                                                     */
  /* data-spotlight on an avatar group (or an avatar): the avatar under  */
  /* the pointer or with focus shows its name in a Tooltip: the author's */
  /* (the avatar's interestfor), else one made from its name. Avatars    */
  /* that aren't links or buttons take focus so keyboards reach them:   */
  /* one Tab stop for a group, the arrow keys (Home, End) between them;  */
  /* each is an image named by its person.                               */
  /* ------------------------------------------------------------------ */

  const spotlights = new WeakSet();
  let spotlightCount = 0;
  const avatarName = (avatar) =>
    avatar.querySelector(":scope > .canon-avatar-fallback[aria-label]")?.getAttribute("aria-label")
    || avatar.getAttribute("aria-label")
    || avatar.querySelector(":scope > img.canon-avatar-image[alt]:not([alt=''])")?.alt
    || avatar.querySelector(":scope > .canon-avatar-fallback")?.textContent.trim()
    || "";

  const setUpSpotlight = (host) => {
    if (spotlights.has(host)) return;
    spotlights.add(host);
    const group = host.matches(".canon-avatar-group");
    const avatars = () => (group ? [...host.children].filter((child) => child.matches(".canon-avatar")) : [host]);
    const id = `canon-spotlight-${++spotlightCount}`;
    let made = null;
    let shown = null;
    let showTimer = null;
    let hideTimer = null;

    /* Avatars that aren't links or buttons: focusable images. */
    const sync = () => {
      const list = avatars();
      const still = list.filter((avatar) => !avatar.matches("a[href], button"));
      const current = still.find((avatar) => avatar.tabIndex === 0) ?? still[0];
      for (const avatar of still) {
        avatar.tabIndex = avatar === current ? 0 : -1;
        avatar.setAttribute("role", "img");
        /* As an image its parts aren't read: the status, badge and count
           join its name ("Ada Lovelace, Online"). */
        if (!avatar.hasAttribute("aria-label")) {
          const extras = [...avatar.querySelectorAll(":scope > :is(.canon-avatar-status, .canon-avatar-badge, .canon-count)")].map((part) => part.textContent.trim()).filter(Boolean);
          const name = [avatarName(avatar), ...extras].filter(Boolean).join(", ");
          if (name) avatar.setAttribute("aria-label", name);
        }
      }
      for (const avatar of list) {
        const own = avatar.getAttribute("interestfor") && document.getElementById(avatar.getAttribute("interestfor"));
        if (own && !avatar.matches("a[href], button") && !avatar.getAttribute("aria-describedby")?.split(" ").includes(own.id)) {
          avatar.setAttribute("aria-describedby", [avatar.getAttribute("aria-describedby"), own.id].filter(Boolean).join(" "));
        }
      }
    };

    const tipFor = (avatar) => {
      const own = avatar.getAttribute("interestfor") && document.getElementById(avatar.getAttribute("interestfor"));
      if (own) return own;
      if (!made) {
        made = fromMarkup(`<div class="canon-tooltip" popover="manual" aria-hidden="true"></div>`);
        made.id = `${id}-tip`;
        host.after(made);
      }
      made.textContent = avatarName(avatar);
      return made.textContent ? made : null;
    };
    const hide = () => {
      clearTimeout(showTimer);
      if (shown?.matches(":popover-open")) shown.hidePopover();
      shown = null;
    };
    const show = (avatar) => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      /* Links and buttons with their own tooltip: the browser shows it. */
      if (avatar.matches("a[href], button") && avatar.hasAttribute("interestfor")) return hide();
      const tip = tipFor(avatar);
      if (shown && shown !== tip) hide();
      if (!tip) return;
      /* The name moves to this avatar (others may hold more names). */
      const name = `--${id}`;
      const namesOf = (each) => (each.style.anchorName && each.style.anchorName !== "none" ? each.style.anchorName.split(/\s*,\s*/) : []);
      for (const each of avatars()) {
        if (each === avatar || !namesOf(each).includes(name)) continue;
        each.style.anchorName = namesOf(each).filter((each) => each !== name).join(", ");
      }
      if (!namesOf(avatar).includes(name)) avatar.style.anchorName = [...namesOf(avatar), name].join(", ");
      tip.style.positionAnchor = name;
      tip.style.setProperty("--canon-tooltip-anchor", name);
      if (tip.matches(":popover-open")) tip.hidePopover();
      try { tip.showPopover({ source: avatar }); } catch { tip.showPopover(); }
      shown = tip;
    };
    const avatarOf = (target) => {
      const avatar = target.closest?.(".canon-avatar");
      return avatar && avatars().includes(avatar) ? avatar : null;
    };

    /* The pointer: after a short wait for the first; at once while one shows. */
    host.addEventListener("pointerover", (event) => {
      const avatar = avatarOf(event.target);
      if (!avatar || event.pointerType === "touch") return;
      clearTimeout(hideTimer);
      if (shown) show(avatar);
      else {
        clearTimeout(showTimer);
        showTimer = setTimeout(() => show(avatar), 300);
      }
    });
    host.addEventListener("pointerleave", () => {
      clearTimeout(showTimer);
      hideTimer = setTimeout(() => { if (!host.contains(document.activeElement) || !document.activeElement.matches(":focus-visible")) hide(); }, 100);
    });
    host.addEventListener("focusin", (event) => {
      const avatar = avatarOf(event.target);
      if (avatar && avatar.matches(":focus-visible")) show(avatar);
    });
    host.addEventListener("focusout", (event) => {
      if (!host.contains(event.relatedTarget)) hide();
    });
    host.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && shown) {
        hide();
        return;
      }
      const avatar = avatarOf(event.target);
      if (!group || !avatar || avatar.matches("a[href], button")) return;
      const list = avatars().filter((each) => !each.matches("a[href], button"));
      const rtl = getComputedStyle(host).direction === "rtl";
      const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 }[event.key];
      const index = list.indexOf(avatar);
      const next = event.key === "Home" ? list[0] : event.key === "End" ? list.at(-1) : step ? list[index + step] : null;
      if (!next) return;
      event.preventDefault();
      avatar.tabIndex = -1;
      next.tabIndex = 0;
      next.focus();
    });

    if (group) new MutationObserver(sync).observe(host, { childList: true });
    sync();
  };

  const setUpSpotlights = (root) => {
    const found = [...(root.matches?.("[data-spotlight]") ? [root] : []), ...(root.querySelectorAll?.("[data-spotlight]") ?? [])];
    for (const host of found) if (host.matches(".canon-avatar-group, .canon-avatar")) setUpSpotlight(host);
  };

  /* ------------------------------------------------------------------ */
  /* Password                                                            */
  /*                                                                     */
  /* - Rules: a rule with data-rule is checked as people type ("met" or */
  /*   pending; after a failed submit, unmet ones are "error"), and an   */
  /*   unmet rule blocks submitting (setCustomValidity). The rules and   */
  /*   the meter are found through the input's aria-describedby.        */
  /* - Meter with data-score="rules": the share of rules met, 0–4, with */
  /*   its word (aria-valuetext, and a .canon-password-strength-label   */
  /*   right after it). Real strength needs a real scorer: that is the  */
  /*   app's.                                                            */
  /* - Rules with data-reveal="focus": collapsed (data-state) until the */
  /*   input has focus or a value, and again once every rule is met.    */
  /* - Caps Lock: data-state="caps-lock" on the input while it is on,   */
  /*   announced once.                                                   */
  /* - Confirmation: an input with data-match="<id>" must equal that    */
  /*   input; its box gets data-state="match" when it does.             */
  /* ------------------------------------------------------------------ */

  const passwordInput = ".canon-password > input";

  /* Show or hide a password. The button is a toggle: its label stays
     "Show password" and aria-pressed carries the state. */
  commands["--canon-toggle-password"] = (target, source) => {
    const show = target.type === "password";
    target.type = show ? "text" : "password";
    source.setAttribute("aria-pressed", String(show));
  };

  /* A strong random password: at least 16 characters (more if a rule asks),
     with every kind of character, from the browser's secure random source. */
  const generatePassword = (length) => {
    const sets = ["abcdefghijkmnopqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!#$%&*+-=?@^_"];
    const all = sets.join("");
    const random = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
    const chars = sets.map((set) => set[random(set.length)]);
    while (chars.length < length) chars.push(all[random(all.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = random(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join("");
  };

  commands["--canon-generate-password"] = (target, source) => {
    const rules = describedBy(target, ".canon-password-rules").flatMap((list) => [...list.querySelectorAll(".canon-password-rule[data-rule^='min-length:']")]);
    const length = Math.max(16, ...rules.map((rule) => Number(rule.dataset.rule.split(":")[1]) || 0));
    const value = generatePassword(length);
    const fill = (input) => {
      input.value = value;
      input.type = "text";
      input.closest(".canon-password")?.querySelector(":scope > [command='--canon-toggle-password']")?.setAttribute("aria-pressed", "true");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    fill(target);
    if (target.id) for (const confirm of document.querySelectorAll(`input[data-match="${CSS.escape(target.id)}"]`)) fill(confirm);
    target.focus();
    announce(text(source, "password-generated", "Password generated"));
  };

  const ruleChecks = {
    "min-length": (value, n) => [...value].length >= Number(n),
    digit: (value) => /\p{Nd}/u.test(value),
    lowercase: (value) => /\p{Ll}/u.test(value),
    uppercase: (value) => /\p{Lu}/u.test(value),
    symbol: (value) => /[^\p{L}\p{N}\s]/u.test(value),
    pattern: (value, source) => {
      try { return new RegExp(source, "u").test(value); } catch { return null; }
    },
  };

  const ruleMet = (rule, value) => {
    const [name, ...rest] = rule.dataset.rule.split(":");
    return ruleChecks[name]?.(value, rest.join(":")) ?? null;
  };

  const checkPassword = (input, submitted = false) => {
    const value = input.value;
    const lists = describedBy(input, ".canon-password-rules");
    let checked = 0;
    let met = 0;
    let hasError = false;
    for (const list of lists) {
      for (const rule of list.querySelectorAll(".canon-password-rule[data-rule]")) {
        const ok = ruleMet(rule, value);
        if (ok === null) continue;
        checked++;
        if (ok) {
          met++;
          rule.dataset.state = "met";
        } else if (submitted || rule.dataset.state === "error") {
          rule.dataset.state = "error";
          hasError = true;
        } else {
          delete rule.dataset.state;
        }
      }
    }
    const unmet = checked - met;

    for (const meter of describedBy(input, "meter.canon-password-strength[data-score='rules']")) {
      const score = value && checked ? Math.round((met / checked) * 4) : 0;
      meter.value = score;
      const word = score ? text(meter, `strength-${score}`, "") : "";
      if (word) meter.setAttribute("aria-valuetext", word);
      else meter.removeAttribute("aria-valuetext");
      const label = meter.nextElementSibling;
      if (label?.classList.contains("canon-password-strength-label")) label.textContent = word;
    }

    const focused = document.activeElement === input;
    for (const list of lists) {
      if (list.dataset.reveal !== "focus") continue;
      const open = checked > 0 && unmet > 0 && (focused || value !== "" || hasError);
      if (open) delete list.dataset.state;
      else list.dataset.state = "collapsed";
    }

    /* Empty is the browser's to report (required), not the rules'. */
    return unmet && value ? text(input, "password-rules-unmet", "The password doesn't meet every rule.") : "";
  };

  const checkMatch = (confirm) => {
    const original = document.getElementById(confirm.dataset.match);
    const box = confirm.closest(".canon-password");
    if (!original) return "";
    const same = confirm.value !== "" && confirm.value === original.value;
    if (box) {
      if (same) box.dataset.state = "match";
      else if (box.dataset.state === "match") delete box.dataset.state;
    }
    return confirm.value && !same ? text(confirm, "passwords-differ", "The passwords don't match.") : "";
  };

  /* One input's validity, from its rules and its match, set once. */
  const checkInput = (input, submitted = false) => {
    const rules = checkPassword(input, submitted);
    const match = input.dataset.match ? checkMatch(input) : "";
    input.setCustomValidity(rules || match);
  };

  const updatePassword = (input) => {
    if (!input.matches(passwordInput)) return;
    checkInput(input);
    if (input.id) for (const confirm of document.querySelectorAll(`input[data-match="${CSS.escape(input.id)}"]`)) checkInput(confirm);
  };

  const setUpPasswords = (root) => {
    if (root.matches?.(passwordInput)) updatePassword(root);
    for (const input of root.querySelectorAll?.(passwordInput) ?? []) updatePassword(input);
  };

  document.addEventListener("input", (event) => updatePassword(event.target), true);
  document.addEventListener("focusin", (event) => updatePassword(event.target), true);
  document.addEventListener("focusout", (event) => {
    if (!event.target.matches?.(passwordInput)) return;
    delete event.target.dataset.state;
    queueMicrotask(() => updatePassword(event.target));
  }, true);
  document.addEventListener("invalid", (event) => {
    if (event.target.matches?.(passwordInput)) checkInput(event.target, true);
  }, true);

  const capsLock = (event) => {
    const input = event.target;
    if (!input.matches?.(passwordInput) || typeof event.getModifierState !== "function") return;
    const on = event.getModifierState("CapsLock");
    if (on === (input.dataset.state === "caps-lock")) return;
    if (on) {
      input.dataset.state = "caps-lock";
      announce(text(input, "caps-lock", "Caps Lock is on"));
    } else {
      delete input.dataset.state;
    }
  };
  document.addEventListener("keydown", capsLock, true);
  document.addEventListener("keyup", capsLock, true);

  /* ------------------------------------------------------------------ */
  /* Field: character counter                                            */
  /*                                                                     */
  /* A field's .canon-field-counter shows how much of the control's      */
  /* maxlength is used ("12 / 280"). With a counter, the limit is soft:  */
  /* canon.js moves maxlength to data-maxlength, so people can type and  */
  /* paste past it (without canon.js it stays a hard limit). Past it the */
  /* control is invalid at once: the box shows its error and the field's */
  /* message says so, until it is shortened. The characters that are too */
  /* many are marked in the control: a copy of the text                  */
  /* (.canon-limit-mirror) is drawn behind it, with the excess in a      */
  /* <mark>, while the control's own text turns transparent              */
  /* (data-state="over"). Screen readers read "268 characters left" in   */
  /* the counter, and hear it after a pause in typing once the last      */
  /* tenth of the limit is reached. The theme sees data-state="near" and */
  /* "over" on the counter. Without a counter, maxlength is native.      */
  /* ------------------------------------------------------------------ */

  const countedControl = ".canon-field > :is(.canon-text-input, .canon-textarea) > :is(input, textarea)";
  const mirrors = new WeakMap();

  /* What decides where the text falls, copied from the control. */
  const mirroredStyles = ["font-family", "font-size", "font-weight", "font-style", "font-stretch", "font-feature-settings",
    "font-variation-settings", "font-kerning", "font-variant-numeric", "line-height", "letter-spacing", "word-spacing",
    "text-indent", "text-transform", "text-align", "tab-size", "direction", "overflow-wrap", "word-break",
    "padding-top", "padding-right", "padding-bottom", "padding-left"];

  const placeMirror = (control, mirror) => {
    const style = getComputedStyle(control);
    for (const name of mirroredStyles) mirror.style.setProperty(name, style.getPropertyValue(name));
    mirror.style.whiteSpace = control.matches("textarea") ? (control.getAttribute("wrap") === "off" ? "pre" : "pre-wrap") : "pre";
    mirror.style.left = `${control.offsetLeft + control.clientLeft}px`;
    mirror.style.top = `${control.offsetTop + control.clientTop}px`;
    /* Exact sizes (clientWidth rounds, and a fraction of a pixel moves a
       line break), less any scrollbar. */
    const rect = control.getBoundingClientRect();
    const scrollbarX = Math.round(rect.width - control.clientLeft * 2 - control.clientWidth);
    const scrollbarY = Math.round(rect.height - control.clientTop * 2 - control.clientHeight);
    const px = (name) => parseFloat(style.getPropertyValue(name)) || 0;
    mirror.style.width = `${rect.width - control.clientLeft * 2 - scrollbarX - px("padding-left") - px("padding-right")}px`;
    mirror.style.height = `${rect.height - control.clientTop * 2 - scrollbarY - px("padding-top") - px("padding-bottom")}px`;
    mirror.scrollTop = control.scrollTop;
    mirror.scrollLeft = control.scrollLeft;
  };

  const markExcess = (control, limit) => {
    let mirror = mirrors.get(control);
    const over = limit > 0 && control.value.length > limit;
    if (!over) {
      if (control.dataset.state === "over") delete control.dataset.state;
      if (mirror) mirror.hidden = true;
      return;
    }
    if (!mirror) {
      mirror = document.createElement("div");
      mirror.className = "canon-limit-mirror";
      mirror.setAttribute("aria-hidden", "true");
      control.before(mirror);
      mirrors.set(control, mirror);
      control.addEventListener("scroll", () => {
        mirror.scrollTop = control.scrollTop;
        mirror.scrollLeft = control.scrollLeft;
      });
      new ResizeObserver(() => { if (!mirror.hidden) placeMirror(control, mirror); }).observe(control);
    }
    const mark = document.createElement("mark");
    mark.className = "canon-limit-excess";
    mark.textContent = control.value.slice(limit);
    /* A trailing line break needs something after it to take up a line. */
    if (control.matches("textarea")) {
      mirror.replaceChildren(control.value.slice(0, limit), mark, "\u200b");
    } else {
      /* One line, centered like the input's own text. */
      const line = document.createElement("span");
      line.append(control.value.slice(0, limit), mark);
      mirror.replaceChildren(line);
    }
    mirror.hidden = false;
    control.dataset.state = "over";
    placeMirror(control, mirror);
  };
  const counterTimers = new WeakMap();
  const ownValidity = new WeakSet();

  /* The field's counter, if any; then the limit moves off maxlength (also
     when an app puts maxlength back). */
  const counterOf = (control) => control.closest(".canon-field")?.querySelector(":scope > .canon-field-counter");
  const limitOf = (control) => {
    if (control.hasAttribute("maxlength")) {
      control.dataset.maxlength = control.getAttribute("maxlength");
      control.removeAttribute("maxlength");
    }
    return Number.parseInt(control.dataset.maxlength, 10) || 0;
  };

  const updateCounter = (control, speak = false) => {
    const counter = counterOf(control);
    if (!counter) return;
    const max = limitOf(control);
    if (!max) return;
    const count = control.value.length;
    const left = max - count;
    /* Too long is wrong at once (the counter and the marked characters
       already say so), so the field's error shows now, not on leaving the
       field: the box's error state and the message. */
    markExcess(control, max);
    if (left < 0) {
      control.setCustomValidity(countText(control, "too-long", max));
      ownValidity.add(control);
      showValidation(control);
    } else if (ownValidity.has(control)) {
      control.setCustomValidity("");
      ownValidity.delete(control);
      if (control.validity.valid) clearValidation(control);
      else showValidation(control);
    }

    const near = left <= Math.max(1, Math.round(max / 10));
    if (left < 0) counter.dataset.state = "over";
    else if (near) counter.dataset.state = "near";
    else delete counter.dataset.state;
    const lang = langOf(counter);
    const number = (n) => {
      try { return new Intl.NumberFormat(lang).format(n); } catch { return String(n); }
    };
    const shown = document.createElement("span");
    shown.setAttribute("aria-hidden", "true");
    shown.textContent = fill(text(counter, "count", "{count} / {max}"), { count: number(count), max: number(max) });
    const spoken = document.createElement("span");
    spoken.className = "canon-visually-hidden";
    spoken.textContent = left < 0 ? countText(counter, "characters-over", -left) : countText(counter, "characters-left", left);
    counter.replaceChildren(shown, spoken);

    clearTimeout(counterTimers.get(control));
    if (speak && near) counterTimers.set(control, setTimeout(() => announce(spoken.textContent), 1000));
  };

  const setUpCounters = (root) => {
    if (root.matches?.(countedControl)) updateCounter(root);
    for (const control of root.querySelectorAll?.(countedControl) ?? []) updateCounter(control);
  };

  /* Before the validation listeners below, so a soft limit's message is
     current when they look. */
  document.addEventListener("input", (event) => {
    if (event.target.matches?.(countedControl)) updateCounter(event.target, true);
  }, true);
  document.addEventListener("reset", (event) => {
    setTimeout(() => setUpCounters(event.target));
  });

  /* ------------------------------------------------------------------ */
  /* Field: validation messages                                          */
  /*                                                                     */
  /* A field whose message is empty (the live region for client-side    */
  /* messages) shows the browser's validationMessage there, as a danger */
  /* message, with aria-invalid on the control, instead of the browser's*/
  /* bubble: on a failed submit (the first one gets focus), and on       */
  /* leaving a changed field that is still invalid. It updates as people */
  /* type and clears once the value is valid. Messages the author wrote  */
  /* are left alone.                                                     */
  /* ------------------------------------------------------------------ */

  const fieldControl = ".canon-field > :is(.canon-control, .canon-text-input, .canon-password, .canon-select, .canon-combobox, .canon-textarea, .canon-date) > :is(input, textarea, select)";

  const validationMessageOf = (control) => {
    if (!control.matches?.(fieldControl) || control.form?.noValidate) return null;
    const message = control.closest(".canon-field").querySelector(":scope > .canon-field-message");
    if (!message) return null;
    return message.dataset.state === "validation" || message.textContent.trim() === "" ? message : null;
  };

  const showValidation = (control) => {
    const message = validationMessageOf(control);
    if (!message) return false;
    if (message.textContent !== control.validationMessage) message.textContent = control.validationMessage;
    message.dataset.intent = "danger";
    message.dataset.state = "validation";
    control.setAttribute("aria-invalid", "true");
    return true;
  };

  const clearValidation = (control) => {
    const message = validationMessageOf(control);
    if (message?.dataset.state !== "validation") return;
    message.textContent = "";
    delete message.dataset.intent;
    delete message.dataset.state;
    control.removeAttribute("aria-invalid");
  };

  let focusingInvalid = false;
  document.addEventListener("invalid", (event) => {
    const control = event.target;
    if (!showValidation(control)) return;
    event.preventDefault();
    if (focusingInvalid) return;
    focusingInvalid = true;
    control.focus();
    setTimeout(() => { focusingInvalid = false; });
  }, true);

  document.addEventListener("change", (event) => {
    const control = event.target;
    if (!validationMessageOf(control)) return;
    if (control.validity.valid) clearValidation(control);
    else showValidation(control);
  }, true);

  /* Any input can change another control's validity (a confirmation), so
     every open message is checked again. */
  document.addEventListener("input", () => {
    for (const message of document.querySelectorAll(".canon-field > .canon-field-message[data-state='validation']")) {
      const control = message.parentElement.querySelector(fieldControl.replace(".canon-field > ", ":scope > "));
      if (!control) continue;
      if (control.validity.valid) clearValidation(control);
      else showValidation(control);
    }
  }, true);

  /* ------------------------------------------------------------------ */
  /* Switch state text                                                   */
  /*                                                                     */
  /* The words beside a switch aren't a label (a second label would add  */
  /* them to its name), so a click on them toggles the switch here.      */
  /* ------------------------------------------------------------------ */

  document.addEventListener("click", (event) => {
    const state = event.target.closest?.(".canon-choice > .canon-choice-state");
    const input = state?.parentElement.querySelector(":scope > input[role='switch']");
    if (!input || input.disabled) return;
    input.click();
    input.focus({ focusVisible: false });
  });

  /* ------------------------------------------------------------------ */
  /* A Select in a text input (a country code)                           */
  /*                                                                     */
  /* A styled select is as wide as its chosen option, so the value       */
  /* beside it would move when the choice changes. canon.js tries each   */
  /* option once and gives the box the widest one's width                */
  /* (--canon-select-min-inline-size).                                   */
  /* ------------------------------------------------------------------ */

  const segmentSelect = ".canon-text-input > .canon-select > select";
  const sizeSegment = (select) => {
    const box = select.parentElement;
    box.style.removeProperty("--canon-select-min-inline-size");
    const chosen = select.selectedIndex;
    let widest = 0;
    for (const option of select.options) {
      if (option.hidden) continue;
      select.selectedIndex = option.index;
      widest = Math.max(widest, box.getBoundingClientRect().width);
    }
    select.selectedIndex = chosen;
    if (widest) box.style.setProperty("--canon-select-min-inline-size", `${widest}px`);
  };
  const segmentsSized = new WeakSet();
  const setUpSegments = (root) => {
    const selects = root.matches?.(segmentSelect) ? [root] : [...(root.querySelectorAll?.(segmentSelect) ?? [])];
    for (const select of selects) {
      sizeSegment(select);
      if (segmentsSized.has(select)) continue;
      segmentsSized.add(select);
      /* Options changing, not <selectedcontent> mirroring the choice. */
      new MutationObserver((records) => {
        if (records.some((record) => !record.target.closest?.("selectedcontent") && !record.target.parentElement?.closest("selectedcontent"))) sizeSegment(select);
      }).observe(select, { childList: true, subtree: true, characterData: true });
      document.fonts?.ready.then(() => sizeSegment(select));
    }
  };

  /* ------------------------------------------------------------------ */
  /* Combobox                                                            */
  /*                                                                     */
  /* A <select> in .canon-combobox gets a box that opens a list. Search  */
  /* is optional: data-search="list" puts a field on top of the list,    */
  /* data-search="inline" makes the box itself the field. Without it,    */
  /* typing jumps to the option that starts with what was typed. The     */
  /* select stays the source of truth: its                               */
  /* options, value (submitted with the form), required, disabled,       */
  /* aria-invalid and aria-describedby are mirrored, and picking sets it */
  /* and fires input and change on it. Apps that change it in code fire  */
  /* change (or edit the options, which is seen). With multiple, the     */
  /* chosen values are tags with a remove button.                        */
  /*                                                                     */
  /* Options (the first two need data-search):                           */
  /*   data-creatable on the box    offers "Add …" for a new value; it   */
  /*                                becomes an <option> of the select,   */
  /*                                gone again once it isn't chosen      */
  /*   data-filter="none" on the box  the app filters: canon-search      */
  /*                                events (detail.query) on the select; */
  /*                                aria-busy="true" on it while loading */
  /*   data-tags="collapse" on the box  tags on one row, then "+N"       */
  /*   data-max on the select       at most that many values             */
  /*                                                                     */
  /* Free values (a tag input): several values, inline and creatable,   */
  /* with nothing to pick (only a placeholder and chosen values). No     */
  /* list opens: the field is a plain text field, Enter, a comma or      */
  /* leaving the box adds what was typed, and a paste with commas or    */
  /* lines adds each part. Once the app adds options, it is a combobox  */
  /* again (suggestions).                                                */
  /*                                                                     */
  /* Keyboard: on the box, the arrows or typing open the list; then Up,  */
  /* Down, Home and End move through the options (focus stays on the box */
  /* or in the search), Enter (or Space, without search) picks (several: */
  /* toggles, and the list stays open), Escape and Tab close. Inline,    */
  /* Escape also undoes typing and Backspace in an empty field removes   */
  /* the last value. The number of results is announced.                 */
  /* ------------------------------------------------------------------ */

  const comboboxSelect = ".canon-combobox > select";
  const comboboxes = new WeakSet();
  let comboboxCount = 0;

  /* Folded text, with the index of the original character behind each
     of its characters (folding can change the length). */
  const foldWithMap = (value) => {
    let folded = "";
    const at = [];
    for (let i = 0; i < value.length; i++) {
      const part = fold(value[i]);
      folded += part;
      for (let k = 0; k < part.length; k++) at.push(i);
    }
    return [folded, at];
  };

  const optionLabel = (option) =>
    (option.querySelector(".canon-option-label")?.textContent ?? option.label).trim();
  /* What the search looks in: the label and the description. */
  const optionSearchText = (option) => {
    const label = option.querySelector(".canon-option-label");
    if (!label) return option.label;
    return `${label.textContent} ${option.querySelector(".canon-option-description")?.textContent ?? ""}`;
  };

  /* The option's markup for the box or a tag: icon, avatar or dot, then
     the label. The description stays in the list. */
  const optionFace = (option) => {
    const parts = [];
    const lead = option.querySelector(":scope > :is(.canon-icon, .canon-avatar, .canon-tag-dot):first-child");
    if (lead) parts.push(lead.cloneNode(true));
    const label = document.createElement("span");
    label.textContent = optionLabel(option);
    parts.push(label);
    return parts;
  };

  /* Marks the first match in each piece of text (not in icons or
     avatars). */
  const highlight = (element, query) => {
    if (!query) return;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.parentElement.closest(".canon-avatar, .canon-icon")) nodes.push(walker.currentNode);
    }
    for (const node of nodes) {
      const [folded, at] = foldWithMap(node.data);
      const start = folded.indexOf(query);
      if (start < 0) continue;
      const range = document.createRange();
      range.setStart(node, at[start]);
      range.setEnd(node, at[start + query.length - 1] + 1);
      const mark = document.createElement("mark");
      mark.className = "canon-combobox-match";
      range.surroundContents(mark);
    }
  };

  const setUpCombobox = (select) => {
    if (comboboxes.has(select)) return;
    comboboxes.add(select);
    const box = select.parentElement;
    const id = `canon-combobox-${++comboboxCount}`;
    const multiple = select.multiple;
    const inline = box.dataset.search === "inline";
    const searchable = inline || box.dataset.search === "list";
    const make = (tag, className, attributes = {}) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
      return element;
    };
    const icon = (name) => make("span", "canon-icon", { "data-icon": name, "aria-hidden": "true" });

    /* Free values: nothing to pick, only a placeholder and chosen values
       (the theme sees the same: no unchosen, unhidden option). */
    const creatable = box.hasAttribute("data-creatable");
    const isFree = () => multiple && inline && creatable && box.dataset.filter !== "none"
      && [...select.options].every((option) => option.selected || option.hidden);

    /* Where people type: a field on top of the list, or the box. */
    const input = make("input", inline ? "canon-combobox-input" : "", {
      type: "text",
      role: "combobox",
      "aria-autocomplete": "list",
      "aria-expanded": inline ? "false" : "true",
      "aria-controls": `${id}-list`,
      autocomplete: "off",
      spellcheck: "false",
    });

    /* The value, for the trigger (or, inline with several values, for
       screen readers). */
    const value = make("span", "canon-combobox-value", { id: `${id}-value` });
    const trigger = inline ? null : make("button", "canon-combobox-trigger", {
      type: "button",
      role: "combobox",
      "aria-haspopup": searchable ? "dialog" : "listbox",
      "aria-expanded": "false",
      "aria-controls": searchable ? `${id}-popup` : `${id}-list`,
      popovertarget: `${id}-popup`,
    });
    trigger?.append(value);
    const control = trigger ?? input;
    /* Where focus is while the list is open, pointing at the keyboard's
       place: the search, or (without search) the trigger itself. */
    const focusTarget = searchable ? input : trigger;

    const list = make("div", "canon-combobox-list", { id: `${id}-list`, role: "listbox" });
    if (multiple) list.setAttribute("aria-multiselectable", "true");
    const createRule = make("hr", "canon-separator", { "aria-hidden": "true", hidden: "" });
    const createLabel = make("span", "canon-option-label");
    const createItem = make("div", "canon-combobox-option canon-combobox-create", { id: `${id}-create`, role: "option", hidden: "" });
    createItem.append(icon("plus"), createLabel);
    const row = (className, iconName) => {
      const element = make("div", className, { hidden: "" });
      const label = make("span");
      element.append(icon(iconName), label);
      return [element, label];
    };
    const [loading, loadingLabel] = row("canon-combobox-loading", "loader");
    const [empty, emptyLabel] = row("canon-combobox-empty", "search-x");

    const popup = make("div", "canon-combobox-popup", { id: `${id}-popup`, popover: inline ? "manual" : "auto" });
    if (searchable && !inline) {
      popup.setAttribute("role", "dialog");
      const search = make("div", "canon-combobox-search");
      search.append(input);
      popup.append(search);
    }
    popup.append(list, loading, empty);

    const tags = multiple ? make("ul", "canon-combobox-tags") : null;
    /* "+N": a tag in a button whose tooltip lists the hidden values (for
       the pointer: screen readers already get every value). */
    const moreLabel = make("span", "canon-tag-label");
    const more = make("li", "canon-combobox-more", { "aria-hidden": "true", hidden: "" });
    const moreTag = make("span", "canon-tag");
    const moreTip = make("div", "canon-tooltip", { id: `${id}-more`, popover: "hint", role: "tooltip" });
    const moreButton = make("button", "canon-combobox-more-button", { type: "button", tabindex: "-1", interestfor: moreTip.id });
    moreTag.append(moreLabel);
    moreButton.append(moreTag);
    more.append(moreButton, moreTip);
    tags?.append(more);
    const inputItem = inline && multiple ? make("li", "canon-combobox-input-item") : null;
    if (inputItem) {
      inputItem.append(input);
      tags.append(inputItem);
    }

    /* The box is the popup's anchor. */
    const anchor = `--${id}`;
    box.style.anchorName = box.style.anchorName && box.style.anchorName !== "none" ? `${box.style.anchorName}, ${anchor}` : anchor;
    popup.style.positionAnchor = anchor;
    popupAnchors.set(popup, box);

    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    const parts = [];
    if (tags) parts.push(tags);
    if (trigger) parts.push(trigger);
    else if (!multiple) parts.push(input);
    else parts.push(value);
    select.after(...parts, popup);

    /* The select's label and description name the box's control, the
       popup and the list. */
    const mirror = () => {
      const labels = [...select.labels].map((label, i) => label.id || (label.id = `${id}-label${i ? `-${i}` : ""}`));
      const labelledBy = select.getAttribute("aria-labelledby") || labels.join(" ");
      for (const element of inline ? [input, list] : searchable ? [trigger, popup, input, list] : [trigger, list]) {
        if (labelledBy) {
          element.setAttribute("aria-labelledby", labelledBy);
          element.removeAttribute("aria-label");
        } else if (select.hasAttribute("aria-label")) {
          element.setAttribute("aria-label", select.getAttribute("aria-label"));
        }
      }
      const describedBy = [select.getAttribute("aria-describedby"), inline && multiple ? value.id : null].filter(Boolean).join(" ");
      if (describedBy) control.setAttribute("aria-describedby", describedBy);
      else control.removeAttribute("aria-describedby");
      if (select.hasAttribute("aria-invalid")) control.setAttribute("aria-invalid", select.getAttribute("aria-invalid"));
      else control.removeAttribute("aria-invalid");
      if (select.required) control.setAttribute("aria-required", "true");
      else control.removeAttribute("aria-required");
      control.disabled = select.disabled;
      if (searchable && !inline) input.placeholder = text(box, "search", "Search");
      loadingLabel.textContent = text(box, "loading", "Loading…");
      /* Free values: a plain text field, with nothing to point at. */
      if (inline) {
        const comboboxAttributes = { role: "combobox", "aria-autocomplete": "list", "aria-controls": `${id}-list`, "aria-expanded": String(isOpen()) };
        for (const [name, value] of Object.entries(comboboxAttributes)) {
          if (isFree()) input.removeAttribute(name);
          else input.setAttribute(name, value);
        }
      }
    };

    /* The list, built from the select: groups with their caption,
       separators, and every option but hidden ones (the placeholder). A
       status (data-intent, with multiple) shows as the tag it becomes. */
    const items = new Map();
    const fillItem = (element, option) => {
      if (multiple && option.dataset.intent) {
        const tag = make("span", "canon-tag", { "data-intent": option.dataset.intent });
        const face = optionFace(option);
        face.at(-1).className = "canon-tag-label";
        tag.append(...face);
        element.replaceChildren(tag);
      } else if (option.children.length) {
        element.replaceChildren(...[...option.childNodes].map((node) => node.cloneNode(true)));
      } else {
        element.textContent = option.label;
      }
    };
    const build = () => {
      items.clear();
      list.replaceChildren();
      let count = 0;
      const item = (option) => {
        if (option.hidden) return null;
        const element = make("div", "canon-combobox-option", { id: `${id}-option-${++count}`, role: "option" });
        fillItem(element, option);
        items.set(element, option);
        return element;
      };
      for (const child of select.children) {
        if (child.matches("option")) {
          const element = item(child);
          if (element) list.append(element);
        } else if (child.matches("optgroup")) {
          const group = make("div", "", { role: "group" });
          const caption = make("div", "canon-combobox-caption", { id: `${id}-group-${++count}` });
          caption.textContent = child.label;
          group.setAttribute("aria-labelledby", caption.id);
          group.append(caption);
          for (const option of child.querySelectorAll(":scope > option")) {
            const element = item(option);
            if (element) group.append(element);
          }
          list.append(group);
        } else if (child.matches("hr")) {
          list.append(make("hr", "canon-separator", { "aria-hidden": "true" }));
        }
      }
      list.append(createRule, createItem);
      sizeToWidest();
    };

    /* In a text input, the box is as wide as its widest option, so the
       value beside it doesn't move when the choice changes. */
    const sizer = make("span", "canon-combobox-sizer", { "aria-hidden": "true" });
    const sizeToWidest = () => {
      if (!trigger || multiple || !box.parentElement.matches(".canon-text-input")) return;
      sizer.replaceChildren(...[...select.options].filter((option) => !option.hidden).map((option) => {
        const face = optionFace(option);
        face.at(-1).className = "canon-option-label";
        const span = make("span", "canon-combobox-value");
        span.append(...face);
        return span;
      }));
      if (!sizer.isConnected) trigger.append(sizer);
    };

    const placeholderOf = () => {
      const first = select.options[0];
      return first && first.value === "" ? first : null;
    };
    const chosenOptions = () => {
      const placeholder = placeholderOf();
      return [...select.selectedOptions].filter((option) => option !== placeholder);
    };

    /* Tags on one row (data-tags="collapse"): the ones that don't fit
       give way to "+N", the last one left is cut short. */
    const collapse = () => {
      if (!tags) return;
      const shown = [...tags.children].filter((li) => li !== more && li !== inputItem && !li.inert);
      for (const li of shown) {
        li.hidden = false;
        li.style.flexShrink = "";
      }
      more.hidden = true;
      if (box.dataset.tags !== "collapse" || !shown.length) return;
      for (const li of shown) li.style.flexShrink = "0";
      let hidden = 0;
      while (hidden < shown.length - 1 && tags.scrollWidth > tags.clientWidth + 0.5) {
        hidden++;
        shown[shown.length - hidden].hidden = true;
        more.hidden = false;
        moreLabel.textContent = fill(text(box, "more-values", "+{count}"), { count: hidden });
      }
      if (shown.length - hidden === 1) shown[0].style.flexShrink = "";
      moreTip.textContent = shown.slice(shown.length - hidden)
        .map((li) => li.querySelector(".canon-tag-label").textContent).join(", ");
    };

    /* Typing (inline): the field shows what is typed, not the value. */
    let typing = false;

    const tagFor = (option) => {
      const tag = make("span", "canon-tag");
      if (option.dataset.intent) tag.dataset.intent = option.dataset.intent;
      else if (option.dataset.seed) {
        tag.dataset.seed = option.dataset.seed;
        seedSlot(tag, tags);
      }
      const face = optionFace(option);
      face.at(-1).className = "canon-tag-label";
      const remove = make("button", "canon-tag-remove", {
        type: "button",
        tabindex: "-1",
        "aria-label": fill(text(box, "remove-value", "Remove {value}"), { value: optionLabel(option) }),
      });
      remove.disabled = select.disabled || option.disabled;
      remove.addEventListener("click", () => {
        option.selected = false;
        changed();
        control.focus();
      });
      tag.append(...face, remove);
      const li = make("li");
      li.append(tag);
      tagOptions.set(li, option);
      return li;
    };
    const tagOptions = new WeakMap();
    let tagsShown = false;

    /* Values people added are options only while chosen. */
    const created = new WeakSet();

    /* The box and the list show the select's value. */
    const render = () => {
      for (const option of [...select.options]) if (created.has(option) && !option.selected) option.remove();
      const placeholder = placeholderOf();
      const chosen = chosenOptions();
      const max = multiple ? Number(select.dataset.max) || Infinity : Infinity;
      const full = chosen.length >= max;
      for (const [element, option] of items) {
        element.setAttribute("aria-selected", String(option.selected));
        const off = option.disabled || option.parentElement.disabled || (full && !option.selected);
        if (off) element.setAttribute("aria-disabled", "true");
        else element.removeAttribute("aria-disabled");
      }
      if (full) createItem.setAttribute("aria-disabled", "true");
      else createItem.removeAttribute("aria-disabled");

      const showPlaceholder = () => {
        const span = make("span", "canon-combobox-placeholder");
        span.textContent = placeholder?.label ?? "";
        value.replaceChildren(span);
      };
      if (!multiple) {
        if (inline) {
          if (!typing) input.value = chosen[0] ? optionLabel(chosen[0]) : "";
          input.placeholder = placeholder?.label ?? "";
        } else if (chosen[0]) {
          const face = optionFace(chosen[0]);
          face.at(-1).className = "canon-option-label";
          value.replaceChildren(...face);
        } else showPlaceholder();
        return;
      }
      if (chosen.length) value.textContent = chosen.map(optionLabel).join(", ");
      else if (inline) value.textContent = "";
      else showPlaceholder();
      if (inline) input.placeholder = chosen.length ? "" : placeholder?.label ?? "";
      /* Tags still chosen stay (drawn afresh); new ones open their room,
         unchosen ones close theirs where they were, then go. The box's
         height follows them (data-resizing, from --canon-motion-from-height
         to --canon-motion-to-height) when they take more rows or fewer. */
      const fromHeight = tagsShown ? box.getBoundingClientRect().height : null;
      const kept = new Map();
      const leaving = [];
      for (const li of [...tags.children]) {
        if (li === more || li === inputItem || li.dataset.state === "closing") continue;
        const option = tagOptions.get(li);
        if (chosen.includes(option) && !kept.has(option)) kept.set(option, li);
        else leaving.push(li);
      }
      const keptItems = new Set(kept.values());
      const before = new Map(leaving.map((li) => {
        let next = li.nextElementSibling;
        while (next && next !== more && !keptItems.has(next)) next = next.nextElementSibling;
        return [li, next ?? more];
      }));
      const coming = [];
      more.before(...chosen.map((option) => {
        const fresh = tagFor(option);
        const li = kept.get(option);
        if (!li) {
          coming.push(fresh);
          return fresh;
        }
        li.replaceChildren(...fresh.childNodes);
        return li;
      }));
      for (const li of leaving) {
        before.get(li).before(li);
        li.inert = true;
      }
      collapse();
      if (fromHeight !== null) {
        const wasHidden = leaving.map((li) => li.hidden);
        for (const li of leaving) li.hidden = true;
        const toHeight = box.getBoundingClientRect().height;
        leaving.forEach((li, index) => { li.hidden = wasHidden[index]; });
        if (Math.abs(toHeight - fromHeight) > 0.5) {
          box.style.setProperty("--canon-motion-from-height", `${fromHeight}px`);
          box.style.setProperty("--canon-motion-to-height", `${toHeight}px`);
          markMotion(box, "data-resizing", coming.length ? "opening" : "closing", () => {
            box.style.removeProperty("--canon-motion-from-height");
            box.style.removeProperty("--canon-motion-to-height");
          });
        }
      }
      for (const li of leaving) {
        playRoom(li, "closing", () => {
          li.remove();
          collapse();
        });
      }
      if (tagsShown) for (const li of coming) if (!li.hidden) playRoom(li, "opening", collapse);
      tagsShown = true;
    };

    const changed = () => {
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const isOpen = () => popup.matches(":popover-open");
    const typed = () => (inline && !typing ? "" : input.value.trim());

    /* The app filters (data-filter="none"): tell it what was typed. */
    const search = () => {
      if (!searchable || box.dataset.filter !== "none") return;
      select.dispatchEvent(new CustomEvent("canon-search", { bubbles: true, detail: { query: typed() } }));
    };

    /* Filtering: an option matches when its label or description
       contains what was typed; the match is marked. Groups with nothing
       left go, and so do separators with nothing on one side. Then
       "Add …" (data-creatable, when no option is called that), "Loading"
       (aria-busy on the select) or "No results". */
    let announceTimer;
    const filter = (announceCount) => {
      const raw = typed();
      const query = fold(raw);
      const filtering = box.dataset.filter !== "none";
      let count = 0;
      for (const [element, option] of items) {
        if (element.querySelector("mark") || query) fillItem(element, option);
        element.hidden = filtering && query !== "" && !fold(optionSearchText(option)).includes(query);
        if (!element.hidden) {
          count++;
          highlight(element, query);
        }
      }
      for (const group of list.querySelectorAll(":scope > [role='group']")) {
        group.hidden = !group.querySelector(":scope > [role='option']:not([hidden])");
      }
      let before = false;
      let pending = null;
      for (const child of list.children) {
        if (child === createRule || child === createItem) continue;
        if (child.matches("hr")) {
          child.hidden = true;
          if (before) pending = child;
        } else if (!child.hidden) {
          if (pending) pending.hidden = false;
          pending = null;
          before = true;
        }
      }
      const exists = [...items.values()].some((option) => fold(optionLabel(option)) === query);
      const create = searchable && box.hasAttribute("data-creatable") && raw !== "" && !exists;
      createItem.hidden = !create;
      createRule.hidden = !(create && count > 0);
      createLabel.textContent = fill(text(box, "create-option", "Add “{value}”"), { value: raw });
      const busy = select.getAttribute("aria-busy") === "true";
      loading.hidden = !busy;
      empty.hidden = busy || count > 0 || create;
      emptyLabel.textContent = raw
        ? fill(text(box, "no-results-for", "No results for “{query}”"), { query: raw })
        : text(box, "no-results", "No results");
      list.hidden = count === 0 && !create;
      clearTimeout(announceTimer);
      if (announceCount && !busy) {
        announceTimer = setTimeout(() => {
          announce(count ? countText(box, "results", count) : create ? createLabel.textContent : emptyLabel.textContent);
        }, 500);
      }
    };

    /* The keyboard's place in the list (aria-activedescendant; the theme
       sees data-state="active"). */
    let active = null;
    const choosable = () => [...list.querySelectorAll("[role='option']")].filter((element) =>
      !element.hidden && !element.parentElement.hidden && element.getAttribute("aria-disabled") !== "true");
    const activate = (element, scroll = true) => {
      if (active) delete active.dataset.state;
      active = element ?? null;
      if (!active) return focusTarget.removeAttribute("aria-activedescendant");
      active.dataset.state = "active";
      focusTarget.setAttribute("aria-activedescendant", active.id);
      if (scroll) active.scrollIntoView({ block: "nearest" });
    };
    const move = (down) => {
      const options = choosable();
      const at = options.indexOf(active);
      activate(down
        ? options[at < 0 ? 0 : Math.min(at + 1, options.length - 1)]
        : options[at < 0 ? options.length - 1 : Math.max(at - 1, 0)]);
    };

    const close = () => {
      if (isOpen()) popup.hidePopover();
    };

    /* A new value: an option of the select (or the existing one with
       that name), chosen. */
    const create = (name = typed()) => {
      if (!name) return false;
      const max = multiple ? Number(select.dataset.max) || Infinity : Infinity;
      let option = [...select.options].find((o) => fold(optionLabel(o)) === fold(name));
      if (!option?.selected && chosenOptions().length >= max) return false;
      if (!option) {
        option = new Option(name, name);
        created.add(option);
        select.append(option);
      }
      option.selected = true;
      typing = false;
      if (multiple) input.value = "";
      changed();
      if (!multiple) close();
      else filter(false);
      return true;
    };

    const pick = (element) => {
      if (element.getAttribute("aria-disabled") === "true") return;
      if (element === createItem) return create();
      const option = items.get(element);
      if (!option) return;
      option.selected = multiple ? !option.selected : true;
      typing = false;
      changed();
      if (!multiple) return close();
      if (inline && input.value) {
        input.value = "";
        filter(false);
        search();
      }
      if (!element.hidden) activate(element, false);
    };

    /* Once open: the keyboard on the chosen option (or the first match),
       focus in the search. */
    const opened = () => {
      control.setAttribute("aria-expanded", "true");
      if (document.activeElement !== focusTarget) focusTarget.focus();
      if (active?.isConnected && !active.hidden) return;
      const selected = choosable().find((element) => items.get(element)?.selected);
      activate(typed() ? choosable()[0] : selected ?? choosable()[0]);
    };

    /* Opening by typing on the box starts the search with that text. */
    let query = "";
    const open = (typedText = "") => {
      if (!searchable) {
        if (!isOpen()) {
          popup.showPopover({ source: control });
          opened();
        }
        if (typedText) jump(typedText);
        return;
      }
      if (isOpen()) {
        input.value += typedText;
        typing = true;
        filter(true);
        search();
        activate(choosable()[0]);
        return input.focus();
      }
      query = typedText;
      popup.showPopover({ source: control });
      opened();
    };

    popup.addEventListener("beforetoggle", (event) => {
      if (event.newState !== "open") return;
      mirror();
      if (searchable && !inline) {
        input.value = query;
        query = "";
      }
      filter(false);
      search();
    });
    popup.addEventListener("toggle", (event) => {
      if (event.newState === "open") return opened();
      control.setAttribute("aria-expanded", "false");
      activate(null);
      if (inline) {
        typing = false;
        if (multiple) input.value = "";
        render();
      } else if (document.activeElement === document.body || popup.contains(document.activeElement)) {
        trigger.focus();
      }
    });

    /* Without search, typing jumps: to the next option starting with what
       was typed in the last half second (one letter again: the next one
       with it). */
    let typedAhead = "";
    let typeAheadTimer;
    const jump = (key) => {
      clearTimeout(typeAheadTimer);
      typeAheadTimer = setTimeout(() => { typedAhead = ""; }, 500);
      typedAhead += fold(key);
      const repeat = [...typedAhead].every((char) => char === typedAhead[0]);
      const wanted = repeat ? typedAhead[0] : typedAhead;
      const options = choosable();
      const from = options.indexOf(active) + (repeat || !active ? 1 : 0);
      const ordered = [...options.slice(from), ...options.slice(0, from)];
      const found = ordered.find((element) => items.has(element) && fold(optionLabel(items.get(element))).startsWith(wanted));
      if (found) activate(found);
    };

    if (trigger) {
      moreButton.addEventListener("click", () => open());
      let swallowSpace = false;
      trigger.addEventListener("keydown", (event) => {
        if (event.altKey && event.key !== "ArrowDown") return;
        if (event.ctrlKey || event.metaKey) return;
        /* Open, without search: the list's keys, on the trigger. */
        if (!searchable && isOpen()) {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            move(event.key === "ArrowDown");
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            const options = choosable();
            activate(event.key === "Home" ? options[0] : options.at(-1));
          } else if (event.key === "Enter" || (event.key === " " && !typedAhead)) {
            event.preventDefault();
            swallowSpace = event.key === " ";
            if (active) pick(active);
          } else if (event.key === "Tab") {
            close();
          } else if (event.key.length === 1) {
            event.preventDefault();
            jump(event.key);
          }
          return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          open();
        } else if (event.key.length === 1 && event.key !== " ") {
          event.preventDefault();
          open(event.key);
        }
      });
      /* Space picks on keydown; its keyup must not press the button. */
      trigger.addEventListener("keyup", (event) => {
        if (event.key === " " && swallowSpace) {
          event.preventDefault();
          swallowSpace = false;
        }
      });
    } else {
      /* Inline: the box opens the list; leaving it closes the list. */
      box.addEventListener("pointerdown", (event) => {
        if (input.disabled || event.button !== 0) return;
        if (event.target.closest(".canon-tag-remove, .canon-button, .canon-combobox-popup")) return;
        if (event.target !== input) event.preventDefault();
        input.focus();
        if (isFree()) return;
        if (!isOpen()) open();
        else if (event.target !== input) close();
      });
      box.addEventListener("focusout", (event) => {
        if (box.contains(event.relatedTarget)) return;
        close();
        /* Free values: what was typed isn't lost. */
        if (isFree() && typed()) create();
      });
    }

    input.addEventListener("input", () => {
      typing = true;
      if (isFree()) return;
      if (inline && !isOpen()) {
        popup.showPopover({ source: control });
        opened();
      }
      filter(true);
      search();
      activate(choosable()[0]);
    });
    input.addEventListener("keydown", (event) => {
      if (isFree() && (event.key === "Enter" || event.key === ",")) {
        /* Free values: Enter or a comma adds what was typed (an empty
           field lets Enter submit the form). */
        if (!typed()) {
          if (event.key === ",") event.preventDefault();
          return;
        }
        event.preventDefault();
        create();
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (isFree()) return;
        event.preventDefault();
        if (!isOpen()) open();
        else move(event.key === "ArrowDown");
      } else if (event.key === "Enter") {
        if (!isOpen()) return;
        event.preventDefault();
        if (active) pick(active);
      } else if (event.key === "Escape" && inline) {
        event.preventDefault();
        if (isOpen()) close();
        else if (typing || (multiple && input.value)) {
          typing = false;
          if (multiple) input.value = "";
          render();
        }
      } else if (event.key === "Tab") {
        close();
      } else if (event.key === "Backspace" && inline && multiple && input.value === "") {
        const last = chosenOptions().at(-1);
        if (!last || select.disabled) return;
        last.selected = false;
        changed();
        announce(fill(text(box, "removed-value", "{value} removed"), { value: optionLabel(last) }));
      }
    });

    /* Free values: a paste with commas or lines adds each part. The last
       part (after a trailing comma: none) stays to be finished, and so do
       the parts past the limit. */
    input.addEventListener("paste", (event) => {
      if (!isFree()) return;
      const pasted = event.clipboardData?.getData("text") ?? "";
      if (!/[,\n]/.test(pasted)) return;
      event.preventDefault();
      const parts = (input.value.slice(0, input.selectionStart) + pasted + input.value.slice(input.selectionEnd)).split(/[,\n]/);
      const last = parts.pop().trim();
      const left = parts.map((part) => part.trim()).filter((part) => part && !create(part));
      input.value = [...left, last].filter(Boolean).join(", ");
      typing = input.value !== "";
    });

    list.addEventListener("pointerdown", (event) => event.preventDefault());
    list.addEventListener("pointermove", (event) => {
      const element = event.target.closest("[role='option']");
      if (element && element !== active && element.getAttribute("aria-disabled") !== "true") activate(element, false);
    });
    list.addEventListener("click", (event) => {
      const element = event.target.closest("[role='option']");
      if (element) pick(element);
    });

    /* Focus that reaches the select (its label, a failed submit) goes to
       the box's control. */
    select.addEventListener("focus", () => control.focus());
    select.addEventListener("change", render);
    select.form?.addEventListener("reset", () => setTimeout(render));
    if (tags) {
      new ResizeObserver(() => collapse()).observe(box);
      document.fonts?.ready.then(collapse);
    }

    /* The app may change the options or attributes (aria-busy too). */
    let pending = false;
    new MutationObserver(() => {
      if (pending) return;
      pending = true;
      queueMicrotask(() => {
        pending = false;
        mirror();
        build();
        render();
        if (isOpen()) {
          filter(true);
          if (!active?.isConnected || active.hidden) activate(choosable()[0]);
        }
      });
    }).observe(select, { childList: true, subtree: true, characterData: true, attributes: true });

    /* Free values: the ones it starts with go when unchosen, like added
       ones. */
    if (isFree()) for (const option of chosenOptions()) created.add(option);

    mirror();
    build();
    render();
  };

  const setUpComboboxes = (root) => {
    if (root.matches?.(comboboxSelect)) setUpCombobox(root);
    for (const select of root.querySelectorAll?.(comboboxSelect) ?? []) setUpCombobox(select);
  };

  /* ------------------------------------------------------------------ */
  /* Swatches                                                            */
  /*                                                                     */
  /* A swatch's color is its value, read by CSS with typed attr(); where */
  /* that isn't supported, canon.js copies it to --canon-swatch (unless  */
  /* the author set one). data-collapse: a chevron toggle; the group     */
  /* opens while it has focus or when the chevron is clicked, and closes */
  /* when focus leaves, on Escape, after a click picks a swatch, or on   */
  /* the chevron again; then an arrow key, Enter or Space reopens it.    */
  /* ------------------------------------------------------------------ */

  const swatchSelector = ".canon-swatches > input[type='radio']";
  const typedColorAttr = CSS.supports("color", "attr(value type(<color>), red)");
  const swatchGroups = new WeakSet();

  const paintSwatch = (input) => {
    if (typedColorAttr || input.style.getPropertyValue("--canon-swatch")) return;
    if (CSS.supports("color", input.value)) input.style.setProperty("--canon-swatch", input.value);
  };

  const setUpSwatches = (group) => {
    if (swatchGroups.has(group)) return;
    swatchGroups.add(group);
    if (!group.hasAttribute("data-collapse")) return;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "canon-swatches-toggle";
    toggle.tabIndex = -1;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", text(group, "more-colors", "More colors"));
    group.append(toggle);
    /* Ready once the closed state has painted: opening and closing
       animate, setting up doesn't. */
    requestAnimationFrame(() => requestAnimationFrame(() => toggle.setAttribute("data-state", "ready")));
    const radios = () => [...group.querySelectorAll(":scope > input[type='radio']")];
    const setOpen = (open) => toggle.setAttribute("aria-expanded", String(open));
    let picking = false;
    group.addEventListener("focusin", () => setOpen(true));
    group.addEventListener("focusout", (event) => {
      if (!group.contains(event.relatedTarget)) setOpen(false);
    });
    group.addEventListener("keydown", (event) => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
      } else if (!open && /^(Arrow(Up|Down|Left|Right)|Enter| )$/.test(event.key)) {
        /* Closed with focus still inside (after Escape or a click): the
           first key reopens it. */
        event.preventDefault();
        setOpen(true);
      }
    });
    toggle.addEventListener("pointerdown", (event) => event.preventDefault());
    toggle.addEventListener("click", () => {
      if (toggle.getAttribute("aria-expanded") === "true") return setOpen(false);
      setOpen(true);
      const list = radios();
      (list.find((radio) => radio.checked) ?? list[0])?.focus();
    });
    group.addEventListener("pointerdown", (event) => {
      picking = event.target.matches?.("input[type='radio']");
    });
    group.addEventListener("change", () => {
      if (picking) setOpen(false);
      picking = false;
    });
  };

  const setUpSwatchGroups = (root) => {
    const inputs = [...(root.matches?.(swatchSelector) ? [root] : []), ...(root.querySelectorAll?.(swatchSelector) ?? [])];
    for (const input of inputs) paintSwatch(input);
    const groups = [...(root.matches?.(".canon-swatches") ? [root] : []), ...(root.querySelectorAll?.(".canon-swatches") ?? [])];
    for (const group of groups) setUpSwatches(group);
  };

  /* ------------------------------------------------------------------ */
  /* Color picker                                                        */
  /*                                                                     */
  /* An <input type="color"> in .canon-color. canon.js draws the swatch  */
  /* (.canon-color-swatch, --canon-color on the box) and, instead of the */
  /* browser's picker, opens a popover: a saturation / brightness area,  */
  /* hue, opacity (with the alpha attribute), an eyedropper where the    */
  /* browser has one, the value as HEX / RGB / HSL / HSB, and the        */
  /* swatches of the input's <datalist>. The input stays the value: it   */
  /* fires input while the color changes and change when the popover    */
  /* closes. With alpha, the value is an 8-digit hex; where the browser */
  /* can't keep alpha in a color input, the input becomes a read-only    */
  /* text field holding it (behind the swatch, as the color input was). */
  /* ------------------------------------------------------------------ */

  const colorBoxes = new WeakSet();
  let colorCount = 0;
  const nativeAlpha = "alpha" in HTMLInputElement.prototype;

  /* Any CSS color to { r, g, b, a } (0-255, alpha 0-1), through a canvas;
     null when it isn't a color. */
  const colorContext = document.createElement("canvas").getContext("2d");
  const parseColor = (value) => {
    if (!value || !CSS.supports("color", value)) return null;
    colorContext.fillStyle = "#000";
    colorContext.fillStyle = value;
    const result = colorContext.fillStyle;
    if (result.startsWith("#")) {
      const n = parseInt(result.slice(1), 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
    }
    const [r, g, b, a = 1] = result.match(/[\d.]+/g).map(Number);
    return { r, g, b, a };
  };
  const hex2 = (n) => Math.round(n).toString(16).padStart(2, "0");
  const toHex = ({ r, g, b }, a) => `#${hex2(r)}${hex2(g)}${hex2(b)}${a === undefined ? "" : hex2(a * 255)}`;
  const hsvToRgb = (h, s, v) => {
    const f = (n) => {
      const k = (n + h / 60) % 6;
      return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255;
    };
    return { r: f(5), g: f(3), b: f(1) };
  };
  const rgbToHsv = ({ r, g, b }) => {
    [r, g, b] = [r / 255, g / 255, b / 255];
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
    const h = d === 0 ? null : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: h === null ? null : (h * 60 + 360) % 360, s: max === 0 ? 0 : d / max, v: max };
  };
  const hsvToHsl = (s, v) => {
    const l = v * (1 - s / 2);
    return { s: l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l), l };
  };
  const hslToHsv = (s, l) => {
    const v = l + s * Math.min(l, 1 - l);
    return { s: v === 0 ? 0 : 2 * (1 - l / v), v };
  };

  const formats = {
    hex: { label: "HEX", fields: [["hex", "Hex"]] },
    rgb: { label: "RGB", fields: [["red", "Red", 255], ["green", "Green", 255], ["blue", "Blue", 255]] },
    hsl: { label: "HSL", fields: [["hue", "Hue", 360], ["saturation", "Saturation", 100], ["lightness", "Lightness", 100]] },
    hsb: { label: "HSB", fields: [["hue", "Hue", 360], ["saturation", "Saturation", 100], ["brightness", "Brightness", 100]] },
  };

  const setUpColor = (box) => {
    const input = box.querySelector(":scope > input[type='color']");
    if (!input || colorBoxes.has(box)) return;
    colorBoxes.add(box);
    const id = `canon-color-${++colorCount}`;
    const alpha = input.hasAttribute("alpha");
    /* data-inline: the picker in place of the box, always shown. */
    const inline = box.hasAttribute("data-inline");
    const make = (tag, className, attributes = {}) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
      return element;
    };
    const label = (key, fallback) => text(box, key, fallback);

    /* The value: an 8-digit hex with alpha (a read-only text field where
       the browser can't keep alpha), the browser's hex without. */
    const initial = parseColor(input.getAttribute("value") ?? input.value) ?? parseColor(input.value) ?? { r: 0, g: 0, b: 0, a: 1 };
    if (alpha && !nativeAlpha) {
      input.type = "text";
      input.readOnly = true;
      input.setAttribute("autocomplete", "off");
    }
    let { h, s, v } = rgbToHsv(initial);
    h ??= 0;
    let a = alpha ? initial.a : 1;
    const rgb = () => hsvToRgb(h, s, v);
    const valueText = () => (alpha ? toHex(rgb(), a) : toHex(rgb()));

    /* The swatch the box shows (the input covers it, transparent). */
    const swatch = make("span", "canon-color-swatch", { "aria-hidden": "true" });
    input.after(swatch);

    /* The popover. */
    const popup = make("div", "canon-color-popup", inline ? { id: `${id}-popup`, role: "group" } : { id: `${id}-popup`, popover: "auto", role: "dialog" });
    const area = make("div", "canon-color-area", { role: "slider", tabindex: "0", "aria-label": label("color-area", "Saturation and brightness") });
    area.append(make("span", "canon-color-thumb"));

    const sliders = make("div", "canon-color-sliders");
    const hue = make("input", "canon-color-hue", { type: "range", min: "0", max: "360", step: "1", "aria-label": label("hue", "Hue") });
    sliders.append(hue);
    const opacity = alpha ? make("input", "canon-color-opacity", { type: "range", min: "0", max: "100", step: "1", "aria-label": label("opacity", "Opacity") }) : null;
    if (opacity) sliders.append(opacity);

    const tools = make("div", "canon-color-tools");
    const dropper = "EyeDropper" in window ? make("button", "canon-color-eyedropper", { type: "button", "aria-label": label("eyedropper", "Pick a color from the screen") }) : null;
    if (dropper) tools.append(dropper);
    tools.append(sliders);

    /* Fields: the format, its value(s), the opacity. */
    const fields = make("div", "canon-color-fields");
    const formatBox = make("div", "canon-select", { "data-size": "sm" });
    const format = make("select", "", { "aria-label": label("color-format", "Format") });
    for (const [key, { label: name }] of Object.entries(formats)) format.append(new Option(name, key));
    formatBox.append(format);
    const values = make("div", "canon-color-values");
    const opacityBox = alpha ? make("div", "canon-text-input canon-color-percent", { "data-size": "sm" }) : null;
    const opacityField = alpha ? make("input", "", { type: "text", inputmode: "numeric", "aria-label": label("opacity", "Opacity"), autocomplete: "off" }) : null;
    if (opacityBox) {
      opacityBox.append(opacityField, Object.assign(make("span", "canon-text-input-suffix", { "aria-hidden": "true" }), { textContent: "%" }));
    }
    fields.append(formatBox, values);
    if (opacityBox) fields.append(opacityBox);

    popup.append(area, tools, fields);

    /* The input's <datalist>: swatches, a radio group of the popover (its
       radios belong to no form). */
    const list = input.list ?? document.getElementById(input.getAttribute("list") ?? "");
    let swatchRadios = [];
    if (list?.options.length) {
      const caption = make("div", "canon-color-caption", { id: `${id}-swatches` });
      caption.textContent = label("swatches", "Swatches");
      const group = make("div", "canon-swatches", { role: "radiogroup", "aria-labelledby": caption.id });
      for (const option of list.options) {
        const color = parseColor(option.value);
        if (!color) continue;
        const radio = make("input", "", { type: "radio", name: `${id}-swatch`, form: popup.id, value: option.value, "aria-label": option.label || option.textContent.trim() || option.value });
        radio.style.setProperty("--canon-swatch", option.value);
        radio.addEventListener("change", () => setColor(color, "swatch"));
        group.append(radio);
        swatchRadios.push([radio, color]);
      }
      popup.append(make("hr", "canon-separator", { "data-size": "sm" }), caption, group);
    }
    if (inline) box.after(popup);
    else box.append(popup);

    /* Named like the input; anchored to the box. */
    if (!inline) {
      const anchor = `--${id}`;
      box.style.anchorName = box.style.anchorName && box.style.anchorName !== "none" ? `${box.style.anchorName}, ${anchor}` : anchor;
      popup.style.positionAnchor = anchor;
      popupAnchors.set(popup, box);
    }
    const labelledBy = input.getAttribute("aria-labelledby") || [...input.labels].map((l, i) => l.id || (l.id = `${id}-label${i ? `-${i}` : ""}`)).join(" ");
    if (labelledBy) popup.setAttribute("aria-labelledby", labelledBy);
    else if (input.hasAttribute("aria-label")) popup.setAttribute("aria-label", input.getAttribute("aria-label"));
    if (!inline) {
      input.setAttribute("aria-haspopup", "dialog");
      input.setAttribute("aria-expanded", "false");
      input.setAttribute("aria-controls", popup.id);
    }

    /* Fields for the chosen format. */
    let fieldInputs = [];
    const buildFields = () => {
      values.replaceChildren();
      fieldInputs = formats[format.value].fields.map(([key, fallback, max]) => {
        const field = make("div", "canon-text-input", { "data-size": "sm" });
        const control = make("input", "", { type: "text", "aria-label": label(key, fallback), autocomplete: "off", spellcheck: "false" });
        if (max) control.setAttribute("inputmode", "numeric");
        if (format.value === "hex") field.append(Object.assign(make("span", "canon-text-input-prefix", { "aria-hidden": "true" }), { textContent: "#" }));
        field.append(control);
        values.append(field);
        control.addEventListener("change", readFields);
        control.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            readFields();
          }
        });
        return [control, max];
      });
      values.dataset.count = String(fieldInputs.length);
    };
    const fillFields = () => {
      const color = rgb();
      const parts = format.value === "hex" ? [toHex(color).slice(1).toUpperCase()]
        : format.value === "rgb" ? [color.r, color.g, color.b].map(Math.round)
        : format.value === "hsl" ? (() => { const hsl = hsvToHsl(s, v); return [h, hsl.s * 100, hsl.l * 100].map(Math.round); })()
        : [h, s * 100, v * 100].map(Math.round);
      fieldInputs.forEach(([control], i) => { if (document.activeElement !== control) control.value = parts[i]; });
      if (opacityField && document.activeElement !== opacityField) opacityField.value = String(Math.round(a * 100));
    };
    function readFields() {
      const raw = fieldInputs.map(([control]) => control.value.trim());
      const numbers = raw.map(Number);
      const ok = (i, max) => raw[i] !== "" && Number.isFinite(numbers[i]) && numbers[i] >= 0 && numbers[i] <= max;
      if (format.value === "hex") {
        const color = /^[\da-f]{3}([\da-f]{3})?$/i.test(raw[0]) ? parseColor(`#${raw[0]}`) : null;
        if (color) setColor({ ...color, a }, "fields");
      } else if (fieldInputs.every(([, max], i) => ok(i, max))) {
        if (format.value === "rgb") setColor({ r: numbers[0], g: numbers[1], b: numbers[2], a }, "fields");
        else {
          const hsv = format.value === "hsl" ? hslToHsv(numbers[1] / 100, numbers[2] / 100) : { s: numbers[1] / 100, v: numbers[2] / 100 };
          h = numbers[0] % 360;
          s = hsv.s;
          v = hsv.v;
          update("fields");
        }
      }
      fillFields();
    }
    opacityField?.addEventListener("change", () => {
      const value = Number(opacityField.value.replace("%", "").trim());
      if (Number.isFinite(value) && opacityField.value.trim() !== "") {
        a = Math.min(1, Math.max(0, value / 100));
        update("fields");
      }
      fillFields();
    });
    opacityField?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        opacityField.dispatchEvent(new Event("change"));
      }
    });

    /* Everything shows the color; the input holds it. */
    let committed = input.value;
    const update = (source) => {
      const color = rgb();
      const opaque = `rgb(${color.r} ${color.g} ${color.b})`;
      for (const element of [box, popup]) {
        element.style.setProperty("--canon-color", `rgb(${color.r} ${color.g} ${color.b} / ${a})`);
        element.style.setProperty("--canon-color-opaque", opaque);
        element.style.setProperty("--canon-color-hue", `hsl(${h} 100% 50%)`);
      }
      popup.style.setProperty("--canon-color-saturation", String(s));
      popup.style.setProperty("--canon-color-brightness", String(v));
      area.setAttribute("aria-valuetext", fill(label("color-area-value", "Saturation {s}%, brightness {v}%"), { s: Math.round(s * 100), v: Math.round(v * 100) }));
      if (source !== "hue") hue.value = String(Math.round(h));
      if (opacity && source !== "opacity") opacity.value = String(Math.round(a * 100));
      if (source !== "fields") fillFields();
      const current = toHex(color).toLowerCase();
      for (const [radio, swatchColor] of swatchRadios) radio.checked = toHex(swatchColor).toLowerCase() === current && Math.abs(swatchColor.a - a) < 0.005;
      if (source === "init") return;
      const next = valueText();
      if (input.value !== next) {
        input.value = next;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    function setColor(color, source) {
      const hsv = rgbToHsv(color);
      if (hsv.h !== null) h = hsv.h;
      s = hsv.s;
      v = hsv.v;
      if (alpha) a = color.a;
      update(source);
    }

    /* The area: drag, or the arrow keys (saturation left / right,
       brightness up / down; Shift: 10 at a time). */
    const fromPointer = (event) => {
      const rect = area.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      s = getComputedStyle(area).direction === "rtl" ? 1 - x : x;
      v = 1 - y;
      update("area");
    };
    area.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || input.disabled) return;
      area.setPointerCapture(event.pointerId);
      area.focus();
      fromPointer(event);
    });
    area.addEventListener("pointermove", (event) => {
      if (area.hasPointerCapture(event.pointerId)) fromPointer(event);
    });
    area.addEventListener("keydown", (event) => {
      if (input.disabled) return;
      const step = (event.shiftKey ? 10 : 1) / 100;
      const rtl = getComputedStyle(area).direction === "rtl";
      const moves = { ArrowRight: [rtl ? -step : step, 0], ArrowLeft: [rtl ? step : -step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
      if (!moves[event.key]) return;
      event.preventDefault();
      s = Math.min(1, Math.max(0, s + moves[event.key][0]));
      v = Math.min(1, Math.max(0, v + moves[event.key][1]));
      update("area");
    });
    hue.addEventListener("input", () => {
      h = Number(hue.value);
      update("hue");
    });
    opacity?.addEventListener("input", () => {
      a = Number(opacity.value) / 100;
      update("opacity");
    });
    format.addEventListener("change", () => {
      buildFields();
      fillFields();
    });
    dropper?.addEventListener("click", async () => {
      try {
        const { sRGBHex } = await new window.EyeDropper().open();
        const color = parseColor(sRGBHex);
        if (color) setColor({ ...color, a }, "dropper");
      } catch {}
    });

    /* Inline: the box (and its input) is hidden; the label's click goes to
       the area, the input's description and state to the group, and
       change fires where a native control's would (a drag ends, a key, a
       slider's change, a field or a swatch). */
    if (inline) {
      const commit = () => {
        if (input.value === committed) return;
        committed = input.value;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      };
      input.addEventListener("click", (event) => {
        event.preventDefault();
        if (!input.disabled) area.focus({ focusVisible: false });
      });
      area.addEventListener("pointerup", commit);
      popup.addEventListener("keyup", commit);
      hue.addEventListener("change", commit);
      opacity?.addEventListener("change", commit);
      popup.addEventListener("focusout", commit);
      popup.addEventListener("change", (event) => { if (event.target.type === "radio") commit(); });
      dropper?.addEventListener("click", () => setTimeout(commit));
      const mirror = () => {
        const disabled = input.disabled;
        for (const control of popup.querySelectorAll("input, select, button")) control.disabled = disabled;
        area.tabIndex = disabled ? -1 : 0;
        if (disabled) area.setAttribute("aria-disabled", "true");
        else area.removeAttribute("aria-disabled");
        for (const name of ["aria-describedby", "aria-invalid"]) {
          if (input.hasAttribute(name)) popup.setAttribute(name, input.getAttribute(name));
          else popup.removeAttribute(name);
        }
      };
      new MutationObserver(mirror).observe(input, { attributes: true, attributeFilter: ["disabled", "aria-describedby", "aria-invalid"] });
      mirror();
    }

    /* Opening: the input's click, Enter, Space or Down open the popover
       instead of the browser's picker. */
    const isOpen = () => popup.matches(":popover-open");
    /* Opened from the keyboard, the area shows focus; by the pointer, not. */
    let byKeyboard = false;
    const open = (keyboard) => {
      if (input.disabled || isOpen()) return;
      byKeyboard = keyboard;
      popup.showPopover({ source: input });
    };
    /* A press on the input or its label while open closes the popover
       (light dismiss, before the click): that click mustn't reopen it. */
    let closingPress = false;
    if (!inline) document.addEventListener("pointerdown", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      closingPress = isOpen() && !!target && (target === input || target.closest("label")?.control === input);
    }, true);
    if (!inline) input.addEventListener("click", (event) => {
      event.preventDefault();
      const closing = closingPress;
      closingPress = false;
      if (isOpen()) popup.hidePopover();
      else if (!closing) open(event.detail === 0);
    });
    if (!inline) input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        open(true);
      }
    });
    popup.addEventListener("toggle", (event) => {
      const opened = event.newState === "open";
      input.setAttribute("aria-expanded", String(opened));
      if (opened) {
        committed = input.value;
        area.focus({ focusVisible: byKeyboard });
        return;
      }
      if (input.value !== committed) input.dispatchEvent(new Event("change", { bubbles: true }));
      if (document.activeElement === document.body || popup.contains(document.activeElement)) input.focus();
    });

    /* The app may set the value (and fire input or change); a form reset
       brings the first value back. */
    const sync = (value) => {
      const color = parseColor(value);
      if (!color) return;
      const hsv = rgbToHsv(color);
      if (hsv.h !== null) h = hsv.h;
      s = hsv.s;
      v = hsv.v;
      a = alpha ? color.a : 1;
      update("init");
    };
    for (const type of ["input", "change"]) {
      input.addEventListener(type, (event) => {
        if (event.isTrusted || input.value !== valueText()) sync(input.value);
      });
    }
    input.form?.addEventListener("reset", () => setTimeout(() => {
      input.value = toHex(initial, alpha ? initial.a : undefined);
      sync(input.value);
    }));

    buildFields();
    if (alpha && !nativeAlpha) input.value = valueText();
    update("init");
  };

  const setUpColors = (root) => {
    const boxes = [...(root.matches?.(".canon-color") ? [root] : []), ...(root.querySelectorAll?.(".canon-color") ?? [])];
    for (const box of boxes) setUpColor(box);
  };

  /* ------------------------------------------------------------------ */
  /* Input OTP                                                           */
  /*                                                                     */
  /* One text input in .canon-otp; maxlength is the length. canon.js     */
  /* draws a cell per character (in groups: data-groups="3 3", summing   */
  /* to the length) and keeps the input over them, invisible: it still   */
  /* takes typing, paste, autofill (autocomplete="one-time-code") and    */
  /* its label. The cell at the caret is [data-active]: a filled one is  */
  /* selected, so typing replaces it. Only letters and digits are kept   */
  /* (digits with inputmode="numeric"); a pasted code fills the cells    */
  /* from the caret. type="password" shows dots.                         */
  /* ------------------------------------------------------------------ */

  const otpBoxes = new WeakSet();

  const setUpOtp = (box) => {
    const input = box.querySelector(":scope > input");
    const length = Number(input?.getAttribute("maxlength"));
    if (!input || !(length > 0) || otpBoxes.has(box)) return;
    otpBoxes.add(box);
    const keep = input.inputMode === "numeric" ? /\d/g : /[\p{L}\p{N}]/gu;
    const clean = (text) => (text.match(keep) ?? []).join("").slice(0, length);

    let sizes = (box.dataset.groups ?? "").trim().split(/\s+/).map(Number).filter((n) => n > 0);
    if (sizes.reduce((sum, n) => sum + n, 0) !== length) sizes = [length];
    const make = (className) => Object.assign(document.createElement("span"), { className });
    const cells = Object.assign(document.createElement("div"), { className: "canon-otp-cells" });
    cells.setAttribute("aria-hidden", "true");
    const slots = [];
    sizes.forEach((size, i) => {
      if (i) cells.append(make("canon-otp-separator"));
      const group = make("canon-otp-group");
      for (let j = 0; j < size; j++) slots.push(group.appendChild(make("canon-otp-cell")));
      cells.append(group);
    });
    input.after(cells);

    /* The caret's cell: a filled one is selected (typing replaces it);
       past the value, the caret waits at the end. */
    const place = (index) => {
      const value = input.value;
      const i = Math.max(0, Math.min(index, value.length, length - 1));
      if (i < value.length) input.setSelectionRange(i, i + 1);
      else input.setSelectionRange(i, i);
      render();
    };
    const caret = () => Math.min(input.selectionStart ?? input.value.length, length - 1);
    const render = () => {
      const chars = [...input.value];
      const hints = [...input.placeholder];
      const active = document.activeElement === input ? caret() : -1;
      slots.forEach((cell, i) => {
        cell.textContent = chars[i] ? (input.type === "password" ? "•" : chars[i]) : "";
        if (hints[i] && !chars[i]) cell.dataset.placeholder = hints[i];
        else delete cell.dataset.placeholder;
        cell.toggleAttribute("data-active", i === active);
      });
    };

    input.addEventListener("beforeinput", (event) => {
      if (event.inputType === "insertText" && event.data && !clean(event.data)) event.preventDefault();
    });
    input.addEventListener("input", () => {
      const at = input.selectionStart ?? input.value.length;
      const cleaned = clean(input.value);
      if (cleaned !== input.value) input.value = cleaned;
      place(Math.min(at, cleaned.length));
    });
    input.addEventListener("paste", (event) => {
      const text = clean(event.clipboardData?.getData("text") ?? "");
      event.preventDefault();
      if (!text || input.readOnly || input.disabled) return;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;
      const value = text.length >= length ? text : (input.value.slice(0, start) + text + input.value.slice(end)).slice(0, length);
      input.value = value;
      input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertFromPaste", data: text }));
      place(text.length >= length ? length : start + text.length);
    });
    input.addEventListener("keydown", (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const moves = { ArrowLeft: caret() - 1, ArrowRight: caret() + 1, ArrowUp: 0, Home: 0, ArrowDown: length, End: length };
      if (!(event.key in moves)) return;
      event.preventDefault();
      place(moves[event.key]);
    });
    /* A press picks the cell under the pointer (or the first empty one),
       instead of a place in the invisible text. Focus from elsewhere (Tab,
       the label) starts after the value. */
    let pressing = false;
    input.addEventListener("mousedown", (event) => {
      if (event.button !== 0 || input.disabled) return;
      event.preventDefault();
      pressing = true;
      input.focus();
      pressing = false;
      const index = slots.findIndex((cell) => event.clientX < cell.getBoundingClientRect().right);
      place(index === -1 ? length : index);
    });
    input.addEventListener("focus", () => {
      if (pressing) return;
      requestAnimationFrame(() => { if (document.activeElement === input) place(input.value.length); });
    });
    input.addEventListener("blur", render);
    input.addEventListener("select", render);
    input.addEventListener("keyup", render);
    input.form?.addEventListener("reset", () => setTimeout(render));
    render();
  };

  const setUpOtps = (root) => {
    const boxes = [...(root.matches?.(".canon-otp") ? [root] : []), ...(root.querySelectorAll?.(".canon-otp") ?? [])];
    for (const box of boxes) setUpOtp(box);
  };

  /* ------------------------------------------------------------------ */
  /* Form Repeater                                                       */
  /*                                                                     */
  /* .canon-repeater (with an id): items (.canon-repeater-item) and      */
  /* buttons that name the repeater (commandfor): command="--canon-add"  */
  /* after the items, and in each item command="--canon-remove".         */
  /* Add copies the first item as the page wrote it (taken before        */
  /* canon.js enhances it), empty: values, choices, checks, invalid      */
  /* states and messages cleared. The copy takes the next number: the    */
  /* first item's number (the first [n] in its names) is replaced, as a  */
  /* whole number, in its ids and names and in the attributes that point */
  /* at ids (for, aria-describedby, …). A list that can start empty      */
  /* gives a <template> with one item instead, {index} for the number.   */
  /* Focus moves into the new item. Remove takes out the button's item,  */
  /* says so, and focuses the next one. Add hides at data-max, Remove at */
  /* data-min (1 by default). Each item is a group named "Item 2 of 3"   */
  /* unless the author named it. Items an app adds or removes are        */
  /* followed.                                                           */
  /* ------------------------------------------------------------------ */

  const repeaters = new WeakMap();

  commands["--canon-add"] = (target) => repeaters.get(target)?.add();
  commands["--canon-remove"] = (target, source) => repeaters.get(target)?.remove(source);

  /* The first thing in an element that takes focus from Tab. */

  /* Attributes that hold ids (or, name, the item's number). */
  const idReferences = ["id", "for", "name", "aria-describedby", "aria-labelledby", "aria-controls", "aria-owns", "list", "headers", "commandfor", "popovertarget", "data-match"];

  /* The item's number: the first [n] in its names. */
  const itemNumber = (item) => {
    for (const element of item.querySelectorAll("[name]")) {
      const found = element.getAttribute("name").match(/\[(\d+)\]/);
      if (found) return Number(found[1]);
    }
    return null;
  };

  /* An item as a new one starts: no values, choices or checks, nothing
     invalid, no messages. */
  const emptied = (item) => {
    const copy = item.cloneNode(true);
    copy.removeAttribute("role");
    for (const input of copy.querySelectorAll("input")) {
      input.removeAttribute("value");
      input.removeAttribute("checked");
    }
    for (const textarea of copy.querySelectorAll("textarea")) textarea.textContent = "";
    for (const select of copy.querySelectorAll("select")) {
      for (const option of select.options) option.removeAttribute("selected");
      const placeholder = [...select.options].find((option) => option.value === "");
      if (placeholder && !select.multiple) placeholder.setAttribute("selected", "");
    }
    for (const invalid of copy.querySelectorAll("[aria-invalid]")) invalid.removeAttribute("aria-invalid");
    for (const message of copy.querySelectorAll(".canon-field-message")) {
      message.replaceChildren();
      message.removeAttribute("data-intent");
      message.removeAttribute("data-state");
    }
    return copy;
  };

  /* The empty item, numbered: {index} in a template; otherwise the first
     item's number, replaced as a whole number (members-0-name,
     members[0][name]) in its id attributes. Without a number, ids get
     "-<number>" and what points at them follows. */
  const numbered = (source, from, index) => {
    const fragment = source instanceof HTMLTemplateElement ? document.importNode(source.content, true) : source.cloneNode(true);
    const elements = fragment instanceof Element ? [fragment, ...fragment.querySelectorAll("*")] : [...fragment.querySelectorAll("*")];
    if (source instanceof HTMLTemplateElement) {
      for (const element of elements) {
        for (const attribute of element.attributes) {
          if (attribute.value.includes("{index}")) attribute.value = attribute.value.replaceAll("{index}", index);
        }
      }
    } else if (from !== null) {
      const whole = new RegExp(`(?<![A-Za-z0-9])${from}(?![A-Za-z0-9])`, "g");
      for (const element of elements) {
        for (const name of idReferences) {
          const value = element.getAttribute(name);
          if (value) element.setAttribute(name, value.replace(whole, index));
        }
      }
    } else {
      const renamed = new Map();
      for (const element of elements) if (element.id) renamed.set(element.id, `${element.id}-${index}`);
      for (const element of elements) {
        for (const name of idReferences) {
          if (name === "name" || !element.hasAttribute(name)) continue;
          element.setAttribute(name, element.getAttribute(name).split(/\s+/).map((id) => renamed.get(id) ?? id).join(" "));
        }
      }
    }
    return fragment;
  };

  const setUpRepeater = (repeater) => {
    if (repeaters.has(repeater)) return;

    /* Not an item on its way out. */
    const items = () => [...repeater.children].filter((child) => child.matches(".canon-repeater-item:not([data-state='closing'])"));
    const template = () => [...repeater.children].find((child) => child.matches("template"));
    const addButton = () => [...repeater.children].find((child) => child.matches("button[command='--canon-add']"));
    const limit = (name, fallback) => {
      const value = parseInt(repeater.dataset[name], 10);
      return Number.isInteger(value) && value >= 0 ? value : fallback;
    };
    const min = () => limit("min", 1);
    const max = () => limit("max", Infinity);
    const named = new WeakSet();
    let next = items().length;
    /* Taken now, before canon.js enhances what the item holds. */
    const first = items()[0];
    const blank = first && emptied(first);
    const blankNumber = first ? itemNumber(first) : null;
    const source = () => template() ?? blank;
    /* While an item comes or goes, data-changing: the theme moves the
       Remove buttons' room with it (one item left has none). */
    let changing = null;
    const change = () => {
      const mark = {};
      changing = mark;
      repeater.setAttribute("data-changing", "");
      return () => {
        if (changing === mark) repeater.removeAttribute("data-changing");
      };
    };

    const sync = () => {
      const list = items();
      const add = addButton();
      if (add) add.hidden = !source() || list.length >= max();
      list.forEach((item, index) => {
        item.setAttribute("role", "group");
        if (named.has(item) || !(item.hasAttribute("aria-label") || item.hasAttribute("aria-labelledby"))) {
          named.add(item);
          item.setAttribute("aria-label", fill(text(item, "repeater-item", "Item {index} of {count}"), { index: index + 1, count: list.length }));
        }
        for (const remove of item.querySelectorAll(":scope > button[command='--canon-remove']")) remove.hidden = list.length <= min();
      });
    };

    const add = () => {
      const from = source();
      if (!from || items().length >= max()) return;
      /* The next number: past every item's, and with its ids all free. */
      let index = Math.max(next, ...items().map(itemNumber).filter((number) => number !== null).map((number) => number + 1));
      let fragment = numbered(from, blankNumber, index);
      const taken = () => [fragment, ...fragment.querySelectorAll("[id]")].some((element) => element.id && document.getElementById(element.id));
      while (taken()) fragment = numbered(from, blankNumber, ++index);
      next = index + 1;

      const item = fragment.matches?.(".canon-repeater-item") ? fragment : fragment.querySelector(".canon-repeater-item");
      const last = items().at(-1);
      if (last) last.after(fragment);
      else if (addButton()) addButton().before(fragment);
      else repeater.append(fragment);
      const changed = change();
      sync();
      if (item) playRoom(item, "opening", changed);
      else changed();
      /* After canon.js has set up what the item holds (a mutation observer). */
      requestAnimationFrame(() => (item && firstFocusable(item))?.focus());
      repeater.dispatchEvent(new CustomEvent("canon-add", { bubbles: true, detail: { item } }));
    };

    /* The item holding the button that asked. */
    const remove = (button) => {
      const list = items();
      const item = list.find((each) => each.contains(button));
      if (!item || list.length <= min()) return;
      const at = list.indexOf(item);
      const neighbour = list[at + 1] ?? list[at - 1];
      /* It closes its room, then goes. Meanwhile the others count without
         it, and its fields are off (not sent with the form). */
      item.inert = true;
      for (const control of item.querySelectorAll("input, select, textarea, button")) control.disabled = true;
      const changed = change();
      playRoom(item, "closing", () => {
        item.remove();
        changed();
      });
      sync();
      announce(text(repeater, "repeater-removed", "Item removed"));
      const target = (neighbour && firstFocusable(neighbour)) || (addButton()?.hidden ? null : addButton());
      target?.focus();
      repeater.dispatchEvent(new CustomEvent("canon-remove", { bubbles: true, detail: { item } }));
    };

    repeaters.set(repeater, { add, remove });
    new MutationObserver(sync).observe(repeater, { childList: true, attributes: true, attributeFilter: ["data-min", "data-max"] });
    sync();
  };

  const setUpRepeaters = (root) => {
    const found = [...(root.matches?.(".canon-repeater") ? [root] : []), ...(root.querySelectorAll?.(".canon-repeater") ?? [])];
    for (const repeater of found) setUpRepeater(repeater);
  };

  /* ------------------------------------------------------------------ */
  /* Form Layout: reveals                                                */
  /*                                                                     */
  /* A .canon-form-reveal (a <fieldset>) right after a .canon-choice      */
  /* shows while the choice is checked (CSS). canon.js disables it while  */
  /* it is hidden, so its fields are neither checked nor sent with the    */
  /* form.                                                                */
  /* ------------------------------------------------------------------ */

  const syncReveals = (root = document) => {
    for (const reveal of root.querySelectorAll?.(".canon-form-reveal") ?? []) {
      const choice = reveal.previousElementSibling;
      const input = choice?.matches(".canon-choice") ? choice.querySelector(":scope > input") : null;
      if (input && "disabled" in reveal) reveal.disabled = !input.checked;
    }
  };
  document.addEventListener("change", (event) => {
    if (event.target.matches?.(".canon-choice > input")) syncReveals(event.target.form ?? document);
  });
  document.addEventListener("reset", (event) => setTimeout(() => syncReveals(event.target)), true);

  /* ------------------------------------------------------------------ */
  /* Date and calendar                                                   */
  /*                                                                     */
  /* An <input type="date"> in .canon-date. canon.js draws the field     */
  /* (the same in every browser) over the hidden input and adds a button */
  /* that opens a calendar (a popover dialog); with data-inline the      */
  /* calendar is in the page instead of the box. Days that can't be chosen: min and max, data-weekdays (ISO     */
  /* days, 1 is Monday: "1-5"), data-unavailable (dates and start/end    */
  /* ranges: "2025-12-25 2025-12-29/2026-01-02") and                     */
  /* input.canonUnavailable, a function the app sets (an ISO date in,    */
  /* true when it can't be chosen). A typed date that can't be chosen is */
  /* invalid (setCustomValidity), as min and max are natively.           */
  /* ------------------------------------------------------------------ */

  const pad2 = (n) => String(n).padStart(2, "0");
  const toIso = (date) => `${String(date.getFullYear()).padStart(4, "0")}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  /* Noon, so a time zone change never moves the day. */
  const makeDate = (year, month, day) => {
    const date = new Date(2000, 0, 1, 12);
    date.setFullYear(year, month, day);
    return date;
  };
  const fromIso = (iso) => {
    const match = /^(\d{4,})-(\d{2})-(\d{2})$/.exec(iso ?? "");
    if (!match) return null;
    const date = makeDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return toIso(date) === iso ? date : null;
  };
  const addDays = (date, n) => makeDate(date.getFullYear(), date.getMonth(), date.getDate() + n);
  const addMonths = (date, n) => {
    const first = makeDate(date.getFullYear(), date.getMonth() + n, 1);
    const last = makeDate(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    return makeDate(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), last));
  };
  const isoWeekday = (date) => ((date.getDay() + 6) % 7) + 1;
  /* The week starts on data-week-start (1-7), else the language's first day. */
  const weekStartOf = (element, lang) => {
    const own = Number(element.closest("[data-week-start]")?.dataset.weekStart);
    if (own >= 1 && own <= 7) return own;
    try {
      const locale = new Intl.Locale(lang ?? new Intl.DateTimeFormat().resolvedOptions().locale);
      const first = (locale.getWeekInfo?.() ?? locale.weekInfo)?.firstDay;
      if (first) return first;
    } catch {}
    return 1;
  };
  const parseWeekdays = (value) => {
    const days = new Set();
    for (const part of (value ?? "").split(/[\s,]+/).filter(Boolean)) {
      const [from, to = from] = part.split("-").map(Number);
      for (let day = Math.max(1, from); day <= Math.min(7, to); day++) days.add(day);
    }
    return days.size ? days : null;
  };
  const parseRanges = (value) => (value ?? "").split(/[\s,]+/).filter(Boolean)
    .map((part) => { const [from, to = from] = part.split("/"); return [from, to]; })
    .filter(([from, to]) => fromIso(from) && fromIso(to));
  /* ISO weeks (what <input type="week"> holds: 2025-W42): Monday first;
     a week belongs to the year of its Thursday. */
  const isoWeekOf = (date) => {
    const thursday = addDays(date, 4 - isoWeekday(date));
    const year = thursday.getFullYear();
    const week = Math.floor((thursday - makeDate(year, 0, 1)) / 864e5 / 7) + 1;
    return { year, week };
  };
  const weekValue = ({ year, week }) => `${String(year).padStart(4, "0")}-W${pad2(week)}`;
  const weeksIn = (year) => isoWeekOf(makeDate(year, 11, 28)).week;
  const fromWeek = (value) => {
    const match = /^(\d{4,})-W(\d{2})$/.exec(value ?? "");
    if (!match) return null;
    const year = Number(match[1]);
    const week = Number(match[2]);
    return week >= 1 && week <= weeksIn(year) ? { year, week } : null;
  };
  const mondayOf = ({ year, week }) => {
    const fourth = makeDate(year, 0, 4);
    return addDays(fourth, (week - 1) * 7 - (isoWeekday(fourth) - 1));
  };

  /* The calendar: one month or more side by side, each a header (previous
     on the first, next on the last; one month's title zooms out to months
     and years) and a grid; with a range, a column of presets. Its owner
     says what is chosen and what can't be, and takes the picks: one date
     (isSelected, pick) or a range (range.get, range.set, range.done). */
  let calendarCount = 0;
  const makeCalendar = (owner, { lang, weekStart, months = 1, header = "zoom", isUnavailable, isWeekdayOff, bounds, isSelected, pick, range, week, presets = [] }) => {
    const id = `canon-calendar-${++calendarCount}`;
    const label = (key, fallback) => text(owner, key, fallback);
    const format = (options) => new Intl.DateTimeFormat(lang, options);
    const formats = {
      title: format({ month: "short", year: "numeric" }),
      monthYear: format({ month: "long", year: "numeric" }),
      month: format({ month: "long" }),
      year: format({ year: "numeric" }),
      day: format({ day: "numeric" }),
      full: format({ weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      weekday: format({ weekday: "short" }),
      weekdayLong: format({ weekday: "long" }),
    };
    const element = document.createElement("div");
    element.className = "canon-calendar";
    element.id = id;
    const makeButton = (emphasis, icon) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "canon-button";
      button.dataset.emphasis = emphasis;
      if (icon) {
        button.dataset.display = "icon";
        const glyph = document.createElement("span");
        glyph.className = "canon-icon";
        glyph.dataset.icon = icon;
        glyph.setAttribute("aria-hidden", "true");
        button.append(glyph);
      }
      const name = document.createElement("span");
      name.className = "canon-button-label";
      button.append(name);
      return button;
    };
    const named = (button, value) => { button.querySelector(".canon-button-label").textContent = value; };
    const spacer = () => Object.assign(document.createElement("span"), { className: "canon-calendar-spacer" });

    /* One month zooms (its title is a button); several, or weeks, show
       plain titles. Weeks add a column of week numbers (for the pointer;
       the keyboard picks a week by any of its days). */
    const selects = months === 1 && header === "select";
    const zoomable = months === 1 && !week && !selects;
    const panes = [];
    for (let i = 0; i < months; i++) {
      const pane = document.createElement("div");
      pane.className = "canon-calendar-month";
      const header = document.createElement("div");
      header.className = "canon-calendar-header";
      const previous = i === 0 ? makeButton("minimal", "chevron-left") : spacer();
      const next = i === months - 1 ? makeButton("minimal", "chevron-right") : spacer();
      const title = zoomable ? makeButton("low") : document.createElement("span");
      title.classList.add("canon-calendar-title");
      title.id = `${id}-title-${i}`;
      /* data-header="select": the month and the year as two Selects; the
         title stays, hidden, naming the grid. */
      if (selects) {
        const pair = document.createElement("div");
        pair.className = "canon-calendar-selects";
        for (const [key, fallback] of [["date-month", "Month"], ["date-year", "Year"]]) {
          const box = document.createElement("div");
          box.className = "canon-select";
          const select = document.createElement("select");
          select.setAttribute("aria-label", label(key, fallback));
          select.dataset.part = key === "date-month" ? "month" : "year";
          box.append(select);
          pair.append(box);
        }
        title.hidden = true;
        header.append(previous, pair, title, next);
      } else header.append(previous, title, next);
      const grid = document.createElement("table");
      grid.className = "canon-calendar-grid";
      grid.setAttribute("role", "grid");
      grid.setAttribute("aria-labelledby", title.id);
      let weeks = null;
      if (week) {
        weeks = document.createElement("table");
        weeks.className = "canon-calendar-weeks";
        weeks.setAttribute("aria-hidden", "true");
        const body = document.createElement("div");
        body.className = "canon-calendar-body";
        body.append(weeks, grid);
        pane.append(header, body);
      } else pane.append(header, grid);
      element.append(pane);
      panes.push({ title, grid, weeks });
    }
    const previous = element.querySelector(".canon-calendar-header > .canon-button");
    const next = [...element.querySelectorAll(".canon-calendar-header > .canon-button")].at(-1);
    const titleText = (pane) => (zoomable ? pane.title.querySelector(".canon-button-label") : pane.title).textContent;
    const setTitle = (pane, value) => { if (zoomable) named(pane.title, value); else pane.title.textContent = value; };

    let presetButtons = [];
    if (presets.length) {
      const column = document.createElement("div");
      column.className = "canon-calendar-presets";
      column.setAttribute("role", "group");
      column.setAttribute("aria-label", label("presets", "Presets"));
      presetButtons = presets.map((preset) => {
        const button = makeButton("minimal");
        named(button, preset.label);
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => {
          const [from, to] = preset.range();
          anchor = null;
          hover = null;
          range.set(from, to);
          if (fromIso(from)) {
            cursor = fromIso(from);
            first = makeDate(cursor.getFullYear(), cursor.getMonth(), 1);
          }
          render(false);
          range.done?.();
        });
        column.append(button);
        return [button, preset];
      });
      element.append(column);
    }

    let view = "days";
    const today = () => makeDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    let cursor = today();
    let first = makeDate(cursor.getFullYear(), cursor.getMonth(), 1);
    /* A range in the making: its first day, and the day it would end on. */
    let anchor = null;
    let hover = null;
    const yearIso = (year) => String(year).padStart(4, "0");
    const monthOff = (year, month) => {
      const { min, max } = bounds();
      return (max && toIso(makeDate(year, month, 1)) > max) || (min && toIso(makeDate(year, month + 1, 0)) < min);
    };
    const yearOff = (year) => {
      const { min, max } = bounds();
      return (max && `${yearIso(year)}-01-01` > max) || (min && `${yearIso(year)}-12-31` < min);
    };
    /* The months shown follow the focused day. */
    const keepInView = () => {
      const month = makeDate(cursor.getFullYear(), cursor.getMonth(), 1);
      if (zoomable || month < first) first = month;
      else if (month > addMonths(first, months - 1)) first = addMonths(month, -(months - 1));
    };
    /* Two letters in English (Su, Mo); where short names run long (Arabic
       has none shorter than the full name), the narrow ones. */
    const narrowWeekday = format({ weekday: "narrow" });
    const weekdayText = (date) => {
      const short = formats.weekday.format(date).replace(/\.$/, "");
      if (/^en\b/i.test(formats.weekday.resolvedOptions().locale)) return short.slice(0, 2);
      return [...short].length > 3 ? narrowWeekday.format(date) : short;
    };
    const cell = (content, name, focusable) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "canon-calendar-cell";
      button.tabIndex = focusable ? 0 : -1;
      button.textContent = content;
      button.dataset.name = name;
      button.setAttribute("aria-label", name);
      const td = document.createElement("td");
      td.append(button);
      return [td, button];
    };
    const rows = (count, columns, build) => {
      const body = document.createElement("tbody");
      for (let r = 0; r < count; r++) {
        const tr = document.createElement("tr");
        for (let c = 0; c < columns; c++) tr.append(build(r * columns + c));
        body.append(tr);
      }
      return body;
    };
    const days = (pane, year, month) => {
      pane.weeks?.replaceChildren();
      setTitle(pane, formats.title.format(makeDate(year, month, 1)));
      if (zoomable) pane.title.setAttribute("aria-label", fill(label("show-months", "{value}, choose a month"), { value: titleText(pane) }));
      const head = document.createElement("thead");
      const tr = document.createElement("tr");
      for (let i = 0; i < 7; i++) {
        const weekday = ((weekStart - 1 + i) % 7) + 1;
        const sample = makeDate(2024, 0, weekday); /* 2024-01-01 is a Monday */
        const th = document.createElement("th");
        th.scope = "col";
        th.abbr = formats.weekdayLong.format(sample);
        th.textContent = weekdayText(sample);
        if (isWeekdayOff(weekday)) th.dataset.unavailable = "";
        tr.append(th);
      }
      head.append(tr);
      const start = makeDate(year, month, 1);
      const offset = (isoWeekday(start) - weekStart + 7) % 7;
      const from = addDays(start, -offset);
      /* Always six weeks, the next month's days filling the end, so the
         calendar keeps its height from month to month. */
      const count = 6;
      const todayIso = toIso(new Date());
      const focused = toIso(cursor);
      if (pane.weeks) {
        const weeksHead = document.createElement("thead");
        const headRow = document.createElement("tr");
        const th = document.createElement("th");
        th.textContent = label("week-column", "W");
        headRow.append(th);
        weeksHead.append(headRow);
        pane.weeks.append(weeksHead, rows(count, 1, (r) => {
          const value = weekValue(isoWeekOf(addDays(from, r * 7)));
          const [td, button] = cell(String(Number(value.slice(-2))), value, false);
          button.dataset.week = value;
          return td;
        }));
      }
      pane.grid.append(head, rows(count, 7, (i) => {
        const date = addDays(from, i);
        const iso = toIso(date);
        const inMonth = date.getMonth() === month;
        const [td, button] = cell(formats.day.format(date), formats.full.format(date), iso === focused && inMonth);
        button.dataset.date = iso;
        if (!inMonth) button.dataset.outside = "";
        if (isUnavailable(iso)) button.setAttribute("aria-disabled", "true");
        if (iso === todayIso) button.setAttribute("aria-current", "date");
        return td;
      }));
    };

    /* What is chosen: the value, or the range (with the one being made). */
    const paint = () => {
      let low = "";
      let high = "";
      if (range) {
        const [from, to] = range.get();
        if (anchor) [low, high] = [anchor, hover ?? anchor].sort();
        else [low, high] = [from, to || from];
      }
      for (const button of element.querySelectorAll(".canon-calendar-cell[data-date]")) {
        const td = button.parentElement;
        const iso = button.dataset.date;
        let chosen;
        if (range) {
          const inside = !!low && iso >= low && iso <= high;
          chosen = inside && !anchor;
          td.toggleAttribute("data-in-range", inside);
          td.toggleAttribute("data-range-start", inside && iso === low);
          td.toggleAttribute("data-range-end", inside && iso === high);
          td.toggleAttribute("data-preview", inside && !!anchor && iso !== anchor);
          const end = inside && low !== high && (iso === low ? "range-start" : iso === high ? "range-end" : "");
          button.setAttribute("aria-label", end ? fill(label(end, end === "range-start" ? "{value}, start" : "{value}, end"), { value: button.dataset.name }) : button.dataset.name);
        } else if (week) {
          chosen = weekValue(isoWeekOf(fromIso(iso))) === week.get();
          td.toggleAttribute("data-in-week", chosen);
        } else chosen = isSelected(iso);
        if (chosen) td.setAttribute("aria-selected", "true");
        else td.removeAttribute("aria-selected");
      }
      if (week) {
        for (const button of element.querySelectorAll(".canon-calendar-weeks [data-week]")) {
          button.parentElement.toggleAttribute("data-selected", button.dataset.week === week.get());
        }
      }
      if (range) {
        const [from, to] = range.get();
        for (const [button, preset] of presetButtons) {
          const [a, b] = preset.range();
          button.setAttribute("aria-pressed", String(!anchor && a === from && b === to));
        }
      }
    };

    const render = (focus) => {
      element.dataset.view = view;
      for (const pane of panes) pane.grid.replaceChildren();
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const now = new Date();
      const [pane] = panes;
      if (view === "days") {
        keepInView();
        panes.forEach((each, i) => {
          const shown = addMonths(first, i);
          days(each, shown.getFullYear(), shown.getMonth());
        });
        if (selects) fillSelects();
        named(previous, label("previous-month", "Previous month"));
        named(next, label("next-month", "Next month"));
        previous.disabled = !!monthOff(first.getFullYear(), first.getMonth() - 1);
        const last = addMonths(first, months - 1);
        next.disabled = !!monthOff(last.getFullYear(), last.getMonth() + 1);
        paint();
      } else if (view === "months") {
        named(pane.title, formats.year.format(cursor));
        pane.title.setAttribute("aria-label", fill(label("show-years", "{value}, choose a year"), { value: titleText(pane) }));
        named(previous, label("previous-year", "Previous year"));
        named(next, label("next-year", "Next year"));
        previous.disabled = !!yearOff(year - 1);
        next.disabled = !!yearOff(year + 1);
        pane.grid.append(rows(4, 3, (i) => {
          const date = makeDate(year, i, 1);
          const [td, button] = cell(formats.month.format(date), formats.monthYear.format(date), i === month);
          button.dataset.month = String(i);
          if (monthOff(year, i)) button.setAttribute("aria-disabled", "true");
          if (year === now.getFullYear() && i === now.getMonth()) button.setAttribute("aria-current", "date");
          if (isSelected(toIso(date).slice(0, 7))) td.setAttribute("aria-selected", "true");
          return td;
        }));
      } else {
        const start = Math.floor(year / 10) * 10;
        named(pane.title, `${formats.year.format(makeDate(start, 0, 1))} - ${formats.year.format(makeDate(start + 10, 0, 1))}`);
        pane.title.setAttribute("aria-label", fill(label("show-days", "{value}, back to days"), { value: titleText(pane) }));
        named(previous, label("previous-years", "Earlier years"));
        named(next, label("next-years", "Later years"));
        previous.disabled = !!yearOff(start - 1);
        next.disabled = !!yearOff(start + 11);
        pane.grid.append(rows(3, 4, (i) => {
          const value = start - 1 + i;
          const date = makeDate(value, 0, 1);
          const [td, button] = cell(formats.year.format(date), formats.year.format(date), value === year);
          button.dataset.year = String(value);
          if (value < start) button.dataset.outside = "";
          if (yearOff(value)) button.setAttribute("aria-disabled", "true");
          if (value === now.getFullYear()) button.setAttribute("aria-current", "date");
          if (isSelected(yearIso(value))) td.setAttribute("aria-selected", "true");
          return td;
        }));
      }
      /* Another month (or year, or decade) in the same view: the calendar
         turns that way (data-turning="next" or "previous"). */
      const page = view === "days" ? first.getFullYear() * 12 + first.getMonth() : view === "months" ? year : Math.floor(year / 10);
      if (shownPage && shownPage.view === view && shownPage.page !== page) markMotion(element, "data-turning", page > shownPage.page ? "next" : "previous");
      shownPage = { view, page };
      if (focus) element.querySelector(".canon-calendar-grid [tabindex='0']")?.focus(focus);
    };
    let shownPage = null;

    /* The month and year Selects: every month (those outside min / max
       off), years from min to max (else a century back and ten ahead). */
    const fillSelects = () => {
      const year = first.getFullYear();
      const month = first.getMonth();
      const monthSelect = element.querySelector(".canon-calendar-selects select[data-part='month']");
      const yearSelect = element.querySelector(".canon-calendar-selects select[data-part='year']");
      const shortMonth = format({ month: "short" });
      monthSelect.replaceChildren(...Array.from({ length: 12 }, (_, i) => {
        const option = new Option(shortMonth.format(makeDate(year, i, 1)), String(i), false, i === month);
        option.disabled = !!monthOff(year, i);
        return option;
      }));
      const { min, max } = bounds();
      const now = new Date().getFullYear();
      const from = Math.min(year, min ? Number(min.slice(0, 4)) : now - 100);
      const to = Math.max(year, max ? Number(max.slice(0, 4)) : now + 10);
      yearSelect.replaceChildren(...Array.from({ length: to - from + 1 }, (_, i) =>
        new Option(formats.year.format(makeDate(from + i, 0, 1)), String(from + i), false, from + i === year)));
    };
    if (selects) {
      element.querySelector(".canon-calendar-selects").addEventListener("change", (event) => {
        const select = event.target;
        const year = select.dataset.part === "year" ? Number(select.value) : cursor.getFullYear();
        const month = select.dataset.part === "month" ? Number(select.value) : cursor.getMonth();
        cursor = makeDate(year, month, Math.min(cursor.getDate(), makeDate(year, month + 1, 0).getDate()));
        first = makeDate(year, month, 1);
        render(false);
        select.focus();
      });
    }

    /* Months and years keep the day where they can. */
    const atMonth = (year, month) => makeDate(year, month, Math.min(cursor.getDate(), makeDate(year, month + 1, 0).getDate()));
    const step = (direction) => {
      if (view === "days") {
        first = addMonths(first, direction);
        cursor = addMonths(cursor, direction);
      } else cursor = addMonths(cursor, direction * (view === "months" ? 12 : 120));
      render(false);
      announce(panes.map(titleText).join(", "));
    };
    previous.addEventListener("click", () => step(-1));
    next.addEventListener("click", () => step(1));
    if (zoomable) {
      panes[0].title.addEventListener("click", () => {
        view = { days: "months", months: "years", years: "days" }[view];
        render(false);
      });
    }
    element.addEventListener("click", (event) => {
      const number = event.target.closest?.(".canon-calendar-weeks [data-week]");
      if (number && week) {
        week.set(number.dataset.week);
        cursor = mondayOf(fromWeek(number.dataset.week));
        render(false);
        week.done?.();
        return;
      }
      const button = event.target.closest?.(".canon-calendar-grid .canon-calendar-cell");
      if (!button || button.getAttribute("aria-disabled") === "true") return;
      const focus = { focusVisible: event.detail === 0 };
      if (view === "days") {
        const iso = button.dataset.date;
        cursor = fromIso(iso);
        if (range) {
          if (!anchor) {
            anchor = iso;
            hover = iso;
            range.set(iso, "");
            render(focus);
          } else {
            const [from, to] = [anchor, iso].sort();
            anchor = null;
            hover = null;
            range.set(from, to);
            render(focus);
            range.done?.();
          }
          return;
        }
        if (week) {
          week.set(weekValue(isoWeekOf(cursor)));
          render(focus);
          week.done?.();
          return;
        }
        pick(iso);
        render(owner.contains(document.activeElement) || element.contains(document.activeElement) ? focus : false);
      } else if (view === "months") {
        cursor = atMonth(cursor.getFullYear(), Number(button.dataset.month));
        view = "days";
        render(focus);
      } else {
        cursor = atMonth(Number(button.dataset.year), cursor.getMonth());
        view = "months";
        render(focus);
      }
    });
    /* While a range is being made, the pointer shows where it would end. */
    element.addEventListener("pointerover", (event) => {
      const iso = event.target.closest?.(".canon-calendar-cell[data-date]")?.dataset.date;
      if (!anchor || !iso || iso === hover) return;
      hover = iso;
      paint();
    });
    element.addEventListener("keydown", (event) => {
      if (!event.target.closest?.(".canon-calendar-grid")) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const rtl = getComputedStyle(element).direction === "rtl";
      const across = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1 }[event.key];
      const page = { PageUp: -1, PageDown: 1 }[event.key];
      let target = null;
      if (view === "days") {
        const column = (isoWeekday(cursor) - weekStart + 7) % 7;
        if (across) target = addDays(cursor, across);
        else if (event.key === "ArrowUp" || event.key === "ArrowDown") target = addDays(cursor, event.key === "ArrowUp" ? -7 : 7);
        else if (event.key === "Home") target = addDays(cursor, -column);
        else if (event.key === "End") target = addDays(cursor, 6 - column);
        else if (page) target = addMonths(cursor, page * (event.shiftKey ? 12 : 1));
      } else {
        const unit = view === "months" ? 1 : 12;
        const columns = view === "months" ? 3 : 4;
        const shift = (n) => addMonths(cursor, n * unit);
        if (across) target = shift(across);
        else if (event.key === "ArrowUp" || event.key === "ArrowDown") target = shift(event.key === "ArrowUp" ? -columns : columns);
        else if (page) target = shift(page * (view === "months" ? 12 : 10));
        else if (event.key === "Home" && view === "months") target = atMonth(cursor.getFullYear(), 0);
        else if (event.key === "End" && view === "months") target = atMonth(cursor.getFullYear(), 11);
      }
      if (!target) return;
      event.preventDefault();
      cursor = target;
      if (anchor) hover = toIso(cursor);
      render({ focusVisible: true });
    });

    return {
      element,
      /* Days at a date (the value, else today, kept within min and max),
         optionally focused. A range in the making is dropped. */
      show(iso, focus = false) {
        const { min, max } = bounds();
        let date = fromIso(iso) ?? today();
        if (min && toIso(date) < min) date = fromIso(min);
        if (max && toIso(date) > max) date = fromIso(max);
        cursor = date;
        first = makeDate(date.getFullYear(), date.getMonth(), 1);
        view = "days";
        anchor = null;
        hover = null;
        render(focus);
      },
      refresh() { render(false); },
      focus(options = {}) { element.querySelector(".canon-calendar-grid [tabindex='0']")?.focus(options); },
    };
  };

  const dateBoxes = new WeakSet();
  let dateCount = 0;

  /* The field's parts: day, month and year in the language's order, with
     its separators (10.10.2025, 10/10/2025, 2025-10-10). */
  const dateParts = (lang) => new Intl.DateTimeFormat(lang, { day: "2-digit", month: "2-digit", year: "numeric" })
    .formatToParts(makeDate(2025, 10, 23))
    .filter((part) => ["day", "month", "year", "literal"].includes(part.type))
    .map((part) => ({ type: part.type, value: part.value.replace(/[‎‏؜]/g, "") }));
  /* A week's parts: the week-format string ("Week {week}, {year}"). */
  const weekParts = (template) => template.split(/(\{week\}|\{year\})/).filter(Boolean)
    .map((piece) => (piece === "{week}" ? { type: "week" } : piece === "{year}" ? { type: "year" } : { type: "literal", value: piece }));

  /* What each kind of field holds: its parts, how they make the input's
     value and back, and today's. */
  const fieldKinds = {
    date: {
      parts: (lang) => dateParts(lang),
      read: (value) => { const date = fromIso(value); return date && { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() }; },
      write: (p) => toIso(makeDate(p.year, p.month - 1, Math.min(p.day, makeDate(p.year, p.month, 0).getDate()))),
      today: () => { const now = new Date(); return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() }; },
      high: (type, p) => (type === "day" ? (p.month ? makeDate(p.year ?? 2000, p.month, 0).getDate() : 31) : { month: 12, year: 9999 }[type]),
    },
    week: {
      parts: (lang, label) => weekParts(label("week-format", "Week {week}, {year}")),
      read: (value) => fromWeek(value),
      write: (p) => weekValue({ year: p.year, week: Math.min(p.week, weeksIn(p.year)) }),
      today: () => isoWeekOf(new Date()),
      high: (type, p) => (type === "week" ? weeksIn(p.year ?? new Date().getFullYear()) : 9999),
    },
  };

  /* Presets: keywords (today, this-week…) or a start/end range. */
  const presetKeywords = ["all", "today", "yesterday", "this-week", "last-week", "last-7-days", "this-month", "last-month", "last-30-days", "this-year", "last-year"];
  const presetRange = (value, weekStart, bounds) => {
    const now = new Date();
    const today = makeDate(now.getFullYear(), now.getMonth(), now.getDate());
    const week = addDays(today, -((isoWeekday(today) - weekStart + 7) % 7));
    const y = today.getFullYear();
    const m = today.getMonth();
    const ranges = {
      all: () => { const { min, max } = bounds(); return [min, max]; },
      today: () => [today, today],
      yesterday: () => [addDays(today, -1), addDays(today, -1)],
      "this-week": () => [week, addDays(week, 6)],
      "last-week": () => [addDays(week, -7), addDays(week, -1)],
      "last-7-days": () => [addDays(today, -6), today],
      "this-month": () => [makeDate(y, m, 1), makeDate(y, m + 1, 0)],
      "last-month": () => [makeDate(y, m - 1, 1), makeDate(y, m, 0)],
      "last-30-days": () => [addDays(today, -29), today],
      "this-year": () => [makeDate(y, 0, 1), makeDate(y, 11, 31)],
      "last-year": () => [makeDate(y - 1, 0, 1), makeDate(y - 1, 11, 31)],
    };
    if (ranges[value]) return ranges[value]().map((date) => (typeof date === "string" ? date : toIso(date)));
    const [from, to = from] = value.split("/");
    return fromIso(from) && fromIso(to) ? [from, to].sort() : null;
  };

  /* The day strip (data-strip): as many days as fit, a week at most, in
     the page, each its weekday, number and month. A whole week starts on
     the week's first day; fewer slide. Previous and next move by the days
     shown. A click, Enter or Space picks a day (input and change); the
     arrows move along the days, past either end on to the next days;
     Home and End go to the first and last shown, Page Up and Page Down
     by the days shown. Days that can't be chosen are greyed, reachable
     but not picked. It opens at the value (else today) and follows it. */
  const makeStrip = (box, input, { lang, label, weekStart, isUnavailable, id }) => {
    const format = (options) => new Intl.DateTimeFormat(lang, options);
    const formats = {
      full: format({ weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      day: format({ day: "numeric" }),
      month: format({ month: "short" }),
      weekday: format({ weekday: "short" }),
      narrow: format({ weekday: "narrow" }),
    };
    const weekdayText = (date) => {
      const short = formats.weekday.format(date).replace(/\.$/, "");
      if (/^en\b/i.test(formats.weekday.resolvedOptions().locale)) return short.slice(0, 2);
      return [...short].length > 3 ? formats.narrow.format(date) : short;
    };
    const strip = document.createElement("div");
    strip.className = "canon-date-strip";
    strip.setAttribute("role", "group");
    const labelledBy = input.getAttribute("aria-labelledby") || [...input.labels].map((l, i) => l.id || (l.id = `${id}-label${i ? `-${i}` : ""}`)).join(" ");
    if (labelledBy) strip.setAttribute("aria-labelledby", labelledBy);
    else if (input.hasAttribute("aria-label")) strip.setAttribute("aria-label", input.getAttribute("aria-label"));
    const nav = (icon, key, fallback) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "canon-button";
      button.dataset.emphasis = "minimal";
      button.dataset.display = "icon";
      const glyph = document.createElement("span");
      glyph.className = "canon-icon";
      glyph.dataset.icon = icon;
      glyph.setAttribute("aria-hidden", "true");
      const name = document.createElement("span");
      name.className = "canon-button-label";
      name.textContent = label(key, fallback);
      button.append(glyph, name);
      return button;
    };
    const previous = nav("chevron-left", "previous-week", "Previous week");
    const next = nav("chevron-right", "next-week", "Next week");
    const days = document.createElement("div");
    days.className = "canon-date-strip-days";
    strip.append(previous, days, next);
    box.after(strip);

    const today = () => makeDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const weekOf = (date) => addDays(date, -((isoWeekday(date) - weekStart + 7) % 7));
    let cursor = fromIso(input.value) ?? today();
    let count = 7;
    let start = weekOf(cursor);
    /* The days shown: a week from its first day, else the day in hand
       near the middle; and they follow the day in hand, a page at a time. */
    const place = () => {
      start = count === 7 ? weekOf(cursor) : addDays(cursor, -Math.floor((count - 1) / 2));
    };
    const follow = () => {
      while (cursor < start) start = addDays(start, -count);
      while (cursor > addDays(start, count - 1)) start = addDays(start, count);
    };
    /* Other days than before (same count): they turn that way
       (data-turning="next" or "previous"). */
    let shown = null;
    const render = (focus) => {
      if (shown && shown.count === count && +shown.start !== +start) markMotion(strip, "data-turning", start > shown.start ? "next" : "previous");
      shown = { start, count };
      const focused = toIso(cursor);
      const todayIso = toIso(new Date());
      days.replaceChildren();
      for (let i = 0; i < count; i++) {
        const date = addDays(start, i);
        const iso = toIso(date);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "canon-date-strip-day";
        button.dataset.date = iso;
        button.tabIndex = iso === focused ? 0 : -1;
        button.setAttribute("aria-label", formats.full.format(date));
        button.setAttribute("aria-pressed", String(iso === input.value));
        if (isUnavailable(iso)) button.setAttribute("aria-disabled", "true");
        if (iso === todayIso) button.setAttribute("aria-current", "date");
        for (const [className, value] of [["weekday", weekdayText(date)], ["number", formats.day.format(date)], ["month", formats.month.format(date)]]) {
          const part = document.createElement("span");
          part.className = `canon-date-strip-${className}`;
          part.setAttribute("aria-hidden", "true");
          part.textContent = value;
          button.append(part);
        }
        days.append(button);
      }
      const { min, max } = (() => {
        const mins = [input.min].filter((v) => fromIso(v));
        const maxes = [input.max].filter((v) => fromIso(v));
        return { min: mins[0] ?? "", max: maxes[0] ?? "" };
      })();
      previous.disabled = !!min && toIso(addDays(start, -1)) < min;
      next.disabled = !!max && toIso(addDays(start, count)) > max;
      if (focus) days.querySelector("[tabindex='0']")?.focus(focus);
    };
    /* How many whole days fit beside previous and next (1 to 7); again
       whenever the space changes. */
    const fit = () => {
      const parent = strip.parentElement;
      const day = days.firstElementChild?.offsetWidth;
      if (!parent || !day) return count;
      const own = getComputedStyle(strip);
      const room = parent.clientWidth - parseFloat(getComputedStyle(parent).paddingInlineStart) - parseFloat(getComputedStyle(parent).paddingInlineEnd);
      const chrome = parseFloat(own.paddingInlineStart) + parseFloat(own.paddingInlineEnd)
        + parseFloat(own.borderInlineStartWidth) + parseFloat(own.borderInlineEndWidth)
        + previous.offsetWidth + next.offsetWidth + 2 * parseFloat(own.columnGap || 0);
      return Math.max(1, Math.min(7, Math.floor((room - chrome) / day)));
    };
    const refit = () => {
      const fits = fit();
      if (fits === count) return;
      count = fits;
      place();
      render(false);
    };
    const pick = (iso) => {
      if (input.value === iso) return;
      input.value = iso;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const step = (direction) => {
      start = addDays(start, direction * count);
      cursor = addDays(cursor, direction * count);
      render(false);
      announce(count === 1 ? formats.full.format(start) : `${formats.full.format(start)} – ${formats.full.format(addDays(start, count - 1))}`);
    };
    previous.addEventListener("click", () => step(-1));
    next.addEventListener("click", () => step(1));
    days.addEventListener("click", (event) => {
      const button = event.target.closest?.(".canon-date-strip-day");
      if (!button || button.getAttribute("aria-disabled") === "true" || input.disabled || input.readOnly) return;
      cursor = fromIso(button.dataset.date);
      pick(button.dataset.date);
      render({ focusVisible: event.detail === 0 });
    });
    days.addEventListener("keydown", (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const rtl = getComputedStyle(strip).direction === "rtl";
      const column = Math.round((cursor - start) / 864e5);
      const moves = {
        ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1,
        Home: -column, End: count - 1 - column, PageUp: -count, PageDown: count,
      };
      if (!(event.key in moves)) return;
      event.preventDefault();
      if (event.key === "PageUp" || event.key === "PageDown") start = addDays(start, moves[event.key]);
      cursor = addDays(cursor, moves[event.key]);
      follow();
      render({ focusVisible: true });
    });
    /* Focus on a day makes it the day in hand (and the tab stop). */
    days.addEventListener("focusin", (event) => {
      const date = fromIso(event.target.dataset?.date);
      if (!date) return;
      cursor = date;
      for (const button of days.children) button.tabIndex = button === event.target ? 0 : -1;
    });
    /* The label's click lands on the hidden input: go to the strip. */
    input.addEventListener("click", () => days.querySelector("[tabindex='0']")?.focus({ focusVisible: false }));
    for (const type of ["input", "change"]) {
      input.addEventListener(type, () => {
        const date = fromIso(input.value);
        if (date) {
          cursor = date;
          if (date < start || date > addDays(start, count - 1)) place();
        }
        render(false);
      });
    }
    input.form?.addEventListener("reset", () => setTimeout(() => {
      cursor = fromIso(input.value) ?? today();
      place();
      render(false);
    }));
    const mirror = () => {
      const off = input.disabled || input.readOnly;
      strip.inert = input.disabled;
      if (off) strip.setAttribute("aria-disabled", "true");
      else strip.removeAttribute("aria-disabled");
    };
    new MutationObserver(mirror).observe(input, { attributes: true, attributeFilter: ["disabled", "readonly"] });
    mirror();
    render(false);
    refit();
    new ResizeObserver(refit).observe(strip.parentElement);
  };

  const setUpDate = (box) => {
    const found = [...box.querySelectorAll(":scope > input:is([type='date'], [type='week'])")];
    if (!found.length || dateBoxes.has(box)) return;
    dateBoxes.add(box);
    const id = `canon-date-${++dateCount}`;
    /* A week (<input type="week">: 2025-W42), a date, or a range of two
       dates. Browsers without week inputs make it a text input; canon.js
       draws it the same and checks min and max itself. */
    const kind = found[0].getAttribute("type") === "week" ? "week" : "date";
    const inputs = kind === "week" ? found.slice(0, 1) : found.slice(0, 2);
    const [input, endInput] = inputs;
    const ranged = !!endInput;
    const inline = box.hasAttribute("data-inline");
    const lang = langOf(box);
    const label = (key, fallback) => text(box, key, fallback);
    const weekStart = kind === "week" ? 1 : weekStartOf(box, lang);
    const nativeWeek = input.type === "week";

    /* min and max: the earliest and latest any input takes (a week's
       from its Monday to its Sunday). */
    const asDay = (value, end) => {
      if (kind === "date") return fromIso(value) ? value : "";
      const week = fromWeek(value);
      return week ? toIso(addDays(mondayOf(week), end ? 6 : 0)) : "";
    };
    const bounds = () => {
      const mins = inputs.map((each) => asDay(each.min, false)).filter(Boolean).sort();
      const maxes = inputs.map((each) => asDay(each.max, true)).filter(Boolean).sort();
      return { min: mins[0] ?? "", max: maxes.at(-1) ?? "" };
    };
    /* An input's own rules beyond min and max (the browser checks those). */
    const ruledOut = (each, iso) => {
      if (kind === "week") return false;
      const date = fromIso(iso);
      if (!date) return false;
      const days = parseWeekdays(each.dataset.weekdays);
      if (days && !days.has(isoWeekday(date))) return true;
      if (parseRanges(each.dataset.unavailable).some(([from, to]) => iso >= from && iso <= to)) return true;
      try { return !!each.canonUnavailable?.(iso); } catch { return false; }
    };
    const isUnavailable = (iso) => {
      const { min, max } = bounds();
      return (min && iso < min) || (max && iso > max) || inputs.some((each) => ruledOut(each, iso));
    };
    const isWeekdayOff = (day) => inputs.some((each) => { const days = parseWeekdays(each.dataset.weekdays); return !!days && !days.has(day); });

    /* data-strip: a week of days in the page, in place of the box. */
    if (box.hasAttribute("data-strip") && kind === "date" && !ranged) {
      makeStrip(box, input, { lang, label, weekStart, isUnavailable, id });
      return;
    }

    let popup;
    const segments = new Map();
    const fire = (each, value) => {
      if (each.value === value) return;
      each.value = value;
      each.dispatchEvent(new Event("input", { bubbles: true }));
      each.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const close = () => {
      if (inline) return;
      popup.hidePopover();
      segments.get(ranged ? endInput : input)?.focusFirst();
    };

    const list = ranged ? box.querySelector(":scope > datalist") : null;
    const presets = [...(list?.options ?? [])].map((option) => {
      const value = option.value.trim();
      const keyword = presetKeywords.includes(value);
      return {
        label: option.label || (keyword ? label(`preset-${value}`, value) : option.textContent.trim() || value),
        range: () => presetRange(value, weekStart, bounds) ?? ["", ""],
      };
    });

    const calendar = makeCalendar(box, {
      lang,
      weekStart,
      months: ranged ? 2 : 1,
      header: box.dataset.header === "select" ? "select" : "zoom",
      isUnavailable,
      isWeekdayOff,
      bounds,
      presets,
      ...(kind === "week" ? {
        isSelected: () => false,
        week: {
          get: () => input.value,
          set: (value) => fire(input, value),
          done: close,
        },
      } : ranged ? {
        isSelected: () => false,
        range: {
          get: () => [input.value, endInput.value],
          set: (from, to) => { fire(input, from); fire(endInput, to); },
          done: close,
        },
      } : {
        isSelected: (key) => !!input.value && input.value.startsWith(key),
        pick: (iso) => { fire(input, iso); close(); },
      }),
    });
    popup = calendar.element;
    const fieldLabel = box.closest("[role='group'][aria-labelledby]")?.getAttribute("aria-labelledby");
    const labelledBy = ranged ? fieldLabel
      : input.getAttribute("aria-labelledby") || [...input.labels].map((l, i) => l.id || (l.id = `${id}-label${i ? `-${i}` : ""}`)).join(" ");
    if (labelledBy) popup.setAttribute("aria-labelledby", labelledBy);
    else if (input.hasAttribute("aria-label") && !ranged) popup.setAttribute("aria-label", input.getAttribute("aria-label"));
    const shown = () => (kind === "week" ? (fromWeek(input.value) ? toIso(mondayOf(fromWeek(input.value))) : "") : input.value || endInput?.value);

    if (inline) {
      popup.setAttribute("role", "group");
      box.after(popup);
      calendar.show(shown());
      /* The label's click lands on a hidden input: go to the calendar. */
      for (const each of inputs) each.addEventListener("click", () => calendar.focus({ focusVisible: false }));
      const mirror = () => {
        const off = input.disabled || input.readOnly;
        popup.inert = off;
        if (off) popup.setAttribute("aria-disabled", "true");
        else popup.removeAttribute("aria-disabled");
      };
      new MutationObserver(mirror).observe(input, { attributes: true, attributeFilter: ["disabled", "readonly"] });
      mirror();
    } else {
      /* The field: canon.js draws it (the browser's own differs in every
         browser, with its own picker); each input stays underneath,
         hidden, holding its value, min / max / required and the form
         value. A range shows both, an arrow between. */
      let byPointer = false;
      const trigger = document.createElement("button");
      const open = () => {
        if (input.disabled || input.readOnly) return;
        byPointer = false;
        popup.showPopover({ source: trigger });
      };
      inputs.forEach((each, i) => {
        segments.set(each, makeDateSegments(box, each, {
          lang,
          label,
          part: ranged ? (i ? "end" : "start") : "",
          kind,
          name: (group) => {
            if (ranged) group.setAttribute("aria-labelledby", each.id || (each.id = `${id}-input-${i}`));
            else if (labelledBy) group.setAttribute("aria-labelledby", labelledBy);
            else if (each.hasAttribute("aria-label")) group.setAttribute("aria-label", each.getAttribute("aria-label"));
          },
          open,
        }));
      });
      if (ranged) {
        const arrow = document.createElement("span");
        arrow.className = "canon-icon canon-date-arrow";
        arrow.dataset.icon = "arrow-forward";
        arrow.setAttribute("aria-hidden", "true");
        box.querySelector(":scope > .canon-date-segments").after(arrow);
      }
      /* A press on the box outside the fields: the first one. */
      box.addEventListener("mousedown", (event) => {
        if (event.button !== 0 || event.target !== box && !event.target.matches(".canon-date-arrow") || input.disabled) return;
        event.preventDefault();
        segments.get(input).focusFirst();
      });

      popup.setAttribute("popover", "auto");
      popup.setAttribute("role", "dialog");
      trigger.type = "button";
      trigger.className = "canon-button canon-date-button";
      trigger.dataset.emphasis = "minimal";
      trigger.dataset.display = "icon";
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", popup.id);
      const glyph = document.createElement("span");
      glyph.className = "canon-icon";
      glyph.dataset.icon = "calendar";
      glyph.setAttribute("aria-hidden", "true");
      const buttonName = document.createElement("span");
      buttonName.className = "canon-button-label";
      buttonName.textContent = kind === "week" ? label("choose-week", "Choose week")
        : label(ranged ? "choose-dates" : "choose-date", ranged ? "Choose dates" : "Choose date");
      trigger.append(glyph, buttonName);
      trigger.popoverTargetElement = popup;
      box.append(trigger, popup);
      const anchor = `--${id}`;
      box.style.anchorName = box.style.anchorName && box.style.anchorName !== "none" ? `${box.style.anchorName}, ${anchor}` : anchor;
      popup.style.positionAnchor = anchor;
      popupAnchors.set(popup, box);

      /* The button is the popover's invoker (a second click closes it);
         the keyboard opens it from the field with Alt+Down. */
      trigger.addEventListener("pointerdown", () => { byPointer = true; });
      popup.addEventListener("beforetoggle", (event) => {
        if (event.newState === "open") calendar.show(shown());
      });
      popup.addEventListener("toggle", (event) => {
        const opened = event.newState === "open";
        trigger.setAttribute("aria-expanded", String(opened));
        if (opened) {
          calendar.focus({ focusVisible: !byPointer });
          byPointer = false;
          return;
        }
        if (document.activeElement === document.body || popup.contains(document.activeElement)) segments.get(input).focusFirst();
      });
      /* Disabled: the button too. Read-only: it stays, off (aria-disabled),
         so the box keeps its read-only look. */
      const mirror = () => {
        trigger.disabled = input.disabled;
        if (input.readOnly && !input.disabled) trigger.setAttribute("aria-disabled", "true");
        else trigger.removeAttribute("aria-disabled");
        trigger.popoverTargetElement = input.disabled || input.readOnly ? null : popup;
      };
      new MutationObserver(mirror).observe(input, { attributes: true, attributeFilter: ["disabled", "readonly"] });
      mirror();
    }

    /* Validity: an incomplete date, one the rules beyond min and max rule
       out (the browser checks min and max), an end before the start. */
    const check = () => {
      for (const each of inputs) {
        if (kind === "week") {
          const out = !nativeWeek && each.value && ((each.min && each.value < each.min) || (each.max && each.value > each.max));
          each.setCustomValidity(segments.get(each)?.incomplete() ? label("week-incomplete", "Enter a complete week.")
            : out ? label("week-unavailable", "This week can't be chosen.") : "");
          continue;
        }
        const message = segments.get(each)?.incomplete() ? label("date-incomplete", "Enter a complete date.")
          : each.value && ruledOut(each, each.value) ? label("date-unavailable", "This date can't be chosen.")
          : each === endInput && each.value && input.value && each.value < input.value ? label("date-range-order", "The end date is before the start date.")
          : "";
        each.setCustomValidity(message);
      }
    };
    for (const each of inputs) {
      for (const type of ["input", "change"]) {
        each.addEventListener(type, () => {
          segments.get(each)?.read();
          check();
          if (inline || popup.matches(":popover-open")) calendar.refresh();
        });
      }
      segments.get(each)?.onEdit(check);
    }
    input.form?.addEventListener("reset", () => setTimeout(() => {
      for (const each of inputs) segments.get(each)?.read();
      check();
      if (inline) calendar.show(shown());
    }));
    for (const each of inputs) segments.get(each)?.read();
    check();
  };

  /* The drawn field: a group of spinbuttons (day, month, year) with the
     language's separators. Digits fill a part and move on when it can't
     take more; separators move on; Up and Down step (from today when
     empty); Left and Right move; Backspace clears, then goes back. A
     complete date sets the input (input and change); clearing a part
     empties it. The input's placeholder shows while every part is empty
     and the field isn't focused (data-empty on the group). */
  const makeDateSegments = (box, input, { lang, label, part, name, open, kind = "date" }) => {
    const spec = fieldKinds[kind];
    const group = document.createElement("div");
    group.className = "canon-date-segments";
    group.setAttribute("role", "group");
    if (part) group.dataset.part = part;
    name(group);
    const pieces = spec.parts(lang, label);
    const parts = Object.fromEntries(pieces.filter((piece) => piece.type !== "literal").map((piece) => [piece.type, null]));
    const empty = () => Object.fromEntries(Object.keys(parts).map((key) => [key, null]));
    const spins = {};
    let buffer = "";
    const limits = { day: [1, 31], month: [1, 12], year: [1, 9999], week: [1, 53] };
    const monthName = new Intl.DateTimeFormat(lang, { month: "long" });
    for (const piece of pieces) {
      if (piece.type === "literal") {
        const literal = document.createElement("span");
        literal.className = "canon-date-literal";
        literal.setAttribute("aria-hidden", "true");
        literal.textContent = piece.value;
        group.append(literal);
        continue;
      }
      const spin = document.createElement("span");
      spin.className = "canon-date-segment";
      spin.dataset.type = piece.type;
      spin.setAttribute("role", "spinbutton");
      spin.tabIndex = 0;
      spin.setAttribute("aria-label", label(`date-${piece.type}`, { day: "Day", month: "Month", year: "Year", week: "Week" }[piece.type]));
      spin.setAttribute("aria-valuemin", String(limits[piece.type][0]));
      spin.setAttribute("aria-valuemax", String(limits[piece.type][1]));
      spin.inputMode = "numeric";
      spin.spellcheck = false;
      spin.setAttribute("autocorrect", "off");
      spins[piece.type] = spin;
      group.append(spin);
    }
    const order = [...group.querySelectorAll(".canon-date-segment")];
    const placeholderText = input.getAttribute("placeholder");
    if (placeholderText) {
      const hint = document.createElement("span");
      hint.className = "canon-date-placeholder";
      hint.setAttribute("aria-hidden", "true");
      hint.textContent = placeholderText;
      group.append(hint);
    }
    input.after(group);
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");

    const highOf = (type) => spec.high(type, parts);
    const render = () => {
      for (const [type, spin] of Object.entries(spins)) {
        const value = parts[type];
        const active = document.activeElement === spin && buffer;
        spin.textContent = active ? buffer
          : value == null ? label(`date-${type}-placeholder`, { day: "dd", month: "mm", year: "yyyy", week: "ww" }[type])
          : String(value).padStart(type === "year" ? 4 : 2, "0");
        spin.toggleAttribute("data-empty", value == null && !active);
        if (value == null) {
          spin.removeAttribute("aria-valuenow");
          spin.setAttribute("aria-valuetext", label("date-empty", "Empty"));
        } else {
          spin.setAttribute("aria-valuenow", String(value));
          spin.setAttribute("aria-valuetext", type === "month" ? monthName.format(makeDate(2000, value - 1, 1)) : String(value));
        }
      }
      group.toggleAttribute("data-empty", !!placeholderText && Object.values(parts).every((v) => v == null));
    };
    const edits = [];
    /* The value from outside (the calendar, the app, a reset); not our own
       commits, which would drop what is being typed. */
    let own = false;
    /* A complete date sets the input; anything less empties it. */
    const commit = () => {
      const complete = Object.values(parts).every((v) => v != null);
      const iso = complete ? spec.write(parts) : "";
      if (complete) Object.assign(parts, spec.read(iso));
      if (input.value !== iso) {
        input.value = iso;
        own = true;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        own = false;
      }
      for (const edit of edits) edit();
      render();
    };
    const partial = () => { const values = Object.values(parts); return values.some((v) => v != null) && values.some((v) => v == null); };
    const read = () => {
      if (own) return;
      Object.assign(parts, spec.read(input.value) ?? empty());
      buffer = "";
      render();
    };
    const move = (spin, by) => {
      const next = order[order.indexOf(spin) + by];
      if (next) enter(next);
      return !!next;
    };
    const editable = () => !input.disabled && !input.readOnly;
    /* Editing turns on before focus moves to a value (typing goes only to
       one that was editable as it took focus, and a phone's keyboard
       opens), and the caret goes into it. */
    const enter = (spin) => {
      spin.contentEditable = String(editable());
      spin.focus();
    };

    group.addEventListener("keydown", (event) => {
      const spin = event.target.closest?.(".canon-date-segment");
      if (!spin) return;
      const type = spin.dataset.type;
      if (event.altKey && event.key === "ArrowDown") {
        event.preventDefault();
        open();
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      /* Enter submits the form, as in a native field. */
      if (event.key === "Enter") {
        event.preventDefault();
        input.form?.requestSubmit();
        return;
      }
      const rtl = getComputedStyle(group).direction === "rtl";
      const low = limits[type][0];
      const high = highOf(type);
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(spin, (event.key === "ArrowRight") !== rtl ? 1 : -1);
        return;
      }
      if (!editable()) return;
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const current = parts[type] ?? spec.today()[type];
        const step = parts[type] == null ? 0 : event.key === "ArrowUp" ? 1 : -1;
        let value = current + step;
        if (type === "year") value = Math.min(high, Math.max(low, value));
        else if (value > high) value = low;
        else if (value < low) value = high;
        parts[type] = value;
        buffer = "";
        commit();
      }
    });
    /* Typing goes through beforeinput (the parts are editable, so phones
       bring up a keyboard; their keys don't always send keydown). */
    const typeDigit = (spin, digit) => {
      const kind = spin.dataset.type;
      const low = limits[kind][0];
      const high = highOf(kind);
      const width = kind === "year" ? 4 : 2;
      let next = buffer + digit;
      if (Number(next) > high) next = digit;
      buffer = next;
      parts[kind] = Number(buffer) >= low ? Number(buffer) : null;
      if (buffer.length >= width || Number(buffer + "0") > high) {
        buffer = "";
        commit();
        move(spin, 1);
      } else commit();
    };
    const separators = new Set([".", "/", "-", ",", " ", ...pieces.filter((p) => p.type === "literal").map((p) => p.value.trim()).filter(Boolean)]);
    group.addEventListener("beforeinput", (event) => {
      const spin = event.target.closest?.(".canon-date-segment");
      if (!spin) return;
      event.preventDefault();
      if (!editable()) return;
      const kind = spin.dataset.type;
      if (event.inputType === "insertText" || event.inputType === "insertReplacementText") {
        for (const char of event.data ?? "") {
          const current = document.activeElement.closest?.(".canon-date-segment") ?? spin;
          if (/\d/.test(char)) typeDigit(current, char);
          else if (separators.has(char) && parts[current.dataset.type] != null) {
            buffer = "";
            render();
            move(current, 1);
          }
        }
      } else if (event.inputType === "insertFromPaste" || event.inputType === "insertFromDrop") {
        /* A pasted value: its numbers in the field's order, or the input's
           own format (2025-10-10, 2025-W42). */
        const pasted = event.dataTransfer?.getData("text") ?? event.data ?? "";
        const own = spec.read(pasted.trim());
        const numbers = pasted.match(/\d+/g) ?? [];
        if (own) Object.assign(parts, own);
        else if (numbers.length === order.length) order.forEach((item, i) => { parts[item.dataset.type] = Number(numbers[i]) || null; });
        else return;
        buffer = "";
        commit();
      } else if (event.inputType.startsWith("delete")) {
        if (buffer) {
          buffer = buffer.slice(0, -1);
          parts[kind] = buffer && Number(buffer) >= 1 ? Number(buffer) : null;
        } else if (parts[kind] != null) parts[kind] = null;
        else if (event.inputType === "deleteContentBackward") move(spin, -1);
        commit();
      }
    });
    let focused = null;
    group.addEventListener("focusin", (event) => {
      if (order.includes(event.target)) caretIn(event.target, editable());
      if (event.target === focused) return;
      focused = event.target;
      buffer = "";
      render();
    });
    group.addEventListener("focusout", (event) => {
      if (order.includes(event.target)) event.target.contentEditable = "false";
      if (group.contains(event.relatedTarget)) return;
      focused = null;
      buffer = "";
      render();
      /* Leaving an incomplete date: a change, so the field's check shows. */
      if (partial()) {
        own = true;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        own = false;
      }
    });
    /* A press on the field outside its parts, or while the placeholder
       covers them, goes to the first empty one. */
    group.addEventListener("mousedown", (event) => {
      if (event.button !== 0 || input.disabled) return;
      const covered = group.hasAttribute("data-empty") && !group.matches(":focus-within");
      if (event.target.closest(".canon-date-segment") && !covered) return;
      event.preventDefault();
      focusFirst();
    });
    /* The label (and the browser's invalid check) focus the hidden input. */
    input.addEventListener("focus", () => focusFirst());
    const focusFirst = () => {
      const first = order.find((spin) => parts[spin.dataset.type] == null) ?? order[0];
      enter(first);
    };
    const mirror = () => {
      for (const spin of order) {
        spin.tabIndex = input.disabled ? -1 : 0;
        /* Editable only while focused: a press on empty space beside the
           field would otherwise land the caret, and focus, in the nearest
           part. */
        spin.contentEditable = String(editable() && spin === document.activeElement);
        if (input.disabled) spin.setAttribute("aria-disabled", "true");
        else spin.removeAttribute("aria-disabled");
        if (input.readOnly) spin.setAttribute("aria-readonly", "true");
        else spin.removeAttribute("aria-readonly");
      }
      for (const attribute of ["aria-invalid", "aria-describedby"]) {
        if (input.hasAttribute(attribute)) group.setAttribute(attribute, input.getAttribute(attribute));
        else group.removeAttribute(attribute);
      }
      if (input.required) group.setAttribute("aria-required", "true");
      else group.removeAttribute("aria-required");
    };
    new MutationObserver(mirror).observe(input, { attributes: true, attributeFilter: ["disabled", "readonly", "required", "aria-invalid", "aria-describedby"] });
    mirror();

    return {
      read,
      focusFirst,
      incomplete: partial,
      onEdit: (callback) => edits.push(callback),
    };
  };

  const setUpDates = (root) => {
    const boxes = [...(root.matches?.(".canon-date") ? [root] : []), ...(root.querySelectorAll?.(".canon-date") ?? [])];
    for (const box of boxes) setUpDate(box);
  };

  /* ------------------------------------------------------------------ */
  /* Time                                                                */
  /*                                                                     */
  /* An <input type="time"> in .canon-time (two for a range): canon.js   */
  /* draws a cell per part (hours, minutes, seconds when step is under   */
  /* a minute, AM / PM in 12-hour languages) over the hidden input. Each */
  /* cell is a frame (.canon-time-cell) holding its spinbutton           */
  /* (.canon-time-value) and two step buttons for the pointer. Digits    */
  /* fill a cell and move on; Up and Down step it (minutes and seconds   */
  /* by step, wrapping); the buttons do the same and repeat while held.  */
  /* A complete time sets the input (input and change); less empties it */
  /* and, on leaving, makes it invalid. A range's end before its start   */
  /* is invalid unless the box is data-overnight. The focused cell is    */
  /* data-active (the theme grows it).                                   */
  /* ------------------------------------------------------------------ */

  const timeBoxes = new WeakSet();
  let timeCount = 0;

  /* The language's clock: 12 or 24 hours, and its day periods. */
  const clockOf = (lang) => {
    const resolved = new Intl.DateTimeFormat(lang, { hour: "numeric" }).resolvedOptions();
    const twelve = resolved.hourCycle ? /h1[12]/.test(resolved.hourCycle) : !!resolved.hour12;
    const period = (hour) => new Intl.DateTimeFormat(lang, { hour: "numeric", hour12: true })
      .formatToParts(new Date(2000, 0, 1, hour)).find((part) => part.type === "dayPeriod")?.value ?? (hour < 12 ? "AM" : "PM");
    return { twelve, periods: [period(9), period(21)] };
  };

  const makeTimeCells = (box, input, { lang, label, part, name, clock }) => {
    const step = Number(input.getAttribute("step")) > 0 ? Number(input.getAttribute("step")) : 60;
    const withSeconds = step < 60 || /^\d\d:\d\d:\d\d/.test(input.value);
    const steps = {
      hour: step >= 3600 && step % 3600 === 0 ? step / 3600 : 1,
      minute: step >= 60 && step < 3600 ? Math.max(1, Math.round(step / 60)) : 1,
      second: step < 60 ? Math.max(1, Math.round(step)) : 1,
    };
    const types = ["hour", "minute", ...(withSeconds ? ["second"] : []), ...(clock.twelve ? ["period"] : [])];
    const limits = { hour: clock.twelve ? [1, 12] : [0, 23], minute: [0, 59], second: [0, 59], period: [0, 1] };
    const names = { hour: "Hours", minute: "Minutes", second: "Seconds", period: "AM/PM" };
    const directions = {
      up: { hour: "Later hour", minute: "Later minute", second: "Later second", period: "Switch AM/PM" },
      down: { hour: "Earlier hour", minute: "Earlier minute", second: "Earlier second", period: "Switch AM/PM" },
    };

    const group = document.createElement("div");
    group.className = "canon-time-segments";
    group.setAttribute("role", "group");
    if (part) group.dataset.part = part;
    name(group);
    const cells = {};
    const values = {};
    types.forEach((type, i) => {
      if (i && type !== "period") group.append(Object.assign(document.createElement("span"), { className: "canon-time-literal", textContent: ":" }));
      const cell = document.createElement("span");
      cell.className = "canon-time-cell";
      cell.dataset.type = type;
      const value = document.createElement("span");
      value.className = "canon-time-value";
      value.setAttribute("role", "spinbutton");
      value.tabIndex = 0;
      value.setAttribute("aria-label", label(`time-${type}`, names[type]));
      value.setAttribute("aria-valuemin", String(limits[type][0]));
      value.setAttribute("aria-valuemax", String(limits[type][1]));
      value.inputMode = type === "period" ? "text" : "numeric";
      value.spellcheck = false;
      value.setAttribute("autocorrect", "off");
      cell.append(value);
      for (const direction of ["up", "down"]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "canon-time-step";
        button.dataset.direction = direction;
        button.tabIndex = -1;
        button.setAttribute("aria-label", label(`time-step-${direction}-${type}`, directions[direction][type]));
        cell.append(button);
      }
      cells[type] = cell;
      values[type] = value;
      group.append(cell);
    });
    for (const literal of group.querySelectorAll(".canon-time-literal")) literal.setAttribute("aria-hidden", "true");
    input.after(group);
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    const order = types.map((type) => values[type]);

    const parts = Object.fromEntries(types.map((type) => [type, null]));
    let buffer = "";
    const pad = (n) => String(n).padStart(2, "0");
    const read = (value) => {
      const match = /^(\d\d):(\d\d)(?::(\d\d))?/.exec(value ?? "");
      if (!match) return null;
      const hour24 = Number(match[1]);
      return {
        hour: clock.twelve ? (hour24 % 12 || 12) : hour24,
        minute: Number(match[2]),
        ...(withSeconds ? { second: Number(match[3] ?? 0) } : {}),
        ...(clock.twelve ? { period: hour24 >= 12 ? 1 : 0 } : {}),
      };
    };
    const write = () => {
      const hour24 = clock.twelve ? (parts.hour % 12) + (parts.period ? 12 : 0) : parts.hour;
      return `${pad(hour24)}:${pad(parts.minute)}${withSeconds ? `:${pad(parts.second)}` : ""}`;
    };
    const now = () => {
      const date = new Date();
      return read(`${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`);
    };
    const render = () => {
      for (const type of types) {
        const value = parts[type];
        const typing = document.activeElement === values[type] && buffer;
        values[type].textContent = typing ? buffer
          : value == null ? label(`time-${type}-placeholder`, type === "period" ? "--" : "--")
          : type === "period" ? clock.periods[value] : pad(value);
        cells[type].toggleAttribute("data-empty", value == null && !typing);
        if (value == null) {
          values[type].removeAttribute("aria-valuenow");
          values[type].setAttribute("aria-valuetext", label("date-empty", "Empty"));
        } else {
          values[type].setAttribute("aria-valuenow", String(value));
          values[type].setAttribute("aria-valuetext", type === "period" ? clock.periods[value] : String(value));
        }
      }
    };
    const edits = [];
    let own = false;
    const commit = () => {
      const complete = types.every((type) => parts[type] != null);
      const value = complete ? write() : "";
      if (input.value !== value) {
        input.value = value;
        own = true;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        own = false;
      }
      for (const edit of edits) edit();
      render();
    };
    const partial = () => types.some((type) => parts[type] != null) && types.some((type) => parts[type] == null);
    const load = () => {
      if (own) return;
      Object.assign(parts, read(input.value) ?? Object.fromEntries(types.map((type) => [type, null])));
      buffer = "";
      render();
    };
    const editable = () => !input.disabled && !input.readOnly;
    /* Editing turns on before focus moves to a value (typing goes only to
       one that was editable as it took focus, and a phone's keyboard
       opens), and the caret goes into it. */
    const enter = (value) => {
      value.contentEditable = String(editable());
      value.focus();
    };
    const move = (value, by) => {
      const next = order[order.indexOf(value) + by];
      if (next) enter(next);
      return !!next;
    };

    /* A step: from now when empty, by step, wrapping. */
    const stepCell = (type, direction) => {
      if (!editable()) return;
      buffer = "";
      if (parts[type] == null) {
        parts[type] = now()[type];
        if (type === "minute" || type === "second") parts[type] -= parts[type] % steps[type];
      } else if (type === "period") parts.period = 1 - parts.period;
      else {
        const [low, high] = limits[type];
        const size = high - low + 1;
        const by = steps[type];
        let next = parts[type] + direction * by;
        if (direction > 0 && parts[type] % by) next = parts[type] - (parts[type] % by) + by;
        if (direction < 0 && parts[type] % by) next = parts[type] - (parts[type] % by);
        parts[type] = ((next - low) % size + size) % size + low;
      }
      commit();
    };

    group.addEventListener("keydown", (event) => {
      const value = event.target.closest?.(".canon-time-value");
      if (!value || event.altKey || event.ctrlKey || event.metaKey) return;
      const type = value.parentElement.dataset.type;
      if (event.key === "Enter") {
        event.preventDefault();
        input.form?.requestSubmit();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const rtl = getComputedStyle(group).direction === "rtl";
        move(value, (event.key === "ArrowRight") !== rtl ? 1 : -1);
      } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        stepCell(type, event.key === "ArrowUp" ? 1 : -1);
      }
    });

    /* Typing goes through beforeinput (the values are editable, so phones
       bring up a keyboard). */
    const typeDigit = (value, digit) => {
      const type = value.parentElement.dataset.type;
      if (type === "period") return;
      const [low, high] = limits[type];
      let next = buffer + digit;
      if (Number(next) > high) next = digit;
      buffer = next;
      parts[type] = Number(buffer) >= low ? Number(buffer) : null;
      if (buffer.length >= 2 || Number(buffer + "0") > high) {
        buffer = "";
        commit();
        move(value, 1);
      } else commit();
    };
    group.addEventListener("beforeinput", (event) => {
      const value = event.target.closest?.(".canon-time-value");
      if (!value) return;
      event.preventDefault();
      if (!editable()) return;
      const type = value.parentElement.dataset.type;
      if (event.inputType === "insertText" || event.inputType === "insertReplacementText") {
        for (const char of event.data ?? "") {
          const current = document.activeElement.closest?.(".canon-time-value") ?? value;
          const currentType = current.parentElement.dataset.type;
          if (/\d/.test(char)) typeDigit(current, char);
          else if (currentType === "period" && /[ap]/i.test(char)) {
            parts.period = /a/i.test(char) ? 0 : 1;
            commit();
          } else if (/[:.\s]/.test(char) && parts[currentType] != null) {
            buffer = "";
            render();
            move(current, 1);
          }
        }
      } else if (event.inputType === "insertFromPaste" || event.inputType === "insertFromDrop") {
        const pasted = (event.dataTransfer?.getData("text") ?? event.data ?? "").trim();
        const match = /(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([ap])?/i.exec(pasted);
        if (!match) return;
        let hour24 = Number(match[1]);
        if (match[4]) hour24 = (hour24 % 12) + (/p/i.test(match[4]) ? 12 : 0);
        const parsed = read(`${pad(hour24)}:${match[2]}:${match[3] ?? "00"}`);
        if (!parsed) return;
        Object.assign(parts, parsed);
        buffer = "";
        commit();
      } else if (event.inputType.startsWith("delete")) {
        if (buffer) {
          buffer = buffer.slice(0, -1);
          parts[type] = buffer && Number(buffer) >= limits[type][0] ? Number(buffer) : null;
        } else if (parts[type] != null) parts[type] = null;
        else if (event.inputType === "deleteContentBackward") move(value, -1);
        commit();
      }
    });

    /* The active cell: the one with focus (the theme grows it). */
    group.addEventListener("focusin", (event) => {
      if (order.includes(event.target)) caretIn(event.target, editable());
      buffer = "";
      for (const cell of Object.values(cells)) cell.toggleAttribute("data-active", cell.contains(event.target));
      render();
    });
    group.addEventListener("focusout", (event) => {
      if (order.includes(event.target)) event.target.contentEditable = "false";
      if (group.contains(event.relatedTarget)) return;
      for (const cell of Object.values(cells)) cell.removeAttribute("data-active");
      buffer = "";
      render();
      if (partial()) {
        own = true;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        own = false;
      }
    });

    /* The wheel over the focused cell steps it (up is later); over any
       other cell, or anywhere else, the page scrolls as usual. A mouse
       wheel's notch is a step; a trackpad's small deltas add up to one
       every 40px. */
    let wheeled = 0;
    group.addEventListener("wheel", (event) => {
      const cell = event.target.closest?.(".canon-time-cell");
      if (!cell?.hasAttribute("data-active") || !editable() || event.ctrlKey || !event.deltaY) return;
      event.preventDefault();
      if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL || Math.abs(event.deltaY) >= 50) {
        wheeled = 0;
        stepCell(cell.dataset.type, event.deltaY < 0 ? 1 : -1);
        return;
      }
      if (Math.sign(wheeled) !== Math.sign(event.deltaY)) wheeled = 0;
      wheeled += event.deltaY;
      while (Math.abs(wheeled) >= 40) {
        stepCell(cell.dataset.type, wheeled < 0 ? 1 : -1);
        wheeled -= Math.sign(wheeled) * 40;
      }
    }, { passive: false });

    /* A press on a cell focuses its value; on a step button it steps,
       repeating while held, without taking focus. */
    for (const [type, cell] of Object.entries(cells)) {
      cell.addEventListener("mousedown", (event) => {
        if (event.button !== 0 || input.disabled) return;
        event.preventDefault();
        enter(values[type]);
      });
      for (const button of cell.querySelectorAll(".canon-time-step")) {
        const direction = button.dataset.direction === "up" ? 1 : -1;
        let timer = null;
        const stop = () => { clearTimeout(timer); clearInterval(timer); timer = null; };
        button.addEventListener("pointerdown", (event) => {
          if (event.button !== 0 || !editable() || !cell.hasAttribute("data-active")) return;
          stepCell(type, direction);
          stop();
          timer = setTimeout(() => { timer = setInterval(() => stepCell(type, direction), 60); }, 400);
        });
        for (const kind of ["pointerup", "pointerleave", "pointercancel"]) button.addEventListener(kind, stop);
        /* A click without a pointer (assistive technology) steps once. */
        button.addEventListener("click", (event) => {
          if (event.detail === 0) stepCell(type, direction);
        });
      }
    }
    const focusFirst = () => {
      const first = order.find((value) => parts[value.parentElement.dataset.type] == null) ?? order[0];
      enter(first);
    };
    input.addEventListener("focus", focusFirst);

    const mirror = () => {
      for (const value of order) {
        value.tabIndex = input.disabled ? -1 : 0;
        /* Editable only while focused: a press on empty space beside the
           box would otherwise land the caret, and focus, in the nearest
           value. */
        value.contentEditable = String(editable() && value === document.activeElement);
        if (input.disabled) value.setAttribute("aria-disabled", "true");
        else value.removeAttribute("aria-disabled");
        if (input.readOnly) value.setAttribute("aria-readonly", "true");
        else value.removeAttribute("aria-readonly");
      }
      for (const attribute of ["aria-invalid", "aria-describedby"]) {
        if (input.hasAttribute(attribute)) group.setAttribute(attribute, input.getAttribute(attribute));
        else group.removeAttribute(attribute);
      }
      if (input.required) group.setAttribute("aria-required", "true");
      else group.removeAttribute("aria-required");
    };
    new MutationObserver(mirror).observe(input, { attributes: true, attributeFilter: ["disabled", "readonly", "required", "aria-invalid", "aria-describedby"] });
    mirror();

    return { load, focusFirst, incomplete: partial, onEdit: (callback) => edits.push(callback) };
  };

  const setUpTime = (box) => {
    const inputs = [...box.querySelectorAll(":scope > input[type='time']")].slice(0, 2);
    if (!inputs.length || timeBoxes.has(box)) return;
    timeBoxes.add(box);
    const id = `canon-time-${++timeCount}`;
    const [input, endInput] = inputs;
    const ranged = !!endInput;
    const lang = langOf(box);
    const label = (key, fallback) => text(box, key, fallback);
    const clock = clockOf(lang);
    const labelledBy = input.getAttribute("aria-labelledby") || [...input.labels].map((l, i) => l.id || (l.id = `${id}-label${i ? `-${i}` : ""}`)).join(" ");
    const cells = new Map();
    inputs.forEach((each, i) => {
      cells.set(each, makeTimeCells(box, each, {
        lang,
        label,
        clock,
        part: ranged ? (i ? "end" : "start") : "",
        name: (group) => {
          if (ranged) group.setAttribute("aria-labelledby", each.id || (each.id = `${id}-input-${i}`));
          else if (labelledBy) group.setAttribute("aria-labelledby", labelledBy);
          else if (each.hasAttribute("aria-label")) group.setAttribute("aria-label", each.getAttribute("aria-label"));
        },
      }));
    });
    if (ranged) {
      const arrow = document.createElement("span");
      arrow.className = "canon-icon canon-time-arrow";
      arrow.dataset.icon = "arrow-forward";
      arrow.setAttribute("aria-hidden", "true");
      box.querySelector(":scope > .canon-time-segments").after(arrow);
    }

    /* Validity: an incomplete time, a range's end before its start (the
       browser checks min, max and step). */
    const check = () => {
      for (const each of inputs) {
        const message = cells.get(each).incomplete() ? label("time-incomplete", "Enter a complete time.")
          : each === endInput && each.value && input.value && each.value < input.value && !box.hasAttribute("data-overnight")
            ? label("time-range-order", "The end time is before the start time.")
            : "";
        each.setCustomValidity(message);
      }
    };
    for (const each of inputs) {
      for (const type of ["input", "change"]) {
        each.addEventListener(type, () => {
          cells.get(each).load();
          check();
        });
      }
      cells.get(each).onEdit(check);
    }
    input.form?.addEventListener("reset", () => setTimeout(() => {
      for (const each of inputs) cells.get(each).load();
      check();
    }));
    for (const each of inputs) cells.get(each).load();
    check();
  };

  const setUpTimes = (root) => {
    const boxes = [...(root.matches?.(".canon-time") ? [root] : []), ...(root.querySelectorAll?.(".canon-time") ?? [])];
    for (const box of boxes) setUpTime(box);
  };

  /* ------------------------------------------------------------------ */
  /* Slider and range slider                                             */
  /* ------------------------------------------------------------------ */

  const rangeSelector = ".canon-control > input[type='range']";

  const bounds = (input) => {
    const min = input.min === "" ? 0 : Number(input.min);
    const max = input.max === "" ? 100 : Number(input.max);
    return [min, max];
  };

  /* Where a value sits between min and max, 0-100. */
  const percentOf = (input, value) => {
    const [min, max] = bounds(input);
    return max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
  };

  const markAt = (input) =>
    input.list && [...input.list.options].find((o) => Number(o.value) === input.valueAsNumber);

  /* A named mark's text when the value has one ("Medium"), else the number
     in the element's language. */
  const display = (input) => {
    const option = markAt(input);
    if (option) return option.label || option.textContent.trim() || option.value;
    const lang = input.closest("[lang]")?.lang || undefined;
    try {
      return new Intl.NumberFormat(lang, { maximumFractionDigits: 20 }).format(input.valueAsNumber);
    } catch {
      return input.value;
    }
  };

  const updateSlider = (box) => {
    const [first, second] = box.querySelectorAll(":scope > input[type='range']");
    if (!first) return;
    if (second) {
      box.style.setProperty("--canon-slider-start", percentOf(first, first.valueAsNumber));
      box.style.setProperty("--canon-slider-end", percentOf(second, second.valueAsNumber));
      /* When the thumbs meet, the one that can still move goes on top. */
      const met = first.valueAsNumber >= second.valueAsNumber;
      if (met && percentOf(first, first.valueAsNumber) > 50) first.dataset.state = "front";
      else if (first.dataset.state === "front") delete first.dataset.state;
    } else {
      box.style.setProperty("--canon-slider-percent", percentOf(first, first.valueAsNumber));
    }
    /* Screen readers hear the mark's name too ("Medium", not "1"). The
       <output> only repeats the value visually (it is aria-hidden). */
    for (const input of box.querySelectorAll(":scope > input[type='range']")) {
      if (!input.list) continue;
      const option = markAt(input);
      if (option) input.setAttribute("aria-valuetext", display(input));
      else input.removeAttribute("aria-valuetext");
    }
    for (const output of box.querySelectorAll(":scope > output[for]")) {
      const input = document.getElementById(output.htmlFor[0]);
      if (input?.type === "range") output.value = display(input);
    }
  };

  const placeMarks = (box) => {
    const input = box.querySelector(":scope > input[type='range']");
    const list = input?.list;
    if (!list || list.parentElement !== box) return;
    for (const option of list.options) {
      option.style.setProperty("--canon-mark-percent", percentOf(input, Number(option.value)));
    }
    list.dataset.state = "placed";
  };

  /* Sizes for themes that float each value over its thumb (CSS can't
     measure them): the track's length as --canon-slider-track-length, and
     each value's width as --canon-slider-value-size, or
     --canon-slider-start-value-size / -end-value-size on a range (the
     <output> before the inputs, the one after them). All on the box. */
  const sliderSizes = new ResizeObserver((entries) => {
    for (const { target, borderBoxSize } of entries) {
      const box = target.parentElement;
      const inputs = box?.querySelectorAll(":scope > input[type='range']");
      if (!inputs?.length || !borderBoxSize?.[0]) continue;
      /* An input's inline size runs along its track, vertical ones too. */
      const name = target === inputs[0] ? "--canon-slider-track-length"
        : inputs.length < 2 ? "--canon-slider-value-size"
        : target.compareDocumentPosition(inputs[0]) & Node.DOCUMENT_POSITION_FOLLOWING ? "--canon-slider-start-value-size"
        : "--canon-slider-end-value-size";
      box.style.setProperty(name, `${borderBoxSize[0].inlineSize}px`);
    }
  });

  const setUpSliders = (root) => {
    const boxes = new Set();
    if (root.matches?.(rangeSelector)) boxes.add(root.parentElement);
    for (const input of root.querySelectorAll?.(rangeSelector) ?? []) boxes.add(input.parentElement);
    for (const box of boxes) {
      placeMarks(box);
      updateSlider(box);
      sliderSizes.observe(box.querySelector(":scope > input[type='range']"));
      for (const output of box.querySelectorAll(":scope > output[for]")) sliderSizes.observe(output);
    }
  };

  document.addEventListener("input", (event) => {
    const input = event.target;
    if (!input.matches?.(rangeSelector)) return;
    const box = input.parentElement;
    /* Range slider: the moving thumb stops at the other one. */
    const [first, second] = box.querySelectorAll(":scope > input[type='range']");
    if (second && first.valueAsNumber > second.valueAsNumber) {
      if (input === first) first.value = second.value;
      else second.value = first.value;
    }
    updateSlider(box);
  });

  /* Form resets change values without input events. */
  document.addEventListener("reset", (event) => {
    setTimeout(() => setUpSliders(event.target));
  });

  /* ------------------------------------------------------------------ */
  /* Fallback: field-sizing                                              */
  /*                                                                     */
  /* Growing textareas (data-max-lines), Number Input values, the        */
  /* pagination's page field and edit-in-place fields size to their      */
  /* content with field-sizing: content. In browsers without it (Firefox */
  /* before 152, Safari before 26.2) canon.js sizes them as they change. */
  /* ------------------------------------------------------------------ */

  const fieldSizing = CSS.supports("field-sizing", "content");
  const growingSelector = ":is(.canon-control, .canon-text-input, .canon-password, .canon-select, .canon-combobox, .canon-textarea) > textarea[data-max-lines]";
  const fittingSelector = ".canon-number > input, .canon-pagination-jump .canon-text-input > input, .canon-inline-edit";

  const fitField = (field) => {
    const style = getComputedStyle(field);
    const sum = (keys) => keys.reduce((total, key) => total + (parseFloat(style[key]) || 0), 0);
    const borderBox = style.boxSizing === "border-box";
    if (field.matches(growingSelector)) {
      field.style.blockSize = "auto";
      const height = field.scrollHeight;
      field.style.blockSize = `${borderBox ? height + sum(["borderTopWidth", "borderBottomWidth"]) : height - sum(["paddingTop", "paddingBottom"])}px`;
    } else if (field.matches(fittingSelector)) {
      const frame = borderBox ? sum(["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"]) : 0;
      const length = Math.max((field.value || field.placeholder || "").length, 1);
      field.style.inlineSize = `calc(${length + 1}ch + ${frame}px)`;
    }
  };

  const setUpFieldSizing = (root) => {
    if (fieldSizing) return;
    const fields = [...(root.querySelectorAll?.(`${growingSelector}, ${fittingSelector}`) ?? [])];
    if (root.matches?.(`${growingSelector}, ${fittingSelector}`)) fields.push(root);
    fields.forEach(fitField);
  };

  if (!fieldSizing) {
    for (const type of ["input", "change", "focusin"]) {
      document.addEventListener(type, (event) => {
        if (event.target instanceof HTMLElement) fitField(event.target);
      }, true);
    }
    document.addEventListener("reset", (event) => setTimeout(() => setUpFieldSizing(event.target)));
  }

  /* Each component's set-up, in this order, for the page and for what's
     added to it later. First: repeaters copy their first item before it
     is enhanced. A build without a component has no set-up for it
     (typeof is safe on a name that was never declared). */
  const setUps = [
    typeof setUpRepeaters === "function" && setUpRepeaters,
    typeof setUpRichs === "function" && setUpRichs,
    /* Form reveals: on the page here; what's added, below. */
    typeof syncReveals === "function" && ((root) => { if (root === document) syncReveals(document); }),
    typeof setUpMenus === "function" && setUpMenus,
    typeof setUpNumbers === "function" && setUpNumbers,
    typeof setUpToolbars === "function" && setUpToolbars,
    typeof setUpSteadySelects === "function" && setUpSteadySelects,
    typeof setUpTables === "function" && setUpTables,
    typeof setUpCodeBlocks === "function" && setUpCodeBlocks,
    typeof setUpDataTables === "function" && setUpDataTables,
    typeof setUpPaginations === "function" && setUpPaginations,
    typeof setUpLoadMores === "function" && setUpLoadMores,
    typeof setUpFilterBars === "function" && setUpFilterBars,
    typeof setUpCommandPalettes === "function" && setUpCommandPalettes,
    typeof setUpNavLists === "function" && setUpNavLists,
    typeof setUpTopBars === "function" && setUpTopBars,
    typeof setUpPageHeaders === "function" && setUpPageHeaders,
    typeof setUpTabLists === "function" && setUpTabLists,
    typeof setUpAlerts === "function" && setUpAlerts,
    typeof setUpBanners === "function" && setUpBanners,
    typeof setUpSaveBars === "function" && setUpSaveBars,
    typeof setUpSplitPanes === "function" && setUpSplitPanes,
    typeof setUpAppShells === "function" && setUpAppShells,
    typeof setUpPopovers === "function" && setUpPopovers,
    typeof setUpMenubars === "function" && setUpMenubars,
    typeof setUpSliders === "function" && setUpSliders,
    typeof setUpSwatchGroups === "function" && setUpSwatchGroups,
    typeof setUpColors === "function" && setUpColors,
    typeof setUpOtps === "function" && setUpOtps,
    typeof setUpDates === "function" && setUpDates,
    typeof setUpTimes === "function" && setUpTimes,
    typeof setUpAvatars === "function" && setUpAvatars,
    typeof setUpSpotlights === "function" && setUpSpotlights,
    typeof setUpPasswords === "function" && setUpPasswords,
    typeof setUpComboboxes === "function" && setUpComboboxes,
    typeof setUpSegments === "function" && setUpSegments,
    typeof setUpCounters === "function" && setUpCounters,
    typeof setUpFieldSizing === "function" && setUpFieldSizing,
  ].filter(Boolean);
  const hasReveals = typeof syncReveals === "function";

  for (const setUp of setUps) setUp(document);
  new MutationObserver((records) => {
    const counted = new Set();
    for (const record of records) {
      /* A Count's number changing. */
      if (record.type !== "attributes") {
        const count = (record.target.nodeType === 1 ? record.target : record.target.parentElement)?.closest?.(".canon-count");
        if (count && !counted.has(count)) {
          counted.add(count);
          markUpdated(count);
        }
        if (record.type === "characterData") continue;
      }
      if (record.type === "attributes") {
        if (record.attributeName === "maxlength") {
          if (typeof updateCounter === "function" && record.target.hasAttribute("maxlength") && record.target.matches(countedControl)) updateCounter(record.target);
        } else if (record.attributeName === "aria-busy") {
          /* Content that finished loading (a Skeleton's region, a Data
             Table) is marked data-loaded while the theme shows it in. */
          if (record.oldValue === "true" && record.target.getAttribute("aria-busy") !== "true" && !record.target.matches(".canon-button, select, progress")) markMotion(record.target, "data-loaded");
        } else if (record.attributeName === "hidden") {
          if (typeof openAlert === "function" && record.oldValue !== null && !record.target.hidden && record.target.matches(".canon-alert, .canon-banner")) openAlert(record.target);
        } else if (record.target.matches(seeded)) seedSlot(record.target);
        continue;
      }
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        for (const setUp of setUps) setUp(node);
        if (hasReveals && (node.matches(".canon-form-reveal") || node.querySelector(".canon-form-reveal"))) syncReveals(node.parentElement ?? document);
        if (typeof openAlert === "function" && node.matches(".canon-alert[role], .canon-banner[role]")) openAlert(node);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-seed", "maxlength", "hidden", "aria-busy"], attributeOldValue: true, characterData: true });

  /* ------------------------------------------------------------------ */
  /* Tooltip: name the trigger                                           */
  /*                                                                     */
  /* The browser anchors a tooltip to its trigger implicitly, but an     */
  /* implicit anchor has no name, and a theme's arrow (a pseudo-element) */
  /* needs one to aim at the trigger. Just before a tooltip opens, its   */
  /* trigger gets a unique anchor-name and the tooltip gets              */
  /* --canon-tooltip-anchor with that name.                              */
  /* ------------------------------------------------------------------ */

  const nameAnchor = (source, target) => {
    let name = anchorNames.get(source);
    if (!name) {
      name = `--canon-anchor-${++anchorCount}`;
      anchorNames.set(source, name);
      const own = source.style.anchorName;
      source.style.anchorName = own && own !== "none" ? `${own}, ${name}` : name;
    }
    target.style.setProperty("--canon-tooltip-anchor", name);
    popupAnchors.set(target, source);
    return name;
  };

  document.addEventListener("beforetoggle", (event) => {
    const tooltip = event.target;
    if (event.newState !== "open" || !tooltip.classList?.contains("canon-tooltip")) return;
    const source = event.source
      ?? (tooltip.id && document.querySelector(`[interestfor="${CSS.escape(tooltip.id)}"]`));
    if (source) nameAnchor(source, tooltip);
  }, true);

  /* ------------------------------------------------------------------ */
  /* Popover anchors                                                     */
  /*                                                                     */
  /* A popover a button opens (popovertarget, or commandfor with a       */
  /* popover command) is anchored to that button. Browsers do it         */
  /* implicitly, though not all of them yet, so where the stylesheet     */
  /* names no anchor canon.js names the button.                          */
  /*                                                                     */
  /* Fallback: browsers without anchor positioning (Chrome before 125,   */
  /* Safari before 26, Firefox before 147) would put every popover in    */
  /* the middle of the window. There canon.js places each anchored one   */
  /* itself, where the stylesheet would: under its anchor from its start */
  /* (a tooltip over it, or where data-placement says; a submenu beside  */
  /* its item), flipping to the side with more room and staying in the   */
  /* window, while it is open and the page scrolls or resizes.           */
  /* ------------------------------------------------------------------ */

  const anchorPositioning = CSS.supports("anchor-name: --canon");
  const invokers = new Map();

  document.addEventListener("click", (event) => {
    const invoker = event.target.closest?.("[popovertarget], button[commandfor]");
    const id = invoker && (invoker.getAttribute("popovertarget") ?? invoker.getAttribute("commandfor"));
    if (id) invokers.set(id, invoker);
  }, true);

  const anchorOf = (popup, event) => {
    const invoker = popup.id && invokers.get(popup.id);
    const interest = popup.id && document.querySelector(`[interestfor="${CSS.escape(popup.id)}"]`);
    const anchor = popupAnchors.get(popup) ?? event?.source ?? (invoker?.isConnected ? invoker : null) ?? interest;
    return anchor?.isConnected && anchor !== popup && !popup.contains(anchor) ? anchor : null;
  };

  /* Where each popup goes: [side, alignment], sides and alignments
     logical, in the popup's own direction. */
  const tooltipPlacements = {
    "block-start": ["top", "center"], "block-start inline-start": ["top", "start"], "block-start inline-end": ["top", "end"],
    "block-end": ["bottom", "center"], "block-end inline-start": ["bottom", "start"], "block-end inline-end": ["bottom", "end"],
    "inline-start": ["start", "center"], "inline-end": ["end", "center"],
  };
  const placementOf = (popup) => {
    if (popup.matches(".canon-tooltip")) return tooltipPlacements[popup.dataset.placement] ?? tooltipPlacements["block-start"];
    if (popup.matches(".canon-menu[data-submenu], .canon-nav-list-section > ul")) return ["end", "start"];
    if (popup.matches(".canon-menu[data-split-button]")) return ["bottom", "end"];
    return ["bottom", "start"];
  };

  const placed = new Set();
  const gaps = new WeakMap();
  const placedObserver = typeof ResizeObserver === "function" ? new ResizeObserver((entries) => entries.forEach((entry) => placePopup(entry.target))) : null;
  const popupOpen = (popup) => popup.matches(":popover-open") || (popup.parentElement?.matches("details[open]") ?? false);

  const unplacePopup = (popup) => {
    placed.delete(popup);
    placedObserver?.unobserve(popup);
    for (const property of ["position", "inset", "margin", "top", "left", "max-block-size", "min-inline-size"]) popup.style.removeProperty(property);
  };

  const placePopup = (popup) => {
    const anchor = popupAnchors.get(popup);
    if (!anchor?.isConnected || !popupOpen(popup)) return unplacePopup(popup);
    if (!gaps.has(popup)) {
      const style = getComputedStyle(popup);
      gaps.set(popup, {
        block: Math.max(parseFloat(style.marginTop) || 0, parseFloat(style.marginBottom) || 0),
        inline: Math.max(parseFloat(style.marginLeft) || 0, parseFloat(style.marginRight) || 0),
      });
    }
    const gap = gaps.get(popup);
    const a = anchor.getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const edge = 8;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const rtl = getComputedStyle(popup).direction === "rtl";
    Object.assign(popup.style, { position: "fixed", inset: "auto", margin: "0" });
    popup.style.removeProperty("max-block-size");
    if (popup.matches(".canon-combobox-popup")) popup.style.minInlineSize = `${a.width + 0.5 * rem}px`;
    else if (popup.matches(".canon-menu:not([data-submenu])")) popup.style.minInlineSize = `${Math.max(a.width + 0.5 * rem, 8 * rem)}px`;
    const scrolls = popup.matches(".canon-menu, .canon-popover, .canon-combobox-popup");
    let [side, align] = placementOf(popup);
    /* Its layout size: a theme's opening scale doesn't count. */
    const sizeOf = () => ({ width: popup.offsetWidth, height: popup.offsetHeight });
    let p = sizeOf();
    let top;
    let left;
    if (side === "top" || side === "bottom") {
      const below = vh - a.bottom - gap.block - edge;
      const above = a.top - gap.block - edge;
      if (side === "bottom" && p.height > below && above > below) side = "top";
      else if (side === "top" && p.height > above && below > above) side = "bottom";
      if (scrolls) {
        popup.style.maxBlockSize = `${Math.max(side === "bottom" ? below : above, 4 * rem)}px`;
        p = sizeOf();
      }
      top = side === "bottom" ? a.bottom + gap.block : a.top - gap.block - p.height;
      left = align === "center" ? a.left + (a.width - p.width) / 2
        : (align === "start") !== rtl ? a.left : a.right - p.width;
    } else {
      const toRight = (side === "end") !== rtl;
      const right = vw - a.right - gap.inline - edge;
      const leftRoom = a.left - gap.inline - edge;
      const goRight = toRight ? !(p.width > right && leftRoom > right) : p.width > leftRoom && right > leftRoom;
      left = goRight ? a.right + gap.inline : a.left - gap.inline - p.width;
      top = align === "center" ? a.top + (a.height - p.height) / 2 : a.top;
      if (scrolls) {
        popup.style.maxBlockSize = `${vh - 2 * edge}px`;
        p = sizeOf();
      }
    }
    popup.style.left = `${Math.max(edge, Math.min(left, vw - p.width - edge))}px`;
    popup.style.top = `${Math.max(edge, Math.min(top, vh - p.height - edge))}px`;
  };

  const trackPopup = (popup, anchor) => {
    popupAnchors.set(popup, anchor);
    placed.add(popup);
    requestAnimationFrame(() => {
      placePopup(popup);
      if (placed.has(popup)) placedObserver?.observe(popup);
    });
  };

  document.addEventListener("beforetoggle", (event) => {
    const popup = event.target;
    if (!(popup instanceof HTMLElement) || popup instanceof HTMLDialogElement || !popup.hasAttribute("popover")) return;
    if (event.newState !== "open") {
      if (anchorPositioning) return;
      /* It stays in place while a theme's closing fades it. */
      const unplace = () => { if (!popupOpen(popup)) unplacePopup(popup); };
      requestAnimationFrame(() => {
        const closing = popup.getAnimations();
        if (closing.length) Promise.all(closing.map((animation) => animation.finished)).then(unplace, unplace);
        else unplace();
      });
      return;
    }
    const anchor = anchorOf(popup, event);
    if (!anchor) return;
    if (anchorPositioning) {
      if (!popup.style.positionAnchor && ["auto", "normal"].includes(getComputedStyle(popup).positionAnchor)) {
        let name = anchorNames.get(anchor);
        if (!name) {
          name = `--canon-anchor-${++anchorCount}`;
          anchorNames.set(anchor, name);
          const own = anchor.style.anchorName;
          anchor.style.anchorName = own && own !== "none" ? `${own}, ${name}` : name;
        }
        popup.style.positionAnchor = name;
      }
      return;
    }
    trackPopup(popup, anchor);
  }, true);

  if (!anchorPositioning) {
    /* A rail's sections show their sub-pages beside them. */
    document.addEventListener("toggle", (event) => {
      const section = event.target;
      if (!section.matches?.("[data-display='icon'] details.canon-nav-list-section")) return;
      const list = section.querySelector(":scope > ul");
      const summary = section.querySelector(":scope > summary");
      if (!list || !summary) return;
      if (section.open) trackPopup(list, summary);
      else unplacePopup(list);
    }, true);

    let placeFrame = 0;
    const replacePopups = () => {
      if (placeFrame || !placed.size) return;
      placeFrame = requestAnimationFrame(() => {
        placeFrame = 0;
        placed.forEach(placePopup);
      });
    };
    addEventListener("scroll", replacePopups, { capture: true, passive: true });
    addEventListener("resize", replacePopups, { passive: true });
  }

  /* ------------------------------------------------------------------ */
  /* Polyfill: interest invokers (interestfor), for tooltips             */
  /*                                                                     */
  /* Shows the target popover after hovering or focusing its trigger,    */
  /* hides it when interest moves away (the pointer may cross onto the   */
  /* tooltip), on Escape, and when another one opens. Anchors it to the  */
  /* trigger by name, for browsers without implicit popover anchors.     */
  /* Touch is left alone: tooltips are not a touch pattern.              */
  /* ------------------------------------------------------------------ */

  if (!("interestForElement" in HTMLButtonElement.prototype)) {
    const showDelay = 500;
    const hideDelay = 250;
    let current = null;
    let timer;

    const tooltipOf = (source) => {
      const target = document.getElementById(source.getAttribute("interestfor"));
      return target?.hasAttribute("popover") ? target : null;
    };

    const hide = () => {
      clearTimeout(timer);
      if (!current) return;
      try { current.target.hidePopover(); } catch {}
      current = null;
    };

    const show = (source) => {
      clearTimeout(timer);
      const target = tooltipOf(source);
      if (!target) return;
      if (current?.target === target) return;
      hide();
      target.style.positionAnchor = nameAnchor(source, target);
      try {
        target.showPopover({ source });
      } catch {
        try { target.showPopover(); } catch { return; }
      }
      current = { source, target };
    };

    const later = (fn, delay) => {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };

    const sourceIn = (node) => node?.closest?.("[interestfor]");
    const inCurrent = (node) => current && (current.source.contains(node) || current.target.contains(node));

    document.addEventListener("pointerover", (event) => {
      if (event.pointerType === "touch") return;
      if (inCurrent(event.target)) return clearTimeout(timer);
      const source = sourceIn(event.target);
      if (source) later(() => show(source), current ? 0 : showDelay);
    });
    document.addEventListener("pointerout", (event) => {
      if (event.pointerType === "touch" || !current) return;
      if (inCurrent(event.relatedTarget)) return;
      if (inCurrent(event.target)) later(hide, hideDelay);
    });
    document.addEventListener("focusin", (event) => {
      const source = sourceIn(event.target);
      if (source) later(() => show(source), showDelay);
    });
    document.addEventListener("focusout", (event) => {
      if (current && !inCurrent(event.relatedTarget)) later(hide, hideDelay);
      else if (!current) clearTimeout(timer);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && current) hide();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Dialog                                                              */
  /*                                                                     */
  /* The browser opens a modal <dialog> (command="show-modal"), keeps    */
  /* focus in it, closes it on Escape and gives focus back. canon.js     */
  /* adds: where the browser lacks them, the dialog commands (show-modal,*/
  /* close, request-close) and closedby ("any": a click on the backdrop  */
  /* closes it; "none": Escape doesn't); and, opening, focus skips the   */
  /* header's close button for the body's first control (or the dialog). */
  /* ------------------------------------------------------------------ */

  const dialogCommands = {
    "show-modal": (dialog) => { if (!dialog.open) dialog.showModal(); },
    close: (dialog, source) => dialog.close(source?.value ?? undefined),
    "request-close": (dialog, source) => (dialog.requestClose ? dialog.requestClose(source?.value) : dialog.dispatchEvent(new Event("cancel", { cancelable: true })) && dialog.close(source?.value)),
  };
  if (!("command" in HTMLButtonElement.prototype)) {
    document.addEventListener("click", (event) => {
      const source = event.target.closest?.("button[commandfor][command]");
      const command = source?.getAttribute("command");
      if (!source || source.disabled || !dialogCommands[command]) return;
      const dialog = document.getElementById(source.getAttribute("commandfor"));
      if (dialog instanceof HTMLDialogElement) dialogCommands[command](dialog, source);
    });
  }
  if (!("closedBy" in HTMLDialogElement.prototype)) {
    document.addEventListener("click", (event) => {
      const dialog = event.target;
      if (!(dialog instanceof HTMLDialogElement) || !dialog.open || dialog.getAttribute("closedby") !== "any") return;
      const box = dialog.getBoundingClientRect();
      const outside = event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
      if (outside) dialog.close();
    });
    document.addEventListener("cancel", (event) => {
      if (event.target instanceof HTMLDialogElement && event.target.getAttribute("closedby") === "none") event.preventDefault();
    }, true);
  }
  const focusDialog = (dialog) => {
    if (!dialog.matches(".canon-dialog") || dialog.querySelector("[autofocus]")) return;
    const close = dialog.querySelector(".canon-dialog-header > .canon-button");
    if (document.activeElement !== close && dialog.contains(document.activeElement)) return;
    const body = dialog.querySelector(".canon-dialog-body");
    const target = (body && firstControl(body)) ?? null;
    if (target) target.focus();
    else {
      if (!dialog.hasAttribute("tabindex")) dialog.tabIndex = -1;
      dialog.focus();
    }
  };
  document.addEventListener("toggle", (event) => {
    if (event.target instanceof HTMLDialogElement && event.newState === "open") focusDialog(event.target);
  }, true);

  /* Polyfill: custom commands for browsers without invoker commands. */
  if (!("command" in HTMLButtonElement.prototype)) {
    document.addEventListener("click", (event) => {
      const source = event.target.closest?.("button[commandfor][command^='--']");
      if (!source || source.disabled) return;
      const target = document.getElementById(source.getAttribute("commandfor"));
      if (!target) return;
      const commandEvent = new Event("command", { cancelable: true });
      commandEvent.command = source.getAttribute("command");
      commandEvent.source = source;
      target.dispatchEvent(commandEvent);
    });
  }
})();
