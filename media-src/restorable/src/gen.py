import os
ICON=open('restorable-icon.svg').read().replace('width="512" height="512"','width="100%" height="100%"')
WREN='''<svg viewBox="0 0 512 512" width="100%" height="100%" aria-hidden="true"><rect width="512" height="512" rx="112" fill="#1c5d99"/><g transform="translate(-13 -25)"><path d="M222 340 V420.8 M258 340 V400" stroke="#fff" stroke-width="14" stroke-linecap="round"/><path d="M150 374 L206 430 L386 326" fill="none" stroke="#f2b544" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/><path d="M178 234 L128 138" stroke="#fff" stroke-width="44" stroke-linecap="round"/><ellipse cx="238" cy="272" rx="100" ry="80" fill="#fff"/><circle cx="330" cy="204" r="54" fill="#fff"/><path d="M378 189 L430 204 L378 219 Z" fill="#fff" stroke="#fff" stroke-width="4"/><circle cx="342" cy="194" r="10" fill="#1c5d99"/></g></svg>'''
CSS='''
@page{margin:0}*{box-sizing:border-box;margin:0}
:root{--navy:#0f2a44;--ink:#14202e;--mut:#4a5a6c;--bg:#f4f7fa;--blue:#1c5d99;--amb:#f2b544;--line:#d3dce6;--red:#b3261e;--grn:#1f7a4d}
body{font-family:Inter,system-ui,sans-serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}
h1,h2,.d{font-family:'Inter Display',Inter,sans-serif;letter-spacing:-.02em}
.ico{display:block}
.card{background:#fff;border:2px solid var(--line);border-radius:22px;overflow:hidden}
.mockc{background:#fff;border:2px solid var(--line);border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:12px}
.ln{height:10px;border-radius:5px;background:#d8e0e8}
.pill{display:inline-block;font-weight:700;border-radius:999px;color:#fff;padding:6px 14px;font-size:20px}
.shot{overflow:hidden;border:2px solid var(--line);border-radius:14px;background:#f4f6f8}
.shot img{display:block;width:100%}
'''
def clar_mock(s=1):
    return f'''<div class="mockc" style="transform:scale({s});transform-origin:top left;width:{100/s}%">
<div style="font-weight:800;font-size:26px">Course Materials Policy</div>
<div style="display:flex;gap:14px"><div style="width:42%;height:130px;border-radius:10px;background:#c8d6e5;outline:4px solid var(--red);outline-offset:3px"></div><div style="flex:1;display:flex;flex-direction:column;gap:10px;padding-top:6px"><div class="ln" style="width:90%"></div><div class="ln" style="width:70%;background:#b9c4cf"></div><div class="ln" style="width:80%;background:#b9c4cf"></div></div></div>
<div style="display:flex;gap:10px;flex-wrap:wrap"><span class="pill" style="background:var(--red)">No alternative text</span><span class="pill" style="background:#b86e00">Bold, not a heading</span><span class="pill" style="background:var(--red)">Contrast 2.5 : 1</span></div></div>'''
def page(w,h,body,extra=''):
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}{extra}</style></head><body style="width:{w}px;height:{h}px;overflow:hidden">{body}</body></html>'

def crop(src,x0,y0,w,h,cw,extra=''):
    k=cw/w;return f'<div class="shot" style="width:{cw}px;height:{int(h*k)}px;position:relative;{extra}"><img src="{src}" style="position:absolute;width:{1840*k}px;left:{-x0*k}px;top:{-y0*k}px"></div>'
