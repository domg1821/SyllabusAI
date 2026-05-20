import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SyllabusAI — AI Study Planner for College Students";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6d28d9 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: 52, height: 52, background: "rgba(255,255,255,0.2)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 28 }}>📚</span>
          </div>
          <span style={{ color: "white", fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" }}>SyllabusAI</span>
        </div>

        {/* Middle: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 22, fontWeight: 500, background: "rgba(255,255,255,0.15)", borderRadius: 100, padding: "8px 20px", width: "fit-content" }}>
            ⚡ AI-Powered Study Assistant
          </div>
          <div style={{ color: "white", fontSize: 64, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-2px", maxWidth: 900 }}>
            Turn any syllabus into a study plan in seconds.
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 26, fontWeight: 400, lineHeight: 1.4 }}>
            Deadlines · Practice tests · Flashcards · AI Tutor
          </div>
        </div>

        {/* Bottom: stats */}
        <div style={{ display: "flex", gap: "48px" }}>
          {[["2,000+", "students"], ["4.9★", "rating"], ["Free", "to start"]].map(([val, label]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ color: "white", fontSize: 32, fontWeight: 800 }}>{val}</span>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 16 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
