import { Link, router } from '@inertiajs/react';
import { Anchor, Badge, Button, Card, Group, Text } from '@mantine/core';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { PageHeader } from '@/admin/components/PageHeader';
import { SortableList } from '@/admin/components/SortableList';

type Row = { id: number; title: string; slug: string; description: string | null; nodes: number; projects: number };

export default function DiagramsIndex({ diagrams }: { diagrams: Row[] }) {
    const [rows, setRows] = useState(diagrams);
    const [prev, setPrev] = useState(diagrams);
    if (prev !== diagrams) {
        setPrev(diagrams);
        setRows(diagrams);
    }

    return (
        <AdminLayout title="Diagrams">
            <PageHeader
                title="Architecture diagrams"
                description="Drawn on the site from boxes and arrows you define here. The order here is the tab order in the Architecture section."
                actions={
                    <Button component={Link} href="/admin/diagrams/create" leftSection={<Plus size={16} />}>
                        New diagram
                    </Button>
                }
            />
            <SortableList
                items={rows}
                getId={(r) => r.id}
                onReorder={(next) => {
                    setRows(next);
                    router.post('/admin/reorder/diagrams', { ids: next.map((r) => r.id) }, { preserveScroll: true, preserveState: true });
                }}
                render={(r, handle) => (
                    <Card withBorder padding="sm" mb={6}>
                        <Group wrap="nowrap" align="flex-start">
                            {handle}
                            <div style={{ flex: 1 }}>
                                <Anchor component={Link} href={`/admin/diagrams/${r.id}/edit`} fw={600}>
                                    {r.title}
                                </Anchor>
                                <Text size="sm" c="dimmed" lineClamp={1}>
                                    {r.description}
                                </Text>
                            </div>
                            <Badge variant="light" color="gray">
                                {r.nodes} boxes
                            </Badge>
                            <Badge variant="light">{r.projects} projects</Badge>
                        </Group>
                    </Card>
                )}
            />
        </AdminLayout>
    );
}
