# Clearwren Instagram Growth Playbook

**Goal:** Reach decision-makers who need Confluence accessibility tooling.
**Cadence:** Daily (15-30 min), weekly review.
**Expected:** 2-3 qualified conversations/month, 1+ trial by month 2.

---

## Phase 1: Prospect Identification (Week 1)

### Manual: Score Current Followers
Visit `@clearwren` followers and log prospects in a spreadsheet:

| Username | Name | Role | Score | Bio Snippet | Messaged | Response |
|----------|------|------|-------|-------------|----------|----------|
| @john_cto | John Smith | CTO | 30 | "engineering" | — | — |
| @sarah_ops | Sarah Chen | DevOps | 25 | "platform eng" | — | — |

### Scoring Rules
- **+30 points**: CTO, VP Eng, Eng Manager, Head of Engineering
- **+25 points**: DevOps, Platform Eng, SRE, Infra Lead  
- **+20 points**: Compliance, Legal, Risk, Audit, Accessibility Officer
- **+10 points**: Tech Writer, Documentation Lead
- **+5 points**: Base (follower)
- **+10 points**: SaaS/FinTech company mention

### Focus: Top 30-50 prospects (score >15)

---

## Phase 2: Personalized Outreach (Weeks 2-4)

### Template Selection by Profile

#### For CTOs / Tech Leaders (Score 30+)
```
Hi [Name]! Saw you're leading engineering/tech — we just published 
research on Confluence accessibility (83% of sites fail contrast tests). 
Built a tool to automate the checks. Worth checking out if your org cares 
about doc quality. See our latest posts 👋
```

#### For DevOps / Platform Engineers (Score 25+)
```
[Name] — building platform tooling? We shipped a Confluence accessibility 
checker that works in Atlassian Forge (zero external deps). Might fit 
if you own documentation quality gates. Check us out 🔧
```

#### For Compliance / Legal (Score 20+)
```
Hi [Name], quick note: 57% of public Confluence spaces don't meet WCAG 2.2. 
Built a one-click audit tool for this. Free for teams <10 people. 
Might be relevant for your compliance roadmap. DM if curious 📋
```

#### For Tech Writers (Score 10+)
```
[Name] 👋 — thought you'd find our Confluence accessibility study 
interesting. Check our latest posts, feedback welcome!
```

### Execution Rules
1. **5-10 messages per day**, not all at once
2. **Wait 3-5 days** before follow-up
3. **Reference specific posts** ("loved your comment on...")
4. **Don't hard-sell**: "would love your thoughts" not "sign up now"
5. **Track response rate**: aim for 10-15% (industry cold DM average)

---

## Phase 3: Engagement & Conversion (Weeks 3+)

### Response Patterns
- ✅ **Liked a post** → Wait 2 days, then DM: "saw you engaged..."
- ✅ **Replied to DM** → Schedule 15-min call, share access link
- ✅ **Visited profile** → No action (they saw us)
- ❌ **No response** → One follow-up after 1 week, then archive

### Call Framework
1. **0-2 min**: "What are your biggest doc quality challenges in Confluence?"
2. **2-5 min**: Show one screenshot (contrast failure, alt text missing)
3. **5-7 min**: "Here's how Clearwren catches these automatically"
4. **7-10 min**: "Free for 10 people — want to try it on your test space?"
5. **10-15 min**: Answer questions, send installation link

### Conversion Goals
- **Week 1**: Schedule call
- **Week 2**: Install on test space
- **Week 3**: Run one audit
- **Week 4**: Upgrade or extend trial

---

## Tools & Workflow

### 1. Prospect Scoring
```bash
cd ~/clearwren
# Interactive entry
python3 tools/ig_score_prospects.py

# Batch import (from CSV)
python3 tools/ig_score_prospects.py prospects.csv > prospects_scored.json
```

### 2. DM Generation
```bash
# Generate personalized DMs
python3 tools/ig_dm_templates.py
# Outputs: outreach_dms_ready.json
```

### 3. Post Publishing
```bash
# Create carousel spec
# Check: docs/outreach/instagram-03.json (contrast example)

# Publish
python3 tools/ig_publish.py docs/outreach/instagram-XX.json
```

### 4. Tracking Spreadsheet (Google Sheets)
Keep one live sheet:
- Prospect list (username, name, role, score)
- Outreach log (date messaged, template used, response)
- Conversion funnel (contacted → replied → called → trial → paid)

---

## Weekly Rhythm

### Monday 9am: Plan the week
1. Review last week's responses
2. Pick 7-8 new prospects (highest score first)
3. Schedule outreach: 1-2 messages/day Mon-Fri
4. Note any follow-ups due

### Friday 5pm: Weekly Review
1. How many DMs sent? (target: 5-10)
2. Response rate? (target: 10-15%)
3. Any calls scheduled? (target: 1-2/week by week 3)
4. Next week's focus prospects

---

## Content Pillars for Posts

Post on themes that naturally attract our audience:

1. **Research findings** (10 min read)
   - "57% of Confluence spaces fail WCAG 2.2"
   - "6 checks account for 87% of issues"
   - "Contrast failures hit 83% of sites"

2. **How-to guides** (2 min read)
   - "Fix alt text in Confluence in 5 min"
   - "Check heading hierarchy (3 steps)"
   - "Test contrast for accessibility"

3. **Tool updates** (2 min read)
   - "We added real-time scanning"
   - "Export reports to PDF"
   - "New Marketplace version live"

4. **Industry news** (1 min read)
   - "WCAG 2.2 is official (what changed)"
   - "New accessibility lawsuit trends"
   - "Why Confluence accessibility matters"

**Cadence:** 1 new post per week (posted as carousel, 3-5 slides).

---

## Success Metrics

### Month 1
- 50 qualified prospects identified
- 25-30 outreach messages sent
- 2-3 responses (8-10% rate)
- 0-1 calls scheduled

### Month 2
- 50 more prospects scored
- 40-50 messages sent (cumulative)
- 5-6 responses
- 2-3 calls scheduled
- 1 trial install

### Month 3
- 100+ total prospects in funnel
- 60+ messages sent
- 8+ responses
- 3-4 calls
- 2+ trial installs
- 1 paying customer

---

## Troubleshooting

**"Getting zero responses"**
→ Check: is your bio clear? Are DMs personalized or templated? Try different templates.

**"People respond but don't want to talk"**
→ They're interested but not urgent. Follow up in 2 weeks: "saw your response — still open to a quick call?"

**"Can't find enough CTOs/compliance people"**
→ Expand to: tech writers (alt text advocates), product managers (doc quality), customer success (support burden from bad docs).

**"Messages get auto-muted"**
→ DM-spam detection kicks in if you send 20+ identical messages. Keep templates varied. Space out sends (max 10/day).

---

## Next Steps

1. **This week**: Score top 50 followers, compile to CSV
2. **Next week**: Generate 5 DM templates, send first 10 messages
3. **Week 3**: Review responses, schedule calls
4. **Week 4+**: Iterate based on what templates work