files={}
# ---------- hero 1600x900
hero=f'''<div style="width:1600px;height:900px;background:var(--bg);padding:64px 80px;position:relative">
<div style="display:flex;align-items:center;gap:16px"><div style="width:52px;height:52px">{WREN}</div><div style="font-size:34px;font-weight:700">Clearwren</div></div>
<h1 style="font-size:70px;line-height:1.05;margin-top:36px;max-width:1100px">Two small apps for Atlassian Cloud.</h1>
<div style="display:flex;gap:40px;position:absolute;left:80px;right:80px;bottom:64px;top:290px">
 <div class="card" style="flex:1;padding:36px 40px;display:flex;flex-direction:column;gap:16px"><div style="display:flex;align-items:baseline;gap:14px"><div class="d" style="font-size:54px;font-weight:800;color:var(--blue)">Clarable</div><div style="font-size:26px;font-weight:700;color:var(--mut)">for Confluence</div></div><div style="font-size:28px;line-height:1.3;color:var(--ink)">Accessibility checks for Confluence Cloud pages, with a dated record.</div><div style="margin-top:auto">{clar_mock()}</div></div>
 <div class="card" style="flex:1;padding:36px 40px;display:flex;flex-direction:column;gap:16px"><div style="display:flex;align-items:center;gap:18px"><div style="width:64px;height:64px;flex:none">{ICON}</div><div style="display:flex;align-items:baseline;gap:14px"><div class="d" style="font-size:54px;font-weight:800;color:var(--blue)">Restorable</div><div style="font-size:26px;font-weight:700;color:var(--mut)">for Jira</div></div></div><div style="font-size:28px;line-height:1.3">Restore deleted work items, with the old comments quoted.</div><div style="margin-top:auto">{crop("1-deleted-list.png",110,340,1260,260,640)}</div></div>
</div></div>'''
files['hero-1600x900']=(1600,900,hero)
# ---------- OG images 1200x630
og_c=f'''<div style="width:1200px;height:630px;background:var(--navy);color:#fff;padding:70px 80px;display:flex;flex-direction:column;justify-content:center;gap:24px">
<div style="display:flex;align-items:center;gap:26px"><div style="width:130px;height:130px">{WREN}</div><div class="d" style="font-size:110px;font-weight:800">Clearwren</div></div>
<div style="font-size:44px;color:#c9d8e8;font-weight:500;max-width:900px;line-height:1.25">Small apps for Atlassian Cloud: Clarable for Confluence, Restorable for Jira.</div></div>'''
files['og-clearwren-1200x630']=(1200,630,og_c)
og_cl=f'''<div style="width:1200px;height:630px;background:var(--bg);padding:64px 70px;display:flex;gap:50px;align-items:center">
<div style="flex:1"><div class="d" style="font-size:112px;font-weight:800;color:var(--blue);line-height:1">Clarable</div><div style="font-size:42px;line-height:1.25;margin-top:22px;font-weight:600">Accessibility checks for Confluence Cloud.</div><div style="font-size:28px;color:var(--mut);margin-top:22px">by Clearwren</div></div>
<div style="width:470px">{clar_mock()}</div></div>'''
files['og-clarable-1200x630']=(1200,630,og_cl)
og_r=f'''<div style="width:1200px;height:630px;background:var(--bg);padding:64px 70px;display:flex;gap:50px;align-items:center">
<div style="flex:1"><div style="display:flex;align-items:center;gap:22px"><div style="width:110px;height:110px;flex:none">{ICON}</div><div class="d" style="font-size:96px;font-weight:800;color:var(--blue);line-height:1">Restorable</div></div><div style="font-size:42px;line-height:1.25;margin-top:26px;font-weight:600">Restore deleted work items in Jira.</div><div style="font-size:28px;color:var(--mut);margin-top:22px">by Clearwren</div></div>
{crop("1-deleted-list.png",110,260,1100,340,500)}</div>'''
files['og-restorable-1200x630']=(1200,630,og_r)
# ---------- social posts 1080x1080 (soon / now)
def foot(now):
    t='Now on the Atlassian Marketplace' if now else 'Coming soon to the Atlassian Marketplace'
    return f'<div style="position:absolute;left:70px;right:70px;bottom:56px;display:flex;justify-content:space-between;align-items:center"><div style="display:flex;align-items:center;gap:14px"><div style="width:52px;height:52px">{ICON}</div><div style="font-size:30px;font-weight:700">Restorable</div><div style="font-size:24px;color:var(--mut)">by Clearwren</div></div><div style="background:var(--amb);color:var(--navy);font-weight:700;font-size:24px;border-radius:999px;padding:12px 24px">{t}</div></div>'
