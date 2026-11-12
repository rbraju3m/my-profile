import { router, useForm } from '@inertiajs/react';
import { Card, MultiSelect, SimpleGrid, Stack, Switch, Textarea, TextInput } from '@mantine/core';
import type { FormEvent } from 'react';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { ConfirmButton } from '@/admin/components/ConfirmButton';
import { RepeaterInput, StringListInput } from '@/admin/components/ListInputs';
import { PageHeader } from '@/admin/components/PageHeader';
import { SaveBar } from '@/admin/components/SaveBar';
import { errorsOf } from '@/admin/lib';
import type { SelectOption } from '@/admin/types';

type Phase = { title: string; period: string | null; points: string[] };
type Data = {
    company: string;
    title: string;
    location: string;
    started_at: string;
    ended_at: string | null;
    summary: string;
    phases: Phase[];
    technologies: number[];
};

export default function ExperienceForm({ experience, technologies }: { experience: (Data & { id: number }) | null; technologies: SelectOption[] }) {
    const editing = experience !== null;
    const form = useForm<Data>({
        company: experience?.company ?? '',
        title: experience?.title ?? '',
        location: experience?.location ?? '',
        started_at: experience?.started_at ?? '',
        ended_at: experience?.ended_at ?? null,
        summary: experience?.summary ?? '',
        phases: (experience?.phases ?? []).map((p) => ({ ...p, period: p.period ?? null })),
        technologies: experience?.technologies ?? [],
    });
    const err = errorsOf(form);
    const d = form.data;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => form.setDefaults() };
        if (editing) form.put(`/admin/experiences/${experience.id}`, options);
        else form.post('/admin/experiences', options);
    };

    return (
        <AdminLayout title={editing ? d.title : 'Add position'}>
            <PageHeader
                title={editing ? `${d.title} · ${d.company}` : 'Add position'}
                crumbs={[{ label: 'Experience', href: '/admin/experiences' }, { label: editing ? 'Edit' : 'New' }]}
                actions={
                    editing && (
                        <ConfirmButton title="Delete this position?" message="It will be removed from the timeline." onConfirm={(done) => router.delete(`/admin/experiences/${experience.id}`, { onFinish: done })}>
                            Delete
                        </ConfirmButton>
                    )
                }
            />
            <form onSubmit={submit}>
                <Card withBorder>
                    <Stack>
                        <SimpleGrid cols={{ base: 1, sm: 3 }}>
                            <TextInput label="Job title" required value={d.title} error={err('title')} onChange={(e) => form.setData('title', e.currentTarget.value)} />
                            <TextInput label="Company" required value={d.company} error={err('company')} onChange={(e) => form.setData('company', e.currentTarget.value)} />
                            <TextInput label="Location" value={d.location} error={err('location')} onChange={(e) => form.setData('location', e.currentTarget.value)} />
                        </SimpleGrid>
                        <SimpleGrid cols={{ base: 1, sm: 3 }}>
                            <TextInput label="Started" type="date" required value={d.started_at} error={err('started_at')} onChange={(e) => form.setData('started_at', e.currentTarget.value)} />
                            <TextInput
                                label="Ended"
                                type="date"
                                disabled={d.ended_at === null}
                                value={d.ended_at ?? ''}
                                error={err('ended_at')}
                                onChange={(e) => form.setData('ended_at', e.currentTarget.value)}
                            />
                            <Switch mt={30} label="I work here now" checked={d.ended_at === null} onChange={(e) => form.setData('ended_at', e.currentTarget.checked ? null : '')} />
                        </SimpleGrid>
                        <Textarea label="Summary" autosize minRows={2} value={d.summary} error={err('summary')} onChange={(e) => form.setData('summary', e.currentTarget.value)} />
                        <RepeaterInput
                            label="Phases"
                            description="Group achievements by period, e.g. “Platform ownership, 2024 – present”."
                            itemLabel="phase"
                            max={8}
                            value={d.phases}
                            onChange={(v) => form.setData('phases', v)}
                            empty={() => ({ title: '', period: null, points: [''] })}
                            renderItem={(p, i, update) => (
                                <Stack gap="xs">
                                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                        <TextInput label="Phase title" value={p.title} error={err(`phases.${i}.title`)} onChange={(e) => update({ title: e.currentTarget.value })} />
                                        <TextInput label="Period" value={p.period ?? ''} error={err(`phases.${i}.period`)} onChange={(e) => update({ period: e.currentTarget.value || null })} />
                                    </SimpleGrid>
                                    <StringListInput label="Achievements" itemLabel="point" multiline max={15} value={p.points} onChange={(points) => update({ points })} error={(j) => err(`phases.${i}.points.${j}`)} />
                                </Stack>
                            )}
                        />
                        <MultiSelect
                            label="Technologies"
                            data={technologies}
                            searchable
                            value={d.technologies.map(String)}
                            onChange={(v) => form.setData('technologies', v.map(Number))}
                            error={err('technologies')}
                        />
                    </Stack>
                </Card>
                <SaveBar dirty={form.isDirty || !editing} processing={form.processing} label={editing ? 'Save changes' : 'Create'} />
            </form>
        </AdminLayout>
    );
}
