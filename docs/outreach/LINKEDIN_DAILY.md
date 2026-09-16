# LinkedIn Daily Checklist — 15 Minutes

**Do this every morning. Seriously.**

---

## ✅ Step 1: Find Posts (5 min)

### Open LinkedIn

Go to **linkedin.com/feed**

### Search One Keyword

Pick one from this list (rotate daily):
- `#confluence accessibility`
- `#WCAG compliance`
- `confluence documentation`
- `#accessibility engineering`
- `confluence cloud`

Or use company search:
- Search for a company (Microsoft, Google, Amazon, etc.)
- Click "People" 
- Filter for CTOs, engineering managers
- View their posts

### Find 3 Good Posts

Look for posts with:
- 20-500 reactions (sweet spot for engagement)
- 5-100 comments (active discussion, not dead)
- Posted in last 7 days
- About: Confluence, documentation, accessibility, WCAG, compliance

**Examples of good posts:**
- "Just migrated our docs to Confluence Cloud..."
- "Accessibility isn't optional..."
- "Our team's documentation standards..."
- "WCAG compliance just became mandatory for us..."

---

## ✅ Step 2: Comment on Each (3-5 min total)

### Post 1: Read caption, pick template

**If it's about documentation/process:**
```
This resonates. We measured this exact gap across Confluence instances 
and the data is sobering. Most teams have no idea until they audit.
```

**If it's about accessibility:**
```
Completely agree. We found 57% of public Confluence spaces 
don't meet WCAG 2.2. The gap between deployed and actually accessible 
is massive. Worth building into your process.
```

**If it's about compliance/regulatory:**
```
The liability exposure is real. We audited 13 sites and found 
57% had accessibility gaps. Worth prioritizing before regulators ask.
```

**If you're not sure:**
```
Great post. The disconnect between "compliant" and "actually accessible" 
is huge. Most teams don't realize until someone audits. Worth the priority.
```

### Post 2: Comment

Use a different template. Change a few words.

### Post 3: Comment

Use another template. Make it slightly different.

---

## ✅ Step 3: Like + Follow (2 min)

After each comment:
1. Click ❤️ to like the post
2. Click their name to view their profile
3. Click "Follow" button

Do this for all 3 posts.

---

## ✅ Step 4: Follow 5 More People (3 min)

### Search for titles:

Copy-paste this into LinkedIn search:
```
confluence AND (CTO OR "VP Engineering" OR manager OR engineer)
```

Or:

```
accessibility OR WCAG AND (compliance OR officer OR director)
```

Or:

```
confluence AND documentation
```

### When you find someone:
- Click their profile (2 sec)
- If they work on Confluence/accessibility/docs, click "Follow"
- Do this 5 times

---

## ✅ Step 5: Respond to Comments (2 min)

Go to: **linkedin.com/mynetwork/notifications**

Look for comments on **your** Clearwren posts.

If anyone commented:
- Click on the comment
- Write a short reply (1-2 sentences)
- Hit "Post"

Example reply:
```
Thanks for the engagement! Exactly why we built Clearwren — 
these gaps compound fast. Would love to chat about your use case.
```

---

## 🎯 Daily Target

By end of day:
- [ ] 3 comments posted
- [ ] 3 posts liked
- [ ] 3 new accounts followed
- [ ] 5 more people followed (from search)
- [ ] Replied to any comments on YOUR posts

**Total time: 15 minutes**

---

## 📊 Log It

At end of day, run:
```bash
python3 ~/clearwren/tools/clearwren_metrics.py log 3 8 <your_current_followers> "LinkedIn: 3 comments, 8 follows"
```

(3 = comments, 8 = total follows, fill in your follower count)

---

## Weekly Checklist

**Every Sunday:**

Run:
```bash
python3 ~/clearwren/tools/clearwren_metrics.py report
```

Check:
- [ ] 21 comments posted (3/day × 7)
- [ ] 56 people followed (8/day × 7)
- [ ] New followers gained (target: 15+)
- [ ] Any direct messages / profile views

---

## Pro Tips

**What works:**
- Specific numbers ("57%", "1,179 pages")
- Genuine questions ("How are you handling...?")
- Industry/role specific comments
- 2-3 sentences (not one-liners)

**What doesn't work:**
- Selling in first comment
- Generic praise ("Love this!")
- Same comment on multiple posts
- Links to your site
- All caps or emoji spam

**If you get a DM:**
Reply within 24 hours. Keep it conversational.

---

## First Day (Do This Now)

1. Open LinkedIn
2. Search `#confluence accessibility`
3. Find 3 posts with 50-300 reactions
4. Comment on each using templates
5. Like each post
6. Follow each author
7. Follow 5 more people (search for CTOs or compliance)
8. Check for any Clearwren post comments, reply

**Time: 20 minutes. Go.**

---

## Next 30 Days

- Do this every day
- Log your metrics weekly
- By Oct 7: 100+ new followers from LinkedIn
- By Oct 31: 2-3 trial signups from LinkedIn engagement

**That's it. Consistency wins.**
