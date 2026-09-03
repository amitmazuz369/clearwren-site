import type { Rule, Issue, AdfNode } from '../types.js';
import { findAll, truncate, trimmedText, nodeAt, parentPath } from '../adf.js';

const NON_TEXT: { criterion: string; name: string; level: 'A' } = {
  criterion: '1.1.1', name: 'Non-text Content', level: 'A',
};

/** Alt values that carry no information for a screen-reader user. */
const MEANINGLESS_ALT = [
  /^\s*$/,
  /^(image|images|img|picture|photo|photos|graphic|graphics|icon|logo|screenshot|screen ?shot|diagram|figure|fig)\s*\d*\s*$/i,
  /^(untitled|unnamed|no ?name|placeholder|temp|test|asdf|xxx)\b/i,
  /^screen ?shot[\s_-]*\d{4}/i,
  /^(image|img|photo|pasted image|download|unknown)[\s_-]*\d+$/i,
  /\.(png|jpe?g|gif|svg|webp|bmp|tiff?|heic|pdf)\s*$/i,
  /^[a-f0-9-]{16,}$/i,
];

// "Screenshot of ..." is deliberately not listed: unlike "image of", it tells the
// listener the content is a captured interface, which is information they need.
const REDUNDANT_PREFIX = /^\s*(an?\s+)?(image|picture|photo|graphic|icon)\s+(of|showing|depicting|that shows)\b/i;

function altOf(node: AdfNode): string | undefined {
  const a = node.attrs?.['alt'];
  return typeof a === 'string' ? a : undefined;
}

function mediaId(node: AdfNode): string {
  const id = node.attrs?.['id'] ?? node.attrs?.['url'] ?? '';
  return String(id);
}

function isImage(node: AdfNode): boolean {
  if (node.type !== 'media' && node.type !== 'mediaInline') return false;
  const t = String(node.attrs?.['type'] ?? 'file');
  // 'link' media are attachment links rather than rendered images.
  return t !== 'link';
}

/** A caption sibling inside mediaSingle counts as a visible text alternative. */
function captionText(root: AdfNode, path: number[]): string {
  const parent = nodeAt(root, parentPath(path));
  if (!parent) return '';
  const caption = (parent.content ?? []).find((c) => c.type === 'caption');
  return caption ? trimmedText(caption) : '';
}

export const imgAltMissing: Rule = {
  id: 'img-alt-missing',
  title: 'Image has no alternative text',
  why: 'Screen-reader users get nothing but the word "image" where this picture is, so any information it carries is lost.',
  howToFix: 'Select the image, open the image toolbar and add alt text that conveys the same information as the picture. If it is purely decorative, mark it as decorative so it is skipped.',
  wcag: [NON_TEXT],
  section508: ['502.3.1'],
  severity: 'critical',
  confidence: 'certain',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    for (const { node, path } of findAll(ctx.doc, isImage)) {
      const alt = altOf(node);
      const id = mediaId(node);
      if (ctx.decorativeMediaIds.has(id)) continue;
      if (alt && alt.trim()) continue;
      if (captionText(ctx.doc, path)) continue;
      out.push({
        ruleId: 'img-alt-missing',
        severity: 'critical',
        confidence: 'certain',
        path,
        location: 'Image',
        evidence: id ? `media ${truncate(id, 40)}` : undefined,
        data: { mediaId: id },
      });
    }
    return out;
  },
};

export const imgAltMeaningless: Rule = {
  id: 'img-alt-meaningless',
  title: 'Alternative text does not describe the image',
  why: 'Alt text like "image1.png" or "screenshot" tells a screen-reader user nothing about what the image shows.',
  howToFix: 'Replace the alt text with a sentence describing the information the image conveys in this context.',
  wcag: [NON_TEXT],
  section508: ['502.3.1'],
  severity: 'serious',
  confidence: 'certain',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    for (const { node, path } of findAll(ctx.doc, isImage)) {
      const alt = (altOf(node) ?? '').trim();
      if (!alt) continue;
      if (ctx.decorativeMediaIds.has(mediaId(node))) continue;
      if (!MEANINGLESS_ALT.some((rx) => rx.test(alt))) continue;
      out.push({
        ruleId: 'img-alt-meaningless',
        severity: 'serious',
        confidence: 'certain',
        path,
        location: 'Image',
        evidence: truncate(alt, 60),
        data: { alt },
      });
    }
    return out;
  },
};

export const imgAltRedundant: Rule = {
  id: 'img-alt-redundant',
  title: 'Alternative text starts with "image of"',
  why: 'Screen readers already announce that the element is an image, so the prefix is read out twice.',
  howToFix: 'Drop the leading "image of" / "picture of" and start with what the image actually shows.',
  wcag: [NON_TEXT],
  severity: 'advisory',
  confidence: 'certain',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    for (const { node, path } of findAll(ctx.doc, isImage)) {
      const alt = (altOf(node) ?? '').trim();
      if (alt && REDUNDANT_PREFIX.test(alt)) {
        out.push({ ruleId: 'img-alt-redundant', severity: 'advisory', confidence: 'certain', path, location: 'Image', evidence: truncate(alt, 60) });
      }
    }
    return out;
  },
};

export const imgAltTooLong: Rule = {
  id: 'img-alt-too-long',
  title: 'Alternative text is very long',
  why: 'A screen reader reads alt text in one uninterrupted run, so anything past roughly 150 characters is hard to follow.',
  howToFix: 'Keep the alt text to a short description and move the detail into a caption or the surrounding text.',
  wcag: [NON_TEXT],
  severity: 'advisory',
  confidence: 'certain',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    for (const { node, path } of findAll(ctx.doc, isImage)) {
      const alt = (altOf(node) ?? '').trim();
      if (alt.length > 150) {
        out.push({ ruleId: 'img-alt-too-long', severity: 'advisory', confidence: 'certain', path, location: 'Image', evidence: truncate(alt, 60), data: { length: alt.length } });
      }
    }
    return out;
  },
};

export const mediaAvNoAlternative: Rule = {
  id: 'media-av-no-alternative',
  title: 'Video or audio may need captions or a transcript',
  why: 'Pre-recorded audio and video need captions and a text alternative, and a page cannot prove it has them on its own.',
  howToFix: 'Confirm the file has captions, or add a transcript or summary on the page next to it.',
  wcag: [
    { criterion: '1.2.1', name: 'Audio-only and Video-only (Prerecorded)', level: 'A' },
    { criterion: '1.2.2', name: 'Captions (Prerecorded)', level: 'A' },
  ],
  section508: ['502.3.1'],
  severity: 'moderate',
  confidence: 'review',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    const AV = /\.(mp4|mov|avi|mkv|webm|mp3|wav|m4a|aac|ogg|flac)\s*$/i;
    for (const { node, path } of findAll(ctx.doc, (n) => n.type === 'media' || n.type === 'embedCard')) {
      const name = String(node.attrs?.['alt'] ?? node.attrs?.['url'] ?? '');
      const isAv = AV.test(name) || /youtube\.com|youtu\.be|vimeo\.com|loom\.com|wistia/i.test(name);
      if (!isAv) continue;
      out.push({ ruleId: 'media-av-no-alternative', severity: 'moderate', confidence: 'review', path, location: 'Video or audio', evidence: truncate(name, 70) });
    }
    return out;
  },
};

export const imageRules: Rule[] = [imgAltMissing, imgAltMeaningless, imgAltRedundant, imgAltTooLong, mediaAvNoAlternative];
