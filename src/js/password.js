  /* ------------------------------------------------------------------ */
  /* Password                                                            */
  /*                                                                     */
  /* - Rules: a rule with data-rule is checked as people type ("met" or */
  /*   pending; after a failed submit, unmet ones are "error"), and an   */
  /*   unmet rule blocks submitting (setCustomValidity). The rules and   */
  /*   the meter are found through the input's aria-describedby.        */
  /* - Meter with data-score="rules": the share of rules met, 0–4, with */
  /*   its word (aria-valuetext, and a .canon-password-strength-label   */
  /*   right after it). Real strength needs a real scorer: that is the  */
  /*   app's.                                                            */
  /* - Rules with data-reveal="focus": collapsed (data-state) until the */
  /*   input has focus or a value, and again once every rule is met.    */
  /* - Caps Lock: data-state="caps-lock" on the input while it is on,   */
  /*   announced once.                                                   */
  /* - Confirmation: an input with data-match="<id>" must equal that    */
  /*   input; its box gets data-state="match" when it does.             */
  /* ------------------------------------------------------------------ */

  const passwordInput = ".canon-password > input";

  /* Show or hide a password. The button is a toggle: its label stays
     "Show password" and aria-pressed carries the state. */
  commands["--canon-toggle-password"] = (target, source) => {
    const show = target.type === "password";
    target.type = show ? "text" : "password";
    source.setAttribute("aria-pressed", String(show));
  };

  /* A strong random password: at least 16 characters (more if a rule asks),
     with every kind of character, from the browser's secure random source. */
  const generatePassword = (length) => {
    const sets = ["abcdefghijkmnopqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!#$%&*+-=?@^_"];
    const all = sets.join("");
    const random = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
    const chars = sets.map((set) => set[random(set.length)]);
    while (chars.length < length) chars.push(all[random(all.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = random(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join("");
  };

  commands["--canon-generate-password"] = (target, source) => {
    const rules = describedBy(target, ".canon-password-rules").flatMap((list) => [...list.querySelectorAll(".canon-password-rule[data-rule^='min-length:']")]);
    const length = Math.max(16, ...rules.map((rule) => Number(rule.dataset.rule.split(":")[1]) || 0));
    const value = generatePassword(length);
    const fill = (input) => {
      input.value = value;
      input.type = "text";
      input.closest(".canon-password")?.querySelector(":scope > [command='--canon-toggle-password']")?.setAttribute("aria-pressed", "true");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    fill(target);
    if (target.id) for (const confirm of document.querySelectorAll(`input[data-match="${CSS.escape(target.id)}"]`)) fill(confirm);
    target.focus();
    announce(text(source, "password-generated", "Password generated"));
  };

  const ruleChecks = {
    "min-length": (value, n) => [...value].length >= Number(n),
    digit: (value) => /\p{Nd}/u.test(value),
    lowercase: (value) => /\p{Ll}/u.test(value),
    uppercase: (value) => /\p{Lu}/u.test(value),
    symbol: (value) => /[^\p{L}\p{N}\s]/u.test(value),
    pattern: (value, source) => {
      try { return new RegExp(source, "u").test(value); } catch { return null; }
    },
  };

  const ruleMet = (rule, value) => {
    const [name, ...rest] = rule.dataset.rule.split(":");
    return ruleChecks[name]?.(value, rest.join(":")) ?? null;
  };

  const checkPassword = (input, submitted = false) => {
    const value = input.value;
    const lists = describedBy(input, ".canon-password-rules");
    let checked = 0;
    let met = 0;
    let hasError = false;
    for (const list of lists) {
      for (const rule of list.querySelectorAll(".canon-password-rule[data-rule]")) {
        const ok = ruleMet(rule, value);
        if (ok === null) continue;
        checked++;
        if (ok) {
          met++;
          rule.dataset.state = "met";
        } else if (submitted || rule.dataset.state === "error") {
          rule.dataset.state = "error";
          hasError = true;
        } else {
          delete rule.dataset.state;
        }
      }
    }
    const unmet = checked - met;

    for (const meter of describedBy(input, "meter.canon-password-strength[data-score='rules']")) {
      const score = value && checked ? Math.round((met / checked) * 4) : 0;
      meter.value = score;
      const word = score ? text(meter, `strength-${score}`, "") : "";
      if (word) meter.setAttribute("aria-valuetext", word);
      else meter.removeAttribute("aria-valuetext");
      const label = meter.nextElementSibling;
      if (label?.classList.contains("canon-password-strength-label")) label.textContent = word;
    }

    const focused = document.activeElement === input;
    for (const list of lists) {
      if (list.dataset.reveal !== "focus") continue;
      const open = checked > 0 && unmet > 0 && (focused || value !== "" || hasError);
      if (open) delete list.dataset.state;
      else list.dataset.state = "collapsed";
    }

    /* Empty is the browser's to report (required), not the rules'. */
    return unmet && value ? text(input, "password-rules-unmet", "The password doesn't meet every rule.") : "";
  };

  const checkMatch = (confirm) => {
    const original = document.getElementById(confirm.dataset.match);
    const box = confirm.closest(".canon-password");
    if (!original) return "";
    const same = confirm.value !== "" && confirm.value === original.value;
    if (box) {
      if (same) box.dataset.state = "match";
      else if (box.dataset.state === "match") delete box.dataset.state;
    }
    return confirm.value && !same ? text(confirm, "passwords-differ", "The passwords don't match.") : "";
  };

  /* One input's validity, from its rules and its match, set once. */
  const checkInput = (input, submitted = false) => {
    const rules = checkPassword(input, submitted);
    const match = input.dataset.match ? checkMatch(input) : "";
    input.setCustomValidity(rules || match);
  };

  const updatePassword = (input) => {
    if (!input.matches(passwordInput)) return;
    checkInput(input);
    if (input.id) for (const confirm of document.querySelectorAll(`input[data-match="${CSS.escape(input.id)}"]`)) checkInput(confirm);
  };

  const setUpPasswords = (root) => {
    if (root.matches?.(passwordInput)) updatePassword(root);
    for (const input of root.querySelectorAll?.(passwordInput) ?? []) updatePassword(input);
  };

  document.addEventListener("input", (event) => updatePassword(event.target), true);
  document.addEventListener("focusin", (event) => updatePassword(event.target), true);
  document.addEventListener("focusout", (event) => {
    if (!event.target.matches?.(passwordInput)) return;
    delete event.target.dataset.state;
    queueMicrotask(() => updatePassword(event.target));
  }, true);
  document.addEventListener("invalid", (event) => {
    if (event.target.matches?.(passwordInput)) checkInput(event.target, true);
  }, true);

  const capsLock = (event) => {
    const input = event.target;
    if (!input.matches?.(passwordInput) || typeof event.getModifierState !== "function") return;
    const on = event.getModifierState("CapsLock");
    if (on === (input.dataset.state === "caps-lock")) return;
    if (on) {
      input.dataset.state = "caps-lock";
      announce(text(input, "caps-lock", "Caps Lock is on"));
    } else {
      delete input.dataset.state;
    }
  };
  document.addEventListener("keydown", capsLock, true);
  document.addEventListener("keyup", capsLock, true);
