import { Link } from '@inertiajs/react';
import { Anchor, Breadcrumbs, Group, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

type Crumb = { label: string; href?: string };

export function PageHeader({ title, description, actions, crumbs }: { title: string; description?: ReactNode; actions?: ReactNode; crumbs?: Crumb[] }) {
    return (
        <Stack gap={6} mb="xl">
            {crumbs && (
                <Breadcrumbs fz="sm">
                    {crumbs.map((c) =>
                        c.href ? (
                            <Anchor key={c.label} component={Link} href={c.href} size="sm">
                                {c.label}
                            </Anchor>
                        ) : (
                            <Text key={c.label} size="sm" c="dimmed">
                                {c.label}
                            </Text>
                        ),
                    )}
                </Breadcrumbs>
            )}
            <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
                <div>
                    <Title order={2}>{title}</Title>
                    {description && (
                        <Text c="dimmed" size="sm" mt={4} maw={680}>
                            {description}
                        </Text>
                    )}
                </div>
                {actions && <Group gap="xs">{actions}</Group>}
            </Group>
        </Stack>
    );
}
