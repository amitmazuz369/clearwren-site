import json, sys, re
d = json.load(open("cloud_apps.json"))
terms = sys.argv[1:]
for t in terms:
    rx = re.compile(t, re.I)
    m = [a for a in d if rx.search(a["name"] or "") or rx.search(a["summary"] or "")]
    m.sort(key=lambda x:-(x["installs"] or 0))
    tot = sum(a["installs"] or 0 for a in m)
    print("### %-28s apps=%-4d totalInstalls=%d" % (t, len(m), tot))
    for a in m[:6]:
        print("     %6d %s*(%s) %-46s %s" % (a["installs"] or 0, a["stars"], a["reviews"] or 0, (a["name"] or "")[:46], (a["vendor"] or "")[:26]))
    print()
