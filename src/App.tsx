import { useEffect } from 'react';
import { useMazeGame, type Dir } from './hooks/useMazeGame';
import { MazeCanvas } from './components/MazeCanvas';
import { LevelBadge } from './components/LevelBadge';
import { HUD } from './components/HUD';
import { WinBanner } from './components/WinBanner';

const KEY_MAP: Record<string, Dir> = {
  ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'w', ArrowRight: 'e',
  w: 'n',       s: 's',         a: 'w',          d: 'e',
  k: 'n',       j: 's',         h: 'w',          l: 'e',
};

const ADVANCE_KEYS = new Set<string>([' ', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export function App() {
  const { display, gameRef, move, reset, advance } = useMazeGame();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Use ref so we never read stale state inside this closure
      if (gameRef.current.levelSolved) {
        if (ADVANCE_KEYS.has(e.key)) { e.preventDefault(); advance(); }
        return;
      }
      if (KEY_MAP[e.key]) { e.preventDefault(); move(KEY_MAP[e.key]); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [gameRef, move, advance]);

  return (
    <>
      <MazeCanvas gameRef={gameRef} move={move} advance={advance} />
      <LevelBadge level={display.level} cols={display.cols} />
      <HUD display={display} onReset={reset} />
      <WinBanner display={display} onAdvance={advance} />
    </>
  );
}
