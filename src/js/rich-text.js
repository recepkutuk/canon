  /* ------------------------------------------------------------------ */
  /* Rich text (a Textarea with data-rich)                               */
  /*                                                                     */
  /* The <textarea> keeps the value: clean HTML, what the form submits.  */
  /* canon.js hides it (still the label's target, the form value and     */
  /* what validation checks) and draws, inside the box, a Toolbar of the */
  /* groups in data-tools (default "history block marks link lists")     */
  /* over an editable area (role="textbox") driven by the browser's      */
  /* editing commands. Only the HTML in richClean's lists is kept: paste */
  /* is cleaned, and so is what is written back to the textarea. The     */
  /* toolbar follows the selection; links, colors and images use         */
  /* Popovers, Insert a Menu.                                            */
  /* ------------------------------------------------------------------ */

  const richTools = ["history", "block", "align", "marks", "link", "color", "clear", "script", "lists", "indent", "insert"];
  const richDefault = "history block marks link lists";
  const richPalette = [["#dc2626", "red"], ["#ea580c", "orange"], ["#ca8a04", "yellow"], ["#16a34a", "green"], ["#2563eb", "blue"], ["#9333ea", "purple"], ["#71717a", "gray"]];

  /* Colors compared as the browser writes them. */
  const colorProbe = document.createElement("span");
  const normalColor = (value) => {
    colorProbe.style.color = "";
    colorProbe.style.color = value || "";
    return colorProbe.style.color;
  };
  const paletteColor = (value) => {
    const normal = normalColor(value);
    return normal ? richPalette.find(([hex]) => normalColor(hex) === normal)?.[0] ?? null : null;
  };
  const safeUrl = (value, image) => {
    const url = (value ?? "").trim();
    if (!url) return null;
    if (/^(https?:|\/|\.|#|\?)/i.test(url)) return url;
    if (!image && /^(mailto:|tel:)/i.test(url)) return url;
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null;
    return url;
  };

  /* Keep: p, h2-h4 (h1 becomes h2, h5 and h6 h4), blockquote, pre (its
     text), ul, ol, li, hr, img (src, alt), br, strong, em, u, s, sub,
     sup, a (href, and target="_blank" with rel="noopener"), span with a
     palette color; text-align on blocks (logical: start, end). Everything else is unwrapped or,
     for scripts, styles and embeds, dropped. */
  const richClean = (html, rtl = false) => {
    const source = document.createElement("template");
    source.innerHTML = html;
    const out = document.createElement("div");
    const drop = new Set(["SCRIPT", "STYLE", "TEMPLATE", "IFRAME", "OBJECT", "EMBED", "HEAD", "META", "LINK", "TITLE", "NOSCRIPT", "SVG", "MATH", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "FORM"]);
    const rename = { H1: "H2", H5: "H4", H6: "H4", B: "STRONG", I: "EM", STRIKE: "S", DEL: "S", FONT: "SPAN" };
    const keep = new Set(["P", "H2", "H3", "H4", "BLOCKQUOTE", "PRE", "UL", "OL", "LI", "HR", "IMG", "BR", "STRONG", "EM", "U", "S", "SUB", "SUP", "A", "SPAN"]);
    const aligned = new Set(["P", "H2", "H3", "H4", "BLOCKQUOTE", "LI"]);
    const blockish = /^(P|H[1-6]|BLOCKQUOTE|PRE|UL|OL|LI|HR|DIV|SECTION|ARTICLE|HEADER|FOOTER|MAIN|ASIDE|NAV|TABLE|FIGURE)$/;
    const walk = (from, to) => {
      for (const node of from.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          to.append(node.textContent);
          continue;
        }
        if (node.nodeType !== Node.ELEMENT_NODE || drop.has(node.tagName)) continue;
        let tag = rename[node.tagName] ?? node.tagName;
        /* A div of text is a paragraph; one holding blocks just goes. */
        if (/^(DIV|SECTION|ARTICLE|HEADER|FOOTER|MAIN|ASIDE|FIGURE)$/.test(tag)) {
          tag = [...node.children].some((child) => blockish.test(child.tagName)) ? null : "P";
          if (tag && to.closest?.("p, h2, h3, h4, li, pre")) tag = null;
        }
        if (!tag || !keep.has(tag)) {
          walk(node, to);
          continue;
        }
        if (tag === "PRE") {
          const pre = document.createElement("pre");
          pre.textContent = node.textContent;
          to.append(pre);
          continue;
        }
        const element = document.createElement(tag.toLowerCase());
        if (tag === "A") {
          const href = safeUrl(node.getAttribute("href"));
          if (!href) {
            walk(node, to);
            continue;
          }
          element.setAttribute("href", href);
          if (node.getAttribute("target") === "_blank") {
            element.setAttribute("target", "_blank");
            element.setAttribute("rel", "noopener");
          }
        } else if (tag === "IMG") {
          const src = safeUrl(node.getAttribute("src"), true);
          if (!src) continue;
          element.setAttribute("src", src);
          element.setAttribute("alt", node.getAttribute("alt") ?? "");
        } else if (tag === "SPAN") {
          const color = paletteColor(node.style?.color || node.getAttribute("color"));
          if (!color) {
            walk(node, to);
            continue;
          }
          element.setAttribute("style", `color: ${color}`);
        }
        if (aligned.has(tag)) {
          /* Logical: left and right become start and end for the text's
             direction; start is the default and isn't written. */
          let align = (node.style?.textAlign || node.getAttribute("align") || "").toLowerCase();
          if (align === "left") align = rtl ? "end" : "start";
          if (align === "right") align = rtl ? "start" : "end";
          if (["center", "justify", "end"].includes(align)) element.setAttribute("style", `text-align: ${align}`);
        }
        to.append(element);
        if (tag !== "BR" && tag !== "HR" && tag !== "IMG") walk(node, element);
      }
    };
    walk(source.content, out);
    /* Loose words between blocks go in paragraphs. */
    const isBlock = (node) => node.nodeType === Node.ELEMENT_NODE && /^(P|H2|H3|H4|BLOCKQUOTE|PRE|UL|OL|HR)$/.test(node.tagName);
    let run = null;
    for (const node of [...out.childNodes]) {
      if (isBlock(node)) {
        run = null;
        continue;
      }
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim() && !run) {
        node.remove();
        continue;
      }
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "LI") {
        run = null;
        const list = document.createElement("ul");
        node.replaceWith(list);
        list.append(node);
        continue;
      }
      if (!run) {
        run = document.createElement("p");
        node.before(run);
      }
      run.append(node);
    }
    for (const paragraph of out.querySelectorAll(":scope > p")) {
      if (!paragraph.textContent.trim() && !paragraph.querySelector("img, br")) paragraph.remove();
    }
    /* Nothing written: no value. */
    if (!out.textContent.trim() && !out.querySelector("img, hr")) return "";
    return out.innerHTML;
  };

  const richBoxes = new WeakSet();

  const setUpRich = (box) => {
    const textarea = box.querySelector(":scope > textarea");
    if (!textarea || richBoxes.has(box)) return;
    richBoxes.add(box);
    const label = (key, fallback) => text(box, `rich-${key}`, fallback);
    const id = textarea.id || `canon-rich-${Math.random().toString(36).slice(2, 8)}`;
    const tools = new Set((box.dataset.tools || richDefault).split(/\s+/).flatMap((tool) => (tool === "all" ? richTools : [tool])));
    const make = (tag, className, attributes = {}) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
      return element;
    };
    const iconOf = (name) => make("span", "canon-icon", { "data-icon": name, "aria-hidden": "true" });
    const button = (icon, name, attributes = {}) => {
      const element = make("button", "canon-button", { type: "button", ...attributes });
      element.append(iconOf(icon), Object.assign(make("span", "canon-button-label"), { textContent: name }));
      return element;
    };
    const group = (name, attributes = {}) => make("div", "canon-button-group", { role: "group", "aria-label": name, "data-display": "icon", ...attributes });

    /* The area. */
    const area = make("div", "canon-rich-area", {
      role: "textbox",
      "aria-multiline": "true",
      contenteditable: "true",
      spellcheck: "true",
    });
    const fieldLabel = textarea.labels?.[0];
    if (fieldLabel) {
      if (!fieldLabel.id) fieldLabel.id = `${id}-label`;
      area.setAttribute("aria-labelledby", fieldLabel.id);
    } else if (textarea.hasAttribute("aria-label")) area.setAttribute("aria-label", textarea.getAttribute("aria-label"));
    const placeholder = textarea.getAttribute("placeholder");
    if (placeholder) area.dataset.placeholder = placeholder;
    area.style.setProperty("--canon-rich-rows", textarea.rows || 2);
    const maxLines = textarea.dataset.maxLines;
    if (maxLines && maxLines !== "none") area.style.setProperty("--canon-rich-max-lines", maxLines);
    if (maxLines === "none") area.dataset.grow = "";

    /* The toolbar. */
    const toolbar = make("div", "canon-toolbar canon-rich-toolbar", { role: "toolbar", "aria-label": label("toolbar", "Formatting") });
    const boxSize = box.closest("[data-size]")?.dataset.size;
    toolbar.dataset.size = ["lg", "xl", "2xl"].includes(boxSize) ? "md" : "sm";
    toolbar.setAttribute("aria-controls", `${id}-area`);
    area.id = `${id}-area`;
    const controls = {};
    const pressed = [];

    if (tools.has("history")) {
      const history = group(label("history", "History"));
      controls.undo = button("undo", label("undo", "Undo"), { "aria-keyshortcuts": "Control+Z Meta+Z" });
      controls.redo = button("redo", label("redo", "Redo"), { "aria-keyshortcuts": "Control+Shift+Z Meta+Shift+Z" });
      history.append(controls.undo, controls.redo);
      toolbar.append(history);
    }
    if (tools.has("block")) {
      const select = make("select", "", { "aria-label": label("block", "Text style") });
      for (const [value, key, fallback] of [["p", "paragraph", "Paragraph"], ["h2", "heading-1", "Heading 1"], ["h3", "heading-2", "Heading 2"], ["h4", "heading-3", "Heading 3"], ["blockquote", "quote", "Quote"], ["pre", "code", "Code"]]) {
        select.append(new Option(label(key, fallback), value));
      }
      const selectBox = make("div", "canon-select");
      selectBox.append(iconOf("text-cursor"), select);
      controls.block = select;
      toolbar.append(selectBox);
    }
    if (tools.has("align")) {
      const align = group(label("align", "Alignment"), { "data-select": "one" });
      for (const [icon, key, fallback] of [["align-start", "align-start", "Align left"], ["align-center", "align-center", "Center"], ["align-end", "align-end", "Align right"], ["align-justify", "align-justify", "Justify"]]) {
        const each = button(icon, label(key, fallback), { "aria-pressed": "false", "data-command": key });
        controls[key] = each;
        pressed.push(each);
        align.append(each);
      }
      toolbar.append(align);
    }
    if (tools.has("marks")) {
      const marks = group(label("marks", "Character style"));
      for (const [icon, command, fallback, keys] of [["bold", "bold", "Bold", "Control+B Meta+B"], ["italic", "italic", "Italic", "Control+I Meta+I"], ["underline", "underline", "Underline", "Control+U Meta+U"], ["strikethrough", "strikeThrough", "Strikethrough"]]) {
        const each = button(icon, label(icon, fallback), { "aria-pressed": "false", "data-command": command, ...(keys ? { "aria-keyshortcuts": keys } : {}) });
        controls[command] = each;
        pressed.push(each);
        marks.append(each);
      }
      toolbar.append(marks);
    }

    /* Popovers: a link, a color, an image. Built only when their tool is. */
    const popover = (key, title) => {
      const element = make("div", "canon-popover", { id: `${id}-${key}`, popover: "", role: "dialog", "aria-labelledby": `${id}-${key}-title` });
      element.append(Object.assign(make("h2", "canon-popover-title", { id: `${id}-${key}-title` }), { textContent: title }));
      return element;
    };
    const textField = (key, name, type, hint) => {
      const field = make("div", "canon-field");
      const top = make("div", "canon-label");
      top.append(Object.assign(make("label", "canon-label-text", { for: `${id}-${key}` }), { textContent: name }));
      const input = make("input", "", { type, id: `${id}-${key}`, name: key, placeholder: type === "url" ? "https://" : "", size: "32" });
      if (hint) {
        top.append(Object.assign(make("p", "canon-label-description", { id: `${id}-${key}-hint` }), { textContent: hint }));
        input.setAttribute("aria-describedby", `${id}-${key}-hint`);
      }
      const inputBox = make("div", "canon-text-input");
      inputBox.append(input);
      field.append(top, inputBox);
      return [field, input];
    };
    const actionsRow = (...buttons) => {
      const row = make("div", "canon-form-actions");
      row.append(...buttons);
      return row;
    };
    const plainButton = (name, attributes = {}) => {
      const element = make("button", "canon-button", { type: "button", ...attributes });
      element.append(Object.assign(make("span", "canon-button-label"), { textContent: name }));
      return element;
    };

    let linkPopover;
    let linkUrl;
    let linkNewTab;
    let linkRemove;
    if (tools.has("link")) {
      controls.link = button("link", label("link", "Link"), { "data-display": "icon", popovertarget: `${id}-link`, "aria-haspopup": "dialog", "aria-keyshortcuts": "Control+K Meta+K" });
      toolbar.append(controls.link);
      linkPopover = popover("link", label("link-title", "Link"));
      const form = make("form", "canon-form");
      const [urlField, url] = textField("link-url", label("link-url", "Address"), "url");
      linkUrl = url;
      const choice = make("div", "canon-choice");
      linkNewTab = make("input", "", { type: "checkbox", id: `${id}-link-new` });
      choice.append(linkNewTab, Object.assign(make("label", "canon-choice-label", { for: `${id}-link-new` }), { textContent: label("link-new-tab", "Open in a new tab") }));
      linkRemove = plainButton(label("link-remove", "Remove link"), { "data-emphasis": "low", "data-intent": "danger" });
      form.append(urlField, choice, actionsRow(plainButton(label("apply", "Apply"), { type: "submit", "data-emphasis": "high" }), linkRemove));
      linkPopover.append(form);
    }

    let colorPopover;
    if (tools.has("color")) {
      controls.color = button("baseline", label("color", "Text color"), { "data-display": "icon", popovertarget: `${id}-color`, "aria-haspopup": "dialog" });
      toolbar.append(controls.color);
      colorPopover = make("div", "canon-popover", { id: `${id}-color`, popover: "", role: "dialog", "aria-label": label("color", "Text color") });
      const swatches = make("div", "canon-swatches", { role: "radiogroup", "aria-label": label("color", "Text color") });
      for (const [hex, name] of richPalette) {
        const radio = make("input", "", { type: "radio", name: `${id}-color`, value: hex, "aria-label": label(`color-${name}`, name[0].toUpperCase() + name.slice(1)) });
        swatches.append(radio);
      }
      const reset = plainButton(label("color-default", "Default color"), { "data-emphasis": "minimal", "data-intent": "neutral", "data-color": "" });
      colorPopover.append(swatches, reset);
    }
    if (tools.has("clear")) {
      controls.clear = button("eraser", label("clear", "Clear formatting"), { "data-display": "icon", "data-command": "removeFormat" });
      toolbar.append(controls.clear);
    }
    if (tools.has("script")) {
      const script = group(label("script", "Script"));
      for (const [icon, command, fallback] of [["subscript", "subscript", "Subscript"], ["superscript", "superscript", "Superscript"]]) {
        const each = button(icon, label(icon, fallback), { "aria-pressed": "false", "data-command": command });
        controls[command] = each;
        pressed.push(each);
        script.append(each);
      }
      toolbar.append(script);
    }
    if (tools.has("lists")) {
      const lists = group(label("lists", "Lists"));
      for (const [icon, command, key, fallback] of [["list-ordered", "insertOrderedList", "numbered", "Numbered list"], ["list", "insertUnorderedList", "bulleted", "Bulleted list"]]) {
        const each = button(icon, label(key, fallback), { "aria-pressed": "false", "data-command": command });
        controls[command] = each;
        pressed.push(each);
        lists.append(each);
      }
      toolbar.append(lists);
    }
    if (tools.has("indent")) {
      const indent = group(label("indentation", "Indentation"));
      controls.outdent = button("indent-decrease", label("outdent", "Decrease indent"), { "data-command": "outdent" });
      controls.indent = button("indent-increase", label("indent", "Increase indent"), { "data-command": "indent" });
      indent.append(controls.outdent, controls.indent);
      toolbar.append(indent);
    }

    let imagePopover;
    let imageUrl;
    let imageAlt;
    if (tools.has("insert")) {
      controls.insert = make("button", "canon-button", { type: "button", popovertarget: `${id}-insert`, "aria-haspopup": "menu", "aria-expanded": "false" });
      controls.insert.append(iconOf("plus"), Object.assign(make("span", "canon-button-label"), { textContent: label("insert", "Insert") }));
      const menu = make("div", "canon-menu", { id: `${id}-insert`, popover: "", role: "menu", "aria-label": label("insert", "Insert") });
      const item = (name, value) => {
        const element = make("button", "canon-menu-item", { type: "button", role: "menuitem", "data-insert": value });
        element.append(Object.assign(make("span", "canon-menu-label"), { textContent: name }));
        return element;
      };
      menu.append(item(label("insert-hr", "Horizontal line"), "hr"), item(label("insert-image", "Image…"), "image"));
      toolbar.append(controls.insert, menu);
      imagePopover = popover("image", label("image-title", "Image"));
      const form = make("form", "canon-form");
      const [urlField, url] = textField("image-url", label("image-url", "Address"), "url");
      url.required = true;
      const [altField, alt] = textField("image-alt", label("image-alt", "Description"), "text", label("image-alt-hint", "What the image shows, for people who can't see it."));
      imageUrl = url;
      imageAlt = alt;
      form.append(urlField, altField, actionsRow(plainButton(label("insert", "Insert"), { type: "submit", "data-emphasis": "high" }), plainButton(label("cancel", "Cancel"), { "data-emphasis": "low", "data-intent": "neutral", popovertarget: `${id}-image`, popovertargetaction: "hide" })));
      imagePopover.append(form);
    }

    for (const element of [linkPopover, colorPopover, imagePopover]) if (element) toolbar.append(element);
    /* Buttons on their own in the toolbar: low and neutral (Toolbar). */
    for (const single of toolbar.querySelectorAll(":scope > .canon-button")) {
      single.dataset.emphasis ??= "low";
      single.dataset.intent ??= "neutral";
    }
    if (toolbar.children.length) box.prepend(toolbar);
    box.append(area);

    /* The textarea: hidden, still the value; its focus (the label, a failed
       check) goes to the area. */
    textarea.tabIndex = -1;
    textarea.setAttribute("aria-hidden", "true");
    textarea.addEventListener("focus", () => area.focus());

    const rtl = () => getComputedStyle(area).direction === "rtl";

    /* Value: the area, cleaned, written to the textarea. */
    let writing = false;
    let lastValue = textarea.value;
    const render = (html) => {
      area.innerHTML = richClean(html, rtl());
      markEmpty();
    };
    const markEmpty = () => {
      area.toggleAttribute("data-empty", !area.textContent.trim() && !area.querySelector("img, hr, li"));
    };
    const write = () => {
      markEmpty();
      const value = richClean(area.innerHTML, rtl());
      if (value === textarea.value) return;
      writing = true;
      textarea.value = value;
      lastValue = value;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      writing = false;
    };
    render(textarea.value);
    area.addEventListener("input", write);
    area.addEventListener("blur", () => {
      if (textarea.value !== lastChange) {
        lastChange = textarea.value;
        textarea.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    let lastChange = textarea.value;
    textarea.addEventListener("input", () => {
      if (!writing && textarea.value !== lastValue) {
        lastValue = textarea.value;
        render(textarea.value);
      }
    });
    textarea.form?.addEventListener("reset", () => setTimeout(() => {
      lastValue = textarea.value;
      render(textarea.value);
    }));

    /* The selection: kept while focus is in the toolbar or a popover, put
       back before each command. */
    let saved = null;
    const inArea = (node) => node && (node === area || area.contains(node));
    document.addEventListener("selectionchange", () => {
      const selection = getSelection();
      if (selection.rangeCount && inArea(selection.anchorNode)) {
        saved = selection.getRangeAt(0).cloneRange();
        syncState();
      }
    });
    const restore = () => {
      area.focus({ preventScroll: true });
      if (!saved) return;
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(saved);
    };
    const run = (command, value = null) => {
      restore();
      document.execCommand("styleWithCSS", false, false);
      document.execCommand("defaultParagraphSeparator", false, "p");
      document.execCommand(command, false, value);
      write();
      syncState();
      /* After a cancelled toggle has put its old state back. */
      setTimeout(syncState);
    };
    const closestIn = (selector) => {
      const node = saved?.commonAncestorContainer;
      const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
      const found = element?.closest(selector);
      return found && area.contains(found) ? found : null;
    };

    /* The toolbar follows the selection. */
    const syncState = () => {
      if (!saved) return;
      const state = (command) => {
        try {
          return document.queryCommandState(command);
        } catch {
          return false;
        }
      };
      for (const command of ["bold", "italic", "underline", "strikeThrough", "subscript", "superscript", "insertOrderedList", "insertUnorderedList"]) {
        controls[command]?.setAttribute("aria-pressed", String(state(command)));
      }
      if (controls["align-start"]) {
        const block = closestIn("p, h2, h3, h4, blockquote, li, pre");
        const align = block ? getComputedStyle(block).textAlign : "start";
        const side = align === "center" ? "align-center" : align === "justify" ? "align-justify"
          : (align === "right" && !rtl()) || (align === "left" && rtl()) || align === "end" ? "align-end" : "align-start";
        for (const key of ["align-start", "align-center", "align-end", "align-justify"]) controls[key].setAttribute("aria-pressed", String(key === side));
      }
      if (controls.block) {
        const block = closestIn("p, h2, h3, h4, blockquote, pre");
        controls.block.value = block ? block.tagName.toLowerCase() : "p";
      }
      const inList = Boolean(closestIn("li"));
      if (controls.indent) controls.indent.disabled = !inList;
      if (controls.outdent) controls.outdent.disabled = !inList;
    };

    /* Buttons: a press keeps the selection; toggles are set from it. */
    toolbar.addEventListener("mousedown", (event) => {
      if (event.target.closest(".canon-button")) event.preventDefault();
    });
    toolbar.addEventListener("click", (event) => {
      const target = event.target.closest("[data-command]");
      if (!target || !toolbar.contains(target)) return;
      event.preventDefault();
      const command = target.dataset.command;
      const fromKeyboard = event.detail === 0;
      if (command.startsWith("align-")) {
        const physical = { "align-start": rtl() ? "justifyRight" : "justifyLeft", "align-end": rtl() ? "justifyLeft" : "justifyRight", "align-center": "justifyCenter", "align-justify": "justifyFull" };
        run(physical[command]);
      } else run(command);
      if (fromKeyboard) target.focus();
    });
    controls.undo?.addEventListener("click", () => run("undo"));
    controls.redo?.addEventListener("click", () => run("redo"));
    controls.block?.addEventListener("change", () => run("formatBlock", `<${controls.block.value}>`));

    /* Link. */
    const openLink = () => {
      if (!linkPopover) return;
      const link = closestIn("a");
      linkUrl.value = link?.getAttribute("href") ?? "";
      linkNewTab.checked = link?.getAttribute("target") === "_blank";
      linkRemove.hidden = !link;
      if (!linkPopover.matches(":popover-open")) controls.link.click();
    };
    if (linkPopover) {
      linkPopover.addEventListener("beforetoggle", (event) => {
        if (event.newState !== "open") return;
        const link = closestIn("a");
        linkUrl.value = link?.getAttribute("href") ?? "";
        linkNewTab.checked = link?.getAttribute("target") === "_blank";
        linkRemove.hidden = !link;
      });
      linkPopover.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault();
        const href = safeUrl(linkUrl.value);
        const existing = closestIn("a");
        linkPopover.hidePopover();
        restore();
        if (existing) {
          const range = document.createRange();
          range.selectNodeContents(existing);
          getSelection().removeAllRanges();
          getSelection().addRange(range);
          saved = range.cloneRange();
        }
        if (!href) {
          run("unlink");
          return;
        }
        if (getSelection().isCollapsed) {
          const anchor = document.createElement("a");
          anchor.href = href;
          anchor.textContent = href;
          run("insertHTML", anchor.outerHTML);
        } else run("createLink", href);
        const link = closestIn("a") ?? [...area.querySelectorAll("a")].find((each) => each.getAttribute("href") === href);
        if (link) {
          if (linkNewTab.checked) {
            link.target = "_blank";
            link.rel = "noopener";
          } else {
            link.removeAttribute("target");
            link.removeAttribute("rel");
          }
          write();
        }
      });
      linkRemove.addEventListener("click", () => {
        const existing = closestIn("a");
        linkPopover.hidePopover();
        restore();
        if (existing) {
          const range = document.createRange();
          range.selectNodeContents(existing);
          getSelection().removeAllRanges();
          getSelection().addRange(range);
        }
        run("unlink");
      });
    }

    /* Color. */
    if (colorPopover) {
      colorPopover.addEventListener("change", (event) => {
        if (!event.target.matches("input[type='radio']")) return;
        colorPopover.hidePopover();
        run("foreColor", event.target.value);
      });
      colorPopover.querySelector("[data-color]").addEventListener("click", () => {
        colorPopover.hidePopover();
        run("foreColor", "inherit");
      });
    }

    /* Insert. */
    if (controls.insert) {
      toolbar.querySelector(`#${CSS.escape(`${id}-insert`)}`).addEventListener("click", (event) => {
        const item = event.target.closest("[data-insert]");
        if (!item) return;
        if (item.dataset.insert === "hr") {
          setTimeout(() => run("insertHorizontalRule"));
          return;
        }
        imageUrl.value = "";
        imageAlt.value = "";
        setTimeout(() => {
          try {
            imagePopover.showPopover({ source: controls.insert });
          } catch {
            imagePopover.showPopover();
          }
        });
      });
      imagePopover.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault();
        const src = safeUrl(imageUrl.value, true);
        if (!src) return;
        imagePopover.hidePopover();
        const image = document.createElement("img");
        image.src = src;
        image.alt = imageAlt.value.trim();
        run("insertHTML", image.outerHTML);
      });
    }

    /* Keys and paste. */
    area.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "k" && linkPopover) {
        event.preventDefault();
        openLink();
      }
    });
    area.addEventListener("paste", (event) => {
      const data = event.clipboardData;
      if (!data) return;
      event.preventDefault();
      const html = data.getData("text/html");
      if (html) run("insertHTML", richClean(html, rtl()));
      else run("insertText", data.getData("text/plain"));
    });
    area.addEventListener("focus", () => {
      if (area.innerHTML.trim() === "") {
        area.innerHTML = "<p><br></p>";
        const range = document.createRange();
        range.setStart(area.firstChild, 0);
        getSelection().removeAllRanges();
        getSelection().addRange(range);
      }
    });

    /* Disabled and read-only, described, invalid, required: the textarea's. */
    const mirror = () => {
      const off = textarea.disabled || textarea.readOnly;
      area.setAttribute("contenteditable", off ? "false" : "true");
      area.toggleAttribute("aria-disabled", textarea.disabled);
      if (textarea.disabled) area.setAttribute("aria-disabled", "true");
      area.toggleAttribute("aria-readonly", textarea.readOnly);
      if (textarea.readOnly) area.setAttribute("aria-readonly", "true");
      area.tabIndex = textarea.disabled ? -1 : 0;
      for (const name of ["aria-describedby", "aria-invalid"]) {
        if (textarea.hasAttribute(name)) area.setAttribute(name, textarea.getAttribute(name));
        else area.removeAttribute(name);
      }
      if (textarea.required) area.setAttribute("aria-required", "true");
      else area.removeAttribute("aria-required");
      for (const control of toolbar.querySelectorAll("button, select")) {
        if (control.closest("[popover]")) continue;
        control.disabled = off;
      }
      if (!off) syncState();
    };
    new MutationObserver(mirror).observe(textarea, { attributes: true, attributeFilter: ["disabled", "readonly", "required", "aria-describedby", "aria-invalid"] });
    mirror();
  };

  const setUpRichs = (root) => {
    const found = [...(root.matches?.(".canon-textarea[data-rich]") ? [root] : []), ...(root.querySelectorAll?.(".canon-textarea[data-rich]") ?? [])];
    for (const box of found) setUpRich(box);
  };
