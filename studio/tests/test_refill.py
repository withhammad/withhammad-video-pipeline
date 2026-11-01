import json
from datetime import datetime, timezone

import pytest

from app import refill as rf


def q(tmp_path, entries):
    p = tmp_path / 'q.json'; p.write_text(json.dumps({'entries': entries})); return p


def ig(day, n=2, status='pending'):
    return [{'platform': 'instagram', 'local': f'{day} 11:00 GST', 'status': status} for _ in range(n)]


NOW = datetime(2026, 11, 9, 4, 0, tzinfo=timezone.utc)   # 08:00 GST on 9 Nov


def test_coverage_counts_consecutive_days_meeting_minimum(tmp_path):
    entries = ig('2026-11-09') + ig('2026-11-10') + ig('2026-11-11', n=1) + ig('2026-11-12')
    st = rf.status(NOW, tmp_path / 'inbox.json', q(tmp_path, entries))
    assert st['coverage']['reels'] == {'days_ahead': 2, 'first_gap': '2026-11-11', 'daily_min': 2}
    assert st['coverage']['posts']['days_ahead'] == 0 and st['coverage']['long']['days_ahead'] == 0


def test_links_needed_and_actions_ask_owner_when_inbox_short(tmp_path):
    inbox = tmp_path / 'inbox.json'
    rf.add('https://a', path=inbox); rf.add('https://b', path=inbox)
    st = rf.status(NOW, inbox, q(tmp_path, ig('2026-11-09')))
    assert st['links_needed'] == 12 and st['inbox']['pending'] == 2
    assert any('process 2 reference' in a for a in st['actions'])
    assert any('ask the owner for 10 more' in a for a in st['actions'])
    assert [l['url'] for l in rf.next_links(2, inbox, q(tmp_path, ig('2026-11-09')), NOW)] == ['https://a', 'https://b']


def test_in_flight_links_reduce_need_and_marking_flows(tmp_path):
    inbox = tmp_path / 'inbox.json'
    rf.add('https://a', path=inbox)
    assert rf.add('https://a', path=inbox)['status'] == 'already_in_inbox'
    rf.mark('https://a', 'awaiting_approval', job='j1', path=inbox)
    st = rf.status(NOW, inbox, q(tmp_path, []))
    assert st['inbox']['awaiting_approval'] == 1 and st['links_needed'] == 13
    with pytest.raises(ValueError):
        rf.mark('https://a', 'bogus', path=inbox)
    with pytest.raises(KeyError):
        rf.mark('https://zzz', 'queued', path=inbox)


def test_full_week_needs_nothing(tmp_path):
    entries = [e for d in range(9, 16) for e in ig(f'2026-11-{d:02d}')]
    st = rf.status(NOW, tmp_path / 'i.json', q(tmp_path, entries))
    assert st['coverage']['reels']['days_ahead'] == 7 and st['links_needed'] == 0
    assert not any('process' in a for a in st['actions'])
