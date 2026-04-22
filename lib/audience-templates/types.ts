import type { ReactNode } from "react";
import type { PageTheme } from "@/db/schema";

export type TemplatePage = {
  id: string;
  userId: string;
  slug: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  templateId: string;
  theme: PageTheme | null;
};

export type TemplateLink = {
  id: string;
  title: string;
  url: string;
  order: number;
  iconPresetId: string | null;
};

export type TemplateProps = {
  page: TemplatePage;
  links: TemplateLink[];
  // Resolved theme (template defaults merged with page.theme)
  theme: Required<PageTheme>;
  // Resolved asset URLs (null when no asset set)
  avatarUrl: string | null;
  backgroundUrl: string | null;
  // Slots rendered by the parent so templates stay presentational
  subscribeSlot: ReactNode;
  footerSlot: ReactNode;
};

export type SubscribeVariant = "default" | "inverted";

export type TemplateDefinition = {
  id: string;
  name: string;
  // Short line that tells the user what this template IS, e.g. "Magazine
  // spread" or "Cafe receipt". Shown on the picker card so they can choose
  // the metaphor they want.
  tagline: string;
  // Hex swatch trio shown on the picker card. First = dominant, second =
  // accent, third = support. Kept independent of `defaults.accentId` so
  // cards can communicate palette at a glance.
  palette: [string, string, string];
  isFree: boolean;
  defaults: Required<PageTheme>;
  // Controls which SubscribeForm variant the public page renders inside this
  // template. Dark-background templates use "inverted" so the form stays
  // legible. Defaults to "default" when omitted.
  subscribeVariant?: SubscribeVariant;
  Component: (props: TemplateProps) => ReactNode;
};
