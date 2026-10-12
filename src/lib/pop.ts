/**
 * Each newsroom desk's pop colour, for photo frames and tags. Keep in sync with --pop-1…5 in
 * src/styles/index.css (the page uses those; the share image needs plain values).
 */
import type { Kind } from './sparql.ts';

export const POP_INDEX: Record<Kind, number> = {
  work: 1,
  award: 2,
  position: 3,
  founded: 4,
  discovered: 5,
};

export const POP_HEX: Record<Kind, string> = {
  work: '#ff4fa3',
  award: '#ffd400',
  position: '#e4002b',
  founded: '#7ed321',
  discovered: '#2457e6',
};
