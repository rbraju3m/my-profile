import { domAnimation, LazyMotion, m, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Fades content up 8px the first time it scrolls into view.
 * Renders a plain div when the visitor prefers reduced motion.
 */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
    const reduce = useReducedMotion();

    if (reduce) {
        return <div className={className}>{children}</div>;
    }

    return (
        <LazyMotion features={domAnimation} strict>
            <m.div
                className={className}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
            >
                {children}
            </m.div>
        </LazyMotion>
    );
}
