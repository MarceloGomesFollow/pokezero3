import React, { useState } from 'react';
import { DEFAULT_AI_NAMES } from '../constants';

interface GameSetupProps {
  onStartGame: (names: { player: string; ais: string[] }) => void;
  onReturnToMenu: () => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onStartGame, onReturnToMenu }) => {
  const [playerName, setPlayerName] = useState('Brasil FC');
  const [numAIs, setNumAIs] = useState(2);
  const [aiNames, setAiNames] = useState<string[]>(DEFAULT_AI_NAMES.slice(0, 5));

  const handleAiNameChange = (index: number, name: string) => {
    const newAiNames = [...aiNames];
    newAiNames[index] = name;
    setAiNames(newAiNames);
  };
  
  const handleNumAIsChange = (num: number) => {
    setNumAIs(num);
    const newAiNames = [...aiNames];
    while(newAiNames.length < num) {
        newAiNames.push(DEFAULT_AI_NAMES[newAiNames.length] || `AI ${newAiNames.length + 1}`);
    }
    setAiNames(newAiNames);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Request fullscreen for a more immersive experience
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        // Silently fail if fullscreen is not supported or rejected
        console.log(`Could not enter fullscreen mode: ${err.message}`);
      });
    }

    onStartGame({
      player: playerName,
      ais: aiNames.slice(0, numAIs),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-900 bg-opacity-80 p-4">
      <div className="bg-green-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg border-2 border-yellow-400/50 relative" style={{backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23059669' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`}}>
        <button
            onClick={onReturnToMenu}
            className="absolute top-2 left-2 text-sm text-yellow-300/70 hover:text-yellow-300 hover:underline focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded"
        >
            &larr; Voltar
        </button>
        <h1 className="text-2xl sm:text-4xl font-black text-center mb-2 text-yellow-300 drop-shadow-lg">POKERZERO3 FUTEBOL CLUBE</h1>
        <p className="text-center text-gray-300 mb-6 sm:mb-8">Monte seu time e domine o torneio de Texas Hold'em!</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="playerName" className="block text-sm font-semibold text-yellow-300 mb-1">Seu Nome / Time</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="mt-1 block w-full bg-black/20 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-yellow-300 mb-1">Número de Oponentes</label>
            <select
              value={numAIs}
              onChange={(e) => handleNumAIsChange(Number(e.target.value))}
              className="mt-1 block w-full bg-black/20 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value={1}>1 Oponente</option>
              <option value={2}>2 Oponentes</option>
              <option value={3}>3 Oponentes</option>
              <option value={4}>4 Oponentes</option>
              <option value={5}>5 Oponentes</option>
            </select>
          </div>

          {Array.from({ length: numAIs }).map((_, index) => (
            <div key={index}>
              <label htmlFor={`aiName${index}`} className="block text-sm font-semibold text-gray-300 mb-1">Nome do Oponente {index + 1}</label>
              <input
                id={`aiName${index}`}
                type="text"
                value={aiNames[index] || ''}
                onChange={(e) => handleAiNameChange(index, e.target.value)}
                className="mt-1 block w-full bg-black/20 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                required
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-lg font-bold text-green-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-green-800 transition-all transform hover:scale-105"
          >
            Começar o Torneio!
          </button>
        </form>
      </div>
    </div>
  );
};

export default GameSetup;
