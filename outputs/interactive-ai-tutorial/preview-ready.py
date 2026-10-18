"""Build a clearly named review draft from available, finished chapters."""
import json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
EDIT = ROOT / 'studio/.local/jobs/fdb2463f9d21/edit-final'
order = ['p-opening', '01-introduction-finished', 'p-newsletter',
         '02-newsletter-build-finished', '03-newsletter-checks', 'p-tasks',
         '04-task-board', '05-delegation', 'p-revenue', '06-revenue-model',
         '07-scenarios', 'p-packaging', '08-packaging', '09-review-handoff',
         'p-bonus', '11-presentation', '12-building-better', 'p-closing']
duration = 0
for name in order:
    duration += float(subprocess.check_output(['ffprobe', '-v', 'error',
        '-show_entries', 'format=duration', '-of', 'csv=p=0', str(EDIT/(name+'.mp4'))]))
concat = EDIT/'review-draft-concat.txt'
concat.write_text('\n'.join("file '"+str(EDIT/(n+'.mp4'))+"'" for n in order))
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0',
    '-i', str(concat), '-c', 'copy', '-movflags', '+faststart',
    str(OUT/'review-draft-missing-ideas-chapter.mp4')], check=True)
(OUT/'review-draft-status.json').write_text(json.dumps({
    'status': 'review_draft_not_complete', 'duration_seconds': duration,
    'missing': 'Idea-selection chapter: narration generation timed out; retry approval pending',
    'order': order, 'published': False,
}, indent=2))
print('Review draft duration:', duration)
