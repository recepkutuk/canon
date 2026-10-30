# Range Slider

Tier: **T0** (fill, no-crossing and values are T2, via canon.js)

Pick a from–to range on one track: a price range, working hours, a severity band. Single values use Slider (`slider.md`), whose anatomy, marks, vertical hint, tokens and theme obligations this component shares.

```html
<div class="canon-field" role="group" aria-labelledby="price-label">
  <div class="canon-label">
    <span class="canon-label-text" id="price-label">Price</span>
  </div>
  <div class="canon-control">
    <output class="canon-control-value" for="price-min" aria-hidden="true">200</output>
    <input type="range" id="price-min" name="price-min" min="0" max="1000" step="10" value="200" aria-label="Minimum">
    <input type="range" id="price-max" name="price-max" min="0" max="1000" step="10" value="800" aria-label="Maximum">
    <output class="canon-control-value" for="price-max" aria-hidden="true">800</output>
  </div>
</div>
```

- **Two native range inputs on one track**, each with its own `name`, so the form submits both and each thumb has native keyboard and accessibility support. Tab reaches the first, then the second.
- **The label names the pair, not an input:** the label text is a `<span id>` (see `label.md`), with `role="group"` and `aria-labelledby` on the field. A description goes in `aria-describedby` on the field. Each input names its thumb with `aria-label` ("Minimum", "Maximum", "From", "To"): the author's words.
- Both inputs share `min`, `max`, `step` and `list`.
- **Without JS it still works** (T0): only the thumbs take the pointer, so each can be dragged. The thumbs can cross; the server validates.
- **canon.js (T2):**
  - stops the moving thumb at the other one,
  - sets `--canon-slider-start` and `--canon-slider-end` on the box, and core fills between the thumbs,
  - keeps both `<output>`s in sync (named marks included),
  - when the thumbs meet, raises the one that can still move (`data-state="front"` on the first input, past the middle).
- The values: an `<output>` before the inputs belongs to the first thumb, one after them to the second. A theme may put them at both ends or as a bubble over each thumb (Canon: bubbles). For bubbles, canon.js reports each value's width as `--canon-slider-start-value-size` and `--canon-slider-end-value-size` on the box, so a theme can push the two apart where they would meet.
- The first input draws the track; the second draws only its thumb.

## Look

As Slider, plus:

**Range:** Slider's track and thumbs, zinc-900 (dark white) between them; a value bubble over a thumb only while that thumb is hovered, focused or dragged (each input takes the pointer only over its thumb, so its `:hover` is the thumb's); when both show, they sit side by side (4px apart) around their middle where they would meet, each arrow kept inside its bubble
