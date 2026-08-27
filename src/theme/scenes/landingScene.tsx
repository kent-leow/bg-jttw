/** Ink-wash (水墨) mountain silhouette scene with drifting clouds and a rising sun, for the Landing page. */
export function LandingScene() {
  return (
    <div className="ink-scene ink-scene--landing" data-testid="landing-scene">
      <svg viewBox="0 0 400 220" role="img" aria-label="Ink-wash mountains beneath a rising sun, with drifting clouds">
        <defs>
          <linearGradient id="landing-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--rice-paper-soft)" />
            <stop offset="100%" stopColor="var(--rice-paper)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="400" height="220" fill="url(#landing-sky)" />
        <circle cx="300" cy="72" r="34" fill="var(--vermillion)" opacity="0.85" />
        <path
          className="ink-scene__cloud ink-scene__cloud--1"
          d="M10,58 q22,-20 42,-4 q18,-16 36,2 q18,-12 30,6 q-2,16 -22,14 l-74,2 q-18,0 -12,-20 Z"
          fill="var(--rice-paper)"
        />
        <path
          className="ink-scene__cloud ink-scene__cloud--2"
          d="M180,36 q18,-16 34,-2 q16,-14 28,4 q-2,14 -18,12 l-58,1 q-14,0 -10,-14 Z"
          fill="var(--rice-paper)"
          opacity="0.9"
        />
        <path
          d="M0,190 Q60,110 110,170 Q150,120 190,175 Q230,125 270,178 Q320,130 400,185 L400,220 L0,220 Z"
          fill="var(--indigo)"
          opacity="0.35"
        />
        <path
          d="M0,205 Q50,150 100,195 Q140,160 190,200 Q240,155 300,198 Q350,165 400,202 L400,220 L0,220 Z"
          fill="var(--indigo)"
          opacity="0.6"
        />
        <path
          d="M0,220 Q40,175 90,212 Q130,180 180,214 Q230,178 290,215 Q340,182 400,216 L400,220 Z"
          fill="var(--ink-black)"
        />
      </svg>
    </div>
  );
}

