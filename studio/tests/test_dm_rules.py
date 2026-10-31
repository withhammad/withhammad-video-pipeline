import json

import pytest

from app import dm_rules


@pytest.fixture
def rules_file(tmp_path):
    path = tmp_path / 'dm-rules.json'
    path.write_text(json.dumps({'follow_line': 'Follow first', 'rules': [
        {'keyword': 'SCOPE', 'link': 'https://withhammad.com/resources/a', 'dm': 'x', 'reply': 'y', 'media_ids': []}]}))
    return path


def test_add_rule_appends_and_uppercases(rules_file):
    rule = dm_rules.add_rule('kit', 'https://withhammad.com/resources/kit', media_ids=['123'], path=rules_file)
    assert rule == {'keyword': 'KIT', 'link': 'https://withhammad.com/resources/kit', 'dm': dm_rules.DEFAULT_DM,
                    'reply': dm_rules.DEFAULT_REPLY, 'media_ids': ['123']}
    assert [r['keyword'] for r in dm_rules.load(rules_file)['rules']] == ['SCOPE', 'KIT']


def test_add_rule_replaces_same_keyword(rules_file):
    dm_rules.add_rule('scope', 'https://withhammad.com/resources/b', path=rules_file)
    rules = dm_rules.load(rules_file)['rules']
    assert len(rules) == 1 and rules[0]['link'] == 'https://withhammad.com/resources/b'


def test_add_rule_rejects_bad_input(rules_file):
    with pytest.raises(ValueError):
        dm_rules.add_rule('', 'https://x', path=rules_file)
    with pytest.raises(ValueError):
        dm_rules.add_rule('K', 'http://insecure', path=rules_file)