def post(n,now):
    if n==1:
        b=f'''<div style="width:1080px;height:1080px;background:var(--navy);color:#fff;padding:90px 80px;position:relative"><div style="font-size:26px;letter-spacing:.06em;font-weight:700;color:var(--amb);text-transform:uppercase">Jira Cloud</div><h1 style="font-size:112px;line-height:1.02;margin-top:40px">No recycle bin for a single work item.</h1><div style="font-size:38px;line-height:1.35;color:#c9d8e8;margin-top:44px;max-width:900px">Delete one by mistake and the item and its comments are gone. Atlassian’s own restore request, JRACLOUD-36415, has been open since 2014.</div>{foot(now).replace('var(--ink)','#fff').replace('color:var(--mut)','color:#9fb4c9').replace('<div style="font-size:30px;font-weight:700">','<div style="font-size:30px;font-weight:700;color:#fff">')}</div>'''
    if n==2:
        b=f'''<div style="width:1080px;height:1080px;background:var(--bg);padding:80px;position:relative"><h1 style="font-size:84px;line-height:1.05">Restore it in one click.</h1><div style="margin-top:44px">{crop("2-restored.png",110,260,1260,330,920)}</div><div style="font-size:36px;line-height:1.35;margin-top:36px;max-width:900px">Restorable recreates the item with its summary, description, type, priority, labels, reporter, status and links. Old comments come back quoted, with author and time.</div>{foot(now)}</div>'''
    if n==3:
        items=['Attached files are listed, not restored.','The new item gets a new key. A comment records the old one.','Work logs and history are not restored.','Only items created or changed after install are protected.','Copies of deleted items are kept 90 days.']
        li=''.join(f'<div style="display:flex;gap:18px;align-items:flex-start"><div style="width:14px;height:14px;border-radius:50%;background:var(--amb);margin-top:16px;flex:none"></div><div style="font-size:38px;line-height:1.3;font-weight:{700 if i==0 else 500}">{t}</div></div>' for i,t in enumerate(items))
        b=f'''<div style="width:1080px;height:1080px;background:#fff;padding:80px;position:relative"><div style="font-size:26px;letter-spacing:.06em;font-weight:700;color:var(--blue);text-transform:uppercase">What it does not do</div><h1 style="font-size:78px;line-height:1.05;margin-top:22px">The honest limits.</h1><div style="display:flex;flex-direction:column;gap:22px;margin-top:44px">{li}</div><div style="font-size:28px;color:var(--mut);margin-top:34px">Runs on Atlassian. Copies stay in your own Jira site.</div>{foot(now)}</div>'''
    return b
for n in (1,2,3):
    for now in (0,1):
        files[f'social-post{n}-{"now" if now else "soon"}-1080x1080']=(1080,1080,post(n,now))
# ---------- carousel (5 slides 1080x1350) for Restorable
def slide(i,inner,dark=False):
    bg='var(--navy)' if dark else 'var(--bg)';col='#fff' if dark else 'var(--ink)'
    return f'<section style="width:1080px;height:1350px;position:relative;overflow:hidden;background:{bg};color:{col};padding:90px 84px;page-break-after:always;break-after:page">{inner}<div style="position:absolute;left:84px;right:84px;bottom:56px;display:flex;justify-content:space-between;font-size:28px;font-weight:600;color:{"#c9d8e8" if dark else "var(--mut)"}"><span style="display:flex;gap:12px;align-items:center"><span style="width:38px;height:38px;display:inline-block">{ICON}</span>Restorable by Clearwren</span><span>{i} / 5</span></div></section>'
