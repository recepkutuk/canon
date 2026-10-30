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
