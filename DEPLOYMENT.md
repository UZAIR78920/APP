# Deployment Guide - Naval Grid Wars

This guide provides step-by-step instructions for deploying the Battleship game to free hosting platforms.

## Quick Start: Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (new terminal)
cd frontend
yarn install
yarn start
```

Visit http://localhost:3000

## Production Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend) + MongoDB Atlas (Recommended)

**Benefits:** Free tier, easy setup, automatic deployments, good performance

#### Step 1: MongoDB Atlas Setup (Database)

1. Go to https://cloud.mongodb.com and create a free account
2. Create a new cluster (M0 free tier)
3. Create database user with username/password
4. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/battleship_db`

#### Step 2: Render Backend Deployment

1. Go to https://render.com and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** `battleship-backend`
   - **Root Directory:** `backend`
   - **Environment:** Python 3.11
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/battleship_db
   DB_NAME=battleship_db
   CORS_ORIGINS=*
   ADMIN_USERNAME=admin_demo
   ADMIN_PASSWORD=Admin@123
   ```
6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy your backend URL: `https://your-app.onrender.com`

#### Step 3: Vercel Frontend Deployment

1. Go to https://vercel.com and sign up
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - **Build Command:** `yarn build`
   - **Output Directory:** `build`
4. Add Environment Variable:
   ```
   REACT_APP_BACKEND_URL=https://your-app.onrender.com
   ```
5. Click "Deploy"
6. Your app will be live at `https://your-app.vercel.app`

**Important:** Render free tier may spin down after 15 minutes of inactivity. First request after idle will take 30-50 seconds.

---

### Option 2: Railway (Full Stack) + MongoDB Atlas

**Benefits:** Single platform for backend and frontend, automatic HTTPS

#### Step 1: MongoDB Atlas Setup
(Same as Option 1, Step 1)

#### Step 2: Railway Deployment

1. Go to https://railway.app and sign up
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository

**Backend Service:**
1. Click "Add Service" → "Web Service"
2. Select `backend` folder
3. Add Environment Variables (same as Render above)
4. Railway will detect Python and deploy automatically
5. Copy backend URL from settings

**Frontend Service:**
1. Click "Add Service" → "Web Service"  
2. Select `frontend` folder
3. Add Environment Variable:
   ```
   REACT_APP_BACKEND_URL=https://your-backend.up.railway.app
   ```
4. Railway will detect Node.js and deploy

---

### Option 3: Heroku (Alternative)

#### Backend:
```bash
cd backend
# Create Procfile
echo "web: uvicorn server:app --host 0.0.0.0 --port \$PORT" > Procfile

# Create runtime.txt
echo "python-3.11.0" > runtime.txt

# Deploy
heroku login
heroku create battleship-backend
heroku config:set MONGO_URL="your-mongodb-url"
heroku config:set DB_NAME="battleship_db"
git push heroku main
```

#### Frontend:
```bash
cd frontend
# Add build script to package.json (already present)

# Deploy
vercel --prod
# Set REACT_APP_BACKEND_URL to your Heroku backend URL
```

---

### Option 4: Docker Deployment

Create `docker-compose.yml` in root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=battleship_db
      - ADMIN_USERNAME=admin_demo
      - ADMIN_PASSWORD=Admin@123
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001
    depends_on:
      - backend

volumes:
  mongo_data:
```

Create `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build
RUN yarn global add serve
CMD ["serve", "-s", "build", "-l", "3000"]
```

Deploy:
```bash
docker-compose up -d
```

---

## Environment Variables Reference

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017  # Or MongoDB Atlas connection string
DB_NAME=battleship_db
CORS_ORIGINS=*  # In production: https://your-frontend-url.com
ADMIN_USERNAME=admin_demo
ADMIN_PASSWORD=Admin@123  # Change in production!
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001  # Or your production backend URL
```

---

## Post-Deployment Checklist

### 1. Test Admin Access
- Navigate to `/admin/login`
- Login with credentials: `admin_demo` / `Admin@123`
- Verify admin dashboard loads

### 2. Create Test Users
- From admin dashboard, create 2 test users
- Test login for both users

