  /* ------------------------------------------------------------------ */
  /* Form Layout: reveals                                                */
  /*                                                                     */
  /* A .canon-form-reveal (a <fieldset>) right after a .canon-choice      */
  /* shows while the choice is checked (CSS). canon.js disables it while  */
  /* it is hidden, so its fields are neither checked nor sent with the    */
  /* form.                                                                */
  /* ------------------------------------------------------------------ */

  const syncReveals = (root = document) => {
    for (const reveal of root.querySelectorAll?.(".canon-form-reveal") ?? []) {
      const choice = reveal.previousElementSibling;
      const input = choice?.matches(".canon-choice") ? choice.querySelector(":scope > input") : null;
      if (input && "disabled" in reveal) reveal.disabled = !input.checked;
    }
  };
  document.addEventListener("change", (event) => {
    if (event.target.matches?.(".canon-choice > input")) syncReveals(event.target.form ?? document);
  });
  document.addEventListener("reset", (event) => setTimeout(() => syncReveals(event.target)), true);
