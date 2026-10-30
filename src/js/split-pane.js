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
