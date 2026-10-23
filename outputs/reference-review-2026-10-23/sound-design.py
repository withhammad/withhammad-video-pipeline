from pathlib import Path
import numpy as np,wave,json
R=Path(__file__).resolve().parents[2]; sr=48000
for name,duration in [('coding-comedy-review',1477/30),('ai-returns-review',2380/30)]:
 n=round(duration*sr);snd=np.zeros(n);rng=np.random.default_rng(20261023)
 if name.startswith('coding'):
  # Original quiet mechanical clicks only on the two comic file cascades.
  for start,end in [(3.2,6.1),(43.4,45.35)]:
   for at in np.arange(start,end,.13):
    x=np.arange(int(.07*sr))/sr;grain=(rng.standard_normal(len(x))*.7+np.sin(2*np.pi*1450*x)*.3)*np.exp(-x*105)*.027
    i=round(at*sr);snd[i:i+len(grain)]+=grain[:len(snd)-i]
 else:
  # Quiet original electric-piano-like notes. No third-party recording or melody.
  progression=[[146.83,220,293.66,369.99],[123.47,185,246.94,293.66],[98,146.83,196,246.94],[110,164.81,220,293.66]]
  for at in np.arange(0,duration,4.0):
   chord=progression[int(at/4)%4]
   for j,hz in enumerate(chord):
    start=at+j*.46;x=np.arange(int(4.3*sr))/sr;env=(1-np.exp(-x*9))*np.exp(-x*.9)
    tone=(np.sin(2*np.pi*hz*x)+.13*np.sin(2*np.pi*2*hz*x)+.05*np.sin(2*np.pi*3*hz*x))*env*.009
    i=round(start*sr);ln=min(len(tone),n-i)
    if ln>0:snd[i:i+ln]+=tone[:ln]
  fade=np.minimum(np.arange(n)/(sr*.6),1)*np.minimum((n-np.arange(n))/(sr*1.2),1);snd*=fade
 p=R/'outputs'/name/'sound-design.wav'
 with wave.open(str(p),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((snd*32767).astype(np.int16).tobytes())
 print(name,round(duration,3), 'original synthesis')
