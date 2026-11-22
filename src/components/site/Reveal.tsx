"use client";
import { useEffect, useRef } from "react";

/** Fades children up when they scroll into view. Disabled by prefers-reduced-motion in CSS. */
export function Reveal({ children, className = "", as: Tag = "div", delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("is-visible");
            io.disconnect();
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </Tag>
  );
}
