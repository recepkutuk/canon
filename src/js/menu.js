  /* ------------------------------------------------------------------ */
  /* Menu                                                                */
  /*                                                                     */
  /* .canon-menu is a popover (role="menu") a button opens with          */
  /* popovertarget; the browser opens, closes and anchors it. canon.js   */
  /* adds the keyboard (arrows, Home / End, typing a label's start,      */
  /* Right / Left for submenus, Tab closes), focus (the first item when  */
  /* opened from the keyboard, the menu itself from a pointer), the     */
  /* pointer (hover moves the keyboard's place and opens submenus after  */
  /* a moment), checks (menuitemcheckbox flips aria-checked, a           */
  /* menuitemradio is the one checked in its group) and closing the      */
  /* whole menu after a choice, unless the click is cancelled. A menu    */
  /* opened by a menu item is a submenu (data-submenu: it opens beside   */
  /* the item); a Menubar's menus get data-menubar, a Split Button's     */
  /* data-split-button. data-contextmenu="<menu id>" on a region opens   */
  /* that menu at the pointer (or under the focused element, from the    */
  /* keyboard). Triggers get aria-expanded.                              */
  /* ------------------------------------------------------------------ */

  const menuItemSelector = "[role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio']";
  const menus = new WeakSet();
  const menuReturn = new WeakMap();
  let menuOpening = null;

  const menuOf = (element) => element.closest(".canon-menu");
  const itemsOf = (menu) =>
    [...menu.querySelectorAll(menuItemSelector)].filter((item) => menuOf(item) === menu && !item.closest("[hidden]"));
  const usableItem = (item) => !item.disabled && item.getAttribute("aria-disabled") !== "true";
  /* Several triggers can share one menu (a row's actions in every row):
     its invoker is the one that opened it (the toggle's source, or the
     trigger last clicked), else the first on the page. */
  const openedBy = new WeakMap();
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest?.("[popovertarget]");
    const menu = trigger && document.getElementById(trigger.getAttribute("popovertarget"));
    if (menu?.matches(".canon-menu")) openedBy.set(menu, trigger);
  }, true);
  const invokerOf = (menu) =>
    openedBy.get(menu)?.isConnected ? openedBy.get(menu)
      : menu.id ? document.querySelector(`[popovertarget="${CSS.escape(menu.id)}"]`) : null;
  const parentMenuOf = (menu) => {
    const invoker = invokerOf(menu);
    return invoker && menuOf(invoker) ? menuOf(invoker) : null;
  };
  const rootMenuOf = (menu) => {
    let root = menu;
    for (let parent = parentMenuOf(root); parent; parent = parentMenuOf(root)) root = parent;
    return root;
  };
  const isOpen = (menu) => menu.matches(":popover-open");
  /* Focus an item and keep it in view in a menu that scrolls. */
  const focusItem = (item) => {
    if (!item) return;
    item.focus({ preventScroll: true });
    const menu = menuOf(item);
    if (!menu) return;
    const box = menu.getBoundingClientRect();
    const at = item.getBoundingClientRect();
    const inset = parseFloat(getComputedStyle(menu).paddingBlockStart) + menu.clientTop;
    if (at.top < box.top + inset) menu.scrollTop -= box.top + inset - at.top;
    else if (at.bottom > box.bottom - inset) menu.scrollTop += at.bottom - (box.bottom - inset);
  };
  const forwardKey = (menu) => (getComputedStyle(menu).direction === "rtl" ? "ArrowLeft" : "ArrowRight");
  const backKey = (menu) => (getComputedStyle(menu).direction === "rtl" ? "ArrowRight" : "ArrowLeft");

  /* Close the whole menu, and put focus back where it came from. */
  const closeMenu = (menu) => {
    const root = rootMenuOf(menu);
    const back = menuReturn.get(root) ?? invokerOf(root);
    if (isOpen(root)) root.hidePopover();
    if (back?.isConnected) back.focus({ preventScroll: true });
  };

  /* Open an item's submenu (a click keeps the browser's anchor and
     nesting), then put the keyboard in it or leave it on the item. */
  const openSubmenu = (item, focus) => {
    const submenu = item.popoverTargetElement;
    if (!submenu) return;
    if (isOpen(submenu)) {
      if (focus) focusItem(itemsOf(submenu).filter(usableItem)[0]);
      return;
    }
    menuOpening = focus ? "first" : "stay";
    item.click();
  };

  const closeSubmenusOf = (menu) => {
    for (const item of itemsOf(menu)) {
      const submenu = item.popoverTargetElement;
      if (submenu && isOpen(submenu)) submenu.hidePopover();
    }
  };

  const setUpMenu = (menu) => {
    if (menus.has(menu)) return;
    menus.add(menu);
    if (!menu.hasAttribute("tabindex")) menu.tabIndex = -1;
    for (const item of itemsOf(menu)) item.tabIndex = -1;

    let typed = "";
    let typedAt = 0;
    let hoverTimer;

    menu.addEventListener("beforetoggle", (event) => {
      if (event.newState !== "open") return;
      if (event.source) openedBy.set(menu, event.source);
      const invoker = invokerOf(menu);
      if (invoker) {
        menu.toggleAttribute("data-submenu", Boolean(menuOf(invoker)));
        menu.toggleAttribute("data-menubar", Boolean(invoker.closest(".canon-menubar")));
        menu.toggleAttribute("data-split-button", invoker.parentElement?.matches(".canon-split-button") ?? false);
      }
      for (const item of itemsOf(menu)) item.tabIndex = -1;
    });

    menu.addEventListener("toggle", (event) => {
      const invoker = invokerOf(menu);
      if (event.newState === "open") invoker?.setAttribute("aria-expanded", "true");
      else if (menu.id) for (const trigger of document.querySelectorAll(`[popovertarget="${CSS.escape(menu.id)}"]`)) trigger.setAttribute("aria-expanded", "false");
      /* A manual popover (always open, as on a reference page) is left alone. */
      if (menu.popover === "manual") return;
      if (event.newState === "open") {
        /* Cut short where it opened (a long menu scrolls in the room it
           has, so the browser never tries the other side): open towards
           the side with more room. */
        menu.style.positionArea = "";
        if (invoker && menu.scrollHeight > menu.clientHeight + 1) {
          const at = invoker.getBoundingClientRect();
          const submenu = menu.hasAttribute("data-submenu");
          const below = innerHeight - (submenu ? at.top : at.bottom);
          const above = submenu ? at.bottom : at.top;
          if (above > below) menu.style.positionArea = submenu ? "self-inline-end span-self-block-start" : "self-block-start span-self-inline-end";
        }
        const mode = menuOpening ?? (lastInput === "keyboard" ? "first" : "menu");
        menuOpening = null;
        const items = itemsOf(menu).filter(usableItem);
        if (mode === "first") focusItem(items[0]);
        else if (mode === "last") focusItem(items.at(-1));
        else if (mode === "menu") menu.focus({ preventScroll: true });
      } else {
        clearTimeout(hoverTimer);
        const back = menuReturn.get(menu);
        menuReturn.delete(menu);
        if (back?.isConnected && (menu.contains(document.activeElement) || document.activeElement === document.body)) {
          back.focus({ preventScroll: true });
        }
      }
    });

    menu.addEventListener("keydown", (event) => {
      if (event.target !== menu && menuOf(event.target) !== menu) return;
      const items = itemsOf(menu).filter(usableItem);
      const at = items.indexOf(document.activeElement);
      const go = (index) => focusItem(items.at(index % items.length));
      const item = document.activeElement?.closest?.(menuItemSelector);
      let handled = true;
      if (event.key === "ArrowDown") go(at + 1);
      else if (event.key === "ArrowUp") go(at < 0 ? -1 : at - 1);
      else if (event.key === "Home" || event.key === "PageUp") go(0);
      else if (event.key === "End" || event.key === "PageDown") go(-1);
      else if (event.key === forwardKey(menu) && item?.popoverTargetElement) openSubmenu(item, true);
      else if (event.key === backKey(menu) && parentMenuOf(menu)) {
        const invoker = invokerOf(menu);
        menu.hidePopover();
        invoker?.focus({ preventScroll: true });
      } else if ((event.key === forwardKey(menu) || event.key === backKey(menu)) && invokerOf(rootMenuOf(menu))?.closest(".canon-menubar")) {
        /* In a menubar's menu, across to the next menu. */
        const from = invokerOf(rootMenuOf(menu));
        moveMenubar(from.closest(".canon-menubar"), from, event.key === forwardKey(menu) ? 1 : -1, true);
      } else if (event.key === "Tab") {
        closeMenu(menu);
        handled = false;
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const now = Date.now();
        typed = (now - typedAt > 600 ? "" : typed) + event.key.toLowerCase();
        typedAt = now;
        const label = (each) => (each.querySelector(".canon-menu-label") ?? each).textContent.trim().toLowerCase();
        const start = typed.length === 1 ? at + 1 : Math.max(at, 0);
        const ordered = [...items.slice(start), ...items.slice(0, start)];
        focusItem(ordered.find((each) => label(each).startsWith(typed)));
        if (event.key === " " && typed === " ") handled = false;
      } else handled = false;
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    });

    /* The pointer moves the keyboard's place; resting on an item with a
       submenu opens it, on another item closes the open one. */
    menu.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const item = event.target.closest(menuItemSelector);
      if (!item || menuOf(item) !== menu) return;
      if (!usableItem(item)) {
        if (document.activeElement !== menu) menu.focus({ preventScroll: true });
        return;
      }
      if (document.activeElement === item) return;
      item.focus({ preventScroll: true });
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        if (document.activeElement !== item) return;
        if (item.popoverTargetElement) openSubmenu(item, false);
        else closeSubmenusOf(menu);
      }, 150);
    });
    menu.addEventListener("pointerleave", (event) => {
      clearTimeout(hoverTimer);
      const item = document.activeElement?.closest?.(menuItemSelector);
      if (item && menuOf(item) === menu && !(item.popoverTargetElement && isOpen(item.popoverTargetElement)) && event.pointerType !== "touch") {
        menu.focus({ preventScroll: true });
      }
    });
    /* Reaching a submenu keeps it open. */
    menu.addEventListener("pointerenter", () => {
      const parent = parentMenuOf(menu);
      if (parent) parent.dispatchEvent(new CustomEvent("canon-menu-hold"));
    });
    menu.addEventListener("canon-menu-hold", () => clearTimeout(hoverTimer));

    /* Checks change before the click's listeners run (they read the new
       state); after them, the menu closes unless the click was cancelled. */
    menu.addEventListener("click", (event) => {
      const item = event.target.closest(menuItemSelector);
      if (!item || menuOf(item) !== menu) return;
      if (!usableItem(item)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      const role = item.getAttribute("role");
      if (role === "menuitemcheckbox") item.setAttribute("aria-checked", String(item.getAttribute("aria-checked") !== "true"));
      else if (role === "menuitemradio") {
        const scope = item.closest("[role='group']") ?? menu;
        for (const each of scope.querySelectorAll("[role='menuitemradio']")) {
          if (menuOf(each) === menu) each.setAttribute("aria-checked", String(each === item));
        }
      }
    }, true);
    menu.addEventListener("click", (event) => {
      const item = event.target.closest(menuItemSelector);
      if (!item || menuOf(item) !== menu) return;
      const submenu = item.popoverTargetElement;
      if (submenu) {
        /* An item with a submenu opens it; it never closes it. */
        if (isOpen(submenu)) event.preventDefault();
        else if (!menuOpening) menuOpening = lastInput === "keyboard" ? "first" : "stay";
        return;
      }
      if (event.defaultPrevented) return;
      closeMenu(menu);
    });
  };

  /* Menubar: one tab stop (the last item focused); Right and Left move
     along it, Home and End to its ends; Down, Up, Enter and Space open an
     item's menu. While one of its menus is open, the pointer resting on
     another item opens that one, and Right or Left in a menu (where they
     don't open or close a submenu) moves to the next menu. */
  const menubars = new WeakSet();
  const menubarItems = (bar) =>
    [...bar.querySelectorAll(".canon-menubar-item")].filter((item) => item.closest(".canon-menubar") === bar && !item.hidden);

  const moveMenubar = (bar, from, step, open) => {
    const list = menubarItems(bar).filter(usableItem);
    const next = list.at((list.indexOf(from) + step) % list.length);
    const current = from.popoverTargetElement;
    if (current && isOpen(current)) current.hidePopover();
    if (!next) return;
    next.focus({ preventScroll: true });
    if (open && next.popoverTargetElement) {
      menuOpening = "first";
      next.click();
    }
  };

  const setUpMenubar = (bar) => {
    if (menubars.has(bar)) return;
    menubars.add(bar);
    const stop = (item) => {
      for (const each of menubarItems(bar)) each.tabIndex = each === item ? 0 : -1;
    };
    stop(menubarItems(bar).find(usableItem) ?? menubarItems(bar)[0]);
    bar.addEventListener("focusin", (event) => {
      const item = event.target.closest(".canon-menubar-item");
      if (item) stop(item);
    });
    bar.addEventListener("keydown", (event) => {
      const item = event.target.closest(".canon-menubar-item");
      if (!item) return;
      const list = menubarItems(bar).filter(usableItem);
      const rtl = getComputedStyle(bar).direction === "rtl";
      let next;
      if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) next = list.at((list.indexOf(item) + 1) % list.length);
      else if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) next = list.at(list.indexOf(item) - 1);
      else if (event.key === "Home") next = list[0];
      else if (event.key === "End") next = list.at(-1);
      else return;
      event.preventDefault();
      next?.focus({ preventScroll: true });
    });
    bar.addEventListener("pointerover", (event) => {
      if (event.pointerType === "touch") return;
      const item = event.target.closest(".canon-menubar-item");
      if (!item || !usableItem(item) || !item.popoverTargetElement || isOpen(item.popoverTargetElement)) return;
      const open = menubarItems(bar).some((each) => each.popoverTargetElement && isOpen(each.popoverTargetElement));
      if (!open) return;
      item.focus({ preventScroll: true });
      menuOpening = "menu";
      item.click();
    });
  };

  const setUpMenubars = (root) => {
    const found = [...(root.matches?.(".canon-menubar") ? [root] : []), ...(root.querySelectorAll?.(".canon-menubar") ?? [])];
    for (const bar of found) setUpMenubar(bar);
  };

  const setUpMenus = (root) => {
    const found = [...(root.matches?.(".canon-menu") ? [root] : []), ...(root.querySelectorAll?.(".canon-menu") ?? [])];
    for (const menu of found) setUpMenu(menu);
  };

  /* Triggers: Down and Up open the menu at its first or last item. */
  document.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const trigger = event.target.closest?.("[aria-haspopup='menu'], [aria-haspopup='true']");
    const menu = trigger?.popoverTargetElement;
    if (!menu?.matches(".canon-menu") || menuOf(trigger)) return;
    event.preventDefault();
    const where = event.key === "ArrowDown" ? "first" : "last";
    if (isOpen(menu)) {
      const items = itemsOf(menu).filter(usableItem);
      focusItem(where === "first" ? items[0] : items.at(-1));
    } else {
      menuOpening = where;
      trigger.click();
    }
  });

  /* Context menus: at the pointer, kept inside the window. Where the menu
     event comes while the button is down (macOS), the menu opens once it
     is released: a popover opened in between would take the release for
     a click outside and close. */
  let pointerDown = false;
  document.addEventListener("pointerdown", () => { pointerDown = true; }, true);
  document.addEventListener("pointerup", () => { pointerDown = false; }, true);
  document.addEventListener("pointercancel", () => { pointerDown = false; }, true);
  document.addEventListener("contextmenu", (event) => {
    const region = event.target.closest?.("[data-contextmenu]");
    if (!region) return;
    const menu = document.getElementById(region.dataset.contextmenu);
    if (!menu?.matches(".canon-menu")) return;
    event.preventDefault();
    setUpMenu(menu);
    let x = event.clientX;
    let y = event.clientY;
    const fromKeyboard = lastInput === "keyboard" || (x === 0 && y === 0);
    if (fromKeyboard) {
      const box = event.target.getBoundingClientRect();
      x = box.left;
      y = box.bottom;
    }
    if (isOpen(menu)) menu.hidePopover();
    const back = document.activeElement;
    const open = () => {
      menuReturn.set(menu, back);
      menu.style.inset = "auto";
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
      menuOpening = fromKeyboard ? "first" : "menu";
      menu.showPopover();
      const box = menu.getBoundingClientRect();
      const margin = parseFloat(getComputedStyle(menu).marginTop) || 0;
      if (box.right > innerWidth) menu.style.left = `${Math.max(0, x - box.width)}px`;
      if (box.bottom > innerHeight) menu.style.top = `${Math.max(0, y - box.height - 2 * margin)}px`;
    };
    if (pointerDown && !fromKeyboard) document.addEventListener("pointerup", () => setTimeout(open), { once: true, capture: true });
    else open();
  });
