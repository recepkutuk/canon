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
