  /* ------------------------------------------------------------------ */
  /* Tooltip: name the trigger                                           */
  /*                                                                     */
  /* The browser anchors a tooltip to its trigger implicitly, but an     */
  /* implicit anchor has no name, and a theme's arrow (a pseudo-element) */
  /* needs one to aim at the trigger. Just before a tooltip opens, its   */
  /* trigger gets a unique anchor-name and the tooltip gets              */
  /* --canon-tooltip-anchor with that name.                              */
  /* ------------------------------------------------------------------ */

  const nameAnchor = (source, target) => {
    let name = anchorNames.get(source);
    if (!name) {
      name = `--canon-anchor-${++anchorCount}`;
      anchorNames.set(source, name);
      const own = source.style.anchorName;
      source.style.anchorName = own && own !== "none" ? `${own}, ${name}` : name;
    }
    target.style.setProperty("--canon-tooltip-anchor", name);
    popupAnchors.set(target, source);
    return name;
  };

  document.addEventListener("beforetoggle", (event) => {
    const tooltip = event.target;
    if (event.newState !== "open" || !tooltip.classList?.contains("canon-tooltip")) return;
    const source = event.source
      ?? (tooltip.id && document.querySelector(`[interestfor="${CSS.escape(tooltip.id)}"]`));
    if (source) nameAnchor(source, tooltip);
  }, true);

  /* @canon-part */
  /* ------------------------------------------------------------------ */
  /* Polyfill: interest invokers (interestfor), for tooltips             */
  /*                                                                     */
  /* Shows the target popover after hovering or focusing its trigger,    */
  /* hides it when interest moves away (the pointer may cross onto the   */
  /* tooltip), on Escape, and when another one opens. Anchors it to the  */
  /* trigger by name, for browsers without implicit popover anchors.     */
  /* Touch is left alone: tooltips are not a touch pattern.              */
  /* ------------------------------------------------------------------ */

  if (!("interestForElement" in HTMLButtonElement.prototype)) {
    const showDelay = 500;
    const hideDelay = 250;
    let current = null;
    let timer;

    const tooltipOf = (source) => {
      const target = document.getElementById(source.getAttribute("interestfor"));
      return target?.hasAttribute("popover") ? target : null;
    };

    const hide = () => {
      clearTimeout(timer);
      if (!current) return;
      try { current.target.hidePopover(); } catch {}
      current = null;
    };

    const show = (source) => {
      clearTimeout(timer);
      const target = tooltipOf(source);
      if (!target) return;
      if (current?.target === target) return;
      hide();
      target.style.positionAnchor = nameAnchor(source, target);
      try {
        target.showPopover({ source });
      } catch {
        try { target.showPopover(); } catch { return; }
      }
      current = { source, target };
    };

    const later = (fn, delay) => {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };

    const sourceIn = (node) => node?.closest?.("[interestfor]");
    const inCurrent = (node) => current && (current.source.contains(node) || current.target.contains(node));

    document.addEventListener("pointerover", (event) => {
      if (event.pointerType === "touch") return;
      if (inCurrent(event.target)) return clearTimeout(timer);
      const source = sourceIn(event.target);
      if (source) later(() => show(source), current ? 0 : showDelay);
    });
    document.addEventListener("pointerout", (event) => {
      if (event.pointerType === "touch" || !current) return;
      if (inCurrent(event.relatedTarget)) return;
      if (inCurrent(event.target)) later(hide, hideDelay);
    });
    document.addEventListener("focusin", (event) => {
      const source = sourceIn(event.target);
      if (source) later(() => show(source), showDelay);
    });
    document.addEventListener("focusout", (event) => {
      if (current && !inCurrent(event.relatedTarget)) later(hide, hideDelay);
      else if (!current) clearTimeout(timer);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && current) hide();
    });
  }
