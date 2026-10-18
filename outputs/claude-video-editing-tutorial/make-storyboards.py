from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'storyboards'
OUT.mkdir(exist_ok=True)
FONT = Path('/Users/hammad/withhammad-video-pipeline/studio/remotion/public/fonts')
# The system font is used only for local review boards, not redistributed as a font file.
def font(size):
    return ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', size)

SCENES = [
 ('A clear campaign plan', 'Give every decision a place', ['OUTCOME', 'AUDIENCE', 'MESSAGE']),
 ('Start with the outcome', 'What should this campaign achieve?', ['Define the goal', 'Choose a useful measure']),
 ('Who needs to hear this?', 'Connect the audience to the message', ['Audience', 'Relevant message']),
 ('Four different jobs', 'Organize the plan before the edit', ['New customers', 'Creative tests', 'Review performers', 'Existing customers']),
 ('Reach new customers', 'Explain the value clearly', ['Who is it for?', 'Why should they care?']),
 ('Test new creative', 'Compare a deliberate change', ['Version A', 'Version B']),
 ('Review strong performers', 'Use real evidence', ['Objective', 'Results', 'Next decision']),
 ('Reconnect with customers', 'Choose a relevant follow-up', ['Existing customer', 'Useful next step']),
 ('A diagram is not a result', 'Illustration only — no performance guarantee', ['Plan', 'Test', 'Review']),
 ('Build. Review. Improve.', 'A clear process, supported by real data', ['Structure', 'Evidence', 'Iteration']),
]
for n,(title,sub,items) in enumerate(SCENES,1):
    im=Image.new('RGB',(1920,1080),'#f5f8ff');d=ImageDraw.Draw(im)
    d.text((100,70),'WITH HAMMAD  /  CAMPAIGN PLANNING',font=font(25),fill='#1877f2')
    d.text((100,155),title,font=font(72),fill='#102448')
    d.text((104,260),sub,font=font(35),fill='#52647d')
    d.rounded_rectangle((1450,130,1820,900),radius=48,fill='#dfe8f7',outline='#bbcce6',width=3)
    d.text((1500,490),'Presenter',font=font(44),fill='#52647d')
    d.text((1490,550),'placement guide',font=font(29),fill='#52647d')
    for i,label in enumerate(items):
        y=385+i*113
        d.rounded_rectangle((105,y,1320,y+86),radius=22,fill='white',outline='#d5e0f0',width=2)
        d.rounded_rectangle((123,y+15,180,y+71),radius=15,fill='#1877f2')
        d.text((142,y+24),str(i+1),font=font(28),fill='white')
        d.text((215,y+23),label,font=font(37),fill='#102448')
    d.text((105,1000),f'STORYBOARD {n:02d} / 10 • Original design • Timing to be aligned to narration',font=font(23),fill='#52647d')
    im.save(OUT/f'{n:02d}.png')
board=Image.new('RGB',(1280,1800),'#d5e0f0')
for i,f in enumerate(sorted(OUT.glob('*.png'))):
    im=Image.open(f);im.thumbnail((640,360));board.paste(im,((i%2)*640,(i//2)*360))
board.save(ROOT/'storyboard-overview.jpg',quality=90)
(ROOT/'storyboard-scenes.json').write_text(json.dumps([{'scene':i+1,'title':s[0],'subheading':s[1],'elements':s[2],'timing_status':'pending measured source audio'} for i,s in enumerate(SCENES)],indent=2)+'\n')
print('Created ten original storyboard frames and a contact sheet')
