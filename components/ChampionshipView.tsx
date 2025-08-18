import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChampionshipData, JogadorCampeonato, Partida, Resultado, RankingEntry, DashboardStats, EvolutionChartData, MatchHistoryEntry } from '../types';
import { generateRankingAndStats } from '../lib/championshipCalculations';
import { getChampionshipData, saveChampionshipData, getSyncId, saveSyncId, createOnlineBackup, updateOnlineBackup, getOnlineBackup } from '../lib/championshipApi';

// Simple SVG Line Chart Component for Player Stats Modal
const StatsChart: React.FC<{ data: { matchDate: string; cumulativePoints: number }[] }> = ({ data }) => {
    if (data.length < 2) {
        return <div className="flex items-center justify-center h-48 text-gray-500">Dados insuficientes para o gráfico.</div>;
    }

    const width = 300;
    const height = 150;
    const padding = 20;

    const maxPoints = Math.max(...data.map(d => d.cumulativePoints));
    const scaleY = (val: number) => height - padding - (val / (maxPoints || 1)) * (height - 2 * padding);
    const scaleX = (index: number) => padding + (index / (data.length - 1)) * (width - 2 * padding);

    const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.cumulativePoints)}`).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            <path d={pathData} fill="none" stroke="#facc15" strokeWidth="2" />
            {data.map((d, i) => (
                <circle key={i} cx={scaleX(i)} cy={scaleY(d.cumulativePoints)} r="3" fill="#facc15" />
            ))}
        </svg>
    );
};

// Multi-line SVG Chart for player evolution
const EvolutionChart: React.FC<{ data: EvolutionChartData }> = ({ data }) => {
    if (!data || data.series.length === 0 || data.labels.length < 2) {
        return <div className="flex items-center justify-center h-64 text-gray-500 bg-black/20 rounded-lg">Dados insuficientes para o gráfico de evolução.</div>;
    }

    const width = 500;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 60, left: 40 };

    const maxPoints = Math.max(1, ...data.series.flatMap(s => s.data.filter((d): d is number => d !== null)));
    
    const scaleY = (val: number) => padding.top + (height - padding.top - padding.bottom) * (1 - (val / maxPoints));
    const scaleX = (index: number) => padding.left + (index / (data.labels.length - 1)) * (width - padding.left - padding.right);

    const generatePath = (seriesData: (number | null)[]) => {
        let path = '';
        let onPath = false;
        seriesData.forEach((d, i) => {
            if (d !== null) {
                const command = onPath ? 'L' : 'M';
                path += `${command} ${scaleX(i)} ${scaleY(d)} `;
                onPath = true;
            }
        });
        return path;
    };

    return (
        <div className="bg-black/20 p-4 rounded-lg border border-gray-600">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y Axis Grid Lines & Labels */}
                {Array.from({ length: 5 }).map((_, i) => {
                    const y = padding.top + i * ((height - padding.top - padding.bottom) / 4);
                    const value = Math.round(maxPoints * (1 - (i / 4)));
                    return (
                        <g key={i} className="text-gray-500">
                            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" strokeWidth="0.5" />
                            <text x={padding.left - 5} y={y + 3} fill="currentColor" fontSize="10" textAnchor="end">{value}</text>
                        </g>
                    )
                })}

                {/* X Axis Labels */}
                {data.labels.map((label, i) => (
                    <text key={i} x={scaleX(i)} y={height - padding.bottom + 15} fill="#9ca3af" fontSize="9" textAnchor="middle" transform={`rotate(-45, ${scaleX(i)}, ${height - padding.bottom + 15})`}>
                        {new Date(label).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </text>
                ))}
                
                {/* Data Lines */}
                {data.series.map(series => (
                     <path key={series.label} d={generatePath(series.data)} fill="none" stroke={series.color} strokeWidth="2" />
                ))}
            </svg>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                {data.series.map(series => (
                    <div key={series.label} className="flex items-center text-xs">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: series.color }}></div>
                        <span className="text-gray-300">{series.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface ChampionshipViewProps {
  onReturnToMenu: () => void;
}

// Main Component
const ChampionshipView: React.FC<ChampionshipViewProps> = ({ onReturnToMenu }) => {
  const [data, setData] = useState<ChampionshipData>({ jogadores: [], partidas: [], resultados: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'manage'>('dashboard');
  
  // Player management state
  const [newPlayerName, setNewPlayerName] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');
  
  // New match registration state
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [buyIn, setBuyIn] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [positions, setPositions] = useState<Record<string, string>>({});
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchSuccess, setMatchSuccess] = useState<string | null>(null);
  
  // Photo management state
  const [photoMenuPlayerId, setPhotoMenuPlayerId] = useState<string | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInitialMount = useRef(true);

  // Match confirmation modal state
  const [isMatchConfirmModalOpen, setIsMatchConfirmModalOpen] = useState(false);
  const [matchToConfirm, setMatchToConfirm] = useState<{ match: Partida; results: Resultado[]; summary: { winnerName: string; classification: { name: string; position: number }[] } } | null>(null);

  // Dashboard state
  const [selectedPlayerForStats, setSelectedPlayerForStats] = useState<RankingEntry | null>(null);
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<MatchHistoryEntry & { classification: { name: string; position: number }[] } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Online Sync State
  const [syncId, setSyncId] = useState<string | null>(null);
  const [loadSyncIdInput, setLoadSyncIdInput] = useState('');
  const [onlineStatus, setOnlineStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [onlineMessage, setOnlineMessage] = useState<string | null>(null);

  // Load data from local storage on component mount
  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        const localData = await getChampionshipData();
        setData(localData);
        setSyncId(getSyncId()); // Load sync ID from local storage
        setIsLoading(false);
        setTimeout(() => { isInitialMount.current = false; }, 0);
    };
    loadData();
  }, []);

  // Save data to local storage whenever `data` changes
  useEffect(() => {
      if (isInitialMount.current) return;
      const saveData = async () => {
          setIsSaving(true);
          setSaveError(null);
          try {
              await saveChampionshipData(data);
          } catch (error) {
              setSaveError("Erro ao salvar localmente.");
          } finally {
              setIsSaving(false);
          }
      };
      const handler = setTimeout(() => saveData(), 1000);
      return () => clearTimeout(handler);
  }, [data]);
  
  const dashboardData = useMemo(() => generateRankingAndStats(data), [data]);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim() === '') return;
    const newPlayer: JogadorCampeonato = {
      id_jogador: `jog-${Date.now()}`,
      nome: newPlayerName.trim(),
      data_cadastro: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, jogadores: [...prev.jogadores, newPlayer] }));
    setNewPlayerName('');
  };

  const handleRemovePlayer = (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este jogador? A remoção é permanente e removerá seus resultados.")) {
      setData(prev => ({ 
          ...prev, 
          jogadores: prev.jogadores.filter(p => p.id_jogador !== id),
          resultados: prev.resultados.filter(r => r.id_jogador_fk !== id)
      }));
    }
  };

  const handleStartEdit = (player: JogadorCampeonato) => {
    setEditingPlayerId(player.id_jogador);
    setEditingPlayerName(player.nome);
  };

  const handleCancelEdit = () => setEditingPlayerId(null);
  
  const handleUpdatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlayerName.trim() === '' || !editingPlayerId) return;
    setData(prev => ({
      ...prev,
      jogadores: prev.jogadores.map(p =>
        p.id_jogador === editingPlayerId ? { ...p, nome: editingPlayerName.trim() } : p
      ),
    }));
    handleCancelEdit();
  };
  
  const handlePlayerSelectionChange = (playerId: string) => {
    setSelectedPlayerIds(prev => prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]);
  };

  const handlePositionChange = (playerId: string, position: string) => {
    setPositions(prev => ({ ...prev, [playerId]: position }));
  };
  
  const resetMatchForm = () => {
      setMatchDate(new Date().toISOString().split('T')[0]);
      setBuyIn('');
      setSelectedPlayerIds([]);
      setPositions({});
  }

  const handleSaveMatch = (e: React.FormEvent) => {
      e.preventDefault();
      setMatchError(null);
      setMatchSuccess(null);

      if (selectedPlayerIds.length < 2) { setMatchError("Selecione pelo menos dois jogadores."); return; }
      const filledPositions = Object.values(positions).filter(p => p && p.trim() !== '' && !isNaN(parseInt(p)));
      if (filledPositions.length !== selectedPlayerIds.length) { setMatchError("Preencha a posição de todos os participantes."); return; }
      const positionSet = new Set(Object.values(positions));
      if (positionSet.size !== selectedPlayerIds.length) { setMatchError("As posições devem ser únicas."); return; }

      const newMatchId = `part-${Date.now()}`;
      const newMatch: Partida = {
          id_partida: newMatchId,
          data: new Date(matchDate).toISOString(),
          valor_buyin: parseFloat(buyIn) || 0,
          numero_jogadores: selectedPlayerIds.length,
      };

      const newResults: Resultado[] = selectedPlayerIds.map(playerId => ({
          id_resultado: `res-${newMatchId}-${playerId}`,
          id_partida_fk: newMatchId,
          id_jogador_fk: playerId,
          posicao: parseInt(positions[playerId], 10),
      }));

      const winnerResult = newResults.find(r => r.posicao === 1);
      const winner = winnerResult ? data.jogadores.find(j => j.id_jogador === winnerResult.id_jogador_fk) : null;
      
      const classification = newResults
          .map(result => {
              const player = data.jogadores.find(j => j.id_jogador === result.id_jogador_fk);
              return { name: player?.nome || 'N/A', position: result.posicao };
          })
          .sort((a, b) => a.position - b.position);
      
      setMatchToConfirm({
          match: newMatch,
          results: newResults,
          summary: {
              winnerName: winner?.nome || 'N/A',
              classification,
          },
      });
      setIsMatchConfirmModalOpen(true);
  };

  const confirmAndSaveMatch = () => {
      if (!matchToConfirm) return;

      setData(prev => ({
          ...prev,
          partidas: [...prev.partidas, matchToConfirm.match],
          resultados: [...prev.resultados, ...matchToConfirm.results],
      }));
      
      setIsMatchConfirmModalOpen(false);
      setMatchToConfirm(null);

      setMatchSuccess("Partida salva e pontos calculados com sucesso!");
      resetMatchForm();
      setTimeout(() => setMatchSuccess(null), 5000);
  };
  
    const handleUpdatePlayerPhoto = (playerId: string, photoUrl: string) => {
        setData(prev => ({
        ...prev,
        jogadores: prev.jogadores.map(p => 
            p.id_jogador === playerId ? { ...p, foto_url: photoUrl } : p
        ),
        }));
        setPhotoMenuPlayerId(null);
    };
  
    const handlePhotoMenuToggle = (playerId: string) => {
        setPhotoMenuPlayerId(prevId => (prevId === playerId ? null : playerId));
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0] && photoMenuPlayerId) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            handleUpdatePlayerPhoto(photoMenuPlayerId, reader.result as string);
        };
        reader.readAsDataURL(file);
        }
    };
    
    useEffect(() => {
        if (isCameraModalOpen && cameraStream && videoRef.current) {
          videoRef.current.srcObject = cameraStream;
        }
    }, [isCameraModalOpen, cameraStream]);

    const openCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && photoMenuPlayerId) {
            try {
                setPhotoMenuPlayerId(null); // Close menu before opening modal
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setCameraStream(stream);
                setIsCameraModalOpen(true);
            } catch (err) {
                console.error("Error accessing camera: ", err);
                alert("Não foi possível acessar a câmera. Verifique as permissões do seu navegador.");
            }
        }
    };

    const closeCamera = () => {
        if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        }
        setCameraStream(null);
        setIsCameraModalOpen(false);
    };

    const handleCapturePhoto = () => {
        if (videoRef.current && canvasRef.current && photoMenuPlayerId) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoUrl = canvas.toDataURL('image/jpeg');
        handleUpdatePlayerPhoto(photoMenuPlayerId, photoUrl);
        closeCamera();
        }
    };

    const handleShowMatchDetails = (matchId: string) => {
        const match = data.partidas.find(p => p.id_partida === matchId);
        if (!match) return;

        const matchResults = data.resultados.filter(r => r.id_partida_fk === matchId);
        
        const classification = matchResults
            .map(result => {
                const player = data.jogadores.find(j => j.id_jogador === result.id_jogador_fk);
                return { name: player?.nome || 'N/A', position: result.posicao };
            })
            .sort((a, b) => a.position - b.position);

        const winner = classification.find(c => c.position === 1);

        setSelectedMatchForDetails({
            ...match,
            winnerName: winner?.name || 'N/A',
            classification,
        });
    };
    
    const handleCopyMatchResults = () => {
        if (!selectedMatchForDetails) return;
        const { classification, data: date, valor_buyin } = selectedMatchForDetails;

        const podiumEmojis: { [key: number]: string } = { 1: '🥇', 2: '🥈', 3: '🥉' };
        
        const resultsText = classification.map(item => 
            `${podiumEmojis[item.position] || `${item.position}º`} - ${item.name}`
        ).join('\n');

        const textToCopy = `🏆 Resultado da Partida - ${new Date(date).toLocaleDateString('pt-BR')} 🏆
