"use client";

// Unified Compose surface. Looks like the old multi-channel Composer
// (neutral page chrome — eyebrow + title, channel chips, Draft + per-
// channel tabs, editor + preview side-by-side, assist row, footer) and
// folds Studio's per-channel form features inline: clicking a channel
// tab reveals a "Format" pill row so the user can flip that single
// channel into Thread / Poll / Article mode without leaving Compose.
//
// State model matches the schema migrated in Phase 2:
//   - posts.content / .media         → base draft (Draft tab)
//   - posts.platforms                → which channels are tabs
//   - posts.channelContent[<ch>]     → per-channel { content?, form?, payload? }
//
// Phase scope:
//   3A — visual shell only (this file)
//   3B — wire save / schedule / publish (lazy DB write)
//   3C — AI assist row (Muse, Variants, Score, ...) + media uploader
//   3D — retire <Composer> + <StudioShell>

import {
  Check,
  ChevronDown,
  FileText,
  Gauge,
  GitBranch,
  ImagePlus,
  Images,
  Layers,
  Loader2,
  RotateCcw,
  Save,
  Send,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  publishPostNow,
  saveDraft,
  schedulePost,
  updatePost,
} from "@/app/actions/posts";
import type { WorkspaceRole } from "@/lib/current-context";
import { CHANNEL_ICONS, channelLabel } from "@/components/channel-chip";
import { CHANNEL_ACCENT } from "@/components/post-preview-card";
import { SchedulePopover } from "@/components/schedule-popover";
import type { ComposerPayload } from "@/app/actions/posts";
import { tzLocalInputToUtcDate, utcIsoToTzLocalInput } from "@/lib/tz";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  ChannelOverride,
  DraftMeta,
  PostMedia,
  StudioPayload,
} from "@/db/schema";
import { getCapability } from "@/lib/channels/capabilities";
import { getFormView } from "@/lib/channels/capabilities/views";
import type { PostStatus } from "@/lib/posts/transitions";
import { cn } from "@/lib/utils";

const DRAFT_TAB = "__draft__";

export type ComposeAuthor = {
  name: string;
  email: string;
  image: string | null;
  workspaceName: string | null;
  timezone: string;
};

export type ComposeProfile = {
  channel: string;
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
};

export type ComposeProps = {
  author: ComposeAuthor;
  connectedProviders: string[];
  channelProfiles: Record<string, ComposeProfile>;
  postId?: string | null;
  initialContent?: string;
  initialMedia?: PostMedia[];
  initialPlatforms?: string[];
  initialChannelContent?: Record<string, ChannelOverride>;
  initialDraftMeta?: DraftMeta | null;
  initialStatus?: PostStatus | null;
  initialScheduledAt?: string | null;
  sourceIdeaId?: string | null;
  publishAllowed?: boolean;
  workspaceRole?: WorkspaceRole | null;
  // Forces the dialog closed (skipping the dirty prompt). Called after a
  // successful publish/schedule so we don't prompt on top of a saved post.
  onClose?: () => void;
  registerBeforeClose?: (handler: () => Promise<boolean>) => void;
};

type Tab = typeof DRAFT_TAB | string;

