  /* ------------------------------------------------------------------ */
  /* Dialog                                                              */
  /*                                                                     */
  /* The browser opens a modal <dialog> (command="show-modal"), keeps    */
  /* focus in it, closes it on Escape and gives focus back. canon.js     */
  /* adds: where the browser lacks them, the dialog commands (show-modal,*/
  /* close, request-close) and closedby ("any": a click on the backdrop  */
  /* closes it; "none": Escape doesn't); and, opening, focus skips the   */
  /* header's close button for the body's first control (or the dialog). */
  /* ------------------------------------------------------------------ */

  const dialogCommands = {
    "show-modal": (dialog) => { if (!dialog.open) dialog.showModal(); },
    close: (dialog, source) => dialog.close(source?.value ?? undefined),
    "request-close": (dialog, source) => (dialog.requestClose ? dialog.requestClose(source?.value) : dialog.dispatchEvent(new Event("cancel", { cancelable: true })) && dialog.close(source?.value)),
  };
  if (!("command" in HTMLButtonElement.prototype)) {
    document.addEventListener("click", (event) => {
      const source = event.target.closest?.("button[commandfor][command]");
      const command = source?.getAttribute("command");
      if (!source || source.disabled || !dialogCommands[command]) return;
      const dialog = document.getElementById(source.getAttribute("commandfor"));
      if (dialog instanceof HTMLDialogElement) dialogCommands[command](dialog, source);
    });
  }
  if (!("closedBy" in HTMLDialogElement.prototype)) {
    document.addEventListener("click", (event) => {
      const dialog = event.target;
      if (!(dialog instanceof HTMLDialogElement) || !dialog.open || dialog.getAttribute("closedby") !== "any") return;
      const box = dialog.getBoundingClientRect();
      const outside = event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
      if (outside) dialog.close();
    });
    document.addEventListener("cancel", (event) => {
      if (event.target instanceof HTMLDialogElement && event.target.getAttribute("closedby") === "none") event.preventDefault();
    }, true);
  }
  const focusDialog = (dialog) => {
    if (!dialog.matches(".canon-dialog") || dialog.querySelector("[autofocus]")) return;
    const close = dialog.querySelector(".canon-dialog-header > .canon-button");
    if (document.activeElement !== close && dialog.contains(document.activeElement)) return;
    const body = dialog.querySelector(".canon-dialog-body");
    const target = (body && firstControl(body)) ?? null;
    if (target) target.focus();
    else {
      if (!dialog.hasAttribute("tabindex")) dialog.tabIndex = -1;
      dialog.focus();
    }
  };
  document.addEventListener("toggle", (event) => {
    if (event.target instanceof HTMLDialogElement && event.newState === "open") focusDialog(event.target);
  }, true);
