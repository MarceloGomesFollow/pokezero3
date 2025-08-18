
import React from 'react';
import { Player } from '../types';

interface ScoreboardProps {
  players: Player[];
  aiTeam: string;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ players, aiTeam }) => {
  const humanPlayer = players.find(p => !p.isAI);
  const aiPlayers = players.filter(p => p.isAI);

  const playerScore = humanPlayer?.handsWon ?? 0;
  const aiScore = aiPlayers.reduce((sum, p) => sum + p.handsWon, 0);
  const playerTeam = humanPlayer?.name ?? 'Jogador';

  return (
    <div className="w-full max-w-xs mx-auto bg-black/60 rounded-md p-1 px-2 shadow-lg border border-yellow-400/50 backdrop-blur-sm">
      <div className="flex justify-between items-center text-white">
        <span className="text-base sm:text-lg font-bold text-yellow-300 truncate pr-2" title={playerTeam}>{playerTeam}</span>
        <span className="text-xl sm:text-2xl font-black bg-gray-900/80 px-2 sm:px-3 py-0.5 rounded-sm">
          {playerScore} x {aiScore}
        </span>
        <span className="text-base sm:text-lg font-bold text-gray-300 truncate pl-2">{aiTeam}</span>
      </div>
    </div>
  );
};

export default Scoreboard;