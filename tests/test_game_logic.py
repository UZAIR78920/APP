# Unit tests for Battleship game logic
import pytest
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from server import validate_ships

def test_validate_ships_valid():
    """Test valid ship placement"""
    ships = [
        {"size": 4, "cells": [[0, 0], [0, 1], [0, 2], [0, 3]]},
        {"size": 3, "cells": [[2, 0], [2, 1], [2, 2]]},
        {"size": 2, "cells": [[4, 3], [4, 4]]},
    ]
    assert validate_ships(ships) == True

def test_validate_ships_vertical():
    """Test valid vertical ship placement"""
    ships = [
        {"size": 4, "cells": [[0, 0], [1, 0], [2, 0], [3, 0]]},
        {"size": 3, "cells": [[0, 2], [1, 2], [2, 2]]},
        {"size": 2, "cells": [[3, 4], [4, 4]]},
    ]
    assert validate_ships(ships) == True

def test_validate_ships_wrong_count():
    """Test invalid ship count"""
    ships = [
        {"size": 4, "cells": [[0, 0], [0, 1], [0, 2], [0, 3]]},
        {"size": 3, "cells": [[2, 0], [2, 1], [2, 2]]},
    ]
    assert validate_ships(ships) == False

def test_validate_ships_wrong_sizes():
    """Test invalid ship sizes"""
    ships = [
        {"size": 5, "cells": [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]},
        {"size": 3, "cells": [[2, 0], [2, 1], [2, 2]]},
        {"size": 2, "cells": [[4, 3], [4, 4]]},
    ]
    assert validate_ships(ships) == False

def test_validate_ships_overlap():
    """Test overlapping ships"""
    ships = [
        {"size": 4, "cells": [[0, 0], [0, 1], [0, 2], [0, 3]]},
        {"size": 3, "cells": [[0, 2], [0, 3], [0, 4]]},  # Overlaps with first ship
        {"size": 2, "cells": [[4, 3], [4, 4]]},
    ]
    assert validate_ships(ships) == False

def test_validate_ships_out_of_bounds():
    """Test ships going out of bounds"""
    ships = [
        {"size": 4, "cells": [[0, 0], [0, 1], [0, 2], [0, 3]]},
        {"size": 3, "cells": [[2, 0], [2, 1], [2, 2]]},
        {"size": 2, "cells": [[4, 4], [4, 5]]},  # Out of bounds
    ]
    assert validate_ships(ships) == False

def test_validate_ships_non_contiguous():
    """Test non-contiguous ship placement"""
    ships = [
        {"size": 4, "cells": [[0, 0], [0, 1], [0, 3], [0, 4]]},  # Gap at [0,2]
        {"size": 3, "cells": [[2, 0], [2, 1], [2, 2]]},
        {"size": 2, "cells": [[4, 3], [4, 4]]},
    ]
    assert validate_ships(ships) == False

def test_validate_ships_diagonal():
    """Test diagonal ship placement (should be invalid)"""
    ships = [
        {"size": 4, "cells": [[0, 0], [1, 1], [2, 2], [3, 3]]},  # Diagonal
        {"size": 3, "cells": [[2, 0], [2, 1], [2, 2]]},
        {"size": 2, "cells": [[4, 3], [4, 4]]},
    ]
    assert validate_ships(ships) == False

def test_validate_ships_wrong_cell_count():
    """Test ship with wrong number of cells"""
    ships = [
        {"size": 4, "cells": [[0, 0], [0, 1], [0, 2]]},  # Only 3 cells for size 4
        {"size": 3, "cells": [[2, 0], [2, 1], [2, 2]]},
        {"size": 2, "cells": [[4, 3], [4, 4]]},
    ]
    assert validate_ships(ships) == False

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
