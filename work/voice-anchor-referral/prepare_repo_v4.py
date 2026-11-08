"""Prepare the ONE authorized v4 take. Never invokes a generation service."""
import json, math, re, subprocess, sys
from pathlib import Path
import numpy as np
import parselmouth

R = Path('/Users/hammad/withhammad-video-pipeline')
sys.path.insert(0, str(R / 'studio'))
from app import audio, voice_gates, tighten
J = R / 'studio/.local/jobs/dfa218634321'
V = J / 'v4-revision'
take = json.loads((V / 'take.json').read_text())
assert take['voice']['voice_id'] == '4b02b874862049f69b6034bbdc0fb282'
assert take['knobs']['model'] == 'eleven_v4'
assert take['speed'] == 1.1 and take['knobs']['stability'] == .5
caps = [{'text': (' ' if i else '') + w['word'], 'startMs': round(w['start']*1000),
         'endMs': round(w['end']*1000), 'timestampMs': round((w['start']+w['end'])*500), 'confidence': 1}
        for i, w in enumerate(w for w in take['words'] if not w['word'].startswith('<'))]
assert len(caps) == 121 and all(w['endMs'] > w['startMs'] for w in caps)
B = J / 'rejected-v3'
old = json.loads(((B if (B/'captions.json').exists() else J) / 'captions.json').read_text())
norm = lambda x: re.sub(r'[^a-z0-9]', '', x.lower())
assert [norm(w['text']) for w in old] == [norm(w['text']) for w in caps]

# REFERRAL is a raw take with a static mix gain. Preserve this source's timbre,
# pitch and word duration too; do not apply the older REA-specific EQ chain.
raw = audio.decode(V / 'voice-raw.mp3')
audio.write_wav(V / 'voice-source.wav', raw)
subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i','color=black:s=32x32:r=30',
                '-i',str(V/'voice-source.wav'),'-shortest','-c:v','libx264','-preset','ultrafast',
                '-c:a','flac',str(V/'voice-source.mp4')],check=True)
cut = tighten.tighten(V/'voice-source.mp4',V/'voice-tight.mp4',caps,measure=False,
                      av_offset_ms=0,speed=1,end_cap_ms=120,min_cut_ms=40)
(V/'cuts.json').write_text(json.dumps(cut,indent=2)+'\n')
caps = cut['captions']
start=cut['lead_trim_ms'];kept=[]
for c in cut['cuts']:
    kept.append((start,c['audio_src_ms'][0]));start=c['audio_src_ms'][1]
kept.append((start,cut['duration_in_ms']))
chunks=[]
for i,(lo,hi) in enumerate(kept):
    chunk=raw[round(lo*48):round(hi*48)].copy();fade=240
    if i:chunk[:fade]*=np.linspace(0,1,fade)[:,None]
    if i<len(kept)-1:chunk[-fade:]*=np.linspace(1,0,fade)[:,None]
    chunks.append(chunk)
raw=np.concatenate(chunks)
audio.write_wav(V/'voice-tight.wav',raw)
# A small sibilance correction, measured against REFERRAL. No pitch shaping,
# low/mid voice EQ, speed change or voice substitution.
subprocess.run(['ffmpeg','-v','error','-y','-i',str(V/'voice-tight.wav'),'-af',
                'equalizer=f=6500:t=q:w=0.7:g=-1.5','-ar','48000','-c:a','pcm_s24le',str(V/'voice-deessed.wav')],check=True)
raw=audio.decode(V/'voice-deessed.wav')
raw_level = audio._ebur128(str(V / 'voice-deessed.wav'))['lufs']
gain = -19 - raw_level
audio.write_wav(V / 'voice.wav', raw * 10 ** (gain/20))
duration = math.ceil(len(raw) / 48000 * 30) / 30
(V / 'captions.json').write_text(json.dumps(caps, indent=2)+'\n')
(V / 'script.txt').write_text(take['text']+'\n')

def profile(path):
    x = audio.decode(path, channels=1).reshape(-1)
    snd = parselmouth.Sound(x, 48000)
    pitch = snd.to_pitch_ac(time_step=.01, pitch_floor=75, pitch_ceiling=500)
    f = pitch.selected_array['frequency']; f = f[f > 0]
    meter = audio._ebur128(str(path))
    return {'duration_s': len(x)/48000, 'median_hz': round(float(np.median(f)),2),
            'pitch_p5_p95_semitones': round(float(12*np.log2(np.percentile(f,95)/np.percentile(f,5))),2),
            'hf_8_16k_re_250_4k_db': voice_gates.hf_balance(x),
            'sib_5_9k_p99_re_lufs_db': voice_gates.sibilance_p99(x, meter['lufs']),
            'meter': meter, 'pauses': voice_gates.stem_pauses(path)}

