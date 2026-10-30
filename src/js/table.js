  /* ------------------------------------------------------------------ */
  /* Table                                                               */
  /*                                                                     */
  /* A table wider than its frame scrolls sideways. Then the frame gets  */
  /* data-scrolls and becomes a region named by the table's caption (or  */
  /* label) that keyboards can focus and scroll; it stops being one when */
  /* the table fits again. Attributes the author wrote are left alone.   */
  /* ------------------------------------------------------------------ */

  const tableFrames = new WeakSet();
  let tableCount = 0;

  const setUpTable = (frame) => {
    const table = frame.querySelector(":scope > table");
    if (!table || tableFrames.has(frame)) return;
    tableFrames.add(frame);
    const own = { role: frame.hasAttribute("role"), tabindex: frame.hasAttribute("tabindex"), name: frame.hasAttribute("aria-label") || frame.hasAttribute("aria-labelledby") };

    const sync = () => {
      const scrolls = frame.scrollWidth > frame.clientWidth + 1;
      frame.toggleAttribute("data-scrolls", scrolls);
      if (!own.role) {
        if (scrolls) frame.setAttribute("role", "region");
        else frame.removeAttribute("role");
      }
      if (!own.tabindex) {
        if (scrolls) frame.tabIndex = 0;
        else frame.removeAttribute("tabindex");
      }
      if (!own.name) {
        frame.removeAttribute("aria-label");
        frame.removeAttribute("aria-labelledby");
        if (!scrolls) return;
        if (table.caption) {
          table.caption.id ||= `canon-table-${++tableCount}-caption`;
          frame.setAttribute("aria-labelledby", table.caption.id);
        } else if (table.hasAttribute("aria-labelledby")) frame.setAttribute("aria-labelledby", table.getAttribute("aria-labelledby"));
        else if (table.hasAttribute("aria-label")) frame.setAttribute("aria-label", table.getAttribute("aria-label"));
      }
    };

    const observer = new ResizeObserver(sync);
    observer.observe(frame);
    observer.observe(table);
  };

  const setUpTables = (root) => {
    const found = [...(root.matches?.(".canon-table") ? [root] : []), ...(root.querySelectorAll?.(".canon-table") ?? [])];
    for (const frame of found) setUpTable(frame);
  };
