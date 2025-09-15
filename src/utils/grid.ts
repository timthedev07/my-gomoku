import { Board, Point } from "@/logic/board";

export const distance = (p1: [number, number], p2: [number, number]) => {
  return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
};

/**
 * Returns a negative value for white sequences
 * and a positive value for black sequences
 */
export const longestSequenceAlongDirection = (
  board: Board,
  start: Point,
  direction: Point,
  skipFirst: boolean = true) => {
  const [i0, j0] = start;
  const [dRow, dCol] = direction;

  let i = skipFirst ? i0 + dRow : i0;
  let j = skipFirst ? j0 + dCol : j0;

  try {
    const val = board[i][j];
    let s = 0;

    while (i >= 0 && i < board.length && j >= 0 && j < board.length && board[i][j] === val && val !== 0) {
      s += val;
      i += dRow;
      j += dCol;
    }
    return s;

  } catch {
    return 0;
  }
}

