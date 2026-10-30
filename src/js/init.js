  /* Each component's set-up, in this order, for the page and for what's
     added to it later. First: repeaters copy their first item before it
     is enhanced. A build without a component has no set-up for it
     (typeof is safe on a name that was never declared). */
  const setUps = [
    typeof setUpRepeaters === "function" && setUpRepeaters,
    typeof setUpRichs === "function" && setUpRichs,
    /* Form reveals: on the page here; what's added, below. */
    typeof syncReveals === "function" && ((root) => { if (root === document) syncReveals(document); }),
    typeof setUpMenus === "function" && setUpMenus,
    typeof setUpNumbers === "function" && setUpNumbers,
    typeof setUpToolbars === "function" && setUpToolbars,
    typeof setUpSteadySelects === "function" && setUpSteadySelects,
    typeof setUpTables === "function" && setUpTables,
    typeof setUpCodeBlocks === "function" && setUpCodeBlocks,
    typeof setUpDataTables === "function" && setUpDataTables,
    typeof setUpPaginations === "function" && setUpPaginations,
    typeof setUpLoadMores === "function" && setUpLoadMores,
    typeof setUpFilterBars === "function" && setUpFilterBars,
    typeof setUpCommandPalettes === "function" && setUpCommandPalettes,
    typeof setUpNavLists === "function" && setUpNavLists,
    typeof setUpTopBars === "function" && setUpTopBars,
    typeof setUpPageHeaders === "function" && setUpPageHeaders,
    typeof setUpTabLists === "function" && setUpTabLists,
    typeof setUpAlerts === "function" && setUpAlerts,
    typeof setUpBanners === "function" && setUpBanners,
    typeof setUpSaveBars === "function" && setUpSaveBars,
    typeof setUpSplitPanes === "function" && setUpSplitPanes,
    typeof setUpAppShells === "function" && setUpAppShells,
    typeof setUpPopovers === "function" && setUpPopovers,
    typeof setUpMenubars === "function" && setUpMenubars,
    typeof setUpSliders === "function" && setUpSliders,
    typeof setUpSwatchGroups === "function" && setUpSwatchGroups,
    typeof setUpColors === "function" && setUpColors,
    typeof setUpOtps === "function" && setUpOtps,
    typeof setUpDates === "function" && setUpDates,
    typeof setUpTimes === "function" && setUpTimes,
    typeof setUpAvatars === "function" && setUpAvatars,
    typeof setUpSpotlights === "function" && setUpSpotlights,
    typeof setUpPasswords === "function" && setUpPasswords,
    typeof setUpComboboxes === "function" && setUpComboboxes,
    typeof setUpSegments === "function" && setUpSegments,
    typeof setUpCounters === "function" && setUpCounters,
    typeof setUpFieldSizing === "function" && setUpFieldSizing,
  ].filter(Boolean);
  const hasReveals = typeof syncReveals === "function";

  for (const setUp of setUps) setUp(document);
  new MutationObserver((records) => {
    const counted = new Set();
    for (const record of records) {
      /* A Count's number changing. */
      if (record.type !== "attributes") {
        const count = (record.target.nodeType === 1 ? record.target : record.target.parentElement)?.closest?.(".canon-count");
        if (count && !counted.has(count)) {
          counted.add(count);
          markUpdated(count);
        }
        if (record.type === "characterData") continue;
      }
      if (record.type === "attributes") {
        if (record.attributeName === "maxlength") {
          if (typeof updateCounter === "function" && record.target.hasAttribute("maxlength") && record.target.matches(countedControl)) updateCounter(record.target);
        } else if (record.attributeName === "aria-busy") {
          /* Content that finished loading (a Skeleton's region, a Data
             Table) is marked data-loaded while the theme shows it in. */
          if (record.oldValue === "true" && record.target.getAttribute("aria-busy") !== "true" && !record.target.matches(".canon-button, select, progress")) markMotion(record.target, "data-loaded");
        } else if (record.attributeName === "hidden") {
          if (typeof openAlert === "function" && record.oldValue !== null && !record.target.hidden && record.target.matches(".canon-alert, .canon-banner")) openAlert(record.target);
        } else if (record.target.matches(seeded)) seedSlot(record.target);
        continue;
      }
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        for (const setUp of setUps) setUp(node);
        if (hasReveals && (node.matches(".canon-form-reveal") || node.querySelector(".canon-form-reveal"))) syncReveals(node.parentElement ?? document);
        if (typeof openAlert === "function" && node.matches(".canon-alert[role], .canon-banner[role]")) openAlert(node);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-seed", "maxlength", "hidden", "aria-busy"], attributeOldValue: true, characterData: true });
