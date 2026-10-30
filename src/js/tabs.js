  /* ------------------------------------------------------------------ */
  /* Tabs                                                                */
  /*                                                                     */
  /* In-page (.canon-tabs-list role="tablist" in .canon-tabs, with its   */
  /* panels): a click or the arrows (Home, End) choose a tab and show    */
  /* its panel, hiding the others; one Tab stop, the chosen tab. Choosing*/
  /* fires canon-tab on the tabs (detail: tab, panel). Links            */
  /* (nav.canon-tabs-list): the browser's. Both fold when narrow: tabs   */
  /* go into a More menu from the last, one at a time, the current one   */
  /* never; the More button sits at the strip's end (inside a nav;       */
  /* beside a tablist, which may only hold tabs). Hidden panels are      */
  /* hidden="until-found" where the browser has it: find in page reaches */
  /* their text and chooses their tab.                                   */
  /* ------------------------------------------------------------------ */

  const tabLists = new WeakSet();
  const findable = "onbeforematch" in HTMLElement.prototype;

  const setUpTabList = (list) => {
    if (tabLists.has(list)) return;
    tabLists.add(list);
    const inPage = list.getAttribute("role") === "tablist";
    const box = inPage ? list.closest(".canon-tabs") : null;
    const tabs = () => [...list.querySelectorAll(":scope > .canon-tab")];
    const usable = (tab) => tab.getAttribute("aria-disabled") !== "true";
    const isCurrent = (tab) => tab.getAttribute(inPage ? "aria-selected" : "aria-current") === (inPage ? "true" : "page");
    const panelOf = (tab) => {
      const id = tab.getAttribute("aria-controls");
      return id ? document.getElementById(id) : null;
    };
    let fit = () => {};

    const select = (tab, { focus = false, announce: tell = true } = {}) => {
      for (const each of tabs()) {
        const chosen = each === tab;
        each.setAttribute("aria-selected", String(chosen));
        each.tabIndex = chosen ? 0 : -1;
        const panel = panelOf(each);
        if (!panel) continue;
        if (chosen) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", findable ? "until-found" : "");
      }
      fit();
      if (focus) tab.focus();
      if (tell) (box ?? list).dispatchEvent(new CustomEvent("canon-tab", { bubbles: true, detail: { tab, panel: panelOf(tab) } }));
    };

    if (inPage) {
      const first = tabs().find(isCurrent) ?? tabs().find(usable);
      if (first) select(first, { announce: false });
      /* Find in page matched text in a hidden panel: its tab is chosen as
         the browser shows it. */
      for (const tab of tabs()) {
        panelOf(tab)?.addEventListener("beforematch", () => {
          if (!isCurrent(tab)) select(tab);
        });
      }
      list.addEventListener("click", (event) => {
        const tab = event.target.closest(".canon-tab");
        if (tab && list.contains(tab) && usable(tab) && !isCurrent(tab)) select(tab);
      });
      list.addEventListener("keydown", (event) => {
        const tab = event.target.closest(".canon-tab");
        if (!tab) return;
        const rtl = getComputedStyle(list).direction === "rtl";
        const shown = tabs().filter((each) => usable(each) && !each.hasAttribute("data-folded"));
        const at = shown.indexOf(tab);
        let next = null;
        if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) next = shown[(at + 1) % shown.length];
        else if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) next = shown[(at - 1 + shown.length) % shown.length];
        else if (event.key === "Home") next = shown[0];
        else if (event.key === "End") next = shown.at(-1);
        if (!next) return;
        event.preventDefault();
        select(next, { focus: true });
      });
    }

    /* Folding: the More button, made when first needed. */
    let more = null;
    const makeMore = () => {
      const id = `canon-fold-${++foldCount}`;
      const button = fromMarkup(`<button type="button" class="canon-tabs-more" id="${id}-button" popovertarget="${id}" aria-haspopup="menu" aria-expanded="false"><span class="canon-tab-label"></span><span class="canon-icon" data-icon="chevron-down" aria-hidden="true"></span></button>`);
      button.querySelector(".canon-tab-label").textContent = text(list, "more", "More");
      const menu = foldMenu(id, () => tabs().filter((tab) => tab.hasAttribute("data-folded")).map((tab) => {
        const label = (tab.querySelector(":scope > .canon-tab-label")?.textContent ?? tab.textContent).trim();
        const item = fromMarkup(inPage
          ? `<button type="button" class="canon-menu-item" role="menuitem"><span class="canon-menu-label"></span></button>`
          : `<a class="canon-menu-item" role="menuitem"><span class="canon-menu-label"></span></a>`);
        item.querySelector(".canon-menu-label").textContent = label;
        const icon = tab.querySelector(":scope > .canon-icon");
        if (icon) item.prepend(icon.cloneNode(true));
        if (!usable(tab)) item.setAttribute("aria-disabled", "true");
        if (inPage) item.addEventListener("click", () => {
          select(tab);
          /* After the menu has closed (and given focus back to More). */
          requestAnimationFrame(() => tab.focus());
        });
        else item.setAttribute("href", tab.getAttribute("href"));
        return item;
      }));
      menu.setAttribute("aria-labelledby", button.id);
      if (inPage) list.after(button, menu);
      else list.append(button, menu);
      setUpMenu(menu);
      return { button, menu };
    };

    /* Whether the shown tabs (and, in a nav, More) end past the strip's
       content edge, the room kept for More beside a tablist included
       (overflow alone doesn't count the padding that keeps it). */
    const overflows = () => {
      if (list.scrollWidth > list.clientWidth + 1) return true;
      const style = getComputedStyle(list);
      const rtl = style.direction === "rtl";
      const box = list.getBoundingClientRect();
      const end = parseFloat(style.paddingInlineEnd) + parseFloat(rtl ? style.borderLeftWidth : style.borderRightWidth);
      const limit = rtl ? box.left + end : box.right - end;
      const shown = [...list.children].filter((child) => child.matches(".canon-tab, .canon-tabs-more") && !child.hasAttribute("data-folded"));
      return shown.some((child) => {
        const edge = child.getBoundingClientRect();
        return rtl ? edge.left < limit - 0.5 : edge.right > limit + 0.5;
      });
    };
    fit = () => {
      list.toggleAttribute("data-folding", true);
      const all = tabs();
      for (const tab of all) tab.removeAttribute("data-folded");
      more?.button.setAttribute("data-folded", "");
      list.style.removeProperty("--canon-tabs-more-size");
      if (overflows()) {
        more ??= makeMore();
        more.button.removeAttribute("data-folded");
        if (inPage) list.style.setProperty("--canon-tabs-more-size", `${more.button.offsetWidth}px`);
        for (const tab of [...all].reverse()) {
          if (!overflows()) break;
          if (isCurrent(tab) || all.filter((each) => !each.hasAttribute("data-folded")).length <= 1) continue;
          tab.setAttribute("data-folded", "");
        }
      }
      list.toggleAttribute("data-fold", Boolean(all.some((tab) => tab.hasAttribute("data-folded"))));
      list.removeAttribute("data-folding");
    };

    let width = 0;
    new ResizeObserver(() => {
      if (list.clientWidth === width) return;
      width = list.clientWidth;
      fit();
    }).observe(list);
    /* Tabs added or taken away, or the current link moved. */
    new MutationObserver((records) => {
      if (records.some((record) => [...record.addedNodes, ...record.removedNodes].some((node) => node !== more?.button && node !== more?.menu))) fit();
    }).observe(list, { childList: true });
    if (!inPage) new MutationObserver(() => fit()).observe(list, { attributes: true, subtree: true, attributeFilter: ["aria-current"] });
    document.fonts?.ready.then(() => fit());
    fit();
  };

  const setUpTabLists = (root) => {
    const found = [...(root.matches?.(".canon-tabs-list") ? [root] : []), ...(root.querySelectorAll?.(".canon-tabs-list") ?? [])];
    for (const list of found) setUpTabList(list);
  };
