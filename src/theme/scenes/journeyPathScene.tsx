const MAX_WAYPOINT = 5;
const WAYPOINTS = [
  { x: 30, y: 58 },
  { x: 115, y: 34 },
  { x: 200, y: 58 },
  { x: 285, y: 34 },
  { x: 370, y: 58 },
] as const;

export interface JourneyPathSceneProps {
  /** Number of missions resolved so far (0-5); the traveling-party marker sits at this waypoint. */
  readonly resolvedMissionCount: number;
}

/** Five-waypoint ink-brush journey path across the Main Game Board, advancing after each mission resolves. */
export function JourneyPathScene({ resolvedMissionCount }: JourneyPathSceneProps) {
  const waypointIndex = Math.min(Math.max(resolvedMissionCount, 0), MAX_WAYPOINT);
  const traveler = WAYPOINTS[Math.min(waypointIndex, MAX_WAYPOINT - 1)]!;

  return (
    <div className="ink-scene ink-scene--journey" data-testid="journey-path-scene" data-waypoint={waypointIndex}>
      <svg viewBox="0 0 400 90" role="img" aria-label="Journey path across five mountain waypoints">
        <path
          d="M20,58 Q70,20 115,34 T200,58 T285,34 T380,58"
          fill="none"
          stroke="var(--ink-black)"
          strokeWidth="2"
          strokeDasharray="7 7"
          opacity="0.45"
        />
        {WAYPOINTS.map((point, i) => (
          <circle
            key={point.x}
            cx={point.x}
            cy={point.y}
            r="9"
            fill={i < waypointIndex ? "var(--imperial-gold)" : "var(--rice-paper)"}
            stroke="var(--indigo)"
            strokeWidth="2"
          />
        ))}
        <path
          className="ink-scene__traveler"
          d={`M${traveler.x},${traveler.y - 22} l7,12 l-14,0 Z`}
          fill="var(--vermillion)"
        />
      </svg>
    </div>
  );
}

