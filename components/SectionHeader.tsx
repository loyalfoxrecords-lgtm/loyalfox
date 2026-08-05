import Reveal from "./Reveal";

interface SectionHeaderProps {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function SectionHeader({ index, eyebrow, title, className = "", style }: SectionHeaderProps) {
  return (
    <div className={className} style={style}>
      <Reveal>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px" }}>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px", color:"var(--muted2)" }}>{index}</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px", letterSpacing:"4px", textTransform:"uppercase", color:"var(--green)" }}>{eyebrow}</span>
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(44px, 6vw, 80px)", lineHeight:0.92, letterSpacing:"1px" }}>
          {title}
        </h2>
      </Reveal>
    </div>
  );
}