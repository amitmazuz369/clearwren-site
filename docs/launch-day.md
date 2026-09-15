# Launch day

Everything here is written now so that nothing is invented under time pressure on the
day. Approval could land any morning; the work is then an hour, not a week.

## The first hour, in order

1. **Deploy the export build to production.** It has sat ready in development since
   2026-09-04 and was held back only to avoid disturbing the review.
   `forge deploy -e production --approve MAJOR_VERSION_RULE`
   Then confirm the listing shows the new version.
2. **Verify the listing renders** — four images, pricing table, free tier, Runs on
   Atlassian badge.
3. **Install on the test site from production** and run one scan end to end. Nothing goes
   out until a real install has worked.
4. **Change the site.** The homepage says the app is in review. Replace with the install
   path.
5. **Email the launch list.** Everyone who used the launch-notice block asked to be told
   once. Tell them once.
6. **Post to LinkedIn**, then the four Atlassian Community answers.

7. **Instagram launch post**, after the site change in step 4:
   ```
   cp brand/social-pending/ig-launch-*.jpg site/assets/social/
   ```
   deploy the site, confirm each `https://clearwren.com/assets/social/ig-launch-N.jpg`
   returns 200 `image/jpeg`, then
   ```
   /usr/bin/python3 tools/ig_publish.py docs/outreach/instagram-launch.json --release
   ```
   and mark `docs/outreach/instagram-launch.md` POSTED with the permalink.

## Why the first week matters more than it looks

Marketplace ranking rewards installs and reviews, and we have neither. So does the only
competitor, AccessLens, which has been live since 2026-08-19 with no installs recorded.
Whoever accumulates first compounds: rank brings installs, installs bring rank.

The free tier to ten users is the instrument. An install costs the customer nothing and
carries no procurement step. Optimise the first week for **installs**, not revenue.

## The launch email

> Subject: Clearwren is live on the Atlassian Marketplace
>
> You asked to be told when this was available. It is, and this is the only email you
> will get about it.
>
> Clearwren checks the accessibility of what your team publishes in Confluence: 32 checks
> across 15 WCAG 2.2 success criteria, run over a whole space, grouped by which check
> failed rather than by which page. Findings carry the location and the fix. The output is
> a dated conformance report you can hand to a reviewer or attach to a procurement
> response.
>
> Free for teams up to ten people, and free to install for everyone else while you look.
>
> [Install from the Marketplace]
>
> If it finds nothing useful in your space, I would genuinely like to know why.

## The launch post

> Clearwren is live on the Atlassian Marketplace.
>
> It checks the accessibility of what your team publishes in Confluence. Not the platform
> — Atlassian's own report covers that. The pages your team wrote.
>
> 32 checks across 15 WCAG 2.2 success criteria, over a whole space, grouped by which
> check failed rather than by which page. 420 missing alt texts is one campaign, not 420
> tasks.
>
> The output is a dated conformance report. That is the part procurement actually asks
> for.
>
> Free up to ten users.

## Held for later, deliberately

- **Sales Promotions and App Discount Programs.** Atlassian runs these for partners and
  they need a published app, so they cannot be arranged in advance. Worth opening once
  there is an install count to protect.
- **The lawsuit statistics** in `outreach/research-sources.md`. They are verified and they
  work, but a vendor leaning on litigation before it has a single customer reads as
  scaremongering.
- **A Confluence accessibility study.** The strongest asset we could own, because no such
  data exists. Blocked on a technical question that has not been settled: our engine reads
  ADF, and public Confluence pages are served as HTML. Until that path is proven, this is
  an idea, not a plan.

## Still blocked on the owner

The four Atlassian Community answers in `outreach/community-replies.md` are written and
fact-checked. They are the highest-intent channel we have — those threads rank in Google
for our exact terms — and they need a LinkedIn-style account action: posting under the
owner's Atlassian Community identity. Nothing else in this document is blocked.
