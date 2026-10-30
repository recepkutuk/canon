  /* ------------------------------------------------------------------ */
  /* Select: a steady width                                              */
  /*                                                                     */
  /* A Select that sizes to its content (outside a Field: in a toolbar,  */
  /* a pagination, a sentence) keeps the width of its longest choice, as */
  /* a plain select always has: a styled one is only as wide as the      */
  /* choice it shows, so the things after it would move as it changes.   */
  /* Measured once it's shown, and again when the page's fonts have      */
  /* loaded. A Field's own Select fills the field, so it's left alone    */
  /* (one deeper in a field, in an editor's toolbar, isn't).             */
  /* ------------------------------------------------------------------ */

  const steadied = new WeakSet();
  const steadyWidth = (select) => {
    if (!select.isConnected || !select.checkVisibility()) return;
    const chosen = select.selectedIndex;
    select.style.minInlineSize = "";
    let widest = 0;
    for (let index = 0; index < select.options.length; index++) {
      select.selectedIndex = index;
      widest = Math.max(widest, select.getBoundingClientRect().width);
    }
    select.selectedIndex = chosen;
    if (widest) select.style.minInlineSize = `${Math.ceil(widest)}px`;
  };
  /* Measured as soon as it's shown (it has a size), once. */
  const steadyOnScreen = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (!entry.contentRect.width) continue;
      steadyOnScreen.unobserve(entry.target);
      steadyWidth(entry.target);
      document.fonts?.ready.then(() => steadyWidth(entry.target));
    }
  });
  const setUpSteadySelects = (root) => {
    const found = [...(root.matches?.(".canon-select > select") ? [root] : []), ...(root.querySelectorAll?.(".canon-select > select") ?? [])];
    for (const select of found) {
      /* A field's own control fills the field: left alone. */
      if (select.multiple || select.parentElement.parentElement?.matches(".canon-field") || steadied.has(select)) continue;
      steadied.add(select);
      steadyOnScreen.observe(select);
    }
  };

  /* @canon-part */
  /* ------------------------------------------------------------------ */
  /* A Select in a text input (a country code)                           */
  /*                                                                     */
  /* A styled select is as wide as its chosen option, so the value       */
  /* beside it would move when the choice changes. canon.js tries each   */
  /* option once and gives the box the widest one's width                */
  /* (--canon-select-min-inline-size).                                   */
  /* ------------------------------------------------------------------ */

  const segmentSelect = ".canon-text-input > .canon-select > select";
  const sizeSegment = (select) => {
    const box = select.parentElement;
    box.style.removeProperty("--canon-select-min-inline-size");
    const chosen = select.selectedIndex;
    let widest = 0;
    for (const option of select.options) {
      if (option.hidden) continue;
      select.selectedIndex = option.index;
      widest = Math.max(widest, box.getBoundingClientRect().width);
    }
    select.selectedIndex = chosen;
    if (widest) box.style.setProperty("--canon-select-min-inline-size", `${widest}px`);
  };
  const segmentsSized = new WeakSet();
  const setUpSegments = (root) => {
    const selects = root.matches?.(segmentSelect) ? [root] : [...(root.querySelectorAll?.(segmentSelect) ?? [])];
    for (const select of selects) {
      sizeSegment(select);
      if (segmentsSized.has(select)) continue;
      segmentsSized.add(select);
      /* Options changing, not <selectedcontent> mirroring the choice. */
      new MutationObserver((records) => {
        if (records.some((record) => !record.target.closest?.("selectedcontent") && !record.target.parentElement?.closest("selectedcontent"))) sizeSegment(select);
      }).observe(select, { childList: true, subtree: true, characterData: true });
      document.fonts?.ready.then(() => sizeSegment(select));
    }
  };
