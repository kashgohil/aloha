"use client";

// Live preview of a template rendered with the user's draft state. Templates
// are pure presentational components with no server-only imports, so rendering
// them client-side works without changes.
//
// Design goals:
// - Device frame centered in the container.
// - Entire template visible (no inner scroll, no clipping).
// - Natural mobile width (375px); page flows to its own height so you see
//   the hero, links, subscribe, and footer all at once.

import { useId } from "react";
import { getTemplate, resolveTheme } from "@/lib/audience-templates";
import { getAccent } from "@/lib/audience-templates/tokens";
import type { PageTheme } from "@/db/schema";

type BasePreview = {
  templateId: string;
  theme: PageTheme | null;
  page: {
    id: string;
    userId: string;
    slug: string;
    title: string | null;
    bio: string | null;
    avatarUrl: string | null;
  };
  links: {
    id: string;
    title: string;
    url: string;
    order: number;
    iconPresetId: string | null;
  }[];
  avatarUrl: string | null;
  backgroundUrl: string | null;
};

export function DevicePreview(props: BasePreview) {
  const { templateId, theme, page, links, avatarUrl, backgroundUrl } = props;
  const key = useId();
  const template = getTemplate(templateId);
  const resolved = resolveTheme(template, theme);
  const Component = template.Component;
  const variant = template.subscribeVariant ?? "default";
  const accentColor = getAccent(resolved.accentId).color;

  return (
    <div className="mx-auto" style={{ width: 375 }}>
      <div className="rounded-[32px] border border-ink/15 bg-background p-2 shadow-[0_24px_48px_-24px_rgba(26,22,18,0.28)]">
        <div className="rounded-[24px] overflow-hidden pointer-events-none select-none bg-background">
          <Component
            key={key}
            page={{ ...page, templateId, theme }}
            links={links}
            theme={resolved}
            avatarUrl={avatarUrl}
            backgroundUrl={backgroundUrl}
            subscribeSlot={
              <PreviewSubscribe variant={variant} accentColor={accentColor} />
            }
            footerSlot={<PreviewFooter />}
          />
        </div>
      </div>
    </div>
  );
}

function PreviewSubscribe({
  variant,
  accentColor,
}: {
  variant: "default" | "inverted";
  accentColor: string;
}) {
  if (variant === "inverted") {
    return (
      <div className="space-y-2">
        <div
          className="h-11 rounded-full border flex items-center px-4 text-[13px]"
          style={{
            borderColor: "rgba(233,221,196,0.35)",
            color: "rgba(233,221,196,0.5)",
          }}
        >
          you@example.com
        </div>
        <div
          className="h-11 rounded-full flex items-center justify-center gap-1.5 text-[13px] font-medium"
          style={{ background: accentColor, color: "#1a1612" }}
        >
          Subscribe
          <span aria-hidden>→</span>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="h-11 rounded-full bg-background border border-border-strong flex items-center px-4 text-[13px] text-ink/40">
        you@example.com
      </div>
      <div className="h-11 rounded-full bg-ink text-background flex items-center justify-center gap-1.5 text-[13px] font-medium">
        Subscribe
        <span aria-hidden>→</span>
      </div>
    </div>
  );
}

function PreviewFooter() {
  // currentColor lets each template's footer container drive the color —
  // Noir sets cream, light templates stay ink/muted — so the branding is
  // always legible on its backdrop.
  return (
    <span
      className="inline-flex items-baseline gap-1"
      style={{ color: "currentColor" }}
    >
      <span className="text-[11px] uppercase tracking-[0.22em]">Made with</span>
      <span
        className="text-[15px] leading-none font-semibold tracking-[-0.03em]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Aloha
      </span>
    </span>
  );
}
