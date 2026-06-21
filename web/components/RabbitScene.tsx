"use client";

/**
 * RabbitScene — the watercolor hare hopping around its burrow on a clean white
 * canvas. Static (no animation): a soft grey hole, the rabbit at the rim, and
 * two fainter copies that trace the path it hopped around the hole.
 *
 * The artwork is loaded from /public/assets/images/rabbit-hole-hero.png.
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
      {/* soft watercolor burrow */}
      <div
        className="absolute left-1/2 top-[78%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "42%",
          height: "34%",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(70,72,80,0.55) 0%, rgba(96,99,108,0.28) 48%, rgba(120,123,132,0.06) 72%, transparent 80%)",
          filter: "blur(5px)",
        }}
      />
      <div
        className="absolute left-1/2 top-[78%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "30%",
          height: "18%",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(28,30,36,0.7) 0%, rgba(40,42,50,0.4) 55%, transparent 78%)",
          filter: "blur(3px)",
        }}
      />

      {/* the rabbit, hopping around the rim */}
      {HOPS.map((hop, i) => (
        <img
          key={`${hop.left}-${hop.top}`}
          src="/assets/images/rabbit-hole-hero.png"
          alt={i === HOPS.length - 1 ? "Watercolor rabbit at its burrow" : ""}
          aria-hidden={i !== HOPS.length - 1}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
          className="pointer-events-none absolute select-none"
          style={{
            left: `${hop.left}%`,
            top: `${hop.top}%`,
            height: `${hop.h}px`,
            opacity: hop.opacity,
            transform: `translate(-50%, -50%) rotate(${hop.rotate}deg) scaleX(${hop.flip ? -1 : 1})`,
          }}
        />
      ))}
    </div>
  );
}
