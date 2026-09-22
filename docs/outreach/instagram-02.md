# Instagram 02 — missing alt text (carousel)

**Status: draft, not yet posted.**

## Images
Hosted on our own domain so Instagram can fetch a direct URL. JPEG 1080x1350 — 4:5 is the
tallest ratio the Instagram API accepts, and it takes JPEG only.

1. https://clearwren.com/assets/social/ig-02-alt-1.jpg
2. https://clearwren.com/assets/social/ig-02-alt-2.jpg
3. https://clearwren.com/assets/social/ig-02-alt-3.jpg

## Alt text

1. The biggest problem: missing image descriptions. 1,765 of them scattered across 311 pages — the most common failure in our study.
2. What a screen reader hears: just the word image. A user who cannot see the screenshot has no idea what step it was meant to show. The information is gone.
3. How to fix it: one paragraph per image. Describe what the screenshot shows: the button you clicked, the tab that opened, the state of the page. That paragraph becomes the alt text.

## Caption

Missing image descriptions: the single biggest accessibility failure we found.

1,179 pages across 13 public Confluence sites. 1,765 images with no alt text, scattered across 311 pages.

An image that should explain a step becomes invisible to a screen reader. "Image" is all it says.

Not a hard fix — one paragraph per slide — but it compounds across a space: you can't explain screenshots with pictures. You need words.

Method, data, and limits: clearwren.com (link in bio).

#WebAccessibility #A11y #AltText #DigitalAccessibility #WCAG #Confluence #Documentation

## Notes
- Figures come only from `research/survey-aggregate-2026-09-08-wide.json`, `img-alt-missing`
  rule: 311 pages, 1,765 issues, 12 of 13 sites — verified against the source file before
  writing this draft.
- Machine-readable spec: `instagram-02.json`, published with
  `/usr/bin/python3 tools/ig_publish.py docs/outreach/instagram-02.json`.
