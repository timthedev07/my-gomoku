import { argv0 } from "process";

export type Board = Cell[][];
export const DIM = 15;
export const WINDOW_SIZE = 6;
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

export type WindowID = [Point, number]; // starting point and direction (0: diagonal, 1: horizontal, -1: vertical, 2: anti-diagonal)

export type Player = Cell.BLACK | Cell.WHITE;

export type Point = [number, number];

export enum Cell {
  EMPTY = 0,
  BLACK = 1,
  WHITE = -1,
}

export const getWindowContent = (key: WindowID, board: Board) => {
  const dir =
    key[1] === 0
      ? [1, 1]
      : key[1] === 1
        ? [0, 1]
        : key[1] === -1
          ? [1, 0]
          : [1, -1];
  const cells: Cell[] = [];
  const [i, j] = key[0];
  for (let k = 0; k < WINDOW_SIZE; ++k) {
    try {
      cells.push(board[i + k * dir[0]][j + k * dir[1]]);
    } catch {
      cells.push(Cell.EMPTY); // out of bounds
    }
  }
  return cells;
};

export const getAllAffectedWindows = (point: Point): WindowID[] => {
  const [row, col] = point;
  const windows: WindowID[] = [];

  for (let i = Math.max(0, row - WINDOW_SIZE + 1); i <= Math.min(row, 9); ++i) {
    windows.push([[i, col], -1]);
  }
  for (let j = Math.max(0, col - WINDOW_SIZE + 1); j <= Math.min(col, 9); ++j) {
    windows.push([[row, j], 1]);
  }
  const K = -WINDOW_SIZE + 1;
  const end = -(WINDOW_SIZE - Math.min(DIM - row, DIM - col));
  for (let k = -Math.min(-K, row, col); k <= end; ++k) {
    windows.push([[row + k, col + k], 0]);
  }
  const end2 = -(WINDOW_SIZE - Math.min(DIM - row, col + 1));
  for (let k = -Math.min(-K, row, DIM - 1 - col); k <= end2; ++k) {
    windows.push([[row + k, col - k], 2]);
  }
  return windows;
};

export const getInitialBoard = (): Cell[][] => {
  return Array.from({ length: DIM }, () => Array(DIM).fill(Cell.EMPTY));
};

export const proximityPrune = (
  board: Board,
  point: [number, number],
  radius = 3,
) => {
  const [row, col] = point;
  // For an empty cell, mark cells within the radius as valid
  const rowBound = [
    Math.max(0, row - radius),
    Math.min(board.length - 1, row + radius),
  ];
  const colBound = [
    Math.max(0, col - radius),
    Math.min(board.length - 1, col + radius),
  ];

  for (let i = rowBound[0]; i <= rowBound[1]; ++i) {
    for (let j = colBound[0]; j <= colBound[1]; ++j) {
      if (board[i][j] !== Cell.EMPTY) {
        return false; // do not prune if has a neighbour
      }
    }
  }

  return true;
};

/**
 * Get all valid successor points on the board.
 * Prune is a function that returns true if the cell should be pruned.
 * If a prune function is not provided, no cells will be pruned by default
 */
export const getSuccessors = (
  board: Board,
  pruneFunctions: ((board: Board, cell: Point) => boolean)[] = [],
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

/**
 * Expects a number between -1 and 2 incl.
 */
export const directionKeyToVec = (dirKey: number): Point => {
  return dirKey === 0
    ? [1, 1]
    : dirKey === 1
      ? [0, 1]
      : dirKey === -1
        ? [1, 0]
        : [1, -1];
};
