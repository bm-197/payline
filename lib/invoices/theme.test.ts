import { describe, expect, it } from "vitest";
import { defaultTheme, parseTheme } from "./theme";

describe("parseTheme", () => {
  it("returns full defaults for null/empty input", () => {
    expect(parseTheme(null)).toEqual(defaultTheme);
    expect(parseTheme({})).toEqual(defaultTheme);
    expect(defaultTheme.font).toBe("ptsans");
    expect(defaultTheme.accentColor).toBe("#19191d");
    expect(defaultTheme.logo.placement).toBe("left");
  });

  it("keeps valid fields and fills the rest with defaults", () => {
    const t = parseTheme({ accentColor: "#1a73e8", density: "roomy" });
    expect(t.accentColor).toBe("#1a73e8");
    expect(t.density).toBe("roomy");
    expect(t.textScale).toBe("m");
    expect(t.font).toBe("ptsans");
  });

  it("falls back per-field on malformed values, not the whole theme", () => {
    const t = parseTheme({ accentColor: "not-a-color", font: "comic-sans", textScale: "huge" });
    expect(t.accentColor).toBe("#19191d");
    expect(t.font).toBe("ptsans");
    expect(t.textScale).toBe("m");
  });

  it("parses nested logo + fields", () => {
    const t = parseTheme({
      logo: { url: "https://x.com/l.png", size: "l" },
      fields: { showNotes: false },
    });
    expect(t.logo.url).toBe("https://x.com/l.png");
    expect(t.logo.size).toBe("l");
    expect(t.logo.placement).toBe("left");
    expect(t.fields.showNotes).toBe(false);
    expect(t.fields.showDueDate).toBe(true);
  });
});
