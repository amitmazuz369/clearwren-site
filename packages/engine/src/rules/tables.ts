import type { Rule, Issue, AdfNode } from '../types.js';
import { findAll, trimmedText, truncate } from '../adf.js';

const INFO_REL: { criterion: string; name: string; level: 'A' } = {
  criterion: '1.3.1', name: 'Info and Relationships', level: 'A',
};

function rowsOf(table: AdfNode): AdfNode[] {
  return (table.content ?? []).filter((n) => n.type === 'tableRow');
}
function cellsOf(row: AdfNode): AdfNode[] {
  return (row.content ?? []).filter((n) => n.type === 'tableHeader' || n.type === 'tableCell');
}

export const tableNoHeader: Rule = {
  id: 'table-no-header',
  title: 'Table has no header row',
  why: 'Without header cells a screen reader reads a wall of values with no way to tell which column each one belongs to.',
  howToFix: 'Select the first row and turn on "Header row" in the table toolbar.',
  wcag: [INFO_REL],
  section508: ['502.3.1'],
  severity: 'serious',
  confidence: 'certain',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    for (const { node, path } of findAll(ctx.doc, 'table')) {
      const rows = rowsOf(node);
      if (rows.length === 0) continue;
      const hasHeader = rows.some((r) => cellsOf(r).some((c) => c.type === 'tableHeader'));
      if (hasHeader) continue;
      const firstRow = rows[0];
      out.push({
        ruleId: 'table-no-header',
        severity: 'serious',
        confidence: 'certain',
        path,
        location: 'Table',
        evidence: firstRow ? truncate(trimmedText(firstRow), 70) : undefined,
        data: { rows: rows.length },
      });
    }
    return out;
  },
};

export const tableEmptyHeader: Rule = {
  id: 'table-empty-header',
  title: 'Header cell is empty',
  why: 'An empty header leaves every cell in that column without a label when it is read out.',
  howToFix: 'Give the header cell a short label, even for a column of icons or actions.',
  wcag: [INFO_REL],
  severity: 'moderate',
  confidence: 'certain',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    for (const { node, path } of findAll(ctx.doc, 'tableHeader')) {
      if (trimmedText(node)) continue;
      // A blank top-left corner cell is a normal pattern in row-header tables.
      const isCorner = path.length >= 2 && path[path.length - 1] === 0 && path[path.length - 2] === 0;
      if (isCorner) continue;
      out.push({ ruleId: 'table-empty-header', severity: 'moderate', confidence: 'certain', path, location: 'Table header cell' });
    }
    return out;
  },
};

export const tableMergedCells: Rule = {
  id: 'table-merged-cells',
  title: 'Table uses merged cells',
  why: 'Merged cells break the grid a screen reader uses to pair each value with its header, so the reading order can come out scrambled.',
  howToFix: 'Split the merged cells, or split the table into simple tables with one header row each.',
  wcag: [INFO_REL],
  severity: 'moderate',
  confidence: 'review',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    for (const { node, path } of findAll(ctx.doc, 'table')) {
      let merged = 0;
      for (const row of rowsOf(node)) {
        for (const cell of cellsOf(row)) {
          const cs = Number(cell.attrs?.['colspan'] ?? 1);
          const rs = Number(cell.attrs?.['rowspan'] ?? 1);
          if (cs > 1 || rs > 1) merged++;
        }
      }
      if (merged > 0) {
        out.push({ ruleId: 'table-merged-cells', severity: 'moderate', confidence: 'review', path, location: 'Table', data: { mergedCells: merged } });
      }
    }
    return out;
  },
};

export const tableLayout: Rule = {
  id: 'table-layout',
  title: 'Table appears to be used for layout',
  why: 'A table announces rows and columns that carry no meaning here, which slows a screen-reader user down for no benefit.',
  howToFix: 'Use a page layout with columns instead of a table, or add a header row if the table really is data.',
  wcag: [INFO_REL],
  severity: 'advisory',
  confidence: 'review',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    for (const { node, path } of findAll(ctx.doc, 'table')) {
      const rows = rowsOf(node);
      if (rows.length === 0) continue;
      const hasHeader = rows.some((r) => cellsOf(r).some((c) => c.type === 'tableHeader'));
      const cellsPerRow = rows.map((r) => cellsOf(r).length);
      const singleColumn = cellsPerRow.every((c) => c === 1);
      const singleRow = rows.length === 1;
      const blocky = findAll(node, (n) => n.type === 'mediaSingle' || n.type === 'panel' || n.type === 'heading').length > 0;
      if (!hasHeader && (singleColumn || singleRow || blocky)) {
        out.push({ ruleId: 'table-layout', severity: 'advisory', confidence: 'review', path, location: 'Table', data: { rows: rows.length, singleColumn, singleRow } });
      }
    }
    return out;
  },
};

// tableNested was removed: the Atlassian Document Format does not permit a table
// inside a table cell, so Confluence strips one on save and the check could never
// fire on Cloud content.
export const tableRules: Rule[] = [tableNoHeader, tableEmptyHeader, tableMergedCells, tableLayout];
