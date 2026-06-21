import { Arvo, Crimson_Text, PT_Sans, PT_Serif, Spectral } from "next/font/google";

// The curated invoice fonts, loaded for the DOM surfaces (hosted page + editor).
// The PDF registers the same families from bundled TTFs (lib/pdf/fonts.ts).
const ptSans = PT_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-ptsans",
  display: "swap",
});
const ptSerif = PT_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-ptserif",
  display: "swap",
});
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-spectral",
  display: "swap",
});
const crimson = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-crimson",
  display: "swap",
});
const arvo = Arvo({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-arvo",
  display: "swap",
});

export const invoiceFontVariables = [ptSans, ptSerif, spectral, crimson, arvo]
  .map((f) => f.variable)
  .join(" ");
