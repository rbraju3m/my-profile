import { useForm } from '@inertiajs/react';
import { Anchor, Button, PinInput, Stack, Text, TextInput } from '@mantine/core';
import { useState, type FormEvent } from 'react';

import { AuthLayout } from '@/admin/components/AuthLayout';

export default function TwoFactorChallenge() {
    const [recovery, setRecovery] = useState(false);
    const form = useForm({ code: '', recovery_code: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.transform((data) => (recovery ? { recovery_code: data.recovery_code } : { code: data.code }));
        form.post('/admin/two-factor-challenge');
    };

    return (
        <AuthLayout
            title="Two-factor check"
            description={recovery ? 'Enter one of your recovery codes.' : 'Enter the 6-digit code from your authenticator app.'}
        >
            <form onSubmit={submit}>
                <Stack>
                    {recovery ? (
                        <TextInput
                            label="Recovery code"
                            autoComplete="one-time-code"
                            autoFocus
                            value={form.data.recovery_code}
                            onChange={(e) => form.setData('recovery_code', e.currentTarget.value)}
                            error={form.errors.recovery_code}
                        />
                    ) : (
                        <Stack gap={4}>
                            <PinInput
                                length={6}
                                type="number"
                                oneTimeCode
                                autoFocus
                                aria-label="Authentication code"
                                value={form.data.code}
                                onChange={(code) => form.setData('code', code)}
                                onComplete={() => undefined}
                            />
                            {form.errors.code && (
                                <Text c="red" size="sm">
                                    {form.errors.code}
                                </Text>
                            )}
                        </Stack>
                    )}
                    <Button type="submit" loading={form.processing} fullWidth>
                        Verify
                    </Button>
                    <Anchor component="button" type="button" size="sm" onClick={() => setRecovery((v) => !v)}>
                        {recovery ? 'Use an authenticator code' : 'Use a recovery code instead'}
                    </Anchor>
                </Stack>
            </form>
        </AuthLayout>
    );
}
