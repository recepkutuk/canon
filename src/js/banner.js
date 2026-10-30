  /* ------------------------------------------------------------------ */
  /* Banner                                                              */
  /*                                                                     */
  /* Banners stay in view: their parent (the <body>, or what holds the   */
  /* App Shell) is marked data-canon-banners, each banner gets its       */
  /* offset under the ones before it (--canon-banner-offset), and the    */
  /* parent gets their total height (--canon-banners-height), which the  */
  /* App Shell's sidebar, bar and sticky parts start under. Measured     */
  /* again when one changes size, is dismissed, comes or goes.           */
  /* ------------------------------------------------------------------ */

  const bannerParents = new WeakSet();
  const measureBanners = (parent) => {
    let offset = 0;
    for (const banner of parent.querySelectorAll(":scope > .canon-banner")) {
      banner.style.setProperty("--canon-banner-offset", `${offset}px`);
      if (banner.checkVisibility()) offset += banner.getBoundingClientRect().height;
    }
    parent.style.setProperty("--canon-banners-height", `${offset}px`);
  };
  const bannerSizes = new ResizeObserver((entries) => {
    for (const parent of new Set(entries.map((entry) => entry.target.parentElement).filter(Boolean))) measureBanners(parent);
  });

  const setUpBanners = (root) => {
    const found = [...(root.matches?.(".canon-banner") ? [root] : []), ...(root.querySelectorAll?.(".canon-banner") ?? [])];
    for (const banner of found) {
      const parent = banner.parentElement;
      if (!parent) continue;
      bannerSizes.observe(banner);
      if (!bannerParents.has(parent)) {
        bannerParents.add(parent);
        parent.setAttribute("data-canon-banners", "");
        new MutationObserver(() => measureBanners(parent)).observe(parent, { childList: true });
      }
      measureBanners(parent);
    }
  };
