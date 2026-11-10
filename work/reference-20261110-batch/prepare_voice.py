"""Align an existing paid narration; preserve source pace and all production ledgers.
Run from studio through ./heavy.sh .venv/bin/python ../work/reference-20261110-batch/prepare_voice.py KEYWORD SOURCE [--words FILE].
Only camera upload audio is concatenated. The full narration is never tightened or retimed.
"""
import argparse, array, difflib, hashlib, json, math, re, shutil, subprocess, sys, wave
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
STUDIO=ROOT/'studio'
sys.path.insert(0,str(STUDIO))
from app.reel import transcribe_words

def dump(path,data): path.write_text(json.dumps(data,indent=2)+'\n')
def norm(s):
    token=re.sub(r'[^a-z0-9]','',s.lower())
    return {str(i):w for i,w in enumerate(['zero','one','two','three','four','five','six','seven','eight','nine','ten'])}.get(token,token)
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def display(s):
    # Written captions use the same compact numeric tokens returned by Whisper.
    # Preserve measured token spans instead of inventing timings inside "$10" or "API".
    substitutions={'five point two':'5.2','five point one':'5.1','A P I':'API',
        'thirty percent':'30%','twenty percent':'20%','ten dollars':'$10',
        'fifty dollars':'$50','eight dollars':'$8','forty dollars':'$40'}
    for spoken,written in substitutions.items():s=re.sub(r'\b'+re.escape(spoken)+r'\b',lambda _:written,s,flags=re.I)
    return s
def canonical(raw):
    out=[];i=0
    while i<len(raw):
        w=dict(raw[i]);w['text']=w['text'].strip()
        if w['text']=='5' and i+1<len(raw) and re.match(r'^\.[12]\b',raw[i+1]['text'].strip()):
            w['text']='5'+raw[i+1]['text'].strip();w['endMs']=raw[i+1]['endMs'];i+=1
        if i+1<len(raw) and raw[i+1]['text'].strip().startswith('-'):
            w['text']+=raw[i+1]['text'].strip();w['endMs']=raw[i+1]['endMs'];i+=1
        if i+1<len(raw) and raw[i+1]['text'].strip().startswith('%'):
            w['text']+=raw[i+1]['text'].strip();w['endMs']=raw[i+1]['endMs'];i+=1
        if w['text'].lower()=='anthropics' and i+1<len(raw) and raw[i+1]['text'].strip().lower()=='says':
            w['text']='Anthropic' # Correct the named entity, keeping the original measured interval.
        out.append(w);i+=1
    return out

