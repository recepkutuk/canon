  /* ------------------------------------------------------------------ */
  /* Code Block                                                          */
  /*                                                                     */
  /* Code longer or wider than its box scrolls. Then the <pre> gets      */
  /* data-scrolls and becomes a region keyboards can focus and scroll,   */
  /* named by the block's title (else "Code"), as a Table's frame does.  */
  /* Attributes the author wrote are left alone.                         */
  /* ------------------------------------------------------------------ */

  /* Wrap a Code Block's long lines, or let them scroll again. The button
     is a toggle: its label stays ("Wrap lines") and aria-pressed carries
     the state, which the block's CSS follows. */
  commands["--canon-wrap"] = (target, source) => {
    source.setAttribute("aria-pressed", String(source.getAttribute("aria-pressed") !== "true"));
  };

  const codeBlocks = new WeakSet();
  let codeBlockCount = 0;

  const setUpCodeBlock = (block) => {
    const pre = block.querySelector(":scope > pre");
    const code = pre?.querySelector(":scope > code");
    if (!code || codeBlocks.has(block)) return;
    codeBlocks.add(block);
    const own = { role: pre.hasAttribute("role"), tabindex: pre.hasAttribute("tabindex"), name: pre.hasAttribute("aria-label") || pre.hasAttribute("aria-labelledby") };

    const sync = () => {
      const scrolls = pre.scrollWidth > pre.clientWidth + 1 || pre.scrollHeight > pre.clientHeight + 1;
      pre.toggleAttribute("data-scrolls", scrolls);
      if (!own.role) {
        if (scrolls) pre.setAttribute("role", "region");
        else pre.removeAttribute("role");
      }
      if (!own.tabindex) {
        if (scrolls) pre.tabIndex = 0;
        else pre.removeAttribute("tabindex");
      }
      if (!own.name) {
        pre.removeAttribute("aria-label");
        pre.removeAttribute("aria-labelledby");
        if (!scrolls) return;
        const title = block.querySelector(":scope > .canon-code-block-header > .canon-code-block-title");
        if (title) {
          title.id ||= `canon-code-block-${++codeBlockCount}-title`;
          pre.setAttribute("aria-labelledby", title.id);
        } else pre.setAttribute("aria-label", text(pre, "code", "Code"));
      }
    };

    const observer = new ResizeObserver(sync);
    observer.observe(pre);
    observer.observe(code);
  };

  const setUpCodeBlocks = (root) => {
    const found = [...(root.matches?.(".canon-code-block") ? [root] : []), ...(root.querySelectorAll?.(".canon-code-block") ?? [])];
    for (const block of found) setUpCodeBlock(block);
  };
