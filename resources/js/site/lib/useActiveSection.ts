import { useEffect, useState } from 'react';

/** The id of the section currently under the top part of the viewport. */
export function useActiveSection(ids: string[]): string | null {
    const [active, setActive] = useState<string | null>(null);
    const key = ids.join(',');

    useEffect(() => {
        const elements = key
            .split(',')
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => el !== null);

        if (elements.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActive(visible[0].target.id);
            },
            { rootMargin: '-30% 0px -60% 0px' },
        );

        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [key]);

    return active;
}
