# Naval Grid Wars - Battleship Game

A production-quality, real-time multiplayer Battleship game built with React, FastAPI, and MongoDB.

## Features

- **2-Player Battleship**: Classic game on a 5×5 grid with 3 ships (4-cell, 3-cell, 2-cell)
- **Real-time Gameplay**: Turn-based combat with live updates (2-second polling)
- **Authentication System**: Admin and user accounts with JWT-based sessions
- **Admin Dashboard**: Create/manage users, monitor all games
- **Drag-and-Drop Ship Placement**: Intuitive UI for placing ships horizontally or vertically
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Predefined Avatars**: 6 robot-themed avatars for players
- **Game Lobby**: View and join available games
- **Win Detection**: Automatic game-over when all ships are sunk
- **Surrender Option**: Players can forfeit during gameplay

## Technology Stack

### Backend
- **FastAPI** (Python 3.11+) - Modern async API framework
- **MongoDB** - Document database for persistence
- **Motor** - Async MongoDB driver
- **Passlib/Bcrypt** - Secure password hashing
- **Pydantic** - Data validation

### Frontend
- **React 19** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Accessible component library
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

## Project Structure

```
/app/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/             # Page components
│   │   │   ├── Login.js
│   │   │   ├── AdminLogin.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── Lobby.js
│   │   │   └── Game.js
│   │   ├── components/        # Reusable components
│   │   │   ├── GameBoard.js
│   │   │   ├── ShipPlacement.js
│   │   │   └── ui/            # Shadcn components
│   │   ├── context/
│   │   │   └── AuthContext.js # Authentication state
│   │   ├── utils/
│   │   │   ├── api.js         # API client with interceptors
│   │   │   └── avatars.js     # Avatar utilities
│   │   ├── App.js
│   │   └── App.css
│   ├── package.json           # Node dependencies
│   └── .env                   # Frontend environment variables
└── tests/
    ├── test_game_logic.py     # Unit tests for game rules
    └── test_api.py            # Integration tests for API
```

## Installation & Local Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **Yarn**
- **MongoDB** (local or cloud instance)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd app
```

### Step 2: Backend Setup
```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and set:
# - MONGO_URL (your MongoDB connection string)
# - ADMIN_USERNAME and ADMIN_PASSWORD (for demo)
```

### Step 3: Frontend Setup
```bash
cd ../frontend

# Install dependencies
yarn install

# Configure environment variables
cp .env.example .env
# Edit .env and set:
# - REACT_APP_BACKEND_URL (e.g., http://localhost:8001)
```

### Step 4: Run Locally

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

Open http://localhost:3000 in your browser.

## Environment Variables

### Backend (.env)
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="battleship_db"
CORS_ORIGINS="*"
ADMIN_USERNAME="admin_demo"
ADMIN_PASSWORD="Admin@123"
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Running Tests

### Unit Tests (Game Logic)
```bash
cd tests
pytest test_game_logic.py -v
```

### Integration Tests (API)
```bash
cd tests
pytest test_api.py -v
```

### Run All Tests
```bash
pytest tests/ -v
```

## How to Play

### 1. Admin Setup
1. Navigate to `/admin/login`
2. Login with credentials (default: `admin_demo` / `Admin@123`)
3. Create user accounts from the admin dashboard

### 2. User Login
1. Navigate to `/login`
2. Login with credentials created by admin

### 3. Create/Join Game
1. From the lobby, click "Create New Game"
2. Place your 3 ships on the 5×5 grid:
   - Battleship (4 cells)
   - Cruiser (3 cells)
   - Destroyer (2 cells)
3. Use the "Rotate" button to switch between horizontal/vertical
4. Click "Start Game" to create the game

### 4. Gameplay
1. Wait for an opponent to join OR join an available game
2. Take turns firing at the opponent's grid
3. Hit all enemy ships to win!
4. Use "Surrender" button to forfeit

## Deployment Options

### Option 1: Vercel (Frontend) + MongoDB Atlas (Free)

**Backend Deployment:**
1. Deploy backend to **Render** or **Railway**:
   - Connect GitHub repository
   - Set environment variables
   - Deploy from `backend/` directory
   - Copy the deployed backend URL

2. **MongoDB Atlas Setup:**
   - Create free cluster at https://cloud.mongodb.com
   - Get connection string
   - Add to backend environment variables

**Frontend Deployment:**
1. Deploy to **Vercel**:
   ```bash
   cd frontend
   vercel --prod
   ```
2. Set environment variable `REACT_APP_BACKEND_URL` to your backend URL

### Option 2: Full Stack on Render/Railway
1. Create two services: one for backend, one for frontend
2. Link MongoDB Atlas database
3. Configure environment variables
4. Deploy!

### Option 3: Docker Deployment
```bash
# Build images
docker build -t battleship-backend ./backend
docker build -t battleship-frontend ./frontend

