import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
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
    ssr: {
        noExternal: ['@inertiajs/react', 'motion', 'lucide-react'],
    },
    server: {
        watch: { ignored: ['**/storage/framework/views/**'] },
    },
});
