import { Badge } from '@mantine/core';

const colors: Record<string, string> = { live: 'green', built: 'blue', in_development: 'yellow', research: 'violet' };

export function StatusBadge({ status }: { status: { value: string; label: string } }) {
    return (
        <Badge color={colors[status.value] ?? 'gray'} variant="light">
            {status.label}
        </Badge>
    );
}
