import { Link, router } from '@inertiajs/react';
import { Anchor, Button, Card, Group, Text } from '@mantine/core';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { PageHeader } from '@/admin/components/PageHeader';
import { SortableList } from '@/admin/components/SortableList';

type Row = { id: number; company: string; title: string; period: string };

export default function ExperienceIndex({ experiences }: { experiences: Row[] }) {
    const [rows, setRows] = useState(experiences);
    const [prev, setPrev] = useState(experiences);
    if (prev !== experiences) {
        setPrev(experiences);
        setRows(experiences);
    }

    return (
        <AdminLayout title="Experience">
            <PageHeader
                title="Experience"
                description="Your timeline. Drag to reorder (most recent first)."
                actions={
                    <Button component={Link} href="/admin/experiences/create" leftSection={<Plus size={16} />}>
                        Add position
                    </Button>
                }
            />
            <SortableList
                items={rows}
                getId={(r) => r.id}
                onReorder={(next) => {
                    setRows(next);
                    router.post('/admin/reorder/experiences', { ids: next.map((r) => r.id) }, { preserveScroll: true, preserveState: true });
                }}
                render={(r, handle) => (
                    <Card withBorder padding="sm" mb={6}>
                        <Group wrap="nowrap">
                            {handle}
                            <div>
                                <Anchor component={Link} href={`/admin/experiences/${r.id}/edit`} fw={600}>
                                    {r.title}
                                </Anchor>
                                <Text size="sm" c="dimmed">
                                    {r.company} · {r.period}
                                </Text>
                            </div>
                        </Group>
                    </Card>
                )}
            />
        </AdminLayout>
    );
}
