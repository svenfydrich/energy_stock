export const CARD_ANIM = {
  initial: { opacity: 0, y: 24, scale: 0.94 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 28 },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.9,
    transition: { duration: 0.25 },
  },
};