# Run containers
docker-compose up -d
```

## Database Schema

### Collections

**users**
```json
{
  "id": "uuid",
  "username": "string",
  "password_hash": "string",
  "avatar": 0-5,
  "role": "user|admin",
  "created_at": "ISO date"
}
```

**games**
```json
{
  "id": "uuid",
  "creator_id": "uuid",
  "creator_username": "string",
  "creator_avatar": 0-5,
  "opponent_id": "uuid|null",
  "opponent_username": "string|null",
  "opponent_avatar": 0-5,
  "state": "waiting|in_progress|finished",
  "current_turn": "uuid|null",
  "winner_id": "uuid|null",
  "created_at": "ISO date"
}
```

**ships**
```json
{
  "game_id": "uuid",
  "player_id": "uuid",
  "ships": [
    {
      "size": 4,
      "cells": [[0,0], [0,1], [0,2], [0,3]],
      "hits": [[0,1]],
      "sunk": false
    }
  ]
}
```

**moves**
```json
{
  "id": "uuid",
  "game_id": "uuid",
  "player_id": "uuid",
  "x": 0-4,
  "y": 0-4,
  "result": "hit|miss|sunk",
  "timestamp": "ISO date"
}
```

**sessions**
```json
{
  "token": "uuid",
  "user_id": "uuid",
  "created_at": "ISO date"
}
```

## Security Considerations

### Before Production:

1. **Change Admin Credentials**: Update `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
2. **Use Proper JWT**: Replace simple token system with proper JWT (PyJWT)
3. **CORS Configuration**: Set specific origins instead of `*`
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **HTTPS**: Use HTTPS in production
6. **MongoDB Security**: Enable authentication and use connection string with credentials
7. **Environment Variables**: Never commit `.env` files
8. **Session Expiry**: Implement token expiration (currently sessions don't expire)

## Known Limitations

- **Real-time**: Uses polling (2s interval) instead of WebSockets for simplicity
- **Reconnection**: No automatic reconnection on disconnect
- **Game History**: Finished games are not archived
- **Rematch**: No rematch functionality (create new game instead)
- **Chat**: Not implemented (design includes space for it)
- **Mobile**: Drag-and-drop on mobile uses click-to-place fallback

## Future Enhancements

- [ ] WebSocket integration for true real-time updates
- [ ] Game history and statistics
- [ ] Rematch functionality
- [ ] In-game chat
- [ ] Sound effects and animations
- [ ] Spectator mode
- [ ] Tournament brackets
- [ ] AI opponent (single-player mode)
- [ ] Custom grid sizes
- [ ] Power-ups and special abilities

## Troubleshooting

### Backend won't start
- Check MongoDB is running and accessible
- Verify `MONGO_URL` in `.env`
- Check port 8001 is not in use

### Frontend can't connect to backend
- Verify `REACT_APP_BACKEND_URL` in frontend `.env`
- Check CORS settings in backend
- Ensure backend is running

### Ships won't place
- Make sure ships don't overlap
- Keep ships within 5×5 grid bounds
- Ships must be contiguous (no gaps)

### Game state not updating
- Check browser console for errors
- Verify polling is working (Network tab)
- Refresh the page

## License

MIT License - See LICENSE file for details

## Credits

Built with ❤️ using FastAPI, React, and MongoDB.

Avatars provided by DiceBear (https://dicebear.com).
