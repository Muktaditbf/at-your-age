/**
 * Motion's animation features (layout animations, gestures, springs), loaded after the first
 * paint so the page shows up fast. Components use `m.*` and wait for these to arrive.
 */
import { domMax } from 'motion/react';

export default domMax;
