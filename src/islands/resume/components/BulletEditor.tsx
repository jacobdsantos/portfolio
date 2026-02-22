import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useResumeStore } from '../state/store';
import type { ResumeBullet } from '../../../lib/resume/types';

interface SortableBulletProps {
  bullet: ResumeBullet;
}

function SortableBullet({ bullet }: SortableBulletProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bullet.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
        isDragging
          ? 'border-[#00dfa2]/50 bg-[#00dfa2]/5'
          : 'border-[#2a3140] bg-[#0d1117]'
      }`}
    >
      <button
        className="mt-0.5 shrink-0 cursor-grab touch-none text-[#545d68] hover:text-[#8b949e] active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      </button>
      <span className="flex-1 text-[#e8edf5]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {bullet.text}
      </span>
    </div>
  );
}

export default function BulletEditor() {
  const master = useResumeStore((s) => s.master);
  const reorderBullets = useResumeStore((s) => s.reorderBullets);
  const runMatch = useResumeStore((s) => s.runMatch);
  const matchOutput = useResumeStore((s) => s.matchOutput);
  const [activeSection, setActiveSection] = useState<string | null>(
    master.experience[0]?.id ?? null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const allSections = [
    ...master.experience.map((e) => ({ id: e.id, label: `${e.company} - ${e.role}`, bullets: e.bullets })),
    ...master.projects.map((p) => ({ id: p.id, label: p.name, bullets: p.bullets })),
  ];

  const currentSection = allSections.find((s) => s.id === activeSection);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !activeSection || !currentSection) return;

      const oldIndex = currentSection.bullets.findIndex((b) => b.id === active.id);
      const newIndex = currentSection.bullets.findIndex((b) => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderBullets(activeSection, oldIndex, newIndex);
        if (matchOutput) {
          // Re-run matching after reorder
          setTimeout(runMatch, 0);
        }
      }
    },
    [activeSection, currentSection, reorderBullets, runMatch, matchOutput],
  );

  return (
    <div className="space-y-3">
      <h4
        className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Reorder Bullets
      </h4>

      {/* Section selector */}
      <select
        value={activeSection ?? ''}
        onChange={(e) => setActiveSection(e.target.value || null)}
        className="w-full rounded-lg border border-[#2a3140] bg-[#0d1117] px-3 py-2 text-sm text-[#e8edf5] outline-none focus:border-[#00dfa2]/50"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <optgroup label="Experience">
          {master.experience.map((e) => (
            <option key={e.id} value={e.id}>
              {e.company} - {e.role}
            </option>
          ))}
        </optgroup>
        <optgroup label="Projects">
          {master.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </optgroup>
      </select>

      {/* Bullet list with drag and drop */}
      {currentSection && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={currentSection.bullets.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {currentSection.bullets.map((bullet) => (
                <SortableBullet key={bullet.id} bullet={bullet} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
