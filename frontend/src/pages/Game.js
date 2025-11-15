import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { api } from '@/utils/api';
import { getAvatarUrl } from '@/utils/avatars';
import { ArrowLeft, Flag, Crown, Target } from 'lucide-react';
import GameBoard from '@/components/GameBoard';

export default function Game() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [boardState, setBoardState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGame();
    fetchBoardState();
    const interval = setInterval(() => {
      fetchGame();
      fetchBoardState();
    }, 2000);
    return () => clearInterval(interval);
  }, [gameId]);

  const fetchGame = async () => {
    try {
      const response = await api.get(`/games/${gameId}`);
      setGame(response.data);
    } catch (error) {
      toast.error('Failed to load game');
      navigate('/lobby');
    }
  };

  const fetchBoardState = async () => {
    try {
      const response = await api.get(`/games/${gameId}/board`);
      setBoardState(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch board state:', error);
    }
  };

  const handleMove = async (x, y) => {
    try {
      const response = await api.post(`/games/${gameId}/move`, { x, y });
      toast.success(
        response.data.result === 'hit' ? '🎯 Hit!' :
        response.data.result === 'sunk' ? `💥 Ship Sunk! (${response.data.ship_sunk} cells)` :
        '💧 Miss'
      );
      
      if (response.data.game_over) {
        toast.success('🏆 You won! All enemy ships destroyed!');
      }
      
      fetchGame();
      fetchBoardState();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Move failed');
    }
  };

  const handleSurrender = async () => {
    if (!window.confirm('Are you sure you want to surrender?')) return;
    
    try {
      await api.post(`/games/${gameId}/surrender`);
      toast.info('You surrendered the game');
      navigate('/lobby');
    } catch (error) {
      toast.error('Failed to surrender');
    }
  };

  if (loading || !game || !boardState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white text-xl">Loading game...</p>
      </div>
    );
  }

  const isMyTurn = game.current_turn === user.id;
  const isCreator = game.creator_id === user.id;
  const opponent = isCreator ? {
    id: game.opponent_id,
    username: game.opponent_username,
    avatar: game.opponent_avatar
  } : {
    id: game.creator_id,
    username: game.creator_username,
    avatar: game.creator_avatar
  };

  const isWaiting = game.state === 'waiting';
  const isFinished = game.state === 'finished';
  const isWinner = game.winner_id === user.id;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => navigate('/lobby')}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            data-testid="back-to-lobby"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lobby
          </Button>

          {!isWaiting && !isFinished && (
            <Button
              onClick={handleSurrender}
              variant="destructive"
              data-testid="surrender-button"
            >
              <Flag className="w-4 h-4 mr-2" />
              Surrender
            </Button>
          )}
        </div>

        {isWaiting && (
          <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700 p-6 mb-6">
            <div className="text-center">
              <Target className="w-12 h-12 text-cyan-400 mx-auto mb-3 animate-pulse" />
              <h2 className="text-2xl font-bold text-white mb-2">Waiting for Opponent...</h2>
              <p className="text-slate-400">Share this game ID: <span className="text-cyan-400 font-mono">{gameId.slice(0, 8)}</span></p>
            </div>
          </Card>
        )}

        {isFinished && (
          <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700 p-6 mb-6">
            <div className="text-center">
              <Crown className={`w-16 h-16 mx-auto mb-4 ${
                isWinner ? 'text-yellow-400' : 'text-slate-500'
              }`} />
              <h2 className="text-3xl font-bold text-white mb-2">
                {isWinner ? 'Victory!' : 'Defeat'}
              </h2>
              <p className="text-slate-400">
                {isWinner ? 'You destroyed all enemy ships!' : `${opponent.username} won the battle`}
              </p>
            </div>
          </Card>
        )}

        {!isWaiting && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12 ring-2 ring-blue-500">
                    <AvatarImage src={getAvatarUrl(user.avatar)} />
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-semibold">You</p>
                    <p className="text-slate-400 text-sm">{user.username}</p>
                  </div>
                </div>
                {isMyTurn && !isFinished && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-semibold rounded-full">
                    YOUR TURN
                  </span>
                )}
              </div>
            </Card>

            <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12 ring-2 ring-red-500">
                    <AvatarImage src={getAvatarUrl(opponent.avatar)} />
                    <AvatarFallback>{opponent.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-semibold">Opponent</p>
                    <p className="text-slate-400 text-sm">{opponent.username}</p>
                  </div>
                </div>
                {!isMyTurn && !isFinished && (
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm font-semibold rounded-full">
                    OPPONENT'S TURN
                  </span>
                )}
              </div>
            </Card>
          </div>
        )}

        {!isWaiting && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4" style={{fontFamily: 'Space Grotesk'}}>
                Your Fleet
              </h3>
              <GameBoard
                ships={boardState.my_ships}
                moves={boardState.opponent_moves}
                isPlayerBoard={true}
                onCellClick={null}
                disabled={true}
              />
            </Card>

            <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4" style={{fontFamily: 'Space Grotesk'}}>
                Enemy Waters
              </h3>
              <GameBoard
                ships={[]}
                moves={boardState.my_moves}
                isPlayerBoard={false}
                onCellClick={handleMove}
                disabled={!isMyTurn || isFinished}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
