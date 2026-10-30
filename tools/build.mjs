#!/usr/bin/env node
/*
 * Builds Canon's stylesheets and script from their sources (src/).
 *
 *   node tools/build.mjs                    every component: css/canon/canon.css,
 *                                           css/canon/canon.core.css, js/canon.js
 *   node tools/build.mjs --only data-table,select --out dist
 *                                           those components and what they
 *                                           need: dist/canon.css,
 *                                           dist/canon.core.css, dist/canon.js
 *   node tools/build.mjs --list             the bundles and the components, and
 *                                           what each one needs (--only takes both)
 *
 * src/css/core/<module>.css, src/css/theme/<module>.css and
 * src/js/<module>.js hold each module's code; a module whose code sits in
 * more than one place has its parts separated by a "@canon-part" comment.
 * src/css/order.json and src/js/order.json list every part in order (the
 * cascade's; the script's, all in one closure). src/manifest.json names
 * the modules and what each one needs. The rules are tools/bundle.mjs,
 * which the reference's Build page uses too.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveModules, assemble, ALWAYS } from "./bundle.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

const args = process.argv.slice(2);
const option = (name) => {
  const at = args.indexOf(`--${name}`);
  return at === -1 ? null : args[at + 1];
};
const only = option("only");
const out = option("out");

const manifest = JSON.parse(read("src/manifest.json"));
const orders = { css: JSON.parse(read("src/css/order.json")), js: JSON.parse(read("src/js/order.json")) };

if (args.includes("--list")) {
  console.log("Bundles (the Build page's choices)");
  for (const bundle of manifest.bundles) {
    console.log(`  ${bundle.id.padEnd(17)}${bundle.title}: ${bundle.modules.join(", ")}`);
  }
  console.log("\nComponents, one at a time");
  for (const group of manifest.groups) {
    console.log(`\n${group}`);
    for (const [name, module] of Object.entries(manifest.modules)) {
      if (module.internal || module.group !== group) continue;
      const needs = (module.needs ?? []).filter((need) => !manifest.modules[need]?.internal);
      console.log(`  ${name.padEnd(17)}${module.title}${needs.length ? `  (needs ${needs.join(", ")})` : ""}`);
    }
  }
  process.exit(0);
}

const asked = only ? only.split(",").map((each) => each.trim()).filter(Boolean) : null;
const { wanted, unknown } = resolveModules(manifest, asked);
if (unknown.length) {
  console.error(`Unknown component: ${unknown.join(", ")}. See: node tools/build.mjs --list`);
  process.exit(1);
}
const files = assemble(orders, wanted, read);

/* The full build goes where pages link it; a smaller one to --out (dist),
   taken from where the command runs. */
const places = out
  ? { styles: resolve(process.cwd(), out), script: resolve(process.cwd(), out) }
  : only ? { styles: resolve(process.cwd(), "dist"), script: resolve(process.cwd(), "dist") } : { styles: join(root, "css", "canon"), script: join(root, "js") };
for (const place of new Set(Object.values(places))) mkdirSync(place, { recursive: true });
writeFileSync(join(places.styles, "canon.css"), files["canon.css"]);
writeFileSync(join(places.styles, "canon.core.css"), files["canon.core.css"]);
writeFileSync(join(places.script, "canon.js"), files["canon.js"]);
const names = [...wanted].filter((name) => !ALWAYS.includes(name));
const shown = (place) => {
  const near = relative(process.cwd(), place);
  return near.startsWith("..") ? place : near || ".";
};
console.log(`${places.styles === places.script ? shown(places.styles) : `${shown(places.styles)}, ${shown(places.script)}`}: ${only ? names.join(", ") : "every component"}`);
