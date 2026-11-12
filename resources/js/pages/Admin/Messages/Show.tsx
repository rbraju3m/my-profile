import { router } from '@inertiajs/react';
import { Badge, Button, Card, Group, Stack, Text } from '@mantine/core';
import { Mail, ShieldAlert } from 'lucide-react';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { ConfirmButton } from '@/admin/components/ConfirmButton';
import { PageHeader } from '@/admin/components/PageHeader';

type Message = { id: number; name: string; email: string; subject: string; message: string; status: string; user_agent: string | null; created_at: string };

export default function MessageShow({ message }: { message: Message }) {
    const setStatus = (status: string) => router.patch(`/admin/messages/${message.id}`, { status }, { preserveScroll: true });

    return (
        <AdminLayout title={message.subject}>
            <PageHeader
                title={message.subject}
                crumbs={[{ label: 'Messages', href: '/admin/messages' }, { label: message.name }]}
                actions={
                    <>
                        <Button
                            component="a"
                            href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                            leftSection={<Mail size={16} />}
                            onClick={() => setStatus('replied')}
                        >
                            Reply by email
                        </Button>
                        {message.status !== 'spam' ? (
                            <Button variant="default" leftSection={<ShieldAlert size={16} />} onClick={() => setStatus('spam')}>
                                Spam
                            </Button>
                        ) : (
                            <Button variant="default" onClick={() => setStatus('read')}>
                                Not spam
                            </Button>
                        )}
                        <ConfirmButton title="Delete this message?" message="This cannot be undone." onConfirm={(done) => router.delete(`/admin/messages/${message.id}`, { onFinish: done })}>
                            Delete
                        </ConfirmButton>
                    </>
                }
            />
            <Card withBorder>
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text>
                            <strong>{message.name}</strong> &lt;{message.email}&gt;
                        </Text>
                        <Group gap="xs">
                            <Badge variant="light">{message.status}</Badge>
                            <Text size="sm" c="dimmed">
                                {message.created_at}
                            </Text>
                        </Group>
                    </Group>
                    {/* Plain text only: rendered as text, never as HTML. */}
                    <Text style={{ whiteSpace: 'pre-wrap' }} mt="md">
                        {message.message}
                    </Text>
                    {message.user_agent && (
                        <Text size="xs" c="dimmed" mt="md">
                            Browser: {message.user_agent}
                        </Text>
                    )}
                </Stack>
            </Card>
        </AdminLayout>
    );
}
