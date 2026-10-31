# Laptop reel (3D, WebGL)

Two self-contained pages: `horizontal-16x9.html` and `vertical-9x16.html`. 38 s loop, generic laptop (no brand), Clarable features on screen.

- Loads three.js r128 from cdnjs. Do NOT ship on clearwren.com as is: the site promises no third-party calls. Vendor the library or use it only to record video.
- To export video: open the page, press H (clean view), screen-record. `#t=SECONDS` in the URL starts mid-loop.
- Report scene numbers are illustrative and labelled on screen. Hero/study figures come from index.html.
- Screen content is drawn in JS, not read from the site: update by hand if site copy changes.
