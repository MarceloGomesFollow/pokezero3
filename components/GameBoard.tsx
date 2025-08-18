import React from 'react';
import { Player as PlayerType, Card as CardType, GameStage } from '../types';
import Player from './Player';
import CommunityCards from './CommunityCards';
import PlayerActions from './PlayerActions';
import Scoreboard from './Scoreboard';
import SponsorBanner from './SponsorBanner';

interface GameBoardProps {
  players: PlayerType[];
  communityCards: CardType[];
  gameStage: GameStage;
  pot: number;
  tip: string;
  winners: PlayerType[];
  winningCards: CardType[];
  tournamentWinner: PlayerType | null;
  currentPlayerId: string | null;
  dealerId: string;
  sbId: string;
  bbId: string;
  playerActions: {
    canCheck: boolean;
    canRaise: boolean;
    amountToCall: number;
    minRaise: number;
    maxRaise: number;
    onFold: () => void;
    onCheck: () => void;
    onCall: () => void;
    onRaise: (amount: number) => void;
  };
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
  message: string;
}

const GameBoard: React.FC<GameBoardProps> = (props) => {
  const { 
      players, communityCards, gameStage, pot, tip, winners, winningCards, tournamentWinner, currentPlayerId,
      dealerId, sbId, bbId, playerActions, onPlayAgain, onReturnToMenu, message 
  } = props;

  const humanPlayer = players.find(p => !p.isAI)!;
  const aiPlayers = players.filter(p => p.isAI);

  const getPlayerComponent = (player: PlayerType) => (
    <Player
      player={player}
      isCurrentPlayer={player.id === currentPlayerId && gameStage < GameStage.Showdown}
      isDealer={player.id === dealerId}
      isSmallBlind={player.id === sbId}
      isBigBlind={player.id === bbId}
      gameStage={gameStage}
      isWinner={winners.some(w => w.id === player.id)}
      winningCards={winningCards}
    />
  );
  
  return (
    <div 
      className="relative min-h-screen w-full flex flex-col items-center justify-between p-1 bg-green-700 overflow-hidden pb-32" 
      style={{
        background: '#15803d', // Tailwind green-700 fallback
        backgroundImage: `
          radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.7) 90%),
          repeating-linear-gradient(
            90deg, 
            rgba(255, 255, 255, 0.05), 
            rgba(255, 255, 255, 0.05) 40px, 
            transparent 40px, 
            transparent 80px
          ),
          radial-gradient(circle at center, #16a34a, #15803d)
        `
      }}
    >
      {/* Football Stadium Background */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-white/20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-48 sm:h-48 border-2 sm:border-4 border-white/20 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-white/20 rounded-full"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[20vh] w-[50vw] max-w-xl border-x-2 sm:border-x-4 border-b-2 sm:border-b-4 border-white/20 rounded-b-lg sm:rounded-b-2xl"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[25vh] w-[70vw] max-w-4xl border-x-2 sm:border-x-4 border-t-2 sm:border-t-4 border-white/20 rounded-t-lg sm:rounded-t-2xl"></div>
      </div>
      
      <div className="relative w-full flex flex-col sm:flex-row items-center justify-between gap-1 p-1 z-10">
        <button onClick={onReturnToMenu} className="bg-red-800/80 text-white font-bold py-1 px-3 rounded-md shadow-md hover:bg-red-700 transition-colors self-start sm:self-center">
          Menu
        </button>
        <div className="flex flex-col items-center order-first sm:order-none w-full">
          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white drop-shadow-lg uppercase tracking-wider text-center">PokerZero3 Futebol Clube</h1>
          {players.length > 0 && <Scoreboard players={players} aiTeam="Oponentes" />}
        </div>
        <div className="w-20 hidden sm:block"></div> {/* Spacer */}
      </div>

      {/* AI Players Area */}
       <div className="w-full flex flex-wrap justify-center items-start gap-x-1 gap-y-2 px-1 my-2 flex-shrink-0 z-10">
          {aiPlayers.map((player) => (
            <div key={player.id}>
              {getPlayerComponent(player)}
            </div>
          ))}
      </div>


      {/* Table Center Area */}
      <div className="my-1 text-center w-full flex flex-col items-center z-10 flex-grow justify-center">
        <div className="mb-1">
            <h2 className="text-xl sm:text-2xl font-black text-yellow-300 drop-shadow-lg">🏆 Pote: ${pot}</h2>
        </div>
        <CommunityCards cards={communityCards} gameStage={gameStage} winningCards={winningCards} />
        <p className="h-5 text-sm sm:text-base italic text-white/80">{message}</p>
        <SponsorBanner />
      </div>
      
      {/* Human Player Area */}
      <div className="relative w-full flex flex-col items-center z-10 mb-1">
        {humanPlayer && getPlayerComponent(humanPlayer)}
      </div>
      
      {/* Action Area (Fixed at bottom for landscape mobile) */}
      <div className="fixed bottom-9 left-0 right-0 flex items-center justify-center z-20 px-2 pointer-events-none">
        {gameStage > GameStage.Dealing && gameStage < GameStage.Showdown && currentPlayerId === humanPlayer?.id && !humanPlayer.hasFolded && !humanPlayer.isAllIn && (
          <div className="pointer-events-auto">
            <PlayerActions {...playerActions} />
          </div>
        )}
      </div>
      
      {gameStage === GameStage.Showdown && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30 backdrop-blur-sm p-2">
          <div className="bg-green-900 bg-opacity-80 p-4 sm:p-6 rounded-lg border-2 border-yellow-400 shadow-xl text-center animate-fade-in">
            <h2 className="text-2xl sm:text-4xl font-black text-yellow-300 animate-pulse uppercase tracking-widest">
              {winners.length > 1 ? 'Empate!' : `⚽ GOOOOOL!`}
            </h2>
            <p className="text-lg sm:text-xl mt-2 text-white">
              {winners.length > 1 ? 'Pote dividido entre: ' : 'Vencedor: '} 
              <span className="font-bold">{winners.map(w => w.name).join(', ')}</span>
            </p>
            <p className="text-sm sm:text-base mt-1 text-gray-300">
              com <span className="font-semibold">{winners[0]?.handResult?.name}</span>
            </p>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-yellow-200/80 italic">"{tip}"</p>
            <button
              onClick={onPlayAgain}
              className="mt-4 sm:mt-6 py-2 px-5 sm:py-2 sm:px-7 bg-yellow-400 text-green-900 font-bold rounded-md hover:bg-yellow-500 transition-all text-base sm:text-lg transform hover:scale-105"
            >
              Próxima Rodada
            </button>
          </div>
        </div>
      )}

      {gameStage === GameStage.End && tournamentWinner && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 backdrop-blur-sm animate-fade-in p-2">
           <div className="bg-green-900 bg-opacity-90 p-4 sm:p-8 rounded-lg border-2 border-yellow-400 shadow-xl text-center">
             <div className="text-5xl sm:text-7xl mb-2">🏆</div>
             <h2 className="text-2xl sm:text-4xl font-black text-yellow-300 uppercase tracking-widest">
              CAMPEÃO!
             </h2>
             <p className="text-lg sm:text-2xl mt-2 font-bold text-white">{tournamentWinner.name}</p>
             <p className="text-sm sm:text-base mt-1 text-gray-300">Levou todas as fichas!</p>
             <button
               onClick={onReturnToMenu}
               className="mt-6 sm:mt-8 py-2 px-5 sm:py-2 sm:px-7 bg-yellow-400 text-green-900 font-bold rounded-md hover:bg-yellow-500 transition-all text-base sm:text-lg transform hover:scale-105"
             >
               Jogar Novamente
             </button>
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 w-full bg-black/50 text-center text-xs text-gray-300 z-30 backdrop-blur-sm h-9 flex items-center justify-center">
        Follow Labs - Digital Solutions - Cortesia de <a href="https://followadvisor.com" target="_blank" rel="noopener noreferrer" className="font-bold text-yellow-300 hover:underline">Followadvisor.com</a>
      </footer>
    </div>
  );
};

export default GameBoard;