import { motion, useReducedMotion } from 'framer-motion';
import { useState, type ReactNode } from 'react';

// Hoisted rather than rebuilt inside the components below: these are static
// objects, and a fresh identity on every render makes framer-motion re-read
// the target each time for no gain. willChange is set on the way in and
// dropped on arrival (onAnimationComplete). Leaving it on permanently would
// hand every revealed block its own compositor layer for the rest of the
// session, which on a page with four sections of them is a real cost.
const HIDDEN = { opacity: 0, y: 24 };
const SHOWN = { opacity: 1, y: 0 };
const VIEWPORT = { once: true, margin: '-10% 0px' } as const;
const TRANSITION = { duration: 0.6, ease: [0.16, 1, 0.3, 1] } as const;
const LIFT = { willChange: 'transform, opacity' };
const SETTLED = { willChange: 'auto' };

export function Reveal({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();
  const [settled, setSettled] = useState(false);

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : HIDDEN}
      whileInView={shouldReduceMotion ? undefined : SHOWN}
      viewport={VIEWPORT}
      transition={TRANSITION}
      style={shouldReduceMotion || settled ? SETTLED : LIFT}
      onAnimationComplete={() => setSettled(true)}
    >
      {children}
    </motion.div>
  );
}

// Stagger container + item pair: wrap a list in <Stagger>, wrap each child in
// a motion element with `variants={staggerItem}`, and the children reveal one
// after another as the group scrolls into view instead of popping in at once.
// MotionConfig(reducedMotion="user") in App handles turning off the transform
// part of this for users who've asked for reduced motion.
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px' }}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}