### 3. Test Game Flow
- User 1: Create a game
- User 2: Join the game
- Verify ship placement works
- Test turn-based moves
- Verify real-time updates (2-3 second delay)

### 4. Monitor Logs
- Check backend logs for errors
- Check browser console for frontend errors
- Verify MongoDB connection is stable

### 5. Security Hardening
- [ ] Change `ADMIN_PASSWORD` to a strong password
- [ ] Set specific CORS origins (not `*`)
- [ ] Enable MongoDB authentication
- [ ] Use HTTPS for production URLs
- [ ] Add rate limiting (optional)
- [ ] Set up monitoring/alerting

---

## Troubleshooting

### Backend won't start
**Error:** `pymongo.errors.ServerSelectionTimeoutError`
- Check MongoDB connection string is correct
- Verify MongoDB cluster is running
- Check IP whitelist in MongoDB Atlas

**Error:** `Port already in use`
- Change port in start command: `--port 8002`
- Kill existing process: `lsof -ti:8001 | xargs kill`

### Frontend can't connect to backend
**Error:** `Network Error` or CORS errors
- Verify `REACT_APP_BACKEND_URL` is correct
- Check backend is running and accessible
- Ensure CORS_ORIGINS includes your frontend URL
- Try accessing backend URL directly in browser

### Ship placement not working
- Clear browser cache
- Check browser console for errors
- Verify all JavaScript files loaded

### Real-time updates not working
- Game updates use polling (2-second intervals)
- Keep browser tab open
- Check Network tab for API calls to `/api/games/{id}`

---

## Performance Optimization

### Backend
- Add Redis for session storage (optional)
- Implement connection pooling for MongoDB
- Add caching for frequently accessed data
- Use CDN for static assets

### Frontend
- Enable gzip compression
- Optimize images (already using low quality for avatars)
- Implement code splitting
- Add service worker for offline support

### Database
- Add indexes for frequently queried fields:
  ```javascript
  db.users.createIndex({ username: 1 })
  db.games.createIndex({ state: 1, created_at: -1 })
  db.moves.createIndex({ game_id: 1, player_id: 1 })
  ```

---

## Scaling Considerations

### Current Architecture
- Polling-based real-time updates (2s interval)
- Stateless backend (horizontal scaling ready)
- MongoDB for persistence

### For Higher Traffic
1. **Add WebSocket support** for true real-time updates
2. **Load balancer** for multiple backend instances
3. **Redis Pub/Sub** for game state broadcasting
4. **CDN** for frontend assets (Cloudflare, AWS CloudFront)
5. **Database replicas** for read scaling

---

## Cost Estimates (Monthly)

### Free Tier Setup
- **MongoDB Atlas M0:** Free (512MB storage, shared)
- **Render/Railway Free:** Free (750 hours/month)
- **Vercel Hobby:** Free (100GB bandwidth)
- **Total:** $0/month ✅

### Production Setup (100+ concurrent users)
- **MongoDB Atlas M10:** $57/month
- **Render/Railway Pro:** $7-20/month
- **Vercel Pro:** $20/month (if needed)
- **Total:** ~$84-97/month

---

## Monitoring & Logs

### Render/Railway
- Built-in logging in dashboard
- Set up alerts for errors
- Monitor response times

### Vercel
- Analytics dashboard included
- Real-time function logs
- Performance insights

### MongoDB Atlas
- Performance Advisor
- Real-time metrics
- Slow query analysis

---

## Backup Strategy

### MongoDB Atlas Backups
- Enable automated backups (available on paid tiers)
- Snapshot frequency: Daily
- Retention: 7 days

### Manual Backup
```bash
mongodump --uri="mongodb+srv://..." --out=./backup
```

### Restore
```bash
mongorestore --uri="mongodb+srv://..." ./backup
```

---

## Support & Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com
- **React Docs:** https://react.dev
- **MongoDB Atlas:** https://docs.atlas.mongodb.com
- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs

---

## Demo Credentials (Change in Production!)

**Admin:**
- Username: `admin_demo`
- Password: `Admin@123`

**Test Users:** (Create via admin dashboard)
- Username: `player1`, `player2`, etc.
- Password: Set by admin

---

**Deployment completed successfully? Test all features and enjoy your Battleship game! 🚢⚓**
