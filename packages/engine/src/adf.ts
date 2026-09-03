import type { AdfNode, AdfMark } from './types.js';

/** Depth-first walk yielding every node with its index path from the root. */
export function* walk(node: AdfNode, path: number[] = []): Generator<{ node: AdfNode; path: number[] }> {
  yield { node, path };
  const kids = node.content ?? [];
  for (let i = 0; i < kids.length; i++) {
    const child = kids[i];
    if (child) yield* walk(child, [...path, i]);
  }
}

/** All nodes of the given type, with paths. */
export function findAll(root: AdfNode, type: string | ((n: AdfNode) => boolean)): Array<{ node: AdfNode; path: number[] }> {
  const match = typeof type === 'string' ? (n: AdfNode) => n.type === type : type;
  const out: Array<{ node: AdfNode; path: number[] }> = [];
  for (const hit of walk(root)) if (match(hit.node)) out.push(hit);
  return out;
}

/** Concatenated visible text of a node and its descendants. */
export function textOf(node: AdfNode): string {
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'hardBreak') return ' ';
  if (node.type === 'emoji') return String((node.attrs?.shortName as string) ?? '');
  if (node.type === 'mention') return String((node.attrs?.text as string) ?? '');
  if (node.type === 'date') return '';
  if (node.type === 'status') return String((node.attrs?.text as string) ?? '');
  let s = '';
  for (const c of node.content ?? []) s += textOf(c);
  return s;
}

export function trimmedText(node: AdfNode): string {
  return textOf(node).replace(/\s+/g, ' ').trim();
}

export function mark(node: AdfNode, type: string): AdfMark | undefined {
  return node.marks?.find((m) => m.type === type);
}

export function hasMark(node: AdfNode, type: string): boolean {
  return Boolean(mark(node, type));
}

/** Node at the given path, or undefined. */
export function nodeAt(root: AdfNode, path: number[]): AdfNode | undefined {
  let cur: AdfNode | undefined = root;
  for (const i of path) {
    cur = cur?.content?.[i];
    if (!cur) return undefined;
  }
  return cur;
}

/** Parent path of a node path. */
export function parentPath(path: number[]): number[] {
  return path.slice(0, -1);
}

export function truncate(s: string, n = 90): string {
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length <= n ? clean : clean.slice(0, n - 1) + '…';
}

/** Words in the whole document, for readability-style rules and stats. */
export function wordCount(root: AdfNode): number {
  const t = textOf(root).trim();
  return t ? t.split(/\s+/).length : 0;
}

const BLOCK_TYPES = new Set([
  'paragraph', 'heading', 'bulletList', 'orderedList', 'listItem', 'table', 'tableRow',
  'tableHeader', 'tableCell', 'blockquote', 'codeBlock', 'panel', 'rule', 'mediaSingle',
  'mediaGroup', 'expand', 'nestedExpand', 'layoutSection', 'layoutColumn', 'taskList',
  'decisionList', 'bodiedExtension', 'extension', 'blockCard', 'embedCard',
]);

export function isBlock(node: AdfNode): boolean {
  return BLOCK_TYPES.has(node.type);
}
