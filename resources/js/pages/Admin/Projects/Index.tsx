import { Link, router } from '@inertiajs/react';
import { Anchor, Badge, Button, Card, Group, Image, Stack, Text, TextInput } from '@mantine/core';
import { Eye, EyeOff, Plus, Search, Star } from 'lucide-react';
import { useState } from 'react';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { PageHeader } from '@/admin/components/PageHeader';
import { SortableList } from '@/admin/components/SortableList';
import { StatusBadge } from '@/admin/components/StatusBadge';

type Row = {
    id: number;
    title: string;
    slug: string;
    client: string | null;
    category: string;
    status: { value: string; label: string };
    is_featured: boolean;
    published: boolean;
    cover: string | null;
};

export default function ProjectsIndex({ projects }: { projects: Row[] }) {
    const [rows, setRows] = useState(projects);
    const [query, setQuery] = useState('');
    const [prev, setPrev] = useState(projects);
    if (prev !== projects) {
        setPrev(projects);
        setRows(projects);
    }

    const reorder = (next: Row[]) => {
        setRows(next);
        router.post('/admin/reorder/projects', { ids: next.map((r) => r.id) }, { preserveScroll: true, preserveState: true });
    };

    const q = query.trim().toLowerCase();
    const visible = q ? rows.filter((r) => `${r.title} ${r.client ?? ''} ${r.category}`.toLowerCase().includes(q)) : rows;

    return (
        <AdminLayout title="Projects">
            <PageHeader
                title="Projects"
                description="Drag to change the order on the site. Featured projects appear as large cards on the home page; the rest under “More work”."
                actions={
                    <Button component={Link} href="/admin/projects/create" leftSection={<Plus size={16} />}>
                        New project
                    </Button>
                }
            />
            <TextInput mb="md" leftSection={<Search size={16} />} placeholder="Filter by title, client or category" value={query} onChange={(e) => setQuery(e.currentTarget.value)} aria-label="Filter projects" />
            {q && (
                <Text size="xs" c="dimmed" mb="xs">
                    Clear the filter to drag and reorder.
                </Text>
            )}
            <Stack gap={6}>
                <SortableList
                    items={visible}
                    getId={(r) => r.id}
                    onReorder={q ? () => undefined : reorder}
                    render={(r, handle) => (
                        <Card withBorder padding="xs" mb={6}>
                            <Group wrap="nowrap" gap="sm">
                                {!q && handle}
                                <Image src={r.cover} w={64} h={36} radius="sm" fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" bg="gray.1" alt="" />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Anchor component={Link} href={`/admin/projects/${r.slug}/edit`} fw={600} lineClamp={1}>
                                        {r.title}
                                    </Anchor>
                                    <Text size="xs" c="dimmed" lineClamp={1}>
                                        {[r.category, r.client].filter(Boolean).join(' · ')}
                                    </Text>
                                </div>
                                <Group gap={6} wrap="nowrap" visibleFrom="xs">
                                    {r.is_featured && (
                                        <Badge variant="outline" leftSection={<Star size={10} />}>
                                            Featured
                                        </Badge>
                                    )}
                                    <StatusBadge status={r.status} />
                                    <Badge color={r.published ? 'teal' : 'gray'} variant="dot" leftSection={r.published ? <Eye size={10} /> : <EyeOff size={10} />}>
                                        {r.published ? 'Published' : 'Draft'}
                                    </Badge>
                                </Group>
                            </Group>
                        </Card>
                    )}
                />
            </Stack>
        </AdminLayout>
    );
}
