  /* ------------------------------------------------------------------ */
  /* Avatar                                                              */
  /*                                                                     */
  /* - A photo that doesn't load: the avatar gets data-state="error" and */
  /*   the fallback shows instead of the browser's broken image. It      */
  /*   clears again if a new src loads. One still loading when canon.js */
  /*   starts gets data-state="loading" until it comes.                  */
  /* - A count's width, as --canon-count-inline-size on the avatar, so   */
  /*   themes can cut a gap the size of "12" or "99+".                   */
  /* - The seed's slot (avatars and tags): the theme says how many       */
  /*   colors it has (--canon-seed-colors); data-seed-slot is the seed   */
  /*   modulo that, for browsers that can't do it in CSS.                */
  /* ------------------------------------------------------------------ */

  const avatarImage = "img.canon-avatar-image";

  const markAvatar = (img) => {
    const avatar = img.closest(".canon-avatar");
    if (!avatar) return;
    const state = !img.complete ? "loading" : img.naturalWidth === 0 ? "error" : "";
    if (state) avatar.dataset.state = state;
    else if (["error", "loading"].includes(avatar.dataset.state)) delete avatar.dataset.state;
  };

  const countSizes = new ResizeObserver((entries) => {
    for (const { target } of entries) {
      target.parentElement?.style.setProperty("--canon-count-inline-size", `${target.offsetWidth}px`);
    }
  });

  const setUpAvatars = (root) => {
    if (root.matches?.(avatarImage)) markAvatar(root);
    for (const img of root.querySelectorAll?.(avatarImage) ?? []) markAvatar(img);
    const found = root.querySelectorAll?.(seeded) ?? [];
    for (const element of root.matches?.(seeded) ? [root, ...found] : found) {
      seedSlot(element);
      const count = element.querySelector(":scope.canon-avatar > .canon-count");
      if (count) countSizes.observe(count);
    }
  };

  document.addEventListener("error", (event) => {
    if (event.target.matches?.(avatarImage)) markAvatar(event.target);
  }, true);
  document.addEventListener("load", (event) => {
    if (event.target.matches?.(avatarImage)) markAvatar(event.target);
  }, true);

  /* @canon-part */
  /* ------------------------------------------------------------------ */
  /* Avatar spotlight                                                    */
  /*                                                                     */
  /* data-spotlight on an avatar group (or an avatar): the avatar under  */
  /* the pointer or with focus shows its name in a Tooltip: the author's */
  /* (the avatar's interestfor), else one made from its name. Avatars    */
  /* that aren't links or buttons take focus so keyboards reach them:   */
  /* one Tab stop for a group, the arrow keys (Home, End) between them;  */
  /* each is an image named by its person.                               */
  /* ------------------------------------------------------------------ */

  const spotlights = new WeakSet();
  let spotlightCount = 0;
  const avatarName = (avatar) =>
    avatar.querySelector(":scope > .canon-avatar-fallback[aria-label]")?.getAttribute("aria-label")
    || avatar.getAttribute("aria-label")
    || avatar.querySelector(":scope > img.canon-avatar-image[alt]:not([alt=''])")?.alt
    || avatar.querySelector(":scope > .canon-avatar-fallback")?.textContent.trim()
    || "";

  const setUpSpotlight = (host) => {
    if (spotlights.has(host)) return;
    spotlights.add(host);
    const group = host.matches(".canon-avatar-group");
    const avatars = () => (group ? [...host.children].filter((child) => child.matches(".canon-avatar")) : [host]);
    const id = `canon-spotlight-${++spotlightCount}`;
    let made = null;
    let shown = null;
    let showTimer = null;
    let hideTimer = null;

    /* Avatars that aren't links or buttons: focusable images. */
    const sync = () => {
      const list = avatars();
      const still = list.filter((avatar) => !avatar.matches("a[href], button"));
      const current = still.find((avatar) => avatar.tabIndex === 0) ?? still[0];
      for (const avatar of still) {
        avatar.tabIndex = avatar === current ? 0 : -1;
        avatar.setAttribute("role", "img");
        /* As an image its parts aren't read: the status, badge and count
           join its name ("Ada Lovelace, Online"). */
        if (!avatar.hasAttribute("aria-label")) {
          const extras = [...avatar.querySelectorAll(":scope > :is(.canon-avatar-status, .canon-avatar-badge, .canon-count)")].map((part) => part.textContent.trim()).filter(Boolean);
          const name = [avatarName(avatar), ...extras].filter(Boolean).join(", ");
          if (name) avatar.setAttribute("aria-label", name);
        }
      }
      for (const avatar of list) {
        const own = avatar.getAttribute("interestfor") && document.getElementById(avatar.getAttribute("interestfor"));
        if (own && !avatar.matches("a[href], button") && !avatar.getAttribute("aria-describedby")?.split(" ").includes(own.id)) {
          avatar.setAttribute("aria-describedby", [avatar.getAttribute("aria-describedby"), own.id].filter(Boolean).join(" "));
        }
      }
    };

    const tipFor = (avatar) => {
      const own = avatar.getAttribute("interestfor") && document.getElementById(avatar.getAttribute("interestfor"));
      if (own) return own;
      if (!made) {
        made = fromMarkup(`<div class="canon-tooltip" popover="manual" aria-hidden="true"></div>`);
        made.id = `${id}-tip`;
        host.after(made);
      }
      made.textContent = avatarName(avatar);
      return made.textContent ? made : null;
    };
    const hide = () => {
      clearTimeout(showTimer);
      if (shown?.matches(":popover-open")) shown.hidePopover();
      shown = null;
    };
    const show = (avatar) => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      /* Links and buttons with their own tooltip: the browser shows it. */
      if (avatar.matches("a[href], button") && avatar.hasAttribute("interestfor")) return hide();
      const tip = tipFor(avatar);
      if (shown && shown !== tip) hide();
      if (!tip) return;
      /* The name moves to this avatar (others may hold more names). */
      const name = `--${id}`;
      const namesOf = (each) => (each.style.anchorName && each.style.anchorName !== "none" ? each.style.anchorName.split(/\s*,\s*/) : []);
      for (const each of avatars()) {
        if (each === avatar || !namesOf(each).includes(name)) continue;
        each.style.anchorName = namesOf(each).filter((each) => each !== name).join(", ");
      }
      if (!namesOf(avatar).includes(name)) avatar.style.anchorName = [...namesOf(avatar), name].join(", ");
      tip.style.positionAnchor = name;
      tip.style.setProperty("--canon-tooltip-anchor", name);
      if (tip.matches(":popover-open")) tip.hidePopover();
      try { tip.showPopover({ source: avatar }); } catch { tip.showPopover(); }
      shown = tip;
    };
    const avatarOf = (target) => {
      const avatar = target.closest?.(".canon-avatar");
      return avatar && avatars().includes(avatar) ? avatar : null;
    };

    /* The pointer: after a short wait for the first; at once while one shows. */
    host.addEventListener("pointerover", (event) => {
      const avatar = avatarOf(event.target);
      if (!avatar || event.pointerType === "touch") return;
      clearTimeout(hideTimer);
      if (shown) show(avatar);
      else {
        clearTimeout(showTimer);
        showTimer = setTimeout(() => show(avatar), 300);
      }
    });
    host.addEventListener("pointerleave", () => {
      clearTimeout(showTimer);
      hideTimer = setTimeout(() => { if (!host.contains(document.activeElement) || !document.activeElement.matches(":focus-visible")) hide(); }, 100);
    });
    host.addEventListener("focusin", (event) => {
      const avatar = avatarOf(event.target);
      if (avatar && avatar.matches(":focus-visible")) show(avatar);
    });
    host.addEventListener("focusout", (event) => {
      if (!host.contains(event.relatedTarget)) hide();
    });
    host.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && shown) {
        hide();
        return;
      }
      const avatar = avatarOf(event.target);
      if (!group || !avatar || avatar.matches("a[href], button")) return;
      const list = avatars().filter((each) => !each.matches("a[href], button"));
      const rtl = getComputedStyle(host).direction === "rtl";
      const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 }[event.key];
      const index = list.indexOf(avatar);
      const next = event.key === "Home" ? list[0] : event.key === "End" ? list.at(-1) : step ? list[index + step] : null;
      if (!next) return;
      event.preventDefault();
      avatar.tabIndex = -1;
      next.tabIndex = 0;
      next.focus();
    });

    if (group) new MutationObserver(sync).observe(host, { childList: true });
    sync();
  };

  const setUpSpotlights = (root) => {
    const found = [...(root.matches?.("[data-spotlight]") ? [root] : []), ...(root.querySelectorAll?.("[data-spotlight]") ?? [])];
    for (const host of found) if (host.matches(".canon-avatar-group, .canon-avatar")) setUpSpotlight(host);
  };