export function Compose({
  author,
  connectedProviders,
  channelProfiles,
  postId: initialPostId = null,
  initialContent = "",
  initialMedia = [],
  initialPlatforms = [],
  initialChannelContent = {},
  initialDraftMeta = null,
  initialStatus = null,
  initialScheduledAt = null,
  sourceIdeaId = null,
  publishAllowed = true,
  workspaceRole = null,
  onClose,
  registerBeforeClose,
}: ComposeProps) {
  void workspaceRole;
  const [postId, setPostId] = useState<string | null>(initialPostId);
  const [content, setContent] = useState(initialContent);
  const [media] = useState<PostMedia[]>(initialMedia);
  const [platforms, setPlatforms] = useState<string[]>(initialPlatforms);
  const [channelContent, setChannelContent] = useState<
    Record<string, ChannelOverride>
  >(initialChannelContent);
  const [draftMeta] = useState<DraftMeta | null>(initialDraftMeta);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([DRAFT_TAB]),
  );
  const [isSaving, startSaving] = useTransition();
  const [isPublishing, startPublishing] = useTransition();
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleInput, setScheduleInput] = useState(
    initialScheduledAt
      ? utcIsoToTzLocalInput(initialScheduledAt, author.timezone)
      : "",
  );
  // Channels whose form payload has been edited directly by the user.
  // Anything NOT in this set inherits live from the base Draft — typing
  // in Draft re-hydrates each non-customized channel's payload. Once a
  // channel is marked customized, it stops inheriting until reset.
  const [customizedChannels, setCustomizedChannels] = useState<Set<string>>(
    () => new Set(),
  );
  const [dirty, setDirty] = useState(false);
  const [closePrompt, setClosePrompt] = useState<{
    resolve: (ok: boolean) => void;
  } | null>(null);

  const isReadOnly = initialStatus !== null && initialStatus !== "draft";
  const isEditing = !!postId;

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!registerBeforeClose) return;
    registerBeforeClose(async () => {
      if (!dirty) return true;
      return await new Promise<boolean>((resolve) => {
        setClosePrompt({ resolve });
      });
    });
  }, [registerBeforeClose, dirty]);

  const markCustomized = (channel: string) => {
    setCustomizedChannels((prev) => {
      if (prev.has(channel)) return prev;
      const next = new Set(prev);
      next.add(channel);
      return next;
    });
  };

  // Toggling a channel chip adds/removes it from `platforms`. New channels
  // auto-seed the channel's first capability form (typically "post") so
  // the user lands directly in a working format — no "use base draft"
  // intermediate state.
  const togglePlatform = (channel: string) => {
    setDirty(true);
    const isAdding = !platforms.includes(channel);
    setPlatforms((prev) =>
      isAdding ? [...prev, channel] : prev.filter((p) => p !== channel),
    );
    setChannelContent((prev) => {
      if (isAdding) {
        const cap = getCapability(channel);
        const form = cap?.forms[0];
        if (!form) return prev;
        const payload = form.hydrate({ content, media });
        return {
          ...prev,
          [channel]: { ...(prev[channel] ?? {}), form: form.id, payload },
        };
      }
      if (!prev[channel]) return prev;
      const next = { ...prev };
      delete next[channel];
      return next;
    });
    if (!isAdding) {
      // Removing a channel — drop its customization flag too.
      setCustomizedChannels((prev) => {
        if (!prev.has(channel)) return prev;
        const next = new Set(prev);
        next.delete(channel);
        return next;
      });
    }
  };

  // Type in Draft → re-hydrate every uncustomized channel's payload from
  // the new base text. Customized channels keep their own content.
  const updateBaseContent = (next: string) => {
    setDirty(true);
    setContent(next);
    setChannelContent((prev) => {
      let out = prev;
      let mutated = false;
      for (const channel of platforms) {
        if (customizedChannels.has(channel)) continue;
        const cap = getCapability(channel);
        if (!cap) continue;
        const existing = prev[channel] ?? {};
        const formId = existing.form ?? cap.forms[0]?.id;
        if (!formId) continue;
        const formObj = cap.forms.find((f) => f.id === formId);
        if (!formObj) continue;
        const payload = formObj.hydrate({ content: next, media });
        if (!mutated) {
          out = { ...prev };
          mutated = true;
        }
        out[channel] = { ...existing, form: formId, payload };
      }
      return out;
    });
  };

  const switchForm = (channel: string, nextFormId: string | null) => {
    if (nextFormId === null) return;
    setDirty(true);
    setChannelContent((prev) => {
      const cap = getCapability(channel);
      if (!cap) return prev;
      const existing = prev[channel] ?? {};
      const nextForm = cap.forms.find((f) => f.id === nextFormId);
      if (!nextForm) return prev;
      // Uncustomized channels re-hydrate from the live base draft so the
      // new form picks up the latest text. Customized channels flatten
      // the current form's payload to carry user edits across.
      let seed: { content: string; media: PostMedia[] };
      if (customizedChannels.has(channel)) {
        const currentForm = existing.form
          ? cap.forms.find((f) => f.id === existing.form)
          : null;
        const flat = currentForm
          ? currentForm.flatten(existing.payload ?? {})
          : {
              text: existing.content ?? content,
              media: existing.media ?? media,
            };
        seed = { content: flat.text, media: flat.media };
      } else {
        seed = { content, media };
      }
      const payload = nextForm.hydrate(seed);
      return {
        ...prev,
        [channel]: { ...existing, form: nextForm.id, payload },
      };
    });
  };

  const updatePayload = (channel: string, payload: StudioPayload) => {
    setDirty(true);
    markCustomized(channel);
    setChannelContent((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], payload },
    }));
  };

  // Drop the channel's customization flag and re-hydrate its current
  // form's payload from the live base draft. Also clears any plain-text
  // content/media override so the channel is back to pure inheritance.
  const resetChannelToBase = (channel: string) => {
    setDirty(true);
    setCustomizedChannels((prev) => {
      if (!prev.has(channel)) return prev;
      const next = new Set(prev);
      next.delete(channel);
      return next;
    });
    setChannelContent((prev) => {
      const cap = getCapability(channel);
      if (!cap) return prev;
      const existing = prev[channel] ?? {};
      const formId = existing.form ?? cap.forms[0]?.id;
      if (!formId) return prev;
      const formObj = cap.forms.find((f) => f.id === formId);
      if (!formObj) return prev;
      const payload = formObj.hydrate({ content, media });
      return {
        ...prev,
        [channel]: { form: formId, payload },
      };
    });
  };

  // ── Persistence ───────────────────────────────────────────────────

  const buildPayload = (): ComposerPayload => ({
    content,
    platforms,
    media,
    channelContent,
    sourceIdeaId: sourceIdeaId ?? null,
    draftMeta,
  });

  // Single save path: saveDraft for first commit (no postId yet),
  // updatePost otherwise. Returns the row id either way so callers
  // (publish / schedule) can chain off the same persistence step.
  const persistDraft = async (): Promise<string> => {
    const payload = buildPayload();
    if (postId) {
      await updatePost(postId, payload);
      return postId;
    }
    const res = await saveDraft(payload);
    setPostId(res.postId);
    return res.postId;
  };

  const handleSave = () => {
    if (isReadOnly) return;
    const toastId = toast.loading("Saving draft…");
    startSaving(async () => {
      try {
        await persistDraft();
        setDirty(false);
        toast.success("Draft saved.", { id: toastId });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't save draft.",
          { id: toastId },
        );
      }
    });
  };

  const handlePublish = () => {
    if (isReadOnly) return;
    if (platforms.length === 0) {
      toast.error("Pick at least one channel to publish to.");
      return;
    }
    const toastId = toast.loading("Publishing…");
    startPublishing(async () => {
      try {
        const id = await persistDraft();
        const result = await publishPostNow(id);
        if (result.summary?.anyOk) {
          toast.success("Posted.", { id: toastId });
          setDirty(false);
          onClose?.();
        } else {
          toast.error("Publish failed.", { id: toastId });
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Publish failed.",
          { id: toastId },
        );
      }
    });
  };

  const handleSchedule = () => {
    if (isReadOnly) return;
    if (!scheduleInput) return;
    if (platforms.length === 0) {
      toast.error("Pick at least one channel to schedule for.");
      return;
    }
    const toastId = toast.loading("Scheduling…");
    startPublishing(async () => {
      try {
        const id = await persistDraft();
        const when = tzLocalInputToUtcDate(scheduleInput, author.timezone);
        await schedulePost(id, when);
        toast.success("Scheduled.", { id: toastId });
        setDirty(false);
        setShowSchedule(false);
        onClose?.();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't schedule.",
          { id: toastId },
        );
      }
    });
  };

  // ──────────────────────────────────────────────────────────────────

  const updateOverrideContent = (channel: string, text: string) => {
    setDirty(true);
    markCustomized(channel);
    setChannelContent((prev) => {
      const existing = prev[channel] ?? {};
      const next = { ...prev };
      if (text === "" || text === content) {
        const { content: _drop, ...rest } = existing;
        void _drop;
        if (Object.keys(rest).length === 0) delete next[channel];
        else next[channel] = rest;
      } else {
        next[channel] = { ...existing, content: text };
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-6 lg:px-10 py-6 shrink-0">
        <Header isEditing={isEditing} status={initialStatus} />
      </div>

      <div className="shrink-0">
        <ProfilePicker
          connectedProviders={connectedProviders}
          channelProfiles={channelProfiles}
          selected={platforms}
          onToggle={togglePlatform}
        />
      </div>

      <TooltipProvider delay={250}>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 lg:px-10 pt-4 pb-6 space-y-2.5">
          <AccordionItem
            id={DRAFT_TAB}
            label="Draft"
            isExpanded={expanded.has(DRAFT_TAB)}
            onToggle={() => toggleExpanded(DRAFT_TAB)}
            customized={false}
            actions={GENERIC_ACTIONS.map((a) => (
              <HeaderAction
                key={a.id}
                icon={a.Icon}
                label={a.label}
                accented={false}
                disabled
              />
            ))}
          >
            <DraftBody
              content={content}
              onChange={updateBaseContent}
              disabled={isReadOnly}
            />
          </AccordionItem>

          {platforms.map((channel) => {
            const override = channelContent[channel] ?? {};
            const customized = customizedChannels.has(channel);
            const accented = !!CHANNEL_ACCENT[channel];
            return (
              <AccordionItem
                key={channel}
                id={channel}
                label={channelLabel(channel)}
                channelIcon={channel}
                isExpanded={expanded.has(channel)}
                onToggle={() => toggleExpanded(channel)}
                customized={customized}
                actions={CHANNEL_ACTIONS.map((a) => (
                  <HeaderAction
                    key={a.id}
                    icon={a.Icon}
                    label={a.label}
                    accented={accented}
                    disabled
                  />
                ))}
              >
                <ChannelBody
                  channel={channel}
                  override={override}
                  baseContent={content}
                  customized={customized}
                  onSwitchForm={(id) => switchForm(channel, id)}
                  onPayloadChange={(p) => updatePayload(channel, p)}
                  onOverrideContent={(t) => updateOverrideContent(channel, t)}
                  onReset={() => resetChannelToBase(channel)}
                  author={author}
                  profile={channelProfiles[channel] ?? null}
                  disabled={isReadOnly}
                />
              </AccordionItem>
            );
          })}
        </div>
      </TooltipProvider>

      <Footer
        isReadOnly={isReadOnly}
        isSaving={isSaving}
        isPublishing={isPublishing}
        canPublish={
          publishAllowed && platforms.length > 0 && content.trim().length > 0
        }
        scheduleInput={scheduleInput}
        setScheduleInput={setScheduleInput}
        showSchedule={showSchedule}
        setShowSchedule={setShowSchedule}
        timezone={author.timezone}
        onSave={handleSave}
        onPublish={handlePublish}
        onSchedule={handleSchedule}
        scheduledStatus={initialStatus === "scheduled"}
      />

      {closePrompt ? (
        <ConfirmDialog
          isOpen={true}
          title="Discard changes?"
          description="You'll lose any edits you haven't saved as a draft."
          confirmText="Discard"
          cancelText="Keep editing"
          variant="destructive"
          onClose={() => {
            closePrompt.resolve(false);
            setClosePrompt(null);
          }}
          onConfirm={() => {
            closePrompt.resolve(true);
            setClosePrompt(null);
          }}
        />
      ) : null}
    </div>
  );
}

// ── Header ───────────────────────────────────────────────────────────────

function Header({
  isEditing,
  status,
}: {
  isEditing: boolean;
  status: PostStatus | null;
}) {
  const eyebrow = isEditing ? statusEyebrow(status) : "New post";
  return (
    <header>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
        {eyebrow}
      </p>
      <h2 className="mt-1.5 font-display text-[32px] leading-[1.08] tracking-[-0.02em] text-ink font-normal">
        {isEditing ? (
          <>
            Edit <span className="text-primary">this one.</span>
          </>
        ) : (
          <>
            Compose <span className="text-primary">your next one.</span>
          </>
        )}
      </h2>
    </header>
  );
}

function statusEyebrow(status: PostStatus | null) {
  if (!status || status === "draft") return "Editing draft";
  if (status === "in_review") return "In review";
  if (status === "approved") return "Approved";
  if (status === "scheduled") return "Scheduled";
  if (status === "published") return "Published";
  return "Editing draft";
}

// ── Channel chips ────────────────────────────────────────────────────────

function ProfilePicker({
  connectedProviders,
  channelProfiles,
  selected,
  onToggle,
}: {
  connectedProviders: string[];
  channelProfiles: Record<string, ComposeProfile>;
  selected: string[];
  onToggle: (channel: string) => void;
}) {
  if (connectedProviders.length === 0) {
    return (
      <section className="px-6 lg:px-10 py-3 bg-background border-t border-b border-border">
        <p className="text-[12.5px] text-ink/55 italic">
          Connect a channel from settings to publish from here.
        </p>
      </section>
    );
  }
  return (
    <section className="px-6 lg:px-10 py-3 bg-background border-t border-b border-border">
      <TooltipProvider delay={250}>
        <div className="flex flex-wrap items-center gap-2.5">
          {connectedProviders.map((channel) => {
            const profile = channelProfiles[channel] ?? null;
            const active = selected.includes(channel);
            return (
              <Tooltip key={channel}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => onToggle(channel)}
                      aria-pressed={active}
                      aria-label={profile?.handle ?? channelLabel(channel)}
                      className="relative shrink-0 group"
                    >
                      <ProfileAvatar
                        channel={channel}
                        profile={profile}
                        active={active}
                      />
                      <ChannelBadge channel={channel} active={active} />
                      {active ? (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-background ring-2 ring-background">
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </span>
                      ) : null}
                    </button>
                  }
                />
                <TooltipContent side="bottom" className="text-center">
                  <p className="font-medium">{channelLabel(channel)}</p>
                  {profile?.handle ? (
                    <p className="text-ink/60 text-[11.5px] mt-0.5">
                      {profile.handle}
                    </p>
                  ) : null}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </section>
  );
}

function ProfileAvatar({
  channel,
  profile,
  active,
}: {
  channel: string;
  profile: ComposeProfile | null;
  active: boolean;
}) {
  const Icon = CHANNEL_ICONS[channel];
  return (
    <span
      className={cn(
        "block w-9 h-9 rounded-full overflow-hidden bg-background border transition-all",
        active
          ? "border-ink ring-2 ring-ink/15 ring-offset-2 ring-offset-background"
          : "border-border-strong opacity-70 group-hover:opacity-100",
      )}
    >
      {profile?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatarUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="w-full h-full grid place-items-center bg-muted text-ink/55">
          {Icon ? <Icon className="w-4 h-4" /> : null}
        </span>
      )}
    </span>
  );
}

function ChannelBadge({
  channel,
  active,
}: {
  channel: string;
  active: boolean;
}) {
  const Icon = CHANNEL_ICONS[channel];
  if (!Icon) return null;
  return (
    <span
      className={cn(
        "absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full ring-2 ring-background transition-colors",
        active ? "bg-ink text-background" : "bg-background text-ink/70 border border-border",
      )}
    >
      <Icon className="w-2.5 h-2.5" />
    </span>
  );
}

// ── Accordion stack (Draft + per-channel) ───────────────────────────────

function AccordionItem({
  id,
  label,
  channelIcon,
  isExpanded,
  onToggle,
  customized,
  actions,
  children,
}: {
  id: string;
  label: string;
  channelIcon?: string;
  isExpanded: boolean;
  onToggle: () => void;
  customized: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  void id;
  const Icon = channelIcon ? CHANNEL_ICONS[channelIcon] : null;
  // Channel rows take the channel's accent color; Draft stays neutral.
  const accent = channelIcon
    ? CHANNEL_ACCENT[channelIcon] ?? "bg-ink text-background"
    : null;
  const isAccented = !!accent;
  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div
        className={cn(
          "flex items-center gap-2 pl-4 pr-2 h-11 transition-colors",
          isAccented ? accent : "bg-background",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex-1 min-w-0 flex items-center gap-2 h-full text-left transition-opacity",
            isAccented ? "hover:opacity-90" : "hover:opacity-80",
          )}
          aria-expanded={isExpanded}
        >
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform shrink-0",
              isAccented ? "text-current opacity-80" : "text-ink/55",
              isExpanded ? "rotate-0" : "-rotate-90",
            )}
          />
          {Icon ? (
            <Icon
              className={cn(
                "w-3.5 h-3.5 shrink-0",
                isAccented ? "" : "text-ink/70",
              )}
            />
          ) : null}
          <span
            className={cn(
              "text-[13px] font-medium",
              isAccented ? "" : "text-ink",
            )}
          >
            {label}
          </span>
          {customized ? (
            <span
              className={cn(
                "ml-1 inline-flex items-center h-[18px] px-1.5 rounded-full text-[10px] font-medium uppercase tracking-[0.12em]",
                isAccented
                  ? "bg-white/20 text-current border border-white/15"
                  : "bg-primary-soft text-primary-deep",
              )}
              title="Customized"
            >
              Custom
            </span>
          ) : null}
        </button>
        {actions ? (
          <div
            className="flex items-center gap-0.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        ) : null}
      </div>
      {isExpanded ? (
        <div className="border-t border-border px-4 py-4">{children}</div>
      ) : null}
    </div>
  );
}

function HeaderAction({
  icon: Icon,
  label,
  accented,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  accented: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  // Native `disabled` blocks pointer events so the tooltip never fires.
  // Use aria-disabled + a click guard instead — the button stays
  // hoverable, the tooltip still shows the action's name.
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={(e) => {
              if (disabled) {
                e.preventDefault();
                return;
              }
              onClick?.();
            }}
            aria-label={label}
            aria-disabled={disabled || undefined}
            className={cn(
              "inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors",
              accented
                ? "text-white/85 hover:text-white hover:bg-white/15"
                : "text-ink/65 hover:text-ink hover:bg-muted/50",
              disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function DraftBody({
  content,
  onChange,
  disabled,
}: {
  content: string;
  onChange: (next: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] gap-6 min-h-[200px]">
      <div className="flex min-w-0">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={8}
          placeholder="Write the base draft — channels inherit from here."
          className="flex-1 bg-transparent text-[15px] leading-[1.6] text-ink placeholder:text-ink/35 focus:outline-none resize-none"
        />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink/55 mb-3">
          Preview
        </p>
        <div className="rounded-xl border border-dashed border-border-strong bg-muted/30 p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-20 rounded-full bg-muted" />
              <div className="h-2 w-12 rounded-full bg-muted/70" />
            </div>
            <div className="space-y-1 pt-1">
              <div className="h-2 w-full rounded-full bg-muted/60" />
              <div className="h-2 w-[85%] rounded-full bg-muted/60" />
              <div className="h-2 w-[60%] rounded-full bg-muted/60" />
            </div>
            <p className="pt-2 text-[12px] text-ink/55 leading-snug">
              Expand a channel below to see how this draft renders there.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelBody({
  channel,
  override,
  baseContent,
  customized,
  onSwitchForm,
  onPayloadChange,
  onOverrideContent,
  onReset,
  author,
  profile,
  disabled,
}: {
  channel: string;
  override: ChannelOverride;
  baseContent: string;
  customized: boolean;
  onSwitchForm: (id: string | null) => void;
  onPayloadChange: (p: StudioPayload) => void;
  onOverrideContent: (text: string) => void;
  onReset: () => void;
  author: ComposeAuthor;
  profile: ComposeProfile | null;
  disabled: boolean;
}) {
  const cap = getCapability(channel);
  const formId = override.form ?? null;
  const view = useMemo(
    () => (formId ? getFormView(channel, formId) : null),
    [channel, formId],
  );

  if (!cap) {
    return (
      <p className="text-[13.5px] text-ink/65">
        No capabilities registered for {channel}.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <FormatPills
        channel={channel}
        forms={cap.forms}
        currentFormId={formId}
        onSwitchForm={onSwitchForm}
        disabled={disabled}
        customized={customized}
        onReset={onReset}
      />
      {formId && view ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] gap-6">
          <div className="min-w-0">
            <view.Editor
              payload={override.payload ?? {}}
              onChange={onPayloadChange}
              disabled={disabled}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink/55 mb-3">
              Preview
            </p>
            <view.Preview
              payload={override.payload ?? {}}
              profile={profile}
              author={{ name: author.name, image: author.image }}
            />
          </div>
        </div>
      ) : (
        <PlainOverride
          override={override}
          baseContent={baseContent}
          onChange={onOverrideContent}
          disabled={disabled}
          channel={channel}
        />
      )}
    </div>
  );
}

function FormatPills({
  channel,
  forms,
  currentFormId,
  onSwitchForm,
  disabled,
  customized,
  onReset,
}: {
  channel: string;
  forms: { id: string; label: string }[];
  currentFormId: string | null;
  onSwitchForm: (id: string | null) => void;
  disabled: boolean;
  customized: boolean;
  onReset: () => void;
}) {
  void channel;
  const selected = currentFormId ?? forms[0]?.id ?? null;
  return (
    <div className="-mx-4 -mt-4 px-4 py-2 border-b border-border flex items-center gap-1.5 flex-wrap">
      {forms.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onSwitchForm(f.id)}
          disabled={disabled}
          className={cn(
            "inline-flex items-center h-7 px-2.5 rounded-full border text-[12px] font-medium transition-colors",
            f.id === selected
              ? "bg-ink text-background border-ink"
              : "bg-background border-border-strong text-ink hover:border-ink/40",
          )}
        >
          {f.label}
        </button>
      ))}
      {customized ? (
        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          title="Reset this channel to the base draft"
          className="ml-auto inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[12px] font-medium text-ink/65 hover:text-ink hover:bg-muted/50 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset to draft
        </button>
      ) : null}
    </div>
  );
}

function PlainOverride({
  override,
  baseContent,
  onChange,
  disabled,
  channel,
}: {
  override: ChannelOverride;
  baseContent: string;
  onChange: (text: string) => void;
  disabled: boolean;
  channel: string;
}) {
  const text = override.content ?? baseContent;
  const isOverriding = typeof override.content === "string";
  return (
    <div className="rounded-2xl border border-border bg-background-elev p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[12.5px] text-ink/65">
          {isOverriding
            ? `Custom text for ${channelLabel(channel)}.`
            : `Inheriting the base draft. Type below to override for ${channelLabel(channel)} only.`}
        </p>
        {isOverriding ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[12px] text-ink/55 hover:text-ink transition-colors"
          >
            Reset to base
          </button>
        ) : null}
      </div>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={9}
        placeholder="Override the base text for this channel only."
        className="w-full bg-transparent text-[14.5px] leading-[1.6] text-ink placeholder:text-ink/35 focus:outline-none resize-none"
      />
    </div>
  );
}

// ── Footer (visual placeholder; wires in 3B / 3C) ────────────────────────

// Action sets shown as icon buttons on each accordion's header.
//   - GENERIC_ACTIONS run against the base draft (no channel context).
//   - CHANNEL_ACTIONS additionally include channel-specific tools
//     (variants, fan-out, score) that need a target platform.
type AssistAction = {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};
const GENERIC_ACTIONS: AssistAction[] = [
  { id: "muse", label: "Muse", Icon: Wand2 },
  { id: "import", label: "Import", Icon: FileText },
  { id: "image", label: "Image", Icon: ImagePlus },
  { id: "library", label: "Library", Icon: Images },
];
const CHANNEL_ACTIONS: AssistAction[] = [
  { id: "muse", label: "Muse", Icon: Wand2 },
  { id: "variants", label: "Variants", Icon: Layers },
  { id: "fanout", label: "Fan out", Icon: GitBranch },
  { id: "score", label: "Score", Icon: Gauge },
  { id: "image", label: "Image", Icon: ImagePlus },
  { id: "library", label: "Library", Icon: Images },
];

function Footer({
  isReadOnly,
  isSaving,
  isPublishing,
  canPublish,
  scheduleInput,
  setScheduleInput,
  showSchedule,
  setShowSchedule,
  timezone,
  onSave,
  onPublish,
  onSchedule,
  scheduledStatus,
}: {
  isReadOnly: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  canPublish: boolean;
  scheduleInput: string;
  setScheduleInput: (v: string) => void;
  showSchedule: boolean;
  setShowSchedule: (v: boolean) => void;
  timezone: string;
  onSave: () => void;
  onPublish: () => void;
  onSchedule: () => void;
  scheduledStatus: boolean;
}) {
  const busy = isSaving || isPublishing;
  const saveBtn =
    "inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border-strong text-[12.5px] font-medium text-ink hover:bg-muted/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const scheduleBtn =
    "inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-background border border-border-strong text-[12.5px] font-medium text-ink hover:bg-muted/40 transition-colors disabled:opacity-50";
  const publishBtn =
    "inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  return (
    <footer className="border-t border-border bg-background-elev px-6 lg:px-10 py-3">
      <div className="max-w-[1200px] mx-auto flex items-center justify-end gap-2 flex-wrap">
        <button
          type="button"
          onClick={onSave}
          disabled={isReadOnly || busy}
          className={saveBtn}
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          Save draft
        </button>
        <SchedulePopover
          scheduledAt={scheduleInput}
          setScheduledAt={setScheduleInput}
          open={showSchedule}
          setOpen={setShowSchedule}
          onConfirm={onSchedule}
          disabled={isReadOnly || busy}
          busy={isPublishing && !!scheduleInput}
          timezone={timezone}
          confirmLabel={scheduledStatus ? "Reschedule" : "Schedule"}
          idleLabel={scheduledStatus ? "Reschedule" : "Schedule"}
          allowClear={!scheduledStatus}
          triggerClassName={scheduleBtn}
        />
        <button
          type="button"
          onClick={onPublish}
          disabled={isReadOnly || busy || !canPublish}
          className={publishBtn}
        >
          {isPublishing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          Publish
        </button>
      </div>
    </footer>
  );
}
