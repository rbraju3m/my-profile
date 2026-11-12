import { Button, Group, Modal, Text, type ButtonProps } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState, type ReactNode } from 'react';

/** A button that asks for confirmation in a modal before running a destructive action. */
export function ConfirmButton({
    children,
    title,
    message,
    confirmLabel = 'Delete',
    onConfirm,
    ...button
}: ButtonProps & { children: ReactNode; title: string; message: ReactNode; confirmLabel?: string; onConfirm: (done: () => void) => void }) {
    const [opened, { open, close }] = useDisclosure(false);
    const [busy, setBusy] = useState(false);

    return (
        <>
            <Button color="red" variant="light" {...button} onClick={open}>
                {children}
            </Button>
            <Modal opened={opened} onClose={close} title={title} centered>
                <Text size="sm">{message}</Text>
                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={close}>
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        loading={busy}
                        onClick={() => {
                            setBusy(true);
                            onConfirm(() => {
                                setBusy(false);
                                close();
                            });
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </Group>
            </Modal>
        </>
    );
}
