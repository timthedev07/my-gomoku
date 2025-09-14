import { distance } from "@/utils/grid";
import { Point, Cell, Board, getSuccessors, Player, makeMove } from "./board";

export const nextMove = (
  board: Board, // assumes the board is non-terminal
  player: Player, // the player for which to suggest a move
) => {
  const successors = getSuccessors(board, [proximityPrune]);

  let [best, bestScore]: [Point | null, number] = [null, player === Cell.BLACK ? -Infinity : Infinity];

  for (const successor of successors) {
    const newBoard = makeMove(board, successor, player)!;
    // evaluate the new board
    const score = evaluation(newBoard);
    // keep track of the best move
    if (player === Cell.WHITE) {
      if (score < bestScore) {
        bestScore = score;
        best = successor;
      }
    } else {
      if (score > bestScore) {
        bestScore = score;
        best = successor;
      }
    }
  }
  return best as Point;
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
  // heuristic 1: average distance between stones

  // O(n^4) but we have a small n so it's okay, and the average case is much better
  const averageDistance = (player: Player) => {
    const points: [number, number][] = [];
    for (let i = 0; i < board.length; ++i) {
      for (let j = 0; j < board.length; ++j) {
        if (board[i][j] === player) {
          points.push([i, j]);
        }
      }
    }

    let sum = 0;
    for (let i = 0; i < points.length; ++i) {
      for (let j = i + 1; j < points.length; ++j) {
        // accumulate distance
        sum += distance(points[i], points[j]);
      }
    }
    const n = points.length;
    return sum / Math.max(1, n * (n - 1) / 2);
  }

  const whiteAvg = averageDistance(Cell.WHITE);
  const blackAvg = averageDistance(Cell.BLACK);
  // if negative, then black is more spread out, so better situation for white
  const distAvgDiffTanh = Math.tanh(whiteAvg - blackAvg);

  // heuristic 2: center control
  const averageDistanceToCenter = (player: Player) => {
    const center: [number, number] = [(board.length - 1) / 2, (board.length - 1) / 2];
    let sum = 0;
    let count = 0;
    for (let i = 0; i < board.length; ++i) {
      for (let j = 0; j < board.length; ++j) {
        if (board[i][j] === player) {
          sum += distance([i, j], center);
          count++;
        }
      }
    }
    return sum / Math.max(1, count);
  }
  const whiteCenter = averageDistanceToCenter(Cell.WHITE);
  const blackCenter = averageDistanceToCenter(Cell.BLACK);
  const centerDiffTanh = Math.tanh(whiteCenter - blackCenter);

  const weights = [0.7, 0.3];
  const scores = [distAvgDiffTanh, centerDiffTanh];

  return weights.map((w, i) => w * scores[i]).reduce((a, b) => a + b, 0);
}

export const minimax = (board: Board, depth: number, player: Player, alpha: number, beta: number) => {
  if (depth === 0) {
    return evaluation(board);
  }

};
