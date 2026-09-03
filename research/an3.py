import json
from collections import Counter
d = json.load(open("cloud_apps.json"))
# vendors with few apps = solo/small shops, in the winnable band
vc = Counter(a["vendor"] for a in d)
band = [a for a in d if 300 <= (a["installs"] or 0) <= 6000 and (a["stars"] or 0) >= 4.3 and (a["reviews"] or 0) >= 10]
small = [a for a in band if vc[a["vendor"]] <= 6]
print("apps in winnable band:", len(band), "| from small vendors (<=6 apps):", len(small))
print()
for a in sorted(small, key=lambda x:-x["installs"])[:40]:
    print("%6d %.1f*(%3d) %-38s %-30s %s" % (a["installs"],a["stars"],a["reviews"],a["name"][:38],a["vendor"][:30],",".join(a["categories"][:2])))
