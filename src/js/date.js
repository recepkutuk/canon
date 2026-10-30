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
