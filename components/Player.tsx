import React from 'react';
import { Player as PlayerType, GameStage, Card as CardType } from '../types';
import CardComponent from './Card';

interface PlayerProps {
  player: PlayerType;
  isCurrentPlayer: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  gameStage: GameStage;
  isWinner: boolean;
  winningCards?: CardType[];
}

const Player: React.FC<PlayerProps> = ({ player, isCurrentPlayer, isDealer, isSmallBlind, isBigBlind, gameStage, isWinner, winningCards }) => {
  const showCards = (gameStage === GameStage.Showdown || !player.isAI) && !player.isEliminated;

  const playerContainerClasses = `relative p-1 sm:p-2 rounded-lg transition-all duration-300 w-fit ${
    isWinner && gameStage === GameStage.Showdown ? 'bg-yellow-400/30 ring-1 ring-yellow-400' :
    isCurrentPlayer ? 'bg-yellow-400/20 ring-1 ring-yellow-400' : 'bg-black/30'
  } ${player.isEliminated ? 'opacity-40' : ''}`;

  return (
    <div className={playerContainerClasses}>
      
      {player.comment && !player.isEliminated && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max max-w-[120px] sm:max-w-[160px] z-20">
          <div className="bg-white text-gray-800 text-center text-xs font-semibold p-1 rounded-md shadow-lg relative animate-fade-in">
            {player.comment}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-7px] w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-white"></div>
          </div>
        </div>
      )}

      <div className="text-center">
        <p className={`font-bold text-sm sm:text-base ${player.hasFolded || player.isEliminated ? 'text-gray-500 line-through' : 'text-white'} truncate max-w-[80px] sm:max-w-28`}>{player.name}</p>
        <p className={`font-semibold text-xs sm:text-sm ${player.stack === 0 && !player.isEliminated ? 'text-red-500' : 'text-yellow-300'}`}>
          ${player.stack}
        </p>
      </div>
      <div className="flex justify-center items-center space-x-1 h-20 sm:h-24 md:h-28">
        {player.hand.map(card => {
          const isWinningHandCard = showCards && winningCards?.some(wc => wc.id === card.id);
          return <CardComponent key={card.id} card={card} isFaceDown={!showCards || player.hasFolded} isWinningHandCard={isWinningHandCard} />;
        })}
        {player.hand.length === 0 && Array(2).fill(0).map((_, i) => <div key={i} className="w-9 h-14 sm:w-12 sm:h-20 md:w-16 md:h-24" />)}
      </div>
      
      {player.currentBet > 0 && !player.isEliminated && (
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-gray-800 px-2 py-0.5 rounded-full text-xs font-semibold text-white border border-yellow-500">
             💰 ${player.currentBet}
          </div>
      )}

      {!player.isEliminated && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex space-x-1.5">
            {isDealer && <div className="bg-white text-blue-900 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-sm shadow-md">⚽</div>}
            {isSmallBlind && <div className="bg-gray-200 text-gray-800 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-md">SB</div>}
            {isBigBlind && <div className="bg-gray-800 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-md">BB</div>}
        </div>
      )}
      
      {player.hasFolded && !player.isEliminated && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
          <p className="text-red-500 text-lg sm:text-xl font-black transform -rotate-12">CORREU!</p>
        </div>
      )}
       {player.isAllIn && !player.hasFolded && !player.isEliminated && (
        <div className="absolute inset-0 bg-yellow-900/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
          <p className="text-yellow-300 text-lg sm:text-xl font-black transform -rotate-12">ALL-IN!</p>
        </div>
      )}
      {player.isEliminated && (
         <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg z-10 animate-fade-in">
            <div className="relative flex items-center justify-center">
                <div className="text-4xl sm:text-5xl">👮</div>
                <div className="absolute w-6 h-9 sm:w-8 sm:h-12 bg-red-600 rounded-sm shadow-lg transform rotate-12 border border-black ml-4 sm:ml-6 mb-3"></div>
            </div>
            <p className="text-white text-xl sm:text-2xl font-black mt-1 transform -rotate-6">FORA!</p>
        </div>
      )}
    </div>
  );
}

export default Player;