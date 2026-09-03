import type { AdfNode } from '../src/types.js';

export const doc = (...content: AdfNode[]): AdfNode => ({ type: 'doc', content });
export const p = (...content: AdfNode[]): AdfNode => ({ type: 'paragraph', content });
export const t = (text: string, marks: AdfNode['marks'] = undefined): AdfNode =>
  marks ? { type: 'text', text, marks } : { type: 'text', text };
export const h = (level: number, text: string): AdfNode => ({
  type: 'heading', attrs: { level }, content: [t(text)],
});
export const link = (text: string, href: string): AdfNode =>
  t(text, [{ type: 'link', attrs: { href } }]);
export const image = (attrs: Record<string, unknown> = {}): AdfNode => ({
  type: 'mediaSingle',
  attrs: { layout: 'center' },
  content: [{ type: 'media', attrs: { type: 'file', id: 'm1', collection: 'c', ...attrs } }],
});
export const table = (rows: AdfNode[][], headerFirstRow = false): AdfNode => ({
  type: 'table',
  content: rows.map((cells, r) => ({
    type: 'tableRow',
    content: cells.map((c) => ({
      type: headerFirstRow && r === 0 ? 'tableHeader' : 'tableCell',
      attrs: {},
      content: [c],
    })),
  })),
});
export const coloured = (text: string, colour: string, bg?: string): AdfNode =>
  t(text, [
    { type: 'textColor', attrs: { color: colour } },
    ...(bg ? [{ type: 'backgroundColor', attrs: { color: bg } }] : []),
  ]);
