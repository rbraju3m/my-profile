import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/tiptap/styles.css';
import '../../css/admin-preview.css';

import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { createRoot } from 'react-dom/client';

import { theme } from './theme';

void createInertiaApp({
    title: (title) => (title ? `${title} · Admin` : 'Admin'),
    resolve: async (name) => {
        const pages = import.meta.glob<{ default: ResolvedComponent }>(['../pages/Admin/**/*.tsx', '!**/*.test.tsx']);
        const page = pages[`../pages/${name}.tsx`];

        if (page === undefined) {
            throw new Error(`Admin page not found: ${name}`);
        }

        return (await page()).default;
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <MantineProvider theme={theme} defaultColorScheme="auto">
                <Notifications position="top-right" />
                <App {...props} />
            </MantineProvider>,
        );
    },
});
