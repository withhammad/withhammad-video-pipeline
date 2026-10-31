import json
import shutil
import subprocess
from pathlib import Path

import pytest

from app import screenrec

CHROME = Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')


def test_validate_rejects_bad_plans():
    with pytest.raises(screenrec.ScreenRecError, match='url'):
        screenrec.validate({'url': 'ftp://x'})
    with pytest.raises(screenrec.ScreenRecError, match='action 0'):
        screenrec.validate({'url': 'https://example.com', 'actions': [{'fly': 1}]})
    with pytest.raises(screenrec.ScreenRecError, match='width'):
        screenrec.validate({'url': 'https://example.com', 'width': 0})
    assert screenrec.validate({'url': 'file:///x.html', 'actions': [{'wait': 100}, {'scrollBy': {'y': 10}}]})


def test_validate_accepts_pointer_by_coordinates_or_selector():
    plan = {'url': 'https://example.com', 'actions': [{'pointer': {'x': 143.5, 'y': 151, 'ms': 900}},
                                                      {'pointer': {'selector': '#stage', 'dx': 20}}]}
    assert screenrec.validate(plan) == plan
    with pytest.raises(screenrec.ScreenRecError, match='pointer needs'):
        screenrec.validate({'url': 'https://example.com', 'actions': [{'pointer': {'x': 10}}]})


@pytest.mark.skipif(not CHROME.exists() or not shutil.which('node') or not shutil.which('ffmpeg'),
                    reason='needs Google Chrome, node and ffmpeg')
def test_records_a_local_page_with_scroll_cursor_and_text_selector(tmp_path):
    page = tmp_path / 'page.html'
    page.write_text('<html><body style="margin:0;font:28px sans-serif">'
                    + ''.join(f'<p style="height:120px">Row {i}</p>' for i in range(40))
                    + '<h2 id="target">Target section</h2></body></html>')
    out = tmp_path / 'clip.mp4'
    summary = screenrec.record({'url': page.as_uri(), 'width': 400, 'height': 500, 'fps': 25, 'settleMs': 200,
                                'actions': [{'move': {'selector': 'text=Row 3', 'ms': 300}},
                                            {'highlight': {'selector': 'text=Row 3', 'ms': 300}},
                                            {'scroll': {'to': '#target', 'ms': 800}}, {'wait': 200}]}, out)
    assert summary['width'] == 400 and summary['frames'] >= 5
    probe = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=width,height,r_frame_rate',
                                       '-show_entries', 'format=duration', '-of', 'json', str(out)],
                                      capture_output=True, text=True).stdout)
    assert probe['streams'][0]['width'] == 400 and probe['streams'][0]['r_frame_rate'] == '25/1'
    assert 1.0 < float(probe['format']['duration']) < 10


@pytest.mark.skipif(not CHROME.exists() or not shutil.which('node') or not shutil.which('ffmpeg'),
                    reason='needs Google Chrome, node and ffmpeg')
def test_pointer_sends_real_hover_to_the_page(tmp_path):
    page = tmp_path / 'hover.html'
    page.write_text('<style>body{margin:0;background:#fff}#box{position:absolute;left:100px;top:100px;width:100px;'
                    'height:100px;background:rgb(0,0,255)}#box:hover{background:rgb(255,0,0)}</style><div id="box"></div>')
    out = tmp_path / 'hover.mp4'
    screenrec.record({'url': page.as_uri(), 'width': 300, 'height': 300, 'fps': 25, 'settleMs': 200,
                      'actions': [{'pointer': {'x': 150, 'y': 150, 'ms': 300}}, {'wait': 300}]}, out)
    rgb = subprocess.run(['ffmpeg', '-v', 'error', '-sseof', '-0.1', '-i', str(out), '-vf', 'format=rgb24,crop=1:1:120:180',
                          '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    assert rgb[0] > 200 and rgb[2] < 60, f'box did not turn red under the pointer: {tuple(rgb)}'


@pytest.mark.skipif(not CHROME.exists() or not shutil.which('node'), reason='needs Google Chrome and node')
def test_missing_selector_is_a_readable_error(tmp_path):
    page = tmp_path / 'p.html'
    page.write_text('<p>hello</p>')
    with pytest.raises(screenrec.ScreenRecError, match='selector not found'):
        screenrec.record({'url': page.as_uri(), 'width': 300, 'height': 300, 'settleMs': 100, 'selectorTimeoutMs': 500,
                          'actions': [{'move': {'selector': '#nope'}}]}, tmp_path / 'x.mp4')
