import { Head } from '@inertiajs/react';
import { Center, Paper, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

export function AuthLayout({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    return (
        <Center mih="100dvh" p="md">
            <Head title={title} />
            <Paper withBorder shadow="sm" p="xl" w="100%" maw={400}>
                <Stack gap={4} mb="lg">
                    <Text ff="monospace" fw={700} c="signal">
                        RR · admin
                    </Text>
                    <Title order={3}>{title}</Title>
                    {description && (
                        <Text size="sm" c="dimmed">
                            {description}
                        </Text>
                    )}
                </Stack>
                {children}
            </Paper>
        </Center>
    );
}
