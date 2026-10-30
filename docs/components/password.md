# Password

Tier: **T0** (show / hide, generate, rule checks, Caps Lock and confirmation are T2, via canon.js; real strength scoring is the app's)

A password box with show / hide, and, when people choose a new password, a strength meter and the rules it must meet. Three parts, each usable alone; with a [Label](label.md) they make a [Field](field.md).

## Elements

```html
<div class="canon-password">
  <input id="pw" type="password" name="password" autocomplete="new-password" placeholder
         aria-label="Password" aria-describedby="pw-strength pw-rules">
  <button type="button" class="canon-button" data-emphasis="minimal" data-display="icon"
          aria-pressed="false" commandfor="pw" command="--canon-toggle-password">
    <span class="canon-icon" data-icon="eye" aria-hidden="true"></span>
    <span class="canon-button-label">Show password</span>
  </button>
</div>

<meter class="canon-password-strength" id="pw-strength" min="0" max="4" value="2"
       aria-label="Password strength" aria-valuetext="Weak"></meter>

<div class="canon-password-rules" id="pw-rules">
  <p class="canon-password-rules-title">Password must contain:</p>
  <ul>
    <li class="canon-password-rule" data-state="met">at least 8 characters</li>
    <li class="canon-password-rule">at least 1 number</li>
  </ul>
</div>
```

### The box: `.canon-password`

[Text Input](text-input.md)'s box, frame, sizes and states, around `<input type="password">`.

- **Show / hide:** a trailing button with `command="--canon-toggle-password"` (canon.js) switches `type` to `text` and back, and sets `aria-pressed`; its label stays "Show password". Hidden without scripting.
- **Generate** (optional): a button with `command="--canon-generate-password"` (icon `sparkles`, label "Generate password") fills in a random password from the browser's secure source: at least 16 characters, or the longest `min-length` rule, with every kind of character. It shows it (show / hide pressed), fills any confirmation (`data-match`) too, and announces "Password generated". Before show / hide.
- These two are the only buttons the box takes.
- **Caps Lock** (canon.js): while it is on as people type, the input gets `data-state="caps-lock"`, announced once ("Caps Lock is on"); themes show it in the box. Cleared on leaving.
- Optional leading `.canon-icon`. No prefix or suffix.
- `autocomplete="new-password"` when choosing one (password managers offer to generate it), `"current-password"` when signing in.
- Status: `aria-invalid="true"` for an error; `data-intent="warning"` or `"success"` on the box, as for Text Input.

### Strength: `meter.canon-password-strength`

A native `<meter>`, `min="0" max="4"`: 0 empty, 1 weakest, 2 weak, 3 medium, 4 strong. The fill is the meter's own value.

- **The app scores the password** (e.g. zxcvbn) and sets `value` and `aria-valuetext` (the word: "Weak"). Color never says it alone.
- **Or `data-score="rules"`:** canon.js scores it from the rules met (none 0 → all 4) and sets the word from the strings. A simple stand-in: it measures the rules, not how guessable the password is.
- Named with `aria-label` (or a visible label).
- **The word, visible** (optional): `<p class="canon-password-strength-label" aria-hidden="true">Weak</p>` right after the meter. Hidden from assistive tech (the meter says it); canon.js keeps it in step when it scores.

### Rules: `.canon-password-rules`

A title (`.canon-password-rules-title`) and a `<ul>` of `.canon-password-rule` items, in the author's words.

| `data-state` | Means |
|---|---|
| (none) | Not met yet |
| `met` | Met |
| `error` | Not met, after the person tried to submit |

- **Screen readers hear the state:** core gives each item's icon the alternative text "Met: " or "Not met: " (strings `--canon-text-rule-met` and `--canon-text-rule-not-met`, translated in `i18n/<lang>.css`). The theme draws the icon.
- **Who sets the states:** the app, or canon.js when a rule carries its check in `data-rule`:

  | `data-rule` | Met when the value has |
  |---|---|
  | `min-length:N` | at least N characters |
  | `digit` | a digit |
  | `lowercase` / `uppercase` | a lowercase / uppercase letter |
  | `symbol` | a character that is neither a letter, a digit nor a space |
  | `pattern:<regex>` | a match for the regular expression |

  canon.js marks rules met or pending as people type; while any is unmet, the input is invalid (`setCustomValidity`, "The password doesn't meet every rule."), so the form won't submit; a failed submit marks the unmet ones `error` until they are met.
- **Showing them while they matter** (optional): `data-reveal="focus"` on the rules. canon.js collapses them (`data-state="collapsed"`) until the input has focus or a value, and again once every rule is met; themes animate the rows in one by one. Collapsed rules are still read (through `aria-describedby`). Without canon.js they always show.
- Not a live region: announcing every keystroke is noise. The box lists the rules in `aria-describedby`, so they are read on focus.

### Confirmation (optional)

A second Password box whose input has `data-match="<id of the first input>"`. canon.js keeps it invalid while it differs ("The passwords don't match.") and gives its box `data-state="match"` when it matches; themes show that as success.

In a [Field](field.md), the strength (with its word at its end) and the rules go under the box and over the message, across the field. With an empty message, these problems (rules unmet, passwords differ, required and empty) show as the field's error message, not the browser's bubble.

## Accessibility

- The box is named by its label (in a Field) or `aria-label`; the strength and the rules describe it (`aria-describedby`).
- Show / hide is a toggle button (`aria-pressed`), never a checkbox labelled "Show".
- Don't block paste.

## Theme obligations

- The box: Text Input's.
- Strength: a fill per step that doesn't rely on color alone where the system allows (Canon: its length).
- Rules: pending, met and error distinct in icon and text, not by color alone.

## Not in the contract (yet)

| Thing | Where it goes |
|---|---|
| Scoring the password | App |
| Server-side rules (breached passwords, history) | App: set the rule's state yourself |

## Look

Box: Text Input's, the eye (Lucide `eye`) in the icon color. Strength: a 4px bar, zinc-200 (dark zinc-700), a quarter per step: red-500, yellow-500, lime-500, green-600 (dark: the 600s, green-700). Rules: title in the sm label's type; rows 8px apart, a 16px dot 4px before 12px text. Pending zinc-300 dot, zinc-600 text (dark zinc-600, zinc-400); met green-600 dot with a white check, zinc-900 text (dark white); error red-700 dot with a white "!", red-700 text (dark red-300). Strength and rules have one size. Also: the strength's word (12px medium, in the fill's color, dark the 400s); Caps Lock as Lucide `arrow-big-up-dash` before the buttons; a confirmation that matches in the success colors; revealed rules open to their height in 0.3s and fade in from 4px above, 50ms apart (none with reduced motion).
