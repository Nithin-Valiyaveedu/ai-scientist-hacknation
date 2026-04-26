// Framer Motion variants — respects prefers-reduced-motion via the
// `reducedMotion` prop on <MotionConfig> (set in App.jsx root)

export const fadeUp = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.15, ease: 'easeIn' } },
}

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } },
}

export const slideInLeft = {
  hidden:  { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, x: -6, transition: { duration: 0.12, ease: 'easeIn' } },
}

export const staggerList = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
  exit:    { transition: { staggerChildren: 0.03 } },
}

export const spinnerRotate = {
  animate: { rotate: 360, transition: { duration: 1.2, repeat: Infinity, ease: 'linear' } },
}

export const tooltipVariants = {
  hidden:  { opacity: 0, scale: 0.95, y: 4 },
  visible: { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.15, ease: 'easeOut' } },
  exit:    { opacity: 0, scale: 0.95, y: 2, transition: { duration: 0.1,  ease: 'easeIn'  } },
}

/** Page-level entry transition: opacity 0→1 + y 6→0, 200ms */
export const pageTransition = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
}
