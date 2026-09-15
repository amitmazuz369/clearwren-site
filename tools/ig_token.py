#!/usr/bin/env python3
"""Keep Clearwren's Instagram token alive, and say how long it has left.

Instagram Login tokens last 60 days and can be refreshed once they are over 24 hours
old. clearwren-morning runs this daily; if that ever stops, Instagram posting dies about
60 days after the last successful refresh. The credential lives in
~/.config/clearwren/instagram.env, outside every repository.
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

CRED = Path.home() / '.config' / 'clearwren' / 'instagram.env'
GRAPH = 'https://graph.instagram.com'


def load():
    env = {}
    for line in CRED.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, _, v = line.partition('=')
            env[k.strip()] = v.strip()
    return env


def save_token(token):
    lines = [l for l in CRED.read_text().splitlines() if not l.startswith('IG_ACCESS_TOKEN=')]
    tmp = CRED.with_suffix('.tmp')
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as f:
        f.write('\n'.join(lines + [f'IG_ACCESS_TOKEN={token}']) + '\n')
    os.replace(tmp, CRED)


def main():
    tok = load().get('IG_ACCESS_TOKEN', '')
    if not tok:
        print(f'no IG_ACCESS_TOKEN in {CRED}')
        return 1
    q = urllib.parse.urlencode({'grant_type': 'ig_refresh_token', 'access_token': tok})
    try:
        r = json.load(urllib.request.urlopen(f'{GRAPH}/refresh_access_token?{q}', timeout=30))
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:300]
        if 'too soon' in body.lower() or '24 hours' in body:
            print('token refreshed within the last 24 hours — still valid, kept')
            return 0
        print(f'refresh FAILED — Instagram posting stops when the token expires: {body}')
        return 1
    save_token(r['access_token'])
    print(f"token refreshed — valid ~{r.get('expires_in', 0) // 86400} more days")
    return 0


if __name__ == '__main__':
    sys.exit(main())
