  /* ------------------------------------------------------------------ */
  /* Combobox                                                            */
  /*                                                                     */
  /* A <select> in .canon-combobox gets a box that opens a list. Search  */
  /* is optional: data-search="list" puts a field on top of the list,    */
  /* data-search="inline" makes the box itself the field. Without it,    */
  /* typing jumps to the option that starts with what was typed. The     */
  /* select stays the source of truth: its                               */
  /* options, value (submitted with the form), required, disabled,       */
  /* aria-invalid and aria-describedby are mirrored, and picking sets it */
  /* and fires input and change on it. Apps that change it in code fire  */
  /* change (or edit the options, which is seen). With multiple, the     */
  /* chosen values are tags with a remove button.                        */
  /*                                                                     */
  /* Options (the first two need data-search):                           */
  /*   data-creatable on the box    offers "Add …" for a new value; it   */
  /*                                becomes an <option> of the select,   */
  /*                                gone again once it isn't chosen      */
  /*   data-filter="none" on the box  the app filters: canon-search      */
  /*                                events (detail.query) on the select; */
  /*                                aria-busy="true" on it while loading */
  /*   data-tags="collapse" on the box  tags on one row, then "+N"       */
  /*   data-max on the select       at most that many values             */
  /*                                                                     */
  /* Free values (a tag input): several values, inline and creatable,   */
  /* with nothing to pick (only a placeholder and chosen values). No     */
  /* list opens: the field is a plain text field, Enter, a comma or      */
  /* leaving the box adds what was typed, and a paste with commas or    */
  /* lines adds each part. Once the app adds options, it is a combobox  */
  /* again (suggestions).                                                */
  /*                                                                     */
  /* Keyboard: on the box, the arrows or typing open the list; then Up,  */
  /* Down, Home and End move through the options (focus stays on the box */
  /* or in the search), Enter (or Space, without search) picks (several: */
  /* toggles, and the list stays open), Escape and Tab close. Inline,    */
  /* Escape also undoes typing and Backspace in an empty field removes   */
  /* the last value. The number of results is announced.                 */
  /* ------------------------------------------------------------------ */

  const comboboxSelect = ".canon-combobox > select";
  const comboboxes = new WeakSet();
  let comboboxCount = 0;

  /* Folded text, with the index of the original character behind each
     of its characters (folding can change the length). */
  const foldWithMap = (value) => {
    let folded = "";
    const at = [];
    for (let i = 0; i < value.length; i++) {
      const part = fold(value[i]);
      folded += part;
      for (let k = 0; k < part.length; k++) at.push(i);
    }
    return [folded, at];
  };

  const optionLabel = (option) =>
    (option.querySelector(".canon-option-label")?.textContent ?? option.label).trim();
  /* What the search looks in: the label and the description. */
  const optionSearchText = (option) => {
    const label = option.querySelector(".canon-option-label");
    if (!label) return option.label;
    return `${label.textContent} ${option.querySelector(".canon-option-description")?.textContent ?? ""}`;
  };

  /* The option's markup for the box or a tag: icon, avatar or dot, then
     the label. The description stays in the list. */
  const optionFace = (option) => {
    const parts = [];
    const lead = option.querySelector(":scope > :is(.canon-icon, .canon-avatar, .canon-tag-dot):first-child");
    if (lead) parts.push(lead.cloneNode(true));
    const label = document.createElement("span");
    label.textContent = optionLabel(option);
    parts.push(label);
    return parts;
  };

  /* Marks the first match in each piece of text (not in icons or
     avatars). */
  const highlight = (element, query) => {
    if (!query) return;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.parentElement.closest(".canon-avatar, .canon-icon")) nodes.push(walker.currentNode);
    }
    for (const node of nodes) {
      const [folded, at] = foldWithMap(node.data);
      const start = folded.indexOf(query);
      if (start < 0) continue;
      const range = document.createRange();
      range.setStart(node, at[start]);
      range.setEnd(node, at[start + query.length - 1] + 1);
      const mark = document.createElement("mark");
      mark.className = "canon-combobox-match";
      range.surroundContents(mark);
    }
  };

  const setUpCombobox = (select) => {
    if (comboboxes.has(select)) return;
    comboboxes.add(select);
    const box = select.parentElement;
    const id = `canon-combobox-${++comboboxCount}`;
    const multiple = select.multiple;
    const inline = box.dataset.search === "inline";
    const searchable = inline || box.dataset.search === "list";
    const make = (tag, className, attributes = {}) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
      return element;
    };
    const icon = (name) => make("span", "canon-icon", { "data-icon": name, "aria-hidden": "true" });

    /* Free values: nothing to pick, only a placeholder and chosen values
       (the theme sees the same: no unchosen, unhidden option). */
    const creatable = box.hasAttribute("data-creatable");
    const isFree = () => multiple && inline && creatable && box.dataset.filter !== "none"
      && [...select.options].every((option) => option.selected || option.hidden);

    /* Where people type: a field on top of the list, or the box. */
    const input = make("input", inline ? "canon-combobox-input" : "", {
      type: "text",
      role: "combobox",
      "aria-autocomplete": "list",
      "aria-expanded": inline ? "false" : "true",
      "aria-controls": `${id}-list`,
      autocomplete: "off",
      spellcheck: "false",
    });

    /* The value, for the trigger (or, inline with several values, for
       screen readers). */
    const value = make("span", "canon-combobox-value", { id: `${id}-value` });
    const trigger = inline ? null : make("button", "canon-combobox-trigger", {
      type: "button",
      role: "combobox",
      "aria-haspopup": searchable ? "dialog" : "listbox",
      "aria-expanded": "false",
      "aria-controls": searchable ? `${id}-popup` : `${id}-list`,
      popovertarget: `${id}-popup`,
    });
    trigger?.append(value);
    const control = trigger ?? input;
    /* Where focus is while the list is open, pointing at the keyboard's
       place: the search, or (without search) the trigger itself. */
    const focusTarget = searchable ? input : trigger;

    const list = make("div", "canon-combobox-list", { id: `${id}-list`, role: "listbox" });
    if (multiple) list.setAttribute("aria-multiselectable", "true");
    const createRule = make("hr", "canon-separator", { "aria-hidden": "true", hidden: "" });
    const createLabel = make("span", "canon-option-label");
    const createItem = make("div", "canon-combobox-option canon-combobox-create", { id: `${id}-create`, role: "option", hidden: "" });
    createItem.append(icon("plus"), createLabel);
    const row = (className, iconName) => {
      const element = make("div", className, { hidden: "" });
      const label = make("span");
      element.append(icon(iconName), label);
      return [element, label];
    };
    const [loading, loadingLabel] = row("canon-combobox-loading", "loader");
    const [empty, emptyLabel] = row("canon-combobox-empty", "search-x");

    const popup = make("div", "canon-combobox-popup", { id: `${id}-popup`, popover: inline ? "manual" : "auto" });
    if (searchable && !inline) {
      popup.setAttribute("role", "dialog");
      const search = make("div", "canon-combobox-search");
      search.append(input);
      popup.append(search);
    }
    popup.append(list, loading, empty);

    const tags = multiple ? make("ul", "canon-combobox-tags") : null;
    /* "+N": a tag in a button whose tooltip lists the hidden values (for
       the pointer: screen readers already get every value). */
    const moreLabel = make("span", "canon-tag-label");
    const more = make("li", "canon-combobox-more", { "aria-hidden": "true", hidden: "" });
    const moreTag = make("span", "canon-tag");
    const moreTip = make("div", "canon-tooltip", { id: `${id}-more`, popover: "hint", role: "tooltip" });
    const moreButton = make("button", "canon-combobox-more-button", { type: "button", tabindex: "-1", interestfor: moreTip.id });
    moreTag.append(moreLabel);
    moreButton.append(moreTag);
    more.append(moreButton, moreTip);
    tags?.append(more);
    const inputItem = inline && multiple ? make("li", "canon-combobox-input-item") : null;
    if (inputItem) {
      inputItem.append(input);
      tags.append(inputItem);
    }

    /* The box is the popup's anchor. */
    const anchor = `--${id}`;
    box.style.anchorName = box.style.anchorName && box.style.anchorName !== "none" ? `${box.style.anchorName}, ${anchor}` : anchor;
    popup.style.positionAnchor = anchor;
    popupAnchors.set(popup, box);

    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    const parts = [];
    if (tags) parts.push(tags);
    if (trigger) parts.push(trigger);
    else if (!multiple) parts.push(input);
    else parts.push(value);
    select.after(...parts, popup);

    /* The select's label and description name the box's control, the
       popup and the list. */
    const mirror = () => {
      const labels = [...select.labels].map((label, i) => label.id || (label.id = `${id}-label${i ? `-${i}` : ""}`));
      const labelledBy = select.getAttribute("aria-labelledby") || labels.join(" ");
      for (const element of inline ? [input, list] : searchable ? [trigger, popup, input, list] : [trigger, list]) {
        if (labelledBy) {
          element.setAttribute("aria-labelledby", labelledBy);
          element.removeAttribute("aria-label");
        } else if (select.hasAttribute("aria-label")) {
          element.setAttribute("aria-label", select.getAttribute("aria-label"));
        }
      }
      const describedBy = [select.getAttribute("aria-describedby"), inline && multiple ? value.id : null].filter(Boolean).join(" ");
      if (describedBy) control.setAttribute("aria-describedby", describedBy);
      else control.removeAttribute("aria-describedby");
      if (select.hasAttribute("aria-invalid")) control.setAttribute("aria-invalid", select.getAttribute("aria-invalid"));
      else control.removeAttribute("aria-invalid");
      if (select.required) control.setAttribute("aria-required", "true");
      else control.removeAttribute("aria-required");
      control.disabled = select.disabled;
      if (searchable && !inline) input.placeholder = text(box, "search", "Search");
      loadingLabel.textContent = text(box, "loading", "Loading…");
      /* Free values: a plain text field, with nothing to point at. */
      if (inline) {
        const comboboxAttributes = { role: "combobox", "aria-autocomplete": "list", "aria-controls": `${id}-list`, "aria-expanded": String(isOpen()) };
        for (const [name, value] of Object.entries(comboboxAttributes)) {
          if (isFree()) input.removeAttribute(name);
          else input.setAttribute(name, value);
        }
      }
    };

    /* The list, built from the select: groups with their caption,
       separators, and every option but hidden ones (the placeholder). A
       status (data-intent, with multiple) shows as the tag it becomes. */
    const items = new Map();
    const fillItem = (element, option) => {
      if (multiple && option.dataset.intent) {
        const tag = make("span", "canon-tag", { "data-intent": option.dataset.intent });
        const face = optionFace(option);
        face.at(-1).className = "canon-tag-label";
        tag.append(...face);
        element.replaceChildren(tag);
      } else if (option.children.length) {
        element.replaceChildren(...[...option.childNodes].map((node) => node.cloneNode(true)));
      } else {
        element.textContent = option.label;
      }
    };
    const build = () => {
      items.clear();
      list.replaceChildren();
      let count = 0;
      const item = (option) => {
        if (option.hidden) return null;
        const element = make("div", "canon-combobox-option", { id: `${id}-option-${++count}`, role: "option" });
        fillItem(element, option);
        items.set(element, option);
        return element;
      };
      for (const child of select.children) {
        if (child.matches("option")) {
          const element = item(child);
          if (element) list.append(element);
        } else if (child.matches("optgroup")) {
          const group = make("div", "", { role: "group" });
          const caption = make("div", "canon-combobox-caption", { id: `${id}-group-${++count}` });
          caption.textContent = child.label;
          group.setAttribute("aria-labelledby", caption.id);
          group.append(caption);
          for (const option of child.querySelectorAll(":scope > option")) {
            const element = item(option);
            if (element) group.append(element);
          }
          list.append(group);
        } else if (child.matches("hr")) {
          list.append(make("hr", "canon-separator", { "aria-hidden": "true" }));
        }
      }
      list.append(createRule, createItem);
      sizeToWidest();
    };

    /* In a text input, the box is as wide as its widest option, so the
       value beside it doesn't move when the choice changes. */
    const sizer = make("span", "canon-combobox-sizer", { "aria-hidden": "true" });
    const sizeToWidest = () => {
      if (!trigger || multiple || !box.parentElement.matches(".canon-text-input")) return;
      sizer.replaceChildren(...[...select.options].filter((option) => !option.hidden).map((option) => {
        const face = optionFace(option);
        face.at(-1).className = "canon-option-label";
        const span = make("span", "canon-combobox-value");
        span.append(...face);
        return span;
      }));
      if (!sizer.isConnected) trigger.append(sizer);
    };

    const placeholderOf = () => {
      const first = select.options[0];
      return first && first.value === "" ? first : null;
    };
    const chosenOptions = () => {
      const placeholder = placeholderOf();
      return [...select.selectedOptions].filter((option) => option !== placeholder);
    };

    /* Tags on one row (data-tags="collapse"): the ones that don't fit
       give way to "+N", the last one left is cut short. */
    const collapse = () => {
      if (!tags) return;
      const shown = [...tags.children].filter((li) => li !== more && li !== inputItem && !li.inert);
      for (const li of shown) {
        li.hidden = false;
        li.style.flexShrink = "";
      }
      more.hidden = true;
      if (box.dataset.tags !== "collapse" || !shown.length) return;
      for (const li of shown) li.style.flexShrink = "0";
      let hidden = 0;
      while (hidden < shown.length - 1 && tags.scrollWidth > tags.clientWidth + 0.5) {
        hidden++;
        shown[shown.length - hidden].hidden = true;
        more.hidden = false;
        moreLabel.textContent = fill(text(box, "more-values", "+{count}"), { count: hidden });
      }
      if (shown.length - hidden === 1) shown[0].style.flexShrink = "";
      moreTip.textContent = shown.slice(shown.length - hidden)
        .map((li) => li.querySelector(".canon-tag-label").textContent).join(", ");
    };

    /* Typing (inline): the field shows what is typed, not the value. */
    let typing = false;

    const tagFor = (option) => {
      const tag = make("span", "canon-tag");
      if (option.dataset.intent) tag.dataset.intent = option.dataset.intent;
      else if (option.dataset.seed) {
        tag.dataset.seed = option.dataset.seed;
        seedSlot(tag, tags);
      }
      const face = optionFace(option);
      face.at(-1).className = "canon-tag-label";
      const remove = make("button", "canon-tag-remove", {
        type: "button",
        tabindex: "-1",
        "aria-label": fill(text(box, "remove-value", "Remove {value}"), { value: optionLabel(option) }),
      });
      remove.disabled = select.disabled || option.disabled;
      remove.addEventListener("click", () => {
        option.selected = false;
        changed();
        control.focus();
      });
      tag.append(...face, remove);
      const li = make("li");
      li.append(tag);
      tagOptions.set(li, option);
      return li;
    };
    const tagOptions = new WeakMap();
    let tagsShown = false;

    /* Values people added are options only while chosen. */
    const created = new WeakSet();

    /* The box and the list show the select's value. */
    const render = () => {
      for (const option of [...select.options]) if (created.has(option) && !option.selected) option.remove();
      const placeholder = placeholderOf();
      const chosen = chosenOptions();
      const max = multiple ? Number(select.dataset.max) || Infinity : Infinity;
      const full = chosen.length >= max;
      for (const [element, option] of items) {
        element.setAttribute("aria-selected", String(option.selected));
        const off = option.disabled || option.parentElement.disabled || (full && !option.selected);
        if (off) element.setAttribute("aria-disabled", "true");
        else element.removeAttribute("aria-disabled");
      }
      if (full) createItem.setAttribute("aria-disabled", "true");
      else createItem.removeAttribute("aria-disabled");

      const showPlaceholder = () => {
        const span = make("span", "canon-combobox-placeholder");
        span.textContent = placeholder?.label ?? "";
        value.replaceChildren(span);
      };
      if (!multiple) {
        if (inline) {
          if (!typing) input.value = chosen[0] ? optionLabel(chosen[0]) : "";
          input.placeholder = placeholder?.label ?? "";
        } else if (chosen[0]) {
          const face = optionFace(chosen[0]);
          face.at(-1).className = "canon-option-label";
          value.replaceChildren(...face);
        } else showPlaceholder();
        return;
      }
      if (chosen.length) value.textContent = chosen.map(optionLabel).join(", ");
      else if (inline) value.textContent = "";
      else showPlaceholder();
      if (inline) input.placeholder = chosen.length ? "" : placeholder?.label ?? "";
      /* Tags still chosen stay (drawn afresh); new ones open their room,
         unchosen ones close theirs where they were, then go. The box's
         height follows them (data-resizing, from --canon-motion-from-height
         to --canon-motion-to-height) when they take more rows or fewer. */
      const fromHeight = tagsShown ? box.getBoundingClientRect().height : null;
      const kept = new Map();
      const leaving = [];
      for (const li of [...tags.children]) {
        if (li === more || li === inputItem || li.dataset.state === "closing") continue;
        const option = tagOptions.get(li);
        if (chosen.includes(option) && !kept.has(option)) kept.set(option, li);
        else leaving.push(li);
      }
      const keptItems = new Set(kept.values());
      const before = new Map(leaving.map((li) => {
        let next = li.nextElementSibling;
        while (next && next !== more && !keptItems.has(next)) next = next.nextElementSibling;
        return [li, next ?? more];
      }));
      const coming = [];
      more.before(...chosen.map((option) => {
        const fresh = tagFor(option);
        const li = kept.get(option);
        if (!li) {
          coming.push(fresh);
          return fresh;
        }
        li.replaceChildren(...fresh.childNodes);
        return li;
      }));
      for (const li of leaving) {
        before.get(li).before(li);
        li.inert = true;
      }
      collapse();
      if (fromHeight !== null) {
        const wasHidden = leaving.map((li) => li.hidden);
        for (const li of leaving) li.hidden = true;
        const toHeight = box.getBoundingClientRect().height;
        leaving.forEach((li, index) => { li.hidden = wasHidden[index]; });
        if (Math.abs(toHeight - fromHeight) > 0.5) {
          box.style.setProperty("--canon-motion-from-height", `${fromHeight}px`);
          box.style.setProperty("--canon-motion-to-height", `${toHeight}px`);
          markMotion(box, "data-resizing", coming.length ? "opening" : "closing", () => {
            box.style.removeProperty("--canon-motion-from-height");
            box.style.removeProperty("--canon-motion-to-height");
          });
        }
      }
      for (const li of leaving) {
        playRoom(li, "closing", () => {
          li.remove();
          collapse();
        });
      }
      if (tagsShown) for (const li of coming) if (!li.hidden) playRoom(li, "opening", collapse);
      tagsShown = true;
    };

    const changed = () => {
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const isOpen = () => popup.matches(":popover-open");
    const typed = () => (inline && !typing ? "" : input.value.trim());

    /* The app filters (data-filter="none"): tell it what was typed. */
    const search = () => {
      if (!searchable || box.dataset.filter !== "none") return;
      select.dispatchEvent(new CustomEvent("canon-search", { bubbles: true, detail: { query: typed() } }));
    };

    /* Filtering: an option matches when its label or description
       contains what was typed; the match is marked. Groups with nothing
       left go, and so do separators with nothing on one side. Then
       "Add …" (data-creatable, when no option is called that), "Loading"
       (aria-busy on the select) or "No results". */
    let announceTimer;
    const filter = (announceCount) => {
      const raw = typed();
      const query = fold(raw);
      const filtering = box.dataset.filter !== "none";
      let count = 0;
      for (const [element, option] of items) {
        if (element.querySelector("mark") || query) fillItem(element, option);
        element.hidden = filtering && query !== "" && !fold(optionSearchText(option)).includes(query);
        if (!element.hidden) {
          count++;
          highlight(element, query);
        }
      }
      for (const group of list.querySelectorAll(":scope > [role='group']")) {
        group.hidden = !group.querySelector(":scope > [role='option']:not([hidden])");
      }
      let before = false;
      let pending = null;
      for (const child of list.children) {
        if (child === createRule || child === createItem) continue;
        if (child.matches("hr")) {
          child.hidden = true;
          if (before) pending = child;
        } else if (!child.hidden) {
          if (pending) pending.hidden = false;
          pending = null;
          before = true;
        }
      }
      const exists = [...items.values()].some((option) => fold(optionLabel(option)) === query);
      const create = searchable && box.hasAttribute("data-creatable") && raw !== "" && !exists;
      createItem.hidden = !create;
      createRule.hidden = !(create && count > 0);
      createLabel.textContent = fill(text(box, "create-option", "Add “{value}”"), { value: raw });
      const busy = select.getAttribute("aria-busy") === "true";
      loading.hidden = !busy;
      empty.hidden = busy || count > 0 || create;
      emptyLabel.textContent = raw
        ? fill(text(box, "no-results-for", "No results for “{query}”"), { query: raw })
        : text(box, "no-results", "No results");
      list.hidden = count === 0 && !create;
      clearTimeout(announceTimer);
      if (announceCount && !busy) {
        announceTimer = setTimeout(() => {
          announce(count ? countText(box, "results", count) : create ? createLabel.textContent : emptyLabel.textContent);
        }, 500);
      }
    };

    /* The keyboard's place in the list (aria-activedescendant; the theme
       sees data-state="active"). */
    let active = null;
    const choosable = () => [...list.querySelectorAll("[role='option']")].filter((element) =>
      !element.hidden && !element.parentElement.hidden && element.getAttribute("aria-disabled") !== "true");
    const activate = (element, scroll = true) => {
      if (active) delete active.dataset.state;
      active = element ?? null;
      if (!active) return focusTarget.removeAttribute("aria-activedescendant");
      active.dataset.state = "active";
      focusTarget.setAttribute("aria-activedescendant", active.id);
      if (scroll) active.scrollIntoView({ block: "nearest" });
    };
    const move = (down) => {
      const options = choosable();
      const at = options.indexOf(active);
      activate(down
        ? options[at < 0 ? 0 : Math.min(at + 1, options.length - 1)]
        : options[at < 0 ? options.length - 1 : Math.max(at - 1, 0)]);
    };

    const close = () => {
      if (isOpen()) popup.hidePopover();
    };

    /* A new value: an option of the select (or the existing one with
       that name), chosen. */
    const create = (name = typed()) => {
      if (!name) return false;
      const max = multiple ? Number(select.dataset.max) || Infinity : Infinity;
      let option = [...select.options].find((o) => fold(optionLabel(o)) === fold(name));
      if (!option?.selected && chosenOptions().length >= max) return false;
      if (!option) {
        option = new Option(name, name);
        created.add(option);
        select.append(option);
      }
      option.selected = true;
      typing = false;
      if (multiple) input.value = "";
      changed();
      if (!multiple) close();
      else filter(false);
      return true;
    };

    const pick = (element) => {
      if (element.getAttribute("aria-disabled") === "true") return;
      if (element === createItem) return create();
      const option = items.get(element);
      if (!option) return;
      option.selected = multiple ? !option.selected : true;
      typing = false;
      changed();
      if (!multiple) return close();
      if (inline && input.value) {
        input.value = "";
        filter(false);
        search();
      }
      if (!element.hidden) activate(element, false);
    };

    /* Once open: the keyboard on the chosen option (or the first match),
       focus in the search. */
    const opened = () => {
      control.setAttribute("aria-expanded", "true");
      if (document.activeElement !== focusTarget) focusTarget.focus();
      if (active?.isConnected && !active.hidden) return;
      const selected = choosable().find((element) => items.get(element)?.selected);
      activate(typed() ? choosable()[0] : selected ?? choosable()[0]);
    };

    /* Opening by typing on the box starts the search with that text. */
    let query = "";
    const open = (typedText = "") => {
      if (!searchable) {
        if (!isOpen()) {
          popup.showPopover({ source: control });
          opened();
        }
        if (typedText) jump(typedText);
        return;
      }
      if (isOpen()) {
        input.value += typedText;
        typing = true;
        filter(true);
        search();
        activate(choosable()[0]);
        return input.focus();
      }
      query = typedText;
      popup.showPopover({ source: control });
      opened();
    };

    popup.addEventListener("beforetoggle", (event) => {
      if (event.newState !== "open") return;
      mirror();
      if (searchable && !inline) {
        input.value = query;
        query = "";
      }
      filter(false);
      search();
    });
    popup.addEventListener("toggle", (event) => {
      if (event.newState === "open") return opened();
      control.setAttribute("aria-expanded", "false");
      activate(null);
      if (inline) {
        typing = false;
        if (multiple) input.value = "";
        render();
      } else if (document.activeElement === document.body || popup.contains(document.activeElement)) {
        trigger.focus();
      }
    });

    /* Without search, typing jumps: to the next option starting with what
       was typed in the last half second (one letter again: the next one
       with it). */
    let typedAhead = "";
    let typeAheadTimer;
    const jump = (key) => {
      clearTimeout(typeAheadTimer);
      typeAheadTimer = setTimeout(() => { typedAhead = ""; }, 500);
      typedAhead += fold(key);
      const repeat = [...typedAhead].every((char) => char === typedAhead[0]);
      const wanted = repeat ? typedAhead[0] : typedAhead;
      const options = choosable();
      const from = options.indexOf(active) + (repeat || !active ? 1 : 0);
      const ordered = [...options.slice(from), ...options.slice(0, from)];
      const found = ordered.find((element) => items.has(element) && fold(optionLabel(items.get(element))).startsWith(wanted));
      if (found) activate(found);
    };

    if (trigger) {
      moreButton.addEventListener("click", () => open());
      let swallowSpace = false;
      trigger.addEventListener("keydown", (event) => {
        if (event.altKey && event.key !== "ArrowDown") return;
        if (event.ctrlKey || event.metaKey) return;
        /* Open, without search: the list's keys, on the trigger. */
        if (!searchable && isOpen()) {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            move(event.key === "ArrowDown");
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            const options = choosable();
            activate(event.key === "Home" ? options[0] : options.at(-1));
          } else if (event.key === "Enter" || (event.key === " " && !typedAhead)) {
            event.preventDefault();
            swallowSpace = event.key === " ";
            if (active) pick(active);
          } else if (event.key === "Tab") {
            close();
          } else if (event.key.length === 1) {
            event.preventDefault();
            jump(event.key);
          }
          return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          open();
        } else if (event.key.length === 1 && event.key !== " ") {
          event.preventDefault();
          open(event.key);
        }
      });
      /* Space picks on keydown; its keyup must not press the button. */
      trigger.addEventListener("keyup", (event) => {
        if (event.key === " " && swallowSpace) {
          event.preventDefault();
          swallowSpace = false;
        }
      });
    } else {
      /* Inline: the box opens the list; leaving it closes the list. */
      box.addEventListener("pointerdown", (event) => {
        if (input.disabled || event.button !== 0) return;
        if (event.target.closest(".canon-tag-remove, .canon-button, .canon-combobox-popup")) return;
        if (event.target !== input) event.preventDefault();
        input.focus();
        if (isFree()) return;
        if (!isOpen()) open();
        else if (event.target !== input) close();
      });
      box.addEventListener("focusout", (event) => {
        if (box.contains(event.relatedTarget)) return;
        close();
        /* Free values: what was typed isn't lost. */
        if (isFree() && typed()) create();
      });
    }

    input.addEventListener("input", () => {
      typing = true;
      if (isFree()) return;
      if (inline && !isOpen()) {
        popup.showPopover({ source: control });
        opened();
      }
      filter(true);
      search();
      activate(choosable()[0]);
    });
    input.addEventListener("keydown", (event) => {
      if (isFree() && (event.key === "Enter" || event.key === ",")) {
        /* Free values: Enter or a comma adds what was typed (an empty
           field lets Enter submit the form). */
        if (!typed()) {
          if (event.key === ",") event.preventDefault();
          return;
        }
        event.preventDefault();
        create();
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (isFree()) return;
        event.preventDefault();
        if (!isOpen()) open();
        else move(event.key === "ArrowDown");
      } else if (event.key === "Enter") {
        if (!isOpen()) return;
        event.preventDefault();
        if (active) pick(active);
      } else if (event.key === "Escape" && inline) {
        event.preventDefault();
        if (isOpen()) close();
        else if (typing || (multiple && input.value)) {
          typing = false;
          if (multiple) input.value = "";
          render();
        }
      } else if (event.key === "Tab") {
        close();
      } else if (event.key === "Backspace" && inline && multiple && input.value === "") {
        const last = chosenOptions().at(-1);
        if (!last || select.disabled) return;
        last.selected = false;
        changed();
        announce(fill(text(box, "removed-value", "{value} removed"), { value: optionLabel(last) }));
      }
    });

    /* Free values: a paste with commas or lines adds each part. The last
       part (after a trailing comma: none) stays to be finished, and so do
       the parts past the limit. */
    input.addEventListener("paste", (event) => {
      if (!isFree()) return;
      const pasted = event.clipboardData?.getData("text") ?? "";
      if (!/[,\n]/.test(pasted)) return;
      event.preventDefault();
      const parts = (input.value.slice(0, input.selectionStart) + pasted + input.value.slice(input.selectionEnd)).split(/[,\n]/);
      const last = parts.pop().trim();
      const left = parts.map((part) => part.trim()).filter((part) => part && !create(part));
      input.value = [...left, last].filter(Boolean).join(", ");
      typing = input.value !== "";
    });

    list.addEventListener("pointerdown", (event) => event.preventDefault());
    list.addEventListener("pointermove", (event) => {
      const element = event.target.closest("[role='option']");
      if (element && element !== active && element.getAttribute("aria-disabled") !== "true") activate(element, false);
    });
    list.addEventListener("click", (event) => {
      const element = event.target.closest("[role='option']");
      if (element) pick(element);
    });

    /* Focus that reaches the select (its label, a failed submit) goes to
       the box's control. */
    select.addEventListener("focus", () => control.focus());
    select.addEventListener("change", render);
    select.form?.addEventListener("reset", () => setTimeout(render));
    if (tags) {
      new ResizeObserver(() => collapse()).observe(box);
      document.fonts?.ready.then(collapse);
    }

    /* The app may change the options or attributes (aria-busy too). */
    let pending = false;
    new MutationObserver(() => {
      if (pending) return;
      pending = true;
      queueMicrotask(() => {
        pending = false;
        mirror();
        build();
        render();
        if (isOpen()) {
          filter(true);
          if (!active?.isConnected || active.hidden) activate(choosable()[0]);
        }
      });
    }).observe(select, { childList: true, subtree: true, characterData: true, attributes: true });

    /* Free values: the ones it starts with go when unchosen, like added
       ones. */
    if (isFree()) for (const option of chosenOptions()) created.add(option);

    mirror();
    build();
    render();
  };

  const setUpComboboxes = (root) => {
    if (root.matches?.(comboboxSelect)) setUpCombobox(root);
    for (const select of root.querySelectorAll?.(comboboxSelect) ?? []) setUpCombobox(select);
  };
