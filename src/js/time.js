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
