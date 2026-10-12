/** Types a line out letter by letter, then holds it. Shows it whole for reduced motion. */
import { useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

export function Typewriter({ text, speed = 32 }: { text: string; speed?: number }) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    if (reduceMotion) return;
    const timer = setInterval(() => {
      setShown((count) => {
        if (count >= text.length) clearInterval(timer);
        return Math.min(text.length, count + 1);
      });
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, reduceMotion]);
  return (
    <span>
      {reduceMotion ? text : text.slice(0, shown)}
      <span className="ml-0.5 inline-block w-[0.5ch] animate-pulse text-accent-ink">▍</span>
    </span>
  );
}
