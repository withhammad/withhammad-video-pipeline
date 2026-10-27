// The 27 installs on the poster. Every repo and star count checked on GitHub 2026-10-27 (gh api repos/<repo>);
// "official" = made by Anthropic, "built-in" = a Claude feature (Styles, support.claude.com/en/articles/10181068).
// Same five folders and slot counts as the reference (6, 6, 5, 5, 5); our own picks and wording.
window.POSTER = {
  title: ['27 Free Installs to Set Up', 'Claude for '],
  titleAccent: 'LinkedIn',
  sub: ['Claude has none of these by default.', ' 5 jobs, 27 installs.'],
  byline: 'Hammad Yousuf',
  root: ['My LinkedIn stack', '5 jobs · 27 free installs'],
  footer: ['Every install step, free:', 'withhammad.com/resources/claude-linkedin-installs'],
  folders: [
    { name: 'Your voice', sub: 'your tone, not a bot’s', line: '#2f80ed', fill: ['#8fd3ff', '#4fb2f5'], items: [
      ['humanizer', 'star', '61.1k', 'Cleans the AI tells out of a draft.'],
      ['skill-creator', 'official', '', 'Turns your best posts into a voice skill.'],
      ['copy-editing', 'star', '56.7k', 'Line-edits a draft until it reads clean.'],
      ['product-marketing', 'star', '56.7k', 'Saves who you help and how you say it.'],
      ['anti-ai-writing', 'star', '114', 'Flags lines that read machine-made.'],
      ['custom styles', 'builtin', '', 'Learns your tone from sample posts.'],
    ] },
    { name: 'Ideas', sub: 'what to post next', line: '#a259e6', fill: ['#dcc6ff', '#b893f2'], items: [
      ['last30days', 'star', '65.6k', 'What people said on a topic this month.'],
      ['content-strategy', 'star', '56.7k', 'Plans your pillars and topics.'],
      ['customer-research', 'star', '56.7k', 'Mines calls and reviews for pain points.'],
      ['competitor-profiling', 'star', '56.7k', 'Profiles a rival from their URL.'],
      ['exa-mcp', 'star', '5.2k', 'Searches the web for fresh angles.'],
      ['firecrawl-mcp', 'star', '7.7k', 'Turns any page into clean notes.'],
    ] },
    { name: 'Writing', sub: 'drafts the post', line: '#22b84a', fill: ['#9bf0a0', '#4fd65e'], items: [
      ['social', 'star', '56.7k', 'Drafts LinkedIn posts and carousels.'],
      ['viral-hooks', 'star', '114', 'Rewrites a flat first line.'],
      ['storytelling', 'star', '114', 'Keeps readers going past the hook.'],
      ['copywriting', 'star', '56.7k', 'Sharpens offers and calls to action.'],
      ['marketing-psychology', 'star', '56.7k', 'Adds the persuasion behind a click.'],
    ] },
    { name: 'Visuals', sub: 'graphics worth saving', line: '#f59e0b', fill: ['#ffc56b', '#ff9a1f'], items: [
      ['canvas-design', 'official', '', 'Designs posters as PNG or PDF.'],
      ['frontend-design', 'official', '', 'Gives HTML graphics a design eye.'],
      ['impeccable', 'star', '89.5k', 'Kills the generic AI design look.'],
      ['hyperframes', 'star', '73.3k', 'Renders HTML into motion graphics.'],
      ['excalidraw-mcp', 'star', '5.6k', 'Sketches hand-drawn diagrams.'],
    ] },
    { name: 'Tools', sub: 'links Claude to your apps', line: '#ef4444', fill: ['#ffb3b3', '#ff7f86'], items: [
      ['claude-in-chrome', 'official', '', 'Lets Claude act in your browser.'],
      ['linkedin-mcp', 'star', '4.0k', 'Reads profiles, jobs and messages.'],
      ['apify-mcp', 'star', '13.4k', 'Pulls posts and data from social sites.'],
      ['notion-mcp', 'star', '4.7k', 'Reads and writes your Notion pages.'],
      ['postiz', 'star', '38.6k', 'Schedules posts to LinkedIn and more.'],
    ] },
  ],
};
