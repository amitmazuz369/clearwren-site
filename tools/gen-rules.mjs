/** Emits the rule catalogue as JSON + an HTML table, so the site and the
 *  marketplace listing never drift from what the engine actually checks. */
import { ALL_RULES } from '../packages/engine/dist/src/index.js';
import { writeFileSync } from 'node:fs';

const order = { critical: 0, serious: 1, moderate: 2, advisory: 3 };
const rules = [...ALL_RULES].sort(
  (a, b) => order[a.severity] - order[b.severity] || a.id.localeCompare(b.id),
);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const rows = rules.map((r) => `      <tr>
        <td><strong>${esc(r.title)}</strong><br><span class="muted">${esc(r.why)}</span></td>
        <td><span class="sev sev-${r.severity}">${r.severity}</span></td>
        <td>${r.wcag.map((w) => `${esc(w.criterion)}&nbsp;${w.level}`).join('<br>')}</td>
        <td>${r.confidence === 'review' ? 'Flagged for review' : 'Decided automatically'}</td>
      </tr>`).join('\n');

const table = `<table class="rules">
  <thead><tr><th>Check</th><th>Severity</th><th>WCAG 2.2</th><th>Result</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>`;

writeFileSync(new URL('../site/assets/rules.html', import.meta.url), table);
writeFileSync(
  new URL('../site/assets/rules.json', import.meta.url),
  JSON.stringify(rules.map(({ id, title, why, howToFix, wcag, severity, confidence }) => ({ id, title, why, howToFix, wcag, severity, confidence })), null, 2),
);
const criteria = new Set(rules.flatMap((r) => r.wcag.map((w) => `${w.criterion} ${w.name} (${w.level})`)));
console.log(`${rules.length} rules covering ${criteria.size} WCAG success criteria`);
console.log([...criteria].sort().join('\n'));
