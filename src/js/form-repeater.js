  /* ------------------------------------------------------------------ */
  /* Form Repeater                                                       */
  /*                                                                     */
  /* .canon-repeater (with an id): items (.canon-repeater-item) and      */
  /* buttons that name the repeater (commandfor): command="--canon-add"  */
  /* after the items, and in each item command="--canon-remove".         */
  /* Add copies the first item as the page wrote it (taken before        */
  /* canon.js enhances it), empty: values, choices, checks, invalid      */
  /* states and messages cleared. The copy takes the next number: the    */
  /* first item's number (the first [n] in its names) is replaced, as a  */
  /* whole number, in its ids and names and in the attributes that point */
  /* at ids (for, aria-describedby, …). A list that can start empty      */
  /* gives a <template> with one item instead, {index} for the number.   */
  /* Focus moves into the new item. Remove takes out the button's item,  */
  /* says so, and focuses the next one. Add hides at data-max, Remove at */
  /* data-min (1 by default). Each item is a group named "Item 2 of 3"   */
  /* unless the author named it. Items an app adds or removes are        */
  /* followed.                                                           */
  /* ------------------------------------------------------------------ */

  const repeaters = new WeakMap();

  commands["--canon-add"] = (target) => repeaters.get(target)?.add();
  commands["--canon-remove"] = (target, source) => repeaters.get(target)?.remove(source);

  /* The first thing in an element that takes focus from Tab. */

  /* Attributes that hold ids (or, name, the item's number). */
  const idReferences = ["id", "for", "name", "aria-describedby", "aria-labelledby", "aria-controls", "aria-owns", "list", "headers", "commandfor", "popovertarget", "data-match"];

  /* The item's number: the first [n] in its names. */
  const itemNumber = (item) => {
    for (const element of item.querySelectorAll("[name]")) {
      const found = element.getAttribute("name").match(/\[(\d+)\]/);
      if (found) return Number(found[1]);
    }
    return null;
  };

  /* An item as a new one starts: no values, choices or checks, nothing
     invalid, no messages. */
  const emptied = (item) => {
    const copy = item.cloneNode(true);
    copy.removeAttribute("role");
    for (const input of copy.querySelectorAll("input")) {
      input.removeAttribute("value");
      input.removeAttribute("checked");
    }
    for (const textarea of copy.querySelectorAll("textarea")) textarea.textContent = "";
    for (const select of copy.querySelectorAll("select")) {
      for (const option of select.options) option.removeAttribute("selected");
      const placeholder = [...select.options].find((option) => option.value === "");
      if (placeholder && !select.multiple) placeholder.setAttribute("selected", "");
    }
    for (const invalid of copy.querySelectorAll("[aria-invalid]")) invalid.removeAttribute("aria-invalid");
    for (const message of copy.querySelectorAll(".canon-field-message")) {
      message.replaceChildren();
      message.removeAttribute("data-intent");
      message.removeAttribute("data-state");
    }
    return copy;
  };

  /* The empty item, numbered: {index} in a template; otherwise the first
     item's number, replaced as a whole number (members-0-name,
     members[0][name]) in its id attributes. Without a number, ids get
     "-<number>" and what points at them follows. */
  const numbered = (source, from, index) => {
    const fragment = source instanceof HTMLTemplateElement ? document.importNode(source.content, true) : source.cloneNode(true);
    const elements = fragment instanceof Element ? [fragment, ...fragment.querySelectorAll("*")] : [...fragment.querySelectorAll("*")];
    if (source instanceof HTMLTemplateElement) {
      for (const element of elements) {
        for (const attribute of element.attributes) {
          if (attribute.value.includes("{index}")) attribute.value = attribute.value.replaceAll("{index}", index);
        }
      }
    } else if (from !== null) {
      const whole = new RegExp(`(?<![A-Za-z0-9])${from}(?![A-Za-z0-9])`, "g");
      for (const element of elements) {
        for (const name of idReferences) {
          const value = element.getAttribute(name);
          if (value) element.setAttribute(name, value.replace(whole, index));
        }
      }
    } else {
      const renamed = new Map();
      for (const element of elements) if (element.id) renamed.set(element.id, `${element.id}-${index}`);
      for (const element of elements) {
        for (const name of idReferences) {
          if (name === "name" || !element.hasAttribute(name)) continue;
          element.setAttribute(name, element.getAttribute(name).split(/\s+/).map((id) => renamed.get(id) ?? id).join(" "));
        }
      }
    }
    return fragment;
  };

  const setUpRepeater = (repeater) => {
    if (repeaters.has(repeater)) return;

    /* Not an item on its way out. */
    const items = () => [...repeater.children].filter((child) => child.matches(".canon-repeater-item:not([data-state='closing'])"));
    const template = () => [...repeater.children].find((child) => child.matches("template"));
    const addButton = () => [...repeater.children].find((child) => child.matches("button[command='--canon-add']"));
    const limit = (name, fallback) => {
      const value = parseInt(repeater.dataset[name], 10);
      return Number.isInteger(value) && value >= 0 ? value : fallback;
    };
    const min = () => limit("min", 1);
    const max = () => limit("max", Infinity);
    const named = new WeakSet();
    let next = items().length;
    /* Taken now, before canon.js enhances what the item holds. */
    const first = items()[0];
    const blank = first && emptied(first);
    const blankNumber = first ? itemNumber(first) : null;
    const source = () => template() ?? blank;
    /* While an item comes or goes, data-changing: the theme moves the
       Remove buttons' room with it (one item left has none). */
    let changing = null;
    const change = () => {
      const mark = {};
      changing = mark;
      repeater.setAttribute("data-changing", "");
      return () => {
        if (changing === mark) repeater.removeAttribute("data-changing");
      };
    };

    const sync = () => {
      const list = items();
      const add = addButton();
      if (add) add.hidden = !source() || list.length >= max();
      list.forEach((item, index) => {
        item.setAttribute("role", "group");
        if (named.has(item) || !(item.hasAttribute("aria-label") || item.hasAttribute("aria-labelledby"))) {
          named.add(item);
          item.setAttribute("aria-label", fill(text(item, "repeater-item", "Item {index} of {count}"), { index: index + 1, count: list.length }));
        }
        for (const remove of item.querySelectorAll(":scope > button[command='--canon-remove']")) remove.hidden = list.length <= min();
      });
    };

    const add = () => {
      const from = source();
      if (!from || items().length >= max()) return;
      /* The next number: past every item's, and with its ids all free. */
      let index = Math.max(next, ...items().map(itemNumber).filter((number) => number !== null).map((number) => number + 1));
      let fragment = numbered(from, blankNumber, index);
      const taken = () => [fragment, ...fragment.querySelectorAll("[id]")].some((element) => element.id && document.getElementById(element.id));
      while (taken()) fragment = numbered(from, blankNumber, ++index);
      next = index + 1;

      const item = fragment.matches?.(".canon-repeater-item") ? fragment : fragment.querySelector(".canon-repeater-item");
      const last = items().at(-1);
      if (last) last.after(fragment);
      else if (addButton()) addButton().before(fragment);
      else repeater.append(fragment);
      const changed = change();
      sync();
      if (item) playRoom(item, "opening", changed);
      else changed();
      /* After canon.js has set up what the item holds (a mutation observer). */
      requestAnimationFrame(() => (item && firstFocusable(item))?.focus());
      repeater.dispatchEvent(new CustomEvent("canon-add", { bubbles: true, detail: { item } }));
    };

    /* The item holding the button that asked. */
    const remove = (button) => {
      const list = items();
      const item = list.find((each) => each.contains(button));
      if (!item || list.length <= min()) return;
      const at = list.indexOf(item);
      const neighbour = list[at + 1] ?? list[at - 1];
      /* It closes its room, then goes. Meanwhile the others count without
         it, and its fields are off (not sent with the form). */
      item.inert = true;
      for (const control of item.querySelectorAll("input, select, textarea, button")) control.disabled = true;
      const changed = change();
      playRoom(item, "closing", () => {
        item.remove();
        changed();
      });
      sync();
      announce(text(repeater, "repeater-removed", "Item removed"));
      const target = (neighbour && firstFocusable(neighbour)) || (addButton()?.hidden ? null : addButton());
      target?.focus();
      repeater.dispatchEvent(new CustomEvent("canon-remove", { bubbles: true, detail: { item } }));
    };

    repeaters.set(repeater, { add, remove });
    new MutationObserver(sync).observe(repeater, { childList: true, attributes: true, attributeFilter: ["data-min", "data-max"] });
    sync();
  };

  const setUpRepeaters = (root) => {
    const found = [...(root.matches?.(".canon-repeater") ? [root] : []), ...(root.querySelectorAll?.(".canon-repeater") ?? [])];
    for (const repeater of found) setUpRepeater(repeater);
  };
