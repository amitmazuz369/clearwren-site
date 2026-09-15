# Instagram 01 — the documentation study (carousel)

**Status: ready, not posted.** Blocked on the Instagram channel being connected to Buffer
(checked 2026-09-15: the Buffer organisation holds only the LinkedIn page and the
TikTok account). Mark this line `POSTED <date>` once it goes out.

## Images
Hosted on our own domain so Buffer can fetch a direct URL. JPEG 1080x1350 — 4:5 is the
tallest ratio the Instagram API accepts, and it takes JPEG only.

1. https://clearwren.com/assets/social/ig-01-study-1.jpg
2. https://clearwren.com/assets/social/ig-01-study-2.jpg
3. https://clearwren.com/assets/social/ig-01-study-3.jpg

## Alt text
Every word on a slide is inside the image, so without these the post is unreadable to a
screen reader. An accessibility company cannot publish that, and the accessibility
community on Instagram would notice.

1. A Clearwren study. We checked 1,179 pages of public documentation. Roughly half had an accessibility failure. Not one of the 13 sites was clean.
2. The biggest single problem: images with no description. A screen reader just says “image”. The step it was meant to show is gone.
3. The one that surprised us: descriptions that describe nothing, such as “screenshot”, “image.png” and “IMG_2231”. Someone filled the field in. The information still didn’t arrive.

## Caption

Everyone measures home pages. Almost nobody measures the documentation organisations actually publish.

So we did: 1,179 pages across 13 public Confluence sites, checked against WCAG 2.2.

Roughly half had at least one accessibility failure, and no site was clean.

The finding that stayed with us wasn’t the missing descriptions. It was the ones that exist and say nothing: a filename, the word “screenshot”. Someone made the effort, and the information still didn’t arrive.

Method, sample size and limits: clearwren.com (link in bio).

#WebAccessibility #A11y #DigitalAccessibility #WCAG #TechnicalWriting #Accessibility

## Notes
- Hashtags are CamelCase on purpose: a screen reader reads `#WebAccessibility` as words
  and `#webaccessibility` as a string of letters.
- Figures come only from `research/survey-aggregate-2026-09-08-wide.json`: 1,179 pages,
  13 sites, best single site 79% clean — so "no site was clean" holds. "Roughly half",
  never "57%" (see the sampling note in memory).
- Buffer settings: `metadata.instagram` = `{ type: "post", shouldShareToFeed: true }`,
  three image assets in order, each with its alt text. Publish same-day rather than
  queueing: the organisation's 10 scheduled-post cap is shared with LinkedIn.
