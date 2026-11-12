import { ActionIcon, Button, Group, Paper, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

function move<T>(list: T[], from: number, to: number): T[] {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item as T);
    return next;
}

function RowControls({ index, length, onMove, onRemove, label }: { index: number; length: number; onMove: (to: number) => void; onRemove: () => void; label: string }) {
    return (
        <Group gap={2} wrap="nowrap">
            <ActionIcon variant="subtle" color="gray" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Move ${label} up`}>
                <ArrowUp size={14} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" disabled={index === length - 1} onClick={() => onMove(index + 1)} aria-label={`Move ${label} down`}>
                <ArrowDown size={14} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="red" onClick={onRemove} aria-label={`Remove ${label}`}>
                <Trash2 size={14} />
            </ActionIcon>
        </Group>
    );
}

/** An editable list of strings (features, chips, bullet points). */
export function StringListInput({
    label,
    description,
    value,
    onChange,
    error,
    itemLabel = 'item',
    multiline = false,
    max,
    placeholder,
}: {
    label: string;
    description?: string;
    value: string[];
    onChange: (value: string[]) => void;
    error: (index: number) => string | undefined;
    itemLabel?: string;
    multiline?: boolean;
    max?: number;
    placeholder?: string;
}) {
    return (
        <Stack gap={6}>
            <div>
                <Text size="sm" fw={500}>
                    {label}
                </Text>
                {description && (
                    <Text size="xs" c="dimmed">
                        {description}
                    </Text>
                )}
            </div>
            {value.map((item, i) => (
                <Group key={i} gap="xs" align="flex-start" wrap="nowrap">
                    {multiline ? (
                        <Textarea
                            style={{ flex: 1 }}
                            autosize
                            minRows={1}
                            value={item}
                            placeholder={placeholder}
                            aria-label={`${itemLabel} ${i + 1}`}
                            error={error(i)}
                            onChange={(e) => onChange(value.map((v, j) => (j === i ? e.currentTarget.value : v)))}
                        />
                    ) : (
                        <TextInput
                            style={{ flex: 1 }}
                            value={item}
                            placeholder={placeholder}
                            aria-label={`${itemLabel} ${i + 1}`}
                            error={error(i)}
                            onChange={(e) => onChange(value.map((v, j) => (j === i ? e.currentTarget.value : v)))}
                        />
                    )}
                    <RowControls index={i} length={value.length} label={`${itemLabel} ${i + 1}`} onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
                </Group>
            ))}
            {(max === undefined || value.length < max) && (
                <Button variant="subtle" size="xs" leftSection={<Plus size={14} />} onClick={() => onChange([...value, ''])} style={{ alignSelf: 'flex-start' }}>
                    Add {itemLabel}
                </Button>
            )}
        </Stack>
    );
}

/** An editable list of objects; each row is rendered by `renderItem`. */
export function RepeaterInput<T>({
    label,
    description,
    value,
    onChange,
    empty,
    renderItem,
    itemLabel = 'item',
    max,
}: {
    label: string;
    description?: string;
    value: T[];
    onChange: (value: T[]) => void;
    empty: () => T;
    renderItem: (item: T, index: number, update: (patch: Partial<T>) => void) => ReactNode;
    itemLabel?: string;
    max?: number;
}) {
    return (
        <Stack gap={8}>
            <div>
                <Text size="sm" fw={500}>
                    {label}
                </Text>
                {description && (
                    <Text size="xs" c="dimmed">
                        {description}
                    </Text>
                )}
            </div>
            {value.map((item, i) => (
                <Paper key={i} withBorder p="sm">
                    <Group justify="space-between" mb={6}>
                        <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                            {itemLabel} {i + 1}
                        </Text>
                        <RowControls index={i} length={value.length} label={`${itemLabel} ${i + 1}`} onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
                    </Group>
                    {renderItem(item, i, (patch) => onChange(value.map((v, j) => (j === i ? { ...v, ...patch } : v))))}
                </Paper>
            ))}
            {(max === undefined || value.length < max) && (
                <Button variant="subtle" size="xs" leftSection={<Plus size={14} />} onClick={() => onChange([...value, empty()])} style={{ alignSelf: 'flex-start' }}>
                    Add {itemLabel}
                </Button>
            )}
        </Stack>
    );
}
