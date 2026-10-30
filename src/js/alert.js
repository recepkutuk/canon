  /* ------------------------------------------------------------------ */
  /* Alert                                                               */
  /*                                                                     */
  /* Its close button gets a name when it has none (--canon-text-        */
  /* dismiss). Clicked, canon-dismiss fires on the alert (detail.reason: */
  /* "close"; cancelable, for an app that dismisses its own way); then   */
  /* focus that was in it moves to the next thing in the page (or the    */
  /* one before), and it closes its room and is hidden. One shown while  */
  /* the page is open (unhidden, or put in with a role) opens its room.  */
  /* ------------------------------------------------------------------ */

  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled], [type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

  const dismissAlert = (alert) => {
    if (alert.getAttribute("data-state") === "closing") return;
    const go = alert.dispatchEvent(new CustomEvent("canon-dismiss", { bubbles: true, cancelable: true, detail: { reason: "close" } }));
    if (!go) return;
    if (alert.contains(document.activeElement)) {
      const others = [...document.querySelectorAll(focusableSelector)].filter((element) => !alert.contains(element) && element.checkVisibility());
      const after = others.find((element) => alert.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
      (after ?? others.findLast((element) => alert.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING) ?? document.body).focus?.();
    }
    playRoom(alert, "closing", () => { alert.hidden = true; });
  };
  const openAlert = (alert) => {
    if (alert.checkVisibility()) playRoom(alert, "opening");
  };

  /* Banners' close buttons work the same way. */
  document.addEventListener("click", (event) => {
    const alert = event.target.closest?.(":is(.canon-alert-close, .canon-banner-close)")?.closest(".canon-alert, .canon-banner");
    if (alert) dismissAlert(alert);
  });

  const setUpAlerts = (root) => {
    const found = [...(root.matches?.(".canon-alert-close, .canon-banner-close") ? [root] : []), ...(root.querySelectorAll?.(".canon-alert-close, .canon-banner-close") ?? [])];
    for (const close of found) {
      if (!close.hasAttribute("aria-label") && !close.hasAttribute("aria-labelledby")) close.setAttribute("aria-label", text(close, "dismiss", "Dismiss"));
    }
  };
