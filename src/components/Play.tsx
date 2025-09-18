import { exampleBoard, nextMove, tss } from "@/logic/agent";
import {
  computeCostSquares,
  ThreatsMap,
  updateThreatsMap,
} from "@/logic/threats";
import {
  Player,
  getInitialBoard,
  terminal,
  makeMove,
  Cell,
  DIM,
  Point,
  getSuccessors,
  proximityPrune,
  getWindowContent,
  WindowID,
} from "@/logic/board";
import { areThreatMapsEqual } from "@/utils/obj";
import {
  useState,
  FC,
  Fragment,
  PropsWithChildren,
  useEffect,
  memo,
} from "react";
import { Stage, Layer, Line, Circle } from "react-konva";
import colors from "tailwindcss/colors";

const CELL_SIZE = 40; // pixels
const BOARD_PIXEL_SIZE = (DIM - 1) * CELL_SIZE;
const lineWidth = 2;

const iter = Array.from({ length: DIM });

interface PlayProps extends PropsWithChildren {
  userPlayer: Player | null;
}

const Component: FC<PlayProps> = ({ userPlayer }) => {
  const [board, setBoard] = useState<number[][]>(() => getInitialBoard());
  const [prevBoard, setPrevBoard] = useState<number[][] | null>(null);
  const [isTerminal, setIsTerminal] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [threatsMap, setThreatsMap] = useState<ThreatsMap>(new Map());
  const [prevThreatsMap, setPrevThreatsMap] = useState<ThreatsMap>(new Map());
  const [agentBuffer, setAgentBuffer] = useState<Point[]>([]);

  useEffect(() => {
    if (userPlayer === Cell.WHITE) {
      setBoard((b) => {
        const move = [Math.floor(DIM / 2), Math.floor(DIM / 2)] as Point;
        const newBoard = makeMove(b, move, Cell.BLACK);
        setPrevBoard(newBoard);
        const updatedThreatsMap = updateThreatsMap(new Map(), newBoard, move);
        setPrevThreatsMap(updatedThreatsMap);
        return newBoard;
      });
    }
  }, [userPlayer]);

  useEffect(() => {
    let cancelled = false;

    const makeAiMove = () => {
      if (
        cancelled ||
        !userPlayer ||
        !areThreatMapsEqual(prevThreatsMap, threatsMap) ||
        JSON.stringify(prevBoard) === JSON.stringify(board) ||
        JSON.stringify(board) === JSON.stringify(getInitialBoard())
      )
        return;
      setBoard((b) => {
        // if found winning sequence in buffer, play it
        if (agentBuffer.length > 0) {
          const move = agentBuffer[0];
          const newBoard = makeMove(b, move, -userPlayer);
          setAgentBuffer((buf) => buf.slice(1));
          setPrevBoard(newBoard);
          setThreatsMap((m) => {
            const updated = updateThreatsMap(
              m,
              newBoard,
              move as [number, number],
            );
            setPrevThreatsMap(updated);
            return updated;
          });
          return newBoard;
        }

        const aiMove = nextMove(b, -userPlayer, threatsMap);
        if (!aiMove) {
          return b;
        }

        if (aiMove.length > 1) {
          setAgentBuffer(aiMove.slice(1));
        }
        const nextAgentMove = aiMove[0];

        const aiBoard = makeMove(b, nextAgentMove, -userPlayer);
        setPrevBoard(aiBoard);

        setThreatsMap((m) => {
          const updated = updateThreatsMap(m, aiBoard, nextAgentMove);
          setPrevThreatsMap(updated);
          return updated;
        });
        return aiBoard;
      });
    };

    makeAiMove();

    return () => {
      cancelled = true;
    };
  }, [board, prevBoard, userPlayer, threatsMap, prevThreatsMap, agentBuffer]);

  if (!userPlayer) return <></>;

  return (
    <main className="relative mt-18 mb-48 p-8 bg-[#a9774d] border border-[#b6a075] rounded-lg shadow-2xl flex flex-col items-center justify-center">
      <div
        className={`flex justify-center items-center ${
          !!winner ? "block" : "hidden"
        } rounded-lg glass bg-gray-800/50 w-full h-full z-20 absolute`}
      >
        {winner === Cell.BLACK
          ? "Black wins!"
          : winner === Cell.WHITE
            ? "White wins!"
            : "It's a draw!"}
      </div>

      <div
        id="board"
        className="relative mx-auto flex items-center justify-center"
      >
        <div
          style={{
            gridTemplateRows: `repeat(${DIM}, minmax(0, 1fr))`,
            gridTemplateColumns: `repeat(${DIM}, minmax(0, 1fr))`,
            gap: `${CELL_SIZE}px`,
          }}
          className={`z-10 absolute w-full h-full grid`}
        >
          {iter.map((_, i) => (
            <Fragment key={i}>
              {iter.map((_, j) => (
                <button
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    transform: "translate(-50%, -50%)",
                  }}
                  className={`row-start-[${i + 1}] col-start-[${
                    j + 1
                  }] text-center transform`}
                  key={`${i}-${j}`}
                  onClick={() => {
                    if (!userPlayer) return;

                    setBoard((b) => {
                      const newBoard = makeMove(b, [i, j], userPlayer);
                      const [_isTerminal, _winner] = terminal(newBoard);
                      setIsTerminal(_isTerminal);
                      setThreatsMap((m) => {
                        const updatedMap = updateThreatsMap(m, newBoard, [
                          i,
                          j,
                        ] as [number, number]);
                        return updatedMap;
                      });
                      if (_isTerminal && _winner !== Cell.EMPTY) {
                        setWinner(_winner);
                      }
                      return newBoard;
                    });
                  }}
                  disabled={isTerminal || board[i][j] !== Cell.EMPTY}
                >
                  {board[i][j] === Cell.EMPTY ? (
                    <div
                      className={`mx-auto w-6 h-6 cursor-pointer rounded-full transition ease-in duration-150 bg-transparent hover:bg-cyan-500/40 ${
                        isTerminal ? "hidden" : "block"
                      }`}
                    ></div>
                  ) : board[i][j] === Cell.BLACK ? (
                    <div className="w-6 h-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full mx-auto"></div>
                  ) : board[i][j] === Cell.WHITE ? (
                    <div className="w-6 h-6 bg-gradient-to-br from-white to-gray-300 rounded-full mx-auto border border-gray-500"></div>
                  ) : null}
                </button>
              ))}
            </Fragment>
          ))}
        </div>

        <Stage width={BOARD_PIXEL_SIZE} height={BOARD_PIXEL_SIZE} className="">
          <Layer>
            {iter.map((_, i) => (
              <Fragment key={i}>
                <Line
                  points={[0, i * CELL_SIZE, BOARD_PIXEL_SIZE, i * CELL_SIZE]}
                  strokeWidth={
                    i === 0 || i === DIM - 1 ? lineWidth : 0.5 * lineWidth
                  }
                  stroke={colors.gray[900]}
                />
                <Line
                  points={[i * CELL_SIZE, 0, i * CELL_SIZE, BOARD_PIXEL_SIZE]}
                  strokeWidth={
                    i === 0 || i === DIM - 1 ? lineWidth : 0.5 * lineWidth
                  }
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
};

export const Play = memo(Component);
