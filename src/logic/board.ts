import { longestSequenceAlongDirection } from "@/utils/grid";

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


export interface Threat {
  player: Player;
  window: WindowID
}

export type Player = Cell.BLACK | Cell.WHITE;

export type Point = [number, number];

export enum Cell {
  EMPTY = 0,
  BLACK = 1,
  WHITE = -1,
}

export const getThreatMapKey = (window: WindowID) => {
  const [a, b] = window[0];
  return `${a}_${b}_${window[1]}`;
}

/**
 * computes computes the udpated set of threats after a move
 *
 * the board is assumed to be updated already by `action`
 */
export const updateThreatsMap = (threatsMap: Map<string, Threat>, board: Board, action: Point) => {
  const affectedWindows = getAllAffectedWindows(action);

  for (const window of affectedWindows) {
    const key = getThreatMapKey(window);
    const windowContent = getWindowContent(window, board);
    const hasThreat = windowHasThreat(windowContent, window);

    if (threatsMap.has(key)) {
      // recompute the threat
      if (hasThreat === 0) {
        threatsMap.delete(key);
      } else {
        threatsMap.set(key, { player: hasThreat, window, });
      }
    } else {
      // no previous threat
      if (hasThreat !== 0) {
        threatsMap.set(key, { player: hasThreat, window, });
      }
    }
  }
  console.log(threatsMap);

  return threatsMap;
}

export const getWindowContent = (key: WindowID, board: Board) => {
  const dir = key[1] === 0 ? [1, 1] : key[1] === 1 ? [0, 1] : [1, 0];
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
}

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
}
/*
 * Given a window of length 7, return:
 *  1 if there is a threat for black
 *  -1 if there is a threat for white
 *  0 otherwise
 */
export const windowHasThreat = (windowContent: Cell[], window: WindowID): number => {
  // check threats of type A and B (4 in a row)
  const hasAnOpenEnd = windowContent[0] === Cell.EMPTY || windowContent[6] === Cell.EMPTY;
  if (windowContent.slice(1, -1).every((cell) => cell === Cell.BLACK)) {
    if (hasAnOpenEnd) {
      return 1;
    }
  } else if (windowContent.slice(1, -1).every((cell) => cell === Cell.WHITE)) {
    if (hasAnOpenEnd) {
      return -1;
    }
  }
  // check threats of type C and D (3 in a row with 2 open ends)
  const openThreeCheck = (subwindow: Cell[]) => {
    const hasOpenEnds = subwindow[0] === Cell.EMPTY && subwindow[4] === Cell.EMPTY;

    if (!hasOpenEnds) return null;

    if (subwindow.slice(1, -1).every((cell) => cell === Cell.BLACK)) {
      return 1;
    } else if (subwindow.slice(1, -1).every((cell) => cell === Cell.WHITE)) {
      return -1;
    }

    return null;
  }

  const backCheck = openThreeCheck(windowContent.slice(1, 6));
  // if window.start is at the edge of the board, also check the front
  if (window[0][0] === 0 || window[0][1] === 0) {
    const frontCheck = openThreeCheck(windowContent.slice(0, 5));
    if (frontCheck !== null) return frontCheck;
  }
  if (backCheck !== null) return backCheck;

  // check threats of type E
  // slice of size 6
  const hasOpenEnds = windowContent[0] === Cell.EMPTY && windowContent[5] === Cell.EMPTY;
  if (hasOpenEnds) {
    const r = windowContent[1];
    const occupyNearEnds = (r !== Cell.EMPTY) &&
      (windowContent[4] !== Cell.EMPTY) &&
      (r === windowContent[4]);

    if (occupyNearEnds) {
      if (windowContent[2] === r || windowContent[3] === r) {
        if (r === Cell.BLACK) return 1;
        else if (r === Cell.WHITE) return -1;
      }
    }
  }
  return 0;
}

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

