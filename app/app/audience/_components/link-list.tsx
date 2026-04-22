"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EyeOff, GripVertical, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import {
  ICON_NONE,
  ICON_PRESETS,
  resolveIcon,
} from "@/lib/audience-templates/link-icons";
import { reorderLinks, updateLinkIcon } from "@/app/actions/audience";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DeleteLinkButton } from "./delete-confirm";

export type LinkRow = {
  id: string;
  title: string;
  url: string;
  order: number;
  iconPresetId: string | null;
};

export function LinkList({ initialLinks }: { initialLinks: LinkRow[] }) {
  const [items, setItems] = useState(initialLinks);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);
    startTransition(() => {
      reorderLinks(next.map((l) => l.id)).catch(() => {
        // Revert on failure so UI matches server truth.
        setItems(items);
      });
    });
  }

  function setIcon(linkId: string, iconPresetId: string | null) {
    setItems((prev) =>
      prev.map((l) => (l.id === linkId ? { ...l, iconPresetId } : l)),
    );
    startTransition(() => {
      updateLinkIcon(linkId, iconPresetId).catch(() => {});
    });
  }

  if (items.length === 0) {
    return (
      <li className="px-6 py-8 text-center text-[13.5px] text-ink/55 list-none">
        Add your newsletter, portfolio, shop, or latest post.
      </li>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="divide-y divide-border">
          {items.map((l) => (
            <SortableLinkRow key={l.id} link={l} onIconChange={setIcon} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableLinkRow({
  link,
  onIconChange,
}: {
  link: LinkRow;
  onIconChange: (id: string, preset: string | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-6 py-3 bg-background-elev",
        isDragging && "shadow-[0_10px_32px_-12px_rgba(26,22,18,0.2)] z-10",
      )}
    >
      <button
        type="button"
        className="shrink-0 p-1 rounded text-ink/35 hover:text-ink/70 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <IconPicker
        iconPresetId={link.iconPresetId}
        url={link.url}
        label={link.title}
        onChange={(preset) => onIconChange(link.id, preset)}
      />

      <div className="flex-1 min-w-0">
        <p className="text-[14px] text-ink font-medium truncate">{link.title}</p>
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="text-[12px] text-ink/55 hover:text-ink transition-colors truncate block"
        >
          {link.url}
        </a>
      </div>

      <DeleteLinkButton linkId={link.id} title={link.title} />
    </li>
  );
}

function IconPicker({
  iconPresetId,
  url,
  label,
  onChange,
}: {
  iconPresetId: string | null;
  url: string;
  label: string;
  onChange: (preset: string | null) => void;
}) {
  const preset = resolveIcon(iconPresetId, url, label);
  const Icon = preset?.Icon;
  const presets = Object.values(ICON_PRESETS);

  const statusLabel =
    iconPresetId === null
      ? "Auto"
      : iconPresetId === ICON_NONE
        ? "Hidden"
        : (ICON_PRESETS[iconPresetId]?.name ?? "Auto");

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className="w-10 h-10 rounded-full bg-background border-2 border-border-strong grid place-items-center shrink-0 text-ink hover:border-ink hover:bg-peach-100/60 transition-colors"
        aria-label={`Link icon (${statusLabel})`}
        title={statusLabel}
      >
        {Icon ? (
          <Icon className="w-[18px] h-[18px]" />
        ) : (
          <EyeOff className="w-[18px] h-[18px] text-ink/45" />
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] gap-3">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onChange(null)}
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] text-ink transition-colors",
              iconPresetId === null
                ? "bg-peach-100"
                : "hover:bg-muted/60",
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-ink/55" />
            <span className="flex-1 text-left">Auto-detect</span>
            {iconPresetId === null ? (
              <span className="text-[11px] text-ink/55 uppercase tracking-[0.18em]">
                On
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => onChange(ICON_NONE)}
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] text-ink transition-colors",
              iconPresetId === ICON_NONE
                ? "bg-peach-100"
                : "hover:bg-muted/60",
            )}
          >
            <EyeOff className="w-3.5 h-3.5 text-ink/55" />
            <span className="flex-1 text-left">No icon</span>
          </button>
        </div>
        <div className="border-t border-border -mx-3 pt-3 px-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/50 mb-2">
            Or choose
          </p>
          <div className="grid grid-cols-6 gap-1.5 max-h-[200px] overflow-y-auto">
            {presets.map((p) => {
              const PIcon = p.Icon;
              const active = iconPresetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange(p.id)}
                  title={p.name}
                  aria-label={p.name}
                  className={cn(
                    "aspect-square rounded-lg grid place-items-center text-ink/75 hover:text-ink border transition-colors",
                    active
                      ? "border-ink bg-peach-100"
                      : "border-transparent hover:bg-muted/60",
                  )}
                >
                  <PIcon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
