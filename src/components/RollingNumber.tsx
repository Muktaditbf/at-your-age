/** Digits that roll like an odometer: up when the number grows, down when it shrinks. */
import { AnimatePresence, m } from 'motion/react';
import { useEffect, useRef } from 'react';

const roll = {
  enter: (direction: number) => ({ y: direction > 0 ? '70%' : '-70%', opacity: 0 }),
  center: { y: '0%', opacity: 1 },
  exit: (direction: number) => ({ y: direction > 0 ? '-70%' : '70%', opacity: 0 }),
};

export function RollingNumber({ value, className = '' }: { value: string; className?: string }) {
  const previous = useRef(value);
  const direction = Number(value) >= Number(previous.current) ? 1 : -1;
  useEffect(() => {
    previous.current = value;
  }, [value]);
  const digits = value.split('');
  return (
    <span className={`inline-flex ${className}`}>
      {digits.map((digit, index) => (
        // Keyed by place value (ones, tens…), so each digit keeps its slot when one is added.
        // biome-ignore lint/suspicious/noArrayIndexKey: the place value is the identity here.
        <span key={digits.length - index} className="relative inline-block overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout" custom={direction}>
            <m.span
              key={digit}
              custom={direction}
              variants={roll}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 520, damping: 36 }}
              className="inline-block"
            >
              {digit}
            </m.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
