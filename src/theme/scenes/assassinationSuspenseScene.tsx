/** Swirling ink-cloud suspense scene shown to non-Assassin devices during the Assassination Phase. */
export function AssassinationSuspenseScene() {
  return (
    <div className="ink-scene ink-scene--suspense" data-testid="assassination-suspense-scene">
      <svg viewBox="0 0 200 200" role="img" aria-label="Swirling ink clouds">
        <circle
          className="ink-scene__swirl ink-scene__swirl--1"
          cx="100"
          cy="100"
          r="72"
          fill="none"
          stroke="var(--indigo)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray="150 300"
          opacity="0.55"
        />
        <circle
          className="ink-scene__swirl ink-scene__swirl--2"
          cx="100"
          cy="100"
          r="48"
          fill="none"
          stroke="var(--ink-black)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="90 200"
          opacity="0.5"
        />
        <circle className="ink-scene__swirl ink-scene__swirl--3" cx="100" cy="100" r="22" fill="var(--vermillion)" opacity="0.2" />
      </svg>
    </div>
  );
}

