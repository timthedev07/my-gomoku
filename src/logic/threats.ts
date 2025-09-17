import {
  Board,
  getAllAffectedWindows,
  getWindowContent,
  Player,
  Point,
  WindowID,
  Cell,
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
  threatsMap: ThreatsMap,
  board: Board,
  action: Point,
) => {
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

/*
 * Given a window of length 7, return:
 *  1 if there is a threat for black
 *  -1 if there is a threat for white
 *  0 otherwise
 */
export const windowHasThreat = (
  windowContent: Cell[],
  window: WindowID,
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
  const hasOpenEnds =
    windowContent[0] === Cell.EMPTY && windowContent[5] === Cell.EMPTY;
  if (hasOpenEnds) {
    const r = windowContent[1];
    const occupyNearEnds =
      r !== Cell.EMPTY &&
      windowContent[4] !== Cell.EMPTY &&
      r === windowContent[4];

    if (occupyNearEnds) {
      if (windowContent[2] === r || windowContent[3] === r) {
        if (r === Cell.BLACK) return 1;
        else if (r === Cell.WHITE) return -1;
      }
    }
  }
  return 0;
};
