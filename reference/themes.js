/*
 * themes.js
 *
 * The Themes page: writes one sample into a frame per theme, each frame a
 * page of its own with that theme's stylesheet. The frames follow the docs'
 * color scheme and grow to fit their content.
 */
(() => {
  const sample = `
    <div class="canon-field">
      <div class="canon-label"><label class="canon-label-text" for="email">Billing email</label></div>
      <div class="canon-text-input"><input id="email" type="email" placeholder="billing@globex.example"></div>
    </div>
    <div class="canon-segmented" role="radiogroup" aria-label="Calendar view">
      <label class="canon-segmented-option"><input type="radio" name="view" value="week" checked><span class="canon-segmented-label">Week</span></label>
      <label class="canon-segmented-option"><input type="radio" name="view" value="month"><span class="canon-segmented-label">Month</span></label>
    </div>
    <div class="canon-choice">
      <input type="checkbox" id="updates" name="updates" checked>
      <label class="canon-choice-label" for="updates">Email me product updates</label>
    </div>
    <div class="sample-row">
      <span class="canon-tag" data-intent="success">Paid</span>
      <span class="canon-tag" data-intent="warning">Pending</span>
    </div>
    <div class="sample-row">
      <button type="button" class="canon-button" data-emphasis="high"><span class="canon-icon" data-icon="plus" aria-hidden="true"></span><span class="canon-button-label">New invoice</span></button>
      <button type="button" class="canon-button" data-emphasis="low" data-intent="neutral"><span class="canon-button-label">Cancel</span></button>
    </div>`;

  const frames = [...document.querySelectorAll(".ref-theme-card")].map((card) => {
    const frame = card.querySelector(".ref-theme-frame");
    const theme = card.dataset.theme;
    frame.srcdoc = `<!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <base href="${new URL(".", location.href).href}">
        <link rel="stylesheet" href="../css/${theme}/${theme}.css">
        <script src="../js/canon.js" defer><\/script>
        <style>
          body { display: grid; grid-template-columns: minmax(0, 1fr); justify-items: start; gap: 1.25rem; margin: 0; padding: 1.25rem; }
          .canon-field { justify-self: stretch; }
          .sample-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
        </style>
      </head>
      <body>${sample}</body>
      </html>`;
    return frame;
  });

  const scheme = () => document.documentElement.style.colorScheme;
  const fit = (frame) => {
    frame.contentDocument.documentElement.style.colorScheme = scheme();
    frame.style.blockSize = `${frame.contentDocument.documentElement.offsetHeight}px`;
  };
  for (const frame of frames) {
    frame.addEventListener("load", () => {
      fit(frame);
      new ResizeObserver(() => fit(frame)).observe(frame.contentDocument.body);
    });
  }
  /* The docs' toggle sets the scheme on the root. */
  new MutationObserver(() => {
    for (const frame of frames) if (frame.contentDocument?.documentElement) frame.contentDocument.documentElement.style.colorScheme = scheme();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
})();
