import { nextMove } from '@/logic/agent';
import { Player, getInitialBoard, terminal, makeMove, Cell, DIM } from '@/logic/board';
import { useState, FC, Fragment, PropsWithChildren, useEffect, memo } from 'react';
import { Stage, Layer, Line, Circle } from "react-konva"
import colors from "tailwindcss/colors"

const CELL_SIZE = 40; // pixels
const BOARD_PIXEL_SIZE = (DIM - 1) * CELL_SIZE;
const lineWidth = 2;

const iter = Array.from({ length: DIM });

interface PlayProps extends PropsWithChildren {
  userPlayer: Player | null;
  updateWinner: (winner: Player) => void;
}

const Component: FC<PlayProps> = ({ userPlayer, updateWinner }) => {
  const [board, setBoard] = useState<number[][]>(() => getInitialBoard());
  const [isTerminal, setIsTerminal] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);

  useEffect(() => {
    if (userPlayer === Cell.WHITE) {
      setBoard(b => {
        const newBoard = makeMove(b, nextMove(b, Cell.BLACK), Cell.BLACK);
        return newBoard;
      });
    }
  }, [userPlayer]);

  if (!userPlayer) return <></>;



  const userMakeMove = (i: number, j: number) => {
    return () => {
      if (!userPlayer) return;
      setBoard(b => {
        const newBoard = makeMove(b, [i, j], userPlayer)
        const [_isTerminal, _winner] = terminal(newBoard);
        setIsTerminal(_isTerminal);
        if (_isTerminal && _winner !== Cell.EMPTY) {
          setWinner(_winner);
          updateWinner(_winner);
        }

        const aiMove = nextMove(newBoard, -userPlayer);

        const aiBoard = makeMove(newBoard, aiMove, -userPlayer);

        return aiBoard;
      });
    };
  }

  return (
    <main className="mt-18 mb-48 p-8 bg-[#a9774d] border border-[#b6a075] rounded-lg shadow-2xl flex flex-col items-center justify-center">
      <div id="board" className="relative mx-auto flex items-center justify-center">
        <div style={{
          "gridTemplateRows": `repeat(${DIM}, minmax(0, 1fr))`,
          "gridTemplateColumns": `repeat(${DIM}, minmax(0, 1fr))`,
          "gap": `${CELL_SIZE}px`,
        }} className={`z-10 absolute w-full h-full grid`} >
          {iter.map((_, i) => (<Fragment key={i}>
            {iter.map((_, j) => (
              <button
                style={{ width: CELL_SIZE, height: CELL_SIZE, transform: "translate(-50%, -50%)" }}
                className={
                  `row-start-[${i + 1}] col-start-[${j + 1}] text-center transform`
                } key={`${i}-${j}`}
                onClick={userMakeMove(i, j)}
                disabled={isTerminal || board[i][j] !== Cell.EMPTY}
              >
                {board[i][j] === Cell.EMPTY ? (
                  <div className={`mx-auto w-6 h-6 cursor-pointer rounded-full transition ease-in duration-150 bg-transparent hover:bg-cyan-500/40 ${isTerminal ? 'hidden' : 'block'}`}></div>
                ) : board[i][j] === Cell.BLACK ? (
                  <div className="w-6 h-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full mx-auto"></div>
                ) : board[i][j] === Cell.WHITE ? (
                  <div className="w-6 h-6 bg-gradient-to-br from-white to-gray-300 rounded-full mx-auto border border-gray-500"></div>
                ) : null}
              </button>)
            )}
          </Fragment>))}

        </div>
        <Stage width={BOARD_PIXEL_SIZE} height={BOARD_PIXEL_SIZE} className="">
          <Layer>
            {iter.map((_, i) => (
              <Fragment key={i}>
                <Line
                  points={[0, i * CELL_SIZE, BOARD_PIXEL_SIZE, i * CELL_SIZE]}
                  strokeWidth={i === 0 || i === DIM - 1 ? lineWidth : 0.5 * lineWidth}
                  stroke={colors.gray[900]}
                />
                <Line
                  points={[i * CELL_SIZE, 0, i * CELL_SIZE, BOARD_PIXEL_SIZE]}
                  strokeWidth={i === 0 || i === DIM - 1 ? lineWidth : 0.5 * lineWidth}
                  stroke={colors.gray[900]}
                />
              </Fragment>
            ))}
            <Circle
              x={Math.floor(DIM / 2) * CELL_SIZE}
              y={Math.floor(DIM / 2) * CELL_SIZE}
              radius={4}
              fill={colors.gray[900]}
            />
            <Circle
              x={3 * CELL_SIZE}
              y={3 * CELL_SIZE}
              radius={4}
              fill={colors.gray[900]}
            />
            <Circle
              x={(DIM - 4) * CELL_SIZE}
              y={3 * CELL_SIZE}
              radius={4}
              fill={colors.gray[900]}
            />
            <Circle
              x={3 * CELL_SIZE}
              y={(DIM - 4) * CELL_SIZE}
              radius={4}
              fill={colors.gray[900]}
            />
            <Circle
              x={(DIM - 4) * CELL_SIZE}
              y={(DIM - 4) * CELL_SIZE}
              radius={4}
              fill={colors.gray[900]}
            />
          </Layer>
        </Stage>
      </div>
    </main>
  );
}

export const Play = memo(Component);
