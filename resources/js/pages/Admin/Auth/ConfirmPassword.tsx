import { useForm } from '@inertiajs/react';
import { Button, PasswordInput, Stack } from '@mantine/core';
import type { FormEvent } from 'react';

import { AuthLayout } from '@/admin/components/AuthLayout';

export default function ConfirmPassword() {
    const form = useForm({ password: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/admin/user/confirm-password', { onFinish: () => form.reset() });
    };

    return (
        <AuthLayout title="Confirm your password" description="This is a security-sensitive action. Please confirm your password to continue.">
            <form onSubmit={submit}>
                <Stack>
                    <PasswordInput
                        label="Password"
                        autoComplete="current-password"
                        autoFocus
                        required
                        value={form.data.password}
                        onChange={(e) => form.setData('password', e.currentTarget.value)}
                        error={form.errors.password}
                    />
                    <Button type="submit" loading={form.processing}>
                        Confirm
                    </Button>
                </Stack>
            </form>
        </AuthLayout>
    );
}
