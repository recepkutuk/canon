#!/usr/bin/env node
/*
 * Writes the docs site's files for search engines and AI tools, at the
 * project's root (the site's root):
 *
 *   llms.txt       what Canon is for, and a link to each document: the
 *                  markup rules, the decisions and every component's
 *                  specification, by group
 *   llms-full.txt  the same documents in one file
 *   sitemap.xml    every reference page, with when it last changed
 *
 * and gives every reference page a description for search results and
 * shared links (<meta name="description"> and og:description), from the
 * note under its title; a component's page also links its specification
 * as Markdown (<link rel="alternate" type="text/markdown">), for tools
 * that read the page.
 *   node tools/site.mjs
 *
 * The groups and their order come from docs/decisions.md's Components
 * section; each component's line, from the first paragraph of its
 * specification. Run it after adding a component or a page.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const site = "https://recepkutuk.github.io/canon/";
const { version } = JSON.parse(read("package.json"));

/* A specification's line: its first paragraph's first sentence, links
   as plain text. Specifications that start with their elements have none. */
const summary = (path) => {
  const lines = read(path).split("\n").slice(1);
  const paragraph = [];
  for (const line of lines) {
    if (!line.trim()) {
      if (paragraph.length) break;
      continue;
    }
    if (/^(#|```|\||Tier:|- )/.test(line)) {
      if (paragraph.length || line.startsWith("#")) break;
      continue;
    }
    paragraph.push(line.trim());
  }
  const text = paragraph.join(" ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "");
  return text.split(/(?<=\.)\s/)[0] || pageNote(path);
};
/* Else the reference page's note under its title, without its markup. */
const pageNote = (path) => {
  const name = path.endsWith(".html") ? path.split("/").pop() : `${path.split("/").pop().replace(/\.md$/, "")}.html`;
  let html;
  try {
    html = read(`reference/${name}`);
  } catch {
    return "";
  }
  const note = html.match(/<h1>[\s\S]*?<\/h1>\s*<p class="ref-note">([\s\S]*?)<\/p>/)?.[1] ?? "";
  const text = note.replace(/<code>([\s\S]*?)<\/code>/g, "`$1`").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  return text.split(/(?<=\.)\s/)[0].replace(/^Specification:.*/, "");
};

/* docs/decisions.md's Components section: "**Group:** [Name](components/x.md) T0 · …". */
const decisions = read("docs/decisions.md");
const section = decisions.slice(decisions.indexOf("## Components"), decisions.indexOf("\n## ", decisions.indexOf("## Components") + 1));
const groups = [];
for (const line of section.split("\n")) {
  const match = line.match(/^\*\*([^*]+?):?\*\*:?\s*(.*)$/);
  if (!match) continue;
  const [, name, rest] = match;
  if (/^Planned/.test(name)) continue;
  const items = [...rest.matchAll(/\[([^\]]+)\]\((components\/[^)]+\.md)\)/g)].map(([, title, path]) => ({ title: title[0].toUpperCase() + title.slice(1), path: `docs/${path}` }));
  /* Patterns are reference pages: "List → Detail → Edit (`reference/list-detail-edit.html`)". */
  const pages = [...rest.matchAll(/([^·(]+?)\s*\(`(reference\/[^`]+\.html)`\)/g)].map(([, title, path]) => ({ title: title.trim(), path }));
  const seen = new Set();
  const unique = [...items, ...pages].filter((item) => !seen.has(item.path) && seen.add(item.path));
  if (unique.length) groups.push({ name: name.replace(/:$/, ""), items: unique });
}

const intro = [
  "# Canon",
  "",
  "> Component library for internal tools (tables, forms, records) in accessible plain HTML. The markup is the contract: elements and attributes say what each thing is, a theme decides how it looks, and an optional script (canon.js) adds behavior. Two files from a CDN, no build step, no client framework.",
  "",
  "Use Canon for back-office screens, admin panels, dashboards and record pages whose HTML a server or framework writes: Django, Rails, Laravel or Go templates, htmx, or a React app that renders the same elements. It suits teams with a back end and no front-end team, several stacks that should share components, a brand or several to follow, and tools that must last years. 67 of its 68 components work without JavaScript.",
  "",
  "Canon is not a JavaScript component library (there is nothing to import or call), not an app framework (no routing, data loading or state) and not for marketing sites (no hero sections or pricing tables).",
  "",
  "```html",
  `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/canon-ui@${version}/css/canon/canon.css">`,
  `<script src="https://cdn.jsdelivr.net/npm/canon-ui@${version}/js/canon.js" defer></script>`,
  "```",
  "",
];

const llms = [
  ...intro,
  "## Start here",
  "",
  `- [Writing Canon markup](${site}docs/markup-rules.md): the rules every page follows, for people and AI assistants writing Canon's HTML`,
  `- [Decisions](${site}docs/decisions.md): what Canon is for, how its markup speaks, how its CSS and JavaScript are built`,
  `- [Getting started](${site}reference/getting-started.html): adding Canon to a page or an app`,
  `- [Themes](${site}reference/themes.html): one markup, several looks`,
  `- [Build](${site}reference/build.html): a canon.css and canon.js with only the components an app uses`,
  `- [With htmx](${site}reference/htmx.html): forms checked by the server, toasts it sends, dialogs and tables that load what they show`,
  `- [With Django](${site}reference/django.html): every form rendered as Canon's Fields, errors, messages as toasts, lists with pages`,
  `- [With Rails](${site}reference/rails.html): the asset pipeline and Turbo, a form builder for Canon's markup, errors, flash messages as toasts, lists with pages`,
  `- [With Laravel](${site}reference/laravel.html): Blade components for every form part, errors, flash messages as toasts, the paginator drawing Canon's Pagination`,
  "",
  ...groups.flatMap(({ name, items }) => [
    `## ${name}`,
    "",
    ...items.map(({ title, path }) => {
      const line = path.endsWith(".md") ? summary(path) : pageNote(path);
      return `- [${title}](${site}${path})${line ? `: ${line}` : ""}`;
    }),
    "",
  ]),
  "## Optional",
  "",
  `- [Everything in one file](${site}llms-full.txt): the markup rules, the decisions and every specification`,
  `- [Source](https://github.com/recepkutuk/canon): MIT licensed; npm package canon-ui`,
  "",
].join("\n");

const documents = [...new Set(["docs/markup-rules.md", "docs/decisions.md", ...groups.flatMap(({ items }) => items.map(({ path }) => path)).filter((path) => path.endsWith(".md"))])];
const full = [
  ...intro,
  `Every document below is also at ${site} under its path. Links between them are relative to docs/.`,
  "",
  ...documents.flatMap((path) => ["---", "", `Source: ${site}${path}`, "", read(path).trim(), ""]),
].join("\n");

/* The reference pages, each with its last commit's date. */
const pages = readdirSync(join(root, "reference")).filter((name) => name.endsWith(".html")).sort();
const changed = (path) => {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", path], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map((name) => {
    const date = changed(`reference/${name}`);
    return `  <url><loc>${site}reference/${name}</loc>${date ? `<lastmod>${date}</lastmod>` : ""}</url>`;
  }),
  "</urlset>",
  "",
].join("\n");

