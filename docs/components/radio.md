# Radio

Tier: **T0**

Select exactly one option of a group.

Anatomy, states and shared obligations: `choice.md`. Groups: `fieldset.md`.

```html
<fieldset class="canon-fieldset" aria-describedby="plan-message">
  <legend class="canon-fieldset-legend">Plan</legend>
  <div class="canon-choice">
    <input type="radio" id="plan-free" name="plan" value="free" required>
    <label class="canon-choice-label" for="plan-free">Free</label>
  </div>
  <div class="canon-choice">
    <input type="radio" id="plan-team" name="plan" value="team" required>
    <label class="canon-choice-label" for="plan-team">Team</label>
  </div>
  <p class="canon-fieldset-message" id="plan-message" data-intent="danger">Choose a plan.</p>
</fieldset>
```

- **Radios are always inside a fieldset** (the legend is the question). The contract check outlines a radio that isn't.
- `required` on any radio makes the group required.
- The error belongs to the group: a danger `canon-fieldset-message`.
- Orientation is the fieldset's hint (`data-orientation`). Without it, the theme decides (Canon stacks them).

## Size

**sm:** 16px circle (control), 12px label

**md / lg:** 20 / 24px, 14 / 16px label

## Look

**Ring:** Checkbox's, round. The control is the icon size (16 / 20 / 24); the circle 90% of it, a 1px zinc-400 line (dark zinc-500); label 12 / 14 / 16px on 16 / 20 / 24px lines, 6 / 8 / 8px away. Hover: a zinc-600 line (dark zinc-300) and a 3px zinc-100 halo (dark zinc-800). Focus: a 1px blue-600 ring (dark blue-300) 2px out, around circle and label. Disabled: zinc-200 fill (dark zinc-600), label zinc-400 (dark zinc-500)

**Selected:** a neutral high Button's colors: zinc-900 fill with a white dot (dark: white with a zinc-900 dot), a quarter of the control (4 / 5 / 6px); hover keeps the halo; disabled zinc-300 with a zinc-100 dot (dark zinc-600, zinc-400)

**Invalid group:** the danger message (see Fieldset); a radio that is `aria-invalid` or `:user-invalid` takes Text Input's error line (red-400, dark red-500; hover red-600 with a red-100 halo)

**Motion:** Checkbox's squeeze: pressing squeezes the radio (to 82%), let go it eases back to its size (0.2s). Selecting, the fill comes in (0.08s) and the dot grows from the middle (0.2s), without overshooting; it goes at once. None with reduced motion.
