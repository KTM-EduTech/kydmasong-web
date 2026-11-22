"use client";
import { useRef, useState } from "react";

/** Accessible before/after slider: drag, click, or use the keyboard (range input). */
export function ImageCompare({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  beforeLabel,
  afterLabel,
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={box}
      className="relative aspect-[4/5] w-full select-none overflow-hidden rounded-[2rem] bg-navy shadow-2xl shadow-navy/25 sm:aspect-square"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => e.buttons === 1 && move(e.clientX)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={afterSrc} alt={afterAlt} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beforeSrc} alt={beforeAlt} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      </div>
      {beforeLabel && (
        <span className="absolute left-4 top-4 rounded-full bg-navy/80 px-3 py-1 text-sm font-medium text-white backdrop-blur">
          {beforeLabel}
        </span>
      )}
      {afterLabel && (
        <span className="absolute right-4 top-4 rounded-full bg-gold px-3 py-1 text-sm font-semibold text-navy">{afterLabel}</span>
      )}
      <div className="pointer-events-none absolute inset-y-0 w-1 -translate-x-1/2 bg-gold" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 left-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-gold bg-navy text-gold shadow-lg">
          <span aria-hidden className="text-lg font-bold">⇆</span>
        </div>
      </div>
      <label className="sr-only" htmlFor="compare-range">
        Compare {beforeLabel ?? "before"} and {afterLabel ?? "after"}
      </label>
      <input
        id="compare-range"
        type="range"
        min={0}
        max={100}
        value={Math.round(pos)}
        onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-x-0 bottom-0 h-10 w-full cursor-ew-resize opacity-0 focus-visible:opacity-100"
      />
    </div>
  );
}
