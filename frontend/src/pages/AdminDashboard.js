import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { api } from '@/utils/api';
import { getAvatarUrl, AVATARS } from '@/utils/avatars';
import { UserPlus, LogOut, Users, Gamepad2, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    avatar: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchGames();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const fetchGames = async () => {
    try {
      const response = await api.get('/admin/games');
      setGames(response.data);
    } catch (error) {
      toast.error('Failed to fetch games');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/admin/users', newUser);
      toast.success('User created successfully!');
      setNewUser({ username: '', password: '', avatar: 0 });
      setDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>Admin Dashboard</h1>
            <p className="text-slate-400">Manage users and monitor games</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            data-testid="admin-logout-button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Users ({users.length})
              </CardTitle>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    data-testid="create-user-button"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New User</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                      <Label htmlFor="new-username" className="text-slate-300">Username</Label>
                      <Input
                        id="new-username"
                        data-testid="new-username-input"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        required
                        className="bg-slate-900/50 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password" className="text-slate-300">Password</Label>
                      <Input
                        id="new-password"
                        data-testid="new-password-input"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        required
                        className="bg-slate-900/50 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Select Avatar</Label>
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {AVATARS.map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setNewUser({ ...newUser, avatar: index })}
                            className={`p-2 rounded-lg border-2 transition-all ${
                              newUser.avatar === index
                                ? 'border-cyan-500 bg-cyan-500/20'
                                : 'border-slate-600 hover:border-slate-500'
                            }`}
                            data-testid={`avatar-option-${index}`}
                          >
                            <Avatar className="w-full h-full">
                              <AvatarImage src={getAvatarUrl(index)} />
                              <AvatarFallback>{index}</AvatarFallback>
                            </Avatar>
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      disabled={loading}
                      data-testid="submit-create-user"
                    >
                      {loading ? 'Creating...' : 'Create User'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700"
                    data-testid={`user-item-${u.username}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={getAvatarUrl(u.avatar)} />
                        <AvatarFallback>{u.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium">{u.username}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteUser(u.id)}
                      data-testid={`delete-user-${u.username}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-slate-500 text-center py-8">No users yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Gamepad2 className="w-5 h-5 mr-2" />
                Games ({games.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                    data-testid={`game-item-${game.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        game.state === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                        game.state === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {game.state.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {new Date(game.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={getAvatarUrl(game.creator_avatar)} />
                        </Avatar>
                        <span className="text-white text-sm">{game.creator_username}</span>
                      </div>
                      {game.opponent_username && (
                        <>
                          <span className="text-slate-500">vs</span>
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={getAvatarUrl(game.opponent_avatar)} />
                            </Avatar>
                            <span className="text-white text-sm">{game.opponent_username}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {games.length === 0 && (
                  <p className="text-slate-500 text-center py-8">No games yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
