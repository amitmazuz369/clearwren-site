# LinkedIn post: Confluence accessibility carousel

Attach: clearwren-confluence-accessibility-carousel.pdf (10 slides, document post)

## Post text

We scanned 1,182 pages across 13 public Confluence sites and checked them against WCAG 2.2.

About two in three had no level A or AA failure. No site was clean.

What stood out is how little of it there is. Six common problems show up again and again: missing alt text, low contrast, bold used as a heading, alt text that says nothing, tables with no header row, and links that read "click here".

Contrast shows it best. 1,396 failures sat on just 114 pages, which often means one template or one colour. Together with missing alt text it covers 2,870 of the 2,881 critical issues we found.

The slides have the numbers and the fix for each one. The sample is small (13 sites, margin of about 8 points on the headline figure) and slide 9 says so. We also build an accessibility checker for Confluence, so weigh that.

Which of the six do you see most in your own docs?

## First comment (post the link here, not in the post)

Full write-up with method: https://clearwren.com/study-confluence-accessibility.html
Run the same checks on one of your own pages, free: https://clearwren.com/checker.html

## Per-slide text (for alt text and accessibility; LinkedIn documents have no per-slide alt)

1. 1,182 Confluence pages. Six common problems. Measured on 13 public sites. Missing alt text and low contrast account for 2,870 of the 2,881 critical issues.
2. 64% of pages had no level A or AA failure, so about one in three did. No site was clean. Best site: about one page in eight still carried a failure. Weakest: two in three. Average page score 77 out of 100. Sample figure, give or take about 8 points.
3. Check 1 of 6, WCAG 1.1.1. 285 pages with images that have no alt text. 1,474 issues on 12 of 13 sites. Fix: open the image toolbar and describe what the picture shows; mark decorative images as decorative.
4. Check 2 of 6, WCAG 1.4.3. 114 pages hold 1,396 contrast failures, on 12 of 13 sites. Example 2.5:1 fails, 8.8:1 passes. Change the value, not 114 pages. Reach 4.5:1 for body text, 3:1 for large headings.
5. Check 3 of 6, WCAG 1.3.1. 146 pages use bold text instead of a heading (461 issues, 11 of 13 sites). Apply a real heading level. Flagged for a person to confirm.
6. Check 4 of 6, WCAG 1.1.1. 258 alt texts do not describe the image (55 pages, 8 of 13 sites): file names, the word "image", a repeated caption. Alt text should say what the image shows.
7. Check 5 of 6, WCAG 1.3.1. 44 pages with a data table that has no header row (58 issues, 12 of 13 sites). Turn on "Header row" in the table toolbar.
8. Check 6 of 6, WCAG 2.4.4. 41 pages with links that do not say where they go (59 issues, 11 of 13 sites). Name the destination, for example "2026 onboarding checklist" instead of "click here". Flagged for a person to confirm.
9. How we measured: 13 public Confluence Cloud sites found through web search, not randomly selected. Up to 100 random pages per site, margin about 8 points. Same engine as the product (32 rules today); only certain failures count. 11 of 55 level A and AA criteria tested. Aggregate only, no site named. We build a Confluence checker, so we have a stake.
10. Measure one of your own pages. Free checker at clearwren.com/checker.html, runs in your browser.

## Numbers source
All figures from https://clearwren.com/study-confluence-accessibility.html (the 7 Oct 2026 recount). Status 2 Nov: numbers verified against the study page by the comms session; slide 10 price line removed until main/owner approves it. Do not use the homepage "top problems" list: it still counts skipped heading levels, which the study page says no longer count as a failure.
