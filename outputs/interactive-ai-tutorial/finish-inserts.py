"""Add verified Claude footage and the HyperFrames animation to the complete edit."""
import json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
JOB = ROOT / 'studio/.local/jobs/fdb2463f9d21'
EDIT = JOB / 'edit-final'

def run(args):
    subprocess.run(['ffmpeg', '-y', '-v', 'error', *args], check=True)

def main():
    run(['-i', str(JOB / 'claude-prompt.mp4'), '-i', str(JOB / 'claude-result.mp4'),
         '-filter_complex', '[0:v]setpts=PTS-STARTPTS,fps=30,setsar=1[a];'
         '[1:v]setpts=PTS-STARTPTS,fps=30,setsar=1[b];[a][b]concat=n=2:v=1:a=0[v]',
         '-map', '[v]', '-an', '-c:v', 'libx264', '-preset', 'veryfast',
         '-crf', '18', '-threads', '2', str(JOB / 'claude-normalized.mp4')])
    animation = JOB / 'workflow-landscape.mp4'
    run(['-i', str(JOB / 'hyperframes/workflow.webm'), '-vf',
         'crop=720:540:0:0,scale=1280:960,pad=1920:960:320:0:color=0x122b27',
         '-an', '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
         '-pix_fmt', 'yuv420p', str(animation)])
    replacements = {}
    for name, insert, start, length in [
        ('01-introduction', animation, 58.0, 5.0),
        ('02-newsletter-build', JOB / 'claude-normalized.mp4', 54.3, 5.5),
    ]:
        target = EDIT / (name + '-finished.mp4')
        if target.exists():
            replacements[name] = target
            continue
        graph = (f'[1:v]setsar=1,setpts=PTS-STARTPTS+{start}/TB[insert];'
                 f'[0:v][insert]overlay=0:0:eof_action=pass:'
                 f"enable='between(t,{start},{start+length})'[v]")
        run(['-i', str(EDIT / (name + '.mp4')), '-i', str(insert),
             '-filter_complex', graph, '-map', '[v]', '-map', '0:a',
             '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-threads', '2',
             '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'copy',
             '-movflags', '+faststart', str(target)])
        replacements[name] = target
    if '--prepare' in sys.argv:
        return
    manifest = json.loads((OUT / 'edit-manifest.json').read_text())
    if not (OUT / 'full-tutorial.mp4').exists():
        raise RuntimeError('Complete base edit is required before finishing inserts')
    concat = EDIT / 'finished-concat.txt'
    concat.write_text('\n'.join("file '" + str(replacements.get(n, EDIT / (n + '.mp4'))) + "'"
                                for n in manifest['order']))
    final = OUT / 'full-tutorial-finished.mp4'
    run(['-f', 'concat', '-safe', '0', '-i', str(concat), '-c', 'copy',
         '-movflags', '+faststart', str(final)])
    final.replace(OUT / 'full-tutorial.mp4')
    manifest['inserts'] = ['HyperFrames workflow animation', 'Recorded Claude build and completed artifact']
    (OUT / 'edit-manifest.json').write_text(json.dumps(manifest, indent=2))

if __name__ == '__main__':
    main()
