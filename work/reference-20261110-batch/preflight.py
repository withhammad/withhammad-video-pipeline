"""Write labelled, silent layout preflight props; timings are never final captions."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
data=json.loads((Path(__file__).with_name('batch.json')).read_text())
for j in data['jobs'][:2]:
    total=sum(len(s['spoken'].split()) for s in j['segments'])
    per=j['reference_seconds']/total
    words=[];segments=[];at=0;cam=0
    for s in j['segments']:
        tokens=s['spoken'].split();end=at+len(tokens)*per
        segments.append({'start':at,'end':end,'ref':s['ref'],'camera':s['camera'],'avatarStart':cam})
        for i,w in enumerate(tokens):words.append({'text':w,'startMs':(at+i*per)*1000,'endMs':(at+(i+1)*per)*1000})
        if s['camera']:cam+=end-at
        at=end
    props={'job':j['job'],'keyword':j['keyword'],'duration':j['reference_seconds'],'draft':True,'timingSource':'preflight',
           'words':words,'segments':segments}
    name='higgs' if j['keyword']=='HIGGS' else 'advisor'
    (ROOT/'studio/remotion/src/batchnov10'/f'{name}.preflight.json').write_text(json.dumps(props,indent=2)+'\n')
    print(name,round(at,2),'seconds; labelled silent preflight only')
