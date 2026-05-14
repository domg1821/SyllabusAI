import { describe, it, expect } from "vitest";
import { calcGradeImpact, fmtPts, fmtPct, GRADE_THRESHOLDS } from "../gradeUtils";

// ─── calcGradeImpact ──────────────────────────────────────────────────────────

describe("calcGradeImpact", () => {
  // ── no_data ───────────────────────────────────────────────────────────────

  it("returns no_data when totalPossible is 0", () => {
    const result = calcGradeImpact({ targetPct: 83, totalEarned: 0, totalPossible: 0, ungradedPoints: 0 });
    expect(result.status).toBe("no_data");
  });

  it("returns no_data when totalPossible is negative", () => {
    const result = calcGradeImpact({ targetPct: 83, totalEarned: 0, totalPossible: -50, ungradedPoints: 0 });
    expect(result.status).toBe("no_data");
  });

  it("returns no_data when totalPossible is NaN", () => {
    const result = calcGradeImpact({ targetPct: 83, totalEarned: 0, totalPossible: NaN, ungradedPoints: 0 });
    expect(result.status).toBe("no_data");
  });

  it("returns no_data when totalPossible is Infinity", () => {
    const result = calcGradeImpact({ targetPct: 83, totalEarned: 0, totalPossible: Infinity, ungradedPoints: 0 });
    expect(result.status).toBe("no_data");
  });

  // ── secured ───────────────────────────────────────────────────────────────

  it("returns secured when current score already meets target exactly", () => {
    // 83/100 = 83% — exactly B threshold
    const result = calcGradeImpact({ targetPct: 83, totalEarned: 83, totalPossible: 100, ungradedPoints: 0 });
    expect(result.status).toBe("secured");
    if (result.status === "secured") expect(result.currentPct).toBeCloseTo(83);
  });

  it("returns secured when current score exceeds target", () => {
    const result = calcGradeImpact({ targetPct: 83, totalEarned: 950, totalPossible: 1000, ungradedPoints: 200 });
    expect(result.status).toBe("secured");
    if (result.status === "secured") expect(result.currentPct).toBeCloseTo(95);
  });

  it("returns secured with correct currentPct", () => {
    const result = calcGradeImpact({ targetPct: 70, totalEarned: 750, totalPossible: 1000, ungradedPoints: 100 });
    expect(result.status).toBe("secured");
    if (result.status === "secured") expect(result.currentPct).toBeCloseTo(75);
  });

  // ── impossible — no remaining work ────────────────────────────────────────

  it("returns impossible when no ungraded points remain and target not met", () => {
    const result = calcGradeImpact({ targetPct: 90, totalEarned: 80, totalPossible: 100, ungradedPoints: 0 });
    expect(result.status).toBe("impossible");
    if (result.status === "impossible") expect(result.bestPossiblePct).toBeCloseTo(80);
  });

  // ── impossible — perfect score still falls short ──────────────────────────

  it("returns impossible when even a perfect remaining score is insufficient", () => {
    // 200/1000 earned, 300 ungraded — best possible = 500/1000 = 50%, target is 93%
    const result = calcGradeImpact({ targetPct: 93, totalEarned: 200, totalPossible: 1000, ungradedPoints: 300 });
    expect(result.status).toBe("impossible");
    if (result.status === "impossible") expect(result.bestPossiblePct).toBeCloseTo(50);
  });

  it("impossible bestPossiblePct is based on totalPossible, not just ungraded", () => {
    // 100 earned, 100 ungraded, 500 total — best = 200/500 = 40%
    const result = calcGradeImpact({ targetPct: 83, totalEarned: 100, totalPossible: 500, ungradedPoints: 100 });
    expect(result.status).toBe("impossible");
    if (result.status === "impossible") expect(result.bestPossiblePct).toBeCloseTo(40);
  });

  // ── achievable ────────────────────────────────────────────────────────────

  it("returns achievable with correct neededPoints", () => {
    // target B = 83%, totalPossible = 1000 → need 830 pts total, earned 700, ungraded 400
    // pointsNeeded = 830 - 700 = 130
    const result = calcGradeImpact({ targetPct: 83, totalEarned: 700, totalPossible: 1000, ungradedPoints: 400 });
    expect(result.status).toBe("achievable");
    if (result.status === "achievable") {
      expect(result.neededPoints).toBe(130);
      expect(result.ungradedPoints).toBe(400);
      expect(result.neededPct).toBeCloseTo(32.5);
    }
  });

  it("neededPct rounds up when fractional points needed", () => {
    // target 90%, total = 100, earned = 85, ungraded = 20
    // need 90 - 85 = 5 pts → 5/20 = 25%
    const result = calcGradeImpact({ targetPct: 90, totalEarned: 85, totalPossible: 100, ungradedPoints: 20 });
    expect(result.status).toBe("achievable");
    if (result.status === "achievable") {
      expect(result.neededPoints).toBe(5);
      expect(result.neededPct).toBeCloseTo(25);
    }
  });

  it("neededPoints is capped at ungradedPoints (cannot need more than available)", () => {
    // near-impossible but just achievable: 0 earned, 1000 total, 930 ungraded, target 93% → need exactly 930
    const result = calcGradeImpact({ targetPct: 93, totalEarned: 0, totalPossible: 1000, ungradedPoints: 930 });
    expect(result.status).toBe("achievable");
    if (result.status === "achievable") {
      expect(result.neededPoints).toBe(930);
      expect(result.neededPct).toBeCloseTo(100);
    }
  });

  it("handles fractional earned values without crashing", () => {
    const result = calcGradeImpact({ targetPct: 80, totalEarned: 67.5, totalPossible: 100, ungradedPoints: 40 });
    expect(["achievable", "secured", "impossible"]).toContain(result.status);
  });

  it("treats negative totalEarned as zero", () => {
    const result = calcGradeImpact({ targetPct: 83, totalEarned: -50, totalPossible: 100, ungradedPoints: 100 });
    // earned treated as 0, need 83 out of 100 ungraded
    expect(result.status).toBe("achievable");
    if (result.status === "achievable") {
      expect(result.neededPoints).toBe(83);
    }
  });

  it("treats NaN totalEarned as zero", () => {
    const result = calcGradeImpact({ targetPct: 80, totalEarned: NaN, totalPossible: 100, ungradedPoints: 100 });
    expect(result.status).toBe("achievable");
  });

  it("treats NaN ungradedPoints as zero", () => {
    const result = calcGradeImpact({ targetPct: 90, totalEarned: 50, totalPossible: 100, ungradedPoints: NaN });
    // ungraded = 0, cannot achieve 90% with only 50 earned
    expect(result.status).toBe("impossible");
  });

  it("works correctly for an F target (0%) — always secured", () => {
    const result = calcGradeImpact({ targetPct: 0, totalEarned: 0, totalPossible: 100, ungradedPoints: 100 });
    expect(result.status).toBe("secured");
  });

  it("works correctly for an A target (93%) — achievable if close", () => {
    // 900/1000 = 90%, 200 ungraded — can still reach 93%, so achievable
    const result = calcGradeImpact({ targetPct: 93, totalEarned: 900, totalPossible: 1000, ungradedPoints: 200 });
    expect(result.status).toBe("achievable");
    if (result.status === "achievable") {
      expect(result.neededPoints).toBe(30); // 930 - 900 = 30
      expect(result.ungradedPoints).toBe(200);
    }
  });
});

