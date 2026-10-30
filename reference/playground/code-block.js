/*
 * Code Block playground: code in a frame, with a title and a copy button.
 * The samples are highlighted ahead of time (twinkleplop), as a page would
 * ship them. Spec: docs/components/code-block.md
 */

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const samples = {
  "json": {
    "title": "invoice.paid.json",
    "code": "<span class=\"tok punctuation\">{</span>\n  <span class=\"tok string\">&quot;id&quot;</span><span class=\"tok punctuation\">:</span> <span class=\"tok string\">&quot;evt_1Q2w3E&quot;</span><span class=\"tok punctuation\">,</span>\n  <span class=\"tok string\">&quot;type&quot;</span><span class=\"tok punctuation\">:</span> <span class=\"tok string\">&quot;invoice.paid&quot;</span><span class=\"tok punctuation\">,</span>\n  <span class=\"tok string\">&quot;created&quot;</span><span class=\"tok punctuation\">:</span> <span class=\"tok string\">&quot;2026-10-16T09:24:11Z&quot;</span><span class=\"tok punctuation\">,</span>\n  <span class=\"tok string\">&quot;data&quot;</span><span class=\"tok punctuation\">:</span> <span class=\"tok punctuation\">{</span>\n    <span class=\"tok string\">&quot;invoice&quot;</span><span class=\"tok punctuation\">:</span> <span class=\"tok string\">&quot;INV-2041&quot;</span><span class=\"tok punctuation\">,</span>\n    <span class=\"tok string\">&quot;amount&quot;</span><span class=\"tok punctuation\">:</span> <span class=\"tok number\">129000</span><span class=\"tok punctuation\">,</span>\n    <span class=\"tok string\">&quot;currency&quot;</span><span class=\"tok punctuation\">:</span> <span class=\"tok string\">&quot;EUR&quot;</span><span class=\"tok punctuation\">,</span>\n    <span class=\"tok string\">&quot;paid&quot;</span><span class=\"tok punctuation\">:</span> <span class=\"tok boolean\">true</span><span class=\"tok punctuation\">,</span>\n    <span class=\"tok string\">&quot;coupon&quot;</span><span class=\"tok punctuation\">:</span> <span class=\"tok keyword\">null</span>\n  <span class=\"tok punctuation\">}</span>\n<span class=\"tok punctuation\">}</span>"
  },
  "bash": {
    "title": "Request",
    "code": "curl https://api.example.com/v1/invoices/INV-2041 \\\n  -H <span class=\"tok string\">&quot;Authorization: Bearer </span><span class=\"tok variable\">$API_TOKEN</span><span class=\"tok string\">&quot;</span>"
  },
  "yaml": {
    "title": "deploy.yaml",
    "code": "<span class=\"tok comment\"># Billing worker, production\n</span><span class=\"tok property\">service</span><span class=\"tok punctuation\">:</span> billing-worker\n<span class=\"tok property\">image</span><span class=\"tok punctuation\">:</span> registry.example.com/billing-worker:2.14.0\n<span class=\"tok property\">replicas</span><span class=\"tok punctuation\">:</span> <span class=\"tok number\">3</span>\n<span class=\"tok property\">resources</span><span class=\"tok punctuation\">:</span>\n  <span class=\"tok property\">cpu</span><span class=\"tok punctuation\">:</span> 500m\n  <span class=\"tok property\">memory</span><span class=\"tok punctuation\">:</span> 512Mi\n<span class=\"tok property\">env</span><span class=\"tok punctuation\">:</span>\n  <span class=\"tok punctuation\">-</span> <span class=\"tok property\">name</span><span class=\"tok punctuation\">:</span> QUEUE_URL\n    <span class=\"tok property\">value</span><span class=\"tok punctuation\">:</span> amqps://queue.internal:5671/billing\n  <span class=\"tok punctuation\">-</span> <span class=\"tok property\">name</span><span class=\"tok punctuation\">:</span> RETRY_LIMIT\n    <span class=\"tok property\">value</span><span class=\"tok punctuation\">:</span> <span class=\"tok string\">&quot;5&quot;</span>\n  <span class=\"tok punctuation\">-</span> <span class=\"tok property\">name</span><span class=\"tok punctuation\">:</span> LOG_LEVEL\n    <span class=\"tok property\">value</span><span class=\"tok punctuation\">:</span> info\n<span class=\"tok property\">healthcheck</span><span class=\"tok punctuation\">:</span>\n  <span class=\"tok property\">path</span><span class=\"tok punctuation\">:</span> /healthz\n  <span class=\"tok property\">interval</span><span class=\"tok punctuation\">:</span> 10s\n  <span class=\"tok property\">timeout</span><span class=\"tok punctuation\">:</span> 2s\n<span class=\"tok property\">schedule</span><span class=\"tok punctuation\">:</span>\n  <span class=\"tok punctuation\">-</span> <span class=\"tok property\">cron</span><span class=\"tok punctuation\">:</span> <span class=\"tok string\">&quot;0 3 * * *&quot;</span>\n    <span class=\"tok property\">task</span><span class=\"tok punctuation\">:</span> reconcile-payouts\n  <span class=\"tok punctuation\">-</span> <span class=\"tok property\">cron</span><span class=\"tok punctuation\">:</span> <span class=\"tok string\">&quot;*/15 * * * *&quot;</span>\n    <span class=\"tok property\">task</span><span class=\"tok punctuation\">:</span> retry-failed-charges"
  },
  "log": {
    "title": "billing-worker.log",
    "code": "2026-10-16 09:24:11.482 INFO  [billing-worker-3] invoice.paid INV-2041 amount=1290.00 EUR customer=cus_8XkP2 attempt=1 latency_ms=184 trace=4bf92f3577b34da6a3ce929d0e0e4736\n2026-10-16 09:24:12.007 WARN  [billing-worker-1] charge.retry INV-2038 reason=card_declined decline_code=insufficient_funds attempt=3 next_retry=2026-10-16T09:39:12Z\n2026-10-16 09:24:12.311 INFO  [billing-worker-3] payout.created po_3Ld81 amount=48210.55 EUR destination=acct_1Mx0 arrival=2026-10-18"
  },
  "html": {
    "title": "Embed code",
    "code": "<span class=\"tok punctuation\">&lt;</span><span class=\"tok tag_name\">script</span> <span class=\"tok attr_name\">src</span><span class=\"tok operator\">=</span><span class=\"tok string\">&quot;https://cdn.example.com/widget.js&quot;</span> <span class=\"tok attr_name\">defer</span><span class=\"tok punctuation\">&gt;</span><span class=\"tok punctuation\">&lt;/</span><span class=\"tok tag_name\">script</span><span class=\"tok punctuation\">&gt;</span>\n<span class=\"tok punctuation\">&lt;</span><span class=\"tok tag_name\">div</span> <span class=\"tok attr_name\">class</span><span class=\"tok operator\">=</span><span class=\"tok string\">&quot;support-widget&quot;</span> <span class=\"tok attr_name\">data-team</span><span class=\"tok operator\">=</span><span class=\"tok string\">&quot;billing&quot;</span><span class=\"tok punctuation\">&gt;</span><span class=\"tok punctuation\">&lt;/</span><span class=\"tok tag_name\">div</span><span class=\"tok punctuation\">&gt;</span>"
  }
};

