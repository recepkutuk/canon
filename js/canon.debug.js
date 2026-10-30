/*
 * canon.debug.js: the contract check's warnings
 *
 * Development only, with canon.debug.css. Every element the contract check
 * outlines gets a warning right below it: which contract it breaks, why
 * (the rule's --canon-contract-reason), and the exact condition it fails.
 *
 * Where they go: a container marked data-canon-debug="after" (a preview,
 * an example) takes the warnings about everything inside it, as blocks
 * right after it, each naming its element (pointing at one marks the
 * element). Elsewhere a warning floats under its element, in the top layer.
 * Either way the markup being checked is never touched. They follow the
 * page: an element that changes, appears, opens or goes away is checked
 * again; a dismissed floating warning comes back when what it reports
 * changes; and removing canon.debug.css removes them.
 *
 * Load with <script src="canon.debug.js" defer>.
 */
(() => {
  if (window.canonDebug) return;
  window.canonDebug = true;

  /* A CSS string's text: without its quotes and escapes. */
  const unquote = (value) => value.trim().replace(/^(["'])([\s\S]*)\1$/, "$2").replace(/\\(.)/g, "$1");

  /* A selector list's selectors (commas inside :not(), :is() or [...] stay). */
  const split = (list) => {
    const parts = [];
    let depth = 0, quote = "", from = 0;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (quote) { if (c === "\\") i++; else if (c === quote) quote = ""; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === "(" || c === "[") depth++;
      else if (c === ")" || c === "]") depth--;
      else if (c === "," && depth === 0) { parts.push(list.slice(from, i).trim()); from = i + 1; }
    }
    parts.push(list.slice(from).trim());
    return parts.filter(Boolean);
  };

  /* The contract rules on the page: every style rule that names a contract. */
  const contractRules = () => {
    const rules = [];
    const walk = (list) => {
      for (const rule of list) {
        if (rule instanceof CSSStyleRule) {
          const contract = rule.style.getPropertyValue("--canon-contract");
          if (contract) rules.push({
            selector: rule.selectorText,
            contract: unquote(contract),
            reason: unquote(rule.style.getPropertyValue("--canon-contract-reason")),
          });
        }
        if (rule.cssRules) walk(rule.cssRules);
      }
    };
    for (const sheet of document.styleSheets) {
      try { walk(sheet.cssRules); } catch { /* another origin's sheet */ }
    }
    return rules;
  };

  /* "[data-x]:not([data-x="a"], [data-x="b"])": say the value and the known ones. */
  const knownValues = (condition, element) => {
    const found = condition.match(/\[([\w-]+)\]:not\(((?:\s*\[[\w-]+="[^"]*"\]\s*,?)+)\)/);
    if (!found) return "";
    const [, name, list] = found;
    const values = [...list.matchAll(/\[([\w-]+)="([^"]*)"\]/g)].filter(([, attr]) => attr === name).map(([, , value]) => value);
    if (!values.length || !element.hasAttribute(name)) return "";
    return `${name}="${element.getAttribute(name)}" isn't a known value (${values.join(", ")}).`;
  };

  /* Each outlined element: the contracts it breaks, the reasons, the conditions. */
  const findBreaches = () => {
    const breaches = new Map();
    for (const rule of contractRules()) {
      let elements;
      try { elements = document.querySelectorAll(rule.selector); } catch { continue; }
      for (const element of elements) {
        if (element.closest(".canon-debug-alert")) continue;
        const conditions = split(rule.selector).filter((part) => {
          try { return element.matches(part); } catch { return false; }
        });
        if (!breaches.has(element)) breaches.set(element, []);
        breaches.get(element).push({ ...rule, conditions });
      }
    }
    return breaches;
  };

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  /* "<button class="canon-button"> “Save changes”": which element a block
     warning is about. */
  const describe = (element) => {
    const name = element.id ? `#${element.id}` : [...element.classList].filter((name) => !name.startsWith("canon-debug")).slice(0, 1).map((name) => `.${name}`).join("");
    const text = element.textContent.trim().replace(/\s+/g, " ");
    return { tag: `<${element.localName}${name}>`, text: text.length > 40 ? `${text.slice(0, 39)}…` : text };
  };

  const fill = (alert, element, broken, block) => {
    const body = make("div", "canon-debug-alert-body");
    for (const [contract, rules] of Map.groupBy(broken, (rule) => rule.contract)) {
      body.append(make("p", "canon-debug-alert-title", `Breaks the ${contract} contract`));
      for (const rule of rules) {
        if (rule.reason) body.append(make("p", "canon-debug-alert-reason", rule.reason));
        const checks = make("ul", "canon-debug-alert-checks");
        for (const condition of rule.conditions) {
          const item = make("li");
          const values = knownValues(condition, element);
          if (values) item.append(make("span", "", values), document.createElement("br"));
          item.append(make("code", "", condition));
          checks.append(item);
        }
        if (checks.childElementCount) body.append(checks);
      }
    }
    if (block) {
      const { tag, text } = describe(element);
      const target = make("p", "canon-debug-alert-target", "On ");
      target.append(make("code", "", tag));
      if (text) target.append(` “${text}”`);
      body.append(target);
    }
    /* A block stays while the breach does; a floating one can be put away
       (it may cover what's under it). */
    if (block) return alert.replaceChildren(body);
    const close = make("button", "canon-debug-alert-close");
    close.type = "button";
    close.setAttribute("aria-label", "Dismiss");
    alert.replaceChildren(body, close);
  };

  /* Without anchor positioning: place each floating warning by hand. */
  const anchored = CSS.supports("position-area", "block-end");
  const place = (alert, element) => {
    if (anchored || !alert.popover) return;
    const box = element.getBoundingClientRect();
    alert.style.top = `${box.bottom}px`;
    alert.style.left = `${box.left}px`;
  };

  /* Where a warning goes: after the nearest container marked
     data-canon-debug="after" (a block between it and what follows), or,
     with none, floating under the element. */
  const hostOf = (element) => element.closest('[data-canon-debug="after"]');
  const reports = new Map();
  const reportFor = (host) => {
    let report = reports.get(host);
    if (!report?.isConnected || report.previousElementSibling !== host) {
      report?.remove();
      report = make("div", "canon-debug-report");
      host.after(report);
      reports.set(host, report);
    }
    return report;
  };

  const alerts = new Map();
  /* Dismissed: by what a warning says and which element it names, so a
     preview drawn again with the same breach stays quiet. */
  const dismissed = new Set();
  const dismissKey = (element, key) => JSON.stringify([describe(element), key]);
  const update = () => {
    const breaches = findBreaches();
    const kept = new Set();
    for (const [element, broken] of breaches) {
      if (!element.checkVisibility({ visibilityProperty: true })) continue;
      const key = JSON.stringify(broken.map((rule) => [rule.contract, rule.reason, rule.conditions]));
      if (dismissed.has(dismissKey(element, key))) continue;
      const host = hostOf(element);
      let alert = alerts.get(element);
      if (alert && Boolean(alert.popover) === Boolean(host)) { alert.remove(); alert = null; }
      if (!alert) {
        alert = make("div", "canon-debug-alert");
        alert.setAttribute("role", "note");
        alerts.set(element, alert);
      }
      if (alert.dataset.key !== key) {
        fill(alert, element, broken, Boolean(host));
        alert.dataset.key = key;
      }
      kept.add(alert);
      if (host) {
        const report = reportFor(host);
        /* In the order of the elements they're about. */
        const after = [...report.children].find((other) => {
          const of = [...alerts].find(([, each]) => each === other)?.[0];
          return of && other !== alert && element.compareDocumentPosition(of) & Node.DOCUMENT_POSITION_FOLLOWING;
        });
        if (alert.parentElement !== report || (after && alert.nextElementSibling !== after)) report.insertBefore(alert, after ?? null);
      } else {
        if (!alert.popover) {
          alert.popover = "manual";
          document.body.append(alert);
        }
        /* Shown again each time, so it stays above popovers and dialogs that
           opened after it, anchored to its element (the source). */
        if (alert.matches(":popover-open")) alert.hidePopover();
        try { alert.showPopover({ source: element }); } catch { alert.showPopover(); }
        place(alert, element);
      }
    }
    for (const [element, alert] of alerts) {
      if (!kept.has(alert)) {
        alert.remove();
        alerts.delete(element);
      }
    }
    for (const [host, report] of reports) {
      if (!report.childElementCount || !host.isConnected) {
        report.remove();
        reports.delete(host);
      }
    }
  };

  const elementOf = (alert) => [...alerts].find(([, each]) => each === alert)?.[0];

  /* Dismiss: gone until what the element breaks changes. */
  document.addEventListener("click", (event) => {
    const alert = event.target.closest?.(".canon-debug-alert-close")?.closest(".canon-debug-alert");
    const element = alert && elementOf(alert);
    if (!element) return;
    dismissed.add(dismissKey(element, alert.dataset.key));
    element.removeAttribute("data-canon-debug-target");
    update();
  });
  /* Pointing at a warning marks its element. */
  document.addEventListener("pointerover", (event) => {
    const alert = event.target.closest?.(".canon-debug-alert");
    for (const [element, each] of alerts) element.toggleAttribute("data-canon-debug-target", each === alert);
  });

  /* Check again when anything changes (not the warnings themselves). */
  let timer = 0;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(update, 120);
  };
  const ours = (node) => node.nodeType === 1 && node.matches(".canon-debug-alert, .canon-debug-alert *, .canon-debug-report, .canon-debug-report *");
  new MutationObserver((records) => {
    if (records.every((record) => ours(record.target)
      || record.attributeName === "data-canon-debug-target"
      || (record.type === "childList" && [...record.addedNodes, ...record.removedNodes].every(ours)))) return;
    schedule();
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true });
  /* Stylesheets loading, popovers and dialogs opening, the window resizing. */
  document.addEventListener("load", schedule, true);
  document.addEventListener("toggle", (event) => { if (!ours(event.target)) schedule(); }, true);
  addEventListener("resize", schedule);
  if (!anchored) addEventListener("scroll", () => { for (const [element, alert] of alerts) place(alert, element); }, { capture: true, passive: true });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", update);
  else update();
})();
