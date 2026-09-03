import json, datetime
d = json.load(open("cloud_apps.json"))
def ts(a):
    lm = a.get("lastModified")
    return lm[:10] if lm else "?"
print("=== A. HIGH INSTALLS + LOW RATING (>=600 installs, stars<=3.7, >=5 reviews) ===")
c = [a for a in d if (a["installs"] or 0)>=600 and (a["stars"] or 5)<=3.7 and (a["reviews"] or 0)>=5]
for a in sorted(c, key=lambda x:-x["installs"])[:30]:
    print("%7d  %.1f* (%3d)  %-11s %-52s | %s" % (a["installs"], a["stars"], a["reviews"], ts(a), a["name"][:52], ",".join(a["categories"][:2])))
print()
print("=== B. HIGH INSTALLS + STALE (>=1000 installs, lastModified < 2025) ===")
c = [a for a in d if (a["installs"] or 0)>=1000 and (a.get("lastModified") or "9")[:4] < "2025"]
for a in sorted(c, key=lambda x:-x["installs"])[:30]:
    print("%7d  %s* (%3d)  %-11s %-52s | %s" % (a["installs"], a["stars"], a["reviews"] or 0, ts(a), a["name"][:52], ",".join(a["categories"][:2])))
