import { describe, expect, it } from "vitest";
import { applicationFee } from "./fee";

describe("applicationFee", () => {
  it("takes 1% of the total, rounded to the nearest minor unit", () => {
    expect(applicationFee(10000)).toBe(100); // $100.00 -> $1.00
    expect(applicationFee(322585)).toBe(3226); // $3,225.85 -> $32.26 (rounded)
    expect(applicationFee(0)).toBe(0);
  });

  it("rounds half to nearest", () => {
    expect(applicationFee(150)).toBe(2); // 1.5 -> 2
    expect(applicationFee(149)).toBe(1); // 1.49 -> 1
  });
});
