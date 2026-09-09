/**
 * Verifies the stylesheet's own colour contrast, in both themes, and that every
 * custom property it uses is actually defined.
 *
 * Written after two failures found on the live site on 2026-09-08: the primary
 * button rendered white on the dark-mode accent at 2.21:1, and the launch-notice
 * block used --line, --brand and --tint, none of which exist, so it stayed light in
 * dark mode at 1.13:1. Neither was visible in light mode, which is where all the
 * looking had been done.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'assets', 'style.css'), 'utf8');

const grab = (s) => Object.fromEntries([...s.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
const darkAt = css.indexOf('@media (prefers-color-scheme: dark)');
const light = grab(css.slice(css.indexOf(':root {'), darkAt));
const dark = grab(css.slice(darkAt, css.indexOf('* { box-sizing', darkAt)));

function contrast(h1, h2) {
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lum = (c) => {
    const s = c.map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  };
  const [a, b] = [lum(rgb(h1)), lum(rgb(h2))];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Foreground/background pairs the site actually renders. */
const PAIRS = [
  ['body text on the page', '--ink', '--bg'],
  ['text on a surface', '--ink', '--surface'],
  ['subtle text on a surface', '--ink-soft', '--surface'],
  ['subtle text on the page', '--ink-soft', '--bg'],
  ['primary button label', '--on-accent', '--accent'],
  ['link on the page', '--accent', '--bg'],
];

const MIN = 4.5;
const failures = [];

for (const [name, fg, bg] of PAIRS) {
  for (const [theme, t] of [['light', light], ['dark', dark]]) {
    const f = t[fg] ?? light[fg];
    const b = t[bg] ?? light[bg];
    if (!f || !b) { failures.push(`${name} (${theme}): token missing`); continue; }
    const r = contrast(f, b);
    if (r < MIN) failures.push(`${name} (${theme}): ${r.toFixed(2)}:1, needs ${MIN}:1`);
  }
}

const defined = new Set([...css.matchAll(/^\s*(--[\w-]+):/gm)].map((m) => m[1]));
const undefinedUsed = [...new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))].filter((t) => !defined.has(t));
for (const t of undefinedUsed) failures.push(`var(${t}) is used but never defined`);

if (failures.length) {
  console.log('CONTRAST CHECK FAILED');
  for (const f of failures) console.log(`  ${f}`);
  process.exit(1);
}
console.log(`contrast: ${PAIRS.length} pairs x 2 themes pass at ${MIN}:1, no undefined tokens`);
