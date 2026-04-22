import type { PageTheme } from "@/db/schema";
import { cozyTemplate } from "./cozy";
import { defaultTemplate } from "./default";
import { editorialTemplate } from "./editorial";
import { noirTemplate } from "./noir";
import { retroTemplate } from "./retro";
import { wavyTemplate } from "./wavy";
import type { TemplateDefinition } from "./types";

export const TEMPLATES: Record<string, TemplateDefinition> = {
  [defaultTemplate.id]: defaultTemplate,
  [editorialTemplate.id]: editorialTemplate,
  [noirTemplate.id]: noirTemplate,
  [retroTemplate.id]: retroTemplate,
  [wavyTemplate.id]: wavyTemplate,
  [cozyTemplate.id]: cozyTemplate,
};

export const DEFAULT_TEMPLATE_ID = defaultTemplate.id;

export function getTemplate(id: string | undefined | null): TemplateDefinition {
  if (!id) return TEMPLATES[DEFAULT_TEMPLATE_ID];
  return TEMPLATES[id] ?? TEMPLATES[DEFAULT_TEMPLATE_ID];
}

export function resolveTheme(
  template: TemplateDefinition,
  theme: PageTheme | null,
): Required<PageTheme> {
  return { ...template.defaults, ...(theme ?? {}) };
}

export function listTemplates(): TemplateDefinition[] {
  return Object.values(TEMPLATES);
}

export type { TemplateDefinition, TemplateProps } from "./types";