ref = R / 'studio/.local/jobs/33d9c1e97156/take/heygen_raw.mp4'
profiles = {'referral_raw': profile(ref), 'repo_v4': profile(V/'voice.wav')}
rows = voice_gates.run(V/'voice.wav', captions=caps, cuts=cut['cuts'],source=cut['source'], reference=profiles['referral_raw'])
report = {'source_asset': take['outputId'], 'source_settings': take['knobs'],
          'processing': {'static_gain_db': gain, 'sibilance_eq': '6500Hz Q0.7 -1.5dB; measured to REFERRAL', 'word_speed': 1, 'pitch_shift': 0,
                         'pause_cuts':len(cut['cuts']),'removed_silence_ms':cut['removed_ms']},
          'profiles': profiles, 'voice_gate_rows': rows, 'duration_s': duration,
          'note': 'Same verified clone and REFERRAL settings. Acoustic measurements do not prove perceived identity; owner judges the finished cut.'}
(V/'voice-review.json').write_text(json.dumps(report,indent=2)+'\n')

# A word-constrained acoustic time warp reuses the existing same-script avatar.
# Only picture time changes. The new voice remains at its original pace.
anchors = [(0.,0.)]
for a,b in zip(old,caps):
    anchors.extend([(b['startMs']/1000,a['startMs']/1000), (b['endMs']/1000,a['endMs']/1000)])
anchors.append((duration,49.0))
clean=[]
for x,y in anchors:
    if clean and x <= clean[-1][0]:
        if x == clean[-1][0]: clean[-1]=(x,max(y,clean[-1][1]))
        continue
    clean.append((x,y))
xs,ys = np.asarray(clean).T
old_pcm = audio.decode((B if (B/'voice.wav').exists() else J)/'voice.wav',channels=1).reshape(-1)
new_pcm = audio.decode(V/'voice.wav',channels=1).reshape(-1)

def mfcc(x):
    # 48kHz -> 16kHz using ffmpeg-produced source is unnecessary for the
    # relative clock: a 25ms Hann STFT at 48kHz keeps every phonetic band.
    win,hop,nfft=1200,480,2048
    framed=np.lib.stride_tricks.sliding_window_view(np.pad(x,(600,600)),win)[::hop]
    power=np.abs(np.fft.rfft(framed*np.hanning(win),n=nfft))**2
    hz=lambda m:700*(10**(m/2595)-1)
    mel=lambda f:2595*np.log10(1+f/700)
    edges=hz(np.linspace(mel(100),mel(7600),50))
    freq=np.fft.rfftfreq(nfft,1/48000)
    filters=np.array([np.maximum(0,np.minimum((freq-a)/(b-a),(c-freq)/(c-b))) for a,b,c in zip(edges,edges[1:],edges[2:])])
    logmel=np.log(np.maximum(power@filters.T,1e-9))
    dct=np.cos(np.pi/48*(np.arange(48)+.5)[None,:]*np.arange(1,21)[:,None])
    cep=logmel@dct.T
    cep=(cep-np.mean(cep,axis=0))/(np.std(cep,axis=0)+1e-8)
    cep/=np.linalg.norm(cep,axis=1,keepdims=True)+1e-8
    return cep.astype(np.float32)

a,b=mfcc(old_pcm),mfcc(new_pcm)
expected=np.interp(np.arange(len(b))*.01,xs,ys)/.01
back={}; prev={}; band=20
for i in range(len(b)):
    lo=max(0,int(expected[i])-band); hi=min(len(a)-1,int(expected[i])+band)
    row={}
    costs=1-a[lo:hi+1]@b[i]
    for j,cost in zip(range(lo,hi+1),costs):
        candidates=[(prev.get(j-1,float('inf')),0),(prev.get(j,float('inf'))+.10,1),(row.get(j-1,float('inf'))+.10,2)]
        value,step=min(candidates)
        if i==0 and j==0:value=0
        if math.isfinite(value): row[j]=value+float(cost);back[(i,j)]=step
    if not row: raise RuntimeError(f'No time-warp path at {i}')
    prev=row
i=len(b)-1;j=min(prev,key=lambda j:prev[j]+abs(j-(len(a)-1))*.1)
path=[]
while i>=0 and j>=0:
    path.append((i,j));step=back.get((i,j),0)
    if step==0:i-=1;j-=1
    elif step==1:i-=1
    else:j-=1
by={}
for i,j in path:by.setdefault(i,[]).append(j*.01)
warp=np.array([np.mean(by.get(i,[expected[i]*.01])) for i in range(len(b))])
warp=np.maximum.accumulate(np.convolve(np.pad(warp,(2,2),mode='edge'),np.ones(5)/5,mode='valid'))
frames=np.arange(round(duration*30))/30
picture=np.interp(frames,np.arange(len(warp))*.01,warp)
timeline={'durationFrames':len(frames),'durationSeconds':duration,
          'oldSeconds':49,'anchors':clean,'pictureOldSeconds':np.round(picture,5).tolist(),
          'ctaStart': next(w['startMs']/1000 for w in caps if norm(w['text'])=='comment'),
          'method':'Word-constrained MFCC DTW (10ms) of the identical 121-word script; picture only; 100ms source lip correction retained.'}
(V/'retime.json').write_text(json.dumps(timeline,indent=2)+'\n')
print(json.dumps({'duration':duration,'voice_review':report,'retime':{'frames':len(frames),'ctaStart':timeline['ctaStart'],'max_word_clock_deviation_s':float(np.max(np.abs(warp-expected[:len(warp)]*.01))) }},indent=2))
