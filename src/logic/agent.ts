import { distance } from "@/utils/grid";
import { Point, Cell, Board, getSuccessors, Player, makeMove, checkWin, terminal, proximityPrune, numThreatsAtPoint, DIM } from "./board";

export const nextMove = (
  board: Board, // assumes the board is non-terminal
  player: Player, // the player for which to suggest a move
) => {
  return minimax(board, 3, player)[0];
}



/**
 * Returns a score between -1 and 1
 * assumes a non-terminal board
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

  // heuristic 3: number of threats
  const diffNumThreats = () => {
    // i am aware that some threats are double or triple counted; fuck it
    // what matters is the difference;
    let [sB, sW] = [0, 0];
    for (let i = 0; i < DIM; ++i) {
      for (let j = 0; j < DIM; ++j) {
        if (board[i][j] === Cell.EMPTY) {
          const [a, b] = numThreatsAtPoint(board, [i, j]);
          sB += a;
          sW += b;
        }
      }
    }
    return sB + sW;
  }

  const k = 1 / 3;
  const diffThreatsTanh = Math.tanh(k * diffNumThreats());


  const weights = [0.3, 0.7];
  const scores = [centerDiffTanh, diffThreatsTanh];


  return weights.map((w, i) => w * scores[i]).reduce((a, b) => a + b, 0);
}

// this searches through existing threats and attempts to find winning sequences
// if no explicit winning sequence is found
// it will then attempt to connect independent threats into a winning sequence
// if all else fails, it will return null;
export const tss = (board: Board, player: Player) => {
  const successors = getSuccessors(board, [proximityPrune]);

}

export const minimax = (board: Board, depth: number, player: Player) => {
  if (player === Cell.BLACK) {
    return maximise(board, -Infinity, Infinity, depth);
  } else {
    return minimise(board, -Infinity, Infinity, depth);
  }

};

export const minimise = (board: Board, alpha: number, beta: number, depth: number): [Point | null, number] => {
  const [isTerminal, winner] = terminal(board);
  if (isTerminal) {
    return [null, winner];
  }
  if (depth === 0) {
    return [null, evaluation(board)];
  }
  const successors = getSuccessors(board, [proximityPrune]);
  let minVal = Infinity;
  let bestMove: Point | null = null;

  for (const successor of successors) {
    const newBoard = makeMove(board, successor, Cell.WHITE);
    const [_, value] = maximise(newBoard, alpha, beta, depth - 1);
    if (value < minVal) {
      minVal = value;
      bestMove = successor;
    }

    if (value <= alpha) {
      break; // alpha cut-off
    }
    beta = Math.min(beta, value);
  }

  return [bestMove, minVal];
};

export const maximise: typeof minimise = (board, alpha, beta, depth) => {
  const [isTerminal, winner] = terminal(board);
  if (isTerminal) {
    return [null, winner];
  }
  if (depth === 0) {
    return [null, evaluation(board)];
  }
  const successors = getSuccessors(board, [proximityPrune]);
  let maxVal = -Infinity;
  let bestMove: Point | null = null;

  for (const successor of successors) {
    const newBoard = makeMove(board, successor, Cell.BLACK);
    const [_, value] = minimise(newBoard, alpha, beta, depth - 1);
    if (value > maxVal) {
      maxVal = value;
      bestMove = successor;
    }

    if (value >= beta) {
      break; // beta cut-off
    }
    alpha = Math.max(alpha, value);
  }

  return [bestMove, maxVal];

};
