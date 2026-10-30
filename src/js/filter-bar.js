  /* ------------------------------------------------------------------ */
  /* Filter Bar                                                          */
  /*                                                                     */
  /* A search form of facets: each facet's button shows what is chosen   */
  /* in its popover ("Status: Active +1"); a change fires canon-filter   */
  /* with the form's values (typing after a pause) instead of reloading  */
  /* the page, unless data-submit asks for the page to submit. Clear all */
  /* is --canon-clear on the bar.                                        */
  /* ------------------------------------------------------------------ */

  const filterBars = new WeakSet();
  const setUpFilterBar = (bar) => {
    if (filterBars.has(bar)) return;
    filterBars.add(bar);
    const say = (key, fallback, values) => (values ? fill(text(bar, key, fallback), values) : text(bar, key, fallback));
    const lang = () => langOf(bar);
    const facets = () => [...bar.querySelectorAll(":scope > .canon-filter-bar-facet")];
    const controls = (scope) => [...scope.querySelectorAll("input, select, textarea")].filter((control) => control.name && control.type !== "hidden");
    /* Filters: the facets, the chips and the search field (not, say, a
       sort select beside them). */
    const filters = () => controls(bar).filter((control) => control.closest(".canon-filter-bar-facet, .canon-toggle-chip") || control.type === "search");
    const typing = (control) => control.matches("input:is([type='search'], [type='text'], [type='number'], [type='range']), textarea");

    const labelOf = (control) =>
      (control.closest(".canon-toggle-chip")?.querySelector(".canon-toggle-chip-label") ?? control.labels?.[0])?.textContent.trim() || control.value;
    const formatValue = (control) => {
      try {
        if (control.type === "date" && /^\d{4}-\d{2}-\d{2}$/.test(control.value)) {
          const [y, m, d] = control.value.split("-").map(Number);
          const date = new Date(y, m - 1, d);
          const options = { month: "short", day: "numeric", ...(y !== new Date().getFullYear() ? { year: "numeric" } : {}) };
          return new Intl.DateTimeFormat(lang(), options).format(date);
        }
        if (control.type === "number" || control.type === "range") return new Intl.NumberFormat(lang()).format(control.valueAsNumber);
      } catch {}
      return control.value.trim();
    };
    /* A slider pair is off when it isn't at its full range. */
    const atEnd = (control) => {
      const pair = [...control.parentElement.querySelectorAll(":scope > input[type='range']")];
      const end = pair.length > 1 && control === pair[1] ? control.max || "100" : control.min || "0";
      return Number(control.value) === Number(end);
    };
    /* What a scope has chosen: labels for choices, values for the rest. */
    const chosen = (scope) => {
      const choices = [];
      const values = [];
      for (const control of controls(scope)) {
        if (control.disabled) continue;
        if (control.type === "checkbox" || control.type === "radio") {
          if (control.checked && control.value !== "") choices.push(labelOf(control));
        } else if (control.matches("select")) {
          for (const option of control.selectedOptions) if (option.value !== "") choices.push(option.textContent.trim());
        } else if (control.type === "range") {
          const pair = [...control.parentElement.querySelectorAll(":scope > input[type='range']")];
          if (control === pair[0] && pair.some((each) => !atEnd(each))) values.push(pair.map(formatValue).join(" – "));
        } else if (control.value.trim() !== "") values.push(formatValue(control));
      }
      if (values.length === 2 && !choices.length) return [values.join(" – ")];
      return [...choices, ...values];
    };

    const summarize = () => {
      let any = false;
      for (const facet of facets()) {
        const button = facet.querySelector(":scope > .canon-filter-bar-button");
        const panel = facet.querySelector(":scope > .canon-popover");
        if (!button || !panel) continue;
        const items = chosen(panel);
        let value = button.querySelector(":scope > .canon-filter-bar-value");
        if (!value) {
          value = document.createElement("span");
          value.className = "canon-filter-bar-value";
          button.querySelector(":scope > .canon-filter-bar-label")?.after(value);
        }
        const name = button.querySelector(":scope > .canon-filter-bar-label")?.textContent.trim() ?? "";
        if (items.length) {
          const shown = items.length > 1 ? say("filter-bar-more", "{value} +{count}", { value: items[0], count: items.length - 1 }) : items[0];
          value.textContent = say("filter-bar-value", ": {value}", { value: shown });
          button.setAttribute("aria-label", say("filter-bar-summary", "{facet}: {values}", { facet: name, values: items.join(", ") }));
          facet.dataset.active = "";
          any = true;
        } else {
          value.textContent = "";
          button.removeAttribute("aria-label");
          delete facet.dataset.active;
        }
      }
      for (const control of filters()) {
        if (control.closest(".canon-filter-bar-facet") || control.disabled) continue;
        if (control.type === "checkbox" || control.type === "radio" ? control.checked && control.value !== "" : control.value.trim() !== "") any = true;
      }
      if (any) bar.dataset.active = "";
      else delete bar.dataset.active;
    };

    const values = () => {
      const result = {};
      for (const [key, value] of new FormData(bar)) (result[key] ??= []).push(typeof value === "string" ? value : value.name);
      return result;
    };
    const emit = () => bar.dispatchEvent(new CustomEvent("canon-filter", { bubbles: true, detail: { values: values() } }));
    let timer = null;
    const changed = (now) => {
      summarize();
      clearTimeout(timer);
      if (bar.hasAttribute("data-submit")) {
        if (now) bar.requestSubmit();
        return;
      }
      if (now) emit();
      else timer = setTimeout(emit, 250);
    };

    bar.addEventListener("input", (event) => {
      if (typing(event.target)) changed(false);
      else summarize();
    });
    bar.addEventListener("change", (event) => {
      if (!typing(event.target) || event.target.type === "range") changed(true);
    });
    bar.addEventListener("submit", (event) => {
      if (bar.hasAttribute("data-submit")) return;
      event.preventDefault();
      clearTimeout(timer);
      summarize();
      emit();
    });
    bar.addEventListener("reset", () => setTimeout(() => changed(true)));

    /* Clear all: choices off (a radio group back to its "" option), fields
       empty, sliders to their full range; one change, then focus to the
       search field (else the bar's first control). */
    filterBarClears.set(bar, () => {
      for (const control of filters()) {
        if (control.disabled) continue;
        if (control.type === "checkbox") control.checked = false;
        else if (control.type === "radio") control.checked = control.value === "";
        else if (control.matches("select")) {
          for (const option of control.options) option.selected = false;
          if (!control.multiple && control.options[0]?.value === "") control.options[0].selected = true;
        } else if (control.type === "range") {
          const pair = [...control.parentElement.querySelectorAll(":scope > input[type='range']")];
          control.value = pair.length > 1 && control === pair[1] ? control.max || "100" : control.min || "0";
          control.dispatchEvent(new Event("input", { bubbles: true }));
        } else control.value = "";
        if (control.matches("input[type='date']")) control.dispatchEvent(new Event("input", { bubbles: true }));
      }
      changed(true);
      (bar.querySelector("input[type='search']") ?? controls(bar)[0])?.focus();
    });

    summarize();
  };

  const setUpFilterBars = (root) => {
    const found = [...(root.matches?.(".canon-filter-bar") ? [root] : []), ...(root.querySelectorAll?.(".canon-filter-bar") ?? [])];
    for (const bar of found) setUpFilterBar(bar);
  };
