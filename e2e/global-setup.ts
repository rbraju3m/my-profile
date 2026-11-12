import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

import { appEnv } from './env';

/** Fresh database with the verified portfolio content and the e2e admin. */
export default function globalSetup() {
    if (!existsSync('public/build/manifest.json') || !existsSync('bootstrap/ssr/ssr.js')) {
        throw new Error('Run `npm run build` before the browser tests: they test the built site, with SSR.');
    }

    if (!existsSync(appEnv.DB_DATABASE!)) writeFileSync(appEnv.DB_DATABASE!, '');

    const env = { ...process.env, ...appEnv };
    execFileSync('php', ['artisan', 'migrate:fresh', '--seed', '--force', '--no-interaction'], { env, stdio: 'inherit' });
    execFileSync('php', ['artisan', 'responsecache:clear'], { env, stdio: 'inherit' });
}
