# Atlassian Community — drafted replies

Ground rules I applied to every draft below:

- Answer the question completely **without** the app. If the reply is only useful to
  someone who buys something, it is an advert and will be treated as one.
- Disclose the relationship in the first person, in one clause, every time.
- Link the guide, not the listing. The guide is the thing that is useful to a reader
  who never buys.
- Never post the same text twice. Atlassian's community moderation treats repeated
  boilerplate across threads as spam, correctly.

**Posting requires the owner's account.** These are ready to paste; I do not post
publicly without approval.

---

## 1. "Compliance with EAA Accessibility laws"
`community.atlassian.com/forums/Confluence-questions/Compliance-with-EAA-Accessibility-laws/qaq-p/2985036`
Posted March 2025 · accepted answer says "ask Atlassian Support" · **still the top
Google result for Confluence + EAA**, which is why it is worth answering well.

> There are two separate questions hiding in this one, and the answer is different for each.
>
> **The product.** Whether Confluence's own editor, dialogs and navigation meet the
> standard is Atlassian's responsibility, and their VPAT for the relevant product is the
> document that answers it. The button-labelling and tab-order problems you found with NVDA
> belong here — worth reporting through the accessibility portal, since they can only be
> fixed upstream.
>
> **Your content.** If what you publish out of Confluence is a public-facing service —
> customer documentation, a help centre, a knowledge base — then under the EAA the *content*
> is in scope too, and no VPAT from Atlassian covers it. Whether your screenshots have alt
> text, whether your tables have header rows, whether your links say something other than
> "click here": that is yours.
>
> In practice the second question is the one that bites, because most teams answer it with
> a document that only addresses the first. If you are auditing, I would start by listing
> which spaces are reachable without logging in, then measure those against WCAG 2.1 AA
> before fixing anything, so you have a baseline to show a reviewer.
>
> Disclosure: I build an accessibility checker for Confluence, so I have an interest here.
> Ignoring that entirely, I wrote up what the EAA actually requires of content published
> from Confluence — no signup, it is just the explanation:
> https://clearwren.com/guide-eaa.html

---

## 2. "Is Confluence Site ADA Compliant?"
`community.atlassian.com/forums/Confluence-questions/Is-Confluence-Site-ADA-Compliant/qaq-p/2815597`
Posted September 2024 · **not marked solved** · both replies say "read the VPAT".

> "Is Confluence ADA compliant" does not quite have an answer, because the ADA does not
> certify software. What it does is create an obligation on *you*, and then the question
> becomes whether the thing you are publishing meets a standard — in practice WCAG 2.1 AA,
> which is what the April 2024 Title II rule names explicitly for public entities.
>
> So the useful version of the question is: is *your Confluence site* accessible. Two parts:
>
> 1. The platform. Atlassian's VPAT for Confluence Cloud covers the interface. Attach it
>    when someone asks about the product.
> 2. Your pages. Not covered by anything Atlassian publishes. Alt text, heading structure,
>    table headers, contrast, link text — all authored by your team, all testable.
>
> If a deadline is driving this, the Department of Justice extended both dates in April
> 2026: entities serving populations of 50,000 or more now have until 26 April 2027, and
> smaller entities and special districts until 26 April 2028. Worth knowing that a state
> university's population is read as the state's population, not its enrolment, so almost
> every state university sits in the 2027 group.
>
> The second part is where the work is, and it is worth measuring the whole space before
> you start fixing, so you can show a trend rather than an assertion.
>
> Disclosure: I make a tool in this space. The write-up below is the standards explanation
> on its own, which is the part that answers your question:
> https://clearwren.com/guide-ada-title-ii.html

---

## 3. "How to set a Column as a header for each row in Confluence tables with a screen reader"
`community.atlassian.com/forums/Confluence-questions/How-to-set-a-Column-as-a-header-for-each-row-in-Confluence/qaq-p/1936758`
A concrete how-to question. Answer it concretely; no link needed unless it helps.

> In the Cloud editor: click into the table, use the column control at the top of the first
> column, and choose **Header column**. That sets the first column as row headers, which is
> what a screen reader needs to announce "Region: North" instead of reading a bare grid.
>
> Two things worth knowing:
>
> - **Header row and header column are separate settings.** A table used as a matrix needs
>   both. A simple list of records usually needs only the header row.
> - **A merged cell in the header breaks it.** Screen readers cannot reliably resolve which
>   header applies to which cell once the header row spans columns. If you need a grouping
>   label, put it in a heading above the table instead.
>
> The one that catches people out is a table whose first row is just bold text rather than an
> actual header row — it looks identical and carries none of the meaning.

---

## 4. "WCAG Compliance — accessible text for images, buttons and icons"
`community.atlassian.com/forums/Confluence-questions/WCAG-Compliance-accessible-text-for-images-buttons-and-icons/qaq-p/2809358`
Mixes platform bugs with content problems. Separating them *is* the answer.

> Splitting your list, because the two halves go to different places:
>
> **Atlassian's to fix** — search icons with no discernible text, incorrect ARIA roles,
> iframes without titles in the product chrome. Report through the accessibility portal;
> nothing you do in your own pages will change these.
>
> **Yours to fix** — images inside your pages. Every image in the editor has an alt text
> field; decorative images should be given an empty alt rather than left blank-by-default,
> because "blank because nobody filled it in" and "blank because it is decorative" are
> indistinguishable to a checker and to a reviewer.
>
> The distinction matters for more than tidiness: if a procurement questionnaire asks about
> accessibility and you answer with Atlassian's VPAT, you have answered the first half only.
>
> Disclosure: I build in this area. On alt text specifically, including what to do with
> screenshots and diagrams where "a screenshot" is not a description:
> https://clearwren.com/guide-alt-text.html
