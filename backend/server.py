# Main FastAPI server for Battleship game
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# ============ Models ============

class UserCreate(BaseModel):
    username: str
    password: str
    avatar: int = 0

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: str
    username: str
    avatar: int
    role: str = "user"
    created_at: str

class GameCreate(BaseModel):
    ships: List[Dict[str, Any]]  # [{size: 4, cells: [[0,0],[0,1],[0,2],[0,3]]}]

class GameJoin(BaseModel):
    ships: List[Dict[str, Any]]

class Game(BaseModel):
    id: str
    creator_id: str
    creator_username: str
    creator_avatar: int
    opponent_id: Optional[str] = None
    opponent_username: Optional[str] = None
    opponent_avatar: Optional[int] = None
    state: str  # waiting, in_progress, finished
    current_turn: Optional[str] = None
    winner_id: Optional[str] = None
    created_at: str

class MoveCreate(BaseModel):
    x: int
    y: int

class MoveResult(BaseModel):
    result: str  # hit, miss, sunk
    ship_sunk: Optional[int] = None  # ship size if sunk
    game_over: bool = False
    winner_id: Optional[str] = None

# ============ Auth Helpers ============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token and return user data"""
    token = credentials.credentials
    
    # Simple token validation - in production use proper JWT
    user_data = await db.sessions.find_one({"token": token})
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = await db.users.find_one({"id": user_data["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    """Verify user is admin"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============ Auth Routes ============

@api_router.post("/auth/admin/login")
async def admin_login(creds: UserLogin):
    """Admin login with hardcoded credentials"""
    admin_user = os.environ.get("ADMIN_USERNAME", "admin_demo")
    admin_pass = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    
    if creds.username != admin_user or creds.password != admin_pass:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    # Create or get admin user
    admin = await db.users.find_one({"username": admin_user}, {"_id": 0})
    if not admin:
        admin = {
            "id": str(uuid.uuid4()),
            "username": admin_user,
            "avatar": 0,
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin)
    
    # Create session token
    token = str(uuid.uuid4())
    await db.sessions.insert_one({
        "token": token,
        "user_id": admin["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"token": token, "user": admin}

@api_router.post("/auth/login")
async def user_login(creds: UserLogin):
    """User login"""
    user = await db.users.find_one({"username": creds.username}, {"_id": 0})
    if not user or user.get("role") == "admin":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(creds.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session token
    token = str(uuid.uuid4())
    await db.sessions.insert_one({
        "token": token,
        "user_id": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Remove password hash from response
    user_response = {k: v for k, v in user.items() if k != "password_hash"}
    
    return {"token": token, "user": user_response}

@api_router.post("/auth/logout")
async def logout(user: dict = Depends(get_current_user)):
    """Logout current user"""
    await db.sessions.delete_many({"user_id": user["id"]})
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user info"""
    user_copy = {k: v for k, v in user.items() if k != "password_hash"}
    return user_copy

# ============ Admin Routes ============

@api_router.post("/admin/users", response_model=User)
async def create_user(user_data: UserCreate, admin: dict = Depends(get_admin_user)):
    """Admin creates a new user account"""
    # Check if username exists
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user = {
        "id": str(uuid.uuid4()),
        "username": user_data.username,
        "password_hash": hash_password(user_data.password),
        "avatar": user_data.avatar,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    # Return without password hash
    return User(
        id=user["id"],
        username=user["username"],
        avatar=user["avatar"],
        role=user["role"],
        created_at=user["created_at"]
    )

@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(admin: dict = Depends(get_admin_user)):
    """Admin gets all users"""
    users = await db.users.find({"role": "user"}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Admin deletes a user"""
    result = await db.users.delete_one({"id": user_id, "role": "user"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Also delete their sessions
    await db.sessions.delete_many({"user_id": user_id})
    
    return {"message": "User deleted successfully"}

@api_router.get("/admin/games", response_model=List[Game])
async def get_all_games_admin(admin: dict = Depends(get_admin_user)):
    """Admin gets all games"""
    games = await db.games.find({}, {"_id": 0}).to_list(1000)
    return games

# ============ Game Logic Helpers ============

def validate_ships(ships: List[Dict[str, Any]]) -> bool:
    """Validate ship placement: sizes 4,3,2, no overlaps, within bounds"""
    if len(ships) != 3:
        return False
    
    sizes = sorted([s["size"] for s in ships])
    if sizes != [2, 3, 4]:
        return False
    
    occupied = set()
    for ship in ships:
        cells = ship.get("cells", [])
        if len(cells) != ship["size"]:
            return False
        
        # Check bounds and overlaps
        for cell in cells:
            x, y = cell[0], cell[1]
            if x < 0 or x > 4 or y < 0 or y > 4:
                return False
            if (x, y) in occupied:
                return False
            occupied.add((x, y))
        
        # Check contiguous (horizontal or vertical)
        if ship["size"] > 1:
            cells_sorted = sorted(cells)
            is_horizontal = all(cells_sorted[i][0] == cells_sorted[0][0] for i in range(len(cells_sorted)))
            is_vertical = all(cells_sorted[i][1] == cells_sorted[0][1] for i in range(len(cells_sorted)))
            if not (is_horizontal or is_vertical):
                return False
            
            # Check consecutive
            if is_horizontal:
                ys = sorted([c[1] for c in cells_sorted])
                if ys != list(range(ys[0], ys[0] + len(ys))):
                    return False
            else:
                xs = sorted([c[0] for c in cells_sorted])
                if xs != list(range(xs[0], xs[0] + len(xs))):
                    return False
    
    return True

async def check_move_result(game_id: str, player_id: str, x: int, y: int) -> MoveResult:
    """Check if move is hit/miss and update game state"""
    # Get opponent's ships
    game = await db.games.find_one({"id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    opponent_id = game["opponent_id"] if game["creator_id"] == player_id else game["creator_id"]
    
    ships_data = await db.ships.find_one({"game_id": game_id, "player_id": opponent_id}, {"_id": 0})
    if not ships_data:
        raise HTTPException(status_code=404, detail="Ships not found")
    
    ships = ships_data["ships"]
    
    # Check if hit
    hit_ship = None
    for ship in ships:
        if [x, y] in ship["cells"]:
            hit_ship = ship
            break
    
    result = "miss"
    ship_sunk = None
    
    if hit_ship:
        result = "hit"
        
        # Mark hit on this cell
        if "hits" not in hit_ship:
            hit_ship["hits"] = []
        hit_ship["hits"].append([x, y])
        
        # Check if ship sunk
        if len(hit_ship["hits"]) == hit_ship["size"]:
            hit_ship["sunk"] = True
            ship_sunk = hit_ship["size"]
            result = "sunk"
        
        # Update ships in DB
        await db.ships.update_one(
            {"game_id": game_id, "player_id": opponent_id},
            {"$set": {"ships": ships}}
        )
    
    # Check if all ships sunk (game over)
    all_sunk = all(ship.get("sunk", False) for ship in ships)
    game_over = all_sunk
    winner_id = player_id if game_over else None
    
    if game_over:
        await db.games.update_one(
            {"id": game_id},
            {"$set": {"state": "finished", "winner_id": winner_id}}
        )
    else:
        # Switch turn
        await db.games.update_one(
            {"id": game_id},
            {"$set": {"current_turn": opponent_id}}
        )
    
    return MoveResult(
        result=result,
        ship_sunk=ship_sunk,
        game_over=game_over,
        winner_id=winner_id
    )

# ============ Game Routes ============

@api_router.get("/games", response_model=List[Game])
async def get_games(user: dict = Depends(get_current_user)):
    """Get all games (lobby view - only waiting games)"""
    games = await db.games.find({"state": "waiting"}, {"_id": 0}).to_list(100)
    return games

@api_router.get("/games/my")
async def get_my_games(user: dict = Depends(get_current_user)):
    """Get user's active games"""
    games = await db.games.find({
        "$or": [
            {"creator_id": user["id"]},
            {"opponent_id": user["id"]}
        ],
        "state": {"$in": ["waiting", "in_progress"]}
    }, {"_id": 0}).to_list(100)
    return games

@api_router.post("/games", response_model=Game)
async def create_game(game_data: GameCreate, user: dict = Depends(get_current_user)):
    """Create a new game"""
    # Validate ships
    if not validate_ships(game_data.ships):
        raise HTTPException(status_code=400, detail="Invalid ship placement")
    
    game = {
        "id": str(uuid.uuid4()),
        "creator_id": user["id"],
        "creator_username": user["username"],
        "creator_avatar": user["avatar"],
        "opponent_id": None,
        "opponent_username": None,
        "opponent_avatar": None,
        "state": "waiting",
        "current_turn": None,
        "winner_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.games.insert_one(game)
    
    # Store ships
    ships_doc = {
        "game_id": game["id"],
        "player_id": user["id"],
        "ships": game_data.ships
    }
    await db.ships.insert_one(ships_doc)
    
    return Game(**game)

@api_router.post("/games/{game_id}/join", response_model=Game)
async def join_game(game_id: str, join_data: GameJoin, user: dict = Depends(get_current_user)):
    """Join an existing game"""
    game = await db.games.find_one({"id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if game["state"] != "waiting":
        raise HTTPException(status_code=400, detail="Game is not available")
    
    if game["creator_id"] == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot join your own game")
    
    # Validate ships
    if not validate_ships(join_data.ships):
        raise HTTPException(status_code=400, detail="Invalid ship placement")
    
    # Update game
    await db.games.update_one(
        {"id": game_id},
        {"$set": {
            "opponent_id": user["id"],
            "opponent_username": user["username"],
            "opponent_avatar": user["avatar"],
            "state": "in_progress",
            "current_turn": game["creator_id"]  # Creator goes first
        }}
    )
    
    # Store opponent ships
    ships_doc = {
        "game_id": game_id,
        "player_id": user["id"],
        "ships": join_data.ships
    }
    await db.ships.insert_one(ships_doc)
    
    # Get updated game
    updated_game = await db.games.find_one({"id": game_id}, {"_id": 0})
    return Game(**updated_game)

@api_router.get("/games/{game_id}", response_model=Game)
async def get_game(game_id: str, user: dict = Depends(get_current_user)):
    """Get game details"""
    game = await db.games.find_one({"id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Verify user is part of this game
    if game["creator_id"] != user["id"] and game.get("opponent_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this game")
    
    return Game(**game)

@api_router.get("/games/{game_id}/board")
async def get_game_board(game_id: str, user: dict = Depends(get_current_user)):
    """Get game board state for current user"""
    game = await db.games.find_one({"id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Get user's ships
    my_ships = await db.ships.find_one({"game_id": game_id, "player_id": user["id"]}, {"_id": 0})
    
    # Get all moves
    moves = await db.moves.find({"game_id": game_id}, {"_id": 0}).to_list(1000)
    
    # Separate moves by player
    my_moves = [m for m in moves if m["player_id"] == user["id"]]
    opponent_moves = [m for m in moves if m["player_id"] != user["id"]]
    
    return {
        "my_ships": my_ships["ships"] if my_ships else [],
        "my_moves": my_moves,
        "opponent_moves": opponent_moves,
        "current_turn": game.get("current_turn"),
        "state": game["state"]
    }

@api_router.post("/games/{game_id}/move", response_model=MoveResult)
async def make_move(game_id: str, move: MoveCreate, user: dict = Depends(get_current_user)):
    """Make a move (fire at opponent's grid)"""
    game = await db.games.find_one({"id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if game["state"] != "in_progress":
        raise HTTPException(status_code=400, detail="Game is not in progress")
    
    if game.get("current_turn") != user["id"]:
        raise HTTPException(status_code=400, detail="Not your turn")
    
    # Check if move already made
    existing_move = await db.moves.find_one({
        "game_id": game_id,
        "player_id": user["id"],
        "x": move.x,
        "y": move.y
    })
    if existing_move:
        raise HTTPException(status_code=400, detail="Cell already targeted")
    
    # Process move
    result = await check_move_result(game_id, user["id"], move.x, move.y)
    
    # Store move
    move_doc = {
        "id": str(uuid.uuid4()),
        "game_id": game_id,
        "player_id": user["id"],
        "x": move.x,
        "y": move.y,
        "result": result.result,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.moves.insert_one(move_doc)
    
    return result

@api_router.post("/games/{game_id}/surrender")
async def surrender_game(game_id: str, user: dict = Depends(get_current_user)):
    """Surrender the game"""
    game = await db.games.find_one({"id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if game["state"] != "in_progress":
        raise HTTPException(status_code=400, detail="Game is not in progress")
    
    # Determine winner (opponent)
    winner_id = game["opponent_id"] if game["creator_id"] == user["id"] else game["creator_id"]
    
    await db.games.update_one(
        {"id": game_id},
        {"$set": {"state": "finished", "winner_id": winner_id}}
    )
    
    return {"message": "Game surrendered", "winner_id": winner_id}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