export const controls = [
  { group: "Code Block", name: "sample", label: "Code", type: "select", options: [["json", "JSON (highlighted)"], ["bash", "Shell command (highlighted)"], ["yaml", "YAML, long (highlighted)"], ["html", "HTML (highlighted)"], ["log", "Log lines (plain)"]], default: "log" },
  { group: "Code Block", name: "header", label: "A header", type: "checkbox", default: true },
  { group: "Code Block", name: "title", label: "Title (empty: the sample's)", type: "text", default: "", when: (s) => s.header },
  { group: "Code Block", name: "copy", label: "A copy button", type: "checkbox", default: true },
  { group: "Code Block", name: "wrap", label: "A wrap button", type: "checkbox", default: true, when: (s) => s.header },
  { group: "Code Block", name: "wrapped", label: "Starts wrapped (aria-pressed)", type: "checkbox", default: false, when: (s) => s.header && s.wrap },
  { group: "Code Block", name: "height", label: "--canon-code-block-max-height", type: "select", options: [["", "(none)"], ["12rem", "12rem"], ["20rem", "20rem"]], default: "" },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const sample = samples[s.sample] ?? samples.json;
  const title = s.title.trim() || sample.title;
  const attrs = [`class="canon-code-block"`];
  if (s.size) attrs.push(`data-size="${s.size}"`);
  if (s.dir === "rtl") attrs.push(`dir="rtl"`);
  if (s.height) attrs.push(`style="--canon-code-block-max-height: ${s.height}"`);
  const copy = `<button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon" data-size="sm" commandfor="pg-code" command="--canon-copy"><span class="canon-icon" data-icon="copy" aria-hidden="true"></span><span class="canon-button-label">Copy ${escape(s.header ? title : "code")}</span></button>`;
  const lines = [`<div ${attrs.join(" ")}>`];
  if (s.header) {
    lines.push(`  <div class="canon-code-block-header">`, `    <span class="canon-code-block-title">${escape(title)}</span>`);
    if (s.wrap) lines.push(`    <button type="button" class="canon-button" data-emphasis="minimal" data-intent="neutral" data-display="icon" data-size="sm" commandfor="pg-code" command="--canon-wrap" aria-pressed="${s.wrapped}"><span class="canon-icon" data-icon="text-wrap" aria-hidden="true"></span><span class="canon-button-label">Wrap lines</span></button>`);
    if (s.copy) lines.push(`    ${copy}`);
    lines.push(`  </div>`);
  }
  lines.push(`  <pre><code id="pg-code">${sample.code}</code></pre>`);
  if (s.copy && !s.header) lines.push(`  ${copy}`);
  lines.push(`</div>`);
  return lines.join("\n");
}
