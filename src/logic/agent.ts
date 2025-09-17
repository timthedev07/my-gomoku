import { distance } from "@/utils/grid";
import { Point, Cell, Board, getSuccessors, Player, makeMove, terminal, proximityPrune, ThreatsMap, updateThreatsMap, Threat } from "./board";

export const nextMove = (
  board: Board, // assumes the board is non-terminal
  player: Player, // the player for which to suggest a move
  threatsMap: ThreatsMap
) => {
  return minimax(board, 3, player, new Map(threatsMap))[0];
}



/**
 * Returns a score between -1 and 1
 * assumes a non-terminal board
 */
export const evaluation = (board: Board, threatsMap: ThreatsMap) => {
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


  const k = 1 / 3;
  let blackThreats = 0;
  let whiteThreats = 0;
  for (const threat of threatsMap.values()) {
    if (threat.player === Cell.BLACK) {
      blackThreats++;
    } else if (threat.player === Cell.WHITE) {
      whiteThreats++;
    }
  }
  const diffThreatsTanh = Math.tanh(k * (blackThreats - whiteThreats));


  const weights = [0.1, 0.2, 0.7];
  const scores = [centerDiffTanh, distAvgDiffTanh, diffThreatsTanh];


  return weights.map((w, i) => w * scores[i]).reduce((a, b) => a + b, 0);
}

// this searches through existing threats and attempts to find winning sequences
// if no explicit winning sequence is found
// it will then attempt to connect independent threats into a winning sequence
// if all else fails, it will return null;
export const tss = (board: Board, player: Player, threatsMap: ThreatsMap) => {
  const userThreats: Set<Threat> = new Set();
}

export const minimax = (board: Board, depth: number, player: Player, threatsMap: ThreatsMap) => {
  if (player === Cell.BLACK) {
    return maximise(board, -Infinity, Infinity, depth, threatsMap);
  } else {
    return minimise(board, -Infinity, Infinity, depth, threatsMap);
  }

};

export const minimise = (board: Board, alpha: number, beta: number, depth: number, threatsMap: ThreatsMap): [Point | null, number] => {
  const [isTerminal, winner] = terminal(board);
  if (isTerminal) {
    return [null, winner];
  }
  if (depth === 0) {
    return [null, evaluation(board, threatsMap)];
  }
  const successors = getSuccessors(board, [proximityPrune]);
  let minVal = Infinity;
  let bestMove: Point | null = null;

  const tssResult = tss(board, Cell.WHITE, threatsMap);

  for (const successor of successors) {
    const newBoard = makeMove(board, successor, Cell.WHITE);
    // TODO
    const updatedThreatsMap = updateThreatsMap(threatsMap, newBoard, successor);
    const [_, value] = maximise(newBoard, alpha, beta, depth - 1, updatedThreatsMap);
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

export const maximise: typeof minimise = (board, alpha, beta, depth, threatsMap) => {
  const [isTerminal, winner] = terminal(board);
  if (isTerminal) {
    return [null, winner];
  }
  if (depth === 0) {
    return [null, evaluation(board, threatsMap)];
  }
  const successors = getSuccessors(board, [proximityPrune]);
  let maxVal = -Infinity;
  let bestMove: Point | null = null;

  for (const successor of successors) {
    const newBoard = makeMove(board, successor, Cell.BLACK);
    // TODO
    const updatedThreatsMap = updateThreatsMap(threatsMap, newBoard, successor);
    const [_, value] = minimise(newBoard, alpha, beta, depth - 1, updatedThreatsMap);
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
