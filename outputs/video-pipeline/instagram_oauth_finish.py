#!/usr/bin/env python3
"""Finish an Instagram Login redirect already opened in Chrome.

Run after the account owner approves the Instagram consent screen. Credentials
stay in work/.secrets; output contains account metadata only.
"""

import json
import os
from pathlib import Path
import subprocess
from urllib.parse import parse_qs, urlparse, urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
SECRETS = ROOT / "work" / ".secrets"
REDIRECT = "https://127.0.0.1:8766/instagram/callback"
CLIENT_ID = "2225240621741205"


def chrome_urls():
    script = '''tell application "Google Chrome"
        repeat with t in tabs of front window
            if URL of t contains "127.0.0.1:8766/instagram/callback" then
                log URL of t
            end if
        end repeat
    end tell'''
    result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, check=True)
    return [line.strip() for line in result.stderr.splitlines() if line.strip()]


def request_json(url, data=None):
    body = urlencode(data).encode() if data is not None else None
    request = Request(url, data=body)
    with urlopen(request, timeout=30) as response:
        return json.load(response)


def main():
    state_info = json.loads((SECRETS / "instagram-state.json").read_text())
    matches = [u for u in chrome_urls() if parse_qs(urlparse(u).query).get("state", [None])[0] == state_info["state"]]
    if not matches:
        raise SystemExit("Instagram approval has not returned to the registered callback yet.")
    query = parse_qs(urlparse(matches[-1]).query)
    if "error" in query or "error_reason" in query:
        raise SystemExit("Instagram authorization declined: " + str(query.get("error_reason", query.get("error"))))
    code = query.get("code", [None])[0]
    if not code:
        raise SystemExit("Instagram callback has no authorization code.")
    secret = (SECRETS / "instagram-client-secret.txt").read_text().strip()
    short = request_json("https://api.instagram.com/oauth/access_token", {
        "client_id": CLIENT_ID,
        "client_secret": secret,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT,
        "code": code,
    })
    if "data" in short:
        if len(short["data"]) != 1:
            raise SystemExit("Instagram returned ambiguous token data.")
        short = short["data"][0]
    long = request_json("https://graph.instagram.com/access_token?" + urlencode({
        "grant_type": "ig_exchange_token",
        "client_secret": secret,
        "access_token": short["access_token"],
    }))
    token = long["access_token"]
    me = request_json("https://graph.instagram.com/me?" + urlencode({
        "fields": "id,username,account_type",
        "access_token": token,
    }))
    expected = state_info["account"]
    if me.get("username", "").lower() != expected:
        raise SystemExit(f"Wrong Instagram account authorized: @{me.get('username')} (expected @{expected}). Token not stored.")
    path = SECRETS / f"instagram-{expected.replace('.', '-')}-oauth.json"
    path.write_text(json.dumps({"access_token": token, "expires_in": long.get("expires_in"), "id": me["id"], "username": me["username"]}))
    os.chmod(path, 0o600)
    print(json.dumps({"connected": True, "username": me["username"], "id": me["id"], "account_type": me.get("account_type"), "expires_in": long.get("expires_in")}))


if __name__ == "__main__":
    main()
