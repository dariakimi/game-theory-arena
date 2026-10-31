import classic from './classic.js?v=2';
import business from './business.js?v=2';
import social from './social.js?v=2';
import geopolitics from './geopolitics.js?v=2';
import tech from './tech.js?v=2';
import bargaining from './bargaining.js?v=2';
import auctions from './auctions.js?v=2';
import markets from './markets.js?v=2';
import signaling from './signaling.js?v=2';

export const CATEGORIES = [
  { key: 'classic', name: 'Classics', emoji: '🎲', color: 'pink', games: classic },
  { key: 'business', name: 'Business', emoji: '💼', color: 'blue', games: business },
  { key: 'social', name: 'Social Dilemmas', emoji: '🌍', color: 'green', games: social },
  { key: 'geopolitics', name: 'Geopolitics', emoji: '🕊️', color: 'purple', games: geopolitics },
  { key: 'tech', name: 'Tech & AI', emoji: '🤖', color: 'teal', games: tech },
  { key: 'bargaining', name: 'Bargaining & Trust', emoji: '🤝', color: 'orange', games: bargaining },
  { key: 'auctions', name: 'Auctions', emoji: '🔨', color: 'yellow', games: auctions },
  { key: 'markets', name: 'Market Power', emoji: '🏭', color: 'red', games: markets },
  { key: 'signaling', name: 'Signaling', emoji: '📡', color: 'indigo', games: signaling },
];

export const GAMES = CATEGORIES.flatMap(cat => cat.games.map(g => ({ ...g, cat: cat.key })));
export const GAME_BY_ID = Object.fromEntries(GAMES.map(g => [g.id, g]));
export const CAT_BY_KEY = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));
