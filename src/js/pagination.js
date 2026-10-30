  /* ------------------------------------------------------------------ */
  /* Pagination                                                          */
  /*                                                                     */
  /* Written pagination is links and needs nothing. With data-pages (or  */
  /* data-total and data-per-page) canon.js draws the list: Previous,    */
  /* the first and last pages and the ones around the current page with  */
  /* gaps between, always as many (so the row doesn't jump), Next, and   */
  /* First and Last with data-ends. When that doesn't fit it shows fewer */
  /* pages, then "Page 2 of 30" (data-layout="compact" always does).     */
  /* With data-href ("?page={page}") the pages are links; without, they  */
  /* are buttons that fire canon-page (cancelable) and move. The summary */
  /* ("1–10 of 300"), a rows-per-page select and a jump form follow.     */
  /* ------------------------------------------------------------------ */

  const paginations = new WeakSet();

  /* 1 … 4 5 6 … 30: siblings × 2 + 5 slots; null is a gap. */
  const pageWindow = (page, pages, siblings) => {
    const slots = siblings * 2 + 5;
    const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
    if (pages <= slots) return range(1, pages);
    if (page <= siblings + 3) return [...range(1, slots - 2), null, pages];
    if (page >= pages - siblings - 2) return [1, null, ...range(pages - slots + 3, pages)];
    return [1, null, ...range(page - siblings, page + siblings), null, pages];
  };

  const setUpPagination = (nav) => {
    if (paginations.has(nav) || !(nav.hasAttribute("data-pages") || nav.hasAttribute("data-total"))) return;
    paginations.add(nav);
    const integer = (value, fallback) => (Number.isFinite(parseInt(value, 10)) ? parseInt(value, 10) : fallback);
    const state = () => {
      const perPage = Math.max(1, integer(nav.dataset.perPage, 10));
      const total = nav.hasAttribute("data-total") ? Math.max(0, integer(nav.dataset.total, 0)) : null;
      const pages = total === null ? Math.max(1, integer(nav.dataset.pages, 1)) : Math.max(1, Math.ceil(total / perPage));
      const page = Math.min(pages, Math.max(1, integer(nav.dataset.page, 1)));
      return { perPage, total, pages, page, siblings: Math.max(0, integer(nav.dataset.siblings, 1)) };
    };
    /* Page numbers are names (page 12480); counts of rows are grouped (12,480). */
    const number = (n) => {
      try { return new Intl.NumberFormat(langOf(nav)).format(n); } catch { return String(n); }
    };
    const pageNumber = (n) => {
      try { return new Intl.NumberFormat(langOf(nav), { useGrouping: false }).format(n); } catch { return String(n); }
    };
    const hrefFor = (page, perPage) =>
      nav.dataset.href.replaceAll("{page}", page).replaceAll("{per-page}", perPage);

    /* Go to a page: a link pattern navigates; otherwise canon-page, then move. */
    const go = (page, perPage = state().perPage) => {
      if (nav.hasAttribute("data-href")) {
        location.assign(hrefFor(page, perPage));
        return;
      }
      const event = new CustomEvent("canon-page", { bubbles: true, cancelable: true, detail: { page, perPage } });
      if (!nav.dispatchEvent(event)) return false;
      nav.dataset.perPage = perPage;
      nav.dataset.page = page;
      return true;
    };

    let list = null;
    let siblings = null;

    const render = (fit) => {
      const s = state();
      const links = nav.hasAttribute("data-href");
      const compact = nav.dataset.layout === "compact" || siblings === -1;
      const shown = siblings ?? s.siblings;
      const focused = list?.contains(document.activeElement) ? document.activeElement.dataset.key : null;

      const control = (key, target, content, label) => {
        const element = document.createElement(links ? "a" : "button");
        element.dataset.key = key;
        if (links) {
          if (target) element.href = hrefFor(target, s.perPage);
          else element.setAttribute("aria-disabled", "true");
        } else {
          element.type = "button";
          element.disabled = !target;
          if (target) element.addEventListener("click", () => go(target));
        }
        if (label) element.setAttribute("aria-label", label);
        element.append(...content);
        const item = document.createElement("li");
        item.append(element);
        return item;
      };
      const arrow = (key, className, icon, labelKey, fallback, target) => {
        const glyph = document.createElement("span");
        glyph.className = "canon-icon";
        glyph.dataset.icon = icon;
        glyph.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.className = "canon-pagination-label";
        label.textContent = text(nav, labelKey, fallback);
        /* The arrow on the outer side: before Previous, after Next. */
        const item = control(key, target, key === "next" || key === "last" ? [label, glyph] : [glyph, label]);
        item.firstElementChild.className = className;
        if (key === "prev" && target) item.firstElementChild.rel = "prev";
        if (key === "next" && target) item.firstElementChild.rel = "next";
        return item;
      };

      const fresh = document.createElement("ol");
      const ends = nav.hasAttribute("data-ends");
      const before = s.page > 1 ? s.page - 1 : null;
      const after = s.page < s.pages ? s.page + 1 : null;
      if (ends) fresh.append(arrow("first", "canon-pagination-first", "chevrons-left", "pagination-first", "First page", s.page > 1 ? 1 : null));
      fresh.append(arrow("prev", "canon-pagination-prev", "chevron-left", "pagination-previous", "Previous", before));
      if (compact) {
        const current = document.createElement("span");
        current.className = "canon-pagination-current";
        current.textContent = fill(text(nav, "pagination-current", "Page {page} of {pages}"), { page: pageNumber(s.page), pages: pageNumber(s.pages) });
        const item = document.createElement("li");
        item.append(current);
        fresh.append(item);
      } else {
        for (const page of pageWindow(s.page, s.pages, shown)) {
          if (page === null) {
            const gap = document.createElement("li");
            gap.className = "canon-pagination-gap";
            gap.textContent = "…";
            fresh.append(gap);
            continue;
          }
          const item = control(`page-${page}`, page, [pageNumber(page)], fill(text(nav, "pagination-page", "Page {page}"), { page: pageNumber(page) }));
          if (page === s.page) item.firstElementChild.setAttribute("aria-current", "page");
          fresh.append(item);
        }
      }
      fresh.append(arrow("next", "canon-pagination-next", "chevron-right", "pagination-next", "Next", after));
      if (ends) fresh.append(arrow("last", "canon-pagination-last", "chevrons-right", "pagination-last", "Last page", s.page < s.pages ? s.pages : null));

      if (list?.isConnected) list.replaceWith(fresh);
      else {
        const jump = nav.querySelector(":scope > .canon-pagination-jump");
        nav.insertBefore(fresh, jump);
      }
      list = fresh;

      /* Focus stays on the control used, or the current page once it can't go further. */
      if (focused) {
        const same = list.querySelector(`[data-key="${focused}"]:not(:disabled)`);
        (same ?? list.querySelector("[aria-current='page']") ?? list.querySelector(":is(a[href], button:enabled)"))?.focus();
      }

      const summary = nav.querySelector(":scope > .canon-pagination-summary");
      if (summary && s.total !== null) {
        const first = s.total ? (s.page - 1) * s.perPage + 1 : 0;
        const last = Math.min(s.total, s.page * s.perPage);
        summary.textContent = fill(text(nav, "pagination-summary", "{first}–{last} of {total}"), { first: number(first), last: number(last), total: number(s.total) });
      }
      const size = nav.querySelector(":scope > .canon-pagination-size select");
      if (size && size.value !== String(s.perPage)) size.value = String(s.perPage);
      const jumpInput = nav.querySelector(":scope > .canon-pagination-jump input");
      if (jumpInput) {
        jumpInput.min = 1;
        jumpInput.max = s.pages;
      }

      if (fit) fitList();
    };

    /* Fewer pages until the list is one row, then "Page 2 of 30". */
    const wraps = () => {
      const items = [...list.children];
      return items.length > 1 && items.at(-1).offsetTop > items[0].offsetTop;
    };
    const fitList = () => {
      siblings = null;
      render(false);
      if (nav.dataset.layout === "compact") return;
      for (let next = state().siblings - 1; wraps() && next >= -1; next--) {
        siblings = next;
        render(false);
      }
    };

    let announced = null;
    new MutationObserver(() => {
      fitList();
      const s = state();
      const key = `${s.page}/${s.perPage}`;
      if (announced !== null && key !== announced && !nav.hasAttribute("data-href")) {
        const summary = nav.querySelector(":scope > .canon-pagination-summary");
        announce(summary && s.total !== null ? summary.textContent : fill(text(nav, "pagination-current", "Page {page} of {pages}"), { page: pageNumber(s.page), pages: pageNumber(s.pages) }));
      }
      announced = key;
    }).observe(nav, { attributes: true, attributeFilter: ["data-page", "data-pages", "data-total", "data-per-page", "data-siblings", "data-ends", "data-layout", "data-href", "lang", "dir"] });

    let width = 0;
    new ResizeObserver(() => {
      if (nav.clientWidth === width) return;
      width = nav.clientWidth;
      fitList();
    }).observe(nav);

    /* Rows per page: keep the first row in view. */
    nav.querySelector(":scope > .canon-pagination-size select")?.addEventListener("change", (event) => {
      const s = state();
      const perPage = Math.max(1, integer(event.target.value, s.perPage));
      const page = Math.floor(((s.page - 1) * s.perPage) / perPage) + 1;
      if (go(page, perPage) === false) event.target.value = String(s.perPage);
    });

    /* Jump to a page. */
    nav.querySelector(":scope > .canon-pagination-jump")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = event.target.querySelector("input");
      const s = state();
      const page = integer(input?.value, NaN);
      if (!Number.isFinite(page)) return;
      go(Math.min(s.pages, Math.max(1, page)));
      if (!nav.hasAttribute("data-href")) input.value = "";
    });

    fitList();
    announced = `${state().page}/${state().perPage}`;
  };

  const setUpPaginations = (root) => {
    const found = [...(root.matches?.(".canon-pagination") ? [root] : []), ...(root.querySelectorAll?.(".canon-pagination") ?? [])];
    for (const nav of found) setUpPagination(nav);
  };

  /* @canon-part */
  /* ------------------------------------------------------------------ */
  /* Load more                                                           */
  /*                                                                     */
  /* .canon-load-more with a Button: a press fires canon-load-more on    */
  /* the box and marks the button busy until the app sets data-shown;    */
  /* then the status ("Showing 40 of 300") updates and, at the total,    */
  /* the button goes. data-auto presses it when it scrolls near view.    */
  /* A link (href to the next page) is left to the browser.              */
  /* ------------------------------------------------------------------ */

  const loadMores = new WeakSet();

  const setUpLoadMore = (box) => {
    if (loadMores.has(box)) return;
    loadMores.add(box);
    const button = box.querySelector(":scope > button.canon-button");
    const status = box.querySelector(":scope > .canon-load-more-status");
    if (status) status.setAttribute("role", "status");
    const number = (n) => {
      try { return new Intl.NumberFormat(langOf(box)).format(n); } catch { return String(n); }
    };

    const sync = () => {
      const shown = parseInt(box.dataset.shown, 10);
      const total = parseInt(box.dataset.total, 10);
      const known = Number.isFinite(shown) && Number.isFinite(total);
      if (status && known) status.textContent = fill(text(box, "load-more-status", "Showing {shown} of {total}"), { shown: number(shown), total: number(total) });
      if (button) {
        button.removeAttribute("aria-busy");
        button.removeAttribute("aria-disabled");
        const focused = document.activeElement === button;
        button.hidden = known && shown >= total;
        /* At the end, focus on the gone button moves to the status. */
        if (focused && button.hidden && status) {
          status.tabIndex = -1;
          status.focus();
        }
      }
      watch();
    };

    const load = () => {
      if (!button || button.hidden || button.getAttribute("aria-busy") === "true") return;
      button.setAttribute("aria-busy", "true");
      button.setAttribute("aria-disabled", "true");
      box.dispatchEvent(new CustomEvent("canon-load-more", { bubbles: true }));
    };

    button?.addEventListener("click", (event) => {
      if (button.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
        return;
      }
      load();
    });

    /* data-auto: near the viewport, load; re-observing after each load
       loads again while the list is still too short to push it away. */
    let observer = null;
    const watch = () => {
      observer?.disconnect();
      observer = null;
      if (!button || !box.hasAttribute("data-auto") || button.hidden) return;
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) load();
      }, { rootMargin: "0px 0px 400px 0px" });
      observer.observe(button);
    };

    new MutationObserver(sync).observe(box, { attributes: true, attributeFilter: ["data-shown", "data-total", "data-auto", "lang"] });
    sync();
  };

  const setUpLoadMores = (root) => {
    const found = [...(root.matches?.(".canon-load-more") ? [root] : []), ...(root.querySelectorAll?.(".canon-load-more") ?? [])];
    for (const box of found) setUpLoadMore(box);
  };
