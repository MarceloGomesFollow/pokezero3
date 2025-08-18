import React, { useState, useEffect, useCallback } from 'react';
import { GameStage, Player, Card as CardType, HandEvaluationResult } from './types';
import { Deck, findBestHand, compareHands } from './lib/poker';
import { FOOTBALL_TIPS, STARTING_STACK, SMALL_BLIND, BIG_BLIND, RANK_VALUES, AI_COMMENTS } from './constants';
import GameSetup from './components/GameSetup';
import GameBoard from './components/GameBoard';
import { playWhistleSound } from './lib/audio';
import ZoomControls from './components/ZoomControls';
import ChampionshipView from './components/ChampionshipView';
import LandingPage from './components/LandingPage';
import PasswordModal from './components/PasswordModal';

const getPreFlopHandStrength = (hand: CardType[]): number => {
    if (hand.length !== 2) return 0;
    const [card1, card2] = hand;
    const rank1 = RANK_VALUES[card1.rank];
    const rank2 = RANK_VALUES[card2.rank];
    let score = 0;

    if (rank1 === rank2) score += 100 + (rank1 * 10);
    score += rank1 + rank2;
    if (card1.suit === card2.suit) score += 20;
    if (Math.abs(rank1 - rank2) === 1) score += 15;
    if (rank1 === 14 || rank2 === 14) score += 10;
    return score;
};

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'setup' | 'game' | 'championship'>('landing');
  const [gameStage, setGameStage] = useState<GameStage>(GameStage.Setup);
  const [players, setPlayers] = useState<Player[]>([]);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [pot, setPot] = useState(0);
  const [communityCards, setCommunityCards] = useState<CardType[]>([]);
  const [winners, setWinners] = useState<Player[]>([]);
  const [winningCards, setWinningCards] = useState<CardType[]>([]);
  const [tournamentWinner, setTournamentWinner] = useState<Player | null>(null);
  const [tip, setTip] = useState<string>('');
  const [dealerIndex, setDealerIndex] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [lastRaiserIndex, setLastRaiserIndex] = useState(-1);
  const [currentBet, setCurrentBet] = useState(0);
  const [message, setMessage] = useState('');
  const [zoom, setZoom] = useState(1.0);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 1.2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1.0);

  const findNextPlayerIndex = useCallback((startIndex: number, playerList: Player[], direction: number = 1, includeAllIn: boolean = false): number => {
    let currentIndex = startIndex;
    const numPlayers = playerList.length;
    let loopGuard = 0;
    while (loopGuard < numPlayers * 2) {
      currentIndex = (currentIndex + direction + numPlayers) % numPlayers;
      const player = playerList[currentIndex];
      if (player && !player.isEliminated && (includeAllIn || (!player.hasFolded && !player.isAllIn))) {
        return currentIndex;
      }
      loopGuard++;
    }
    return -1; // No active players found
  }, []);

  const setupNewHand = useCallback((currentPlayers: Player[], dIndex: number) => {
    playWhistleSound(); // Play whistle sound at the start of the hand

    const activePlayers = currentPlayers.filter(p => !p.isEliminated);
    if (activePlayers.length < 2) {
      setTournamentWinner(activePlayers[0] || null);
      setGameStage(GameStage.End);
      setMessage(activePlayers[0] ? `${activePlayers[0].name} venceu o torneio!` : 'Fim de jogo!');
      return;
    }

    const newDeck = new Deck();
    setDeck(newDeck);
    setTip(FOOTBALL_TIPS[Math.floor(Math.random() * FOOTBALL_TIPS.length)]);
    setCommunityCards([]);
    setPot(0);
    setWinners([]);
    setWinningCards([]);
    setCurrentBet(BIG_BLIND);

    let resetPlayers = currentPlayers.map((p) => ({
      ...p,
      hand: p.isEliminated ? [] : [],
      handResult: undefined,
      currentBet: 0,
      hasFolded: p.isEliminated,
      isAllIn: false,
      hasActed: false,
      comment: undefined,
    }));
    
    // Set a random AI greeting
    const activeAIs = resetPlayers.filter(p => p.isAI && !p.isEliminated);
    if(activeAIs.length > 0) {
        const randomAI = activeAIs[Math.floor(Math.random() * activeAIs.length)];
        const messages = AI_COMMENTS['GREETING'];
        randomAI.comment = messages[Math.floor(Math.random() * messages.length)];
    }
    
    const sbIndex = findNextPlayerIndex(dIndex, resetPlayers);
    const bbIndex = findNextPlayerIndex(sbIndex, resetPlayers);
    
    // Post blinds
    const sbPlayer = resetPlayers[sbIndex];
    sbPlayer.currentBet = Math.min(SMALL_BLIND, sbPlayer.stack);
    sbPlayer.stack -= sbPlayer.currentBet;
    if(sbPlayer.stack === 0) sbPlayer.isAllIn = true;

    const bbPlayer = resetPlayers[bbIndex];
    bbPlayer.currentBet = Math.min(BIG_BLIND, bbPlayer.stack);
    bbPlayer.stack -= bbPlayer.currentBet;
    if(bbPlayer.stack === 0) bbPlayer.isAllIn = true;
    
    setPot(sbPlayer.currentBet + bbPlayer.currentBet);

    // Deal cards
    for (let i = 0; i < 2; i++) {
      for (const player of resetPlayers) {
        if(!player.isEliminated){
             const card = newDeck.deal();
             if (card) player.hand.push(card);
        }
      }
    }
    
    // Set first player to act
    const startPlayerIndex = findNextPlayerIndex(bbIndex, resetPlayers);
    setPlayers(resetPlayers);
    setCurrentPlayerIndex(startPlayerIndex);
    setLastRaiserIndex(startPlayerIndex); 
    setGameStage(GameStage.PreFlop);
    setMessage(`Começou a rodada! ${sbPlayer.name} (SB), ${bbPlayer.name} (BB).`);

    setTimeout(() => {
        setPlayers(prev => prev.map(p => ({...p, comment: undefined})));
    }, 4000);

  }, [findNextPlayerIndex]);
  
  const startGame = useCallback((playerNames: { player: string; ais: string[] }) => {
    const humanPlayer: Player = { id: 'player-1', name: playerNames.player, isAI: false, position: 0, stack: STARTING_STACK, hand: [], currentBet: 0, hasFolded: false, isAllIn: false, isEliminated: false, hasActed: false, handsWon: 0 };
    const aiPlayers: Player[] = playerNames.ais.map((name, i) => ({
      id: `ai-${i + 1}`, name, isAI: true, position: i + 1, stack: STARTING_STACK, hand: [], currentBet: 0, hasFolded: false, isAllIn: false, isEliminated: false, hasActed: false, handsWon: 0,
    }));
    const allPlayers = [humanPlayer, ...aiPlayers];
    const newDealerIndex = Math.floor(Math.random() * allPlayers.length);
    setDealerIndex(newDealerIndex);
    setTournamentWinner(null);
    setupNewHand(allPlayers, newDealerIndex);
    setView('game');
  }, [setupNewHand]);
  
  const handleNextHand = useCallback(() => {
    const nonEliminatedPlayers = players.filter(p => !p.isEliminated);
    if(nonEliminatedPlayers.length < 2) {
        setTournamentWinner(nonEliminatedPlayers[0] || null);
        setGameStage(GameStage.End);
        return;
    }
    const nextDealerIndex = findNextPlayerIndex(dealerIndex, players);
    setDealerIndex(nextDealerIndex);
    setupNewHand(players, nextDealerIndex);
  }, [players, dealerIndex, setupNewHand, findNextPlayerIndex]);

  const handleReturnToMenu = () => {
    setView('landing');
    setGameStage(GameStage.Setup);
  };

  const handleAdminLogin = () => {
    setPasswordError(null);
    setIsPasswordModalVisible(true);
  };

  const handlePasswordSubmit = (password: string) => {
    if (password === 'Pokerzero3') {
      setIsPasswordModalVisible(false);
      setView('championship');
    } else {
      setPasswordError("Senha incorreta!");
    }
  };

  const advanceToNextStage = useCallback(() => {
    let currentPot = pot;
    let nextPlayersState = players.map(p => {
        currentPot += p.currentBet;
        return { ...p, currentBet: 0, hasActed: false, comment: undefined };
    });
    
    const activePlayersCount = nextPlayersState.filter(p => !p.hasFolded && !p.isEliminated).length;
    
    if (activePlayersCount <= 1) {
        setPlayers(nextPlayersState);
        setPot(currentPot);
        setGameStage(GameStage.Showdown);
        return;
    }
    
    setPot(currentPot);
    setCurrentBet(0);
    
    const firstToActIndex = findNextPlayerIndex(dealerIndex, nextPlayersState);
    setCurrentPlayerIndex(firstToActIndex);
    setLastRaiserIndex(firstToActIndex);

    const newStage = gameStage + 1;
    setGameStage(newStage);

    if (newStage === GameStage.Flop) {
      deck?.deal(); // Burn
      const flopCards = [deck?.deal(), deck?.deal(), deck?.deal()].filter(Boolean) as CardType[];
      setCommunityCards(flopCards);
      setMessage("O Flop está na mesa!");
    } else if (newStage === GameStage.Turn) {
      deck?.deal(); // Burn
      const turnCard = deck?.deal();
      if (turnCard) setCommunityCards(prev => [...prev, turnCard]);
       setMessage("A carta do Turn foi virada!");
    } else if (newStage === GameStage.River) {
      deck?.deal(); // Burn
      const riverCard = deck?.deal();
      if(riverCard) setCommunityCards(prev => [...prev, riverCard]);
       setMessage("O River! Última rodada de apostas.");
    } else if (newStage === GameStage.Showdown) {
       setMessage("Showdown! Hora de mostrar as cartas!");
    }
    setPlayers(nextPlayersState);

  }, [deck, players, pot, gameStage, dealerIndex, findNextPlayerIndex]);

  const handlePlayerAction = useCallback((action: 'fold' | 'check' | 'call' | 'raise', amount?: number) => {
    let newPlayers = players.map(p => ({...p, comment: undefined}));
    const player = newPlayers[currentPlayerIndex];
    if (!player || player.hasFolded || player.isAllIn || player.isEliminated) return;
    
    let newCurrentBet = currentBet;
    
    player.hasActed = true;

    if (player.isAI) {
      let commentType: keyof typeof AI_COMMENTS | null = null;
      if (action === 'fold') commentType = 'FOLD';
      else if (action === 'check') commentType = 'CHECK';
      else if (action === 'raise') commentType = 'BET';

      if (commentType) {
        const messages = AI_COMMENTS[commentType];
        player.comment = messages[Math.floor(Math.random() * messages.length)];
      }
    }

    if (action === 'fold') {
      player.hasFolded = true;
      setMessage(`${player.name} correu.`);
    } else if (action === 'check') {
      setMessage(`${player.name} deu check.`);
    } else if (action === 'call') {
      const amountToCall = currentBet - player.currentBet;
      const callAmount = Math.min(amountToCall, player.stack);
      player.stack -= callAmount;
      player.currentBet += callAmount;
      if (player.stack === 0) player.isAllIn = true;
      setMessage(`${player.name} cobriu a aposta.`);
    } else if (action === 'raise' && amount) {
      const totalBet = amount;
      const raiseAmount = totalBet - player.currentBet;
      
      player.stack -= raiseAmount;
      player.currentBet += raiseAmount;
      newCurrentBet = player.currentBet;
      if (player.stack === 0) player.isAllIn = true;
      setLastRaiserIndex(currentPlayerIndex);
      newPlayers.forEach(p => { if (p.id !== player.id && !p.hasFolded && !p.isAllIn && !p.isEliminated) p.hasActed = false; });
      player.hasActed = true; // The raiser has acted
      setMessage(`${player.name} aumentou para $${totalBet}.`);
    }

    setCurrentBet(newCurrentBet);
    
    const activePlayers = newPlayers.filter(p => !p.hasFolded && !p.isEliminated);
    const playersYetToAct = activePlayers.filter(p => !p.hasActed && !p.isAllIn);
    
    if (playersYetToAct.length === 0) {
        const allBetsEqual = activePlayers.filter(p => !p.isAllIn).every(p => p.currentBet === newCurrentBet);
        if (allBetsEqual) {
            setPlayers(newPlayers);
            setTimeout(() => advanceToNextStage(), 1200);
            return;
        }
    }
    
    const nextPlayerIndex = findNextPlayerIndex(currentPlayerIndex, newPlayers);
    setPlayers(newPlayers);
    setCurrentPlayerIndex(nextPlayerIndex);

  }, [players, currentPlayerIndex, currentBet, advanceToNextStage, findNextPlayerIndex]);

  useEffect(() => {
      if (gameStage >= GameStage.PreFlop && gameStage < GameStage.Showdown) {
          const playersToAct = players.filter(p => !p.hasFolded && !p.isAllIn && !p.isEliminated);
          if (playersToAct.length <= 1) {
              const activePlayers = players.filter(p => !p.hasFolded && !p.isEliminated);
              if (activePlayers.length > 1) {
                 const timeout = setTimeout(() => { advanceToNextStage(); }, 1200);
                 return () => clearTimeout(timeout);
              }
          }
      }
  }, [players, gameStage, advanceToNextStage]);

  useEffect(() => {
    const currentPlayer = players[currentPlayerIndex];
    if (gameStage >= GameStage.PreFlop && gameStage < GameStage.Showdown && currentPlayer?.isAI && !currentPlayer.hasFolded && !currentPlayer.isAllIn && !currentPlayer.isEliminated) {
        
        const timeout = setTimeout(() => {
          const amountToCall = currentBet - currentPlayer.currentBet;

          let handStrengthScore = 0;
          if (gameStage === GameStage.PreFlop) {
              handStrengthScore = getPreFlopHandStrength(currentPlayer.hand);
          } else {
              const handResult = findBestHand([...currentPlayer.hand, ...communityCards]);
              handStrengthScore = (handResult.rank + 1) * 20; // Scale post-flop rank to be comparable
          }

          const potOdds = amountToCall / (pot + amountToCall);
          const randomFactor = Math.random();

          // Decision to fold
          if (amountToCall > 0 && handStrengthScore < 30 && randomFactor > 0.1) { // Fold weak hands
              handlePlayerAction('fold');
              return;
          }
          if (amountToCall > currentPlayer.stack * 0.5 && handStrengthScore < 50 && randomFactor > 0.2) { // Fold to large bets with medium hands
              handlePlayerAction('fold');
              return;
          }

          // Decision to raise/bet
          if (handStrengthScore > 60 || (handStrengthScore > 40 && randomFactor > 0.7)) {
              const betSize = Math.min(currentPlayer.stack, pot * 0.75 + amountToCall);
              const minRaise = currentBet + BIG_BLIND;
              const finalBet = Math.max(minRaise, betSize);
              if (finalBet < currentPlayer.stack) {
                  handlePlayerAction('raise', Math.floor(finalBet / 10) * 10);
              } else {
                  handlePlayerAction('call');
              }
              return;
          }

          // Decision to call/check
          if (amountToCall > 0) {
              handlePlayerAction('call');
          } else {
              handlePlayerAction('check');
          }
        }, 1500);

        return () => clearTimeout(timeout);
    }
  }, [currentPlayerIndex, gameStage, players, communityCards, currentBet, pot, handlePlayerAction]);

  useEffect(() => {
    if (gameStage === GameStage.Showdown) {
        let finalPot = pot;
        players.forEach(p => { finalPot += p.currentBet; });

        const playersToShow = players.filter(p => !p.hasFolded && !p.isEliminated);
        if (playersToShow.length === 1) {
            const winner = playersToShow[0];
            const updatedPlayers = players.map(p => p.id === winner.id ? {...p, stack: p.stack + finalPot, handsWon: p.handsWon + 1 } : p);
            setWinners([winner]);
            setPot(0);
            setPlayers(updatedPlayers);
            return;
        }

        const playersWithResults = playersToShow.map(p => ({
            ...p,
            handResult: findBestHand([...p.hand, ...communityCards])
        }));

        let roundWinners: Player[] = [];
        let bestResult: HandEvaluationResult | null = null;

        for (const player of playersWithResults) {
            if (!player.handResult) continue;
            if (!bestResult || compareHands(player.handResult, bestResult) > 0) {
                bestResult = player.handResult;
                roundWinners = [{...player}];
            } else if (bestResult && compareHands(player.handResult, bestResult) === 0) {
                roundWinners.push({...player});
            }
        }
        
        const prizePerWinner = Math.floor(finalPot / roundWinners.length);
        
        let finalPlayers = players.map(p => {
            const winnerData = roundWinners.find(w => w.id === p.id);
            if (winnerData) return {...p, stack: p.stack + prizePerWinner, handResult: winnerData.handResult};
            const nonWinnerData = playersWithResults.find(nwp => nwp.id === p.id);
            if(nonWinnerData) return {...p, handResult: nonWinnerData.handResult};
            return p;
        });
        
        if (roundWinners.length > 0 && roundWinners[0].handResult) {
            setWinningCards(roundWinners[0].handResult.cards);
        }

        // Add comments to winners and check for eliminations
        finalPlayers = finalPlayers.map(p => {
            const isWinner = roundWinners.some(w => w.id === p.id);
            if (isWinner) {
                p.handsWon += 1;
                if (p.isAI) {
                    const messages = AI_COMMENTS.WIN;
                    p.comment = messages[Math.floor(Math.random() * messages.length)];
                }
            }
            if (p.stack === 0 && !p.isEliminated) {
                 p.isEliminated = true;
                 p.comment = p.isAI ? AI_COMMENTS.ELIMINATED[Math.floor(Math.random() * AI_COMMENTS.ELIMINATED.length)] : 'Eliminado!';
            }
            return p;
        });
        
        setTimeout(() => setPlayers(prev => prev.map(p => ({...p, comment: undefined}))), 4000);

        setPot(0);
        setWinners(roundWinners);
        setPlayers(finalPlayers);
    }
  }, [gameStage, pot, players, communityCards]);

  const renderView = () => {
    switch (view) {
      case 'setup':
        return <GameSetup onStartGame={startGame} onReturnToMenu={handleReturnToMenu} />;
      case 'championship':
        return <ChampionshipView onReturnToMenu={handleReturnToMenu} />;
      case 'game':
        const humanPlayer = players.find(p => !p.isAI);
        if (!humanPlayer || gameStage === GameStage.Setup) {
          return <LandingPage onNavigateToSetup={() => setView('setup')} onManageChampionship={handleAdminLogin} />;
        }

        const amountToCall = Math.min(humanPlayer.stack, currentBet - humanPlayer.currentBet);
        const playerActions = {
            canCheck: currentBet - humanPlayer.currentBet <= 0,
            canRaise: humanPlayer.stack > amountToCall,
            amountToCall: amountToCall,
            minRaise: Math.min(humanPlayer.stack + humanPlayer.currentBet, (currentBet > 0 ? currentBet * 2 : BIG_BLIND)),
            maxRaise: humanPlayer.stack + humanPlayer.currentBet,
            onFold: () => handlePlayerAction('fold'),
            onCheck: () => handlePlayerAction('check'),
            onCall: () => handlePlayerAction('call'),
            onRaise: (amount: number) => handlePlayerAction('raise', amount),
        };
        const currentDealer = players.find(p => p.id === players[dealerIndex]?.id);
        const sbIndex = currentDealer ? findNextPlayerIndex(players.indexOf(currentDealer), players) : -1;
        const bbIndex = sbIndex !== -1 ? findNextPlayerIndex(sbIndex, players) : -1;
        
        return (
          <>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center top', transition: 'transform 0.2s ease-out' }}>
              <GameBoard
                players={players}
                communityCards={communityCards}
                gameStage={gameStage}
                pot={pot}
                tip={tip}
                winners={winners}
                winningCards={winningCards}
                tournamentWinner={tournamentWinner}
                currentPlayerId={players[currentPlayerIndex]?.id}
                dealerId={currentDealer?.id || ''}
                sbId={players[sbIndex]?.id || ''}
                bbId={players[bbIndex]?.id || ''}
                playerActions={playerActions}
                onPlayAgain={handleNextHand}
                onReturnToMenu={handleReturnToMenu}
                message={message}
              />
            </div>
            <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onZoomReset={handleZoomReset} currentZoom={zoom} />
          </>
        );
      case 'landing':
      default:
        return <LandingPage onNavigateToSetup={() => setView('setup')} onManageChampionship={handleAdminLogin} />;
    }
  };

  return (
    <>
      {renderView()}
      {isPasswordModalVisible && (
        <PasswordModal 
          onClose={() => { setIsPasswordModalVisible(false); setPasswordError(null); }}
          onSubmit={handlePasswordSubmit}
          error={passwordError}
        />
      )}
    </>
  );
};

export default App;
