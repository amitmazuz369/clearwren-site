import json, time, urllib.request, sys

BASE = "https://marketplace.atlassian.com"

def get(path):
    req = urllib.request.Request(BASE + path, headers={"Accept": "application/json", "User-Agent": "market-research/1.0"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.loads(r.read().decode())
        except Exception as e:
            if attempt == 3:
                raise
            time.sleep(2 * (attempt + 1))

rows, offset, limit = [], 0, 50
while True:
    d = get(f"/rest/2/addons?hosting=cloud&limit={limit}&offset={offset}")
    apps = d.get("_embedded", {}).get("addons", [])
    if not apps:
        break
    for a in apps:
        emb = a.get("_embedded", {})
        dist = emb.get("distribution") or {}
        rev = emb.get("reviews") or {}
        rows.append({
            "key": a.get("key"),
            "name": a.get("name"),
            "summary": a.get("summary"),
            "vendor": (emb.get("vendor") or {}).get("name"),
            "topVendor": bool(((emb.get("vendor") or {}).get("programs") or {}).get("topVendor")),
            "installs": dist.get("totalInstalls"),
            "downloads": dist.get("downloads"),
            "stars": rev.get("averageStars"),
            "reviews": rev.get("count"),
            "categories": [c.get("name") for c in emb.get("categories", []) if c.get("name")],
            "lastModified": emb.get("lastModified"),
        })
    offset += limit
    sys.stderr.write(f"\rfetched {len(rows)}")
    sys.stderr.flush()
    if offset > 6500:
        break
    time.sleep(0.15)

json.dump(rows, open("cloud_apps.json", "w"))
sys.stderr.write(f"\nDONE {len(rows)}\n")
