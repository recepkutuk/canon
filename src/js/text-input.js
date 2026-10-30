  /* ------------------------------------------------------------------ */
  /* Fallback: field-sizing                                              */
  /*                                                                     */
  /* Growing textareas (data-max-lines), Number Input values, the        */
  /* pagination's page field and edit-in-place fields size to their      */
  /* content with field-sizing: content. In browsers without it (Firefox */
  /* before 152, Safari before 26.2) canon.js sizes them as they change. */
  /* ------------------------------------------------------------------ */

  const fieldSizing = CSS.supports("field-sizing", "content");
  const growingSelector = ":is(.canon-control, .canon-text-input, .canon-password, .canon-select, .canon-combobox, .canon-textarea) > textarea[data-max-lines]";
  const fittingSelector = ".canon-number > input, .canon-pagination-jump .canon-text-input > input, .canon-inline-edit";

  const fitField = (field) => {
    const style = getComputedStyle(field);
    const sum = (keys) => keys.reduce((total, key) => total + (parseFloat(style[key]) || 0), 0);
    const borderBox = style.boxSizing === "border-box";
    if (field.matches(growingSelector)) {
      field.style.blockSize = "auto";
      const height = field.scrollHeight;
      field.style.blockSize = `${borderBox ? height + sum(["borderTopWidth", "borderBottomWidth"]) : height - sum(["paddingTop", "paddingBottom"])}px`;
    } else if (field.matches(fittingSelector)) {
      const frame = borderBox ? sum(["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"]) : 0;
      const length = Math.max((field.value || field.placeholder || "").length, 1);
      field.style.inlineSize = `calc(${length + 1}ch + ${frame}px)`;
    }
  };

  const setUpFieldSizing = (root) => {
    if (fieldSizing) return;
    const fields = [...(root.querySelectorAll?.(`${growingSelector}, ${fittingSelector}`) ?? [])];
    if (root.matches?.(`${growingSelector}, ${fittingSelector}`)) fields.push(root);
    fields.forEach(fitField);
  };

  if (!fieldSizing) {
    for (const type of ["input", "change", "focusin"]) {
      document.addEventListener(type, (event) => {
        if (event.target instanceof HTMLElement) fitField(event.target);
      }, true);
    }
    document.addEventListener("reset", (event) => setTimeout(() => setUpFieldSizing(event.target)));
  }
