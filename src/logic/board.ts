export type Board = Cell[][];
export const DIM = 15;

export enum Cell {
  EMPTY = 0,
  BLACK = 1,
  WHITE = -1,
}

export type Player = Cell.BLACK | Cell.WHITE;

export type Point = [number, number];

export const getInitialBoard = (): Cell[][] => {
  return Array.from({ length: DIM }, () => Array(DIM).fill(Cell.EMPTY));
}

/**
 * Get all valid successor points on the board.
 * Prune is a function that returns true if the cell should be pruned.
 * If a prune function is not provided, no cells will be pruned by default
*/
export const getSuccessors = (board: Board, prune: (board: Board, cell: Cell) => boolean = () => false): Point[] => {
  const successors: Point[] = [];

  for (let i = 0; i < DIM; ++i) {
    for (let j = 0; j < DIM; ++j) {
      const cell = board[i][j];
      if (cell === Cell.EMPTY && !prune(board, cell)) {
        successors.push([i, j]);
      }
    }
  }
  return successors;
}

export const makeMove = (board: Board, [row, col]: Point, player: Player) => {
  const newBoard = structuredClone(board);
  newBoard[row][col] = player;
  return newBoard;
}

/**
 * If there is a winner, return it; otherwise return 0
 */
export const checkWin = (board: Board) => {
  /**
    * The direction is a vector representing the direction to check for a win
    */
  const hasWinSequence = (pointer: Point, direction: Point, player: Player) => {
    const [i0, j0] = pointer;
    const [dRow, dCol] = direction;

    let s = 0;
    let [i, j] = [i0, j0];

    do {
      ++s;
      if (i > 0 && i < DIM - 1 && j > 0 && j < DIM - 1) {
        i += dRow;
        j += dCol;
      } else {
        break
      }
    } while (board[i][j] === player);

    return s === 5;
  }

  for (let i = 0; i < DIM; ++i) {
    for (let j = 0; j < DIM; ++j) {
      const player = board[i][j];
      if (player === Cell.EMPTY) continue;
      const directions = [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1]
      ] as [number, number][];
      for (const direction of directions) {
        if (hasWinSequence([i, j], direction, player)) {
          return player;
        }
      }

    }
  }
  return 0;
};



/**
 * We don't need a separate utility because every terminal check will compute the winner if any
 */
export const terminal = (board: Board): [boolean, Cell] => {
  // a winning condition is much more likely than a full board;
  const win = checkWin(board);
  if (win !== 0) {
    return [true, win];
  }

  for (let i = 0; i < DIM; ++i) {
    for (let j = 0; j < DIM; ++j) {
      if (board[i][j] === Cell.EMPTY) {
        return [false, 0]; // not terminal yet
      }
    }
  }
  return [true, 0]; // draw
}

