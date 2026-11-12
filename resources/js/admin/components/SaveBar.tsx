import { Button, Group, Paper, Text } from '@mantine/core';
import type { ReactNode } from 'react';

/** Sticky footer with the save button; shows when there are unsaved changes. */
export function SaveBar({ dirty, processing, extra, label = 'Save changes' }: { dirty: boolean; processing: boolean; extra?: ReactNode; label?: string }) {
    return (
        <Paper withBorder shadow="sm" p="sm" mt="xl" pos="sticky" bottom={12} style={{ zIndex: 5 }}>
            <Group justify="space-between">
                <Text size="sm" c={dirty ? undefined : 'dimmed'}>
                    {dirty ? 'You have unsaved changes.' : 'All changes saved.'}
                </Text>
                <Group gap="xs">
                    {extra}
                    <Button type="submit" loading={processing} disabled={!dirty}>
                        {label}
                    </Button>
                </Group>
            </Group>
        </Paper>
    );
}
