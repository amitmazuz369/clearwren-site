# clearwren-site — project instructions

This repository is the **built output** of clearwren.com. Every push to `main` that touches
`site/` deploys to GitHub Pages within a minute, so a commit here is a publish.

**If your task is not about clearwren.com, ignore this repository.** It is attached to many
sessions by default; do not read it for context and do not commit to it.

## Where things live

| What | Where |
|---|---|
| Source, build, the Forge apps, listing copy | `amitmazuz369/clearwren` (private) |
| The deployed pages | `site/` here |
| The old monorepo, before the split | `amitmazuz369/clearwren-site-old` — read-only history, never commit there |

## Rules

1. **Change the source, not the output.** The README says `site/` is built output. Before
   hand-editing a page, check whether `amitmazuz369/clearwren` generates it; if it does, fix
   it there and rebuild, or the next build overwrites your edit.
2. **Nothing reaches `main` that you have not looked at in a browser.** Pushing deploys.
3. **No secrets, ever.** This repository is public.

Talk to the owner in Hebrew. Commits stay in English.
