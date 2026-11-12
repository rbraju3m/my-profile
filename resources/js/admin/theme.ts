import { createTheme, type MantineColorsTuple } from '@mantine/core';

// The site's "signal teal", as a Mantine palette.
const teal: MantineColorsTuple = ['#effefb', '#c7fff3', '#90ffe8', '#51f7da', '#1de4c6', '#05c8ae', '#00a18f', '#058074', '#0a655e', '#0d534e'];

export const theme = createTheme({
    primaryColor: 'signal',
    primaryShade: { light: 7, dark: 4 },
    colors: { signal: teal },
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    defaultRadius: 'md',
    cursorType: 'pointer',
});
