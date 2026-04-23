import { useRef, useEffect, type MutableRefObject, type TouchEvent as ReactTouchEvent } from 'react';
import { levelConfig, type GameState, type Dir } from '../hooks/useMazeGame';

// t=0 deep dark red → t=1 bright orange-red
function trailColor(t: number) {
  let r, g, b;
  if (t < 0.5) {
    const u = t * 2;
    r = Math.round(107 + 113 * u);
    g = Math.round(26 + 12 * u);
    b = Math.round(26 + 12 * u);
  } else {
    const u = (t - 0.5) * 2;
    r = Math.round(220 + 35 * u);
    g = Math.round(38 + 58 * u);
    b = Math.round(38 + 10 * u);
  }
  return `rgb(${r},${g},${b})`;
}

interface MazeCanvasProps {
  gameRef: MutableRefObject<GameState>;
  move: (dir: Dir) => void;
  advance: () => void;
}

export function MazeCanvas({ gameRef, move, advance }: MazeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const applyDPR = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    applyDPR();

    const calcLayout = () => {
      const s = gameRef.current;
      const { cols } = levelConfig(s.level);
      const vw = window.innerWidth, vh = window.innerHeight;
      const cell = Math.max(6, Math.floor((Math.min(vw, vh) * 0.93) / cols));
      const offX = Math.floor((vw - cols * cell) / 2);
      const offY = Math.floor((vh - cols * cell) / 2);
      return { cols, cell, offX, offY };
    };

    let rafId = 0;
    let pulseT = 0;

    const render = (ts: number = 0) => {
      pulseT = ts * 0.003;
      const s = gameRef.current;
      if (!s.maze) return;

      const { cols, cell, offX, offY } = calcLayout();
      const W  = cols * cell, H = cols * cell;
      const vw = window.innerWidth,  vh = window.innerHeight;

      ctx.clearRect(0, 0, vw, vh);
      ctx.save();
      ctx.translate(offX, offY);

      // Maze background with drop shadow
      ctx.save();
      ctx.shadowColor   = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur    = 32;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle     = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Trail (oldest=darkest, newest=brightest)
      const visitArr = [...s.visited];
      const total    = visitArr.length;
      visitArr.forEach((key, i) => {
        const [vx, vy] = key.split(',').map(Number);
        const t = total <= 1 ? 1 : i / (total - 1);
        ctx.fillStyle = trailColor(t);
        ctx.fillRect(vx * cell, vy * cell, cell, cell);
      });

      // Walls
      const lw = Math.max(1.5, Math.min(3.5, cell * 0.085));
      ctx.strokeStyle = '#0f0f0f';
      ctx.lineWidth   = lw;
      ctx.lineCap     = 'square';
      ctx.beginPath();
      for (let y = 0; y < cols; y++) {
        for (let x = 0; x < cols; x++) {
          const o = s.maze[y][x], cx = x * cell, cy = y * cell;
          if (!o.has('n'))                { ctx.moveTo(cx,        cy);        ctx.lineTo(cx + cell, cy); }
          if (!o.has('w'))                { ctx.moveTo(cx,        cy);        ctx.lineTo(cx,        cy + cell); }
          if (y === cols - 1 && !o.has('s')) { ctx.moveTo(cx,        cy + cell); ctx.lineTo(cx + cell, cy + cell); }
          if (x === cols - 1 && !o.has('e')) { ctx.moveTo(cx + cell, cy);        ctx.lineTo(cx + cell, cy + cell); }
        }
      }
      ctx.stroke();

      // Goal 🍅
      const gfs = Math.max(10, Math.round(cell * 0.74));
      ctx.font          = `${gfs}px serif`;
      ctx.textAlign     = 'center';
      ctx.textBaseline  = 'middle';
      ctx.fillText('🍅', (cols - 1) * cell + cell / 2, (cols - 1) * cell + cell / 2);

      // Fog of war — hide unexplored cells (and the goal) beyond visibility.
      // Visited trail cells stay revealed (the player's mental map).
      const { fog } = levelConfig(s.level);
      if (fog > 0 && !s.levelSolved) {
        ctx.fillStyle = 'rgba(15,15,15,0.94)';
        for (let y = 0; y < cols; y++) {
          for (let x = 0; x < cols; x++) {
            const d = Math.max(Math.abs(x - s.px), Math.abs(y - s.py));
            if (d <= fog) continue;
            if (s.visited.has(`${x},${y}`)) continue;
            ctx.fillRect(x * cell, y * cell, cell, cell);
          }
        }
      }

      // Player dot (pulsing white circle with red ring)
      if (!s.levelSolved) {
        const pulse = 0.82 + 0.18 * Math.sin(pulseT * 2.2);
        const r     = Math.max(3, cell * 0.19) * pulse;
        const pcx   = s.px * cell + cell / 2;
        const pcy   = s.py * cell + cell / 2;
        ctx.save();
        ctx.shadowColor = 'rgba(255,255,255,0.85)';
        ctx.shadowBlur  = 10;
        ctx.fillStyle   = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.arc(pcx, pcy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(180,30,10,0.35)';
        ctx.lineWidth   = 1;
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    };

    const loop = (ts: number) => {
      render(ts);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    const onResize = () => applyDPR();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, [gameRef]);

  // Touch / swipe
  const touchStart = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e: ReactTouchEvent<HTMLCanvasElement>) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: ReactTouchEvent<HTMLCanvasElement>) => {
    if (gameRef.current.levelSolved) { advance(); return; }
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n'));
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, display: 'block' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    />
  );
}
