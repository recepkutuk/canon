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

  /* @canon-part */
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
