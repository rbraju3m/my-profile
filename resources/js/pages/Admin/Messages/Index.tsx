import { Link, router } from '@inertiajs/react';
import { Anchor, Badge, Card, Group, Pagination, SegmentedControl, Stack, Text } from '@mantine/core';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { PageHeader } from '@/admin/components/PageHeader';

type Message = { id: number; name: string; email: string; subject: string; status: string; excerpt: string; created_at: string };
type Paginated<T> = { data: T[]; current_page: number; last_page: number; total: number };

const statusColor: Record<string, string> = { new: 'teal', read: 'gray', replied: 'blue', spam: 'red' };

export default function MessagesIndex({ messages, status, counts }: { messages: Paginated<Message>; status: string | null; counts: Record<string, number> }) {
    const go = (params: Record<string, string | number | null>) =>
        router.get('/admin/messages', Object.fromEntries(Object.entries({ status, ...params }).filter(([, v]) => v !== null && v !== '')), { preserveScroll: true });

    return (
        <AdminLayout title="Messages">
            <PageHeader title="Messages" description="From the contact form. You also get each one by email; reply from your mail app." />
            <SegmentedControl
                mb="md"
                value={status ?? 'all'}
                onChange={(v) => go({ status: v === 'all' ? null : v, page: null })}
                data={[
                    { value: 'all', label: 'Inbox' },
                    { value: 'new', label: `New (${counts.new ?? 0})` },
                    { value: 'replied', label: 'Replied' },
                    { value: 'spam', label: `Spam (${counts.spam ?? 0})` },
                ]}
            />
            {messages.data.length === 0 ? (
                <Text c="dimmed">No messages here.</Text>
            ) : (
                <Stack gap={6}>
                    {messages.data.map((m) => (
                        <Card key={m.id} withBorder padding="sm" component={Link} href={`/admin/messages/${m.id}`}>
                            <Group justify="space-between" wrap="nowrap" align="flex-start">
                                <div style={{ minWidth: 0 }}>
                                    <Text fw={m.status === 'new' ? 700 : 500} lineClamp={1}>
                                        {m.subject}
                                    </Text>
                                    <Text size="sm" c="dimmed" lineClamp={1}>
                                        {m.name} &lt;{m.email}&gt; · {m.excerpt}
                                    </Text>
                                </div>
                                <Stack gap={4} align="flex-end">
                                    <Badge color={statusColor[m.status]} variant="light">
                                        {m.status}
                                    </Badge>
                                    <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                        {m.created_at}
                                    </Text>
                                </Stack>
                            </Group>
                        </Card>
                    ))}
                </Stack>
            )}
            {messages.last_page > 1 && <Pagination mt="lg" total={messages.last_page} value={messages.current_page} onChange={(page) => go({ page })} />}
            <Anchor component={Link} href="/admin" size="sm" mt="lg" display="block">
                Back to dashboard
            </Anchor>
        </AdminLayout>
    );
}
