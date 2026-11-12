import { useEffect, useRef } from 'react';

type TurnstileApi = {
    render: (el: HTMLElement, options: Record<string, unknown>) => string;
    reset: (id: string) => void;
    remove: (id: string) => void;
};

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading: Promise<void> | null = null;

function load(): Promise<void> {
    if (window.turnstile) return Promise.resolve();
    loading ??= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = SCRIPT;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            loading = null;
            reject(new Error('Turnstile failed to load'));
        };
        document.head.appendChild(script);
    });

    return loading;
}

/**
 * Cloudflare Turnstile, loaded only when the contact form is on screen.
 * `resetKey` changes after each submit so a fresh token is issued.
 */
export function Turnstile({ siteKey, onToken, resetKey }: { siteKey: string; onToken: (token: string) => void; resetKey: number }) {
    const box = useRef<HTMLDivElement>(null);
    const widget = useRef<string | null>(null);
    const callback = useRef(onToken);

    useEffect(() => {
        callback.current = onToken;
    }, [onToken]);

    useEffect(() => {
        const el = box.current;
        if (!el) return;
        let cancelled = false;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((e) => e.isIntersecting)) return;
                observer.disconnect();
                load()
                    .then(() => {
                        if (cancelled || !window.turnstile || widget.current) return;
                        widget.current = window.turnstile.render(el, {
                            sitekey: siteKey,
                            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
                            callback: (token: string) => callback.current(token),
                            'expired-callback': () => callback.current(''),
                            'error-callback': () => callback.current(''),
                        });
                    })
                    .catch(() => undefined);
            },
            { rootMargin: '200px' },
        );
        observer.observe(el);

        return () => {
            cancelled = true;
            observer.disconnect();
            if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
            widget.current = null;
        };
    }, [siteKey]);

    useEffect(() => {
        if (resetKey > 0 && widget.current && window.turnstile) {
            window.turnstile.reset(widget.current);
            callback.current('');
        }
    }, [resetKey]);

    return <div ref={box} className="min-h-[65px]" />;
}
