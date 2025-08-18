import { ChampionshipData } from '../types';

const CHAMPIONSHIP_STORAGE_KEY = 'pokerzero3_championship_cloud_mock';
const SYNC_ID_STORAGE_KEY = 'pokerzero3_sync_id';
const CLOUD_API_BASE = 'https://jsonblob.com/api/jsonBlob';

// Simula a latência da rede para uma experiência mais realista
const MOCK_LATENCY_MS = 500;

/**
 * Busca os dados do campeonato do armazenamento local (localStorage).
 * Serve como um cache ou fallback para a sincronização online.
 * @returns Uma promessa que resolve com os dados do campeonato.
 */
export const getChampionshipData = async (): Promise<ChampionshipData> => {
    console.log("API Local: Buscando dados...");
    return new Promise((resolve) => {
        setTimeout(() => {
            try {
                const savedDataJSON = localStorage.getItem(CHAMPIONSHIP_STORAGE_KEY);
                if (savedDataJSON) {
                    const savedData = JSON.parse(savedDataJSON);
                    if (savedData && Array.isArray(savedData.jogadores)) {
                        console.log("API Local: Dados buscados com sucesso.");
                        resolve(savedData);
                        return;
                    }
                }
            } catch (error) {
                console.error("API Error: Falha ao analisar dados do localStorage.", error);
            }
            console.log("API Local: Nenhum dado encontrado, retornando estrutura inicial.");
            resolve({ jogadores: [], partidas: [], resultados: [] });
        }, MOCK_LATENCY_MS);
    });
};

/**
 * Salva o objeto completo de dados do campeonato no armazenamento local.
 * @param data O objeto ChampionshipData completo para salvar.
 * @returns Uma promessa que resolve quando o salvamento é concluído.
 */
export const saveChampionshipData = async (data: ChampionshipData): Promise<void> => {
    console.log("API Local: Salvando dados...");
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                localStorage.setItem(CHAMPIONSHIP_STORAGE_KEY, JSON.stringify(data));
                console.log("API Local: Dados salvos com sucesso.");
                resolve();
            } catch (error) {
                console.error("API Error: Falha ao salvar dados no localStorage.", error);
                reject(error);
            }
        }, MOCK_LATENCY_MS);
    });
};


// --- Funções de Sincronização Online ---

/**
 * Recupera o ID de sincronização do localStorage.
 */
export const getSyncId = (): string | null => {
    return localStorage.getItem(SYNC_ID_STORAGE_KEY);
};

/**
 * Salva o ID de sincronização no localStorage.
 */
export const saveSyncId = (id: string): void => {
    localStorage.setItem(SYNC_ID_STORAGE_KEY, id);
};

/**
 * Cria um novo registro online e retorna seu ID.
 * @param data Os dados do campeonato para salvar.
 * @returns O ID único do novo backup.
 */
export const createOnlineBackup = async (data: ChampionshipData): Promise<string> => {
    const response = await fetch(CLOUD_API_BASE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Falha ao criar o backup online.');
    }
    const location = response.headers.get('Location');
    if (!location) {
        throw new Error('Não foi possível obter o ID do backup online.');
    }
    const id = location.split('/').pop();
    if (!id) {
        throw new Error('ID de backup inválido recebido.');
    }
    return id;
};

/**
 * Atualiza um registro online existente.
 * @param syncId O ID do backup a ser atualizado.
 * @param data Os novos dados do campeonato.
 */
export const updateOnlineBackup = async (syncId: string, data: ChampionshipData): Promise<void> => {
    const response = await fetch(`${CLOUD_API_BASE}/${syncId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Falha ao atualizar o backup online.');
    }
};

/**
 * Recupera um registro online.
 * @param syncId O ID do backup a ser recuperado.
 * @returns Os dados do campeonato.
 */
export const getOnlineBackup = async (syncId: string): Promise<ChampionshipData> => {
    const response = await fetch(`${CLOUD_API_BASE}/${syncId}`);
    if (!response.ok) {
        throw new Error('Falha ao carregar o backup online. Verifique o código.');
    }
    const responseData = await response.json();
    if (!responseData || !Array.isArray(responseData.jogadores) || !Array.isArray(responseData.partidas) || !Array.isArray(responseData.resultados)) {
        throw new Error("Os dados online parecem estar corrompidos ou em formato inválido.");
    }
    return responseData as ChampionshipData;
};