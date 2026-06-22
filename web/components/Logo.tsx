/** The "o" in "Holes", drawn as a bunny: an open ring (reads as the letter o)
 *  with two ears. Uses currentColor so it inherits the text colour in any theme. */
export function BunnyO({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 42"
      aria-hidden="true"
      className={`inline-block ${className}`}
      style={{ height: "1.02em", width: "0.72em", verticalAlign: "-0.14em", margin: "0 0.015em" }}
    >
      {/* ears */}
      <g fill="currentColor">
        <ellipse cx="11" cy="12.5" rx="3" ry="9.5" transform="rotate(-15 11 12.5)" />
        <ellipse cx="19" cy="12.5" rx="3" ry="9.5" transform="rotate(15 19 12.5)" />
      </g>
      {/* head — an open ring so it still reads as the letter o */}
      <circle cx="15" cy="29.5" r="9.5" fill="none" stroke="currentColor" strokeWidth="3.8" />
    </svg>
  );
}

export function RabbitEars({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`inline-block ${className}`}
      fill="none"
    >
      <ellipse cx="9" cy="10.2" rx="2.2" ry="6.8" fill="currentColor" transform="rotate(-17 9 10.2)" />
      <ellipse cx="15" cy="10.2" rx="2.2" ry="6.8" fill="currentColor" transform="rotate(17 15 10.2)" />
      <path d="M6.8 18.2c1.2-2.2 2.9-3.2 5.2-3.2s4 1 5.2 3.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Pure-text "Rabbit Holes" wordmark with the bunny standing in for the "o". */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`rh-display font-semibold leading-none text-[#2a2018] ${className}`}>
      Rabbit&nbsp;H<BunnyO />les
    </span>
  );
}
