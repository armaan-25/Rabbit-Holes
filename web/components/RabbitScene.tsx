"use client";

import { RabbitEars } from "@/components/Logo";

/**
 * RabbitScene — a minimal rabbit-ears mark around a burrow on a clean white
 * canvas. Static and asset-free.
 */

interface Hop {
  /** position within the band, in % */
  left: number;
  top: number;
  /** height in px, rotation in deg, horizontal flip */
  h: number;
  rotate: number;
  flip?: boolean;
  opacity: number;
}

// Ordered back-to-front; the last is the "settled" rabbit at the rim.
const HOPS: Hop[] = [
  { left: 30, top: 34, h: 92, rotate: -16, flip: true, opacity: 0.22 },
  { left: 65, top: 30, h: 104, rotate: 12, opacity: 0.32 },
  { left: 49, top: 50, h: 150, rotate: -3, opacity: 1 },
];

export function RabbitScene({ className = "" }: { readonly className?: string }) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-white ${className}`}>
      {/* soft burrow */}
      <div
        className="absolute left-1/2 top-[78%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "42%",
          height: "34%",
          borderRadius: "50%",
          background: "rgba(96,99,108,0.22)",
          filter: "blur(5px)",
        }}
      />
      <div
        className="absolute left-1/2 top-[78%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "30%",
          height: "18%",
          borderRadius: "50%",
          background: "rgba(28,30,36,0.54)",
          filter: "blur(3px)",
        }}
      />

      {/* the rabbit-ears mark, hopping around the rim */}
      {HOPS.map((hop, i) => (
        <div
          key={`${hop.left}-${hop.top}`}
          aria-hidden={i !== HOPS.length - 1}
          className="pointer-events-none absolute grid select-none place-items-center rounded-full border border-[#d9cdbb] bg-white text-[#2a2018] shadow-[0_8px_24px_rgba(42,32,24,.10)]"
          style={{
            left: `${hop.left}%`,
            top: `${hop.top}%`,
            width: `${hop.h}px`,
            height: `${hop.h}px`,
            opacity: hop.opacity,
            transform: `translate(-50%, -50%) rotate(${hop.rotate}deg) scaleX(${hop.flip ? -1 : 1})`,
          }}
        >
          <RabbitEars className="h-[48%] w-[48%]" />
        </div>
      ))}
    </div>
  );
}
