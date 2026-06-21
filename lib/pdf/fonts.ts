import path from "node:path";
import { Font } from "@react-pdf/renderer";
import type { FontOption } from "@/lib/invoices/theme";

const dir = path.join(process.cwd(), "public/fonts");

const FAMILIES: Record<FontOption, { family: string; regular: string; bold: string }> = {
  ptsans: { family: "PT Sans", regular: "ptsans-regular.ttf", bold: "ptsans-bold.ttf" },
  ptserif: { family: "PT Serif", regular: "ptserif-regular.ttf", bold: "ptserif-bold.ttf" },
  spectral: { family: "Spectral", regular: "spectral-regular.ttf", bold: "spectral-bold.ttf" },
  crimson: { family: "Crimson Text", regular: "crimson-regular.ttf", bold: "crimson-bold.ttf" },
  arvo: { family: "Arvo", regular: "arvo-regular.ttf", bold: "arvo-bold.ttf" },
};

let registered = false;

/** Register the curated invoice fonts with react-pdf (idempotent). */
export function registerPdfFonts(): void {
  if (registered) return;
  registered = true;
  for (const f of Object.values(FAMILIES)) {
    Font.register({
      family: f.family,
      fonts: [{ src: path.join(dir, f.regular) }, { src: path.join(dir, f.bold), fontWeight: 700 }],
    });
  }
}

export function pdfFontFamily(font: FontOption): string {
  return FAMILIES[font].family;
}
