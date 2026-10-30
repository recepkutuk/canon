/*
 * The Introduction page. Not part of canon.
 *
 * - The first screen: real components framing the claim, each acting in
 *   turn, round the frame.
 * - Why Canon: a lead and four beliefs, coming in once as they're seen.
 * - What the markup gives you: a story in three chapters that plays while
 *   it's in view. The source lights the lines each chapter is about; a
 *   segmented control is named, then its choice moves as the arrow keys
 *   would move it, the indicator sliding along.
 * - Without JavaScript: a cell for each component, settling by tier.
 * - Every component: pointing at a name shows it running above the
 *   pointer, its preview taken from the Components page.
 * Without JavaScript every part shows finished.
 */
(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const top = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ref-top")) * 16 || 56;

  /* ------------------------------------------------------------------ */
  /* The first screen                                                    */
  /* ------------------------------------------------------------------ */

  /* The components act one after another, in slot order, then round
     again: each changes the way a hand would change it, through the same
     values and events, so canon.js draws what follows. The cells are inert;
     a press and the slider's value, which a hand would show, are drawn
     with data-pressed and data-showing. It plays while the frame is in
     view and the tab shown; with reduced motion it stays as written. */
  const frame = document.querySelector(".ref-l-frame");
  const slot = (n) => frame.querySelector(`[data-slot="${n}"]`);
  const pick = (list, not) => {
    const rest = list.filter((each) => each !== not);
    return rest[Math.floor(Math.random() * rest.length)];
  };
  let frameSeen = false;
  const frameOn = () => frameSeen && !document.hidden;
  /* A wait that doesn't run down while the frame is away. */
  const wait = (ms) => new Promise((resolve) => {
    let left = ms;
    let last = performance.now();
    const tick = (now) => {
      if (frameOn()) left -= now - last;
      last = now;
      if (left <= 0) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const fire = (element, ...types) => {
    for (const type of types) element.dispatchEvent(new Event(type, { bubbles: true }));
  };
  /* Out, changed, back: a component that becomes another of its kind. */
  const morph = async (element, change) => {
    const out = { opacity: 0, filter: "blur(2px)", scale: 0.94 };
    const steady = { opacity: 1, filter: "blur(0)", scale: 1 };
    await element.animate([steady, out], { duration: 160, easing: "ease-in", fill: "forwards" }).finished;
    change();
    element.getAnimations().forEach((animation) => animation.cancel());
    await element.animate([out, steady], { duration: 260, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }).finished;
  };
  const press = async (button, ms = 140) => {
    button.setAttribute("data-pressed", "");
    await wait(ms);
    button.removeAttribute("data-pressed");
  };

  /* Each other one of a kind, in turn. */
  /* Another group each time: its size, density and people (some with a
     photo), and whether it ends with a count, drawn at random. Fewer
     people the bigger they are, so a group fits its cell. */
  const everyone = ["Ada Lovelace", "Grace Hopper", "Alan Turing", "Katherine Johnson", "Edsger Dijkstra", "Barbara Liskov", "Donald Knuth", "Margaret Hamilton", "Linus Torvalds", "Frances Allen", "Dennis Ritchie", "Radia Perlman", "Ken Thompson", "Hedy Lamarr"];
  const photos = { "Ada Lovelace": "avatar-photo", "Grace Hopper": "avatar-2", "Alan Turing": "avatar-3", "Margaret Hamilton": "avatar-4", "Donald Knuth": "avatar-5", "Radia Perlman": "avatar-6" };
  /* Loaded ahead, so a face is there when its avatar arrives. */
  for (const photo of Object.values(photos)) new Image().src = `assets/${photo}.jpg`;
  const initials = (name) => name.split(" ").map((word) => word[0]).join("");
  const avatar = (name, seed) => `<span class="canon-avatar" data-seed="${seed}">${photos[name] ? `<img class="canon-avatar-image" src="assets/${photos[name]}.jpg" alt="" width="32" height="32">` : ""}<span class="canon-avatar-fallback" role="img" aria-label="${name}">${initials(name)}</span></span>`;
  const sizes = { xs: [4, 5], sm: [3, 4], md: [2, 3] };
  const people = (group) => {
    const size = pick(Object.keys(sizes), group.dataset.size);
    const density = pick(["compact", "comfortable", "spacious"], group.dataset.density);
    const [few, many] = sizes[size];
    const count = few + Math.floor(Math.random() * (many - few + 1));
    const rest = Math.random() < 0.5 ? 2 + Math.floor(Math.random() * 8) : 0;
    const chosen = [...everyone].sort(() => Math.random() - 0.5).slice(0, rest ? count - 1 : count);
    const html = chosen.map((name) => avatar(name, everyone.indexOf(name) * 37 + 11)).join("")
      + (rest ? `<span class="canon-avatar"><span class="canon-avatar-fallback" role="img" aria-label="${rest} more">${rest}+</span></span>` : "");
    return { size, density, html };
  };
  const buttons = [
    { emphasis: "high", intent: null, icon: "plus", label: "Add" },
    { emphasis: "medium", intent: "neutral", icon: "download", label: "Export" },
    { emphasis: "low", intent: "danger", icon: "trash", label: "Delete" },
  ];
  const tags = [
    { emphasis: null, intent: "warning", label: "Pending" },
    { emphasis: "high", intent: "success", label: "Paid" },
    { emphasis: null, intent: "danger", label: "Overdue" },
  ];
  const turns = { button: 0, tag: 0 };
  const setAttr = (element, name, value) => {
    if (value == null) element.removeAttribute(name);
    else element.setAttribute(name, value);
  };

  const beats = [
    /* 1. The next view. */
    async () => {
      const radios = [...slot(1).querySelectorAll('input[type="radio"]')];
      const at = radios.findIndex((radio) => radio.checked);
      radios[(at + 1) % radios.length].checked = true;
      fire(radios[(at + 1) % radios.length], "input", "change");
    },
    /* 2. Other people, at another size and density: the ones there leave
       one by one, then the others arrive one by one. */
    async () => {
      const group = slot(2).querySelector(".canon-avatar-group");
      const next = people(group);
      const gone = { opacity: 0, scale: 0.6, translate: "0 0.25rem" };
      const here = { opacity: 1, scale: 1, translate: "0 0" };
      await Promise.all([...group.children].map((avatar, i) => avatar.animate([here, gone], {
        duration: 200, delay: i * 70, easing: "ease-in", fill: "forwards",
      }).finished));
      group.dataset.size = next.size;
      group.dataset.density = next.density;
      group.innerHTML = next.html;
      await Promise.all([...group.children].map((avatar, i) => avatar.animate([gone, here], {
        duration: 420, delay: 80 + i * 90, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "backwards",
      }).finished));
    },
    /* 3. Switched. */
    async () => {
      const input = slot(3).querySelector("input");
      input.checked = !input.checked;
      fire(input, "input", "change");
    },
    /* 4. Another button. */
    async () => {
      const button = slot(4).querySelector(".canon-button");
      await press(button);
      const next = buttons[turns.button = (turns.button + 1) % buttons.length];
      await morph(button, () => {
        setAttr(button, "data-emphasis", next.emphasis);
        setAttr(button, "data-intent", next.intent);
        button.querySelector(".canon-icon").dataset.icon = next.icon;
        button.querySelector(".canon-button-label").textContent = next.label;
      });
    },
    /* 5. A new code, a digit at a time. */
    async () => {
      const input = slot(5).querySelector("input");
      const code = Array.from({ length: input.maxLength }, (_, i) => pick([..."0123456789"], input.value[i])).join("");
      for (let i = 0; i < code.length; i++) {
        input.value = code.slice(0, i + 1) + input.value.slice(i + 1);
        input.setSelectionRange?.(i, i + 1);
        fire(input, "input");
        await wait(130);
      }
    },
    /* 6. Opened, another color, closed. */
    async () => {
      const group = slot(6).querySelector(".canon-swatches");
      const toggle = group.querySelector(".canon-swatches-toggle");
      const radios = [...group.querySelectorAll('input[type="radio"]')];
      toggle?.setAttribute("aria-expanded", "true");
      await wait(520);
      const next = pick(radios, radios.find((radio) => radio.checked));
      next.checked = true;
      fire(next, "input", "change");
      await wait(560);
      toggle?.setAttribute("aria-expanded", "false");
    },
    /* 7. Another status. */
    async () => {
      const tag = slot(7).querySelector(".canon-tag");
      const next = tags[turns.tag = (turns.tag + 1) % tags.length];
      await morph(tag, () => {
        setAttr(tag, "data-emphasis", next.emphasis);
        setAttr(tag, "data-intent", next.intent);
        tag.querySelector(".canon-tag-label").textContent = next.label;
      });
    },
    /* 8. Dragged to a new value, the value over the thumb meanwhile. */
    async () => {
      const control = slot(8).querySelector(".canon-control");
      const input = control.querySelector('input[type="range"]');
      const from = Number(input.value);
      let to = from;
      while (Math.abs(to - from) < 20) to = 5 + Math.floor(Math.random() * 91);
      control.setAttribute("data-showing", "");
      await wait(240);
      const start = performance.now();
      await new Promise((resolve) => {
        const move = (now) => {
          const t = Math.min(1, (now - start) / 900);
          const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
          input.value = String(Math.round(from + (to - from) * eased));
          fire(input, "input");
          if (t < 1) requestAnimationFrame(move);
          else resolve();
        };
        requestAnimationFrame(move);
      });
      fire(input, "change");
      await wait(500);
      control.removeAttribute("data-showing");
    },
    /* 9. Another time, hours then minutes, each cell active as it's set. */
    async () => {
      const box = slot(9).querySelector(".canon-time");
      const input = box.querySelector('input[type="time"]');
      const pad = (n) => String(n).padStart(2, "0");
      let [hour, minute] = input.value.split(":").map(Number);
      for (const type of ["hour", "minute"]) {
        const cell = box.querySelector(`.canon-time-cell[data-type="${type}"]`);
        cell?.setAttribute("data-active", "");
        await wait(360);
        if (type === "hour") hour = pick([...Array(24).keys()].slice(6, 22), hour);
        else minute = pick([...Array(12).keys()].map((n) => n * 5), minute);
        input.value = `${pad(hour)}:${pad(minute)}`;
        fire(input, "input", "change");
        await wait(420);
        cell?.removeAttribute("data-active");
      }
    },
    /* 10. Stepped to a new number, a press of − or + for each. */
    async () => {
      const box = slot(10).querySelector(".canon-number");
      const input = box.querySelector("input");
      const to = pick([...Array(10).keys()], Number(input.value));
      const command = to > Number(input.value) ? "--canon-step-up" : "--canon-step-down";
      const button = box.querySelector(`[command="${command}"]`);
      while (Number(input.value) !== to) {
        button.setAttribute("data-pressed", "");
        input.dispatchEvent(Object.assign(new Event("command", { cancelable: true }), { command, source: button }));
        await wait(120);
        button.removeAttribute("data-pressed");
        await wait(140);
      }
    },
  ];

  let playing = false;
  const play = async () => {
    if (playing) return;
    playing = true;
    await wait(600);
    for (let i = 0; ; i = (i + 1) % beats.length) {
      await beats[i]();
      await wait(700);
    }
  };
  new IntersectionObserver(([entry]) => {
    frameSeen = entry.isIntersecting;
    if (frameSeen && !still.matches) play();
  }, { threshold: 0.35 }).observe(frame);

  /* ------------------------------------------------------------------ */
  /* Why Canon                                                           */
  /* ------------------------------------------------------------------ */

  /* Its entrance plays once, as it comes into view: the lead line by line.
     Its words are wrapped so their lines can be told apart, numbered as
     they wrap at that moment. */
  const why = document.querySelector(".ref-l-why");
  const lead = why.querySelector(".ref-l-lead");
  /* Read whole: screen readers get the text once, plainly; the wrapped
     words are only seen. */
  const shown = document.createElement("span");
  shown.setAttribute("aria-hidden", "true");
  const spoken = Object.assign(document.createElement("span"), { className: "canon-visually-hidden", textContent: lead.textContent });
  shown.append(...lead.childNodes);
  lead.append(spoken, shown);
  const words = [];
  for (const node of [...shown.childNodes].flatMap((each) => each.nodeType === Node.TEXT_NODE ? [each] : [...each.childNodes].filter((child) => child.nodeType === Node.TEXT_NODE))) {
    const parts = node.textContent.split(/(\s+)/).map((part) => {
      if (!part || /^\s+$/.test(part)) return document.createTextNode(part);
      const word = Object.assign(document.createElement("span"), { className: "ref-l-word", textContent: part });
      words.push(word);
      return word;
    });
    node.replaceWith(...parts);
  }
  why.dataset.waiting = "";
  new IntersectionObserver(([entry], observer) => {
    if (!entry.isIntersecting) return;
    let line = -1;
    let last = null;
    for (const word of words) {
      if (word.offsetTop !== last) { line++; last = word.offsetTop; }
      word.style.setProperty("--line", line);
    }
    why.style.setProperty("--lines", line + 1);
    delete why.dataset.waiting;
    observer.disconnect();
  }, { rootMargin: "0px 0px -15% 0px" }).observe(why);

  /* ------------------------------------------------------------------ */
  /* What the markup gives you                                           */
  /* ------------------------------------------------------------------ */

  /* A story in three chapters. Each step's bar fills while its chapter
     plays (a CSS animation, as long as the chapter), and when it's full the
     next chapter begins, round again after the last. It plays while the
     section is in view, and holds while the pointer or focus is in it or
     the tab is hidden. A step jumps to its chapter. With reduced motion
     nothing plays: the steps are the way through. */
  const story = document.querySelector(".ref-l-story");
  const steps = [...story.querySelectorAll(".ref-l-step")];
  const group = document.getElementById("land-view");
  const radios = [...group.querySelectorAll('input[type="radio"]')];
  const stage = story.querySelector(".ref-l-stage");
  const heard = story.querySelector(".ref-l-heard-text");

  /* What a screen reader announces: the chosen option, its place and the
     group's name. */
  const announce = () => {
    const at = radios.findIndex((radio) => radio.checked);
    heard.textContent = `radio button, ${radios[at].value}, ${at + 1} of ${radios.length}, ${group.getAttribute("aria-label")}`;
  };
  group.addEventListener("change", announce);
  /* Chapter three: the next option chosen every so often, as the arrow
     keys would; the indicator slides to it. */
  let choosing = 0;
  const choose = (on) => {
    clearInterval(choosing);
    if (!on) return;
    choosing = setInterval(() => {
      if (story.hasAttribute("data-paused")) return;
      const at = radios.findIndex((radio) => radio.checked);
      radios[(at + 1) % radios.length].click();
    }, 1400);
  };
  const reset = () => {
    if (!radios[1].checked) radios[1].click();
  };

  const go = (now) => {
    story.dataset.chapter = now;
    for (const step of steps) {
      const at = Number(step.dataset.chapter);
      /* Off, then on: the bar fills from empty, also on the same chapter. */
      step.removeAttribute("data-now");
      void step.offsetWidth;
      step.toggleAttribute("data-now", at === now);
      step.toggleAttribute("data-done", at < now);
      if (at === now) step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
    }
    for (const text of story.querySelectorAll(".ref-l-story-text > p")) text.toggleAttribute("data-now", Number(text.dataset.chapter) === now);
    /* Chapter one shows the whole source; the others light what they're about. */
    for (const line of story.querySelectorAll(".ref-l-line")) {
      const about = line.dataset.chapters.split(" ").map(Number);
      line.toggleAttribute("data-lit", now === 1 || about.includes(now));
    }
    stage.toggleAttribute("data-named", now >= 2);
    if (now < 3) reset();
    choose(now === 3 && !still.matches);
    announce();
  };
  for (const step of steps) {
    step.addEventListener("click", () => go(Number(step.dataset.chapter)));
    step.querySelector(".ref-l-step-bar").addEventListener("animationend", () => {
      if (step.hasAttribute("data-now")) go(Number(step.dataset.chapter) % steps.length + 1);
    });
  }

  let storySeen = false;
  let started = false;
  let inside = false;
  const hold = () => {
    const playing = storySeen && !inside && !document.hidden;
    story.toggleAttribute("data-paused", !playing);
    /* From the first chapter the first time it's seen. */
    if (playing && !started) { started = true; go(1); }
  };
  new IntersectionObserver(([entry]) => { storySeen = entry.isIntersecting; hold(); }, { threshold: 0.35 }).observe(story);
  document.addEventListener("visibilitychange", hold);
  /* Keyboard focus holds it (a ring shows); a click's focus doesn't. */
  const keyboardIn = () => !!story.querySelector(":focus-visible");
  story.addEventListener("pointerenter", () => { inside = true; hold(); });
  story.addEventListener("pointerleave", () => { inside = keyboardIn(); hold(); });
  story.addEventListener("focusin", () => { inside = story.matches(":hover") || keyboardIn(); hold(); });
  story.addEventListener("focusout", (event) => { if (!story.contains(event.relatedTarget)) { inside = story.matches(":hover"); hold(); } });
  go(1);
  hold();


  /* ------------------------------------------------------------------ */
  /* Without JavaScript                                                  */
  /* ------------------------------------------------------------------ */

  const components = JSON.parse(document.getElementById("l-components").textContent);
  const order = { T0: 0, T1: 1, T2: 2, T3: 3 };
  const squares = document.querySelector(".ref-l-squares");
  components.filter((each) => each.tier in order)
    .sort((a, b) => order[a.tier] - order[b.tier])
    .forEach((each, i) => {
      const square = document.createElement("span");
      square.dataset.tier = each.tier;
      square.title = each.name;
      square.style.setProperty("--i", i);
      squares.append(square);
    });
  /* Pointing at a line of the key keeps only its tier's cells lit. */
  const tally = document.querySelector(".ref-l-tally");
  for (const line of tally.querySelectorAll(".ref-l-key > div")) {
    line.addEventListener("pointerenter", () => { tally.dataset.show = line.dataset.tier; });
    line.addEventListener("pointerleave", () => { delete tally.dataset.show; });
  }
  squares.dataset.waiting = "";
  new IntersectionObserver(([entry], observer) => {
    if (!entry.isIntersecting) return;
    delete squares.dataset.waiting;
    observer.disconnect();
    /* Once in, they change at once: no staggered entrance again. */
    setTimeout(() => { squares.dataset.settled = ""; }, squares.children.length * 12 + 800);
  }, { rootMargin: "0px 0px -20% 0px" }).observe(squares);

  /* ------------------------------------------------------------------ */
  /* Every component                                                     */
  /* ------------------------------------------------------------------ */

  const names = document.querySelector(".ref-l-names");
  /* The names appear one after another, once, as the list comes into view. */
  [...names.querySelectorAll("a")].forEach((link, i) => link.style.setProperty("--i", i));
  names.dataset.waiting = "";
  new IntersectionObserver(([entry], observer) => {
    if (!entry.isIntersecting) return;
    delete names.dataset.waiting;
    observer.disconnect();
  }, { rootMargin: "0px 0px -20% 0px" }).observe(names);
  const peek = document.querySelector(".ref-l-peek");
  const peekStage = peek.querySelector(".ref-l-peek-stage");
  let previews = null;
  const load = () => (previews ??= fetch("components.html")
    .then((response) => response.text())
    .then((text) => {
      const page = new DOMParser().parseFromString(text, "text/html");
      const found = new Map();
      for (const link of page.querySelectorAll(".ref-catalog-foot")) {
        found.set(link.querySelector(".ref-catalog-name")?.textContent, link.closest(".ref-catalog-card")?.querySelector(".ref-catalog-preview"));
      }
      return found;
    })
    .catch(() => new Map()));
  /* A preview fits its box: drawn smaller (never larger) when it needs more room. */
  const fit = () => {
    const shownStage = peekStage.querySelector(".ref-catalog-stage");
    if (!shownStage) return;
    shownStage.style.removeProperty("--ref-z");
    const box = shownStage.getBoundingClientRect();
    const style = getComputedStyle(peekStage);
    const width = peekStage.clientWidth - parseFloat(style.paddingInlineStart) - parseFloat(style.paddingInlineEnd);
    const height = peekStage.clientHeight - parseFloat(style.paddingBlockStart) - parseFloat(style.paddingBlockEnd);
    const zoom = Math.floor(Math.min(1, width / box.width, height / box.height) * 100) / 100;
    if (zoom < 1) shownStage.style.setProperty("--ref-z", String(zoom));
  };
  /* Above the pointer (or the focused name), centered on it, so the name
     stays in view; below it near the window's top. Kept in the window. */
  const place = (x, y) => {
    const width = peek.offsetWidth;
    const height = peek.offsetHeight;
    const above = y - 36 - height;
    peek.style.left = `${Math.min(Math.max(16, x - width / 2), innerWidth - width - 16)}px`;
    peek.style.top = `${above >= top() + 16 ? above : Math.min(y + 36, innerHeight - height - 16)}px`;
  };
  let current = null;
  const show = async (link, x, y) => {
    if (!link) return;
    if (link !== current) {
      current = link;
      const preview = (await load()).get(link.dataset.name);
      if (current !== link) return;
      /* Ids in a preview stay unique: one is shown at a time. */
      peekStage.replaceChildren(...(preview ? [...preview.cloneNode(true).childNodes] : []));
      peek.hidden = !preview;
      fit();
    }
    place(x, y);
  };
  const hide = () => {
    current = null;
    peek.hidden = true;
    peekStage.replaceChildren();
  };
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  names.addEventListener("pointermove", (event) => {
    if (!fine.matches) return;
    const link = event.target.closest("a[data-name]");
    if (link) show(link, event.clientX, event.clientY);
    else hide();
  });
  names.addEventListener("pointerleave", hide);
  names.addEventListener("focusin", (event) => {
    const link = event.target.closest("a[data-name]");
    if (!link) return;
    const box = link.getBoundingClientRect();
    show(link, box.left + box.width / 2, box.top);
  });
  names.addEventListener("focusout", hide);
  addEventListener("scroll", () => { if (!peek.hidden) hide(); }, { passive: true });
  /* Loaded ahead, so the first one shows at once. */
  if (fine.matches) load();
})();
