"""Write the Remotion data.json for RubberWorldReel from standin/timeline.json + blender/shots.json + render stats."""
import json, os, sys
J = os.path.dirname(os.path.abspath(__file__))
SRC = 'take' if '--final' in sys.argv else 'standin'
tl = json.load(open(f'{J}/{SRC}/timeline.json')); shots = json.load(open(f'{J}/blender/shots.json'))
st = [json.load(open(f'{J}/blender/stats_{p}.json')) for p in ('stage', 'city', 'street')]
rs = {'frames': sum(x['frames'] for x in st), 'minutes': round(max(st[0]['seconds'], st[1]['seconds'] + st[2]['seconds']) / 60)}
frames = int(round(tl['total'] * 30)) + 1
d = dict(frames=frames, standin='--final' not in sys.argv, lines=tl['lines'], words=tl['words'], payoff=tl['payoff'],
         shots={k: [a - 1, b - 1] for k, (a, b) in shots.items()}, render=rs)
json.dump(d, open(f'{J}/../../../remotion/src/rubberworld/data.json', 'w'), indent=0)
print('frames', frames, 'shots', len(shots))
