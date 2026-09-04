# Marketplace listing — every field, ready to paste

The listing is created at
`https://developer.atlassian.com/console/myapps/9f665f10-483e-43d5-a6ec-7fcaa1743ad8/manage/distribution`
→ **Distribute your app** → **Marketplace listing**.

Everything below is final copy. Nothing needs writing, only pasting.

---

## App details

**Name**
```
WCAG & ADA Accessibility Checker for Confluence
```

**Summary** (shown under the name in search results)
```
Check every page against WCAG 2.2, fix issues in place, and publish the conformance report your auditor asks for.
```

**Categories** — the form allows two, from a taxonomy that replaced the one in `research/`.
Read the options off the form. Prefer any compliance or governance category; otherwise
`Content and communication` plus `Administrative tools`.

**Logo** — `brand/clearwren-logo-512.png`

---

## Highlights

**1 — See the problems where the writing happens**
```
Every page carries an accessibility score in its byline. Open it and each finding explains what a reader loses and how to fix it. Missing alt text can be written straight into the page without leaving the panel.
```
Screenshot: `4-page-check-panel.png`

**2 — Scan an entire space in one click**
```
Walk every current page, rank the worst offenders, and see which problems repeat, so you fix the pattern rather than the page. Scanned spaces re-check themselves weekly.
```
Screenshot: `1-space-dashboard.png`

**3 — Report against the standard, not just a score**
```
A conformance table by WCAG success criterion, with criteria that need human judgement marked for review rather than claimed either way. Publish it as a dated Confluence page for an audit or a procurement response.
```
Screenshot: `3-conformance-by-criterion.png`

**4 — Nothing leaves your site**
```
Runs entirely on Forge. No outbound calls, no vendor servers, nothing to add to your security review.
```
Screenshot: `2-findings-by-check.png`

---

## Long description

Paste the "Description" section of `docs/marketplace-listing.md` verbatim.

---

## Pricing (Cloud, per user per month)

| Users | Price |
|---|---|
| 1–10 | 0.00 |
| 11–100 | 1.60 |
| 101–250 | 0.90 |
| 251–1000 | 0.55 |
| 1001–10000 | 0.30 |

---

## Links

| Field | Value |
|---|---|
| Privacy policy | `https://clearwren.com/privacy.html` |
| Terms of use / EULA | `https://clearwren.com/terms.html` |
| Documentation | `https://clearwren.com/docs.html` |
| Support | `https://clearwren.com/support.html` |
| Security statement | `https://clearwren.com/security.html` |
| Vendor site | `https://clearwren.com` |

---

## Security questionnaire — the answers

The app makes this unusually short, and every answer here is true of the shipped code:

- **Data leaving the Atlassian tenant:** none. The app makes no outbound network calls at all.
- **Third-party services or sub-processors:** none.
- **Data stored:** page ids and titles, scores, issue positions, short quoted fragments of the offending content, and app settings — all in Forge storage inside the customer's own tenant.
- **Personal data:** none collected. A quoted fragment may contain whatever the page contained.
- **Authentication:** Forge OAuth 2.0. No credentials are handled by the app.
- **Scopes requested:** five, listed on `https://clearwren.com/security.html` with the reason for each.
- **Data residency:** follows the customer's Atlassian site configuration, because storage is Forge storage.
- **Deletion:** uninstalling removes the app's storage with it.

## Runs on Atlassian

Apply for the badge in the same console. The production build already reports as
eligible: no Connect modules, Forge authentication, Forge UI, and no egress.
