
export type Suit = '♥' | '♦' | '♣' | '♠';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[]; // Hole cards
  isAI: boolean;
  stack: number;
  currentBet: number;
  hasActed: boolean;
  hasFolded: boolean;
  isAllIn: boolean;
  isEliminated: boolean; // Added for tournament mode
  position: number; // Seat position
  handsWon: number; // To track wins for the championship table
  handResult?: HandEvaluationResult;
  comment?: string; // For AI chat bubbles
}

// Data structures for the real-life championship module
export interface JogadorCampeonato {
  id_jogador: string;
  nome: string;
  data_cadastro: string; // ISO date string
  foto_url?: string; // Base64 encoded image
}

export interface Partida {
  id_partida: string;
  data: string; // ISO date string
  valor_buyin: number;
  numero_jogadores: number;
}

export interface Resultado {
  id_resultado: string;
  id_partida_fk: string;
  id_jogador_fk: string;
  posicao: number;
}

export interface ChampionshipData {
  jogadores: JogadorCampeonato[];
  partidas: Partida[];
  resultados: Resultado[];
}

// Types for the new Ranking Dashboard
export interface PointsHistory {
    matchDate: string;
    cumulativePoints: number;
}

export interface RankingEntry extends JogadorCampeonato {
    totalPoints: number;
    matchesPlayed: number;
    wins: number;
    podiums: number;
    avgPosition: number;
    pointsHistory: PointsHistory[];
}

export interface DashboardStats {
    leader: string;
    playerOfMonth: string;
    lastChampion: string;
}

export interface ChartSeries {
  label: string;
  data: (number | null)[];
  color: string;
}

export interface EvolutionChartData {
  labels: string[];
  series: ChartSeries[];
}

export interface MatchHistoryEntry extends Partida {
  winnerName: string;
}

export enum GameStage {
  Setup,
  Dealing,
  PreFlop,
  Flop,
  Turn,
  River,
  Showdown,
  End,
}

export interface HandEvaluationResult {
  rank: number;
  name:string;
  values: number[]; // For tie-breaking
  cards: Card[]; // The actual 5 cards that make the best hand
}