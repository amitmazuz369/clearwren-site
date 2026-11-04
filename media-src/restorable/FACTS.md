# Restorable: facts for video and social (from main, 4 Nov 2026)

Use only these facts. Anything not here: ask main.

- **Name:** Restorable: Restore Deleted Work Items for Jira. Company: Clearwren. Icon: `restorable-icon.svg` (blue #1c5d99, white circular arrow around a card).
- **Status:** submitted to the Atlassian Marketplace on 4 Nov 2026, **pending approval**. Do not say "available now" or show a Marketplace URL; end card says "Coming soon to the Atlassian Marketplace" (a second end card "Now on the Atlassian Marketplace" for launch day).
- **Problem:** Jira Cloud has no recycle bin for a single work item. Once deleted, the item and its comments are gone. Atlassian's own restore request (JRACLOUD-36415) has been open since 2014. Do not name competitors.
- **What it does:** keeps a copy of each work item inside the customer's Jira site; lists deleted items (key, summary, space, date), filtered by what the viewer may browse; Restore recreates the item in one click with summary, description, type, priority, labels, reporter, status and links; old comments come back quoted with author and time; sub-tasks come back under their restored parent.
- **Honest limits (must not be contradicted):** attached files are not restored (the restored item lists each file's name, size, uploader and date); the new item gets a new key (a comment records the old one); work logs and history are not restored; only items created or changed after install are protected; copies of deleted items are kept 90 days.
- **Privacy:** runs on Atlassian (Forge); copies stay in the customer's own Jira site; no outside servers, no analytics.
- **Price:** free up to 10 users; about $15/month at 50 users. Do not show other price points.
- **Screens (real, from the test site):** `1-deleted-list.png`, `2-restored.png`, `3-history.png` (1840×900). Sample data is fictional (KAN-11..14). Prefer these over mock UI; any mock must match them.
- **Site:** https://clearwren.com/restorable.html (product page and docs).
