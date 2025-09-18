# my-gomoku

An agent that can play strategically against a human!

## Threats

- A threat is an arrangement that creates a potential winning opportunity that the opponent must immediately counter.
- A threat sequence is a series of moves in which each leads to a threat that the opponent must respond to.
- A double threat is a situation where two threats are created simultaneously, making it impossible for the opponent to block both.
- A winning threat sequence is a series of moves that give rise to a double threat, leading to an inevitable win.

We have the following types of threats (Allis, 1994):

![img](mdassets/1.png)

## Reducing the Search Space

Consider forced moves: Suppose we have an immediate threat, such as an unblocked three, then, we should prioritise the subsequent moves that result from the opponent blocking that threat in all possible ways. Or, suppose we have a threat of four, then we can just consider what happens after the opponent blocks that threat, because we know the opponent must take that move.

The following definitions are in place to help describe the threat-space search:

1. The **gain square** is the square played by the attacker to create a threat.
2. The **cost square** of a threat is the square that the opponent must play to block the threat.

## The TSS

My proposed algorithm is as follows

```
TSS(board, threatsMap, player) -> winning sequence, if any {
  for each succcessor {
    compute updated board without mutating the original board
    compute terminal
    if terminal = win(player) {
      return successor
    }
    if successor gives an immediate loss OR {
      continue to next successor
    }
    compute updatedThreatsMap;
    if no new threats {
      continue
    }

    for each threat in updatedThreatsMap {
      compute cost squares
      pick one cost square (arbitrarily or heuristically?)
      compute newBoard = makeMove(board, costSsquare, opponent)
      compute newThreatsMap
      result = TSS(newBoard, newThreatsMap, player)
      if result != null {
        return [successor] + result
      }
    }
  }
  return null;
}
```
