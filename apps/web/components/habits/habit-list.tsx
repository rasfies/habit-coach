"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HabitCard } from "@/components/ui/habit-card";
import { DayDotRow, type DayDotStatus } from "@/components/ui/day-dot";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HabitListItem {
  id: string;
  name: string;
  icon: string;
  streakCount: number;
  checkedToday: boolean;
  last14Days: DayDotStatus[];
}

interface HabitListProps {
  habits: HabitListItem[];
  onToggleCheck: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  loading?: Set<string>; // IDs currently in-flight
  showDayDots?: boolean;
}

// ---------------------------------------------------------------------------
// Drag handle icon
// ---------------------------------------------------------------------------

function DragHandle({ listeners, attributes }: { listeners?: object; attributes?: object }) {
  return (
    <button
      type="button"
      className="flex h-8 w-6 cursor-grab items-center justify-center rounded text-neutral-300 hover:text-neutral-500 active:cursor-grabbing focus:outline-none"
      aria-label="Drag to reorder"
      {...listeners}
      {...attributes}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path fillRule="evenodd" d="M3 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 5.25Zm0 4.5A.75.75 0 0 1 3.75 9h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 9.75Zm0 4.5a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Zm0 4.5a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Sortable habit row
// ---------------------------------------------------------------------------

interface SortableHabitItemProps {
  habit: HabitListItem;
  onToggleCheck: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading: boolean;
  showDayDots: boolean;
}

function SortableHabitItem({
  habit,
  onToggleCheck,
  onEdit,
  onDelete,
  isLoading,
  showDayDots,
}: SortableHabitItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2",
        isDragging && "shadow-xl"
      )}
    >
      {/* Drag handle */}
      <DragHandle listeners={listeners} attributes={attributes} />

      {/* Habit card */}
      <div className="flex-1 min-w-0">
        <HabitCard
          id={habit.id}
          name={habit.name}
          icon={habit.icon}
          streakCount={habit.streakCount}
          checkedToday={habit.checkedToday}
          onToggleCheck={onToggleCheck}
          disabled={isLoading}
        />
        {/* 14-day dot row below card */}
        {showDayDots && (
          <div className="mt-1.5 pl-1">
            <DayDotRow
              statuses={habit.last14Days}
              className="flex-wrap gap-1"
            />
          </div>
        )}
      </div>

      {/* Actions (visible on hover) */}
      {(onEdit || onDelete) && (
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(habit.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              aria-label={`Edit ${habit.name}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(habit.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-danger-50 hover:text-danger-600"
              aria-label={`Delete ${habit.name}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HabitList — sortable container
// ---------------------------------------------------------------------------

export function HabitList({
  habits,
  onToggleCheck,
  onReorder,
  onEdit,
  onDelete,
  loading = new Set(),
  showDayDots = true,
}: HabitListProps) {
  const [items, setItems] = useState(() => habits.map((h) => h.id));

  // Sync when habits prop changes
  React.useEffect(() => {
    setItems(habits.map((h) => h.id));
  }, [habits]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.indexOf(active.id as string);
    const newIndex = items.indexOf(over.id as string);

    const newItems = [...items];
    newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, active.id as string);

    setItems(newItems);
    onReorder(newItems);
  }

  const habitMap = new Map(habits.map((h) => [h.id, h]));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-3" role="list" aria-label="Habits list">
          {items.map((id) => {
            const habit = habitMap.get(id);
            if (!habit) return null;
            return (
              <SortableHabitItem
                key={id}
                habit={habit}
                onToggleCheck={onToggleCheck}
                onEdit={onEdit}
                onDelete={onDelete}
                isLoading={loading.has(id)}
                showDayDots={showDayDots}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default HabitList;