def main():
    ap=argparse.ArgumentParser();ap.add_argument('keyword');ap.add_argument('source',type=Path);ap.add_argument('--words',type=Path)
    args=ap.parse_args()
    batch=json.loads(Path(__file__).with_name('batch.json').read_text())
    job=next(j for j in batch['jobs'] if j['keyword']==args.keyword.upper())
    folder=STUDIO/'.local/jobs'/job['job'];out=folder/'referral-v4';out.mkdir(exist_ok=True)
    ledgers=[folder/'voice-plan.json',folder/'STATUS.md',Path(__file__).with_name('production-status.json')]
    before={str(p):digest(p) for p in ledgers if p.exists()}
    original=out/'narration_original.mp3'
    if original.exists():
        if digest(original)!=digest(args.source):raise ValueError('Refusing to replace another original take')
    else:shutil.copy2(args.source,original)
    if args.words:raw=json.loads(args.words.read_text())
    elif (out/'whisper_words_names_prompt.json').exists():raw=json.loads((out/'whisper_words_names_prompt.json').read_text())
    else:
        raw=transcribe_words(original,'Claude, Fable, Opus, Higgsfield, Customize, Connectors, Charlie Hills, ADVISOR, HIGGS.')
        dump(out/'whisper_words_names_prompt.json',raw)
    words=canonical(raw)
    expected=[w for s in job['segments'] for w in display(s['spoken']).split()]
    if [norm(w['text']) for w in words]!=[norm(w) for w in expected]:
        diff=list(difflib.unified_diff([norm(w) for w in expected],[norm(w['text']) for w in words],fromfile='script',tofile='recording'))
        dump(out/'alignment-errors.json',{'errors':diff,'status':'requires_review'});raise ValueError('\n'.join(diff))
    for w,text in zip(words,expected):w['text']=text
    # Decode at native sample rate: no gain, filter, time stretching, or silence removal.
    pcm=out/'narration_pcm.wav'
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(original),'-map','0:a:0','-c:a','pcm_s16le',str(pcm)],check=True)
    with wave.open(str(pcm),'rb') as f:
        params=f.getparams();frames=f.readframes(f.getnframes())
    assert params.nchannels==1 and params.sampwidth==2
    rate=params.framerate;sample_count=params.nframes;duration=sample_count/rate
    samples=array.array('h',frames)
    sd=subprocess.run(['ffmpeg','-hide_banner','-i',str(original),'-af','silencedetect=noise=-45dB:d=0.02','-f','null','-'],capture_output=True,text=True,check=True)
    (out/'silence-analysis.log').write_text(sd.stderr)
    silence=[];start=None
    for line in sd.stderr.splitlines():
        if 'silence_start:' in line:start=float(line.split('silence_start:')[1])
        elif 'silence_end:' in line and start is not None:
            end=float(line.split('silence_end:')[1].split('|')[0]);silence.append([start,end]);start=None
    corrections=[]
    for i,w in enumerate(words):
        a=w['startMs']/1000;b=w['endMs']/1000
        for sa,sb in silence:
            if sb-sa>=.12 and a<=sb and sa<=a+.1 and b>sb+.02:
                new=round((sb-.01)*1000)
                if new>w['startMs']:
                    corrections.append({'word':i,'text':w['text'],'oldStartMs':w['startMs'],'newStartMs':new,'reason':'Whisper onset spans measured leading silence'})
                    w['startMs']=new
    ranges=[];at=0
    for s in job['segments']:
        n=len(display(s['spoken']).split());ranges.append((at,at+n));at+=n
    def rms_at(t):
        a=max(0,round((t-.005)*rate));b=min(sample_count,round((t+.005)*rate));v=samples[a:b]
        return 20*math.log10(max(1e-10,math.sqrt(sum(float(x)*x for x in v)/max(1,len(v)))/32768))
    boundaries=[0.0];boundary_report=[]
    for i in range(1,len(ranges)):
        prev=words[ranges[i-1][1]-1];nxt=words[ranges[i][0]]
        target=(prev['endMs']+nxt['startMs'])/2000
        candidates=[(sa,sb) for sa,sb in silence if sa<=target+.15 and sb>=target-.15]
        silent=False
        if candidates:
            sa,sb=min(candidates,key=lambda x:abs((x[0]+x[1])/2-target))
            point=round(((sa+sb)/2)*30)/30
            silent=sa<=point<=sb
        else:
            # No safe silence: retain the nearest word boundary and explicitly block unreviewed upload.
            point=round(target*30)/30
        point=round(point*rate)/rate
        boundaries.append(point)
        boundary_report.append({'beforeSegment':i,'words':[prev['text'],nxt['text']],'target':target,'chosen':point,'rms10msDbfs':round(rms_at(point),2),'withinDetectedSilence':silent,'cameraTransition':job['segments'][i-1]['camera']!=job['segments'][i]['camera']})
    boundaries.append(duration)
    segments=[];manifest=[];upload=bytearray();upload_samples=0;warnings=[]
    for i,(s,(wa,wb)) in enumerate(zip(job['segments'],ranges)):
        a=round(boundaries[i]*rate);b=round(boundaries[i+1]*rate)
        render_a=a;render_b=b;context=[]
        if s['camera']:
            # Render whole phonemes plus context under B-roll when a visible edge has no silence.
            if i>0 and not boundary_report[i-1]['withinDetectedSilence']:
                candidates=[(sa,sb) for sa,sb in silence if sb-sa>=.1 and sb<=a/rate and sa>=a/rate-2]
                if candidates:
                    sa,sb=candidates[-1];t=round(((sa+sb)/2)*30)/30
                    if sa<=t<=sb:render_a=round(t*rate);context.append('preceding context to safe pause')
                if render_a==a:warnings.append(f'Camera segment {i} start has no verified safe pause')
            if i<len(ranges)-1 and not boundary_report[i]['withinDetectedSilence']:
                candidates=[(sa,sb) for sa,sb in silence if sb-sa>=.1 and sa>=b/rate and sb<=b/rate+2]
                for sa,sb in candidates:
                    t=round(((sa+sb)/2)*30)/30
                    if sa<=t<=sb:
                        render_b=round(t*rate);context.append('following context to safe pause');break
                if render_b==b:warnings.append(f'Camera segment {i} end has no verified safe pause')
        avatar_start=(upload_samples+a-render_a)/rate if s['camera'] else upload_samples/rate
        segments.append({'start':a/rate,'end':b/rate,'ref':s['ref'],'camera':s['camera'],'avatarStart':avatar_start})
        row={'segment':i,'camera':s['camera'],'text':s['spoken'],'wordStartIndex':wa,'wordEndExclusive':wb,'sourceStartSample':a,'sourceEndSample':b,'sourceStart':a/rate,'sourceEnd':b/rate}
        if s['camera']:
            context_words=[w['text'] for w in words if w['startMs']>=render_a/rate*1000 and w['endMs']<=render_b/rate*1000]
            row.update({'renderSourceStartSample':render_a,'renderSourceEndSample':render_b,'renderSourceStart':render_a/rate,'renderSourceEnd':render_b/rate,'renderedText':' '.join(context_words),'contextReason':context,'uploadStartSample':upload_samples,'uploadEndSample':upload_samples+render_b-render_a,'uploadStart':upload_samples/rate,'uploadEnd':(upload_samples+render_b-render_a)/rate,'visibleUploadStart':avatar_start,'visibleUploadEnd':avatar_start+(b-a)/rate})
            upload.extend(frames[render_a*2:render_b*2]);upload_samples+=render_b-render_a
        manifest.append(row)
    with wave.open(str(out/'camera_upload.wav'),'wb') as f:
        f.setparams(params);f.writeframes(upload)
    camera_words=[]
    for row in manifest:
        if row['camera']:
            offset=(row['uploadStart']-row['renderSourceStart'])*1000
            for w in words:
                if w['startMs']>=row['renderSourceStart']*1000 and w['endMs']<=row['renderSourceEnd']*1000:
                    camera_words.append({**w,'startMs':round(w['startMs']+offset),'endMs':round(w['endMs']+offset)})
    dump(out/'captions.json',words);dump(out/'camera_captions.json',camera_words)
    def stamp(ms):
        ms=round(ms);h,r=divmod(ms,3600000);m,r=divmod(r,60000);s,r=divmod(r,1000);return f'{h:02}:{m:02}:{s:02},{r:03}'
    (out/'captions.srt').write_text('\n\n'.join(f"{i+1}\n{stamp(w['startMs'])} --> {stamp(w['endMs'])}\n{w['text']}" for i,w in enumerate(words))+'\n')
    public=STUDIO/'remotion/public/batchnov10'/job['job']/'referral-v4';public.mkdir(parents=True,exist_ok=True)
    shutil.copy2(original,public/original.name)
    props={'job':job['job'],'keyword':job['keyword'],'duration':duration,'draft':True,'timingSource':'recorded','voiceVerified':False,'avatarVerified':False,'voice':f'batchnov10/{job["job"]}/referral-v4/{original.name}','words':words,'segments':segments}
    dump(out/'recorded.props.json',props)
    checks={'wordTimingErrors':[i for i,w in enumerate(words) if w['startMs']>=w['endMs'] or w['startMs']<0 or w['endMs']>duration*1000], 'captionOverlapErrors':[i for i in range(1,len(words)) if words[i]['startMs']<words[i-1]['endMs']], 'scriptMatch':True,'originalSha256':digest(original),'sourceSha256':digest(args.source),'nativeSampleRate':rate,'sourceSamples':sample_count,'duration':duration,'wordCount':len(words),'spokenScriptWords':sum(len(s['spoken'].split()) for s in job['segments']),'cameraWordCount':len(camera_words),'cameraVisibleWordCount':sum(wb-wa for (wa,wb),segment in zip(ranges,job['segments']) if segment['camera']),'cameraSegments':sum(s['camera'] for s in job['segments']),'cameraSamples':upload_samples,'cameraDuration':upload_samples/rate,'naturalPausesPreserved':True,'timeStretch':False,'voiceVerified':False,'avatarVerified':False,'subjectiveListeningPerformed':False,'warnings':warnings,'onsetCorrections':corrections}
    dump(out/'camera_manifest.json',{'source':original.name,'upload':'camera_upload.wav','sampleRate':rate,'sourceSha256':digest(original),'method':'Native-rate PCM chunks; silent boundary context may extend under B-roll. sourceStart/sourceEnd describe visible camera spans; renderSourceStart/renderSourceEnd describe full uploaded chunks. No normalization, speed changes, fades or internal pause removal. Full narration unchanged.','segments':manifest,'boundaries':boundary_report,'warnings':warnings})
    for p,h in before.items():
        if digest(Path(p))!=h:raise RuntimeError(f'Concurrent production ledger changed: {p}; helper never writes this ledger')
    dump(out/'alignment-report.json',checks)
    print(json.dumps(checks,indent=2))

if __name__=='__main__':main()
