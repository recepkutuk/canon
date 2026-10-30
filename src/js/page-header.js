  /* ------------------------------------------------------------------ */
  /* Page Header                                                         */
  /*                                                                     */
  /* Folds when narrow, each part on its own: a Breadcrumb keeps its     */
  /* last page when its trail doesn't fit its row (breadcrumb); the      */
  /* actions go into one More menu, but for the primary one              */
  /* (data-emphasis="high"), when they leave the title less room than it */
  /* needs: its own width, up to 20rem (actions).                        */
  /* ------------------------------------------------------------------ */

  const pageHeaders = new WeakSet();

  const setUpPageHeader = (header) => {
    if (pageHeaders.has(header)) return;
    pageHeaders.add(header);
    /* Sticky, the trail tucks away above the bar's edge: by how far the
       rest starts below the header's top padding. */
    const trail = header.querySelector(":scope > :is(.canon-page-header-back, .canon-breadcrumb)");
    if (trail) {
      const tuck = () => {
        const rest = [...header.children].filter((child) => child !== trail && child.checkVisibility());
        if (!rest.length) return;
        const top = Math.min(...rest.map((child) => child.getBoundingClientRect().top));
        const offset = top - header.getBoundingClientRect().top - parseFloat(getComputedStyle(header).paddingBlockStart);
        header.style.setProperty("--canon-page-header-tuck", `${Math.max(0, offset)}px`);
      };
      new ResizeObserver(tuck).observe(trail);
      tuck();
    }
    const nav = header.querySelector(":scope > .canon-breadcrumb");
    if (nav) setUpFolding(header, [trailFolding(header, nav)], () => nav.scrollWidth > nav.clientWidth + 1, () => []);
    const actions = header.querySelector(":scope > .canon-page-header-actions");
    if (!actions) return;
    const title = header.querySelector(":scope > .canon-page-header-title");
    const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    /* While measuring (data-folding), the title is one line, so its
       scrollWidth is the width it wants, and the actions one row. */
    const overflows = () => header.scrollWidth > header.clientWidth + 1
      || actions.scrollWidth > actions.clientWidth + 1
      || Boolean(title && title.clientWidth + 1 < Math.min(title.scrollWidth, 20 * rem()));
    const fold = buttonFolding(header, "actions", () => [...actions.querySelectorAll(":scope > .canon-button")]
      .filter((button) => button.getAttribute("data-emphasis") !== "high"));
    setUpFolding(header, [fold], overflows, () => [actions]);
  };

  const setUpPageHeaders = (root) => {
    const found = [...(root.matches?.(".canon-page-header") ? [root] : []), ...(root.querySelectorAll?.(".canon-page-header") ?? [])];
    for (const header of found) setUpPageHeader(header);
  };

  /* @canon-part */
  /* ------------------------------------------------------------------ */
  /* Edit in place (--canon-edit)                                        */
  /*                                                                     */
  /* A Button with command="--canon-edit" edits its target's text (a     */
  /* Page Header's title): a text field takes the text's place, named by */
  /* the button; Enter or leaving the field keeps the change, Escape     */
  /* drops it. canon-edit fires on the target first (detail: value,      */
  /* previous); cancelling it keeps the old text. An empty or unchanged  */
  /* value changes nothing. The text and the button are data-editing     */
  /* (hidden) meanwhile; Enter and Escape bring focus back to the button.*/
  /* ------------------------------------------------------------------ */

  const startEdit = (target, source) => {
    if (target.hasAttribute("data-editing")) return;
    const previous = target.textContent.trim();
    const input = fromMarkup(`<input type="text" class="canon-inline-edit" autocomplete="off" spellcheck="false">`);
    input.value = previous;
    const name = (source.querySelector(":scope > .canon-button-label")?.textContent ?? source.getAttribute("aria-label") ?? "").trim();
    input.setAttribute("aria-label", name || previous);
    target.setAttribute("data-editing", "");
    source.setAttribute("data-editing", "");
    target.after(input);
    input.focus();
    input.select();
    let done = false;
    const finish = (keep, refocus) => {
      if (done) return;
      done = true;
      const value = input.value.trim();
      if (keep && value && value !== previous) {
        const event = new CustomEvent("canon-edit", { bubbles: true, cancelable: true, detail: { value, previous } });
        if (target.dispatchEvent(event)) target.textContent = value;
      }
      target.removeAttribute("data-editing");
      source.removeAttribute("data-editing");
      if (refocus) source.focus();
      input.remove();
    };
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        finish(true, true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        finish(false, true);
      }
    });
    input.addEventListener("blur", () => finish(true, false));
  };

  /* Edit the target's text in place (a Page Header's title). */
  commands["--canon-edit"] = (target, source) => {
    startEdit(target, source);
  };
