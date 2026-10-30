  /* ------------------------------------------------------------------ */
  /* Nav List                                                            */
  /*                                                                     */
  /* Links and native <details> work alone. canon.js opens the section   */
  /* holding the current page (aria-current) and marks its summary       */
  /* data-current, also when the app moves aria-current. In a rail       */
  /* (data-display="icon" on the list or a container) a section's        */
  /* sub-pages open beside it instead: one at a time, closing when focus */
  /* or a click goes elsewhere, on Escape (back to its summary) and on   */
  /* choosing a page; none opens by itself. Becoming a rail closes them; */
  /* leaving it opens the current page's section again.                  */
  /* ------------------------------------------------------------------ */

  const navLists = new WeakSet();
  const navListSyncs = new WeakMap();
  const inRail = (element) => element.closest("[data-display]")?.getAttribute("data-display") === "icon";

  const setUpNavList = (nav) => {
    if (navLists.has(nav)) return;
    navLists.add(nav);
    const sections = () => [...nav.querySelectorAll("details.canon-nav-list-section")];
    let rail = inRail(nav);
    const sync = () => {
      const wasRail = rail;
      rail = inRail(nav);
      for (const section of sections()) {
        const holds = Boolean(section.querySelector(":scope > ul [aria-current='page']"));
        if (rail) {
          if (!wasRail) section.open = false;
        } else if (holds && !section.open) section.open = true;
        section.querySelector(":scope > summary")?.toggleAttribute("data-current", holds);
      }
    };
    navListSyncs.set(nav, sync);
    new MutationObserver(sync).observe(nav, { subtree: true, attributes: true, attributeFilter: ["aria-current"], childList: true });

    /* The rail's open section. "toggle" doesn't bubble: listen while it
       comes down. */
    const close = (section, refocus) => {
      section.open = false;
      if (refocus) section.querySelector(":scope > summary")?.focus();
    };
    nav.addEventListener("toggle", (event) => {
      if (!rail || !event.target.matches?.("details.canon-nav-list-section") || !event.target.open) return;
      for (const other of sections()) if (other !== event.target) other.open = false;
    }, true);
    nav.addEventListener("keydown", (event) => {
      const section = rail && event.key === "Escape" && event.target.closest("details.canon-nav-list-section[open]");
      if (!section) return;
      event.preventDefault();
      close(section, true);
    });
    nav.addEventListener("focusout", (event) => {
      const section = rail && event.target.closest("details.canon-nav-list-section[open]");
      if (section && !section.contains(event.relatedTarget)) close(section);
    });
    nav.addEventListener("click", (event) => {
      const section = rail && event.target.closest(".canon-nav-list-section > ul a")?.closest("details");
      if (section) close(section);
    });
    document.addEventListener("click", (event) => {
      if (!rail) return;
      for (const section of sections()) if (section.open && !section.contains(event.target)) close(section);
    });
    sync();
  };

  /* A list becomes a rail, or stops being one, when data-display changes
     on it or a container (a Sidebar collapsing). */
  new MutationObserver((records) => {
    for (const { target } of records) {
      const found = [...(target.matches?.(".canon-nav-list") ? [target] : []), ...(target.querySelectorAll?.(".canon-nav-list") ?? [])];
      for (const nav of found) navListSyncs.get(nav)?.();
    }
  }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["data-display"] });

  const setUpNavLists = (root) => {
    const found = [...(root.matches?.(".canon-nav-list") ? [root] : []), ...(root.querySelectorAll?.(".canon-nav-list") ?? [])];
    for (const nav of found) setUpNavList(nav);
  };
