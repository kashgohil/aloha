"use client";

import { rescheduleBeatAction } from "@/app/actions/campaigns";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type DragCtx = {
  campaignId: string;
  draggingBeatId: string | null;
  setDraggingBeatId: (id: string | null) => void;
  submit: (beatId: string, date: string) => void;
};

const Ctx = createContext<DragCtx | null>(null);

const useDragCtx = (): DragCtx => {
  const v = useContext(Ctx);
  if (!v) throw new Error("Drag components must be inside <DragSurface>");
  return v;
};

// Wraps the canvas area. Renders a hidden reschedule form once and exposes
// a submit() that drop targets call. Drag chip + drop target pair set the
// beatId on dragstart and dispatch on drop. Past + drafted beats opt out
// by not wrapping in DragChip.
export function DragSurface({
  campaignId,
  children,
}: {
  campaignId: string;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const beatIdRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const [draggingBeatId, setDraggingBeatId] = useState<string | null>(null);

  const submit = useCallback((beatId: string, date: string) => {
    if (!formRef.current || !beatIdRef.current || !dateRef.current) return;
    beatIdRef.current.value = beatId;
    dateRef.current.value = date;
    formRef.current.requestSubmit();
  }, []);

  return (
    <Ctx.Provider
      value={{ campaignId, draggingBeatId, setDraggingBeatId, submit }}
    >
      <form ref={formRef} action={rescheduleBeatAction} className="hidden">
        <input type="hidden" name="campaignId" defaultValue={campaignId} />
        <input ref={beatIdRef} type="hidden" name="beatId" />
        <input ref={dateRef} type="hidden" name="date" />
      </form>
      {children}
    </Ctx.Provider>
  );
}

export function DragChip({
  beatId,
  disabled,
  children,
}: {
  beatId: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const ctx = useDragCtx();
  if (disabled) return <>{children}</>;
  return (
    <span
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/x-beat-id", beatId);
        ctx.setDraggingBeatId(beatId);
      }}
      onDragEnd={() => ctx.setDraggingBeatId(null)}
      className="contents"
    >
      {children}
    </span>
  );
}

export function DropDate({
  date,
  children,
  className,
  activeClassName = "ring-2 ring-primary/50 ring-inset rounded-md",
}: {
  date: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
}) {
  const ctx = useDragCtx();
  const [over, setOver] = useState(false);
  return (
    <div
      className={`${className ?? ""} ${over ? activeClassName : ""}`.trim()}
      onDragOver={(e) => {
        if (!ctx.draggingBeatId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!over) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const beatId =
          e.dataTransfer.getData("text/x-beat-id") || ctx.draggingBeatId;
        if (!beatId) return;
        ctx.submit(beatId, date);
      }}
    >
      {children}
    </div>
  );
}
