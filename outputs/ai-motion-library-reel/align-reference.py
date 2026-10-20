from pathlib import Path
import json,difflib,re,subprocess,bisect
r=Path(__file__).resolve().parents[2];j=r/'studio/.local/jobs/motion20261020';pub=r/'studio/remotion/public/motion-library';a=json.loads((j/'reference-words.json').read_text());b=json.loads((j/'new-words.json').read_text());norm=lambda w:re.sub('[^a-z0-9]','',w['text'].lower());pairs=[]
for x,y,n in difflib.SequenceMatcher(None,list(map(norm,a)),list(map(norm,b)),autojunk=False).get_matching_blocks():
 for i in range(n):pairs.append((a[x+i]['startMs']/1000,b[y+i]['startMs']/1000))
pairs=[(0,0)]+[p for p in pairs if p[0]>0]+[(29.9,34.24)]
def mapped(t):
 i=min(len(pairs)-2,max(0,bisect.bisect_right([p[0] for p in pairs],t)-1));x,y=pairs[i];xx,yy=pairs[i+1];return y+(t-x)/(xx-x)*(yy-y)
cuts=[0,2.866667,7.866667,10.766667,12.6,18.433333,19.466667,20.966667,26,29.9];dest=[round(mapped(t)*30)/30 for t in cuts];dest[-1]=34.266667
for i,((a0,a1),(b0,b1)) in enumerate(zip(zip(cuts,cuts[1:]),zip(dest,dest[1:]))):
 subprocess.run(['ffmpeg','-y','-v','error','-ss',str(a0),'-t',str(a1-a0),'-i',str(pub/'reference.mp4'),'-an','-vf',f'setpts=(PTS-STARTPTS)*{(b1-b0)/(a1-a0)},fps=30,tpad=stop_mode=clone:stop_duration=1','-t',str(b1-b0),'-c:v','libx264','-crf','17',str(j/f'ref-shot-{i}.mp4')],check=True)
(j/'concat.txt').write_text(''.join(f"file '{j}/ref-shot-{i}.mp4'\n" for i in range(len(cuts)-1)))
subprocess.run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',str(j/'concat.txt'),'-c','copy',str(pub/'reference-aligned.mp4')],check=True)
data={'source_cuts':cuts,'aligned_cuts':dest,'split':[[dest[i],dest[i+1]] for i in [0,2,4,6]],'full':[[dest[i],dest[i+1]] for i in [5,8]],'captions':b,'duration':dest[-1]};(r/'studio/remotion/src/motion-reference/alignment.json').write_text(json.dumps(data,indent=2)+'\n');(Path(__file__).parent/'alignment-receipt.json').write_text(json.dumps({k:v for k,v in data.items() if k!='captions'},indent=2)+'\n')
def ts(ms):
 n=round(ms);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'
groups=[b[i:i+3] for i in range(0,len(b),3)];(Path(__file__).parent/'captions.srt').write_text('\n\n'.join(f'{i+1}\n{ts(g[0]["startMs"])} --> {ts(g[-1]["endMs"])}\n'+ ' '.join(w['text'].strip() for w in g) for i,g in enumerate(groups))+'\n');print(dest)
