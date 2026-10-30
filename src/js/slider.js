  /* ------------------------------------------------------------------ */
  /* Slider and range slider                                             */
  /* ------------------------------------------------------------------ */

  const rangeSelector = ".canon-control > input[type='range']";

  const bounds = (input) => {
    const min = input.min === "" ? 0 : Number(input.min);
    const max = input.max === "" ? 100 : Number(input.max);
    return [min, max];
  };

  /* Where a value sits between min and max, 0-100. */
  const percentOf = (input, value) => {
    const [min, max] = bounds(input);
    return max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
  };

  const markAt = (input) =>
    input.list && [...input.list.options].find((o) => Number(o.value) === input.valueAsNumber);

  /* A named mark's text when the value has one ("Medium"), else the number
     in the element's language. */
  const display = (input) => {
    const option = markAt(input);
    if (option) return option.label || option.textContent.trim() || option.value;
    const lang = input.closest("[lang]")?.lang || undefined;
    try {
      return new Intl.NumberFormat(lang, { maximumFractionDigits: 20 }).format(input.valueAsNumber);
    } catch {
      return input.value;
    }
  };

  const updateSlider = (box) => {
    const [first, second] = box.querySelectorAll(":scope > input[type='range']");
    if (!first) return;
    if (second) {
      box.style.setProperty("--canon-slider-start", percentOf(first, first.valueAsNumber));
      box.style.setProperty("--canon-slider-end", percentOf(second, second.valueAsNumber));
      /* When the thumbs meet, the one that can still move goes on top. */
      const met = first.valueAsNumber >= second.valueAsNumber;
      if (met && percentOf(first, first.valueAsNumber) > 50) first.dataset.state = "front";
      else if (first.dataset.state === "front") delete first.dataset.state;
    } else {
      box.style.setProperty("--canon-slider-percent", percentOf(first, first.valueAsNumber));
    }
    /* Screen readers hear the mark's name too ("Medium", not "1"). The
       <output> only repeats the value visually (it is aria-hidden). */
    for (const input of box.querySelectorAll(":scope > input[type='range']")) {
      if (!input.list) continue;
      const option = markAt(input);
      if (option) input.setAttribute("aria-valuetext", display(input));
      else input.removeAttribute("aria-valuetext");
    }
    for (const output of box.querySelectorAll(":scope > output[for]")) {
      const input = document.getElementById(output.htmlFor[0]);
      if (input?.type === "range") output.value = display(input);
    }
  };

  const placeMarks = (box) => {
    const input = box.querySelector(":scope > input[type='range']");
    const list = input?.list;
    if (!list || list.parentElement !== box) return;
    for (const option of list.options) {
      option.style.setProperty("--canon-mark-percent", percentOf(input, Number(option.value)));
    }
    list.dataset.state = "placed";
  };

  /* Sizes for themes that float each value over its thumb (CSS can't
     measure them): the track's length as --canon-slider-track-length, and
     each value's width as --canon-slider-value-size, or
     --canon-slider-start-value-size / -end-value-size on a range (the
     <output> before the inputs, the one after them). All on the box. */
  const sliderSizes = new ResizeObserver((entries) => {
    for (const { target, borderBoxSize } of entries) {
      const box = target.parentElement;
      const inputs = box?.querySelectorAll(":scope > input[type='range']");
      if (!inputs?.length || !borderBoxSize?.[0]) continue;
      /* An input's inline size runs along its track, vertical ones too. */
      const name = target === inputs[0] ? "--canon-slider-track-length"
        : inputs.length < 2 ? "--canon-slider-value-size"
        : target.compareDocumentPosition(inputs[0]) & Node.DOCUMENT_POSITION_FOLLOWING ? "--canon-slider-start-value-size"
        : "--canon-slider-end-value-size";
      box.style.setProperty(name, `${borderBoxSize[0].inlineSize}px`);
    }
  });

  const setUpSliders = (root) => {
    const boxes = new Set();
    if (root.matches?.(rangeSelector)) boxes.add(root.parentElement);
    for (const input of root.querySelectorAll?.(rangeSelector) ?? []) boxes.add(input.parentElement);
    for (const box of boxes) {
      placeMarks(box);
      updateSlider(box);
      sliderSizes.observe(box.querySelector(":scope > input[type='range']"));
      for (const output of box.querySelectorAll(":scope > output[for]")) sliderSizes.observe(output);
    }
  };

  document.addEventListener("input", (event) => {
    const input = event.target;
    if (!input.matches?.(rangeSelector)) return;
    const box = input.parentElement;
    /* Range slider: the moving thumb stops at the other one. */
    const [first, second] = box.querySelectorAll(":scope > input[type='range']");
    if (second && first.valueAsNumber > second.valueAsNumber) {
      if (input === first) first.value = second.value;
      else second.value = first.value;
    }
    updateSlider(box);
  });

  /* Form resets change values without input events. */
  document.addEventListener("reset", (event) => {
    setTimeout(() => setUpSliders(event.target));
  });
