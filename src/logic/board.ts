import { longestSequenceAlongDirection } from "@/utils/grid";

export type Board = Cell[][];
export const DIM = 15;

export enum Cell {
  EMPTY = 0,
  BLACK = 1,
  WHITE = -1,
}

export const ALL_DIRECTIONS: Point[] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [-1, 1],
];

export type Player = Cell.BLACK | Cell.WHITE;

export type Point = [number, number];

export const getInitialBoard = (): Cell[][] => {
  return Array.from({ length: DIM }, () => Array(DIM).fill(Cell.EMPTY));
};

export const proximityPrune = (board: Board, point: [number, number], radius = 3) => {
  const [row, col] = point;
  // For an empty cell, mark cells within the radius as valid
  const rowBound = [Math.max(0, row - radius), Math.min(board.length - 1, row + radius)];
  const colBound = [Math.max(0, col - radius), Math.min(board.length - 1, col + radius)];

  for (let i = rowBound[0]; i <= rowBound[1]; ++i) {
    for (let j = colBound[0]; j <= colBound[1]; ++j) {
      if (board[i][j] !== Cell.EMPTY) {
        return false; // do not prune if has a neighbour
      }
    }
  }

  return true;
}

/**
 * Get all valid successor points on the board.
 * Prune is a function that returns true if the cell should be pruned.
 * If a prune function is not provided, no cells will be pruned by default
 */
export const getSuccessors = (
  board: Board,
  pruneFunctions: ((board: Board, cell: Point) => boolean)[] = []
): Point[] => {
  const successors: Point[] = [];

  for (let i = 0; i < DIM; ++i) {
    for (let j = 0; j < DIM; ++j) {
      const cell = board[i][j];
      if (cell !== Cell.EMPTY) continue;

      let shouldPrune = false;
      for (const pruneFunction of pruneFunctions) {
        if (!!pruneFunction && pruneFunction(board, [i, j])) {
          shouldPrune = true;
          break;
        }
      }
      if (!shouldPrune) {
        successors.push([i, j]);
      }
    }
  }
  return successors;
};

export const makeMove = (board: Board, action: Point, player: Player) => {
  const [row, col] = action;
  const newBoard = structuredClone(board);
  newBoard[row][col] = player;
  return newBoard;
};

/**
 * Given an empty point, it returns [b, w]
 * where b is the number of black threats at that point
 * and w is the number of white threats at that point
 */
export const numThreatsAtPoint = (board: Board, point: Point): Point => {
  const res = [0, 0] as Point;
  const [row, col] = point;

  for (const direction of ALL_DIRECTIONS) {
    // Types A and B: open four (xxxx_) or (_xxxx_)
    const l = longestSequenceAlongDirection(board, point, direction, true);
    if (Math.abs(l) >= 4) {
      if (l > 0) ++res[0];
      else ++res[1];
      continue;
    }

    // Type C: three 
    if (Math.abs(l) === 3) {
      // is free 3
      try {
        if (board[row + 4 * direction[0]][col + 4 * direction[1]] === Cell.EMPTY) {
          if (l > 0) ++res[0];
          else ++res[1];
        }
      } catch {
      }
      continue;
    }
    // Type D: _xxx__
    if (l === 0) {
      const l2 = longestSequenceAlongDirection(board, [row - direction[0], col - direction[1]], direction, false);
      if (Math.abs(l2) === 3) {
        if (l > 0) ++res[0];
        else ++res[1];
      }
      continue;
    }

    // Type E: _x_xx_
    // i'll just hard code it lol
    try {
      if (board[row + 2 * direction[0]][col + 2 * direction[1]] === Cell.EMPTY) {
        const r = board[row + direction[0]][col + direction[1]];
        if (r !== Cell.EMPTY &&
          r === board[row + 3 * direction[0]][col + 3 * direction[1]] &&
          r === board[row + 4 * direction[0]][col + 4 * direction[1]]) {
          if (r === Cell.BLACK) ++res[0];
          else if (r === Cell.WHITE) ++res[1];
        }
        continue;
      }

      const _k = board[row - direction[0]][col - direction[1]];
      if (_k !== Cell.EMPTY) {
        if (_k === board[row + direction[0]][col + direction[1]] &&
          _k === board[row + 2 * direction[0]][col + 2 * direction[1]]) {
          if (_k === Cell.BLACK) ++res[0];
          else if (_k === Cell.WHITE) ++res[1];
        } else if (_k === board[row - 2 * direction[0]][col - 2 * direction[1]] &&
          _k === board[row - 4 * direction[0]][col - 4 * direction[1]]) {
          if (_k === Cell.BLACK) ++res[0];
          else if (_k === Cell.WHITE) ++res[1];
        }
      }

    } catch {

    }

  }
  return res;
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
        break;
      }
    } while (board[i][j] === player);

    return s === 5;
  };

  for (let i = 0; i < DIM; ++i) {
    for (let j = 0; j < DIM; ++j) {
      const player = board[i][j];
      if (player === Cell.EMPTY) continue;
      for (const direction of ALL_DIRECTIONS) {
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
};

