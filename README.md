# 🧩 Maze Toys

A minimalist, daily procedural maze game built for exploration and speedrunning. Master complex algorithms, navigate through the fog of war, and build your daily streak.

![Maze Toys Preview](https://via.placeholder.com/1200x600/ece9e3/222222?text=Maze+Toys+Minimalist+Game)

## ✨ Features

- **Procedural Generation**: Every maze is unique, generated using seeded mathematical entropy.
  - **DFS (Recursive Backtracker)**: Creates long, winding corridors with few branches.
  - **Prim's Algorithm**: Generates short, dense branches for maximum complexity.
  - **Braid Mazes**: Dead-ends are algorithmically removed to create loops and multiple paths.
- **Adaptive Difficulty**:
  - **Level Scaling**: Grid sizes grow from 10x10 to massive complexes.
  - **Fog of War**: Vision limits kick in at higher levels, requiring memory and spatial awareness.
- **Speedrunning Tools**:
  - **Integrated HUD**: Real-time move tracking and millisecond-accurate timer.
  - **Daily Streaks**: Progress is saved via LocalStorage to track daily solve streaks.
- **Immersive Feedback**:
  - **Procedural Audio**: Real-time sound synthesis using the Web Audio API for movement, wall collisions, and victories.
  - **Smooth Animations**: Pop, fade, and slide transitions for a cohesive "toy" feel.
- **Universal Controls**: Support for Arrows, WASD, and HJKL (Vim-style) movement.

## 🕹️ Controls

| Task | Keys |
| :--- | :--- |
| **Move** | `Arrows`, `WASD`, or `HJKL` |
| **Advance** | `Enter`, `Space`, or any `Move` key (after solving) |
| **Reset Level** | Click the reset icon in HUD |

## 🛠️ Technical Stack

- **Framework**: [React 18](https://reactjs.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Language**: [TypeScript 6](https://www.typescriptlang.org/)
- **Rendering**: HTML5 Canvas API for high-performance maze visualization.
- **Audio**: Web Audio API (Square/Sine/Sawtooth oscillators).
- **Persistence**: Browser LocalStorage for stats and progress.

## 🚀 Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Sourabh10122002/maze.git
   cd maze-toys
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```

### Scripts

- `npm run dev`: Start Vite development server.
- `npm run build`: Build for production (includes Typecheck).
- `npm run typecheck`: Run TypeScript compiler check.
- `npm run preview`: Preview the production build locally.

---

Built with ❤️ by Sourabh.
