#!/usr/bin/env node
/*
 * The canon-ui command: builds Canon with the components an app uses, into
 * the app. The build itself is tools/build.mjs.
 *
 *   npx canon-ui build                      every component, into canon/
 *   npx canon-ui build --only core,data --out public/canon
 *                                           those bundles or components and
 *                                           what they need, into public/canon/
 *   npx canon-ui build --list               the bundles and the components
 */
const usage = `Usage: canon-ui build [--only <names>] [--out <folder>]
       canon-ui build --list

  --only <names>   Bundles or components, separated by commas, and what they
                   need. Without it, every component.
  --out <folder>   Where to write canon.css, canon.core.css and canon.js.
                   Without it, canon/ in the current folder.
  --list           The bundles and the components.`;

const [command, ...args] = process.argv.slice(2);
if (command === "--help" || command === "-h" || args.includes("--help") || args.includes("-h")) {
  console.log(usage);
  process.exit(0);
}
const fail = (message) => {
  console.error(`${message}\n\n${usage}`);
  process.exit(1);
};
if (command !== "build") fail(command ? `Unknown command: ${command}` : "No command given.");

const known = new Set(["--only", "--out"]);
for (let at = 0; at < args.length; at += 1) {
  if (args[at] === "--list") continue;
  if (!known.has(args[at])) fail(`Unknown option: ${args[at]}`);
  at += 1;
  if (args[at] === undefined || args[at].startsWith("--")) fail(`${args[at - 1]} needs a value.`);
}

/* Always a folder of the app's: without --out, tools/build.mjs writes into
   Canon's own files. */
process.argv = [process.argv[0], process.argv[1], ...args, ...(args.includes("--out") ? [] : ["--out", "canon"])];
await import("./build.mjs");
