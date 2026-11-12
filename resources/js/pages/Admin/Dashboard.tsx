import { Link } from '@inertiajs/react';
import { Alert, Anchor, Badge, Card, Group, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { FileWarning } from 'lucide-react';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { PageHeader } from '@/admin/components/PageHeader';

type Props = {
    counts: Record<'projects' | 'published' | 'technologies' | 'experiences' | 'diagrams' | 'unread', number>;
    hasCv: boolean;
    messages: { id: number; name: string; subject: string; status: string; created_at: string }[];
    activity: { id: number; description: string; subject: string; name: string; when: string }[];
};

export default function Dashboard({ counts, hasCv, messages, activity }: Props) {
    const stats = [
        { label: 'Unread messages', value: counts.unread, href: '/admin/messages?status=new' },
        { label: 'Published projects', value: `${counts.published} / ${counts.projects}`, href: '/admin/projects' },
        { label: 'Technologies', value: counts.technologies, href: '/admin/skills' },
        { label: 'Diagrams', value: counts.diagrams, href: '/admin/diagrams' },
    ];

    return (
        <AdminLayout title="Dashboard">
            <PageHeader title="Dashboard" description="Everything on the public site is edited here. Saving any change updates the site within seconds." />

            {!hasCv && (
                <Alert color="yellow" icon={<FileWarning size={18} />} mb="lg" title="No CV uploaded">
                    The "Download CV" buttons stay hidden until you upload one in{' '}
                    <Anchor component={Link} href="/admin/settings/site">
                        Profile & contact
                    </Anchor>
                    .
                </Alert>
            )}

            <SimpleGrid cols={{ base: 2, md: 4 }} mb="xl">
                {stats.map((s) => (
                    <Card key={s.label} withBorder component={Link} href={s.href}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                            {s.label}
                        </Text>
                        <Text fz={28} fw={700} ff="monospace">
                            {s.value}
                        </Text>
                    </Card>
                ))}
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }}>
                <Card withBorder>
                    <Group justify="space-between" mb="sm">
                        <Title order={4}>Latest messages</Title>
                        <Anchor component={Link} href="/admin/messages" size="sm">
                            Inbox
                        </Anchor>
                    </Group>
                    {messages.length === 0 ? (
                        <Text size="sm" c="dimmed">
                            No messages yet.
                        </Text>
                    ) : (
                        <Stack gap="xs">
                            {messages.map((m) => (
                                <Group key={m.id} justify="space-between" wrap="nowrap">
                                    <div style={{ minWidth: 0 }}>
                                        <Anchor component={Link} href={`/admin/messages/${m.id}`} size="sm" fw={m.status === 'new' ? 700 : 400} lineClamp={1}>
                                            {m.subject}
                                        </Anchor>
                                        <Text size="xs" c="dimmed">
                                            {m.name} · {m.created_at}
                                        </Text>
                                    </div>
                                    {m.status === 'new' && <Badge size="sm">New</Badge>}
                                </Group>
                            ))}
                        </Stack>
                    )}
                </Card>

                <Card withBorder>
                    <Title order={4} mb="sm">
                        Recent changes
                    </Title>
                    {activity.length === 0 ? (
                        <Text size="sm" c="dimmed">
                            Nothing edited yet.
                        </Text>
                    ) : (
                        <Table verticalSpacing={6} fz="sm">
                            <Table.Tbody>
                                {activity.map((a) => (
                                    <Table.Tr key={a.id}>
                                        <Table.Td>
                                            <Text size="sm" lineClamp={1}>
                                                {a.subject} · {a.name}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td c="dimmed">{a.description}</Table.Td>
                                        <Table.Td c="dimmed" ta="right" style={{ whiteSpace: 'nowrap' }}>
                                            {a.when}
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Card>
            </SimpleGrid>
        </AdminLayout>
    );
}
