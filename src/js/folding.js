  /* ------------------------------------------------------------------ */
  /* Folding                                                             */
  /*                                                                     */
  /* A Top Bar or a Page Header that doesn't fit folds, a step at a      */
  /* time, and unfolds as room comes back. Each folding lists its steps  */
  /* ({ name, applies(), apply(on) }) and how it knows it doesn't fit;   */
  /* it takes the fewest steps that make it fit, measuring with          */
  /* data-folding on the host (things keep their width meanwhile).       */
  /* data-fold on the host lists the steps taken, for themes; folded     */
  /* things get data-folded.                                             */
  /* ------------------------------------------------------------------ */

  let foldCount = 0;

  /* A menu of what folded, filled each time it opens (so it is never
     out of date). */
  const foldMenu = (id, fill) => {
    const menu = fromMarkup(`<div class="canon-menu" id="${id}" popover role="menu"></div>`);
    menu.addEventListener("beforetoggle", (event) => {
      if (event.newState === "open") menu.replaceChildren(...fill());
    });
    return menu;
  };

  /* A Breadcrumb keeps its last page; the others go into a menu at its
     start (an author's own "more" menu's pages among them, in order). */
  const trailFolding = (host, nav) => {
    const ol = nav.querySelector(":scope > ol");
    let more = null;
    const items = () => [...(ol?.children ?? [])].filter((li) => li !== more);
    return {
      name: "breadcrumb",
      watched: ol,
      applies: () => items().length > 1,
      apply(on) {
        const all = items();
        for (const li of all) li.toggleAttribute("data-folded", on && li !== all.at(-1));
        if (!on || !all.length) {
          more?.remove();
          more = null;
          return;
        }
        if (more) return;
        const id = `canon-fold-${++foldCount}`;
        const label = text(host, "more-pages", "More pages");
        more = fromMarkup(`<li><button type="button" class="canon-breadcrumb-more" popovertarget="${id}" aria-haspopup="menu" aria-expanded="false"><span class="canon-icon" data-icon="more" aria-hidden="true"></span><span class="canon-visually-hidden"></span></button></li>`);
        more.querySelector(".canon-visually-hidden").textContent = label;
        const menu = foldMenu(id, () => items().filter((li) => li.hasAttribute("data-folded")).flatMap((li) => {
          const own = li.querySelector(".canon-menu");
          if (own) return [...own.querySelectorAll(":scope > .canon-menu-item")].map((item) => item.cloneNode(true));
          const link = li.querySelector("a[href]");
          if (!link) return [];
          const item = fromMarkup(`<a class="canon-menu-item" role="menuitem"><span class="canon-menu-label"></span></a>`);
          item.setAttribute("href", link.getAttribute("href"));
          item.querySelector(".canon-menu-label").textContent = link.textContent.trim();
          return [item];
        }));
        menu.setAttribute("aria-label", label);
        more.append(menu);
        ol.prepend(more);
        setUpMenu(menu);
      },
    };
  };

  /* Buttons go into one More menu where the first of them was: a toggle
     (aria-pressed) as a check, a Button opening a Menu as a submenu;
     choosing an item clicks the Button it stands for. Only when two or
     more would fold (one folded saves no room). */
  const buttonFolding = (host, name, candidates) => {
    let more = null;
    const buttons = () => candidates().filter((button) => button !== more?.button);
    return {
      name,
      applies: () => buttons().length > 1,
      apply(on) {
        const all = buttons();
        for (const button of all) button.toggleAttribute("data-folded", on);
        if (!on || !all.length) {
          more?.button.remove();
          more?.menu.remove();
          more = null;
          return;
        }
        if (more) return;
        const id = `canon-fold-${++foldCount}`;
        const button = fromMarkup(`<button type="button" class="canon-button" data-display="icon" id="${id}-button" popovertarget="${id}" aria-haspopup="menu" aria-expanded="false"><span class="canon-icon" data-icon="more" aria-hidden="true"></span><span class="canon-button-label"></span></button>`);
        button.querySelector(".canon-button-label").textContent = text(host, "more", "More");
        for (const attribute of ["data-emphasis", "data-intent", "data-size"]) {
          if (all[0].hasAttribute(attribute)) button.setAttribute(attribute, all[0].getAttribute(attribute));
        }
        const menu = foldMenu(id, () => buttons().map((source) => {
          const pressed = source.getAttribute("aria-pressed");
          const item = fromMarkup(`<button type="button" class="canon-menu-item" role="${pressed === null ? "menuitem" : "menuitemcheckbox"}"><span class="canon-menu-label"></span></button>`);
          if (pressed !== null) item.setAttribute("aria-checked", String(pressed === "true"));
          const icon = source.querySelector(":scope > .canon-icon");
          if (icon) item.prepend(icon.cloneNode(true));
          item.querySelector(".canon-menu-label").textContent = (source.querySelector(":scope > .canon-button-label")?.textContent ?? source.getAttribute("aria-label") ?? "").trim();
          if (source.disabled || source.getAttribute("aria-disabled") === "true") item.setAttribute("aria-disabled", "true");
          const submenu = source.popoverTargetElement;
          if (submenu?.matches(".canon-menu") && submenu.id) {
            item.setAttribute("popovertarget", submenu.id);
            item.setAttribute("aria-haspopup", "menu");
            item.setAttribute("aria-expanded", "false");
          } else item.addEventListener("click", () => source.click());
          return item;
        }));
        menu.setAttribute("aria-labelledby", button.id);
        all[0].before(button, menu);
        setUpMenu(menu);
        more = { button, menu };
      },
    };
  };

  const setUpFolding = (host, steps, overflows, watched) => {
    const names = steps.map((step) => step.name);
    let taken = 0;
    const observer = new MutationObserver(() => fit());
    const fit = () => {
      observer.disconnect();
      host.toggleAttribute("data-folding", true);
      const all = steps.filter((step) => step.applies());
      const take = (count) => {
        const on = all.slice(0, count);
        const others = (host.getAttribute("data-fold") ?? "").split(" ").filter((each) => each && !names.includes(each));
        const fold = [...others, ...on.map((step) => step.name)].join(" ");
        if (fold) host.setAttribute("data-fold", fold);
        else host.removeAttribute("data-fold");
        for (const step of steps) step.apply(on.includes(step));
      };
      taken = Math.min(taken, all.length);
      take(taken);
      while (taken < all.length && overflows()) take(++taken);
      while (taken > 0) {
        take(taken - 1);
        if (overflows()) {
          take(taken);
          break;
        }
        taken--;
      }
      host.removeAttribute("data-folding");
      for (const element of [...watched(), ...steps.map((step) => step.watched)]) if (element) observer.observe(element, { childList: true });
    };
    let width = 0;
    new ResizeObserver(() => {
      if (host.clientWidth === width) return;
      width = host.clientWidth;
      fit();
    }).observe(host);
    document.fonts?.ready.then(fit);
    fit();
  };
