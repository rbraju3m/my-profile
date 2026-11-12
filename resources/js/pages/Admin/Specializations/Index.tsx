import { Link, router } from '@inertiajs/react';
import { Anchor, Button, Card, Group, Text } from '@mantine/core';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { PageHeader } from '@/admin/components/PageHeader';
import { SortableList } from '@/admin/components/SortableList';

type Row = { id: number; title: string; summary: string };

export default function SpecializationsIndex({ specializations }: { specializations: Row[] }) {
    const [rows, setRows] = useState(specializations);
    const [prev, setPrev] = useState(specializations);
    if (prev !== specializations) {
        setPrev(specializations);
        setRows(specializations);
    }

    return (
        <AdminLayout title="Specialisations">
            <PageHeader
                title="Specialisations"
                description="The “Engineering beyond traditional web development” cards on the home page."
                actions={
                    <Button component={Link} href="/admin/specializations/create" leftSection={<Plus size={16} />}>
                        Add card
                    </Button>
                }
            />
            <SortableList
                items={rows}
                getId={(r) => r.id}
                onReorder={(next) => {
                    setRows(next);
                    router.post('/admin/reorder/specializations', { ids: next.map((r) => r.id) }, { preserveScroll: true, preserveState: true });
                }}
                render={(r, handle) => (
                    <Card withBorder padding="sm" mb={6}>
                        <Group wrap="nowrap" align="flex-start">
                            {handle}
                            <div>
                                <Anchor component={Link} href={`/admin/specializations/${r.id}/edit`} fw={600}>
                                    {r.title}
                                </Anchor>
                                <Text size="sm" c="dimmed" lineClamp={2}>
                                    {r.summary}
                                </Text>
                            </div>
                        </Group>
                    </Card>
                )}
            />
        </AdminLayout>
    );
}
