import { z } from "zod";

/**
 * Invoice Theme: the bounded set of presentation tokens that controls how a
 * freelancer's invoices look. Stored as one JSON object on the business profile
 * and consumed identically by the hosted page (DOM), its editor preview, and the
 * PDF (react-pdf). Every token must render the same on both surfaces, so the set
 * is curated, not free-form. See docs/adr/0001.
 *
 * Each field carries a default and a .catch fallback, so reading an old, partial,
 * or slightly-malformed theme degrades gracefully to defaults rather than failing.
 */

export const LAYOUTS = ["classic", "bold", "minimal"] as const;
export const LAYOUT_LABELS: Record<(typeof LAYOUTS)[number], string> = {
  classic: "Classic",
  bold: "Bold",
  minimal: "Minimal",
};

export const FONT_OPTIONS = ["ptsans", "ptserif", "spectral", "crimson", "arvo"] as const;

export const FONT_LABELS: Record<(typeof FONT_OPTIONS)[number], string> = {
  ptsans: "PT Sans",
  ptserif: "PT Serif",
  spectral: "Spectral",
  crimson: "Crimson",
  arvo: "Arvo",
};
export const TEXT_SCALES = ["s", "m", "l"] as const;
export const DENSITIES = ["compact", "normal", "roomy"] as const;
export const LOGO_SIZES = ["s", "m", "l"] as const;
export const LOGO_PLACEMENTS = ["left", "center"] as const;

export type FontOption = (typeof FONT_OPTIONS)[number];
export type TextScale = (typeof TEXT_SCALES)[number];
export type Density = (typeof DENSITIES)[number];

const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .default("#19191d")
  .catch("#19191d");

export const themeSchema = z.object({
  version: z.number().default(1).catch(1),
  layout: z.enum(LAYOUTS).default("classic").catch("classic"),
  font: z.enum(FONT_OPTIONS).default("ptsans").catch("ptsans"),
  accentColor: hex,
  textScale: z.enum(TEXT_SCALES).default("m").catch("m"),
  density: z.enum(DENSITIES).default("normal").catch("normal"),
  logo: z
    .object({
      url: z.string().url().nullable().default(null).catch(null),
      size: z.enum(LOGO_SIZES).default("m").catch("m"),
      placement: z.enum(LOGO_PLACEMENTS).default("left").catch("left"),
    })
    .default({ url: null, size: "m", placement: "left" })
    .catch({ url: null, size: "m", placement: "left" }),
  footer: z.string().max(300).default("").catch(""),
  fields: z
    .object({
      showDueDate: z.boolean().default(true).catch(true),
      showNotes: z.boolean().default(true).catch(true),
    })
    .default({ showDueDate: true, showNotes: true })
    .catch({ showDueDate: true, showNotes: true }),
});

export type InvoiceTheme = z.infer<typeof themeSchema>;

/** Parse a stored theme (or null/partial) into a complete, valid theme. */
export function parseTheme(raw: unknown): InvoiceTheme {
  const result = themeSchema.safeParse(raw ?? {});
  return result.success ? result.data : themeSchema.parse({});
}

export const defaultTheme: InvoiceTheme = themeSchema.parse({});

// --- Token -> value resolvers (pure; shared by both render surfaces) ---

/** CSS font-family for the DOM surface (next/font CSS variables). */
export function fontCss(font: FontOption): string {
  switch (font) {
    case "ptserif":
      return "var(--font-ptserif), Georgia, serif";
    case "spectral":
      return "var(--font-spectral), Georgia, serif";
    case "crimson":
      return "var(--font-crimson), Georgia, serif";
    case "arvo":
      return "var(--font-arvo), Georgia, serif";
    default:
      return "var(--font-ptsans), ui-sans-serif, system-ui, sans-serif";
  }
}

/** Base body font size in px for the DOM surface. */
export function baseFontPx(scale: TextScale): number {
  return scale === "s" ? 13 : scale === "l" ? 16 : 14;
}

/** Spacing multiplier applied to the document's padding/margins. */
export function densityScale(density: Density): number {
  return density === "compact" ? 0.8 : density === "roomy" ? 1.25 : 1;
}
