"""Write the Remotion data.json for RubberWorldReel from standin/timeline.json + blender/shots.json + render stats."""
import json, os, sys
J = os.path.dirname(os.path.abspath(__file__))
tl = json.load(open(f'{J}/standin/timeline.json')); shots = json.load(open(f'{J}/blender/shots.json'))
rs = json.load(open(f'{J}/blender/render_stats.json')) if os.path.exists(f'{J}/blender/render_stats.json') else {'frames': 1742, 'minutes': 60}
frames = int(round(tl['total'] * 30)) + 1
d = dict(frames=frames, standin='--final' not in sys.argv, lines=tl['lines'], words=tl['words'], payoff=tl['payoff'],
         shots={k: [a - 1, b - 1] for k, (a, b) in shots.items()}, render=rs)
json.dump(d, open(f'{J}/../../../remotion/src/rubberworld/data.json', 'w'), indent=0)
print('frames', frames, 'shots', len(shots))
