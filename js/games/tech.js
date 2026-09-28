const USD = { k: 'usd' };

export default [
{ id: 'algo-transparency', type: 'matrix', emoji: '🔍', title: 'Open the Algorithm?', tag: 'Accountability vs IP',
  setup: "Publish your recommendation algorithm for public audit, or keep it secret? A rival platform decides too.",
  unit: { ...USD, label: 'annual value' }, them: 'Rival platform', coop: 0,
  rows: ['Publish it', 'Keep it secret'], cols: ['Publishes', 'Keeps secret'],
  pay: [[40e6, 40e6], [10e6, 20e6], [20e6, 10e6], [30e6, 30e6]], expectNash: [0, 3],
  takeaway: "Transparency together earns trust and eases regulation, but going first alone just exposes your IP.",
  why: "Both 'everyone publishes' and 'everyone stays secret' are stable, and regulation like the EU DSA pushes toward the first." },

{ id: 'moderation', type: 'matrix', emoji: '🛑', title: 'Content Moderation', tag: 'Race to the bottom',
  setup: "Strict moderation keeps advertisers happy; lenient moderation attracts creators. Your rival is choosing too.",
  unit: { ...USD, label: 'ad revenue' }, them: 'Rival platform', coop: 0,
  rows: ['Moderate strictly', 'Be lenient'], cols: ['Strict', 'Lenient'],
  pay: [[60e6, 60e6], [30e6, 80e6], [80e6, 30e6], [40e6, 40e6]], expectNash: [3],
  takeaway: "Leniency steals creators from a strict rival, so both go lenient and advertisers pull back from both.",
  why: "A Prisoner's Dilemma. Industry codes and brand-safety standards are attempts to coordinate on strictness." },

{ id: 'api-access', type: 'matrix', emoji: '🔗', title: 'Build on Their API?', tag: 'Platform power',
  setup: "You're a startup. Build on a big platform's API, or build your own stack? The platform decides whether to keep the API open.",
  unit: { ...USD, label: 'project value' }, them: 'Big platform',
  rows: ['Build on platform', 'Build your own'], cols: ['Keeps API open', 'Restricts API'],
  pay: [[40e6, 30e6], [15e6, 20e6], [5e6, 10e6], [25e6, 20e6]], expectNash: [0, 3],
  takeaway: "Building on an open API is best for both, but if you expect them to restrict it, build your own.",
  why: "Twitter, Facebook and Reddit all restricted APIs after startups built on them, so developers now price in that risk." },

{ id: 'ai-safety', type: 'matrix', emoji: '🧠', title: 'AI Safety Race', tag: 'Safety vs speed',
  setup: "Two AI labs choose: spend months on safety testing, or race to deploy first?",
  unit: { ...USD, label: 'valuation gain' }, them: 'Rival AI lab', coop: 0,
  rows: ['Invest in safety', 'Race to deploy'], cols: ['Safety first', 'Races'],
  pay: [[40e9, 40e9], [15e9, 60e9], [60e9, 15e9], [25e9, 25e9]], expectNash: [3],
  takeaway: "Racing wins market share whatever the other does, so both race and the whole field takes on more risk.",
  why: "This is the argument for binding safety commitments and shared evaluation standards: they change the payoffs so being careful isn't punished." },
];
