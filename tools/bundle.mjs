/*
 * Canon's build rules, shared by tools/build.mjs (Node) and the
 * reference's Build page (the browser), so both build the same thing.
 *
 * A build is a set of modules: the ones asked for, what they need
 * (src/manifest.json), and base and init, always. Their parts are put
 * together in the order src/css/order.json and src/js/order.json give, so
 * a smaller build behaves exactly as the full one.
 */

export const ALWAYS = ["base", "init"];
const CSS_MARKER = "\n/* @canon-part */\n";
const JS_MARKER = "\n  /* @canon-part */\n";

/* Where each module's code is, from Canon's root. */
export const sourceOf = {
  core: (module) => `src/css/core/${module}.css`,
  theme: (module) => `src/css/theme/${module}.css`,
  script: (module) => `src/js/${module}.js`,
};

/* The modules a build needs: everything (asked is null), or what was
   asked for (modules, their aliases, or bundles: src/manifest.json's
   groups of modules as apps use them) and what those need. neededBy
   says, for each module brought in, which modules asked for it. */
export const resolveModules = (manifest, asked) => {
  const modules = manifest.modules;
  const aliases = new Map(Object.entries(modules).flatMap(([name, module]) => (module.aliases ?? []).map((alias) => [alias, name])));
  const bundles = new Map((manifest.bundles ?? []).map((bundle) => [bundle.id, bundle]));
  const wanted = new Set(ALWAYS);
  const neededBy = new Map();
  const unknown = [];
  const visit = (requested, by) => {
    const name = aliases.get(requested) ?? requested;
    if (!modules[name] && bundles.has(name)) {
      for (const module of bundles.get(name).modules) visit(module, by);
      return;
    }
    if (!modules[name]) {
      unknown.push(requested);
      return;
    }
    if (by) {
      if (!neededBy.has(name)) neededBy.set(name, new Set());
      neededBy.get(name).add(by);
    }
    if (wanted.has(name)) return;
    wanted.add(name);
    for (const need of modules[name].needs ?? []) visit(need, name);
  };
  if (asked === null) for (const name of Object.keys(modules)) wanted.add(name);
  else for (const name of asked) visit(name, null);
  return { wanted, neededBy, unknown };
};

/* Every source file a build reads. */
export const sourcesFor = (orders, wanted) => {
  const paths = new Set();
  for (const each of orders.css) if (wanted.has(each.module)) paths.add(sourceOf[each.side](each.module));
  for (const each of orders.js) if (wanted.has(each.module)) paths.add(sourceOf.script(each.module));
  return [...paths];
};

/* The three files, from read(path) (the source's text). */
export const assemble = (orders, wanted, read) => {
  const split = new Map();
  const partOf = (path, marker, part) => {
    if (!split.has(path)) split.set(path, read(path).split(marker));
    return split.get(path)[part].replace(/\n*$/, "\n");
  };
  const styles = (side) => orders.css
    .filter((each) => each.side === side && wanted.has(each.module))
    .map((each) => partOf(sourceOf[side](each.module), CSS_MARKER, each.part))
    .join("\n");
  return {
    "canon.css": styles("theme"),
    "canon.core.css": styles("core"),
    "canon.js": orders.js
      .filter((each) => wanted.has(each.module))
      .map((each) => partOf(sourceOf.script(each.module), JS_MARKER, each.part))
      .join("\n"),
  };
};
