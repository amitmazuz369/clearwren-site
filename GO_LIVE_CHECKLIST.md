# Clearwren Instagram — Go Live Checklist

**Status:** Ready to launch growth system
**Date:** Sept 16, 2026
**Goal:** 50 followers by Sept 22

---

## ✅ Pre-Launch (Today)

- [x] 2 carousels published (alt-text, contrast)
- [x] Bio & profile set up (clearwren.com link)
- [x] Tools built (publish, score, engage)
- [x] Morning routine script ready
- [x] Metrics tracker ready
- [x] Growth playbooks written
- [x] Hashtag list prepared

---

## 🚀 Launch Today (30 min setup)

### 1. Instagram Account (5 min)
**Go to Instagram on your phone/browser:**

- [ ] Open @clearwren profile
- [ ] Click "Edit Profile"
- [ ] Update bio:
  ```
  Confluence accessibility at scale.
  WCAG checker for Confluence Cloud.
  Free for teams up to 10 people.
  
  🔗 clearwren.com
  📧 partners@clearwren.com
  ```
- [ ] Save

### 2. First Post Pinning (2 min)
- [ ] Go to alt-text carousel (https://www.instagram.com/p/DdUhjowijKn/)
- [ ] Tap "⋯" → "Pin to profile"
- [ ] Go to contrast carousel (https://www.instagram.com/p/DdWURHYDaTH/)
- [ ] Tap "⋯" → "Pin to profile"

### 3. Daily Engagement Start (10 min)

**Open Instagram app:**

- [ ] Search #confluence in hashtags
- [ ] Find 5 posts with 100-1000 likes
- [ ] Write genuine 2-3 line comment on each
  - Example: "This approach to X is exactly what we're building for at Clearwren. Love seeing teams prioritize accessibility first."
- [ ] Like each post
- [ ] Follow the account

### 4. Follow Key Accounts (5 min)

**Search and follow these key accounts:**
- [ ] @confluence
- [ ] @atlassian
- [ ] @paulboag (accessibility expert)
- [ ] @WebAIM (a11y org)
- [ ] Search #confluence #wcag #a11y and follow 5 active posters

### 5. Set Reminders (2 min)

**On your phone, create 3 repeating reminders:**
- [ ] 9:00 AM: "Comment on 5 #confluence posts"
- [ ] 3:00 PM: "Engage with @confluence + follow 5 accounts"
- [ ] 6:00 PM: "Reply to DMs, log metrics"

### 6. Test Scripts (3 min)

**In terminal:**
```bash
cd ~/clearwren

# Test morning routine
python3 tools/clearwren_morning.py

# Test metrics logging
python3 tools/clearwren_metrics.py log 5 5 7 "Day 1 launch"

# Test metrics report
python3 tools/clearwren_metrics.py report
```

---

## 📅 Week 1 Daily Action (Sept 16-22)

**Each day:**
- [ ] 9 AM: Comment on 5 posts in #confluence
- [ ] 3 PM: Engage with @confluence (3 posts)
- [ ] 3 PM: Follow 5 new accounts
- [ ] 6 PM: Reply to DMs
- [ ] 6 PM: Log metrics: `python3 tools/clearwren_metrics.py log 5 5 <current_followers>`

**Tuesday (Sept 17):**
- [ ] Verify alt-text carousel posted ✓
- [ ] Pin to profile ✓
- [ ] Engagement starts

**Friday (Sept 19):**
- [ ] Verify contrast carousel posted ✓
- [ ] Pin to profile ✓
- [ ] Continue engagement

**Sunday (Sept 22):**
- [ ] Review weekly report: `python3 tools/clearwren_metrics.py report`
- [ ] Check if at 50 followers
- [ ] Celebrate! 🎉

---

## 📊 Success Metrics

| Milestone | Date | Target | Actual |
|-----------|------|--------|--------|
| 10 followers | Sept 18 | ✓ | ? |
| 30 followers | Sept 20 | ✓ | ? |
| 50 followers | Sept 22 | ✓ | ? |
| 100 followers | Sept 29 | ✓ | ? |

---

## 🛑 Troubleshooting

**No engagement on comments?**
- Make sure they're 2-3 sentences (not one word)
- Reference the post's specific topic
- Follow the account after commenting

**Followers plateauing?**
- Increase hashtag usage
- Comment on more competitive posts (500-2000 likes)
- Follow 10/day instead of 5

**Token expired?**
- Run: `python3 tools/ig_token.py`
- Automatically runs daily with morning routine

---

## 📝 Log Template

After each engagement session, log your metrics:

```bash
python3 tools/clearwren_metrics.py log <comments> <follows> <followers> "<notes>"

# Example:
python3 tools/clearwren_metrics.py log 5 7 45 "Great engagement on contrast post"
```

---

## ✨ Next Steps After Week 1

- Week 2: Publish headings carousel (Sept 24)
- Week 2: Publish link-text carousel (Sept 26)
- Week 3+: Continue daily engagement, watch metrics grow
- Week 4: Start DM outreach to top engaged followers

---

## 🎯 Remember

**15 min/day = 50+ followers in 1 week**

Just:
- Comment authentically (5 min)
- Follow relevant accounts (5 min)
- Reply to DMs (5 min)

That's it. No bots, no spam, no shortcuts.

**Go get 'em.** 🚀
