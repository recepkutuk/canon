# Switch

Tier: **T0**

An on/off setting that **takes effect immediately**, without a submit. For a choice that is submitted with a form, use Checkbox.

Anatomy, states and shared obligations: `choice.md`. Groups (a settings section): `fieldset.md`.

```html
<div class="canon-choice">
  <input type="checkbox" role="switch" id="maintenance" name="maintenance" checked
         aria-describedby="maintenance-hint">
  <label class="canon-choice-label" for="maintenance">Maintenance mode</label>
  <p class="canon-choice-hint" id="maintenance-hint">Visitors see a maintenance page.</p>
</div>
```

- `role="switch"` on a checkbox is the contract. Safari's `switch` attribute is harmless but nothing depends on it.
- No indeterminate state, no `required`.
- **Theme obligation:** a theme without a switch renders it as a checkbox.
- Visible "On" / "Off" text comes from the strings `--canon-text-on` / `--canon-text-off`, written as `content: var(--canon-text-on) / ""` so assistive tech, which already hears the state, doesn't hear it twice.
- The thumb moves to the inline end, so it mirrors in RTL.

## State text (optional)

Words for each state, for when "on" needs saying in the setting's own terms (Private / Public, Paused / Active):

```html
<div class="canon-choice">
  <input type="checkbox" role="switch" id="visibility" name="visibility">
  <label class="canon-choice-label" for="visibility">Profile visibility</label>
  <span class="canon-choice-state" aria-hidden="true">
    <span class="canon-choice-state-off">Private</span>
    <span class="canon-choice-state-on">Public</span>
  </span>
</div>
```

| Element | Required | Notes |
|---|---|---|
| `canon-choice-state` | no | After the label (and hint), `aria-hidden="true"`. Switches only. |
| `canon-choice-state-off`, `canon-choice-state-on` | both, when there is state text | The only children. Core shows the one for the current state (`:checked`), so it works without canon.js. |

- **The label never changes.** It is the switch's name; the words beside it change. A name that swaps with the state reads as a contradiction ("Only visible to you, switch, off"), so the label says what the setting is and the words say its value.
- **The words are hidden from assistive tech**, which already announces on and off. They are not a second `<label>`: a label's text joins the name even when it is hidden.
- Layout: the label moves above the switch (a field's label) and the words take its place beside the switch; the hint stays under the label, the message under the switch.
- canon.js makes a click on the words toggle the switch, as a label would (T2). Without it the words are plain text and the switch itself still works.
- Theme obligation: a theme that writes its own "On" / "Off" shows the author's words instead when they are present.

## Size

**sm:** 28×16 track (16px thumb), 12px label

**md / lg:** 34×20 / 40×24, 14 / 16px label

## Look

**Track:** The control's height, 1.5× it + 4px wide, with a 2px ring of the track's color outside it (so the label is 8 / 10 / 10px away). Off zinc-300 (dark zinc-700), on zinc-900 with a white thumb (dark: white with a zinc-900 thumb), a neutral high Button's colors. Focus: Checkbox's ring around the switch and its label, 2px out from the track's ring. In a group, switches sit 4px further apart than checkboxes, so the space between the rings matches. Disabled in Checkbox's greys (off zinc-200, dark zinc-800; on zinc-300, dark zinc-600); invalid and off, Text Input's error line color. No hover look. State text: the label above in Label's type (12 / 14 / 16px medium), the switch 6px under it or its hint (plus its ring), the words beside it in the usual label type, the focus ring around the switch and the words

**Thumb:** the control's height, white (off in dark: zinc-400), with a 1px 5% black ring and a 1px drop

**Motion:** the thumb springs across, past the end and back (0.3s), squeezed while it moves: flatter and wider mid-way (80% tall, 120% wide), a touch taller as it rebounds. None with reduced motion.

**Label:** beside

