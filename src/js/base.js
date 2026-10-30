/*
 * canon.js
 *
 * Behavior for Canon's T2 components. Optional: every page renders without it.
 *
 * Behavior is declared in HTML with the platform's invoker commands:
 *
 *   <button type="button" commandfor="search" command="--canon-clear">
 *
 * The browser fires a "command" event at the target; Canon handles its own
 * custom commands (the --canon- ones). Browsers without invoker commands get
 * a small polyfill that covers custom commands only.
 *
 * Sliders are enhanced without any markup of their own: canon.js keeps
 * the fill (--canon-slider-percent, or --canon-slider-start / -end for a
 * range), the <output> values and the named marks in step with the input.
 *
 * Avatars whose photo fails to load show their fallback (data-state="error").
 *
 * Fields show the browser's validation message in their own empty message
 * (instead of the browser's bubble), as an error. A field's counter shows
 * how much of its control's maxlength is used, and makes it a soft limit.
 *
 * Passwords: rules with data-rule are checked as people type (and block
 * submitting until met), a meter with data-score="rules" is scored from
 * them, Caps Lock is flagged, a confirmation (data-match) is compared, and
 * rules with data-reveal="focus" show only while they matter.
 *
 * Comboboxes: a <select> in .canon-combobox gets a list you can search
 * (in the list or in the box), tags for multiple, new values, loading
 * from the app; the select keeps the value.
 *
 * Tooltips use the platform's interest invokers (interestfor on the
 * trigger); browsers without them get a small polyfill.
 *
 * Load with <script src="canon.js" defer>.
 *
 * Built from src/js by tools/build.mjs: edit the sources, then run it.
 * A smaller build with only some components: node tools/build.mjs --list.
 */
