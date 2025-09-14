import { Cell, Board, getSuccessors, Player } from "./board";

export const nextMove = (
  board: Board, // assumes the board is non-terminal
  player: Player, // the player for which to suggest a move
) => {
  const successors = getSuccessors(board, [proximityPrune]);

  return successors[Math.floor(Math.random() * successors.length)];
}


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
 * Returns a score between -1 and 1
 */
const evaluation = (board: Board) => {
  return 0;
}

export const minimax = (board: Board, depth: number, player: Player, alpha: number, beta: number) => {
  if (depth === 0) {
    return evaluation(board);
  }

};
