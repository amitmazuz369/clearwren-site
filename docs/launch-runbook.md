# Launch runbook

Everything here is executed by the agent. It starts the moment `forge login` succeeds on
this machine, and each step lists how it is verified.

## Phase 0 — pre-flight (done, no account needed)

| Check | Command | State |
|---|---|---|
| Listing and asset rules | `node tools/preflight.mjs` | all passing |
| Engine tests | `npm --workspace @clearwren/a11y-engine test` | 36 passing |
| Manifest schema | `node tools/validate-manifest.mjs` | valid |
| Backend bundles | `npx esbuild src/index.js --bundle --platform=node` | clean |
| All four UI entries bundle | esbuild per resource | clean |
| Site builds and self-checks | `node tools/build-site.mjs && node tools/selfcheck.mjs` | 14 pages, clean |
| Engine on real pages | `node tools/validate.mjs` | no false positives outstanding |

## Phase 1 — register and deploy (day 1)

1. `forge register` in `packages/app-a11y`, which writes the real app id into `manifest.yml`.
2. `forge deploy -e development`.
3. `forge install --site <dev-site>.atlassian.net --product confluence`.
4. Verify the four surfaces appear: page byline, space menu, global apps menu, app settings.

## Phase 2 — end-to-end test on real content (days 2–5)

Seed a dev space with pages that exercise every rule, then confirm the app agrees with the
engine's own expectations.

1. Create the seed pages from `docs/test-pages.md`.
2. Open each in the byline panel and compare against the expected findings in that file.
3. Apply an alt-text fix from the panel; confirm the page version increments, the alt text
   lands in the body, and a re-check clears the finding.
4. Run a space scan; confirm the queue walks every page, progress updates, and the roll-up
   numbers match the sum of the page results.
5. Publish a report page; confirm the criterion table and the findings table render.
6. Force the failure paths: a page whose body is too large, a page with a corrupt body, a
   scan on an empty space, and an unlicensed call to the space scan.
7. Confirm the weekly scheduled trigger fires by invoking it with `forge webtrigger`-style
   manual invocation, or by temporarily setting `interval: hour`.

## Phase 3 — listing (days 5–8)

1. Produce the four images at the sizes the form requires, listed in `docs/marketplace-listing.md`.
2. Create the listing with the copy in that file; set the pricing tiers exactly as given.
3. Point the required URLs at `clearwren.com`.
4. Complete the security questionnaire — the app makes no egress calls, stores no personal
   data outside the tenant, and uses no third-party services, which makes most answers short.
5. Apply for **Runs on Atlassian**: no Connect modules, Forge auth, Forge UI, no remotes.

## Phase 4 — submit and wait (10–15 business days)

While in review:

1. Publish the site at `clearwren.com` (GitHub Pages with a custom domain, no new accounts).
2. Submit `sitemap.xml` to search engines.
3. Answer the existing Atlassian Community questions about Confluence accessibility —
   substantively, disclosing the app rather than spamming it.
4. Write the next two guides: the European Accessibility Act for documentation teams, and a
   WCAG 2.2 checklist for Confluence authors.

## Phase 5 — first 90 days after approval

| Week | Focus | Measure |
|---|---|---|
| 1–2 | Watch the first installs; answer every support mail within a day | installs, first evaluation starts |
| 3–4 | Ask satisfied evaluators for a review; reviews are the single biggest ranking lever | ≥5 reviews |
| 5–8 | Publish guides on a weekly cadence; get the free checker ranking | organic sessions, checker runs |
| 9–12 | Convert evaluations; fix whatever the support queue keeps repeating | paying sites, MRR |

Target at day 90: **10–20 paying sites**. At the planned tiers that is roughly
$800–$2,000/month, on the way to ₪10,000.

## The daily watch

`tools/watch.mjs` checks the things that fail silently and takes the site, the mail or the
listing with them: the certificate, the four A records, the three MX records, exactly one
SPF record, the Zoho verification and DKIM records, a nameserver change (which is what a
domain hijack looks like), the domain expiry, whether the live site still matches the built
source, and whether the app is public on the Marketplace.

A scheduled task, `clearwren-daily-watch`, runs it every morning, fixes what it can on its
own, and pushes to the owner's phone only when something is both broken and needs a person.
A daily "all clear" is never sent.

## Kill criteria

If after 90 days of approved listing there are fewer than 3 paying sites and fewer than 300
installs, the wedge is wrong rather than the execution. In that case the engine and the app
shell are reused for the next app in `BUSINESS.md`, which is a two-week rebuild rather than
a restart.

---

## Execution log

**3 September 2026**

| Step | Result |
|---|---|
| Domain, DNS, HTTPS | `clearwren.com` live on GitHub Pages, Let's Encrypt certificate, HTTP redirects to HTTPS |
| Email | Zoho Mail on the domain; MX, SPF and DKIM all verified by Zoho |
| Marketplace partner | Clearwren registered, logo uploaded, Israel accepted as the partner country |
| Developer Space | `Clearwren` created |
| App registered | `ari:cloud:ecosystem::app/9f665f10-483e-43d5-a6ec-7fcaa1743ad8` |
| Runs on Atlassian | first deploy reported **eligible** |
| Demo site | `one-atlas-enqi.atlassian.net`, app installed |
| End-to-end fixtures | all six pages seeded and audited: **every expected finding present**, clean control page scored 100 |

**4 September 2026** — listing submitted for approval.

The first submission was auto-rejected: "Not enough details on listing", because pricing had
not been set. Pricing is a separate tab, outside the submission wizard, and a paid app
without it is an incomplete record. Set, saved and resubmitted the same day. The app now
reads "pending approval by Atlassian and cannot be edited".

Scores observed on the fixtures: Onboarding 40, Release notes 76, Architecture 80,
Style guide 100, Policy 93, Copy of Untitled 97.

Two corrections came out of running against a real site rather than a unit test:

- `table-nested` was removed. ADF forbids a table inside a table cell, so Confluence
  strips one on save and the check could never fire on Cloud content.
- The fixture seeder is idempotent, because a second run hit the duplicate-title rule.
