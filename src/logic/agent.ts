import { distance } from "@/utils/grid";
import {
  Point,
  Cell,
  Board,
  getSuccessors,
  Player,
  makeMove,
  terminal,
  proximityPrune,
} from "./board";
import { computeCostSquares, ThreatsMap, updateThreatsMap } from "./threats";

export const nextMove = (
  board: Board, // assumes the board is non-terminal
  player: Player, // the player for which to suggest a move
  threatsMap: ThreatsMap,
) => {
  const s = minimax(board, 3, player, threatsMap);
  console.log(s[1]);
  return s[0];
};

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
    return sum / Math.max(1, (n * (n - 1)) / 2);
  };

  const whiteAvg = averageDistance(Cell.WHITE);
  const blackAvg = averageDistance(Cell.BLACK);
  // if negative, then black is more spread out, so better situation for white
  const distAvgDiffTanh = Math.tanh(whiteAvg - blackAvg);

  // heuristic 2: center control
  const averageDistanceToCenter = (player: Player) => {
    const center: [number, number] = [
      (board.length - 1) / 2,
      (board.length - 1) / 2,
    ];
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
  };
  const whiteCenter = averageDistanceToCenter(Cell.WHITE);
  const blackCenter = averageDistanceToCenter(Cell.BLACK);
  const centerDiffTanh = Math.tanh(whiteCenter - blackCenter);

  let blackThreats = 0;
  let whiteThreats = 0;
  for (const threat of threatsMap.values()) {
    if (threat.player === Cell.BLACK) {
      blackThreats++;
    } else if (threat.player === Cell.WHITE) {
      whiteThreats++;
    }
  }
  const diffThreatsTanh = Math.tanh(blackThreats - whiteThreats);
  if (board[3][4] === Cell.WHITE)
    console.log({ blackThreats, whiteThreats, threatsMap });

  const weights = [0, 0, 1];
  const scores = [centerDiffTanh, distAvgDiffTanh, diffThreatsTanh];

  return weights.map((w, i) => w * scores[i]).reduce((a, b) => a + b, 0);
};

/*
 * Pick a cost square that will be played by `oppponent`
 */
const orderCostSquares = (
  costSquares: Point[],
  board: Board,
  threatsMap: ThreatsMap,
  opponent: Player,
): Point[] => {
  // TODO
  return costSquares;
};

// this searches through existing threats and attempts to find winning sequences
// if no explicit winning sequence is found
// it will then attempt to connect independent threats into a winning sequence
// if all else fails, it will return null;
export const tss = (
  board: Board,
  player: Player,
  threatsMap: ThreatsMap,
  successors: Point[],
): Point[] | null => {
  for (const successor of successors) {
    const boardPostSucc = makeMove(board, successor, player);
    const [isTerminal, winner] = terminal(boardPostSucc);
    if (isTerminal && winner === player) {
      return [successor];
    }
    if (isTerminal && winner === -player) {
      continue;
    }

    const updatedThreatsMap = updateThreatsMap(
      threatsMap,
      boardPostSucc,
      successor,
    );
    if (updatedThreatsMap.size === threatsMap.size) {
      continue;
    }

    let successfulSubsequence: Point[] | null = null;

    for (const [k, v] of updatedThreatsMap) {
      const costSquares = computeCostSquares(boardPostSucc, v);
      if (!costSquares.length) {
        updatedThreatsMap.delete(k);
      }
      const orderedCostSquares = orderCostSquares(
        costSquares,
        boardPostSucc,
        updatedThreatsMap,
        -player,
      );

      for (const costSquare of orderedCostSquares) {
        const boardWithBlock = makeMove(boardPostSucc, costSquare, -player);
        const postBlockThreats = updateThreatsMap(
          updatedThreatsMap,
          boardWithBlock,
          costSquare,
        );

        const result = tss(
          boardWithBlock,
          player,
          postBlockThreats,
          getSuccessors(board, [proximityPrune]),
        );

        // if there is any way the opponent can block, then this is not a forced win
        if (result === null) {
          continue;
        }
        successfulSubsequence = result;
      }
      return [successor, ...(successfulSubsequence ?? [])];
    }
  }
  return null;
};

export const minimax = (
  board: Board,
  depth: number,
  player: Player,
  threatsMap: ThreatsMap,
) => {
  if (player === Cell.BLACK) {
    return maximise(board, -Infinity, Infinity, depth, threatsMap);
  } else {
    return minimise(board, -Infinity, Infinity, depth, threatsMap);
  }
};

export const minimise = (
  board: Board,
  alpha: number,
  beta: number,
  depth: number,
  threatsMap: ThreatsMap,
): [null | Point[], number] => {
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

  try {
    const tssResult = tss(board, Cell.WHITE, threatsMap, successors);
    if (tssResult !== null) {
      return [tssResult, -1];
    }
  } catch {}

  for (const successor of successors) {
    const newBoard = makeMove(board, successor, Cell.WHITE);
    const updatedThreatsMap = updateThreatsMap(threatsMap, newBoard, successor);
    const [, value] = maximise(
      newBoard,
      alpha,
      beta,
      depth - 1,
      updatedThreatsMap,
    );
    if (value < minVal) {
      minVal = value;
      bestMove = successor;
    }

    if (value <= alpha) {
      break; // alpha cut-off
    }
    beta = Math.min(beta, value);
  }

  return [bestMove ? [bestMove] : null, minVal];
};

export const maximise: typeof minimise = (
  board,
  alpha,
  beta,
  depth,
  threatsMap,
) => {
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

  try {
    const tssResult = tss(board, Cell.BLACK, threatsMap, successors);
    if (tssResult !== null) {
      return [tssResult, 1];
    }
  } catch {}

  for (const successor of successors) {
    const newBoard = makeMove(board, successor, Cell.BLACK);
    const updatedThreatsMap = updateThreatsMap(threatsMap, newBoard, successor);
    const [, value] = minimise(
      newBoard,
      alpha,
      beta,
      depth - 1,
      updatedThreatsMap,
    );
    if (value > maxVal) {
      maxVal = value;
      bestMove = successor;
    }

    if (value >= beta) {
      break; // beta cut-off
    }
    alpha = Math.max(alpha, value);
  }

  return [bestMove ? [bestMove] : null, maxVal];
};

// for testing; from the paper
export const exampleBoard: Board = [
  [1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, -1, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
];
