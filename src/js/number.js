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
