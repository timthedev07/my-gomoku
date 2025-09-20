import { isPointInBounds } from "@/utils/grid";
import {
  Board,
  getAllAffectedWindows,
  getWindowContent,
  Player,
  Point,
  WindowID,
  Cell,
  dirKeyToVec,
  WINDOW_SIZE,
} from "./board";

export interface Threat {
  player: Player;
  window: WindowID;
}

export type ThreatsMap = Map<string, Threat>; // key is `${startRow}_${startCol}_${direction}`

export const getThreatMapKey = (window: WindowID) => {
  const [a, b] = window[0];
  return `${a}_${b}_${window[1]}`;
};

/**
 * computes computes the udpated set of threats after a move
 *
 * the board is assumed to be updated already by `action`
 */
export const updateThreatsMap = (
  _threatsMap: ThreatsMap,
  board: Board,
  action: Point
) => {
  const threatsMap = structuredClone(_threatsMap);
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
        threatsMap.set(key, { player: hasThreat, window });
      }
    } else {
      // no previous threat
      if (hasThreat !== 0) {
        threatsMap.set(key, { player: hasThreat, window });
      }
    }
  }

  return threatsMap;
};

const isTypeEThreat = (windowContent: Cell[]): Cell => {
  const hasOpenEnds =
    windowContent[0] === Cell.EMPTY && windowContent[5] === Cell.EMPTY;
  if (hasOpenEnds) {
    const r = windowContent[1];
    const occupyNearEnds = r !== Cell.EMPTY && r === windowContent[4];

    if (occupyNearEnds) {
      if (windowContent[2] === r || windowContent[3] === r) {
        if (r === Cell.BLACK) return 1;
        else if (r === Cell.WHITE) return -1;
      }
    }
  }
  return 0;
};

/*
 * Returns [threateningPlayer, costSquare]
 */
const isTypeFThreat = (
  windowContent: Cell[],
  window: WindowID
): [Cell, Point | null] => {
  const [i, j] = window[0];
  const dir = dirKeyToVec(window[1]);

  const findPattern = (
    start: number,
    end: number
  ): ReturnType<typeof isTypeFThreat> => {
    const subwindow = windowContent.slice(start, end);
    // front check only if at edge
    const s = subwindow[0];
    const occupyEnds = s === subwindow[4] && s !== Cell.EMPTY;
    if (occupyEnds) {
      if (
        subwindow[2] === Cell.EMPTY &&
        subwindow[1] === s &&
        subwindow[3] === s
      ) {
        return [s, [i + (start + 2) * dir[0], j + (start + 2) * dir[1]]];
      } else if (subwindow[2] === s) {
        if (subwindow[1] === Cell.EMPTY && subwindow[3] === s) {
          return [s, [i + (start + 1) * dir[0], j + (start + 1) * dir[1]]];
        } else if (subwindow[1] === s && subwindow[3] === Cell.EMPTY) {
          return [s, [i + (start + 3) * dir[0], j + (start + 3) * dir[1]]];
        }
      }
    }
    return [Cell.EMPTY, null];
  };
  if (i === 0 || j === 0) {
    const [a, b] = findPattern(0, 5);
    if (a !== Cell.EMPTY) return [a, b];
  }

  return findPattern(1, 6);
};

/*
 * Given a window of length 7, return:
 *  1 if there is a threat for black
 *  -1 if there is a threat for white
 *  0 otherwise
 */
export const windowHasThreat = (
  windowContent: Cell[],
  window: WindowID
): number => {
  // check threats of type A and B (4 in a row)
  const hasAnOpenEnd =
    windowContent[0] === Cell.EMPTY || windowContent[6] === Cell.EMPTY;
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
    const hasOpenEnds =
      subwindow[0] === Cell.EMPTY && subwindow[4] === Cell.EMPTY;

    if (!hasOpenEnds) return null;

    if (subwindow.slice(1, -1).every((cell) => cell === Cell.BLACK)) {
      return 1;
    } else if (subwindow.slice(1, -1).every((cell) => cell === Cell.WHITE)) {
      return -1;
    }

    return null;
  };

  const backCheck = openThreeCheck(windowContent.slice(1, 6));
  // if window.start is at the edge of the board, also check the front
  if (window[0][0] === 0 || window[0][1] === 0) {
    const frontCheck = openThreeCheck(windowContent.slice(0, 5));
    if (frontCheck !== null) return frontCheck;
  }
  if (backCheck !== null) return backCheck;

  // check threats of type E
  // slice of size 6
  const e = isTypeEThreat(windowContent);
  if (e !== 0) return e;

  const [f] = isTypeFThreat(windowContent, window);
  if (f !== Cell.EMPTY) return f;

  return Cell.EMPTY;
};

/**
 * The squares the opponent must play to block a threat
 */
export const computeCostSquares = (board: Board, threat: Threat) => {
  const windowContent = getWindowContent(threat.window, board);
  const costSquares: Point[] = [];
  const dir = dirKeyToVec(threat.window[1]);
  const [i, j] = threat.window[0];

  // for type A and B threats (open end(s) of the 4)
  if (windowContent.slice(1, -1).every((cell) => cell === threat.player)) {
    if (windowContent[0] === Cell.EMPTY) {
      costSquares.push(threat.window[0]);
    }
    if (windowContent[6] === Cell.EMPTY) {
      costSquares.push([i + 6 * dir[0], j + 6 * dir[1]]);
    }
    return costSquares;
  }

  // for type C and D threats (both ends open)
  if (i === 0 || j === 0) {
    // if at the edge, check both front and end
    // this should exclude type D
    if (
      windowContent[4] === Cell.EMPTY &&
      windowContent[0] === Cell.EMPTY &&
      windowContent.slice(1, 4).every((cell) => cell === threat.player)
    ) {
      costSquares.push([i, j]);
      costSquares.push([i + 4 * dir[0], j + 4 * dir[1]]);
      return costSquares;
    }
  }
  if (windowContent.slice(2, 5).every((cell) => cell === threat.player)) {
    // this should not interfere with logic for type E
    if (windowContent[1] === Cell.EMPTY) {
      // if first cell is empty
      costSquares.push([i + dir[0], j + dir[1]]);
    }
    if (windowContent[5] === Cell.EMPTY) {
      // if last cell is empty
      costSquares.push([i + 5 * dir[0], j + 5 * dir[1]]);
    }
  }

  // for type D threats
  const p = [i + WINDOW_SIZE * dir[0], j + WINDOW_SIZE * dir[1]] as Point;
  if (windowContent[0] === -threat.player) {
    if (isPointInBounds(p) && board[p[0]][p[1]] === Cell.EMPTY) {
      costSquares.push(p);
    }
    return costSquares;
  } else if (isPointInBounds(p) && board[p[0]][p[1]] === -threat.player) {
    if (windowContent[0] === Cell.EMPTY) {
      costSquares.push([i, j]);
    }
    return costSquares;
  }

  // type E threats
  if (isTypeEThreat(windowContent) === threat.player) {
    costSquares.push([i, j]);
    costSquares.push([i + 5 * dir[0], j + 5 * dir[1]]);
    if (windowContent[2] === Cell.EMPTY) {
      costSquares.push([i + 2 * dir[0], j + 2 * dir[1]]);
    } else {
      costSquares.push([i + 3 * dir[0], j + 3 * dir[1]]);
    }
    return costSquares;
  }

  const [threatPlayer, costSquare] = isTypeFThreat(
    windowContent,
    threat.window
  );
  if (threatPlayer === threat.player && !!costSquare) {
    costSquares.push(costSquare);
  }

  return costSquares;
};
