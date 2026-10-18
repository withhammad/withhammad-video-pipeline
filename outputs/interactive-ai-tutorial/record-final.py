import concurrent.futures,json,subprocess,time,re,fcntl
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=Path(__file__).resolve().parent;JOB=ROOT/'studio/.local/jobs/fdb2463f9d21';REC=JOB/'recordings-final';REC.mkdir(exist_ok=True)
def setv(sel,value):return {'set':{'selector':sel,'value':value,'ms':400}}
def click(sel):return {'activate':sel}
def run(id,d):
 duration=d['duration'];n=int(id[:2]);tab='newsletter';acts=[]
 if n==1:acts=[(25,click('#nav-tasks')),(40,click('#nav-revenue')),(55,click('#nav-packaging')),(80,click('#nav-newsletter'))]
 if n==2:acts=[(78,setv('#subject','One practical AI workflow for your team')),(88,setv('#draft','Hello team,\n\nTurn one repeated task into a small working tool. Start with sample data and test the result.\n\nTry a newsletter editor with a live preview and useful exports.\n\nHammad'))]
 if n==3:acts=[(4,setv('#draft','One two three four five six seven eight nine ten')),(27,{'highlight':{'selector':'.stats','ms':2000}}),(54,click('#resetDraft')),(58,{'type':{'selector':'#draft','text':'\n\nTry one useful workflow today.','cps':20}}),(85,click('#exportMarkdown')),(93,click('#exportHTML')),(112,setv('#draft','Ten useful words plus literal <sample> text, kept as text.')),(122,click('#exportHTML'))]
 if n==4:
  tab='tasks';acts=[(40,{'highlight':{'selector':'#board','ms':1800}}),(66,setv('#taskName','Review the homepage call to action')),(80,setv('#taskMinutes','30')),(82,click('#addTask')),(95,{'eval':"tasks[tasks.length-1].lane='delegate';board()"})]
 if n==5:
  tab='tasks';acts=[(5,setv('#assignee','Alex')),(21,setv('#deadline','Friday, 3 pm')),(30,click('#makeMessage')),(40,{'highlight':{'selector':'#message','ms':1800}}),(76,{'eval':"tasks[0].lane='delegate';board();document.getElementById('makeMessage').click()"}),(100,{'eval':"tasks.forEach(t=>{if(t.lane==='delegate')t.lane='schedule'});board();document.getElementById('makeMessage').click()"})]
 if n==6:
  tab='revenue';acts=[(34,{'highlight':{'selector':'#orders','ms':1800}}),(43,{'highlight':{'selector':'#sales','ms':1800}}),(60,{'highlight':{'selector':'#profit','ms':1800}}),(85,setv('#conversion','3')),(113,setv('#conversion','1'))]
 if n==7:
  tab='revenue';acts=[(27,{'highlight':{'selector':'#scenarios','ms':1800}}),(70,setv('#costs','40000')),(89,setv('#margin','50')),(112,click('#exportCSV'))]
 if n==8:
  tab='packaging';acts=[(34,setv('#boxW','150')),(39,{'highlight':{'selector':'#bom','ms':1800}}),(80,setv('#product','Creator Desk Kit')),(86,setv('#colour','#674fa0')),(104,{'highlight':{'selector':'#bom','ms':1800}})]
 if n==9:
  tab='packaging';acts=[(5,setv('#reviewer','Hammad')),(9,click('#approve')),(34,setv('#reviewer','')),(44,setv('#reviewer','Hammad')),(58,setv('#boxW','160')),(80,{'pdf':str(REC/'concept-sheet.pdf')})]
 if n==10:
  tab='ideas';acts=[(72,click('#idea-0-Keep')),(77,click('#idea-1-Revisit')),(81,click('#idea-2-Reject')),(99,{'highlight':{'selector':'#shortlist','ms':1800}}),(115,click('#exportIdeas'))]
 if n==11:
  tab='presentation';acts=[(28,{'highlight':{'selector':'#slideOutline','ms':1800}}),(78,{'scroll':{'to':240,'ms':900}}),(117,click('#exportOutline')),(125,click('a[download] button'))]
 if n==12:acts=[(30,click('#nav-newsletter')),(38,click('#nav-tasks')),(44,click('#nav-revenue')),(49,click('#nav-packaging')),(86,click('#nav-newsletter')),(96,click('#nav-revenue')),(127,click('#nav-presentation'))]
 # Align each real interaction to the actual synthesized words.
 phrases={
 1:['the second is a task','the third is a revenue','fourth is a packaging','For the newsletter'],
 2:['Start by changing the subject','Now change a sentence'],
 3:['Replace the body','reading-time estimate','restore the sample draft','add a short practical takeaway','Markdown is useful','HTML export is useful','If I type angle brackets','escaping user content'],
 4:['Each task also has an estimate','Now add a new task','Enter an estimate','add it to the board','Move one'],
 5:['The first input','Friday deadline','When we build the message','Read the result carefully','move another task','test the empty case'],
 6:['four hundred orders','revenue is one hundred thousand','leaves thirty thousand','Increase the conversion rate','reduce conversion to one percent'],
 7:['those scenarios become','change the fixed costs','do the same with gross margin','export button'],
 8:['Change the width','displayed specification','different product name','brand color','bill of materials'],
 9:['Enter the reviewer','mark the concept','without a reviewer name','Then enter a name','dimensions change after','print button'],
 10:['keep one idea','mark another for later','reject one','add a reason','Export the shortlist'],
 11:['six-part structure','evidence slide','export the content','real slide file'],
 12:['In our newsletter','In the task board','In the revenue model','In the packaging concept','Ten words should','Two percent of twenty thousand','Keep a copy']}
 def norm(v):return re.sub(r'[^a-z0-9]','',v.lower())
 words=d.get('word_timestamps',[]);seq=[norm(w['word']) for w in words]
 actions=[]
 for (fallback,act),phrase in zip(acts,phrases[n]):
  want=[norm(w) for w in phrase.split()];found=next((words[i]['start'] for i in range(len(seq)-len(want)+1) if seq[i:i+len(want)]==want),None)
  if found is None:print('Timing fallback',id,phrase,flush=True)
  actions.append(dict(at=max(0,(found-.2) if found is not None else fallback*duration/143),**act))
 actions.sort(key=lambda a:a['at']);actions.append({'at':duration+.3,'wait':1})
 setup="localStorage.clear();document.getElementById('resetDraft').click();tab("+json.dumps(tab)+");window.scrollTo(0,0);const st=document.createElement('style');st.textContent='body{font-size:22px}header{padding:14px 40px}nav{padding:12px 40px}main{max-width:1800px;padding:22px 40px}h1{font-size:42px}.card{padding:20px}textarea{min-height:230px}.lead{margin:8px 0 20px}';document.head.appendChild(st);"
 plan={'url':(OUT/'demo/index.html').as_uri(),'out':str(REC/(id+'.mp4')),'width':1920,'height':960,'fps':30,'timeoutMs':600000,'setup':setup,'downloadDir':str(REC/(id+'-exports')),'debug':True,'actions':actions,'assertions':["document.getElementById('sales').textContent.replace(/,/g,'')==='100000'","document.getElementById('orders').textContent==='400'","document.getElementById('profit').textContent.replace(/,/g,'')==='30000'"]}
 path=REC/(id+'.plan.json');path.write_text(json.dumps(plan,indent=2))
 if (REC/(id+'.mp4')).exists():return id+' exists'
 with (REC/(id+'.log')).open('w') as log:subprocess.run(['node',str(OUT/'demo/record-demo.mjs'),str(path)],stdout=log,stderr=log,check=True)
 return id+' recorded'
if __name__=='__main__':
 lock=(JOB/'capture.lock').open('w');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 wanted=['01-introduction']+[p.stem for p in sorted((OUT/'scripts').glob('*.txt'))];started=set();futures=[];deadline=time.time()+2400
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  while len(started)<len(wanted):
   if time.time()>deadline:raise RuntimeError('Missing narration metadata')
   for id in wanted:
    if id in started:continue
    p=JOB/'narration'/(id+'.json')
    if id=='01-introduction':data=json.loads(p.read_text())
    elif p.exists():data=json.loads(p.read_text())
    else:continue
    futures.append(pool.submit(run,id,data));started.add(id);print('Queued',id,flush=True)
   for f in list(futures):
    if f.done():print(f.result(),flush=True);futures.remove(f)
   time.sleep(3)
  for f in concurrent.futures.as_completed(futures):print(f.result(),flush=True)
