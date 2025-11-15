# Quick Start Guide - Naval Grid Wars

Get your Battleship game running in 5 minutes!

## Prerequisites

- Python 3.11+
- Node.js 18+ and Yarn
- MongoDB running locally OR MongoDB Atlas account

## Setup (3 Steps)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env if needed (default settings work for local dev)

# Start backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

✅ Backend running at http://localhost:8001

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Copy and configure environment
cp .env.example .env
# Edit .env: Set REACT_APP_BACKEND_URL=http://localhost:8001

# Start frontend
yarn start
```

✅ Frontend running at http://localhost:3000

### 3. Play the Game!

1. **Admin Login:** Navigate to http://localhost:3000/admin/login
   - Username: `admin_demo`
   - Password: `Admin@123`

2. **Create Users:** From admin dashboard, create 2 users (e.g., "player1" and "player2")

3. **Play:** 
   - Open http://localhost:3000 in one browser (login as player1)
   - Open http://localhost:3000 in incognito/another browser (login as player2)
   - Player1: Create a game
   - Player2: Join the game
   - Take turns firing at opponent's grid!

## Game Rules

- **Grid:** 5×5 battlefield
- **Ships:** Place 3 ships:
  - Battleship (4 cells)
  - Cruiser (3 cells)  
  - Destroyer (2 cells)
- **Placement:** Horizontal or vertical only, no overlaps
- **Turns:** Take turns firing at opponent's grid
- **Win:** Sink all enemy ships to win!

## Keyboard Shortcuts

- **Tab:** Navigate between inputs
- **Enter:** Submit forms
- **Escape:** Close dialogs

## Troubleshooting

**Backend won't start?**
```bash
# Check MongoDB is running
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS

# Or use MongoDB Atlas (free cloud database)
# Get connection string from https://cloud.mongodb.com
# Update MONGO_URL in backend/.env
```

**Frontend shows network errors?**
```bash
# Verify REACT_APP_BACKEND_URL in frontend/.env
cat frontend/.env

# Should be: REACT_APP_BACKEND_URL=http://localhost:8001
# Restart frontend after changing .env:
cd frontend && yarn start
```

**Ships won't place?**
- Ships must be within 5×5 grid
- No overlaps allowed
- Must be contiguous (no gaps)
- Only horizontal or vertical (no diagonal)

## Next Steps

- 📖 Read full [README.md](./README.md) for detailed documentation
- 🚀 See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- 🧪 Run tests: `cd tests && pytest -v`

## Demo Mode

Want to test without setup? The app is already deployed!

**Live Demo:** https://naval-grid-wars.preview.emergentagent.com

Admin credentials (demo only):
- Username: `admin_demo`
- Password: `Admin@123`

---

**Questions?** Check README.md or open an issue on GitHub.

**Happy battling! ⚓🎯**
