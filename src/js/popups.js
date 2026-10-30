  /* ------------------------------------------------------------------ */
  /* Popover anchors                                                     */
  /*                                                                     */
  /* A popover a button opens (popovertarget, or commandfor with a       */
  /* popover command) is anchored to that button. Browsers do it         */
  /* implicitly, though not all of them yet, so where the stylesheet     */
  /* names no anchor canon.js names the button.                          */
  /*                                                                     */
  /* Fallback: browsers without anchor positioning (Chrome before 125,   */
  /* Safari before 26, Firefox before 147) would put every popover in    */
  /* the middle of the window. There canon.js places each anchored one   */
  /* itself, where the stylesheet would: under its anchor from its start */
  /* (a tooltip over it, or where data-placement says; a submenu beside  */
  /* its item), flipping to the side with more room and staying in the   */
  /* window, while it is open and the page scrolls or resizes.           */
  /* ------------------------------------------------------------------ */

  const anchorPositioning = CSS.supports("anchor-name: --canon");
  const invokers = new Map();

  document.addEventListener("click", (event) => {
    const invoker = event.target.closest?.("[popovertarget], button[commandfor]");
    const id = invoker && (invoker.getAttribute("popovertarget") ?? invoker.getAttribute("commandfor"));
    if (id) invokers.set(id, invoker);
  }, true);

  const anchorOf = (popup, event) => {
    const invoker = popup.id && invokers.get(popup.id);
    const interest = popup.id && document.querySelector(`[interestfor="${CSS.escape(popup.id)}"]`);
    const anchor = popupAnchors.get(popup) ?? event?.source ?? (invoker?.isConnected ? invoker : null) ?? interest;
    return anchor?.isConnected && anchor !== popup && !popup.contains(anchor) ? anchor : null;
  };

  /* Where each popup goes: [side, alignment], sides and alignments
     logical, in the popup's own direction. */
  const tooltipPlacements = {
    "block-start": ["top", "center"], "block-start inline-start": ["top", "start"], "block-start inline-end": ["top", "end"],
    "block-end": ["bottom", "center"], "block-end inline-start": ["bottom", "start"], "block-end inline-end": ["bottom", "end"],
    "inline-start": ["start", "center"], "inline-end": ["end", "center"],
  };
  const placementOf = (popup) => {
    if (popup.matches(".canon-tooltip")) return tooltipPlacements[popup.dataset.placement] ?? tooltipPlacements["block-start"];
    if (popup.matches(".canon-menu[data-submenu], .canon-nav-list-section > ul")) return ["end", "start"];
    if (popup.matches(".canon-menu[data-split-button]")) return ["bottom", "end"];
    return ["bottom", "start"];
  };

  const placed = new Set();
  const gaps = new WeakMap();
  const placedObserver = typeof ResizeObserver === "function" ? new ResizeObserver((entries) => entries.forEach((entry) => placePopup(entry.target))) : null;
  const popupOpen = (popup) => popup.matches(":popover-open") || (popup.parentElement?.matches("details[open]") ?? false);

  const unplacePopup = (popup) => {
    placed.delete(popup);
    placedObserver?.unobserve(popup);
    for (const property of ["position", "inset", "margin", "top", "left", "max-block-size", "min-inline-size"]) popup.style.removeProperty(property);
  };

  const placePopup = (popup) => {
    const anchor = popupAnchors.get(popup);
    if (!anchor?.isConnected || !popupOpen(popup)) return unplacePopup(popup);
    if (!gaps.has(popup)) {
      const style = getComputedStyle(popup);
      gaps.set(popup, {
        block: Math.max(parseFloat(style.marginTop) || 0, parseFloat(style.marginBottom) || 0),
        inline: Math.max(parseFloat(style.marginLeft) || 0, parseFloat(style.marginRight) || 0),
      });
    }
    const gap = gaps.get(popup);
    const a = anchor.getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const edge = 8;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const rtl = getComputedStyle(popup).direction === "rtl";
    Object.assign(popup.style, { position: "fixed", inset: "auto", margin: "0" });
    popup.style.removeProperty("max-block-size");
    if (popup.matches(".canon-combobox-popup")) popup.style.minInlineSize = `${a.width + 0.5 * rem}px`;
    else if (popup.matches(".canon-menu:not([data-submenu])")) popup.style.minInlineSize = `${Math.max(a.width + 0.5 * rem, 8 * rem)}px`;
    const scrolls = popup.matches(".canon-menu, .canon-popover, .canon-combobox-popup");
    let [side, align] = placementOf(popup);
    /* Its layout size: a theme's opening scale doesn't count. */
    const sizeOf = () => ({ width: popup.offsetWidth, height: popup.offsetHeight });
    let p = sizeOf();
    let top;
    let left;
    if (side === "top" || side === "bottom") {
      const below = vh - a.bottom - gap.block - edge;
      const above = a.top - gap.block - edge;
      if (side === "bottom" && p.height > below && above > below) side = "top";
      else if (side === "top" && p.height > above && below > above) side = "bottom";
      if (scrolls) {
        popup.style.maxBlockSize = `${Math.max(side === "bottom" ? below : above, 4 * rem)}px`;
        p = sizeOf();
      }
      top = side === "bottom" ? a.bottom + gap.block : a.top - gap.block - p.height;
      left = align === "center" ? a.left + (a.width - p.width) / 2
        : (align === "start") !== rtl ? a.left : a.right - p.width;
    } else {
      const toRight = (side === "end") !== rtl;
      const right = vw - a.right - gap.inline - edge;
      const leftRoom = a.left - gap.inline - edge;
      const goRight = toRight ? !(p.width > right && leftRoom > right) : p.width > leftRoom && right > leftRoom;
      left = goRight ? a.right + gap.inline : a.left - gap.inline - p.width;
      top = align === "center" ? a.top + (a.height - p.height) / 2 : a.top;
      if (scrolls) {
        popup.style.maxBlockSize = `${vh - 2 * edge}px`;
        p = sizeOf();
      }
    }
    popup.style.left = `${Math.max(edge, Math.min(left, vw - p.width - edge))}px`;
    popup.style.top = `${Math.max(edge, Math.min(top, vh - p.height - edge))}px`;
  };

  const trackPopup = (popup, anchor) => {
    popupAnchors.set(popup, anchor);
    placed.add(popup);
    requestAnimationFrame(() => {
      placePopup(popup);
      if (placed.has(popup)) placedObserver?.observe(popup);
    });
  };

  document.addEventListener("beforetoggle", (event) => {
    const popup = event.target;
    if (!(popup instanceof HTMLElement) || popup instanceof HTMLDialogElement || !popup.hasAttribute("popover")) return;
    if (event.newState !== "open") {
      if (anchorPositioning) return;
      /* It stays in place while a theme's closing fades it. */
      const unplace = () => { if (!popupOpen(popup)) unplacePopup(popup); };
      requestAnimationFrame(() => {
        const closing = popup.getAnimations();
        if (closing.length) Promise.all(closing.map((animation) => animation.finished)).then(unplace, unplace);
        else unplace();
      });
      return;
    }
    const anchor = anchorOf(popup, event);
    if (!anchor) return;
    if (anchorPositioning) {
      if (!popup.style.positionAnchor && ["auto", "normal"].includes(getComputedStyle(popup).positionAnchor)) {
        let name = anchorNames.get(anchor);
        if (!name) {
          name = `--canon-anchor-${++anchorCount}`;
          anchorNames.set(anchor, name);
          const own = anchor.style.anchorName;
          anchor.style.anchorName = own && own !== "none" ? `${own}, ${name}` : name;
        }
        popup.style.positionAnchor = name;
      }
      return;
    }
    trackPopup(popup, anchor);
  }, true);

  if (!anchorPositioning) {
    /* A rail's sections show their sub-pages beside them. */
    document.addEventListener("toggle", (event) => {
      const section = event.target;
      if (!section.matches?.("[data-display='icon'] details.canon-nav-list-section")) return;
      const list = section.querySelector(":scope > ul");
      const summary = section.querySelector(":scope > summary");
      if (!list || !summary) return;
      if (section.open) trackPopup(list, summary);
      else unplacePopup(list);
    }, true);

    let placeFrame = 0;
    const replacePopups = () => {
      if (placeFrame || !placed.size) return;
      placeFrame = requestAnimationFrame(() => {
        placeFrame = 0;
        placed.forEach(placePopup);
      });
    };
    addEventListener("scroll", replacePopups, { capture: true, passive: true });
    addEventListener("resize", replacePopups, { passive: true });
  }
