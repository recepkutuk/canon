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
