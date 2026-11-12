import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

function decode(encoded: string | null): string | null {
    if (!encoded) return null;
    try {
        return atob(encoded).split('').reverse().join('');
    } catch {
        return null;
    }
}

/**
 * Decodes a contact value (base64 of the reversed string, see
 * HandleInertiaRequests::encode). The server snapshot is null, so the plain
 * value never appears in server-rendered HTML; the browser fills it in after
 * hydration.
 */
export function useDecoded(encoded: string | null): string | null {
    return useSyncExternalStore(
        subscribe,
        () => decode(encoded),
        () => null,
    );
}
