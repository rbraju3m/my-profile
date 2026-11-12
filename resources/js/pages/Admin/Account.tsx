import { router, useForm } from '@inertiajs/react';
import { Alert, Button, Card, Code, Group, Modal, PasswordInput, PinInput, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { ConfirmButton } from '@/admin/components/ConfirmButton';
import { PageHeader } from '@/admin/components/PageHeader';

type Props = { twoFactor: { enabled: boolean; confirmed: boolean } };

function xsrf(): string {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);

    return match ? decodeURIComponent(match[1]!) : '';
}

/** Fortify's JSON endpoints, called with the XSRF cookie Laravel sets. */
async function fortify<T>(url: string, init: RequestInit = {}): Promise<T | null> {
    const response = await fetch(url, {
        ...init,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': xsrf(), ...init.headers },
        credentials: 'same-origin',
    });

    if (!response.ok) return null;
    const text = await response.text();

    return (text ? JSON.parse(text) : {}) as T;
}

/**
 * Every two-factor action needs a recently confirmed password (Fortify's
 * `confirmPassword` option). This asks for it in a modal when needed, then
 * runs the action.
 */
function usePasswordGate() {
    const [pending, setPending] = useState<(() => void) | null>(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const guard = async (action: () => void) => {
        const status = await fortify<{ confirmed: boolean }>('/admin/user/confirmed-password-status');
        if (status?.confirmed) action();
        else setPending(() => action);
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        const ok = await fortify('/admin/user/confirm-password', { method: 'POST', body: JSON.stringify({ password }) });
        setBusy(false);
        if (!ok) {
            setError('That password is not correct.');
            return;
        }
        const action = pending;
        setPending(null);
        setPassword('');
        setError(null);
        action?.();
    };

    const modal = (
        <Modal opened={pending !== null} onClose={() => setPending(null)} title="Confirm your password" centered>
            <form onSubmit={(e) => void submit(e)}>
                <Stack>
                    <PasswordInput label="Password" autoComplete="current-password" data-autofocus value={password} error={error} onChange={(e) => setPassword(e.currentTarget.value)} />
                    <Button type="submit" loading={busy}>
                        Confirm
                    </Button>
                </Stack>
            </form>
        </Modal>
    );

    return { guard, modal };
}

export default function Account({ twoFactor }: Props) {
    return (
        <AdminLayout title="Account">
            <PageHeader title="Account & security" />
            <SimpleGrid cols={{ base: 1, md: 2 }}>
                <TwoFactor state={twoFactor} />
                <PasswordCard />
            </SimpleGrid>
        </AdminLayout>
    );
}

function TwoFactor({ state }: { state: Props['twoFactor'] }) {
    const [qr, setQr] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [codes, setCodes] = useState<string[] | null>(null);
    const [busy, setBusy] = useState(false);
    const confirm = useForm({ code: '' });
    const gate = usePasswordGate();

    const loadSetup = () =>
        gate.guard(async () => {
        const [svg, key] = await Promise.all([fortify<{ svg: string }>('/admin/user/two-factor-qr-code'), fortify<{ secretKey: string }>('/admin/user/two-factor-secret-key')]);
        setQr(svg?.svg ?? null);
        setSecret(key?.secretKey ?? null);
        });

    const loadCodes = () => gate.guard(async () => setCodes(await fortify<string[]>('/admin/user/two-factor-recovery-codes')));

    const enable = () =>
        gate.guard(() =>
            router.post('/admin/user/two-factor-authentication', {}, { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false), onSuccess: () => void loadSetup() }),
        );

    const submitConfirm = (e: FormEvent) => {
        e.preventDefault();
        confirm.post('/admin/user/confirmed-two-factor-authentication', {
            preserveScroll: true,
            errorBag: 'confirmTwoFactorAuthentication',
            onSuccess: () => {
                setQr(null);
                void loadCodes();
            },
        });
    };

    return (
        <Card withBorder>
            {gate.modal}
            <Group gap="xs" mb="xs">
                {state.confirmed ? <ShieldCheck color="var(--mantine-color-teal-6)" /> : <ShieldAlert color="var(--mantine-color-yellow-6)" />}
                <Title order={4}>Two-factor authentication</Title>
            </Group>

            {state.confirmed ? (
                <Stack>
                    <Text size="sm">On. Signing in needs a code from your authenticator app.</Text>
                    {codes ? (
                        <Alert color="yellow" title="Recovery codes">
                            <Text size="sm" mb="xs">
                                Store these somewhere safe. Each works once if you lose your phone.
                            </Text>
                            <Code block>{codes.join('\n')}</Code>
                        </Alert>
                    ) : (
                        <Button variant="default" onClick={() => void loadCodes()}>
                            Show recovery codes
                        </Button>
                    )}
                    <Group>
                        <Button
                            variant="default"
                            onClick={() => void gate.guard(() => router.post('/admin/user/two-factor-recovery-codes', {}, { preserveScroll: true, onSuccess: () => void loadCodes() }))}
                        >
                            New recovery codes
                        </Button>
                        <ConfirmButton
                            title="Turn off two-factor?"
                            message="The admin will require it again before you can edit content."
                            confirmLabel="Turn off"
                            onConfirm={(done) => void gate.guard(() => router.delete('/admin/user/two-factor-authentication', { preserveScroll: true, onFinish: done }))}
                        >
                            Turn off
                        </ConfirmButton>
                    </Group>
                </Stack>
            ) : state.enabled ? (
                <Stack>
                    <Text size="sm">Scan this with an authenticator app (Google Authenticator, 1Password, Authy…), then enter the 6-digit code.</Text>
                    {qr ? (
                        // Fortify returns an SVG it generated itself.
                        <div style={{ background: 'white', padding: 12, width: 'fit-content', borderRadius: 8 }} dangerouslySetInnerHTML={{ __html: qr }} />
                    ) : (
                        <Button variant="default" onClick={() => void loadSetup()}>
                            Show QR code
                        </Button>
                    )}
                    {secret && (
                        <Text size="xs" c="dimmed">
                            Or enter this key manually: <Code>{secret}</Code>
                        </Text>
                    )}
                    <form onSubmit={submitConfirm}>
                        <Stack gap="xs">
                            <PinInput length={6} type="number" oneTimeCode aria-label="Code" value={confirm.data.code} onChange={(v) => confirm.setData('code', v)} />
                            {confirm.errors.code && (
                                <Text c="red" size="sm">
                                    {confirm.errors.code}
                                </Text>
                            )}
                            <Button type="submit" loading={confirm.processing} style={{ alignSelf: 'flex-start' }}>
                                Confirm and turn on
                            </Button>
                        </Stack>
                    </form>
                </Stack>
            ) : (
                <Stack>
                    <Text size="sm">Off. Turn it on to protect the admin; it is required before you can edit content on the live site.</Text>
                    <Button onClick={enable} loading={busy} style={{ alignSelf: 'flex-start' }}>
                        Set up two-factor
                    </Button>
                </Stack>
            )}
        </Card>
    );
}

function PasswordCard() {
    const form = useForm({ current_password: '', password: '', password_confirmation: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put('/admin/user/password', { errorBag: 'updatePassword', preserveScroll: true, onSuccess: () => form.reset() });
    };

    return (
        <Card withBorder>
            <Title order={4} mb="xs">
                Change password
            </Title>
            <form onSubmit={submit}>
                <Stack>
                    <PasswordInput label="Current password" autoComplete="current-password" value={form.data.current_password} error={form.errors.current_password} onChange={(e) => form.setData('current_password', e.currentTarget.value)} />
                    <PasswordInput label="New password" autoComplete="new-password" value={form.data.password} error={form.errors.password} onChange={(e) => form.setData('password', e.currentTarget.value)} />
                    <PasswordInput
                        label="Repeat new password"
                        autoComplete="new-password"
                        value={form.data.password_confirmation}
                        onChange={(e) => form.setData('password_confirmation', e.currentTarget.value)}
                    />
                    <Button type="submit" loading={form.processing} style={{ alignSelf: 'flex-start' }}>
                        Update password
                    </Button>
                    {form.recentlySuccessful && (
                        <Text c="teal" size="sm">
                            Password updated.
                        </Text>
                    )}
                </Stack>
            </form>
        </Card>
    );
}
