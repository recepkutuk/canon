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
