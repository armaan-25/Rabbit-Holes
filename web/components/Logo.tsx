/** The "o" in "Holes", drawn as a bunny: an open ring (reads as the letter o)
 *  with two ears. Uses currentColor so it inherits the text colour in any theme. */
export function BunnyO({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 48"
      aria-hidden="true"
      className={`inline-block overflow-visible ${className}`}
      style={{ height: "1.04em", width: "0.78em", verticalAlign: "-0.15em", margin: "0 0.025em" }}
    >
      <path
        d="M13.1 21.2C9.9 15.6 9.1 8.4 11.1 4.7c1.6-3 4.9 1 5.9 6.7.7 4.3.3 8.5-.7 11.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="5.2"
      />
      <path
        d="M22.9 21.2c3.2-5.6 4-12.8 2-16.5-1.6-3-4.9 1-5.9 6.7-.7 4.3-.3 8.5.7 11.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="5.2"
      />
      <circle cx="18" cy="33" r="10.5" fill="none" stroke="currentColor" strokeWidth="5.2" />
    </svg>
  );
}

export function RabbitEars({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 48"
      aria-hidden="true"
      className={`inline-block overflow-visible ${className}`}
      fill="none"
    >
      <path d="M13.1 21.2C9.9 15.6 9.1 8.4 11.1 4.7c1.6-3 4.9 1 5.9 6.7.7 4.3.3 8.5-.7 11.4" stroke="currentColor" strokeLinecap="round" strokeWidth="5.2" />
      <path d="M22.9 21.2c3.2-5.6 4-12.8 2-16.5-1.6-3-4.9 1-5.9 6.7-.7 4.3-.3 8.5.7 11.4" stroke="currentColor" strokeLinecap="round" strokeWidth="5.2" />
      <circle cx="18" cy="33" r="10.5" stroke="currentColor" strokeWidth="5.2" />
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
