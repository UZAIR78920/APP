import { X, Waves } from 'lucide-react';

export default function GameBoard({ ships, moves, isPlayerBoard, onCellClick, disabled }) {
  const gridSize = 5;

  const getCellState = (x, y) => {
    // Check if there's a move on this cell
    const move = moves.find(m => m.x === x && m.y === y);
    
    if (isPlayerBoard) {
      // Player's board - show ships and enemy hits
      const hasShip = ships.some(ship => 
        ship.cells.some(cell => cell[0] === x && cell[1] === y)
      );
      
      if (move) {
        if (hasShip) {
          // Check if ship is sunk
          const ship = ships.find(s => s.cells.some(c => c[0] === x && c[1] === y));
          const isSunk = ship?.sunk || false;
          return isSunk ? 'sunk' : 'hit';
        }
        return 'miss';
      }
      
      return hasShip ? 'ship' : 'empty';
    } else {
      // Opponent's board - only show our moves
      if (move) {
        return move.result === 'miss' ? 'miss' : move.result === 'sunk' ? 'sunk' : 'hit';
      }
      return 'empty';
    }
  };

  const handleCellClick = (x, y) => {
    if (disabled || !onCellClick) return;
    
    // Check if already targeted
    const alreadyTargeted = moves.some(m => m.x === x && m.y === y);
    if (alreadyTargeted) return;
    
    onCellClick(x, y);
  };

  return (
    <div className="inline-block">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {Array.from({ length: gridSize * gridSize }).map((_, index) => {
          const x = Math.floor(index / gridSize);
          const y = index % gridSize;
          const cellState = getCellState(x, y);
          
          return (
            <button
              key={`${x}-${y}`}
              onClick={() => handleCellClick(x, y)}
              disabled={disabled}
              data-testid={`cell-${x}-${y}`}
              className={`
                grid-cell w-16 h-16 md:w-20 md:h-20 flex items-center justify-center
                ${cellState === 'ship' ? 'ship' : ''}
                ${cellState === 'hit' ? 'hit' : ''}
                ${cellState === 'miss' ? 'miss' : ''}
                ${cellState === 'sunk' ? 'sunk' : ''}
                ${disabled || cellState !== 'empty' ? 'disabled' : ''}
              `}
            >
              {cellState === 'hit' && (
                <X className="w-8 h-8 text-white" strokeWidth={3} />
              )}
              {cellState === 'sunk' && (
                <X className="w-8 h-8 text-red-200" strokeWidth={4} />
              )}
              {cellState === 'miss' && (
                <Waves className="w-6 h-6 text-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
