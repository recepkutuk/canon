# Checkbox

Tier: **T0** (indeterminate needs one line of the author's JS)

Select any number of options; the choice takes effect on submit. For an on/off setting that applies immediately, use Switch.

Anatomy, states and shared obligations: `choice.md`. Groups: `fieldset.md`.

```html
<div class="canon-choice">
  <input type="checkbox" id="terms" name="terms" required
         aria-invalid="true" aria-describedby="terms-message">
  <label class="canon-choice-label" for="terms">I accept the terms of service</label>
  <p class="canon-choice-message" id="terms-message" data-intent="danger">Accept the terms to continue.</p>
</div>
```

- Alone (a single yes/no like accepting terms) or in a fieldset (select any of several).
- A single invalid checkbox gets `aria-invalid="true"` and a danger `canon-choice-message`. In a group, the fieldset's message carries the error.

## Indeterminate

HTML has no attribute for it. The author's JS sets the property; themes style `:indeterminate`:

```js
document.getElementById("select-all").indeterminate = true;
```

- **Theme obligation:** scope indeterminate styles to checkboxes (`[type="checkbox"]:indeterminate`). A radio is `:indeterminate` whenever no radio in its group is checked.
- canon.js does nothing with it in v1.

## Size

**sm:** 16px box (control), 12px label

**md / lg:** 20 / 24px, 14 / 16px label

## Look

**Box:** The control is the icon size (16 / 20 / 24), the box 90% of it with corners a quarter of it (4 / 5 / 6px), a 1px zinc-400 line (dark zinc-500); label 12 / 14 / 16px on 16 / 20 / 24px lines, 6 / 8 / 8px away. Hover: a zinc-600 line (dark zinc-300) and a 3px zinc-100 halo (dark zinc-800). Focus: a 1px blue-600 ring (dark blue-300) 2px out, around box and label. Disabled: zinc-200 fill (dark zinc-600), label zinc-400 (dark zinc-500)

**Checked:** a neutral high Button's colors: zinc-900 fill with Lucide square-check's check in white (dark: white with a zinc-900 check), stroke 1 / 1.25 / 1.5px; hover keeps the halo; disabled zinc-300 with a zinc-100 check (dark zinc-600, zinc-400). Indeterminate: the same with a dash

**Invalid:** Text Input's error line (red-400, dark red-500; hover red-600 with a red-100 halo).

**Motion:** a squeeze and a stroke. Pressing squeezes the box (to 82%, 0.08s); let go, it eases back to its size (0.2s), without overshooting. Checking, the fill comes in (0.08s) and the check (or the dash) is drawn along its stroke, the short leg then the long one (0.22s from 0.05s, eased in and out); unchecking, the mark goes at once and the fill fades. None with reduced motion.

## Deferred

- **Select-all helper** in canon.js (a parent checkbox reflecting its children as indeterminate).
