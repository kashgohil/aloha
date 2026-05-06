"use client";

// Global composer/studio dialog driven by URL query params:
//   ?compose=new               — new empty draft (renders new <Compose>)
//   ?compose=<postId>          — edit existing post (legacy <Composer>)
//   ?compose=new&idea=<ideaId> — new draft seeded from an idea
//   ?studio=<postId>           — studio mode for a post (legacy <StudioShell>)
//
// Phase 3A wires the new <Compose> into the new-draft path only. Existing
// posts and studio mode keep going through the legacy surfaces until the
// new shell handles save/publish (3B) and AI assists (3C); 3D collapses
// everything into <Compose>.

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  loadComposerData,
  loadStudioData,
  type ComposerProps,
  type StudioProps,
} from "@/app/actions/composer-data";
import { Composer } from "@/app/app/composer/_components/composer";
import { StudioShell } from "@/app/app/composer/[draftId]/studio/_components/studio-shell";
import { Compose } from "@/components/compose/compose";
import { RouteModal } from "@/components/route-modal";

type DialogState =
  | { kind: "loading" }
  | { kind: "compose-new"; props: ComposerProps }
  | { kind: "composer"; props: ComposerProps }
  | { kind: "studio"; props: StudioProps }
  | { kind: "error"; message: string };

export function ComposerDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const compose = params.get("compose");
  const studio = params.get("studio");
  const ideaId = params.get("idea");

  const key = compose
    ? `c:${compose}:${ideaId ?? ""}`
    : studio
      ? `s:${studio}`
      : null;

  const [state, setState] = useState<DialogState | null>(null);
  const beforeCloseRef = useRef<(() => Promise<boolean>) | null>(null);

  useEffect(() => {
    if (!key) {
      setState(null);
      beforeCloseRef.current = null;
      return;
    }
    let cancelled = false;
    setState({ kind: "loading" });
    beforeCloseRef.current = null;
    (async () => {
      try {
        if (compose) {
          const result = await loadComposerData({
            postId: compose === "new" ? null : compose,
            ideaId: ideaId ?? null,
          });
          if (cancelled) return;
          if (result.kind === "composer") {
            setState({
              kind: compose === "new" ? "compose-new" : "composer",
              props: result.props,
            });
          } else if (
            result.kind === "redirect" &&
            result.to.includes("/studio")
          ) {
            const id = result.to.split("/")[3];
            const studioResult = await loadStudioData(id);
            if (cancelled) return;
            if (studioResult.kind === "studio") {
              setState({ kind: "studio", props: studioResult.props });
            } else {
              setState({ kind: "error", message: "Could not open studio." });
            }
          } else {
            setState({ kind: "error", message: "Could not open composer." });
          }
        } else if (studio) {
          const result = await loadStudioData(studio);
          if (cancelled) return;
          if (result.kind === "studio") {
            setState({ kind: "studio", props: result.props });
          } else {
            setState({ kind: "error", message: "Could not open studio." });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            kind: "error",
            message: err instanceof Error ? err.message : "Failed to load.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, compose, studio, ideaId]);

  if (!state) return null;

  const close = () => {
    const next = new URLSearchParams(params.toString());
    next.delete("compose");
    next.delete("studio");
    next.delete("idea");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const onBeforeClose = async () => {
    if (!beforeCloseRef.current) return true;
    return await beforeCloseRef.current();
  };

  // Size is decided up front from the URL — picking it from `state.kind`
  // would jump the dialog from "composer" (max-h) to "studio" (fixed h)
  // when the loader resolves, which renders as a thin line that snaps to
  // full height. Mapping by params keeps the box stable through loading.
  const size: "studio" | "composer" =
    compose === "new" || studio ? "studio" : "composer";

  return (
    <RouteModal size={size} onClose={close} onBeforeClose={onBeforeClose}>
      {state.kind === "loading" ? (
        <div className="flex h-40 items-center justify-center text-[13px] text-ink/60">
          Loading…
        </div>
      ) : state.kind === "error" ? (
        <div className="flex h-40 items-center justify-center text-[13px] text-ink/70">
          {state.message}
        </div>
      ) : state.kind === "compose-new" ? (
        <Compose
          author={state.props.author}
          connectedProviders={state.props.connectedProviders}
          channelProfiles={state.props.channelProfiles}
          postId={state.props.editingPostId}
          initialContent={state.props.initialContent}
          initialMedia={state.props.initialMedia}
          initialPlatforms={state.props.initialPlatforms}
          initialChannelContent={state.props.initialOverrides}
          initialDraftMeta={state.props.initialDraftMeta}
          initialStatus={state.props.initialStatus}
          initialScheduledAt={state.props.initialScheduledAt}
          sourceIdeaId={state.props.sourceIdeaId}
          publishAllowed={state.props.publishAllowed}
          workspaceRole={state.props.author.workspaceRole}
          onClose={close}
          registerBeforeClose={(handler) => {
            beforeCloseRef.current = handler;
          }}
        />
      ) : state.kind === "composer" ? (
        <Composer {...state.props} />
      ) : (
        <StudioShell {...state.props} />
      )}
    </RouteModal>
  );
}
