import { Board, getSuccessors, Player } from "./board";

export const nextMove = (
  board: Board, // assumes the board is non-terminal
  player: Player, // the player for which to suggest a move
) => {
  const successors = getSuccessors(board);

  return successors[Math.floor(Math.random() * successors.length)];
}
