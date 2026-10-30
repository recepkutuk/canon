  /* ------------------------------------------------------------------ */
  /* Swatches                                                            */
  /*                                                                     */
  /* A swatch's color is its value, read by CSS with typed attr(); where */
  /* that isn't supported, canon.js copies it to --canon-swatch (unless  */
  /* the author set one). data-collapse: a chevron toggle; the group     */
  /* opens while it has focus or when the chevron is clicked, and closes */
  /* when focus leaves, on Escape, after a click picks a swatch, or on   */
  /* the chevron again; then an arrow key, Enter or Space reopens it.    */
  /* ------------------------------------------------------------------ */

  const swatchSelector = ".canon-swatches > input[type='radio']";
  const typedColorAttr = CSS.supports("color", "attr(value type(<color>), red)");
  const swatchGroups = new WeakSet();

  const paintSwatch = (input) => {
    if (typedColorAttr || input.style.getPropertyValue("--canon-swatch")) return;
    if (CSS.supports("color", input.value)) input.style.setProperty("--canon-swatch", input.value);
  };

  const setUpSwatches = (group) => {
    if (swatchGroups.has(group)) return;
    swatchGroups.add(group);
    if (!group.hasAttribute("data-collapse")) return;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "canon-swatches-toggle";
    toggle.tabIndex = -1;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", text(group, "more-colors", "More colors"));
    group.append(toggle);
    /* Ready once the closed state has painted: opening and closing
       animate, setting up doesn't. */
    requestAnimationFrame(() => requestAnimationFrame(() => toggle.setAttribute("data-state", "ready")));
    const radios = () => [...group.querySelectorAll(":scope > input[type='radio']")];
    const setOpen = (open) => toggle.setAttribute("aria-expanded", String(open));
    let picking = false;
    group.addEventListener("focusin", () => setOpen(true));
    group.addEventListener("focusout", (event) => {
      if (!group.contains(event.relatedTarget)) setOpen(false);
    });
    group.addEventListener("keydown", (event) => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
      } else if (!open && /^(Arrow(Up|Down|Left|Right)|Enter| )$/.test(event.key)) {
        /* Closed with focus still inside (after Escape or a click): the
           first key reopens it. */
        event.preventDefault();
        setOpen(true);
      }
    });
    toggle.addEventListener("pointerdown", (event) => event.preventDefault());
    toggle.addEventListener("click", () => {
      if (toggle.getAttribute("aria-expanded") === "true") return setOpen(false);
      setOpen(true);
      const list = radios();
      (list.find((radio) => radio.checked) ?? list[0])?.focus();
    });
    group.addEventListener("pointerdown", (event) => {
      picking = event.target.matches?.("input[type='radio']");
    });
    group.addEventListener("change", () => {
      if (picking) setOpen(false);
      picking = false;
    });
  };

  const setUpSwatchGroups = (root) => {
    const inputs = [...(root.matches?.(swatchSelector) ? [root] : []), ...(root.querySelectorAll?.(swatchSelector) ?? [])];
    for (const input of inputs) paintSwatch(input);
    const groups = [...(root.matches?.(".canon-swatches") ? [root] : []), ...(root.querySelectorAll?.(".canon-swatches") ?? [])];
    for (const group of groups) setUpSwatches(group);
  };
