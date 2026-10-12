import { describe, expect, it } from 'vitest';
import { ageFromScroll, DEFAULT_AGE, scrollForAge, stepAge, TICK } from './ruler.ts';

describe('ruler', () => {
  it('maps scroll positions to ages and back', () => {
    expect(scrollForAge(1)).toBe(0);
    expect(scrollForAge(24)).toBe(23 * TICK);
    expect(ageFromScroll(23 * TICK)).toBe(24);
    // Halfway between two years rounds to the nearer one.
    expect(ageFromScroll(23 * TICK + TICK * 0.4)).toBe(24);
    expect(ageFromScroll(23 * TICK + TICK * 0.6)).toBe(25);
  });

  it('never leaves 1–120', () => {
    expect(ageFromScroll(-500)).toBe(1);
    expect(ageFromScroll(1e6)).toBe(120);
    expect(scrollForAge(500)).toBe(119 * TICK);
  });

  it('steps like a slider', () => {
    expect(stepAge(30, 'ArrowRight')).toBe(31);
    expect(stepAge(30, 'ArrowUp')).toBe(31);
    expect(stepAge(30, 'ArrowLeft')).toBe(29);
    expect(stepAge(30, 'PageUp')).toBe(40);
    expect(stepAge(5, 'PageDown')).toBe(1);
    expect(stepAge(30, 'Home')).toBe(1);
    expect(stepAge(30, 'End')).toBe(120);
    expect(stepAge(120, 'ArrowRight')).toBe(120);
    expect(stepAge(30, 'a')).toBeUndefined();
  });

  it('starts from the default age when none is picked', () => {
    expect(stepAge(undefined, 'ArrowRight')).toBe(DEFAULT_AGE + 1);
  });
});
