import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';
import { toast } from 'sonner';

const GRID_SIZE = 5;
const SHIPS = [
  { size: 4, name: 'Battleship', color: 'from-blue-500 to-blue-600' },
  { size: 3, name: 'Cruiser', color: 'from-green-500 to-green-600' },
  { size: 2, name: 'Destroyer', color: 'from-purple-500 to-purple-600' },
];

export default function ShipPlacement({ onComplete, onCancel, loading }) {
  const [placedShips, setPlacedShips] = useState([]);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [orientation, setOrientation] = useState('horizontal'); // horizontal or vertical
  const [hoveredCells, setHoveredCells] = useState([]);
  const [isValid, setIsValid] = useState(true);

  const currentShip = SHIPS[currentShipIndex];

  const getCellsForShip = (startX, startY, size, orient) => {
    const cells = [];
    for (let i = 0; i < size; i++) {
      if (orient === 'horizontal') {
        cells.push([startX, startY + i]);
      } else {
        cells.push([startX + i, startY]);
      }
    }
    return cells;
  };

  const isValidPlacement = (cells) => {
    // Check bounds
    for (const [x, y] of cells) {
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
        return false;
      }
    }

    // Check overlaps with placed ships
    for (const ship of placedShips) {
      for (const [x, y] of ship.cells) {
        for (const [cx, cy] of cells) {
          if (x === cx && y === cy) {
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleCellHover = (x, y) => {
    if (currentShipIndex >= SHIPS.length) return;

    const cells = getCellsForShip(x, y, currentShip.size, orientation);
    setHoveredCells(cells);
    setIsValid(isValidPlacement(cells));
  };

  const handleCellClick = (x, y) => {
    if (currentShipIndex >= SHIPS.length) return;

    const cells = getCellsForShip(x, y, currentShip.size, orientation);
    
    if (!isValidPlacement(cells)) {
      toast.error('Invalid placement! Ships cannot overlap or go out of bounds.');
      return;
    }

    const newShip = {
      size: currentShip.size,
      cells: cells,
      name: currentShip.name,
    };

    setPlacedShips([...placedShips, newShip]);
    setCurrentShipIndex(currentShipIndex + 1);
    setHoveredCells([]);
    
    if (currentShipIndex === SHIPS.length - 1) {
      toast.success('All ships placed! Ready to start game.');
    }
  };

  const handleReset = () => {
    setPlacedShips([]);
    setCurrentShipIndex(0);
    setHoveredCells([]);
  };

  const handleComplete = () => {
    if (placedShips.length !== SHIPS.length) {
      toast.error('Please place all ships before starting');
      return;
    }
    onComplete(placedShips);
  };

  const isCellOccupied = (x, y) => {
    return placedShips.some(ship => 
      ship.cells.some(([cx, cy]) => cx === x && cy === y)
    );
  };

  const isCellHovered = (x, y) => {
    return hoveredCells.some(([cx, cy]) => cx === x && cy === y);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {currentShipIndex < SHIPS.length ? (
            <div>
              <h3 className="text-white text-lg font-semibold mb-1">
                Place {currentShip.name}
              </h3>
              <p className="text-slate-400 text-sm">
                Size: {currentShip.size} cells | Click on the grid to place
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-green-400 text-lg font-semibold mb-1">
                All ships placed!
              </h3>
              <p className="text-slate-400 text-sm">
                Ready to start the battle
              </p>
            </div>
          )}
        </div>
        
        {currentShipIndex < SHIPS.length && (
          <Button
            onClick={() => setOrientation(orientation === 'horizontal' ? 'vertical' : 'horizontal')}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            data-testid="rotate-ship-button"
          >
            <RotateCw className="w-4 h-4 mr-2" />
            {orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
          </Button>
        )}
      </div>

      <div className="flex justify-center">
        <div className="inline-block p-4 bg-slate-900/50 rounded-lg">
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
              const x = Math.floor(index / GRID_SIZE);
              const y = index % GRID_SIZE;
              const occupied = isCellOccupied(x, y);
              const hovered = isCellHovered(x, y);
              
              return (
                <button
                  key={`${x}-${y}`}
                  onMouseEnter={() => handleCellHover(x, y)}
                  onMouseLeave={() => setHoveredCells([])}
                  onClick={() => handleCellClick(x, y)}
                  disabled={currentShipIndex >= SHIPS.length}
                  data-testid={`placement-cell-${x}-${y}`}
                  className={`
                    w-16 h-16 md:w-20 md:h-20 border-2 rounded transition-all
                    ${
                      occupied 
                        ? 'bg-green-500/40 border-green-500'
                        : hovered
                        ? isValid
                          ? 'bg-blue-500/30 border-blue-500 ship-preview'
                          : 'bg-red-500/30 border-red-500 ship-preview invalid'
                        : 'bg-slate-800/60 border-slate-600 hover:border-slate-500'
                    }
                    ${currentShipIndex >= SHIPS.length ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-2">
        {SHIPS.map((ship, index) => (
          <div
            key={index}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              index < placedShips.length
                ? 'bg-green-500/20 text-green-400'
                : index === currentShipIndex
                ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500'
                : 'bg-slate-700 text-slate-500'
            }`}
          >
            {ship.name} ({ship.size})
          </div>
        ))}
      </div>

      <div className="flex space-x-3">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
          disabled={loading}
          data-testid="cancel-placement"
        >
          Cancel
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
          disabled={placedShips.length === 0 || loading}
          data-testid="reset-placement"
        >
          Reset
        </Button>
        <Button
          onClick={handleComplete}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          disabled={placedShips.length !== SHIPS.length || loading}
          data-testid="confirm-placement"
        >
          {loading ? 'Starting...' : 'Start Game'}
        </Button>
      </div>
    </div>
  );
}
