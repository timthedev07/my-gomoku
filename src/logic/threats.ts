import {
  Board,
  getAllAffectedWindows,
  getWindowContent,
  Player,
  Point,
  windowHasThreat,
  WindowID,
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
