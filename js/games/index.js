import classic from './classic.js';
import business from './business.js';
import social from './social.js';
import geopolitics from './geopolitics.js';
import tech from './tech.js';
import bargaining from './bargaining.js';
import auctions from './auctions.js';
import markets from './markets.js';
import signaling from './signaling.js';

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
