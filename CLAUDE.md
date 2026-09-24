# Clearwren — project instructions

Paid Forge apps on the Atlassian Marketplace. First product: **Clearwren Accessibility for
Confluence**, a deterministic WCAG 2.2 A/AA checker. Goal: ₪10,000/month recurring.

Talk to the owner in Hebrew. Code, commits and docs stay in English, except the owner-facing
`SETUP_REQUIRED.md`, which is Hebrew.

## Where things stand

Look these up rather than trusting this file. They change, and this file does not track them.

| Question | Source |
|---|---|
| Plan, pricing, portfolio, phase owners | `BUSINESS.md` |
| Launch phases and the review wait | `docs/launch-runbook.md` |
| Listing copy (checked by preflight) | `docs/listing.json`, `docs/marketplace-listing.md` |
| What only the owner can do | `SETUP_REQUIRED.md` |
| Is the domain, mail, site and listing healthy | `node tools/watch.mjs` (needs real DNS — fails wholesale in a sandbox without it) |

## Rules

1. **The listing is locked while in review.** Pricing, name and copy in the submitted listing
   are not edited, and nothing is described as live until `watch.mjs` reports the app public.
2. **One number, one place.** Prices and rule counts live in `BUSINESS.md` and the engine;
   `preflight.mjs` fails if a published claim drifts. Fix the source, never the copy.
3. **Every channel earns its place in installs.** Buyers are Confluence admins and
   accessibility leads at universities and public bodies. A new marketing channel (Instagram,
   LinkedIn, community posts) needs a stated way to trace it to installs or evaluations before
   more tooling is built for it. Follower counts alone are not a measure here.
4. **The engine stays deterministic** and the app makes no egress calls — that is what qualifies
   it for *Runs on Atlassian*. Adding a remote or a third-party call breaks the badge.
5. **Owner-blocked work is listed, not worked around.** If a step needs the owner (accounts,
   KYC, payments, OAuth consent), add it to `SETUP_REQUIRED.md` with the exact action and stop.

## Commands

```bash
npm install                                   # workspaces, Node >= 22
npm --workspace @clearwren/a11y-engine test   # engine tests
node tools/preflight.mjs                      # listing + site + claims checks — run before any commit
node tools/build-site.mjs                     # rebuild site/ from site/src
```

## Secrets

The Instagram token lives in `~/.config/clearwren/instagram.env`, outside the repo. Never write
a token into a tracked file, a commit message, a workflow, or a scheduled-task prompt. The only
workflow here deploys `site/` to Pages and needs no secrets — keep it that way.
