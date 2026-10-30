/*
 * Top Bar playground: the bar over an app's pages.
 * Spec: docs/components/top-bar.md
 */

import { topBar, palette } from "./_shell.js";

export const controls = [
  { group: "Top Bar", name: "start", label: "At the start", type: "select", options: [["", "(nothing)"], ["search", "Search (a Command Palette's button)"]], default: "search" },
  { group: "Top Bar", name: "help", label: "A help menu", type: "checkbox", default: true },
  { group: "Top Bar", name: "theme", label: "A dark mode toggle", type: "checkbox", default: true },
  { group: "Top Bar", name: "notifications", label: "Notifications", type: "checkbox", default: true },
  { group: "Top Bar", name: "count", label: "Unread (empty: no Count)", type: "text", default: "3", when: (s) => s.notifications },
  { group: "Top Bar", name: "account", label: "The account (Avatar and Menu)", type: "checkbox", default: true },

  { group: "Hints", name: "size", label: "data-size", type: "select", options: [["", "(theme decides)"], "sm", "md", "lg"], default: "" },

  { group: "Preview", name: "dir", label: "Direction", type: "select", options: [["ltr", "Left to right"], ["rtl", "Right to left"]], default: "ltr" },
];

export function render(s) {
  const bar = topBar({ start: s.start, help: s.help, theme: s.theme, notifications: s.notifications, count: s.count.trim(), account: s.account, size: s.size });
  return s.start === "search" ? `${bar}\n${palette()}` : bar;
}