/* Each reference page's description: its note's first sentence, then
   what Canon is; the Introduction, what Canon is and who it's for. */
const about = "Canon: accessible plain-HTML components for admin screens and internal tools.";
const introDescription = "Canon is a component library for internal tools: tables, forms and records in accessible plain HTML, for the admin screens that Django, Rails, Laravel, Go or htmx already render. No build step.";
const attribute = (text) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
let described = 0;
for (const name of pages) {
  const path = `reference/${name}`;
  const html = read(path);
  const note = pageNote(path).replace(/`/g, "");
  const description = name === "introduction.html" ? introDescription : note ? `${note} ${about}` : about;
  const spec = `docs/components/${name.replace(/\.html$/, ".md")}`;
  const title = html.match(/<h1>([^<]*)<\/h1>/)?.[1] ?? "";
  const specLink = existsSync(join(root, spec)) ? `  <link rel="alternate" type="text/markdown" href="../${spec}" title="${attribute(title)} specification">\n` : "";
  const tags = `  <meta name="description" content="${attribute(description)}">\n  <meta property="og:description" content="${attribute(description)}">\n${specLink}`;
  const cleaned = html.replace(/^\s*<meta (name="description"|property="og:description")[^>]*>\n/gm, "").replace(/^\s*<link rel="alternate" type="text\/markdown"[^>]*>\n/gm, "");
  const updated = cleaned.replace(/(<title>[^<]*<\/title>\n)/, `$1${tags}`);
  if (updated === cleaned) continue;
  if (updated !== html) writeFileSync(join(root, path), updated);
  described++;
}

writeFileSync(join(root, "llms.txt"), llms);
writeFileSync(join(root, "llms-full.txt"), full);
writeFileSync(join(root, "sitemap.xml"), sitemap);
const count = groups.reduce((total, { items }) => total + items.length, 0);
console.log(`llms.txt: ${groups.length} groups, ${count} entries · llms-full.txt: ${documents.length} documents · sitemap.xml: ${pages.length} pages · descriptions: ${described} pages`);
