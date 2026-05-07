"use client";

// Global compose dialog driven by URL query params:
//   ?compose=new                  — new empty draft
//   ?compose=<postId>             — edit existing post (any status)
//   ?compose=new&idea=<ideaId>    — new draft seeded from an idea
//   ?studio=<postId>              — legacy alias, treated as ?compose=<postId>
//
// One dialog, one component (`<Compose>`). Mounted once in the app
// layout; data is fetched client-side via `loadComposerData` so behavior
// stays in sync with whatever opened the dialog.

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  loadComposerData,
  type ComposerProps,
} from "@/app/actions/composer-data";
import { Compose } from "@/components/compose/compose";
import { RouteModal } from "@/components/route-modal";

type DialogState =
  | { kind: "loading" }
  | { kind: "ready"; props: ComposerProps }
  | { kind: "error"; message: string };

export function ComposerDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const compose = params.get("compose");
  // Legacy alias — opens the same dialog when an old link still uses ?studio=.
  const studio = params.get("studio");
  const ideaId = params.get("idea");

  // Resolve the post being edited from either query param. `?compose=new`
  // and absence both fall through to a new draft.
  const targetPostId = compose && compose !== "new" ? compose : studio ?? null;
  const isOpen = !!compose || !!studio;
  const key = isOpen
    ? `${targetPostId ?? "new"}:${ideaId ?? ""}`
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
        const result = await loadComposerData({
          postId: targetPostId,
          ideaId: ideaId ?? null,
        });
        if (cancelled) return;
        if (result.kind === "composer") {
          setState({ kind: "ready", props: result.props });
        } else if (result.kind === "not-found") {
          setState({ kind: "error", message: "This draft no longer exists." });
        } else {
          setState({ kind: "error", message: "Could not open compose." });
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
  }, [key, targetPostId, ideaId]);

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

  return (
    <RouteModal size="studio" onClose={close} onBeforeClose={onBeforeClose}>
      {state.kind === "loading" ? (
        <div className="flex h-40 items-center justify-center text-[13px] text-ink/60">
          Loading…
        </div>
      ) : state.kind === "error" ? (
        <div className="flex h-40 items-center justify-center text-[13px] text-ink/70">
          {state.message}
        </div>
      ) : (
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
          museAccess={state.props.museAccess}
          workspaceRole={state.props.author.workspaceRole}
          initialNotes={state.props.initialNotes}
          mentionableMembers={state.props.mentionableMembers}
          onClose={close}
          registerBeforeClose={(handler) => {
            beforeCloseRef.current = handler;
          }}
        />
      )}
    </RouteModal>
  );
}
