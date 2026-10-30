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
