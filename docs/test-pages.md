# Seed pages for the dev site

Each page is built to trip specific rules. The expected findings are what the byline panel
must show; anything else is a bug in the rule or in the extraction.

## 1. “Onboarding” — the everyday mess
Content: an H1 in the body, a bold line acting as a heading, a pasted screenshot with no alt
text, a “click here” link, a table with no header row, three paragraphs starting with “-”,
and a grey (#A5ADBA) sentence.

Expected: `heading-h1-in-body`, `fake-heading`, `img-alt-missing`, `link-nondescriptive`,
`table-no-header`, `fake-list`, `contrast-minimum`. Score around 39.

## 2. “Release notes 2026” — tables
Content: a table with merged header cells, a nested table, a single-row table used as a
callout, and one empty header cell.

Expected: `table-merged-cells`, `table-nested`, `table-layout`, `table-empty-header`.

## 3. “Architecture” — media and structure
Content: H2 then H4, an image with alt text `diagram.png`, an embedded Loom link, an expand
with no title, and an image with a 400-character alt text.

Expected: `heading-skipped-level`, `img-alt-meaningless`, `media-av-no-alternative`,
`expand-no-title`, `img-alt-too-long`.

## 4. “Style guide” — should be clean
Content: correct heading order from H2, described images, a table with a header row,
descriptive links, default colours.

Expected: no findings, score 100, conformant true. This is the page that proves the checker
does not simply flag everything.

## 5. “Policy” — links and language
Content: two links reading “guidelines” pointing at different pages, a bare URL as link
text, a paragraph of Hebrew inside an English page, and a 1,400-character paragraph.

Expected: `link-ambiguous-duplicate`, `link-raw-url`, `mixed-language`, `long-paragraph`.

## 6. “Untitled” — page-level rules
Title literally `Copy of Untitled`, with a duplicate of an existing page title elsewhere in
the space.

Expected: `page-title-nondescriptive`, and `page-title-duplicate` once the space scan has
run and sibling titles are known.

## 7. “Huge” — the limit path
A page with a body over 900 KB.

Expected: the panel reports the page as unsupported rather than failing.
