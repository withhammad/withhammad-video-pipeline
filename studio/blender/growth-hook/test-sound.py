"""Original three-second test score and impact; no licensed recordings or paid assets."""
import math, sys, wave
from pathlib import Path
import numpy as np

sr=48000; duration=3; n=sr*duration
tall=np.arange(n)/sr
x=sum(.10*np.sin(math.tau*f*tall) for f in (220,261.63,329.63))
x*=np.minimum(tall/.008,1)
rng=np.random.default_rng(7)
def put(at,signal):
    i=round(at*sr); count=min(len(signal),n-i)
    if count>0:x[i:i+count]+=signal[:count]
for k in range(12):
    t=np.arange(round(.24*sr))/sr
    # A plucked minor arpeggio at 120 BPM, eighth notes.
    note=[0,7,10,14][k%4];f=220*2**(note/12)
    put(k*.25,.08*np.sin(math.tau*f*t)*np.exp(-18*t)*np.minimum(t/.003,1))
for k in range(6):
    t=np.arange(round(.24*sr))/sr
    put(k*.5,.12*np.sin(math.tau*(54*t+28*(1-np.exp(-22*t))/22))*np.exp(-20*t))
t=np.arange(round(.18*sr))/sr
put(22/30,.04*rng.normal(size=len(t))*np.exp(-40*t)+.10*np.sin(math.tau*90*t)*np.exp(-24*t))
# Keep the phrase active to the final frame; only a tiny anti-click endpoint ramp.
x[-120:]*=np.linspace(1,0,120)
p=Path(sys.argv[1]);p.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(p),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr)
    w.writeframes((np.repeat(np.clip(x,-.9,.9)[:,None],2,axis=1)*32767).astype('<i2').tobytes())
