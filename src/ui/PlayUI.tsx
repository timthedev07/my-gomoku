"use client";

import { Play } from '../components/Play'
import { Player, Cell } from "@/logic/board";
import { LeftPersonSVG } from '@/svg/leftPerson';
import { RightPersonSVG } from '@/svg/rightPerson';
import { useState } from 'react';

const selectStyle = "bg-transparent transition ease-in-out duration-200 hover:bg-gray-400/30 hover:scale-105 p-6 rounded-lg shadow-lg cursor-pointer";

export const PlayUI = () => {
  const [userPlayer, setUserPlayer] = useState<Player | null>(null);

  const select = (player: Player) => {
    return () => setUserPlayer(player);
  }

  return (

    <>
      {!userPlayer ? <div className="mt-24 flex flex-col items-center justify-center space-y-4">
        <div className="flex mt-12 justify-">
          <div className={`${selectStyle} mr-18`} onClick={select(Cell.BLACK)}>
            <div className="pb-4">
              Play as black
            </div>
            <LeftPersonSVG className="w-48 flex-1 text-gray-800" />
          </div>
          <div className={`${selectStyle}`} onClick={select(Cell.WHITE)}>
            <div className="pb-4">
              Play as white
            </div>
            <RightPersonSVG className="w-48 flex-1 text-gray-400" />
          </div>
        </div>
      </div> : <></>}
      <Play userPlayer={userPlayer} updateWinner={(w) => setUserPlayer(w)} />
    </>
  )
}
