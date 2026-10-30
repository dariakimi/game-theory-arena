export default [
{ id: 'salary-ultimatum', type: 'ultimatum', emoji: '💼', title: 'Name Your Salary', tag: 'Ultimatum game',
  setup: "The team has $120k for this hire. You name your salary, and the rest pays for your equipment and the team's bonus pool.",
  unit: { k: 'usd', label: 'first-year pay' }, them: 'HR manager',
  pot: 120000, threshold: 30, rejectPay: [0, 0],
  takeaway: "HR needed to keep at least 30%, so any request above $84k would have cost you the job.",
  why: "In experiments, people turn down offers they see as unfair even when it costs them. Knowing where the other side walks away decides this game." },

{ id: 'divorce-split', type: 'ultimatum', emoji: '🏠', title: 'Splitting the House', tag: 'Loss aversion',
  setup: "You're dividing $400k of house equity with your ex. Offer too little and they go to court, where lawyers take $160k.",
  unit: { k: 'usd', label: 'share of the equity' }, them: 'Ex-partner',
  pot: 400000, threshold: 40, rejectPay: [120000, 120000],
  takeaway: "Your ex would accept nothing below 40%, and going to court leaves you both $80k worse off than an even split.",
  why: "Daniel Kahneman and Amos Tversky found that losses feel about twice as strong as gains, so people reject offers that feel unfair." },

{ id: 'centipede', type: 'centipede', emoji: '🐛', title: 'The Growing Pot', tag: 'Backward induction',
  setup: "You and a partner take turns. Take 80% of the pot now, or pass and let it double for your partner's turn.",
  unit: { k: 'usd', label: 'payout' }, them: 'Partner',
  startPot: 400, growth: 2, takeShare: 0.8, nodes: 10, opponent: 'patient',
  takeaway: "Pure logic says take the money at once, yet passing built a much bigger pot, as long as you took it just before your partner would.",
  why: "Working backwards from the last turn says the first player should take immediately. In experiments, most people pass several times and earn more." },
];