Buy-in: R$ ${valor_buyin.toFixed(2)}

Classificação Final:
${resultsText}

#PokerZero3FC`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };
    
    // --- Online Sync Handlers ---
    const setOnlineStatusMessage = (status: 'loading' | 'success' | 'error', message: string) => {
        setOnlineStatus(status);
        setOnlineMessage(message);
        if(status !== 'loading') {
            setTimeout(() => {
                setOnlineStatus('idle');
                setOnlineMessage(null);
            }, 4000);
        }
    }

    const handleCreateOrUpdateOnlineBackup = async () => {
        setOnlineStatusMessage('loading', 'Sincronizando com a nuvem...');
        try {
            if (syncId) {
                await updateOnlineBackup(syncId, data);
                setOnlineStatusMessage('success', 'Backup online atualizado com sucesso!');
            } else {
                const newId = await createOnlineBackup(data);
                saveSyncId(newId);
                setSyncId(newId);
                setOnlineStatusMessage('success', 'Backup online criado! Guarde seu código de sincronização.');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            setOnlineStatusMessage('error', `Erro: ${errorMessage}`);
        }
    };

    const handleLoadOnlineBackup = async () => {
        if (!loadSyncIdInput.trim()) {
            setOnlineStatusMessage('error', 'Por favor, insira um código de sincronização.');
            return;
        }
        if (!window.confirm("Isso substituirá todos os dados atuais. Deseja continuar?")) return;

        setOnlineStatusMessage('loading', 'Carregando dados da nuvem...');
        try {
            const onlineData = await getOnlineBackup(loadSyncIdInput.trim());
            setData(onlineData); // This will trigger local save via useEffect
            saveSyncId(loadSyncIdInput.trim());
            setSyncId(loadSyncIdInput.trim());
            setLoadSyncIdInput('');
            setOnlineStatusMessage('success', 'Dados carregados com sucesso!');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            setOnlineStatusMessage('error', `Erro: ${errorMessage}`);
        }
    };

    const handleCopySyncId = () => {
        if (syncId) {
            navigator.clipboard.writeText(syncId).then(() => {
                 setOnlineStatusMessage('success', 'Código copiado para a área de transferência!');
            });
        }
    }

  const sortedPlayers = [...data.jogadores].sort((a, b) => a.nome.localeCompare(b.nome));

  const StatCard: React.FC<{ icon: string; label: string; value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-green-700/50 p-4 rounded-lg text-center">
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-yellow-300 uppercase">{label}</div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start p-4 pt-8 sm:pt-12"
      style={{
        backgroundColor: '#052e16', // Dark green fallback
        backgroundImage: `
          repeating-linear-gradient(90deg, transparent 0px, transparent 100px, rgba(255,255,255,0.04) 100px, rgba(255,255,255,0.04) 102px),
          radial-gradient(ellipse at bottom, #15803d, #052e16 80%)
        `,
        backgroundSize: 'auto, 100% 100%',
        animation: 'background-pan 80s linear infinite',
      }}
    >
      {isLoading && (
          <div className="fixed inset-0 bg-gray-900/95 flex flex-col items-center justify-center z-50">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400"></div>
              <p className="text-yellow-300 mt-4 text-lg">Carregando dados do campeonato...</p>
          </div>
      )}
      <div className="relative bg-green-950/80 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-5xl border-2 border-yellow-400/50">
        <div className="absolute top-4 right-6 text-xs transition-opacity duration-300">
            {isSaving ? (
                <span className="text-yellow-400">Salvando localmente...</span>
            ) : saveError ? (
                <span className="text-red-400">{saveError}</span>
            ) : !isInitialMount.current ? (
                <span className="text-green-400">Progresso salvo localmente ✔️</span>
            ) : null}
        </div>
        
        <h1 className="text-2xl sm:text-4xl font-black text-center mb-6 text-yellow-300 drop-shadow-lg">PAINEL DO CAMPEONATO</h1>

        <div className="flex justify-center border-b border-yellow-400/30 mb-6">
            <button onClick={() => setActiveTab('dashboard')} className={`py-2 px-6 font-bold text-lg transition-colors ${activeTab === 'dashboard' ? 'text-yellow-300 border-b-2 border-yellow-300' : 'text-gray-400 hover:text-yellow-200'}`}>Ranking & Dashboard</button>
            <button onClick={() => setActiveTab('manage')} className={`py-2 px-6 font-bold text-lg transition-colors ${activeTab === 'manage' ? 'text-yellow-300 border-b-2 border-yellow-300' : 'text-gray-400 hover:text-yellow-200'}`}>Gerenciar</button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="animate-fadeInUp space-y-8">
            <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 rounded-lg shadow-lg text-center text-gray-900"><div className="text-2xl">👑</div><h3 className="font-bold text-lg">Líder Atual</h3><p className="text-xl font-black">{dashboardData.dashboardStats.leader}</p></div>
                  <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-4 rounded-lg shadow-lg text-center text-white"><div className="text-2xl">🔥</div><h3 className="font-bold text-lg">Jogador do Mês</h3><p className="text-xl font-black">{dashboardData.dashboardStats.playerOfMonth}</p></div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg shadow-lg text-center text-white"><div className="text-2xl">🏆</div><h3 className="font-bold text-lg">Último Campeão</h3><p className="text-xl font-black">{dashboardData.dashboardStats.lastChampion}</p></div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-yellow-200 mb-4">Ranking Geral</h2>
                        <div className="overflow-x-auto max-h-[50vh]">
                          <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-yellow-300 uppercase bg-green-700/50 sticky top-0 backdrop-blur-sm">
                              <tr>
                                <th scope="col" className="px-4 py-3 text-center">Pos.</th>
                                <th scope="col" className="px-4 py-3">Jogador</th>
                                <th scope="col" className="px-4 py-3 text-right">Pontos</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboardData.ranking.map((player, index) => (
                                <tr key={player.id_jogador} onClick={() => setSelectedPlayerForStats(player)} className="border-b border-green-700 hover:bg-green-700/30 cursor-pointer">
                                  <td className="px-4 py-4 text-center font-bold">{index + 1}{index === 0 && ' 🏆'}</td>
                                   <td className="px-4 py-4 font-bold text-white whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <img src={player.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.nome)}&background=22c55e&color=fff&rounded=true`} alt={player.nome} className="w-8 h-8 rounded-full object-cover bg-gray-700" />
                                        {player.nome}
                                    </div>
                                   </td>
                                  <td className="px-4 py-4 text-right font-semibold text-yellow-300">{player.totalPoints.toFixed(2)}</td>
                                </tr>
                              ))}
                              {dashboardData.ranking.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-gray-400">Nenhum dado para exibir. Registre uma partida.</td></tr>}
                            </tbody>
                          </table>
                        </div>
                    </div>
                    <div className="max-h-[50vh]">
                        <h2 className="text-xl sm:text-2xl font-bold text-yellow-200 mb-4">Sistema de Pontos</h2>
                        <div className="bg-green-700/50 p-4 rounded-lg space-y-3 text-gray-300 text-sm h-full flex flex-col">
                            <p className="text-center italic">A pontuação é calculada com a fórmula:</p>
                            <p className="text-center font-bold text-yellow-300 bg-black/20 py-1 rounded-md text-base">
                                (Base * Multiplicador) + Bônus
                            </p>
                            <div className="flex-grow grid grid-cols-2 gap-3 mt-2">
                                <div>
                                    <h4 className="font-bold text-yellow-200 mb-1">🏆 Pontos Base</h4>
                                    <ul className="text-xs space-y-0.5">
                                        <li><span className="font-semibold w-8 inline-block">1º:</span> 100</li>
                                        <li><span className="font-semibold w-8 inline-block">2º:</span> 85</li>
                                        <li><span className="font-semibold w-8 inline-block">3º:</span> 70</li>
                                        <li><span className="font-semibold w-8 inline-block">4º:</span> 60</li>
                                        <li><span className="font-semibold w-8 inline-block">5º:</span> 50</li>
                                        <li><span className="font-semibold w-8 inline-block">6º-10º:</span> 40-20</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-yellow-200 mb-1">📈 Multiplicador</h4>
                                    <ul className="text-xs space-y-0.5">
                                        <li><span className="font-semibold w-12 inline-block">Até 6p:</span> 1.0x</li>
                                        <li><span className="font-semibold w-12 inline-block">7 a 10p:</span> 1.2x</li>
                                        <li><span className="font-semibold w-12 inline-block">11p+:</span> 1.5x</li>
                                    </ul>
                                    <h4 className="font-bold text-yellow-200 mb-1 mt-3">💰 Bônus</h4>
                                    <p className="text-xs">O <span className="font-semibold">vencedor</span> ganha o valor do buy-in em pontos.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-yellow-200 mb-4">Evolução dos Jogadores</h2>
                <EvolutionChart data={dashboardData.evolutionChartData} />
            </div>

            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-yellow-200 mb-4">Histórico de Partidas</h2>
                <div className="overflow-x-auto max-h-[40vh]">
                  <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-yellow-300 uppercase bg-green-700/50 sticky top-0 backdrop-blur-sm">
                      <tr>
                        <th scope="col" className="px-4 py-3">Data</th>
                        <th scope="col" className="px-4 py-3">Vencedor</th>
                        <th scope="col" className="px-4 py-3 text-center">Jogadores</th>
                        <th scope="col" className="px-4 py-3 text-right">Buy-in</th>
                        <th scope="col" className="px-4 py-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.matchHistory.map((match) => (
                        <tr key={match.id_partida} className="border-b border-green-700">
                          <td className="px-4 py-4 whitespace-nowrap">{new Date(match.data).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-4 font-bold text-white">{match.winnerName}</td>
                          <td className="px-4 py-4 text-center">{match.numero_jogadores}</td>
                          <td className="px-4 py-4 text-right font-semibold">R$ {match.valor_buyin.toFixed(2)}</td>
                          <td className="px-4 py-4 text-center">
                            <button onClick={() => handleShowMatchDetails(match.id_partida)} className="text-cyan-400 hover:text-cyan-300 text-xl" title="Ver Detalhes">
                                🔍
                            </button>
                          </td>
                        </tr>
                      ))}
                      {dashboardData.matchHistory.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhuma partida registrada.</td></tr>}
                    </tbody>
                  </table>
                </div>
            </div>

          </div>
        )}

        {activeTab === 'manage' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeInUp">
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-yellow-200 mb-4">Jogadores Registrados</h2>
                <form onSubmit={handleAddPlayer} className="mb-4 flex gap-2 p-4 bg-green-900/50 rounded-lg">
                    <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nome do Jogador/Time" className="flex-grow bg-black/20 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"/>
                    <button type="submit" className="py-2 px-6 bg-yellow-400 text-green-900 font-bold rounded-md hover:bg-yellow-500 transition-all transform hover:scale-105">Adicionar</button>
                </form>
                <div className="overflow-y-auto max-h-96">
                  {sortedPlayers.map(p => (
                    <div key={p.id_jogador} className="flex items-center justify-between p-2 border-b border-green-700/50">
                      {editingPlayerId === p.id_jogador ? (
                        <form onSubmit={handleUpdatePlayer} className="flex-grow flex items-center gap-2">
                           <input type="text" value={editingPlayerName} onChange={e => setEditingPlayerName(e.target.value)} className="w-full bg-black/40 border border-yellow-500 rounded py-1 px-2 text-white outline-none" autoFocus/>
                           <button type="submit" className="text-green-400 hover:text-green-300 text-xl" title="Salvar">✔️</button>
                           <button type="button" onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-300 text-xl" title="Cancelar">❌</button>
                        </form>
                      ) : (
                        <>
                           <div className="flex items-center gap-3 flex-grow">
                                <img src={p.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome)}&background=22c55e&color=fff&rounded=true`} alt={p.nome} className="w-10 h-10 rounded-full object-cover bg-gray-700" />
                                <span className="font-bold text-white">{p.nome}</span>
                            </div>
                            <div className="flex items-center">
                                <div className="relative inline-block">
                                    <button onClick={() => handlePhotoMenuToggle(p.id_jogador)} className="text-cyan-400 hover:text-cyan-300 text-xl px-1" title="Alterar Foto">📸</button>
                                     {photoMenuPlayerId === p.id_jogador && (
                                        <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-20 border border-gray-600">
                                            <button onClick={handleUploadClick} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600 rounded-t-md">
                                                Carregar Arquivo
                                            </button>
                                            <button onClick={openCamera} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600 rounded-b-md">
                                                Tirar Foto
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => handleStartEdit(p)} className="text-blue-400 hover:text-blue-300 text-xl px-1" title="Editar Nome">✏️</button>
                                <button onClick={() => handleRemovePlayer(p.id_jogador)} className="text-red-500 hover:text-red-400 text-xl px-1" title="Remover">🗑️</button>
                            </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
            </div>
            <div>
                 <h2 className="text-xl sm:text-2xl font-bold text-yellow-200 mb-4">Registrar Nova Partida</h2>
                 <form onSubmit={handleSaveMatch} className="bg-green-900/50 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-yellow-300 mb-1">Data</label>
                            <input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="w-full bg-black/20 border border-gray-600 rounded-md py-1 px-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-yellow-300 mb-1">Buy-in (R$)</label>
                            <input type="number" value={buyIn} onChange={e => setBuyIn(e.target.value)} placeholder="50" className="w-full bg-black/20 border border-gray-600 rounded-md py-1 px-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-yellow-300 mb-1">Participantes</h3>
                        <div className="max-h-24 overflow-y-auto space-y-1 bg-black/20 p-2 rounded-md border border-gray-600">
                            {sortedPlayers.map(p => (
                                <label key={p.id_jogador} className="flex items-center space-x-2 cursor-pointer hover:bg-green-700/50 p-1 rounded"><input type="checkbox" checked={selectedPlayerIds.includes(p.id_jogador)} onChange={() => handlePlayerSelectionChange(p.id_jogador)} className="form-checkbox h-4 w-4 text-yellow-500 bg-gray-800 border-gray-600 focus:ring-yellow-600" /><span className="text-white">{p.nome}</span></label>
                            ))}
                        </div>
                    </div>
                    {selectedPlayerIds.length > 0 && (
                        <div>
                            <h3 className="text-base font-semibold text-yellow-300 mb-1">Classificação Final</h3>
                             {sortedPlayers.filter(p => selectedPlayerIds.includes(p.id_jogador)).map(p => (
                                <div key={p.id_jogador} className="flex items-center justify-between gap-2 mb-1">
                                    <label className="text-white flex-grow">{p.nome}</label>
                                    <input type="number" placeholder="Pos." min="1" value={positions[p.id_jogador] || ''} onChange={e => handlePositionChange(p.id_jogador, e.target.value)} className="w-20 bg-black/40 border border-gray-500 rounded-md py-1 px-2 text-white outline-none focus:ring-2 focus:ring-yellow-500" />
                                </div>
                             ))}
                        </div>
                    )}
                    {matchError && <p className="text-red-400 text-center text-sm">{matchError}</p>}
                    {matchSuccess && <p className="text-green-300 text-center text-sm">{matchSuccess}</p>}
                    <button type="submit" className="w-full py-2 px-6 bg-yellow-400 text-green-900 font-bold rounded-md hover:bg-yellow-500 transition-all transform hover:scale-105">Salvar Partida</button>
                 </form>
                 
                 <div className="mt-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-yellow-200 mb-4">Backup e Sincronização Online</h2>
                    <div className="bg-green-900/50 rounded-lg p-4 space-y-4">
                        <p className="text-sm text-gray-300">Salve seus dados na nuvem para acessá-los de qualquer dispositivo usando um código de sincronização.</p>
                        
                        {syncId && (
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-yellow-300">Seu Código de Sincronização</label>
                                <div className="flex gap-2">
                                    <input type="text" readOnly value={syncId} className="flex-grow bg-black/40 border border-gray-500 rounded-md py-1 px-2 text-white font-mono text-xs"/>
                                    <button onClick={handleCopySyncId} className="py-1 px-3 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition-all">Copiar</button>
                                </div>
                            </div>
                        )}

                        <button onClick={handleCreateOrUpdateOnlineBackup} disabled={onlineStatus === 'loading'} className="w-full py-2 px-4 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-all transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100 disabled:cursor-wait">
                            {syncId ? 'Salvar Alterações Online' : 'Criar Backup Online'}
                        </button>

                        <hr className="border-green-700/50 my-4" />

                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-yellow-300">Carregar dados de outro dispositivo</label>
                             <div className="flex gap-2">
                                <input type="text" value={loadSyncIdInput} onChange={e => setLoadSyncIdInput(e.target.value)} placeholder="Cole o código de sincronização aqui" className="flex-grow bg-black/20 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"/>
                                <button onClick={handleLoadOnlineBackup} disabled={onlineStatus === 'loading'} className="py-2 px-4 bg-cyan-600 text-white font-bold rounded-md hover:bg-cyan-700 transition-all disabled:bg-gray-500 disabled:cursor-wait">
                                    Carregar
                                </button>
                            </div>
                        </div>

                        {onlineStatus !== 'idle' && (
                            <div className={`mt-3 text-center text-sm p-2 rounded-md ${
                                onlineStatus === 'loading' ? 'text-yellow-300' : 
                                onlineStatus === 'success' ? 'bg-green-500/20 text-green-300' :
                                'bg-red-500/20 text-red-300'
                            }`}>
                                {onlineMessage}
                            </div>
                        )}
                    </div>
                 </div>
            </div>
           </div>
        )}

        <div className="mt-8 text-center">
          <button onClick={onReturnToMenu} className="py-2 px-7 bg-yellow-400 text-green-900 font-bold rounded-md hover:bg-yellow-500 transition-all text-lg transform hover:scale-105">Voltar ao Menu</button>
        </div>
      </div>
       
      {/* Player Stats Modal */}
      {selectedPlayerForStats && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-fadeInUp" style={{animationDuration: '0.3s'}} onClick={() => setSelectedPlayerForStats(null)}>
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md border-2 border-yellow-400/50" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center mb-1 text-yellow-300">{selectedPlayerForStats.nome}</h2>
                <p className="text-center text-gray-400 mb-4">Estatísticas de Desempenho</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <StatCard icon="🎲" label="Partidas" value={selectedPlayerForStats.matchesPlayed} />
                  <StatCard icon="🏆" label="Vitórias" value={selectedPlayerForStats.wins} />
                  <StatCard icon="🏅" label="Pódios" value={selectedPlayerForStats.podiums} />
                  <StatCard icon="📊" label="Média Posição" value={selectedPlayerForStats.avgPosition.toFixed(2)} />
                </div>
                <h3 className="text-lg font-semibold text-yellow-300 mb-2 text-center">Evolução de Pontos</h3>
                <div className="bg-black/20 p-2 rounded-lg border border-gray-600">
                    <StatsChart data={selectedPlayerForStats.pointsHistory} />
                </div>
                <button onClick={() => setSelectedPlayerForStats(null)} className="mt-6 w-full py-2 bg-yellow-400/80 text-gray-900 font-bold rounded-md hover:bg-yellow-400">Fechar</button>
            </div>
        </div>
      )}

      {/* Match Confirmation Modal */}
      {isMatchConfirmModalOpen && matchToConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-fadeInUp" style={{animationDuration: '0.3s'}}>
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md border-2 border-yellow-400/50" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center mb-4 text-yellow-300">Resumo da Partida</h2>
                
                <div className="space-y-2 text-gray-200 mb-6">
                    <div className="flex justify-between"><span>Data:</span> <span className="font-semibold">{new Date(matchToConfirm.match.data).toLocaleDateString('pt-BR')}</span></div>
                    <div className="flex justify-between"><span>Buy-in:</span> <span className="font-semibold">R$ {matchToConfirm.match.valor_buyin.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Vencedor:</span> <span className="font-semibold text-yellow-300">{matchToConfirm.summary.winnerName}</span></div>
                </div>

                <h3 className="text-lg font-semibold text-center text-yellow-200 mb-2">Classificação Final</h3>
                <div className="max-h-48 overflow-y-auto bg-black/20 p-2 rounded-md border border-gray-600 mb-6">
                    {matchToConfirm.summary.classification.map(item => (
                        <div key={item.name} className="flex justify-between p-1">
                            <span className="text-white">{item.position}º - {item.name}</span>
                        </div>
                    ))}
                </div>

                <p className="text-center text-lg text-white mb-6">Deseja registrar a partida e resultados, confirma?</p>

                <div className="flex justify-center gap-4">
                    <button onClick={() => setIsMatchConfirmModalOpen(false)} className="py-2 px-6 rounded-md font-semibold text-gray-300 bg-gray-600 hover:bg-gray-500 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={confirmAndSaveMatch} className="py-2 px-6 rounded-md font-bold text-gray-900 bg-yellow-400 hover:bg-yellow-500 transition-colors">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
      )}
      
      {/* Match Details Modal */}
      {selectedMatchForDetails && (
         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-fadeInUp" style={{animationDuration: '0.3s'}} onClick={() => setSelectedMatchForDetails(null)}>
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md border-2 border-yellow-400/50" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center mb-4 text-yellow-300">Detalhes da Partida</h2>
                 <div className="space-y-2 text-gray-200 mb-6">
                    <div className="flex justify-between"><span>Data:</span> <span className="font-semibold">{new Date(selectedMatchForDetails.data).toLocaleDateString('pt-BR')}</span></div>
                    <div className="flex justify-between"><span>Buy-in:</span> <span className="font-semibold">R$ {selectedMatchForDetails.valor_buyin.toFixed(2)}</span></div>
                </div>
                <h3 className="text-lg font-semibold text-center text-yellow-200 mb-2">Classificação Final</h3>
                <div className="max-h-60 overflow-y-auto bg-black/20 p-2 rounded-md border border-gray-600 mb-6">
                    {selectedMatchForDetails.classification.map(item => (
                        <div key={item.name} className="flex justify-between p-1">
                            <span className="text-white">{item.position}º - {item.name}</span>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={handleCopyMatchResults} className="flex-grow w-full py-2 px-4 rounded-md font-bold text-gray-900 bg-cyan-400 hover:bg-cyan-500 transition-colors">
                       {copySuccess ? 'Copiado!' : 'Copiar Resultados'}
                    </button>
                    <button onClick={() => setSelectedMatchForDetails(null)} className="w-full sm:w-auto py-2 px-6 rounded-md font-semibold text-gray-300 bg-gray-600 hover:bg-gray-500 transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
      )}

        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        {isCameraModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[60] backdrop-blur-sm p-4">
            <video ref={videoRef} autoPlay className="w-full max-w-lg h-auto rounded-lg mb-4 border-2 border-yellow-400"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            <div className="flex gap-4">
            <button onClick={handleCapturePhoto} className="py-2 px-6 bg-yellow-400 text-green-900 font-bold rounded-md hover:bg-yellow-500 text-lg">Capturar</button>
            <button onClick={closeCamera} className="py-2 px-6 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 text-lg">Cancelar</button>
            </div>
        </div>
        )}
    </div>
  );
};

export default ChampionshipView;