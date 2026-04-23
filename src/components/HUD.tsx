import { useRef, useEffect } from 'react';
import type { Display } from '../hooks/useMazeGame';

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

// Flash a value when it changes
function useFlash(value: unknown) {
  const ref = useRef<HTMLElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value && ref.current) {
      ref.current.animate(
        [{ color: '#cc2200' }, { color: '#111' }],
        { duration: 600, easing: 'ease-out' }
      );
    }
    prev.current = value;
  }, [value]);
  return ref;
}

interface HudRowProps { label: string; value: string | number; dim?: boolean; }

function HudRow({ label, value, dim = false }: HudRowProps) {
  const valRef = useFlash(value);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '3px 0',
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        color: 'rgba(0,0,0,0.40)',
        letterSpacing: 1,
      }}
    >
      <span>{label}</span>
      <strong
        ref={valRef}
        style={{
          fontSize: dim ? 13 : 16,
          fontWeight: 700,
          color: dim ? 'rgba(0,0,0,0.45)' : '#111',
          letterSpacing: 0,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

interface HUDProps { display: Display; onReset: () => void; }

export function HUD({ display, onReset }: HUDProps) {
  const { timerElapsed, moveCount, streak, bests, level } = display;
  const bestTime = bests[level] ? fmt(bests[level]) : '—';

  return (
    <div
      style={{
        position: 'fixed',
        top: 18,
        right: 18,
        background: 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,0,0,0.10)',
        borderRadius: 10,
        padding: '16px 18px 14px',
        color: '#111',
        zIndex: 10,
        minWidth: 148,
        boxShadow: '0 2px 20px rgba(0,0,0,0.10)',
        animation: 'slideInRight 0.3s cubic-bezier(0.22,1,0.36,1) both',
        fontFamily: "'Space Mono', monospace",
      }}
      role="region"
      aria-label="Game stats"
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 3,
          color: '#cc2200',
          paddingBottom: 10,
          marginBottom: 10,
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        MAZE TOYS
      </div>

      <HudRow label="TIME"  value={fmt(timerElapsed)} />
      <HudRow label="MOVES" value={moveCount} />

      <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.08)', margin: '10px 0' }} />

      <HudRow label="STREAK" value={streak}   dim />
      <HudRow label="BEST"   value={bestTime}  dim />

      <button
        onClick={onReset}
        style={{
          width: '100%',
          padding: '7px 0',
          marginTop: 10,
          fontFamily: 'inherit',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 2,
          background: 'rgba(200,34,0,0.07)',
          color: '#cc2200',
          border: '1px solid rgba(200,34,0,0.20)',
          borderRadius: 6,
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,34,0,0.14)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,34,0,0.07)'; }}
        onMouseDown={e  => { e.currentTarget.style.background = 'rgba(200,34,0,0.22)'; }}
        onMouseUp={e    => { e.currentTarget.style.background = 'rgba(200,34,0,0.14)'; }}
        aria-label="Reset current level"
      >
        ↺  RESET
      </button>
    </div>
  );
}
