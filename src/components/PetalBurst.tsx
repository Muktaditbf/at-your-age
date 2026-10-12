/**
 * A burst of petals when the reader jumps from a roast to the hype edition: late bloomers,
 * literally. Pure decoration; skipped entirely for readers who prefer less motion.
 */
import { m, useReducedMotion } from 'motion/react';
import { useMemo } from 'react';
import { createPortal } from 'react-dom';

const COLORS = ['#f2a900', '#ffc65a', '#0f3d2e', '#2e8b57', '#ff5ca8', '#fff3c4'];
const COUNT = 26;

export function PetalBurst({ x, y }: { x: number; y: number }) {
  const reduceMotion = useReducedMotion();
  const petals = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.4;
        const distance = 90 + Math.random() * 170;
        return {
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance - 60,
          rotate: Math.random() * 540 - 270,
          size: 9 + Math.random() * 9,
          color: COLORS[i % COLORS.length],
          delay: Math.random() * 0.08,
        };
      }),
    [],
  );
  if (reduceMotion) return null;
  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {petals.map((petal, i) => (
        <m.span
          // biome-ignore lint/suspicious/noArrayIndexKey: petals never reorder.
          key={i}
          className="absolute block rounded-[60%_0_60%_0]"
          style={{
            left: x,
            top: y,
            width: petal.size,
            height: petal.size,
            background: petal.color,
          }}
          initial={{ x: 0, y: 0, scale: 0.2, opacity: 1, rotate: 0 }}
          animate={{
            x: petal.dx,
            y: [0, petal.dy, petal.dy + 140],
            scale: [0.2, 1, 0.9],
            opacity: [1, 1, 0],
            rotate: petal.rotate,
          }}
          transition={{ duration: 1.4, delay: petal.delay, ease: [0.16, 0.84, 0.44, 1] }}
        />
      ))}
    </div>,
    document.body,
  );
}
