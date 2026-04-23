interface LevelBadgeProps { level: number; cols: number; }

export function LevelBadge({ level, cols }: LevelBadgeProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 18,
        left: 18,
        background: 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,0,0,0.10)',
        borderRadius: 10,
        padding: '10px 16px',
        zIndex: 10,
        boxShadow: '0 2px 20px rgba(0,0,0,0.10)',
        animation: 'slideInLeft 0.3s cubic-bezier(0.22,1,0.36,1) both',
      }}
      aria-label={`Level ${level}, ${cols} by ${cols} maze`}
    >
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          letterSpacing: 3,
          color: 'rgba(0,0,0,0.35)',
        }}
      >
        LEVEL
      </div>
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 28,
          fontWeight: 700,
          color: '#cc2200',
          lineHeight: 1.1,
          marginTop: 2,
        }}
      >
        {level}
      </div>
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          color: 'rgba(0,0,0,0.35)',
          marginTop: 2,
          letterSpacing: 0.5,
        }}
      >
        {cols} × {cols}
      </div>
    </div>
  );
}
