import { ChampionshipData, RankingEntry, DashboardStats, JogadorCampeonato, Partida, Resultado, EvolutionChartData, ChartSeries, MatchHistoryEntry } from '../types';

const BASE_POINTS: { [key: number]: number } = {
    1: 100, 2: 85, 3: 70, 4: 60, 5: 50,
    6: 40, 7: 35, 8: 30, 9: 25, 10: 20
};

const getBasePoints = (position: number): number => BASE_POINTS[position] || 0;

const getMultiplier = (numPlayers: number): number => {
    if (numPlayers >= 11) return 1.5;
    if (numPlayers >= 7) return 1.2;
    return 1.0;
};

const calculateMatchPoints = (result: Resultado, match: Partida): number => {
    const base = getBasePoints(result.posicao);
    const multiplier = getMultiplier(match.numero_jogadores);
    const bonus = result.posicao === 1 ? match.valor_buyin : 0;
    return (base * multiplier) + bonus;
};

const calculatePlayerOfMonth = (data: ChampionshipData): JogadorCampeonato | null => {
    const { jogadores, partidas, resultados } = data;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const recentMatchIds = new Set(
        partidas.filter(p => new Date(p.data) >= oneMonthAgo).map(p => p.id_partida)
    );

    if (recentMatchIds.size === 0) return null;

    const monthlyScores: { [key: string]: number } = {};

    for (const jogador of jogadores) {
        monthlyScores[jogador.id_jogador] = 0;
        const playerResults = resultados.filter(r => r.id_jogador_fk === jogador.id_jogador && recentMatchIds.has(r.id_partida_fk));
        
        for(const result of playerResults) {
            const match = partidas.find(p => p.id_partida === result.id_partida_fk);
            if(match) {
                monthlyScores[jogador.id_jogador] += calculateMatchPoints(result, match);
            }
        }
    }
    
    const topScorerId = Object.keys(monthlyScores).reduce((a, b) => monthlyScores[a] > monthlyScores[b] ? a : b);
    
    if (monthlyScores[topScorerId] > 0) {
      return jogadores.find(j => j.id_jogador === topScorerId) || null;
    }

    return null;
}


export const generateRankingAndStats = (data: ChampionshipData): { 
    ranking: RankingEntry[], 
    dashboardStats: DashboardStats,
    evolutionChartData: EvolutionChartData,
    matchHistory: MatchHistoryEntry[]
} => {
    const { jogadores, partidas, resultados } = data;
    const initialResult = {
        ranking: [],
        dashboardStats: { leader: 'N/A', playerOfMonth: 'N/A', lastChampion: 'N/A' },
        evolutionChartData: { labels: [], series: [] },
        matchHistory: []
    };

    if (!jogadores || jogadores.length === 0) {
        return initialResult;
    }

    const ranking: RankingEntry[] = [];

    for (const jogador of jogadores) {
        const playerResults = resultados.filter(r => r.id_jogador_fk === jogador.id_jogador);
        
        const sortedResults = playerResults.sort((a, b) => {
            const matchA = partidas.find(p => p.id_partida === a.id_partida_fk)!;
            const matchB = partidas.find(p => p.id_partida === b.id_partida_fk)!;
            return new Date(matchA.data).getTime() - new Date(matchB.data).getTime();
        });

        let cumulativePoints = 0;
        const pointsHistory = sortedResults.map(result => {
            const match = partidas.find(p => p.id_partida === result.id_partida_fk)!;
            const matchPoints = calculateMatchPoints(result, match);
            cumulativePoints += matchPoints;
            return { matchDate: match.data, cumulativePoints };
        });

        const matchesPlayed = playerResults.length;
        const wins = playerResults.filter(r => r.posicao === 1).length;
        const podiums = playerResults.filter(r => r.posicao <= 3).length;
        const totalPosition = playerResults.reduce((sum, r) => sum + r.posicao, 0);
        const avgPosition = matchesPlayed > 0 ? totalPosition / matchesPlayed : 0;

        ranking.push({
            ...jogador,
            totalPoints: cumulativePoints,
            matchesPlayed,
            wins,
            podiums,
            avgPosition,
            pointsHistory
        });
    }

    ranking.sort((a, b) => b.totalPoints - a.totalPoints);

    // Calculate Dashboard Stats
    const leader = ranking[0] || null;

    const lastMatch = partidas.length > 0 ? [...partidas].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0] : null;
    let lastChampion: JogadorCampeonato | null = null;
    if (lastMatch) {
        const winnerResult = resultados.find(r => r.id_partida_fk === lastMatch.id_partida && r.posicao === 1);
        if (winnerResult) {
            lastChampion = jogadores.find(j => j.id_jogador === winnerResult.id_jogador_fk) || null;
        }
    }
    
    const playerOfMonth = calculatePlayerOfMonth(data);

    // Calculate Evolution Chart Data
    const allMatchDates = [...new Set(partidas.map(p => new Date(p.data).toISOString().split('T')[0]))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const dateToIndexMap = new Map(allMatchDates.map((date, index) => [date, index]));
    const chartSeries: ChartSeries[] = [];
    const colors = ['#facc15', '#38bdf8', '#4ade80', '#f87171', '#c084fc', '#fb923c', '#2dd4bf', '#a78bfa'];

    ranking.forEach((player, playerIndex) => {
        const seriesData = new Array(allMatchDates.length).fill(null);
        let firstMatchIndex = allMatchDates.length;
        if (player.pointsHistory.length > 0) {
            const firstMatchDate = new Date(player.pointsHistory[0].matchDate).toISOString().split('T')[0];
            firstMatchIndex = dateToIndexMap.get(firstMatchDate) ?? allMatchDates.length;
        }

        player.pointsHistory.forEach(historyPoint => {
            const dateStr = new Date(historyPoint.matchDate).toISOString().split('T')[0];
            const index = dateToIndexMap.get(dateStr);
            if (index !== undefined) {
                seriesData[index] = historyPoint.cumulativePoints;
            }
        });

        let lastPoints = 0;
        for (let i = firstMatchIndex; i < seriesData.length; i++) {
            if (seriesData[i] !== null) {
                lastPoints = seriesData[i];
            } else {
                seriesData[i] = lastPoints;
            }
        }
        
        chartSeries.push({
            label: player.nome,
            data: seriesData,
            color: colors[playerIndex % colors.length]
        });
    });

    const evolutionChartData: EvolutionChartData = {
        labels: allMatchDates,
        series: chartSeries
    };
    
    // Calculate Match History
    const matchHistory: MatchHistoryEntry[] = partidas.map(partida => {
        const winnerResult = resultados.find(r => r.id_partida_fk === partida.id_partida && r.posicao === 1);
        const winner = winnerResult ? jogadores.find(j => j.id_jogador === winnerResult.id_jogador_fk) : null;
        return {
            ...partida,
            winnerName: winner ? winner.nome : 'N/A'
        };
    }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());


    return {
        ranking,
        dashboardStats: {
            leader: leader?.nome || 'N/A',
            playerOfMonth: playerOfMonth?.nome || 'N/A',
            lastChampion: lastChampion?.nome || 'N/A',
        },
        evolutionChartData,
        matchHistory,
    };
};