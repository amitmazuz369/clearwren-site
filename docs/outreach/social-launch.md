# Social presence — decision, setup values, and the first month of posts

## The decision, and why it is one channel and not five

The buyer for this product is a documentation lead, a Confluence admin, or an
accessibility/compliance officer at an organisation that publishes public-facing docs.
That is a LinkedIn audience and essentially nowhere else. Accessibility professionals are
unusually concentrated and unusually active there.

Ruled out deliberately:

| Channel | Why not |
|---|---|
| Instagram / TikTok | Wrong buyer entirely. No B2B compliance purchase starts here. |
| X | The `#a11y` community persists but reach for a new account is near zero. |
| Reddit (`r/accessibility`, `r/atlassian`) | Real audience, strongly anti-promotion. Worth reading, not posting. Answer only where genuinely on-topic, from a personal account, disclosed. |
| Mastodon (`a11y.social`) | Small but a genuine accessibility community. Cheap to mirror LinkedIn posts. Second priority, not first. |

One channel done properly beats five done thinly, and the content engine is the same
either way: the guides already on the site.

---

## LinkedIn Page — exact field values

The owner must create the page; I do not create accounts. Everything below is ready
to paste, checked against LinkedIn's current field limits.

| Field | Value | Limit |
|---|---|---|
| Name | `Clearwren` | 100 |
| LinkedIn public URL | `linkedin.com/company/clearwren` | — |
| Website | `https://clearwren.com` | — |
| Industry | `Software Development` | — |
| Company size | `1 employee` (`Myself only`) | — |
| Company type | `Self-employed` | — |
| Logo | `brand/logo-linkedin-300x300.png` | 300×300 |
| Cover image | `brand/linkedin-cover-1128x191.png` | 1128×191 |
| Tagline | `Accessibility checking for Confluence content — WCAG 2.2, ADA and EAA.` | 120 |

**About (2,000 char limit):**

> Confluence is where a great many organisations keep their public documentation: help
> centres, knowledge bases, policy libraries, course material.
>
> Atlassian publishes a VPAT for the product. It says nothing about the pages your team
> wrote — whether the screenshots have alt text, whether the tables have header rows,
> whether the grey-on-grey callout is readable. Under ADA Title II, the European
> Accessibility Act and Section 508, that content is in scope and it is yours.
>
> Clearwren checks it. 32 deterministic checks across 15 WCAG 2.2 success criteria, run
> over a whole space, grouped by which check failed rather than by which page failed —
> because 420 missing alt texts is one campaign, not 420 tasks. Findings come with the
> location and what to change. The output is a dated conformance report you can put in
> front of a reviewer or attach to a procurement response.
>
> Built on Atlassian Forge. Your content never leaves your Atlassian tenancy.
>
> Free for teams up to 10 people.

---

## The content engine

Every post does one of three jobs. Nothing else gets posted.

1. **Teach one concrete thing** a Confluence author can use today, with no product in it.
2. **Explain one piece of the law** plainly, for the person who just got a deadline.
3. **Show the product** — sparingly, roughly one post in six.

Cadence: three posts a week — Tuesday, Wednesday, Thursday, mid-morning European time,
which is when this audience is at a desk. No weekends; nobody reads compliance content
on a Saturday.

---

## First month — twelve posts, written

### 1 — Teach
> A table in Confluence with bold text in the first row looks exactly like a table with a
> header row.
>
> To a screen reader they are not remotely the same thing.
>
> Bold first row: the reader hears a wall of values. "North. 412. 38%. South. 391. 41%."
> Nothing says which number is which.
>
> Actual header row: every cell is announced with its column. "Region: North. Orders: 412."
>
> It is one click in the table controls. There are probably a few hundred tables in your
> space where nobody made it.

### 2 — Law
> Three deadlines that have already landed on documentation teams, in plain terms:
>
> **ADA Title II** — US public entities, including every public university and school
> district. WCAG 2.1 AA. April 2026 for populations of 50,000+, April 2027 below that.
>
> **European Accessibility Act** — in force since June 2025. Covers services sold to
> consumers in the EU, and the documentation that goes with them.
>
> **Section 508** — not new, but it arrives through procurement. You meet it because a
> buyer's contract requires it.
>
> If your documentation is public and you are in any of these categories, the pages are
> in scope. Not just the app they document.