(() => {
  const resetTimers = new WeakMap();

  /* Popups and the element each one is anchored to (see Popover anchors). */
  const popupAnchors = new WeakMap();

  /* Strings come from CSS custom properties (css/canon/canon.core.css, i18n/*.css),
     read on the element, so they follow its lang. */
  const text = (element, key, fallback) => {
    const value = getComputedStyle(element).getPropertyValue(`--canon-text-${key}`).trim();
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return value.replace(/^['"]|['"]$/g, "") || fallback;
    }
  };

  /* One shared, visually hidden live region for announcements. */
  let liveRegion;
  const announce = (text) => {
    if (!liveRegion) {
      liveRegion = document.createElement("div");
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.style.cssText =
        "position:absolute;inline-size:1px;block-size:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap";
      document.body.append(liveRegion);
    }
    liveRegion.textContent = "";
    requestAnimationFrame(() => { liveRegion.textContent = text; });
  };

  /* Fill a string's {placeholders}; the language an element is in. */
  const fill = (template, values) => template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
  /* A drawn value taking focus (Date's parts, Time's cells, editable
     only while focused): editing on, the caret at its end, so typing
     reaches it however focus came (Tab, a press, moving on). */
  const caretIn = (value, on) => {
    value.contentEditable = String(on);
    const selection = getSelection();
    if (!on || !selection || value.contains(selection.anchorNode)) return;
    selection.selectAllChildren(value);
    selection.collapseToEnd();
  };
  const langOf = (element) => element.closest("[lang]")?.lang || undefined;

  /* A count in the element's language, with its plural form. */
  const countText = (element, key, count) => {
    const lang = langOf(element);
    let form = "other";
    let number = String(count);
    try {
      form = new Intl.PluralRules(lang).select(count);
      number = new Intl.NumberFormat(lang).format(count);
    } catch {}
    const template = text(element, `${key}-${form}`, "") || text(element, `${key}-other`, `{count}`);
    return fill(template, { count: number });
  };

  /* Case and accents don't count: "o" finds "Ö". */
  const fold = (value) => value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();

  /* An element from markup. */
  const fromMarkup = (markup) => {
    const template = document.createElement("template");
    template.innerHTML = markup;
    return template.content.firstElementChild;
  };

  /* The elements an input's aria-describedby points at that match. */
  const describedBy = (input, selector) => (input.getAttribute("aria-describedby") ?? "")
    .split(/\s+/).filter(Boolean)
    .map((id) => document.getElementById(id))
    .filter((element) => element?.matches(selector));

  /* The first control a person can use in a part of the page. */
  const firstControl = (root) =>
    [...root.querySelectorAll("input:not([type='hidden']), select, textarea, button, a[href], [tabindex]:not([tabindex='-1'])")].find(
      (element) => !element.disabled && element.checkVisibility(),
    );
  const firstFocusable = (root) =>
    [...root.querySelectorAll("input, select, textarea, button, [contenteditable], [tabindex]")].find(
      (element) => element.tabIndex >= 0 && !element.disabled && !element.matches("[command='--canon-remove']") && element.checkVisibility(),
    );

  /* Whether a key press is a shortcut written as aria-keyshortcuts writes
     it ("Meta+K", "Control+S"). */
  const shortcutMatches = (event, shortcut) => {
    const parts = shortcut.split("+");
    const key = parts.pop();
    const want = new Set(parts.map((part) => part.toLowerCase()));
    return event.key.toLowerCase() === key.toLowerCase() &&
      event.metaKey === want.has("meta") && event.ctrlKey === want.has("control") &&
      event.altKey === want.has("alt") && event.shiftKey === want.has("shift");
  };

  /* Seeds (data-seed on an avatar or a tag): the slot of the theme's
     colors, for browsers that can't work it out in CSS. */
  const seeded = ".canon-avatar, .canon-tag";

  /* The theme's color count is read on the element, or on its future
     parent when it isn't in the page yet. */
  const seedSlot = (element, from = element) => {
    const seed = element.dataset.seed?.trim();
    const colors = Number.parseInt(getComputedStyle(from).getPropertyValue("--canon-seed-colors"), 10);
    if (!seed || !/^-?\d+$/.test(seed) || !(colors > 0)) {
      delete element.dataset.seedSlot;
      return;
    }
    const n = BigInt(colors);
    element.dataset.seedSlot = String(((BigInt(seed) % n) + n) % n);
  };

  /* How the page was last used: "keyboard" or "pointer". */
  let lastInput = "pointer";
  document.addEventListener("keydown", () => { lastInput = "keyboard"; }, true);
  document.addEventListener("pointerdown", () => { lastInput = "pointer"; }, true);

  /* Named anchors made for popups and tooltips (see Popover anchors). */
  const anchorNames = new WeakMap();
  let anchorCount = 0;

  /* What --canon-clear does on a Filter Bar (see Filter Bar). */
  const filterBarClears = new WeakMap();

  const commands = {
    /* Empty the target (a select: nothing chosen, or its placeholder),
       tell listeners, and return focus to it. */
    "--canon-clear"(target) {
      /* A Filter Bar: every filter in it. */
      if (filterBarClears.has(target)) return filterBarClears.get(target)();
      if (target.matches("select")) {
        for (const option of target.options) option.selected = false;
        if (!target.multiple && target.options[0]?.value === "") target.options[0].selected = true;
      } else target.value = "";
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
      target.focus();
    },

    /* Copy the target's value (or text). The button gets data-state="copied"
       for two seconds so themes can show a confirmation. */
    async "--canon-copy"(target, source) {
      const value = "value" in target ? target.value : target.textContent;
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        return;
      }
      source.dataset.state = "copied";
      announce(text(source, "copied", "Copied"));
      clearTimeout(resetTimers.get(source));
      resetTimers.set(source, setTimeout(() => {
        if (source.dataset.state === "copied") delete source.dataset.state;
      }, 2000));
    },
  };

  document.addEventListener("command", (event) => {
    const run = commands[event.command];
    if (!run || !event.source) return;
    if (event.source.getAttribute("aria-disabled") === "true") return;
    run(event.target, event.source);
  }, true);

  /* @canon-part */
  /* ------------------------------------------------------------------ */
  /* Toggle buttons                                                      */
  /*                                                                     */
  /* A Button with aria-pressed flips it when clicked, like a checkbox:  */
  /* before the click's listeners run (they read the new state), and     */
  /* back if one cancels the click (preventDefault: an app that keeps    */
  /* the state itself, as an editor does from the selection). In a       */
  /* Button Group with data-select="one", pressing one releases the      */
  /* others, and the pressed one stays pressed. Command buttons (their   */
  /* command sets the state) and submit buttons (the server does) are    */
  /* left alone.                                                         */
  /* ------------------------------------------------------------------ */

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.(".canon-button[aria-pressed]");
    if (!button || button.hasAttribute("command") || button.type === "submit" || button.getAttribute("aria-disabled") === "true") return;
    const group = button.closest(".canon-button-group");
    const one = group?.dataset.select === "one";
    const buttons = one ? [...group.querySelectorAll(".canon-button[aria-pressed]")].filter((each) => each.closest(".canon-button-group") === group) : [button];
    const before = buttons.map((each) => [each, each.getAttribute("aria-pressed")]);
    if (one) for (const each of buttons) each.setAttribute("aria-pressed", String(each === button));
    else button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
    /* After every listener has had the click. */
    setTimeout(() => {
      if (event.defaultPrevented) for (const [each, value] of before) each.setAttribute("aria-pressed", value);
    });
  }, true);

  /* @canon-part */
  /* ------------------------------------------------------------------ */
  /* Making and giving back room                                         */
  /*                                                                     */
  /* An alert, a banner, a toast, a repeater's item or a combobox's tag  */
  /* coming or going opens or closes its room: data-state="opening" or   */
  /* "closing" while the theme's animations run, its size on             */
  /* --canon-motion-height and --canon-motion-width and, in a flex row   */
  /* or column, the gap it brings on --canon-motion-gap-before (when     */
  /* it's the last) or --canon-motion-gap-after. Then the state goes and */
  /* done() runs; at once when the theme has no animation.               */
  /* ------------------------------------------------------------------ */

  const motionProperties = ["--canon-motion-height", "--canon-motion-width", "--canon-motion-gap-before", "--canon-motion-gap-after"];
  const playRoom = (element, state, done) => {
    const parent = element.parentElement;
    const layout = parent ? getComputedStyle(parent) : null;
    const others = parent ? [...parent.children].filter((other) => other !== element && other.checkVisibility()) : [];
    const flex = Boolean(layout?.display.endsWith("flex") && others.length);
    const column = flex && layout.flexDirection.startsWith("column");
    const last = flex && !others.some((other) => element.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING);
    const between = flex ? (column ? layout.rowGap : layout.columnGap) : "normal";
    const gap = between !== "normal" ? between : "0px";
    const box = element.getBoundingClientRect();
    element.style.setProperty("--canon-motion-height", `${box.height}px`);
    element.style.setProperty("--canon-motion-width", `${box.width}px`);
    element.style.setProperty("--canon-motion-gap-before", last ? gap : "0px");
    element.style.setProperty("--canon-motion-gap-after", last ? "0px" : gap);
    element.setAttribute("data-state", state);
    const finish = () => {
      /* Another state took over (closing while still opening): it finishes. */
      if (element.getAttribute("data-state") !== state) return;
      element.removeAttribute("data-state");
      for (const property of motionProperties) element.style.removeProperty(property);
      done?.();
    };
    const running = element.getAnimations();
    if (running.length) Promise.all(running.map((animation) => animation.finished)).then(finish, finish);
    else finish();
  };

  /* Something that just changed is marked (an attribute, data-updated   */
  /* by default) while the theme's animations on it and its parts run:   */
  /* a Count's number, the Save Bar's status, a calendar's new month,    */
  /* content that finished loading. Marked again meanwhile, they start   */
  /* over.                                                               */
  const marks = new WeakMap();
  const markMotion = (element, attribute = "data-updated", value = "", done) => {
    element.removeAttribute(attribute);
    void element.offsetWidth;
    element.setAttribute(attribute, value);
    const mark = {};
    marks.set(element, mark);
    const clear = () => {
      if (marks.get(element) !== mark) return;
      element.removeAttribute(attribute);
      done?.();
    };
    /* CSS animations that end (not a pulse or a sweep). */
    const running = element.getAnimations({ subtree: true }).filter((animation) => animation.animationName && animation.effect?.getComputedTiming().iterations !== Infinity);
    if (running.length) Promise.all(running.map((animation) => animation.finished)).then(clear, clear);
    else clear();
  };
  const markUpdated = (element) => markMotion(element);

  /* @canon-part */
  /* Polyfill: custom commands for browsers without invoker commands. */
  if (!("command" in HTMLButtonElement.prototype)) {
    document.addEventListener("click", (event) => {
      const source = event.target.closest?.("button[commandfor][command^='--']");
      if (!source || source.disabled) return;
      const target = document.getElementById(source.getAttribute("commandfor"));
      if (!target) return;
      const commandEvent = new Event("command", { cancelable: true });
      commandEvent.command = source.getAttribute("command");
      commandEvent.source = source;
      target.dispatchEvent(commandEvent);
    });
  }
})();
