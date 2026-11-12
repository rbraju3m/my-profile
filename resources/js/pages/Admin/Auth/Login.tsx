import { useForm } from '@inertiajs/react';
import { Alert, Button, Checkbox, PasswordInput, Stack, TextInput } from '@mantine/core';
import type { FormEvent } from 'react';

import { AuthLayout } from '@/admin/components/AuthLayout';

export default function Login({ status }: { status?: string }) {
    const form = useForm({ email: '', password: '', remember: false });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/admin/login', { onFinish: () => form.reset('password') });
    };

    return (
        <AuthLayout title="Sign in">
            <form onSubmit={submit}>
                <Stack>
                    {status && <Alert color="teal">{status}</Alert>}
                    <TextInput
                        label="Email"
                        type="email"
                        autoComplete="username"
                        required
                        autoFocus
                        value={form.data.email}
                        onChange={(e) => form.setData('email', e.currentTarget.value)}
                        error={form.errors.email}
                    />
                    <PasswordInput
                        label="Password"
                        autoComplete="current-password"
                        required
                        value={form.data.password}
                        onChange={(e) => form.setData('password', e.currentTarget.value)}
                        error={form.errors.password}
                    />
                    <Checkbox label="Keep me signed in on this device" checked={form.data.remember} onChange={(e) => form.setData('remember', e.currentTarget.checked)} />
                    <Button type="submit" loading={form.processing} fullWidth>
                        Sign in
                    </Button>
                </Stack>
            </form>
        </AuthLayout>
    );
}
