#!/usr/bin/env python3
"""
Track Instagram growth metrics daily.
Run: python3 tools/clearwren_metrics.py log 35 7 "5 comments, 7 followers"
Run: python3 tools/clearwren_metrics.py report
"""
import json
import sys
from pathlib import Path
from datetime import datetime

METRICS_FILE = Path.home() / ".clearwren" / "instagram_metrics.json"

def init_metrics():
    """Initialize metrics file if needed."""
    METRICS_FILE.parent.mkdir(exist_ok=True)
    if not METRICS_FILE.exists():
        data = {
            "start_date": datetime.now().isoformat(),
            "followers_start": 2,
            "daily_log": {}
        }
        METRICS_FILE.write_text(json.dumps(data, indent=2))
    return json.loads(METRICS_FILE.read_text())

def log_day(comments, follows, followers_now, notes=""):
    """Log today's metrics."""
    metrics = init_metrics()
    today = datetime.now().strftime("%Y-%m-%d")

    metrics["daily_log"][today] = {
        "date": today,
        "comments_made": int(comments),
        "accounts_followed": int(follows),
        "followers_end_of_day": int(followers_now),
        "notes": notes,
        "timestamp": datetime.now().isoformat()
    }

    METRICS_FILE.write_text(json.dumps(metrics, indent=2))
    print(f"✓ Logged {comments} comments, {follows} follows, {followers_now} followers")

def report():
    """Show weekly/monthly progress."""
    metrics = init_metrics()
    logs = metrics["daily_log"]

    if not logs:
        print("No data yet. Run: python3 tools/clearwren_metrics.py log 5 5 50")
        return

    from datetime import timedelta

    # Week stats
    week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    week_logs = {k: v for k, v in logs.items() if k >= week_ago}

    if week_logs:
        total_comments = sum(v.get("comments_made", 0) for v in week_logs.values())
        total_follows = sum(v.get("accounts_followed", 0) for v in week_logs.values())
        followers_start_week = logs[min(week_logs.keys())]["followers_end_of_day"]
        followers_now = logs[max(week_logs.keys())]["followers_end_of_day"]

        print("=" * 60)
        print("CLEARWREN INSTAGRAM — WEEKLY REPORT")
        print("=" * 60)
        print()
        print(f"This week ({min(week_logs.keys())} to {max(week_logs.keys())}):")
        print(f"  Comments: {total_comments}/35 (target)")
        print(f"  Follows: {total_follows}/50 (target)")
        print(f"  Followers: {followers_start_week} → {followers_now} (+{followers_now - followers_start_week})")
        print(f"  Daily avg: {total_comments // len(week_logs) if week_logs else 0} comments, {total_follows // len(week_logs) if week_logs else 0} follows")
        print()

        # Show daily breakdown
        print("Daily breakdown:")
        for date in sorted(week_logs.keys()):
            log = week_logs[date]
            print(f"  {date}: {log['comments_made']} comments, {log['accounts_followed']} follows → {log['followers_end_of_day']} followers")

        print()
        print("=" * 60)
        print(f"Goal: 50 followers by Sept 22 (6 more days)")
        print(f"On track: {'✓ Yes' if followers_now >= 30 else '⚠️  Behind (need to increase engagement)'}")
        print("=" * 60)

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 tools/clearwren_metrics.py log <comments> <follows> <followers> [notes]")
        print("  python3 tools/clearwren_metrics.py report")
        print()
        print("Example:")
        print("  python3 tools/clearwren_metrics.py log 5 7 45 'Good engagement on contrast post'")
        sys.exit(1)

    if sys.argv[1] == "log":
        if len(sys.argv) < 5:
            print("ERROR: Need comments, follows, followers")
            sys.exit(1)
        notes = " ".join(sys.argv[5:]) if len(sys.argv) > 5 else ""
        log_day(sys.argv[2], sys.argv[3], sys.argv[4], notes)

    elif sys.argv[1] == "report":
        report()

    else:
        print(f"Unknown command: {sys.argv[1]}")

if __name__ == "__main__":
    main()
