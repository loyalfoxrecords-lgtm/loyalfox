"use client";
import { useEffect, useRef } from "react";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = 0, my = 0;
    let rx = 0, ry = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      rx = lerp(rx, mx, 0.12);
      ry = lerp(ry, my, 0.12);
      ring.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;
      requestAnimationFrame(animate);
    };
    animate();

    const onEnter = () => {
      dot.style.opacity = "0";
      ring.style.width = "48px";
      ring.style.height = "48px";
      ring.style.borderColor = "var(--green)";
      ring.style.background = "rgba(57,255,20,0.06)";
    };
    const onLeave = () => {
      dot.style.opacity = "1";
      ring.style.width = "36px";
      ring.style.height = "36px";
      ring.style.borderColor = "rgba(57,255,20,0.5)";
      ring.style.background = "transparent";
    };

    document.addEventListener("mousemove", onMove);
    document.querySelectorAll("a, button, [data-cursor]").forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      document.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[9999] transition-opacity duration-200 hidden md:block"
        style={{ background: "var(--green)", boxShadow: "0 0 8px var(--green)" }}
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-9 h-9 rounded-full pointer-events-none z-[9998] hidden md:block"
        style={{
          border: "1px solid rgba(57,255,20,0.5)",
          transition: "width .3s, height .3s, border-color .3s, background .3s",
        }}
      />
    </>
  );
}
