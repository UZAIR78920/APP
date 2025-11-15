import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { API } from '@/utils/api';
import axios from 'axios';
import { Shield } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/admin/login`, {
        username,
        password,
      });

      login(response.data.token, response.data.user);
      toast.success('Admin login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 fade-in">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl shadow-lg">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>Admin Portal</h1>
          <p className="text-slate-400">Secure access for administrators</p>
        </div>

        <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700 fade-in" style={{animationDelay: '0.1s'}}>
          <CardHeader>
            <CardTitle className="text-white">Admin Login</CardTitle>
            <CardDescription className="text-slate-400">Authorized personnel only</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="admin-username" className="text-slate-300">Username</Label>
                <Input
                  id="admin-username"
                  data-testid="admin-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                  placeholder="Admin username"
                />
              </div>
              <div>
                <Label htmlFor="admin-password" className="text-slate-300">Password</Label>
                <Input
                  id="admin-password"
                  data-testid="admin-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                  placeholder="Admin password"
                />
              </div>
              <Button
                data-testid="admin-login-button"
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Admin Login'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
                ← Back to User Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
