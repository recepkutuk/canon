  /* ------------------------------------------------------------------ */
  /* Save Bar                                                            */
  /*                                                                     */
  /* A form's .canon-save-bar: its status, Discard (type="reset") and    */
  /* Save (type="submit"). The form's default values are what's saved:   */
  /* a control differing from its default is a change, counted in the   */
  /* status; Discard (the browser's reset) brings them back. data-state  */
  /* on the bar: "changed", "saving", "saved", "failed" (none: no        */
  /* changes). On submit it is "saving"; an app saving on its own        */
  /* (preventDefault) answers with canon-saved on the form (the values   */
  /* (Save and Discard are aria-disabled with nothing to save, or while   */
  /* saving: reachable, announced as unavailable, doing nothing.)         */
  /* become the new defaults) or canon-save-failed (detail.message), the */
  /* changes kept. With changes, leaving the page asks first. The Save   */
  /* button's aria-keyshortcuts (Meta+S Control+S) save the form focus   */
  /* is in, or the only one.                                             */
  /* ------------------------------------------------------------------ */

  const saveBars = new WeakMap();

  const controlsOf = (form) => [...form.elements].filter((control) => control.name && !control.disabled && !(control instanceof HTMLButtonElement) && !(control instanceof HTMLFieldSetElement) && control.type !== "hidden");
  const changedControls = (form) => controlsOf(form).filter((control) => {
    if (control.type === "checkbox" || control.type === "radio") return control.checked !== control.defaultChecked;
    if (control instanceof HTMLSelectElement) return [...control.options].some((option) => option.selected !== option.defaultSelected);
    return control.value !== control.defaultValue;
  });
  /* A change counts once per name (a radio group, a set of checkboxes). */
  const changeCount = (form) => new Set(changedControls(form).map((control) => control.name)).size;
  /* What is shown becomes what's saved. */
  const commitDefaults = (form) => {
    for (const control of controlsOf(form)) {
      if (control.type === "checkbox" || control.type === "radio") control.defaultChecked = control.checked;
      else if (control instanceof HTMLSelectElement) for (const option of control.options) option.defaultSelected = option.selected;
      else control.defaultValue = control.value;
    }
  };

  const setUpSaveBar = (bar) => {
    const form = bar.closest("form");
    if (!form || saveBars.has(form)) return;
    let status = bar.querySelector(":scope > .canon-save-bar-status");
    if (!status) {
      status = fromMarkup(`<p class="canon-save-bar-status"></p>`);
      bar.prepend(status);
    }
    status.setAttribute("role", "status");
    /* The status is shown as a Status Indicator, its intent the state's. */
    const indicator = fromMarkup(`<span class="canon-status"><span class="canon-status-label"></span></span>`);
    status.replaceChildren(indicator);
    const intents = { changed: "warning", saving: "info", saved: "success", failed: "danger" };
    let state = "";
    let message = "";
    const show = (next, words = "") => {
      if (next !== state) markUpdated(status);
      state = next;
      message = words;
      if (state) bar.setAttribute("data-state", state);
      else bar.removeAttribute("data-state");
      const count = changeCount(form);
      if (intents[state]) indicator.setAttribute("data-intent", intents[state]);
      else indicator.removeAttribute("data-intent");
      indicator.toggleAttribute("data-pulse", state === "saving");
      /* Nothing to save (or saving already): Save and Discard are
         unavailable, still reachable, the status saying why. */
      const idle = state === "saving" || count === 0;
      for (const button of bar.querySelectorAll(":scope > button:is([type='submit'], [type='reset'])")) {
        if (idle) button.setAttribute("aria-disabled", "true");
        else button.removeAttribute("aria-disabled");
      }
      indicator.firstElementChild.textContent = state === "saving" ? text(bar, "saving", "Saving…")
        : state === "failed" ? (message || text(bar, "save-failed", "Couldn't save"))
        : state === "saved" ? text(bar, "saved", "Changes saved")
        : count ? countText(bar, "unsaved-changes", count)
        : text(bar, "no-changes", "No changes");
    };
    const refresh = () => {
      if (state === "saving") return;
      const count = changeCount(form);
      if (count) show("changed");
      else if (state !== "saved") show("");
      else show("saved");
    };
    /* An unavailable Save or Discard does nothing: a click, or Enter in a
       field (which clicks Save). */
    bar.addEventListener("click", (event) => {
      const button = event.target.closest("button[aria-disabled='true']");
      if (button && bar.contains(button)) event.preventDefault();
    }, true);
    form.addEventListener("input", refresh);
    form.addEventListener("change", refresh);
    /* The values come back after the reset event: look then. */
    form.addEventListener("reset", () => setTimeout(() => { if (state === "failed") state = ""; refresh(); }));
    /* Saving: after the app's own submit listeners (bubbling, at the
       document), so a cancelled submit means the app saves itself. */
    document.addEventListener("submit", (event) => {
      if (event.target !== form) return;
      show("saving");
    });
    form.addEventListener("canon-saved", () => {
      commitDefaults(form);
      show("saved");
    });
    form.addEventListener("canon-save-failed", (event) => {
      show("failed", event.detail?.message ?? "");
    });
    saveBars.set(form, { bar, changed: () => changeCount(form) > 0 && state !== "saving" });
    show("");
  };

  const setUpSaveBars = (root) => {
    const found = [...(root.matches?.(".canon-save-bar") ? [root] : []), ...(root.querySelectorAll?.(".canon-save-bar") ?? [])];
    for (const bar of found) setUpSaveBar(bar);
  };

  /* Leaving with unsaved changes asks first. */
  window.addEventListener("beforeunload", (event) => {
    for (const form of document.querySelectorAll("form:has(.canon-save-bar)")) {
      if (!saveBars.get(form)?.changed()) continue;
      event.preventDefault();
      event.returnValue = "";
      return;
    }
  });

  /* Save's shortcut: the form focus is in, or the only one with a bar. */
  document.addEventListener("keydown", (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.repeat) return;
    const forms = [...document.querySelectorAll("form:has(.canon-save-bar)")];
    const form = forms.find((each) => each.contains(document.activeElement)) ?? (forms.length === 1 ? forms[0] : null);
    const save = form?.querySelector(".canon-save-bar [type='submit'][aria-keyshortcuts]");
    if (!save || !save.getAttribute("aria-keyshortcuts").split(/\s+/).some((shortcut) => shortcutMatches(event, shortcut))) return;
    event.preventDefault();
    if (save.getAttribute("aria-disabled") !== "true") form.requestSubmit(save);
  });
