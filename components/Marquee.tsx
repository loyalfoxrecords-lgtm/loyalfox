"use client";

const items = [
  "House", "·", "Deep House", "·", "Techno", "·",
  "Ambient", "·", "Electronic", "·", "LoyalFox Records", "·",
  "Est. 2025", "·", "España", "·",
];

export default function Marquee() {
  const doubled = [...items, ...items];

  return (
    <div style={{ overflow:"hidden", background:"#a8e63d",
      padding:"14px 0", borderTop:"none" }}>
      <div style={{ display:"flex", animation:"marquee 20s linear infinite",
        whiteSpace:"nowrap" }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ fontFamily:"var(--font-display)",
            fontSize:"16px", letterSpacing:"3px",
            textTransform:"uppercase", color:"#080808",
            padding:"0 24px", flexShrink:0 }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}