const USD = { k: 'usd' };

export default [
{ id: 'algo-transparency', type: 'matrix', emoji: '🔍', title: 'Publish the Algorithm?', tag: 'Accountability vs trade secrets',
  setup: "Publish how your feed algorithm works so outsiders can audit it, or keep it secret? A rival platform decides too.",
  unit: { ...USD, label: 'annual value' }, them: 'Rival platform', coop: 0,
  rows: ['Publish it', 'Keep it secret'], cols: ['Publishes', 'Keeps it secret'],
  pay: [[40e6, 40e6], [10e6, 20e6], [20e6, 10e6], [30e6, 30e6]], expectNash: [0, 3],
  takeaway: "Publishing together earns trust and lighter regulation, and publishing alone just gives away your trade secrets.",
  why: "Both outcomes are stable. Laws like the EU's Digital Services Act push platforms toward publishing." },

{ id: 'moderation', type: 'matrix', emoji: '🛑', title: 'Content Moderation', tag: 'Race to the bottom',
  setup: "Strict moderation keeps advertisers happy, and loose moderation attracts creators. Your rival platform is choosing too.",
  unit: { ...USD, label: 'ad revenue' }, them: 'Rival platform', coop: 0,
  rows: ['Moderate strictly', 'Moderate loosely'], cols: ['Strict', 'Loose'],
  pay: [[60e6, 60e6], [30e6, 80e6], [80e6, 30e6], [40e6, 40e6]], expectNash: [3],
  takeaway: "Loose rules win creators from a strict rival, so both platforms loosen up and advertisers spend less on both.",
  why: "This is a Prisoner's Dilemma. Shared industry standards for ad placement are an attempt to keep everyone strict." },

{ id: 'api-access', type: 'matrix', emoji: '🔗', title: 'Build on Their API?', tag: 'Platform power',
  setup: "You run a startup. Build on a big platform's API, or build everything yourself? The platform decides whether to keep the API open.",
  unit: { ...USD, label: 'company value' }, them: 'Big platform',
  rows: ['Build on the platform', 'Build it yourself'], cols: ['Keeps the API open', 'Restricts the API'],
  pay: [[40e6, 30e6], [15e6, 20e6], [5e6, 10e6], [25e6, 20e6]], expectNash: [0, 3],
  takeaway: "Building on an open API is best for both, and if you expect them to restrict it, build it yourself.",
  why: "Twitter, Facebook and Reddit all restricted their APIs after startups had built on them, so founders now plan for that risk." },

{ id: 'ai-safety', type: 'matrix', emoji: '🧠', title: 'AI Safety Race', tag: 'Safety vs speed',
  setup: "Two AI labs choose: spend months on safety testing, or release their new model first?",
  unit: { ...USD, label: 'valuation gain' }, them: 'Rival AI lab', coop: 0,
  rows: ['Test for safety', 'Release first'], cols: ['Tests for safety', 'Releases first'],
  pay: [[40e9, 40e9], [15e9, 60e9], [60e9, 15e9], [25e9, 25e9]], expectNash: [3],
  takeaway: "Releasing first wins market share whatever the other lab does, so both rush and the risks add up across the field.",
  why: "Binding safety commitments and shared testing standards change these numbers, so the careful lab stops losing out." },
];
