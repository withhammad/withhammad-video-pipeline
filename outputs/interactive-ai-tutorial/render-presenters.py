import json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];R=ROOT/'studio/remotion';JOB=ROOT/'studio/.local/jobs/fdb2463f9d21';P=JOB/'presenter-parts';P.mkdir(exist_ok=True)
parts=[('opening',0,18.4,'Build tools with AI','Four practical workflows, demonstrated step by step','THE COMPLETE WALKTHROUGH'),('newsletter',18.4,6.55,'Edit. Preview. Export.','A newsletter workflow you can use','01 / NEWSLETTER'),('tasks',24.95,6.15,'Decide what happens next','A task board with a clear handoff','02 / TASKS'),('revenue',31.10,6.3,'Make assumptions visible','A transparent model you can check','03 / REVENUE'),('packaging',37.40,8.6,'Explore before production','A packaging concept for discussion','04 / PACKAGING'),('bonus',46.0,7.05,'From ideas to decisions','Choose a concept and prepare the handoff','BONUS / IDEAS & PRESENTATIONS'),('closing',53.05,11.0,'Build one useful tool','Start small. Check it. Improve it.','YOUR NEXT STEP')]
(P/'parts.json').write_text(json.dumps(parts))
for id,trim,seconds,title,subtitle,number in parts:
 out=P/(id+'.mp4');props=P/(id+'.json');props.write_text(json.dumps(dict(title=title,subtitle=subtitle,number=number,trim=trim,seconds=seconds)))
 if out.exists():continue
 if id=='opening':
  import shutil;shutil.copy2(R/'out/tutorial-opening.mp4',out);continue
 with (P/(id+'.log')).open('w') as log:subprocess.run(['npx','remotion','render','src/tutorial/index.tsx','TutorialPresenter',str(out),'--props',str(props),'--codec','h264','--crf','20','--concurrency','2'],cwd=R,stdout=log,stderr=log,check=True)
 print(id+' rendered',flush=True)
