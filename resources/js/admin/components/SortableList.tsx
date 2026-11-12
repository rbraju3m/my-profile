import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActionIcon } from '@mantine/core';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';

type Props<T> = {
    items: T[];
    getId: (item: T) => string | number;
    onReorder: (items: T[]) => void;
    render: (item: T, handle: ReactNode) => ReactNode;
};

/**
 * Drag-and-drop list (mouse, touch and keyboard: focus the handle, press
 * space, use the arrow keys, press space again).
 */
export function SortableList<T>({ items, getId, onReorder, render }: Props<T>) {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;
        const from = items.findIndex((i) => String(getId(i)) === String(active.id));
        const to = items.findIndex((i) => String(getId(i)) === String(over.id));
        if (from >= 0 && to >= 0) onReorder(arrayMove(items, from, to));
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => String(getId(i)))} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                    <SortableRow key={String(getId(item))} id={String(getId(item))}>
                        {(handle) => render(item, handle)}
                    </SortableRow>
                ))}
            </SortableContext>
        </DndContext>
    );
}

function SortableRow({ id, children }: { id: string; children: (handle: ReactNode) => ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const handle = (
        <ActionIcon variant="subtle" color="gray" aria-label="Drag to reorder" style={{ cursor: 'grab', touchAction: 'none' }} {...attributes} {...listeners}>
            <GripVertical size={16} />
        </ActionIcon>
    );

    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, position: 'relative', zIndex: isDragging ? 2 : undefined }}>
            {children(handle)}
        </div>
    );
}
