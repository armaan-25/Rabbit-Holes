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
      viewBox="0 0 30 42"
      aria-hidden="true"
      className={`inline-block ${className}`}
      fill="none"
    >
      <g fill="currentColor">
        <ellipse cx="11" cy="12.5" rx="3" ry="9.5" transform="rotate(-15 11 12.5)" />
        <ellipse cx="19" cy="12.5" rx="3" ry="9.5" transform="rotate(15 19 12.5)" />
      </g>
      <circle cx="15" cy="29.5" r="9.5" stroke="currentColor" strokeWidth="3.8" />
    </svg>
  );
}

/** Pure-text "Rabbit Holes" wordmark with the bunny standing in for the "o". */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`rh-display rh-ink inline-flex items-baseline whitespace-nowrap font-semibold leading-none ${className}`}>
      <span>Rabbit&nbsp;H<BunnyO />les</span>
    </span>
  );
}