S=[]
S.append(slide(1,'<div style="font-size:28px;letter-spacing:.06em;font-weight:700;color:var(--amb);text-transform:uppercase">For Jira Cloud</div><h1 style="font-size:116px;line-height:1.02;margin-top:50px">Deleted a work item by mistake?</h1><div style="font-size:42px;line-height:1.35;color:#c9d8e8;margin-top:50px;max-width:880px">What happens next, and what Restorable can and cannot bring back.</div>',True))
S.append(slide(2,'<div style="font-size:28px;letter-spacing:.06em;font-weight:700;color:var(--blue);text-transform:uppercase">The problem</div><h1 style="font-size:92px;line-height:1.05;margin-top:30px">Jira Cloud has no recycle bin for a single work item.</h1><div style="font-size:42px;line-height:1.35;margin-top:50px">Once deleted, the item and its comments are gone.</div><div style="margin-top:44px;font-size:36px;line-height:1.35;color:var(--mut)">Atlassian’s own request to restore deleted work items, JRACLOUD-36415, has been open since 2014.</div>'))
S.append(slide(3,f'<div style="font-size:28px;letter-spacing:.06em;font-weight:700;color:var(--blue);text-transform:uppercase">What Restorable does</div><h1 style="font-size:72px;line-height:1.05;margin-top:24px">Keeps a copy. Restores in one click.</h1><div style="margin-top:40px">{crop("1-deleted-list.png",110,340,1260,260,912)}</div><div style="font-size:36px;line-height:1.35;margin-top:34px">The copy lives inside your own Jira site. Restore recreates the item with summary, description, type, priority, labels, reporter, status and links. Sub-tasks come back under their restored parent.</div>'))
S.append(slide(4,f'<div style="font-size:28px;letter-spacing:.06em;font-weight:700;color:var(--blue);text-transform:uppercase">Comments</div><h1 style="font-size:78px;line-height:1.05;margin-top:24px">Old comments come back quoted.</h1><div style="margin-top:44px">{crop("3-history.png",190,90,1100,560,912)}</div><div style="font-size:36px;line-height:1.35;margin-top:34px">With author and time. A comment on the new item records the old key.</div>'))
li=''.join(f'<div style="display:flex;gap:18px;align-items:flex-start"><div style="width:14px;height:14px;border-radius:50%;background:var(--amb);margin-top:18px;flex:none"></div><div style="font-size:42px;line-height:1.3;font-weight:{700 if i==0 else 500}">{t}</div></div>' for i,t in enumerate(['Attached files are listed, not restored.','The new item gets a new key.','Work logs and history are not restored.','Only items created or changed after install are protected.','Copies are kept 90 days.']))
S.append(slide(5,f'<div style="font-size:28px;letter-spacing:.06em;font-weight:700;color:var(--amb);text-transform:uppercase">The honest limits</div><h1 style="font-size:74px;line-height:1.05;margin-top:24px">Know what you get.</h1><div style="display:flex;flex-direction:column;gap:26px;margin-top:46px">{li}</div><div style="margin-top:46px;font-size:34px;line-height:1.35;color:#c9d8e8">Runs on Atlassian. No outside servers, no analytics.</div><div style="display:inline-block;margin-top:34px;background:var(--amb);color:var(--navy);font-weight:700;font-size:34px;border-radius:999px;padding:16px 32px">Coming soon to the Atlassian Marketplace</div>',True))
car='<!doctype html><html><head><meta charset="utf-8"><title>Restorable: deleted a Jira work item by mistake?</title><style>@page{size:1080px 1350px;margin:0}'+CSS+'</style></head><body>'+''.join(S)+'</body></html>'
open('carousel-restorable.html','w').write(car)
for k,(w,h,b) in files.items():
    open(k+'.html','w').write(page(w,h,b))
open('manifest.txt','w').write('\n'.join(f'{k} {w} {h}' for k,(w,h,b) in files.items()))
