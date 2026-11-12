import { Link, router } from '@inertiajs/react';
import { ActionIcon, Anchor, Badge, Card, Group, Image, Pagination, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { Check, FileText } from 'lucide-react';
import { useState } from 'react';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { ConfirmButton } from '@/admin/components/ConfirmButton';
import { PageHeader } from '@/admin/components/PageHeader';
import { formatBytes } from '@/admin/lib';

type Item = { id: number; name: string; mime: string; size: number; url: string; thumb: string | null; alt: string; collection: string; usedBy: { label: string; href: string | null } };
type Paginated<T> = { data: T[]; current_page: number; last_page: number; total: number };

export default function MediaIndex({ media }: { media: Paginated<Item> }) {
    return (
        <AdminLayout title="Media library">
            <PageHeader title="Media library" description={`${media.total} files. Upload images from a project’s Images tab, and the CV from Profile & contact.`} />
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {media.data.map((m) => (
                    <MediaCard key={m.id} item={m} />
                ))}
            </SimpleGrid>
            {media.last_page > 1 && <Pagination mt="lg" total={media.last_page} value={media.current_page} onChange={(page) => router.get('/admin/media', { page })} />}
        </AdminLayout>
    );
}

function MediaCard({ item }: { item: Item }) {
    const [alt, setAlt] = useState(item.alt);
    const image = item.thumb !== null;

    return (
        <Card withBorder padding="sm">
            <Card.Section>
                {image ? (
                    <Image src={item.thumb} alt={item.alt} h={150} fit="cover" />
                ) : (
                    <Group h={150} justify="center" bg="var(--mantine-color-default-hover)">
                        <FileText size={40} />
                    </Group>
                )}
            </Card.Section>
            <Stack gap={6} mt="sm">
                <Anchor href={item.url} target="_blank" size="sm" lineClamp={1}>
                    {item.name}
                </Anchor>
                <Group gap={6}>
                    <Badge size="xs" variant="light" color="gray">
                        {formatBytes(item.size)}
                    </Badge>
                    {item.usedBy.href ? (
                        <Anchor component={Link} href={item.usedBy.href} size="xs">
                            {item.usedBy.label}
                        </Anchor>
                    ) : (
                        <Text size="xs" c="dimmed">
                            {item.usedBy.label}
                        </Text>
                    )}
                </Group>
                {image && (
                    <TextInput
                        size="xs"
                        label="Alt text"
                        value={alt}
                        onChange={(e) => setAlt(e.currentTarget.value)}
                        rightSection={
                            alt !== item.alt && (
                                <ActionIcon size="sm" onClick={() => router.patch(`/admin/media/${item.id}`, { alt }, { preserveScroll: true })} aria-label="Save alt text">
                                    <Check size={14} />
                                </ActionIcon>
                            )
                        }
                    />
                )}
                <ConfirmButton size="xs" title="Delete this file?" message={`${item.name} will be removed from ${item.usedBy.label}.`} onConfirm={(done) => router.delete(`/admin/media/${item.id}`, { preserveScroll: true, onFinish: done })}>
                    Delete
                </ConfirmButton>
            </Stack>
        </Card>
    );
}
