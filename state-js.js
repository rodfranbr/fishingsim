/**
 * state.js - Gerenciamento de estado do jogo
 * Implementa um padrão de gerenciamento de estado imutável para melhor previsibilidade
 */

const GameState = (() => {
  // Estado inicial do jogo
  let state = {
    jogador: { 
      nivel: 1, 
      peixesCapturados: 0 
    },
    ambiente: { 
      clima: "Ensolarado", 
      horaDoDia: "Manhã", 
      profundidade: 10 
    },
    equipamento: { 
      anzol: { capacidade: 1000 }, 
      linha: { espessura: 0.5 } 
    },
    iscaAtual: null,
    ultimaCaptura: null,
    pescaAtiva: false,
    historico: [],
    estatisticas: {
      tentativas: 0,
      capturas: 0,
      fugas: 0,
      maiorPeixe: null,
      tempoTotal: 0
    },
    eventosTemporarios: []
  };
  
  /**
   * Retorna uma cópia do estado completo
   * @returns {Object} Cópia completa do estado atual
   */
  const getState = () => {
    return JSON.parse(JSON.stringify(state));
  };
  
  /**
   * Retorna uma parte específica do estado
   * @param {string} key - Chave do estado a ser retornada
   * @returns {Object} Cópia da parte especificada do estado
   */
  const getPartialState = (key) => {
    if (!state[key]) return null;
    return JSON.parse(JSON.stringify(state[key]));
  };
  
  /**
   * Atualiza o estado com novos valores
   * @param {Object} updates - Objeto com atualizações parciais do estado
   * @returns {Object} Cópia do estado atualizado
   */
  const updateState = (updates) => {
    // Faz uma cópia profunda do estado atual
    const newState = JSON.parse(JSON.stringify(state));
    
    // Aplica as atualizações em cada nível do objeto
    Object.keys(updates).forEach(key => {
      if (typeof updates[key] === 'object' && updates[key] !== null && newState[key]) {
        // Se for um objeto e já existir no estado, mescla
        newState[key] = { ...newState[key], ...updates[key] };
      } else {
        // Caso contrário, substitui diretamente
        newState[key] = updates[key];
      }
    });
    
    // Atualiza o estado
    state = newState;
    
    // Dispara evento de mudança de estado
    EventManager.trigger(GameEvents.STATE_CHANGED, state);
    
    return getState();
  };
  
  /**
   * Adiciona um item ao histórico
   * @param {Object} item - Item a ser adicionado ao histórico
   * @param {number} maxItems - Número máximo de itens no histórico (opcional)
   */
  const addToHistory = (item, maxItems = 10) => {
    const timestamp = new Date().toISOString();
    const newItem = { ...item, timestamp };
    
    const newHistory = [newItem, ...state.historico];
    if (maxItems > 0 && newHistory.length > maxItems) {
      newHistory.length = maxItems;
    }
    
    updateState({ historico: newHistory });
  };
  
  /**
   * Atualiza as estatísticas do jogo
   * @param {Object} stats - Estatísticas a serem atualizadas
   */
  const updateStats = (stats) => {
    const newStats = { ...state.estatisticas, ...stats };
    
    // Lógica especial para maior peixe
    if (stats.novoPeixe) {
      const { novoPeixe } = stats;
      if (!newStats.maiorPeixe || novoPeixe.peso > newStats.maiorPeixe.peso) {
        newStats.maiorPeixe = novoPeixe;
      }
      delete newStats.novoPeixe;
    }
    
    updateState({ estatisticas: newStats });
  };
  
  /**
   * Adiciona um evento temporário ao estado
   * @param {Object} evento - Evento temporário a ser adicionado
   */
  const addTemporaryEvent = (evento) => {
    const expirationTime = Date.now() + (evento.duracao || 30000);
    const newEvent = { ...evento, expiresAt: expirationTime };
    
    const newEvents = [...state.eventosTemporarios, newEvent];
    updateState({ eventosTemporarios: newEvents });
    
    // Configurar remoção automática quando expirar
    setTimeout(() => {
      removeTemporaryEvent(evento.id);
    }, evento.duracao || 30000);
  };
  
  /**
   * Remove um evento temporário do estado
   * @param {string} eventoId - ID do evento a ser removido
   */
  const removeTemporaryEvent = (eventoId) => {
    const newEvents = state.eventosTemporarios.filter(e => e.id !== eventoId);
    updateState({ eventosTemporarios: newEvents });
  };
  
  /**
   * Reseta o estado para os valores iniciais
   */
  const resetState = () => {
    state = {
      jogador: { 
        nivel: 1, 
        peixesCapturados: 0 
      },
      ambiente: { 
        clima: "Ensolarado", 
        horaDoDia: "Manhã", 
        profundidade: 10 
      },
      equipamento: { 
        anzol: { capacidade: 1000 }, 
        linha: { espessura: 0.5 } 
      },
      iscaAtual: null,
      ultimaCaptura: null,
      pescaAtiva: false,
      historico: [],
      estatisticas: {
        tentativas: 0,
        capturas: 0,
        fugas: 0,
        maiorPeixe: null,
        tempoTotal: 0
      },
      eventosTemporarios: []
    };
    
    EventManager.trigger(GameEvents.STATE_CHANGED, state);
    return getState();
  };
  
  // API pública
  return {
    getState,
    getPartialState,
    updateState,
    addToHistory,
    updateStats,
    addTemporaryEvent,
    removeTemporaryEvent,
    resetState
  };
})();
