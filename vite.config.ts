import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
    plugins: [
        laravel({
            // Two separate bundles: visitors never download the admin (Mantine, TipTap).
            input: ['resources/js/site/app.tsx', 'resources/js/admin/app.tsx'],
            ssr: 'resources/js/site/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
        },
    },
    // Production builds pin React to its production build, also in the SSR bundle,
    // whatever NODE_ENV the server process happens to have.
    define: command === 'build' ? { 'process.env.NODE_ENV': JSON.stringify('production') } : {},
    ssr: {
        // Bundle every dependency into bootstrap/ssr/ssr.js, so production can run it
        // without node_modules (the deploy script deletes them from each release).
        noExternal: true,
    },
    server: {
        watch: { ignored: ['**/storage/framework/views/**'] },
    },
}));
