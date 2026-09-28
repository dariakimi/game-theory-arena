export default [
{ id: 'salary-ultimatum', type: 'ultimatum', emoji: '💼', title: 'Name Your Salary', tag: 'Ultimatum game',
  setup: "The team has $120k for this hire. You name your cut; the rest pays for your equipment and the bonus pool.",
  unit: { k: 'usd', label: 'first-year pay' }, them: 'HR manager',
  pot: 120000, threshold: 30, rejectPay: [0, 0],
  takeaway: "HR needed to keep at least 30%, so any ask above $84k would have lost you the job entirely.",
  why: "In ultimatum games people reject 'unfair' offers even at a cost to themselves. Knowing the other side's walk-away point is everything." },

{ id: 'divorce-split', type: 'ultimatum', emoji: '🏠', title: 'Splitting the House', tag: 'Loss aversion',
  setup: "You're dividing $400k of house equity. Offer too little and your ex goes to court, where lawyers eat $160k.",
  unit: { k: 'usd', label: 'share of the equity' }, them: 'Ex-spouse',
  pot: 400000, threshold: 40, rejectPay: [120000, 120000],
  takeaway: "Your ex would accept nothing below 40%, and going to court would leave you both far worse off.",
  why: "Kahneman and Tversky showed that people feel losses about twice as strongly as gains, so an offer that feels unfair gets rejected even when accepting is rational." },

{ id: 'centipede', type: 'centipede', emoji: '🐛', title: 'The Growing Pot', tag: 'Backward induction',
  setup: "You and a partner take turns. Take 80% of the pot now, or pass and let it double for the other player's turn.",
  unit: { k: 'usd', label: 'payout' }, them: 'Partner',
  startPot: 400, growth: 2, takeShare: 0.8, nodes: 10, opponent: 'patient',
  takeaway: "Logic says take at once, but passing built a far bigger pot, as long as you took just before your partner would.",
  why: "Backward induction predicts taking at the first move, yet in experiments most people pass several times. Trust beats pure logic here." },
];
