export const FPS = 30;
export const INTRO = 108;
export const STEP = 108;
export const OUTRO = 144;
export const DURATION = INTRO + STEP * 15 + OUTRO;
export const COLORS = {bg: '#191918', paper: '#F2EFE7', coral: '#D97858', white: '#F8F5EF', dim: '#C3C0B9', ink: '#242321'};
export const GROUPS = ['The core', 'Remembering', 'Safety', 'Working with you', 'Extend and run'];
export const SOURCE = 'Paweł Huryn · phuryn/mini-harness';
export const SOURCE_URL = 'https://github.com/phuryn/mini-harness';
export const RESOURCE_URL = 'https://withhammad.com/resources/build-an-agent-harness';
export const KEYWORD = 'HARNESS';
export const CARDS = [
  {title: 'Reasoning loop', short: 'Reasoning loop', body: 'Choose an action. Run it. Return the result.', note: 'MODEL → ACTION → RESULT'},
  {title: 'Tool calls', short: 'Tools', body: 'Give tools clear jobs and errors that help.', note: 'READ · WRITE · EDIT · RUN'},
  {title: 'Context window', short: 'Context', body: 'Append messages; preserve the earlier conversation.', note: 'ADD CONTEXT WITHOUT REWRITING IT'},
  {title: 'Saved sessions', short: 'Sessions', body: 'Save events as they happen so work can resume.', note: 'SURVIVE INTERRUPTIONS'},
  {title: 'Compaction', short: 'Compaction', body: 'Turn crowded history into a shorter working summary.', note: 'MAKE ROOM FOR THE NEXT STEP'},
  {title: 'Memory', short: 'Memory', body: 'Keep editable notes outside the conversation.', note: 'LOAD THE NOTE WHEN NEEDED'},
  {title: 'Permission gate', short: 'Permissions', body: 'Ask before risky actions. A gate is no sandbox.', note: 'CONTROL WHAT MAY RUN'},
  {title: 'Permission judge', short: 'Judge', body: 'Assess the action without trusting files or webpages.', note: 'SEPARATE THE DECISION FROM THE DATA'},
  {title: 'Read-only search', short: 'Search', body: 'Find project content while excluding secret files.', note: 'SEARCH WITHOUT CHANGING FILES'},
  {title: 'Ask the user', short: 'Ask the user', body: 'Resolve decisions before taking the wrong path.', note: 'CLARIFY THE CHOICE'},
  {title: 'Subagents', short: 'Subagents', body: 'Give a small job fresh context; return its result.', note: 'KEEP THE MAIN CONTEXT FOCUSED'},
  {title: 'Goal review', short: 'Goal review', body: 'Finish after checks and an independent review.', note: 'VERIFY BEFORE CALLING IT DONE'},
  {title: 'Skills + MCP', short: 'Skills + MCP', body: 'Load task instructions and connect external tools.', note: 'EXTEND THE HARNESS'},
  {title: 'Models + cost', short: 'Models + cost', body: 'Track usage and cost for each model call.', note: 'FREE CODE ≠ FREE MODEL USAGE'},
  {title: 'Chat or headless', short: 'Chat / headless', body: 'Chat interactively or run one unattended job.', note: 'CHOOSE HOW THE WORK RUNS'},
];

// Pixel windows from the owner's 800×1000 reference. Only the existing process
// diagrams are reused; headings and explanations are editable live text.
export const CROPS = CARDS.map((_, i) => ({x: [142, 358, 573][i % 3], y: [135, 293, 450, 607, 766][Math.floor(i / 3)], w: 191, h: 70}));
