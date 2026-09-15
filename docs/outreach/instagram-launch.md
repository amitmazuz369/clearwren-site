# Instagram — launch post (carousel)

**Status: HOLD until the Marketplace listing is approved.** `instagram-launch.json`
carries `"hold"`, and `tools/ig_publish.py` refuses it without `--release`, so no weekly
run can post "Clearwren is live" before it is true.

The slides are rendered into `brand/social-pending/`, not `site/assets/social/`, so an
ordinary site deploy does not put them on the public site early. Launch day moves them
across — see `docs/launch-day.md`, step 7.

Every slide's alt text is its label, headline and body in full; `tools/ig_slides.py`
checks that mechanically. Figures: 32 checks and 15 WCAG 2.2 criteria are the shipped
engine's; "free for teams up to 10 people" is the listing's pricing.
