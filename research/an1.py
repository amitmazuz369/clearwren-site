import json, statistics as st
from collections import defaultdict
d = json.load(open("cloud_apps.json"))
ins = [a["installs"] or 0 for a in d]
ins.sort()
def pct(p): return ins[int(len(ins)*p)]
print("APPS:", len(d))
print("installs percentiles: p50=%d p75=%d p90=%d p95=%d p99=%d max=%d" % (pct(.5),pct(.75),pct(.9),pct(.95),pct(.99),ins[-1]))
print("apps with >=100 installs:", sum(1 for x in ins if x>=100))
print("apps with >=500 installs:", sum(1 for x in ins if x>=500))
print("apps with 0 installs:", sum(1 for x in ins if x==0))
print()
cat = defaultdict(list)
for a in d:
    for c in a["categories"]:
        cat[c].append(a)
print("%-42s %5s %8s %8s %8s %6s" % ("CATEGORY","apps","medInst","p90Inst","sumInst","avg*"))
rows=[]
for c, apps in cat.items():
    i = sorted(a["installs"] or 0 for a in apps)
    stars = [a["stars"] for a in apps if a["stars"]]
    rows.append((c, len(apps), i[len(i)//2], i[int(len(i)*.9)], sum(i), round(st.mean(stars),2) if stars else 0))
for r in sorted(rows, key=lambda x:-x[2])[:45]:
    print("%-42s %5d %8d %8d %8d %6s" % r)
