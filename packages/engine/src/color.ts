/**
 * Colour maths for WCAG 1.4.3 / 1.4.11, plus the Confluence-specific knowledge
 * needed to work out what background a piece of text actually sits on.
 */

export interface Rgb { r: number; g: number; b: number }

/** Accepts #rgb, #rrggbb, #rrggbbaa and rgb()/rgba() forms. Alpha is composited over white. */
export function parseColor(input: unknown): Rgb | null {
  if (typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  const hex = s.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    const h = hex[1]!;
    let r: number, g: number, b: number, a = 1;
    if (h.length === 3 || h.length === 4) {
      r = parseInt(h[0]! + h[0]!, 16);
      g = parseInt(h[1]! + h[1]!, 16);
      b = parseInt(h[2]! + h[2]!, 16);
      if (h.length === 4) a = parseInt(h[3]! + h[3]!, 16) / 255;
    } else if (h.length === 6 || h.length === 8) {
      r = parseInt(h.slice(0, 2), 16);
      g = parseInt(h.slice(2, 4), 16);
      b = parseInt(h.slice(4, 6), 16);
      if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255;
    } else return null;
    return a === 1 ? { r, g, b } : compositeOnWhite({ r, g, b }, a);
  }
  const fn = s.match(/^rgba?\(([^)]+)\)$/);
  if (fn) {
    const parts = fn[1]!.split(/[\s,/]+/).filter(Boolean).map(Number);
    const [r, g, b, a] = parts;
    if ([r, g, b].some((v) => v === undefined || Number.isNaN(v))) return null;
    const alpha = a === undefined || Number.isNaN(a) ? 1 : a;
    const base = { r: r!, g: g!, b: b! };
    return alpha === 1 ? base : compositeOnWhite(base, alpha);
  }
  return null;
}

function compositeOnWhite(c: Rgb, alpha: number): Rgb {
  const mix = (v: number) => Math.round(v * alpha + 255 * (1 - alpha));
  return { r: mix(c.r), g: mix(c.g), b: mix(c.b) };
}

/** WCAG relative luminance. */
export function luminance({ r, g, b }: Rgb): number {
  const chan = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

/** WCAG contrast ratio, 1 to 21, rounded to two decimals. */
export function contrastRatio(fg: Rgb, bg: Rgb): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** Required ratio for body vs. large text at the given conformance level. */
export function requiredRatio(level: 'AA' | 'AAA', isLargeText: boolean): number {
  if (level === 'AAA') return isLargeText ? 4.5 : 7;
  return isLargeText ? 3 : 4.5;
}

/** Confluence Cloud default text and surface colours. */
export const CONFLUENCE_DEFAULT_TEXT = '#172B4D';
export const CONFLUENCE_DEFAULT_BACKGROUND = '#FFFFFF';

/** Background colour Confluence paints behind each built-in panel type. */
export const PANEL_BACKGROUNDS: Record<string, string> = {
  info: '#DEEBFF',
  note: '#EAE6FF',
  success: '#E3FCEF',
  warning: '#FFF0B3',
  error: '#FFEBE6',
};

/**
 * Font size Confluence renders each heading at, in CSS pixels, and whether the
 * weight is heavy enough for WCAG's "large text" allowance (>=18.66px bold or
 * >=24px at any weight).
 */
export const HEADING_PX: Record<number, number> = { 1: 24, 2: 20, 3: 16, 4: 14, 5: 12, 6: 12 };
export const BODY_PX = 14;

export function isLargeText(fontPx: number, bold: boolean): boolean {
  return fontPx >= 24 || (bold && fontPx >= 18.66);
}
