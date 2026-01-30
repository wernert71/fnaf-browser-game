# Five Nights at Freddy's - Browser Game

A full-featured FNAF browser game with 3D free roam, multiplayer, achievements, and more!

## Project Structure

```
fnaf-game/
├── frontend/           # TypeScript + Vite frontend
│   ├── src/
│   │   ├── core/       # Core systems (EventBus, AudioManager)
│   │   ├── game/       # Night mode gameplay
│   │   ├── freeroam/   # 3D exploration mode
│   │   ├── features/   # Achievements, collectibles, etc.
│   │   ├── api/        # Backend API client
│   │   └── types/      # TypeScript type definitions
│   └── public/         # Static assets
├── backend/            # Rust + Axum backend
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── models/     # Database models
│   │   ├── services/   # Business logic
│   │   └── websocket/  # Multiplayer WebSocket
│   └── migrations/     # PostgreSQL migrations
├── game.js             # Original game (being migrated)
├── freeroam3d.js       # Original 3D engine (being migrated)
└── index.html          # Original entry point
```

## Quick Start

### Development (Frontend only - uses original JS files)

1. Open `index.html` in a browser
2. Or use a local server: `npx serve .`

### Full Stack Development

1. **Start PostgreSQL:**
   ```bash
   docker-compose up -d postgres
   ```

2. **Run Backend:**
   ```bash
   cd backend
   cp .env.example .env
   cargo run
   ```

3. **Run Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open http://localhost:5173

## Features

### Implemented
- Classic night survival mode (Nights 1-5)
- 3D free roam exploration
- Survival mode with AI animatronics
- Local multiplayer (co-op, versus)
- Online multiplayer (PeerJS)

### Coming Soon
- Achievements system
- Collectible pizza slices
- Power-ups
- Photo mode
- Jukebox with unlockable tracks
- Office decorations
- Animatronic skins
- Mini-games
- Secret nights (6 & 7)
- Easy mode
- Star rating system
- Phone Guy messages
- Global leaderboards
- Daily challenges
- User accounts & persistence

## Tech Stack

- **Frontend:** TypeScript, Three.js, Vite
- **Backend:** Rust, Axum, SQLx
- **Database:** PostgreSQL
- **Multiplayer:** WebSocket (server-authoritative)

## Controls

### Night Mode
- Click doors/lights to toggle
- Click camera button to open cameras
- Click camera feeds to switch views

### Free Roam / Survival
- **WASD/Arrows** - Move
- **Mouse** - Look around (click to lock cursor)
- **Shift** - Run
- **C** - Hide/Crouch
- **G** - Flashlight
- **E/F** - Light switch
- **ESC** - Exit to menu

## License

Educational project - FNAF is property of Scott Cawthon
