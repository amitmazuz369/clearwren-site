import { audit, ALL_RULES } from '../packages/engine/dist/src/index.js';
import { htmlToAdf } from './html-to-adf.mjs';

const rules = Object.fromEntries(ALL_RULES.map((r) => [r.id, r]));

export function check(html, title) {
  const adf = htmlToAdf(html);
  const result = audit(adf, { meta: { title: title ?? '' } });
  return { result, rules, adf };
}
export { rules, ALL_RULES };
