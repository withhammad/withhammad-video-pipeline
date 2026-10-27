// Our Claude Motion brief, split into its parts (our own wording). [square brackets] = the orange bits you swap.
// Shared by poster.html and reel.html; brief.txt is the same text as one plain message.
window.ANATOMY = {
  opener: { text: 'Build me a motion graphic. Stick to this brief line by line:', name: 'Opener', note: 'Starts any normal chat' },
  parts: [
    { head: 'Quality bar', color: '#5856D6', name: 'The bar', note: 'Sets the standard',
      text: 'Make it look like [an Apple keynote]: every frame a UI moment from [a product launch page], [tactile, physical, polished, premium].' },
    { head: 'Format', color: '#0A84FF', name: 'Format', note: 'Size, length, loop',
      text: 'Canvas [1080 x 1350]. Length [6 seconds]. A seamless loop: the final frame equals the first.' },
    { head: 'One rule', color: '#8E5CF6', name: 'One rule', note: 'One object, one change',
      text: 'ONE hero object fills [60-70%] of the frame, makes ONE satisfying change, then resets smoothly.' },
    { head: 'Look', color: '#E0457B', name: 'Look', note: 'Glass, depth, colour',
      text: 'Real depth: soft layered shadows, frosted glass with a bright 1px edge. [System colours], one or two per piece: blue {#0A84FF}, green {#30D158}.' },
    { head: 'Motion', color: '#1FA34A', name: 'Motion', note: 'Physical, never linear',
      text: 'Springs on everything that moves: real mass and a small settle. Hold each end state [1.2 seconds] so it reads.' },
    { head: 'Never', color: '#E5484D', name: 'Never', note: 'Blocks the AI defaults',
      text: 'No grey placeholder bars, stock icons, emoji or clip art. No dark, noisy or full-frame gradient backgrounds.' },
    { head: 'Self-check', color: '#E8A10C', name: 'Self-check', note: 'Claude reviews itself',
      text: 'Screenshot a frame every second. Review each one as [a senior Apple designer], then again at 200px wide.' },
    { head: 'Scene', color: '#F2652D', name: 'The scene', note: 'The only line you rewrite', scene: true,
      text: '[A big glossy "Publish" button. A cursor clicks it, it squashes into a circle, a blue ring fills, it snaps to a green tick with a ripple and widens to read "Published".]' },
  ],
};
// [bits] -> orange marks, {#hex} -> a colour swatch + the hex
window.anatomyHTML = (s) => s
  .replace(/\[([^\]]+)\]/g, '<mark>[$1]</mark>')
  .replace(/\{(#[0-9A-Fa-f]{6})\}/g, '<span class="nw"><i class="sw" style="background:$1"></i>$1</span>');
window.anatomyRows = () => {
  const row = (cls, color, head, text, name, note) => `<div class="row ${cls}">
    <div class="txt">${head ? `<div class="h" style="color:${color}">## ${head}</div>` : ''}${anatomyHTML(text)}</div>
    <div class="lab" style="color:${color}"><div class="br"></div><div class="lt"><b>${name}</b><span>${note}</span></div></div></div>`;
  const A = window.ANATOMY;
  return row('opener', '#b9b6c4', '', A.opener.text, A.opener.name, A.opener.note) +
    A.parts.map((p) => row(p.scene ? 'scene' : '', p.color, p.head, p.text, p.name, p.note)).join('');
};
