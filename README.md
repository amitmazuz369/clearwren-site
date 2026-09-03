# Clearwren

Compliance and quality apps for the Atlassian Cloud ecosystem.

## Layout

| Path | What it is |
|---|---|
| `packages/engine` | `@clearwren/a11y-engine` — deterministic WCAG 2.2 rule engine over ADF. Pure TypeScript, no dependencies, 26 tests. |
| `packages/app-a11y` | The Forge app for Confluence Cloud: byline check, space scan, site report, conformance report. |
| `site/` | The public site (static, no framework). `site/src` holds the page bodies; `tools/build-site.mjs` assembles them. |
| `tools/` | Build and validation scripts, including the HTML→ADF converter used to test the engine on real pages. |
| `research/` | The Marketplace catalogue pull and the analysis behind the product choice. |

## Commands

```bash
npm install                                   # workspaces
npm --workspace @clearwren/a11y-engine test   # build + run the engine tests
node tools/gen-rules.mjs                      # regenerate the rule catalogue for the site
node tools/build-site.mjs                     # build the static site into site/
node tools/validate.mjs                       # run the engine over saved real-world pages
```

`BUSINESS.md` holds the plan and the numbers. `SETUP_REQUIRED.md` holds the accounts that
have to exist before the app can be registered and listed.