### 3 — Teach
> "Screenshot of the settings page" is not alt text. It describes the file, not the
> information.
>
> The test: if you deleted the image and left only the alt text, would the reader still be
> able to do the thing the page is teaching?
>
> Bad: "Screenshot of the settings page."
> Good: "The Notifications tab, with 'Email digest' set to Weekly."
>
> Same effort. Entirely different outcome for the person who cannot see it.

### 4 — Law
> Atlassian's VPAT for Confluence Cloud is a real document and it is worth attaching.
>
> It also does not answer the question you were asked.
>
> It covers the editor, the navigation, the dialogs — Atlassian's software. It says
> nothing about whether the 1,200 pages your team wrote have alt text.
>
> When a procurement questionnaire asks about the accessibility of the service you are
> selling, the content is in scope. Almost every uncomfortable conversation in this area
> starts by answering the second question with a document that only addresses the first.

### 5 — Teach
> A quick way to find your worst accessibility problem without any tooling:
>
> Open your most-visited documentation page. Count the images. Now count the ones where
> someone wrote alt text.
>
> In most Confluence spaces the second number is zero. That single gap accounts for more
> lost information than every other issue put together, and it is also the cheapest to fix
> — the author already knows what the picture shows.

### 6 — Product
> What a space audit actually looks like when you group findings by check rather than
> by page:
>
> · 420 images with no alt text, across 180 pages
> · 96 tables with no header row
> · 38 places where bold text is standing in for a heading
> · 22 low-contrast passages, nearly all inherited from one template
>
> That is four campaigns, not four hundred tasks. And the largest is a single instruction
> repeated: describe the picture.
>
> Clearwren does this across a whole Confluence space. Free up to 10 users.

### 7 — Teach
> Contrast checkers usually lie to you about Confluence, for a specific reason.
>
> They measure your text against the page background. But Confluence text often sits
> inside an info panel, a warning panel, or a coloured table cell. Grey text that passes
> comfortably on white can fail badly on a pale yellow panel.
>
> If you are checking contrast, check it against what the text is actually sitting on.

### 8 — Law
> "We ran an accessibility audit" is not evidence. "We audited ten pages" is an anecdote.
>
> What a reviewer or a procurement officer is actually looking for:
>
> · A defined scope — "the knowledge base at docs.example.com, 1,240 pages"
> · A number covering all of it, not a sample
> · A date, because content changes daily
> · A trend, because nobody has a perfect space and everyone knows it
>
> "68% of 1,240 pages with no level A or AA failure, up from 41% in March" answers the
> question behind the question: are these people managing this, or hoping.

### 9 — Teach
> Roughly a third of WCAG cannot be checked by any tool, and any vendor telling you
> otherwise is selling something.
>
> A machine can tell you an image has no alt text. It cannot tell you whether "Figure 3"
> is an adequate description.
>
> It can tell you a video has no captions. It cannot tell you whether the captions are
> accurate.
>
> The point of automating the mechanical two thirds is not to replace the human review.
> It is to make the human review affordable, by leaving the reviewer only the part that
> genuinely needs judgement.

### 10 — Teach
> "Click here."
>
> Screen reader users routinely navigate by pulling up a list of every link on the page.
> On a page written this way, that list reads: click here, click here, read more, click
> here, this link.
>
> Write the destination into the link text. "Read the migration guide." It is better for
> everyone and costs nothing.

### 11 — Law
> A question worth asking your team this week: which of our Confluence spaces can someone
> read without logging in?
>
> That set — not the internal wiki — is what a regulator or a customer will look at, and
> in most organisations nobody has actually listed it.
>
> Start there. Internal spaces still matter for the colleagues who use them, but they are
> the second wave, not the first.

### 12 — Product
> Accessibility remediation without a check in the authoring flow is a treadmill. You fix
> four hundred pages over a quarter and authors quietly create three hundred more.
>
> The check has to be where the author is, while they are still on the page — not in a
> report that reaches them three months later, about a page they no longer remember writing.
>
> Clearwren puts it on the page itself, in Confluence, next to the byline.
