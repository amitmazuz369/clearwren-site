#!/usr/bin/env python3
"""
Clearwren Morning Routine — Daily growth tasks
Run this every morning to:
1. Check Instagram token (refresh if needed)
2. Verify content posted on schedule
3. Generate daily engagement plan
4. Log metrics
"""
import json
import sys
from pathlib import Path
from datetime import datetime, timedelta

def load_config():
    """Load Clearwren config."""
    env_file = Path.home() / ".config" / "clearwren" / "instagram.env"
    config = {}
    for line in env_file.read_text().strip().split("\n"):
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            config[k.strip()] = v.strip()
    return config

def check_token():
    """Verify token is still valid."""
    import urllib.request
    import json as json_module

    config = load_config()
    token = config.get("IG_ACCESS_TOKEN")

    url = f"https://graph.instagram.com/v23.0/me?access_token={token}"
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            data = json_module.load(r)
            if "id" in data:
                print("✓ Token valid")
                return True
    except:
        print("⚠️  Token may be invalid — refresh recommended")
        return False

def get_daily_plan():
    """Generate today's engagement plan."""
    today = datetime.now()
    day_of_week = today.strftime("%A")

    plan = {
        "date": today.strftime("%Y-%m-%d"),
        "day": day_of_week,
        "tasks": []
    }

    # Daily: Comment on 5 posts
    plan["tasks"].append({
        "time": "9:00 AM",
        "task": "Comment on 5 posts in #confluence (100-1000 likes each)",
        "duration": "5 min",
        "example": "Great approach! We built Clearwren specifically for this..."
    })

    plan["tasks"].append({
        "time": "3:00 PM",
        "task": "Engage with @confluence + @atlassian (like/comment 3 posts)",
        "duration": "3 min",
        "example": "Love this insight on documentation accessibility"
    })

    plan["tasks"].append({
        "time": "3:00 PM",
        "task": "Follow 5 new Confluence/a11y accounts",
        "duration": "2 min",
        "example": "Look for CTOs, compliance, DevOps, tech writers"
    })

    plan["tasks"].append({
        "time": "6:00 PM",
        "task": "Reply to any DMs or comments on @clearwren posts",
        "duration": "5 min",
        "example": "Personalized response within 24h"
    })

    # Weekly posting schedule
    if day_of_week == "Tuesday":
        plan["tasks"].append({
            "time": "9:00 AM",
            "task": "PUBLISH: Next carousel (use ig_publish.py)",
            "duration": "2 min",
            "note": "Check spec is ready in docs/outreach/"
        })

    if day_of_week == "Friday":
        plan["tasks"].append({
            "time": "9:00 AM",
            "task": "PUBLISH: Next carousel (use ig_publish.py)",
            "duration": "2 min",
            "note": "Check spec is ready in docs/outreach/"
        })

    return plan

def log_metrics():
    """Load and display growth metrics."""
    metrics_file = Path.home() / ".clearwren" / "instagram_metrics.json"
    metrics_file.parent.mkdir(exist_ok=True)

    if not metrics_file.exists():
        metrics = {
            "start_date": datetime.now().isoformat(),
            "followers_start": 2,
            "daily_log": {}
        }
    else:
        metrics = json.loads(metrics_file.read_text())

    today = datetime.now().strftime("%Y-%m-%d")
    if today not in metrics["daily_log"]:
        metrics["daily_log"][today] = {
            "comments_made": 0,
            "accounts_followed": 0,
            "followers_end_of_day": 2,  # Manual entry
            "notes": ""
        }

    return metrics

def main():
    print("=" * 60)
    print("CLEARWREN MORNING ROUTINE")
    print(f"{datetime.now().strftime('%A, %B %d, %Y at %H:%M')}")
    print("=" * 60)
    print()

    # Check token
    print("1. Token Status")
    check_token()
    print()

    # Show daily plan
    print("2. Today's Plan (15 min total)")
    plan = get_daily_plan()
    for task in plan["tasks"]:
        print(f"   {task['time']} ({task.get('duration', '?')}): {task['task']}")
        if 'example' in task:
            print(f"            → {task['example']}")
    print()

    # Show metrics
    print("3. Weekly Progress")
    metrics = log_metrics()
    week_start = datetime.now() - timedelta(days=datetime.now().weekday())
    week_logs = {k: v for k, v in metrics["daily_log"].items()
                 if k >= week_start.strftime("%Y-%m-%d")}

    total_comments = sum(d.get("comments_made", 0) for d in week_logs.values())
    total_follows = sum(d.get("accounts_followed", 0) for d in week_logs.values())

    print(f"   Week comments: {total_comments}/35 (target)")
    print(f"   Week follows: {total_follows}/50 (target)")
    print()

    # Hashtag reminder
    print("4. Today's Hashtag Set")
    hashtags = "#Confluence #WCAG #Accessibility #A11y #WebAccessibility #ConfluenceCloud #Documentation #DigitalAccessibility #ADA #AccessibilityMatters #InclusiveDesign #DeveloperCommunity #DevTools #WCAG2.2 #AccessibilityFirst #ConfluenceUsers #ConfluenceCommunity #AtlassianApps #CloudNative #SaaS"
    print(f"   Use in all posts: {hashtags[:80]}...")
    print()

    print("=" * 60)
    print("👉 Start with morning comments (5 posts in #confluence)")
    print("=" * 60)

if __name__ == "__main__":
    main()
