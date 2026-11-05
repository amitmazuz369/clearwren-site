# Social posts, 11 to 24 Nov 2026 (four images, 1080x1350)

All numbers and quotes below come from the two live pages (checked 4 Nov 2026):
- Guide: https://clearwren.com/guide-jira-deleted-work-item.html (last checked 4 Nov 2026)
- Study: https://clearwren.com/study-confluence-accessibility.html
Each image ends with the page URL as plain text. No hashtags except where shown (max 2). Nothing here says Restorable is available.

## Post A: post-a.png (Restorable guide)
**Text**
Someone deleted a Jira work item and you want it back?

Jira Cloud has no recycle bin for a single work item, and restoring a backup replaces the whole site. But the content often still exists somewhere:

1. Email notifications. The reporter, the assignee and every watcher got an email for the creation and for each comment. Search your mailbox for the key.
2. Links from elsewhere. Confluence pages, other work items, pull requests and chat messages that mentioned the key often quote the important parts.
3. Exports and reports. A CSV export, a dashboard screenshot or a sprint report from before the deletion.
4. A backup file, read by hand. You cannot import one item from it, but you can copy the text out.

Whatever you recover becomes a new work item with a new key. Add a comment with the old key so old links can find it.

Full guide: https://clearwren.com/guide-jira-deleted-work-item.html

#Jira
**Alt text:** Numbered list titled "Where a deleted work item still lives": 1 email notifications, 2 links from elsewhere, 3 exports and reports, 4 a backup file read by hand.

## Post B: post-b.png (permission)
**Text**
Most accidental Jira deletions can be stopped with one permission.

In the space's permission scheme, remove "Delete work items" from roles such as Member, so only administrators can delete.

One catch: a permission scheme is often shared by many spaces. Copy it first if only one space should change.

Then give people another way to close an item without deleting it: a resolution such as "Won't do" or "Duplicate", or archiving on Premium. Most deletions are someone tidying up, not someone wanting the history gone.

It will not stop every accident (admins still delete, and bulk changes go wrong), but it takes five minutes.

Steps and where to look: https://clearwren.com/guide-jira-deleted-work-item.html

#Jira
**Alt text:** Dark slide titled "One permission stops most accidental deletions". A small table shows the permission "Delete work items": Administrators yes, Member removed. Text advises copying a shared scheme first.

## Post C: post-c.png (alt text that says nothing)
**Text**
A filled-in alt text field is not the same as a useful one.

In our study of 1,182 public Confluence pages on 13 sites, 258 alt texts did not describe the image. They sat on 55 pages, on 8 of the 13 sites. File names. The word "image". A caption repeated from the paragraph above.

Somebody filled the field in and the information is still gone. Missing alt text needs a policy. This one needs authors to understand what the field is for.

The fix: describe the information the picture conveys in that context, in a sentence.

The study is a first measurement with limits (13 sites, a margin of about 8 points on the headline figure). Method and numbers: https://clearwren.com/study-confluence-accessibility.html

#Accessibility
**Alt text:** Slide titled "Alt text that says nothing". The number 258 with the caption "alt texts that do not describe the image", on 55 pages, on 8 of 13 sites. Three examples in red: alt="IMG_4021.png", alt="image", alt="(the caption, repeated)".

## Post D: post-d.png (bold is not a heading)
**Text**
Bold text that looks like a heading is not a heading.

Across 1,182 public Confluence pages on 13 sites, we found bold text used instead of a heading 461 times, on 146 pages, on 11 of the 13 sites.

A reader using a screen reader cannot jump to it or see the structure of the page. We flag this one for a person to confirm, because sometimes bold is just bold.

The fix takes seconds: select the line and apply a heading level from the text-style menu.

Study, with method and limits: https://clearwren.com/study-confluence-accessibility.html

#Accessibility
**Alt text:** Slide titled "Bold is not a heading". The number 146 with the caption "pages use bold text instead of a heading", 461 issues on 11 of 13 sites. A bold paragraph "Travel policy" is compared with a real H2 heading. A tag says "Flagged for a person to confirm".

## Videos
- Restorable 15 s cuts: restorable-demo-15s-9x16-coming-soon.mp4 (1080x1920), restorable-demo-15s-1x1-coming-soon.mp4 (1080x1080), restorable-demo-15s-coming-soon.vtt. Same real screens as the 37 s demo. The "deleted card" at the start is a simple mock with KAN-11's real summary.
- Clarable awareness, 16:9 (1920x1080): clarable-awareness-16x9.mp4 + .vtt, same captions as the vertical one; end card says "Find Clarable on the Atlassian Marketplace".

## Not verified / for main to check
- Post A: the guide says a backup restore "replaces the whole site"; I wrote "restoring a backup replaces the whole site" (same meaning). The "(a)" list items are quoted or lightly shortened from the guide.
- Post B: "It will not stop every accident (admins still delete, and bulk changes go wrong), but it takes five minutes" is built from two sentences on the guide ("Permissions prevent most accidents, but not all of them" and "you can stop it happening again in five minutes"). "Most accidental deletions" in the headline follows "Permissions prevent most accidents".
- Posts C and D: "A reader using a screen reader cannot jump to it" is my wording of why a fake heading matters (WCAG 1.3.1); it is not a sentence from the study page. Post C's "Missing alt text needs a policy" paraphrases the study ("The first group needs a policy").
- I did not check whether the Atlassian plan names ("Premium") and the "Won't do" / "Duplicate" resolutions exist in every site; I used the guide's wording.
- No third-party fonts or scripts in anything here, but the PNG images were rendered with Inter, which is not on clearwren.com; images are flat PNGs, so nothing loads from outside.
