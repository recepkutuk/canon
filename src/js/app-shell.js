  /* ------------------------------------------------------------------ */
  /* Top Bar                                                             */
  /*                                                                     */
  /* Folds when its things don't fit: the search's shortcut goes (kbd),  */
  /* then its label, the Button becoming icon only (search); then the    */
  /* end's Buttons go into one More menu, but for a Button carrying a    */
  /* Count and the account (end). The sidebar's toggle never folds.      */
  /* ------------------------------------------------------------------ */

  const topBars = new WeakSet();

  const setUpTopBar = (bar) => {
    if (topBars.has(bar)) return;
    topBars.add(bar);
    const start = bar.querySelector(":scope > .canon-top-bar-start");
    const end = bar.querySelector(":scope > .canon-top-bar-end");
    const iconed = new Set();
    const searches = () => [...(start?.querySelectorAll(":scope > .canon-button") ?? [])]
      .filter((button) => button.getAttribute("command") !== "--canon-toggle-sidebar" && (iconed.has(button) || button.getAttribute("data-display") !== "icon"));
    const steps = [
      { name: "kbd", applies: () => Boolean(start?.querySelector(":scope > .canon-button > .canon-kbd")), apply() {} },
      {
        name: "search",
        applies: () => searches().length > 0,
        apply(on) {
          for (const button of searches()) {
            if (on && !iconed.has(button)) {
              iconed.add(button);
              button.setAttribute("data-display", "icon");
            } else if (!on && iconed.has(button)) {
              iconed.delete(button);
              button.removeAttribute("data-display");
            }
          }
        },
      },
      buttonFolding(bar, "end", () => [...(end?.querySelectorAll(":scope > .canon-button") ?? [])].filter((button) => !button.querySelector(":scope > .canon-count"))),
    ];
    /* While measuring (data-folding), the start's things keep their
       width, so not fitting shows as overflow. */
    const overflows = () => (start && start.scrollWidth > start.clientWidth + 1) || bar.scrollWidth > bar.clientWidth + 1;
    setUpFolding(bar, steps, overflows, () => [start, end]);
  };

  const setUpTopBars = (root) => {
    const found = [...(root.matches?.(".canon-top-bar") ? [root] : []), ...(root.querySelectorAll?.(".canon-top-bar") ?? [])];
    for (const bar of found) setUpTopBar(bar);
  };

  /* @canon-part */
  /* ------------------------------------------------------------------ */
  /* App Shell                                                           */
  /*                                                                     */
  /* Below the width its theme sets (--canon-sidebar-drawer: 1 on the    */
  /* sidebar, from a container query on the shell), the Sidebar is a     */
  /* drawer: data-drawer="closed" or "open". It takes no room and lies   */
  /* over the page at the shell's start, inside the shell (which may sit */
  /* inside something else), always open inside; a rail is one again    */
  /* when the shell widens. The toggle opens and closes it; Escape, a    */
  /* click or focus elsewhere, and choosing a page close it. Only with   */
  /* the toggle outside the sidebar (in the Top Bar): one inside would   */
  /* go with it.                                                         */
  /* ------------------------------------------------------------------ */

  const shells = new WeakSet();
  const drawers = new WeakMap();

  /* Collapse a Sidebar to its rail (data-display="icon"), or open it
     again; open or close it over the page where it is a drawer. The
     toggle says whether it is open (aria-expanded). */
  commands["--canon-toggle-sidebar"] = (target, source) => {
    /* On a narrow App Shell the sidebar is a drawer over the page. */
    if (target.hasAttribute("data-drawer")) return drawers.get(target)?.();
    const open = target.getAttribute("data-display") === "icon";
    if (open) target.removeAttribute("data-display");
    else target.setAttribute("data-display", "icon");
    source.setAttribute("aria-expanded", String(open));
  };

  const setUpAppShell = (shell) => {
    if (shells.has(shell)) return;
    shells.add(shell);
    const sidebar = shell.querySelector(":scope > .canon-sidebar");
    if (!sidebar?.id) return;
    const toggle = () => document.querySelector(`[command="--canon-toggle-sidebar"][commandfor="${CSS.escape(sidebar.id)}"]`);
    const isOpen = () => sidebar.getAttribute("data-drawer") === "open";
    let display = null;

    const setOpen = (open, refocus = false) => {
      if (!sidebar.hasAttribute("data-drawer") || open === isOpen()) return;
      sidebar.setAttribute("data-drawer", open ? "open" : "closed");
      toggle()?.setAttribute("aria-expanded", String(open));
      if (open && lastInput === "keyboard") {
        const links = [...sidebar.querySelectorAll("a[href], summary")].filter((each) => each.checkVisibility());
        (links.find((each) => each.matches("[aria-current='page']")) ?? links[0])?.focus();
      }
      if (!open && refocus) toggle()?.focus();
    };
    drawers.set(sidebar, () => setOpen(!isOpen()));

    const sync = () => {
      const button = toggle();
      const narrow = getComputedStyle(sidebar).getPropertyValue("--canon-sidebar-drawer").trim() === "1";
      const want = Boolean(narrow && button && !sidebar.contains(button));
      if (want === sidebar.hasAttribute("data-drawer")) return;
      if (want) {
        display = sidebar.getAttribute("data-display");
        sidebar.removeAttribute("data-display");
        sidebar.setAttribute("data-drawer", "closed");
        button.setAttribute("aria-expanded", "false");
      } else {
        sidebar.removeAttribute("data-drawer");
        if (display !== null) sidebar.setAttribute("data-display", display);
        button?.setAttribute("aria-expanded", String(display !== "icon"));
      }
    };

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !isOpen()) return;
      setOpen(false, sidebar.contains(document.activeElement));
    });
    document.addEventListener("click", (event) => {
      if (isOpen() && !sidebar.contains(event.target) && !toggle()?.contains(event.target)) setOpen(false);
    });
    sidebar.addEventListener("focusout", (event) => {
      const next = event.relatedTarget;
      if (isOpen() && next && !sidebar.contains(next) && !toggle()?.contains(next)) setOpen(false);
    });
    sidebar.addEventListener("click", (event) => {
      if (event.target.closest("a[href]")) setOpen(false);
    });
    new ResizeObserver(sync).observe(shell);
    sync();
  };

  const setUpAppShells = (root) => {
    const found = [...(root.matches?.(".canon-app-shell") ? [root] : []), ...(root.querySelectorAll?.(".canon-app-shell") ?? [])];
    for (const shell of found) setUpAppShell(shell);
  };
