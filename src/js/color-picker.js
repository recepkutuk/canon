  /* ------------------------------------------------------------------ */
  /* Color picker                                                        */
  /*                                                                     */
  /* An <input type="color"> in .canon-color. canon.js draws the swatch  */
  /* (.canon-color-swatch, --canon-color on the box) and, instead of the */
  /* browser's picker, opens a popover: a saturation / brightness area,  */
  /* hue, opacity (with the alpha attribute), an eyedropper where the    */
  /* browser has one, the value as HEX / RGB / HSL / HSB, and the        */
  /* swatches of the input's <datalist>. The input stays the value: it   */
  /* fires input while the color changes and change when the popover    */
  /* closes. With alpha, the value is an 8-digit hex; where the browser */
  /* can't keep alpha in a color input, the input becomes a read-only    */
  /* text field holding it (behind the swatch, as the color input was). */
  /* ------------------------------------------------------------------ */

  const colorBoxes = new WeakSet();
  let colorCount = 0;
  const nativeAlpha = "alpha" in HTMLInputElement.prototype;

  /* Any CSS color to { r, g, b, a } (0-255, alpha 0-1), through a canvas;
     null when it isn't a color. */
  const colorContext = document.createElement("canvas").getContext("2d");
  const parseColor = (value) => {
    if (!value || !CSS.supports("color", value)) return null;
    colorContext.fillStyle = "#000";
    colorContext.fillStyle = value;
    const result = colorContext.fillStyle;
    if (result.startsWith("#")) {
      const n = parseInt(result.slice(1), 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
    }
    const [r, g, b, a = 1] = result.match(/[\d.]+/g).map(Number);
    return { r, g, b, a };
  };
  const hex2 = (n) => Math.round(n).toString(16).padStart(2, "0");
  const toHex = ({ r, g, b }, a) => `#${hex2(r)}${hex2(g)}${hex2(b)}${a === undefined ? "" : hex2(a * 255)}`;
  const hsvToRgb = (h, s, v) => {
    const f = (n) => {
      const k = (n + h / 60) % 6;
      return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255;
    };
    return { r: f(5), g: f(3), b: f(1) };
  };
  const rgbToHsv = ({ r, g, b }) => {
    [r, g, b] = [r / 255, g / 255, b / 255];
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
    const h = d === 0 ? null : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: h === null ? null : (h * 60 + 360) % 360, s: max === 0 ? 0 : d / max, v: max };
  };
  const hsvToHsl = (s, v) => {
    const l = v * (1 - s / 2);
    return { s: l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l), l };
  };
  const hslToHsv = (s, l) => {
    const v = l + s * Math.min(l, 1 - l);
    return { s: v === 0 ? 0 : 2 * (1 - l / v), v };
  };

  const formats = {
    hex: { label: "HEX", fields: [["hex", "Hex"]] },
    rgb: { label: "RGB", fields: [["red", "Red", 255], ["green", "Green", 255], ["blue", "Blue", 255]] },
    hsl: { label: "HSL", fields: [["hue", "Hue", 360], ["saturation", "Saturation", 100], ["lightness", "Lightness", 100]] },
    hsb: { label: "HSB", fields: [["hue", "Hue", 360], ["saturation", "Saturation", 100], ["brightness", "Brightness", 100]] },
  };

  const setUpColor = (box) => {
    const input = box.querySelector(":scope > input[type='color']");
    if (!input || colorBoxes.has(box)) return;
    colorBoxes.add(box);
    const id = `canon-color-${++colorCount}`;
    const alpha = input.hasAttribute("alpha");
    /* data-inline: the picker in place of the box, always shown. */
    const inline = box.hasAttribute("data-inline");
    const make = (tag, className, attributes = {}) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
      return element;
    };
    const label = (key, fallback) => text(box, key, fallback);

    /* The value: an 8-digit hex with alpha (a read-only text field where
       the browser can't keep alpha), the browser's hex without. */
    const initial = parseColor(input.getAttribute("value") ?? input.value) ?? parseColor(input.value) ?? { r: 0, g: 0, b: 0, a: 1 };
    if (alpha && !nativeAlpha) {
      input.type = "text";
      input.readOnly = true;
      input.setAttribute("autocomplete", "off");
    }
    let { h, s, v } = rgbToHsv(initial);
    h ??= 0;
    let a = alpha ? initial.a : 1;
    const rgb = () => hsvToRgb(h, s, v);
    const valueText = () => (alpha ? toHex(rgb(), a) : toHex(rgb()));

    /* The swatch the box shows (the input covers it, transparent). */
    const swatch = make("span", "canon-color-swatch", { "aria-hidden": "true" });
    input.after(swatch);

    /* The popover. */
    const popup = make("div", "canon-color-popup", inline ? { id: `${id}-popup`, role: "group" } : { id: `${id}-popup`, popover: "auto", role: "dialog" });
    const area = make("div", "canon-color-area", { role: "slider", tabindex: "0", "aria-label": label("color-area", "Saturation and brightness") });
    area.append(make("span", "canon-color-thumb"));

    const sliders = make("div", "canon-color-sliders");
    const hue = make("input", "canon-color-hue", { type: "range", min: "0", max: "360", step: "1", "aria-label": label("hue", "Hue") });
    sliders.append(hue);
    const opacity = alpha ? make("input", "canon-color-opacity", { type: "range", min: "0", max: "100", step: "1", "aria-label": label("opacity", "Opacity") }) : null;
    if (opacity) sliders.append(opacity);

    const tools = make("div", "canon-color-tools");
    const dropper = "EyeDropper" in window ? make("button", "canon-color-eyedropper", { type: "button", "aria-label": label("eyedropper", "Pick a color from the screen") }) : null;
    if (dropper) tools.append(dropper);
    tools.append(sliders);

    /* Fields: the format, its value(s), the opacity. */
    const fields = make("div", "canon-color-fields");
    const formatBox = make("div", "canon-select", { "data-size": "sm" });
    const format = make("select", "", { "aria-label": label("color-format", "Format") });
    for (const [key, { label: name }] of Object.entries(formats)) format.append(new Option(name, key));
    formatBox.append(format);
    const values = make("div", "canon-color-values");
    const opacityBox = alpha ? make("div", "canon-text-input canon-color-percent", { "data-size": "sm" }) : null;
    const opacityField = alpha ? make("input", "", { type: "text", inputmode: "numeric", "aria-label": label("opacity", "Opacity"), autocomplete: "off" }) : null;
    if (opacityBox) {
      opacityBox.append(opacityField, Object.assign(make("span", "canon-text-input-suffix", { "aria-hidden": "true" }), { textContent: "%" }));
    }
    fields.append(formatBox, values);
    if (opacityBox) fields.append(opacityBox);

    popup.append(area, tools, fields);

    /* The input's <datalist>: swatches, a radio group of the popover (its
       radios belong to no form). */
    const list = input.list ?? document.getElementById(input.getAttribute("list") ?? "");
    let swatchRadios = [];
    if (list?.options.length) {
      const caption = make("div", "canon-color-caption", { id: `${id}-swatches` });
      caption.textContent = label("swatches", "Swatches");
      const group = make("div", "canon-swatches", { role: "radiogroup", "aria-labelledby": caption.id });
      for (const option of list.options) {
        const color = parseColor(option.value);
        if (!color) continue;
        const radio = make("input", "", { type: "radio", name: `${id}-swatch`, form: popup.id, value: option.value, "aria-label": option.label || option.textContent.trim() || option.value });
        radio.style.setProperty("--canon-swatch", option.value);
        radio.addEventListener("change", () => setColor(color, "swatch"));
        group.append(radio);
        swatchRadios.push([radio, color]);
      }
      popup.append(make("hr", "canon-separator", { "data-size": "sm" }), caption, group);
    }
    if (inline) box.after(popup);
    else box.append(popup);

    /* Named like the input; anchored to the box. */
    if (!inline) {
      const anchor = `--${id}`;
      box.style.anchorName = box.style.anchorName && box.style.anchorName !== "none" ? `${box.style.anchorName}, ${anchor}` : anchor;
      popup.style.positionAnchor = anchor;
      popupAnchors.set(popup, box);
    }
    const labelledBy = input.getAttribute("aria-labelledby") || [...input.labels].map((l, i) => l.id || (l.id = `${id}-label${i ? `-${i}` : ""}`)).join(" ");
    if (labelledBy) popup.setAttribute("aria-labelledby", labelledBy);
    else if (input.hasAttribute("aria-label")) popup.setAttribute("aria-label", input.getAttribute("aria-label"));
    if (!inline) {
      input.setAttribute("aria-haspopup", "dialog");
      input.setAttribute("aria-expanded", "false");
      input.setAttribute("aria-controls", popup.id);
    }

    /* Fields for the chosen format. */
    let fieldInputs = [];
    const buildFields = () => {
      values.replaceChildren();
      fieldInputs = formats[format.value].fields.map(([key, fallback, max]) => {
        const field = make("div", "canon-text-input", { "data-size": "sm" });
        const control = make("input", "", { type: "text", "aria-label": label(key, fallback), autocomplete: "off", spellcheck: "false" });
        if (max) control.setAttribute("inputmode", "numeric");
        if (format.value === "hex") field.append(Object.assign(make("span", "canon-text-input-prefix", { "aria-hidden": "true" }), { textContent: "#" }));
        field.append(control);
        values.append(field);
        control.addEventListener("change", readFields);
        control.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            readFields();
          }
        });
        return [control, max];
      });
      values.dataset.count = String(fieldInputs.length);
    };
    const fillFields = () => {
      const color = rgb();
      const parts = format.value === "hex" ? [toHex(color).slice(1).toUpperCase()]
        : format.value === "rgb" ? [color.r, color.g, color.b].map(Math.round)
        : format.value === "hsl" ? (() => { const hsl = hsvToHsl(s, v); return [h, hsl.s * 100, hsl.l * 100].map(Math.round); })()
        : [h, s * 100, v * 100].map(Math.round);
      fieldInputs.forEach(([control], i) => { if (document.activeElement !== control) control.value = parts[i]; });
      if (opacityField && document.activeElement !== opacityField) opacityField.value = String(Math.round(a * 100));
    };
    function readFields() {
      const raw = fieldInputs.map(([control]) => control.value.trim());
      const numbers = raw.map(Number);
      const ok = (i, max) => raw[i] !== "" && Number.isFinite(numbers[i]) && numbers[i] >= 0 && numbers[i] <= max;
      if (format.value === "hex") {
        const color = /^[\da-f]{3}([\da-f]{3})?$/i.test(raw[0]) ? parseColor(`#${raw[0]}`) : null;
        if (color) setColor({ ...color, a }, "fields");
      } else if (fieldInputs.every(([, max], i) => ok(i, max))) {
        if (format.value === "rgb") setColor({ r: numbers[0], g: numbers[1], b: numbers[2], a }, "fields");
        else {
          const hsv = format.value === "hsl" ? hslToHsv(numbers[1] / 100, numbers[2] / 100) : { s: numbers[1] / 100, v: numbers[2] / 100 };
          h = numbers[0] % 360;
          s = hsv.s;
          v = hsv.v;
          update("fields");
        }
      }
      fillFields();
    }
    opacityField?.addEventListener("change", () => {
      const value = Number(opacityField.value.replace("%", "").trim());
      if (Number.isFinite(value) && opacityField.value.trim() !== "") {
        a = Math.min(1, Math.max(0, value / 100));
        update("fields");
      }
      fillFields();
    });
    opacityField?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        opacityField.dispatchEvent(new Event("change"));
      }
    });

    /* Everything shows the color; the input holds it. */
    let committed = input.value;
    const update = (source) => {
      const color = rgb();
      const opaque = `rgb(${color.r} ${color.g} ${color.b})`;
      for (const element of [box, popup]) {
        element.style.setProperty("--canon-color", `rgb(${color.r} ${color.g} ${color.b} / ${a})`);
        element.style.setProperty("--canon-color-opaque", opaque);
        element.style.setProperty("--canon-color-hue", `hsl(${h} 100% 50%)`);
      }
      popup.style.setProperty("--canon-color-saturation", String(s));
      popup.style.setProperty("--canon-color-brightness", String(v));
      area.setAttribute("aria-valuetext", fill(label("color-area-value", "Saturation {s}%, brightness {v}%"), { s: Math.round(s * 100), v: Math.round(v * 100) }));
      if (source !== "hue") hue.value = String(Math.round(h));
      if (opacity && source !== "opacity") opacity.value = String(Math.round(a * 100));
      if (source !== "fields") fillFields();
      const current = toHex(color).toLowerCase();
      for (const [radio, swatchColor] of swatchRadios) radio.checked = toHex(swatchColor).toLowerCase() === current && Math.abs(swatchColor.a - a) < 0.005;
      if (source === "init") return;
      const next = valueText();
      if (input.value !== next) {
        input.value = next;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    function setColor(color, source) {
      const hsv = rgbToHsv(color);
      if (hsv.h !== null) h = hsv.h;
      s = hsv.s;
      v = hsv.v;
      if (alpha) a = color.a;
      update(source);
    }

    /* The area: drag, or the arrow keys (saturation left / right,
       brightness up / down; Shift: 10 at a time). */
    const fromPointer = (event) => {
      const rect = area.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      s = getComputedStyle(area).direction === "rtl" ? 1 - x : x;
      v = 1 - y;
      update("area");
    };
    area.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || input.disabled) return;
      area.setPointerCapture(event.pointerId);
      area.focus();
      fromPointer(event);
    });
    area.addEventListener("pointermove", (event) => {
      if (area.hasPointerCapture(event.pointerId)) fromPointer(event);
    });
    area.addEventListener("keydown", (event) => {
      if (input.disabled) return;
      const step = (event.shiftKey ? 10 : 1) / 100;
      const rtl = getComputedStyle(area).direction === "rtl";
      const moves = { ArrowRight: [rtl ? -step : step, 0], ArrowLeft: [rtl ? step : -step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
      if (!moves[event.key]) return;
      event.preventDefault();
      s = Math.min(1, Math.max(0, s + moves[event.key][0]));
      v = Math.min(1, Math.max(0, v + moves[event.key][1]));
      update("area");
    });
    hue.addEventListener("input", () => {
      h = Number(hue.value);
      update("hue");
    });
    opacity?.addEventListener("input", () => {
      a = Number(opacity.value) / 100;
      update("opacity");
    });
    format.addEventListener("change", () => {
      buildFields();
      fillFields();
    });
    dropper?.addEventListener("click", async () => {
      try {
        const { sRGBHex } = await new window.EyeDropper().open();
        const color = parseColor(sRGBHex);
        if (color) setColor({ ...color, a }, "dropper");
      } catch {}
    });

    /* Inline: the box (and its input) is hidden; the label's click goes to
       the area, the input's description and state to the group, and
       change fires where a native control's would (a drag ends, a key, a
       slider's change, a field or a swatch). */
    if (inline) {
      const commit = () => {
        if (input.value === committed) return;
        committed = input.value;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      };
      input.addEventListener("click", (event) => {
        event.preventDefault();
        if (!input.disabled) area.focus({ focusVisible: false });
      });
      area.addEventListener("pointerup", commit);
      popup.addEventListener("keyup", commit);
      hue.addEventListener("change", commit);
      opacity?.addEventListener("change", commit);
      popup.addEventListener("focusout", commit);
      popup.addEventListener("change", (event) => { if (event.target.type === "radio") commit(); });
      dropper?.addEventListener("click", () => setTimeout(commit));
      const mirror = () => {
        const disabled = input.disabled;
        for (const control of popup.querySelectorAll("input, select, button")) control.disabled = disabled;
        area.tabIndex = disabled ? -1 : 0;
        if (disabled) area.setAttribute("aria-disabled", "true");
        else area.removeAttribute("aria-disabled");
        for (const name of ["aria-describedby", "aria-invalid"]) {
          if (input.hasAttribute(name)) popup.setAttribute(name, input.getAttribute(name));
          else popup.removeAttribute(name);
        }
      };
      new MutationObserver(mirror).observe(input, { attributes: true, attributeFilter: ["disabled", "aria-describedby", "aria-invalid"] });
      mirror();
    }

    /* Opening: the input's click, Enter, Space or Down open the popover
       instead of the browser's picker. */
    const isOpen = () => popup.matches(":popover-open");
    /* Opened from the keyboard, the area shows focus; by the pointer, not. */
    let byKeyboard = false;
    const open = (keyboard) => {
      if (input.disabled || isOpen()) return;
      byKeyboard = keyboard;
      popup.showPopover({ source: input });
    };
    /* A press on the input or its label while open closes the popover
       (light dismiss, before the click): that click mustn't reopen it. */
    let closingPress = false;
    if (!inline) document.addEventListener("pointerdown", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      closingPress = isOpen() && !!target && (target === input || target.closest("label")?.control === input);
    }, true);
    if (!inline) input.addEventListener("click", (event) => {
      event.preventDefault();
      const closing = closingPress;
      closingPress = false;
      if (isOpen()) popup.hidePopover();
      else if (!closing) open(event.detail === 0);
    });
    if (!inline) input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        open(true);
      }
    });
    popup.addEventListener("toggle", (event) => {
      const opened = event.newState === "open";
      input.setAttribute("aria-expanded", String(opened));
      if (opened) {
        committed = input.value;
        area.focus({ focusVisible: byKeyboard });
        return;
      }
      if (input.value !== committed) input.dispatchEvent(new Event("change", { bubbles: true }));
      if (document.activeElement === document.body || popup.contains(document.activeElement)) input.focus();
    });

    /* The app may set the value (and fire input or change); a form reset
       brings the first value back. */
    const sync = (value) => {
      const color = parseColor(value);
      if (!color) return;
      const hsv = rgbToHsv(color);
      if (hsv.h !== null) h = hsv.h;
      s = hsv.s;
      v = hsv.v;
      a = alpha ? color.a : 1;
      update("init");
    };
    for (const type of ["input", "change"]) {
      input.addEventListener(type, (event) => {
        if (event.isTrusted || input.value !== valueText()) sync(input.value);
      });
    }
    input.form?.addEventListener("reset", () => setTimeout(() => {
      input.value = toHex(initial, alpha ? initial.a : undefined);
      sync(input.value);
    }));

    buildFields();
    if (alpha && !nativeAlpha) input.value = valueText();
    update("init");
  };

  const setUpColors = (root) => {
    const boxes = [...(root.matches?.(".canon-color") ? [root] : []), ...(root.querySelectorAll?.(".canon-color") ?? [])];
    for (const box of boxes) setUpColor(box);
  };
