import numpy as np,wave
from pathlib import Path
sr=48000;dur=15.5;t=np.arange(int(sr*dur))/sr
# Original quiet plucked pattern, one short rising flourish per model change.
y=np.zeros_like(t)
for start in np.arange(0,dur,.5):
 f=[196,246.94,293.66,392][int(start*2)%4];z=t-start;mask=(z>=0)&(z<.45);y[mask]+=.12*np.exp(-z[mask]*8)*np.sin(2*np.pi*f*z[mask])
for start in [3.45,8.6167,13.7833]:
 z=t-start;mask=(z>=0)&(z<.45);y[mask]+=.1*np.sin(2*np.pi*(300*z[mask]+650*z[mask]**2))*np.sin(np.pi*z[mask]/.45)**2
y*=np.minimum(1,t/.05)*np.minimum(1,(dur-t)/.1)
with wave.open('work/batch-20261027b/hype-sound.wav','wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((y*32767).astype('<i2').tobytes())
