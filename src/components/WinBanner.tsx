import { useEffect, useRef } from 'react';
import { levelSize, type Display } from '../hooks/useMazeGame';

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

// Scanline overlay CSS injected once
const SCANLINE_STYLE = `
.banner-scanline::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px, transparent 3px,
    rgba(0,0,0,0.018) 3px, rgba(0,0,0,0.018) 4px
  );
  pointer-events: none;
  border-radius: 0;
  z-index: 1;
}
`;

interface WinBannerProps { display: Display; onAdvance: () => void; }

export function WinBanner({ display, onAdvance }: WinBannerProps) {
  const { level, moveCount, timerElapsed, streak, bests, levelSolved } = display;

  // Inject scanline style once
  useEffect(() => {
    if (document.getElementById('scanline-style')) return;
    const style = document.createElement('style');
    style.id = 'scanline-style';
    style.textContent = SCANLINE_STYLE;
    document.head.appendChild(style);
  }, []);

  // Focus the Next button on show for keyboard accessibility
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (levelSolved && btnRef.current) {
      setTimeout(() => btnRef.current?.focus(), 400);
    }
  }, [levelSolved]);

  if (!levelSolved) return null;

  const isNewBest  = bests[level] === timerElapsed;
  const nextCols   = levelSize(level + 1);

  return (
    <div
      className="banner-scanline"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(240,237,231,0.97)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        textAlign: 'center',
        fontFamily: "'Space Mono', monospace",
        animation: 'bannerIn 0.25s ease both',
      }}
      onClick={onAdvance}
      role="dialog"
      aria-modal="true"
      aria-label={`Level ${level} complete`}
    >
      {/* Tomato mascot */}
      <div
        style={{
          fontSize: 72,
          lineHeight: 1,
          filter: 'drop-shadow(0 4px 12px rgba(200,50,10,0.30))',
          animation: 'pop 0.4s cubic-bezier(.36,1.6,.5,1) both',
          position: 'relative',
          zIndex: 2,
        }}
        aria-hidden="true"
      >
        🍅
      </div>

      {/* COMPLETE label */}
      <div
        style={{
          fontSize: 11,
          letterSpacing: 4,
          color: 'rgba(0,0,0,0.35)',
          marginBottom: -8,
          animation: 'fadeUp 0.5s 0.10s both',
          position: 'relative',
          zIndex: 2,
        }}
      >
        COMPLETE
      </div>

      {/* Level title */}
      <h1
        style={{
          fontSize: 52,
          fontWeight: 700,
          letterSpacing: 5,
          color: '#cc2200',
          animation: 'fadeUp 0.5s 0.15s both',
          position: 'relative',
          zIndex: 2,
        }}
      >
        LEVEL {level}
      </h1>

      {/* Stats line */}
      <p
        style={{
          fontSize: 12,
          color: 'rgba(0,0,0,0.45)',
          letterSpacing: 1,
          animation: 'fadeUp 0.5s 0.20s both',
          position: 'relative',
          zIndex: 2,
        }}
      >
        Time <strong style={{ color: '#111' }}>{fmt(timerElapsed)}</strong>
        {'  ·  '}
        Moves <strong style={{ color: '#111' }}>{moveCount}</strong>
        {'  ·  '}
        Streak <strong style={{ color: '#111' }}>{streak}</strong>
      </p>

      {/* Best / next info */}
      <p
        style={{
          fontSize: 10,
          color: 'rgba(0,0,0,0.30)',
          letterSpacing: 1,
          animation: 'fadeUp 0.5s 0.25s both',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {isNewBest
          ? `New best! 🔥  ·  Next: Level ${level + 1} — ${nextCols}×${nextCols} maze`
          : `Best: ${fmt(bests[level])}  ·  Next: ${nextCols}×${nextCols} maze`}
      </p>

      {/* Next button */}
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); onAdvance(); }}
        style={{
          marginTop: 6,
          padding: '13px 44px',
          fontFamily: 'inherit',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 3,
          background: '#cc2200',
          color: '#fff',
          border: 'none',
          borderRadius: 7,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(200,34,0,0.30)',
          transition: 'box-shadow 0.15s, background 0.15s, transform 0.1s',
          animation: 'fadeUp 0.5s 0.30s both',
          position: 'relative',
          zIndex: 2,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background  = '#dd2800';
          e.currentTarget.style.boxShadow   = '0 6px 28px rgba(200,34,0,0.40)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = '#cc2200';
          e.currentTarget.style.boxShadow   = '0 4px 20px rgba(200,34,0,0.30)';
          e.currentTarget.style.transform   = 'scale(1)';
        }}
        onMouseDown={e  => { e.currentTarget.style.transform = 'scale(0.97)'; }}
        onMouseUp={e    => { e.currentTarget.style.transform = 'scale(1)'; }}
        aria-label={`Continue to level ${level + 1}`}
      >
        NEXT LEVEL →
      </button>

      {/* Keyboard hint */}
      <p
        style={{
          fontSize: 9,
          color: 'rgba(0,0,0,0.20)',
          letterSpacing: 2,
          animation: 'fadeUp 0.5s 0.40s both',
          position: 'relative',
          zIndex: 2,
        }}
        aria-hidden="true"
      >
        SPACE · ENTER · TAP
      </p>
    </div>
  );
}
