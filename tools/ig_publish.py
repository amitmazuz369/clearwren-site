#!/usr/bin/env python3
"""Publish a Clearwren Instagram carousel, with alt text on every slide.

The account (formerly @theluxframes, now @clearwren) is reached through the Instagram
Login API credentials that already live in ~/luxe-frames/.env. They are read at run time
and never copied: ~/clearwren-site is a public repository, and nothing secret goes near it.

Why not luxe-frames' own post.publish_carousel: it sends no alt_text, and a Clearwren post
without image descriptions would commit the exact failure it is about.

Only the final media_publish call is irreversible. Every check runs before it, and any
failure stops the run with nothing published.
"""
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ENV = Path.home() / 'luxe-frames' / '.env'
GRAPH = 'https://graph.instagram.com/v23.0'   # alt_text on /media arrived in March 2025


def load_env():
    env = {}
    for line in ENV.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env['IG_USER_ID'], env['IG_ACCESS_TOKEN']


def call(method, path, token, params=None):
    params = dict(params or {}, access_token=token)
    body = urllib.parse.urlencode(params)
    url = f'{GRAPH}/{path}'
    req = (urllib.request.Request(url, data=body.encode(), method='POST') if method == 'POST'
           else urllib.request.Request(f'{url}?{body}'))
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'{method} {path} -> {e.code}: {e.read().decode()[:400]}') from None


def main(spec_path):
    spec = json.loads(Path(spec_path).read_text())
    slides, caption = spec['slides'], spec['caption']
    if not 2 <= len(slides) <= 10:
        sys.exit('a carousel needs 2-10 slides')
    missing = [s['url'] for s in slides if not s.get('alt', '').strip()]
    if missing:
        sys.exit(f'refusing to post slides without alt text: {missing}')

    uid, tok = load_env()
    me = call('GET', 'me', tok, {'fields': 'username,account_type,media_count'})
    if me.get('username') != spec['expect_username']:
        sys.exit(f"token points at @{me.get('username')}, expected @{spec['expect_username']} — not posting")
    before = me.get('media_count')

    children, readback = [], []
    for s in slides:
        c = call('POST', f'{uid}/media', tok,
                 {'image_url': s['url'], 'is_carousel_item': 'true', 'alt_text': s['alt']})
        children.append(c['id'])
        try:
            got = call('GET', c['id'], tok, {'fields': 'alt_text'}).get('alt_text')
        except RuntimeError:
            got = None                    # not readable on an unpublished container
        if got is not None and got != s['alt']:
            sys.exit(f"alt text did not stick on {s['url']}: got {got!r} — not posting")
        readback.append(got == s['alt'] if got is not None else None)

    parent = call('POST', f'{uid}/media', tok,
                  {'media_type': 'CAROUSEL', 'children': ','.join(children), 'caption': caption})['id']
    deadline = time.time() + 300
    while time.time() < deadline:
        code = call('GET', parent, tok, {'fields': 'status_code'}).get('status_code')
        if code in ('FINISHED', None):
            break
        if code == 'ERROR':
            sys.exit('Instagram rejected the carousel while processing — not posting')
        time.sleep(4)
    else:
        sys.exit('timed out waiting for Instagram to process the carousel — not posting')

    media_id = call('POST', f'{uid}/media_publish', tok, {'creation_id': parent})['id']

    info = call('GET', media_id, tok, {'fields': 'permalink,media_type,timestamp'})
    try:
        kids = call('GET', f'{media_id}/children', tok, {'fields': 'id,alt_text'}).get('data', [])
        after_alt = [k.get('alt_text') == s['alt'] for k, s in zip(kids, slides)]
    except RuntimeError:
        after_alt = None
    after = call('GET', 'me', tok, {'fields': 'media_count'}).get('media_count')
    print(json.dumps({'published': media_id, 'permalink': info.get('permalink'),
                      'type': info.get('media_type'), 'media_count': f'{before} -> {after}',
                      'alt_before_publish': readback, 'alt_after_publish': after_alt}, indent=1))


if __name__ == '__main__':
    main(sys.argv[1])
