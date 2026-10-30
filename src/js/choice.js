  /* ------------------------------------------------------------------ */
  /* Switch state text                                                   */
  /*                                                                     */
  /* The words beside a switch aren't a label (a second label would add  */
  /* them to its name), so a click on them toggles the switch here.      */
  /* ------------------------------------------------------------------ */

  document.addEventListener("click", (event) => {
    const state = event.target.closest?.(".canon-choice > .canon-choice-state");
    const input = state?.parentElement.querySelector(":scope > input[role='switch']");
    if (!input || input.disabled) return;
    input.click();
    input.focus({ focusVisible: false });
  });