// ─── fmtPts ───────────────────────────────────────────────────────────────────

describe("fmtPts", () => {
  it("formats whole numbers without a decimal", () => {
    expect(fmtPts(100)).toBe("100");
    expect(fmtPts(0)).toBe("0");
    expect(fmtPts(83)).toBe("83");
  });

  it("formats non-integers with one decimal place", () => {
    expect(fmtPts(83.5)).toBe("83.5");
    expect(fmtPts(0.1)).toBe("0.1");
  });

  it("formats non-whole numbers to one decimal place", () => {
    // fmtPts always uses one decimal for non-integers
    expect(fmtPts(83.12)).toBe("83.1");
    expect(fmtPts(83.99)).toBe("84.0"); // toFixed rounding
  });
});

// ─── fmtPct ───────────────────────────────────────────────────────────────────

describe("fmtPct", () => {
  it("always includes one decimal and a % sign", () => {
    expect(fmtPct(100)).toBe("100.0%");
    expect(fmtPct(0)).toBe("0.0%");
    expect(fmtPct(83.333)).toBe("83.3%");
    expect(fmtPct(58)).toBe("58.0%");
  });
});

// ─── GRADE_THRESHOLDS ─────────────────────────────────────────────────────────

describe("GRADE_THRESHOLDS", () => {
  it("is sorted in descending order by pct", () => {
    for (let i = 1; i < GRADE_THRESHOLDS.length; i++) {
      expect(GRADE_THRESHOLDS[i].pct).toBeLessThanOrEqual(GRADE_THRESHOLDS[i - 1].pct);
    }
  });

  it("contains A at 93 and F at 0", () => {
    expect(GRADE_THRESHOLDS[0]).toEqual({ label: "A", pct: 93 });
    expect(GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1]).toEqual({ label: "F", pct: 0 });
  });
});
