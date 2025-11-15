import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { api } from '@/utils/api';
import { getAvatarUrl } from '@/utils/avatars';
import { LogOut, Plus, Users, Target } from 'lucide-react';
import ShipPlacement from '@/components/ShipPlacement';

export default function Lobby() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [myGames, setMyGames] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGames();
    fetchMyGames();
    const interval = setInterval(() => {
      fetchGames();
      fetchMyGames();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      const response = await api.get('/games');
      setGames(response.data);
    } catch (error) {
      console.error('Failed to fetch games:', error);
    }
  };

  const fetchMyGames = async () => {
    try {
      const response = await api.get('/games/my');
      setMyGames(response.data);
    } catch (error) {
      console.error('Failed to fetch my games:', error);
    }
  };

  const handleCreateGame = async (ships) => {
    setLoading(true);
    try {
      const response = await api.post('/games', { ships });
      toast.success('Game created! Waiting for opponent...');
      setShowCreateDialog(false);
      navigate(`/game/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (ships) => {
    if (!selectedGame) return;
    setLoading(true);
    try {
      await api.post(`/games/${selectedGame.id}/join`, { ships });
      toast.success('Joined game successfully!');
      setShowJoinDialog(false);
      navigate(`/game/${selectedGame.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  const openJoinDialog = (game) => {
    setSelectedGame(game);
    setShowJoinDialog(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>Game Lobby</h1>
            <p className="text-slate-400 text-lg">Welcome, {user?.username}!</p>
          </div>
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12 ring-2 ring-cyan-500">
              <AvatarImage src={getAvatarUrl(user?.avatar || 0)} />
              <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {myGames.length > 0 && (
          <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Your Active Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => navigate(`/game/${game.id}`)}
                    className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border-2 border-blue-500/30 hover:border-blue-500/60 transition-all text-left"
                    data-testid={`my-game-${game.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        game.state === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {game.state === 'waiting' ? 'WAITING' : 'IN PROGRESS'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={getAvatarUrl(game.creator_avatar)} />
                        </Avatar>
                        <span className="text-white text-sm font-medium">{game.creator_username}</span>
                      </div>
                      {game.opponent_username && (
                        <>
                          <span className="text-slate-500 text-xs">vs</span>
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={getAvatarUrl(game.opponent_avatar)} />
                            </Avatar>
                            <span className="text-white text-sm font-medium">{game.opponent_username}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Available Games ({games.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {games.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-all"
                      data-testid={`available-game-${game.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={getAvatarUrl(game.creator_avatar)} />
                          <AvatarFallback>{game.creator_username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">{game.creator_username}</p>
                          <p className="text-slate-500 text-sm">{new Date(game.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => openJoinDialog(game)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        data-testid={`join-game-${game.id}`}
                      >
                        Join Game
                      </Button>
                    </div>
                  ))}
                  {games.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-slate-500 mb-4">No games available</p>
                      <p className="text-slate-600 text-sm">Create a new game to start playing!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-6"
                  data-testid="create-game-button"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Game
                </Button>

                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <h3 className="text-white font-semibold mb-2">Game Rules</h3>
                  <ul className="text-slate-400 text-sm space-y-1">
                    <li>• 5x5 grid battlefield</li>
                    <li>• 3 ships: 4-cell, 3-cell, 2-cell</li>
                    <li>• Horizontal or vertical placement</li>
                    <li>• Take turns firing at opponent</li>
                    <li>• Sink all enemy ships to win</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Place Your Ships</DialogTitle>
          </DialogHeader>
          <ShipPlacement
            onComplete={handleCreateGame}
            onCancel={() => setShowCreateDialog(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">
              Join {selectedGame?.creator_username}'s Game
            </DialogTitle>
          </DialogHeader>
          <ShipPlacement
            onComplete={handleJoinGame}
            onCancel={() => setShowJoinDialog(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
