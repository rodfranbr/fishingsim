/**
 * events.js - Sistema de gerenciamento de eventos
 * Implementa o padrão Observer para comunicação desacoplada entre componentes
 */

const EventManager = (() => {
  const listeners = {};
  
  /**
   * Registra um callback para um evento específico
   * @param {string} evento - Nome do evento
   * @param {function} callback - Função a ser chamada quando o evento ocorrer
   * @returns {function} - Função para remover o listener
   */
  const on = (evento, callback) => {
    if (!listeners[evento]) listeners[evento] = [];
    listeners[evento].push(callback);
    return () => off(evento, callback); // Retorna função para remover listener
  };
  
  /**
   * Remove um callback de um evento
   * @param {string} evento - Nome do evento
   * @param {function} callback - Função a ser removida
   */
  const off = (evento, callback) => {
    if (listeners[evento]) {
      listeners[evento] = listeners[evento].filter(cb => cb !== callback);
    }
  };
  
  /**
   * Dispara um evento com dados associados
   * @param {string} evento - Nome do evento
   * @param {any} data - Dados associados ao evento
   */
  const trigger = (evento, data) => {
    if (listeners[evento]) {
      listeners[evento].forEach(callback => callback(data));
    }
    // Eventos especiais de log para debugging
    if (listeners['*']) {
      listeners['*'].forEach(callback => callback({evento, data}));
    }
    
    // Log de debug
    if (DEBUG_MODE) {
      console.log(`[Evento: ${evento}]`, data);
    }
  };
  
  /**
   * Registra um callback para um evento único (roda apenas uma vez)
   * @param {string} evento - Nome do evento
   * @param {function} callback - Função a ser chamada quando o evento ocorrer
   */
  const once = (evento, callback) => {
    const remover = on(evento, (...args) => {
      remover();
      callback(...args);
    });
  };
  
  /**
   * Remove todos os listeners de um evento
   * @param {string} evento - Nome do evento (opcional, se omitido remove todos)
   */
  const clear = (evento) => {
    if (evento) {
      listeners[evento] = [];
    } else {
      for (const key in listeners) {
        listeners[key] = [];
      }
    }
  };
  
  // API pública
  return {
    on,
    off,
    trigger,
    once,
    clear
  };
})();

/**
 * Eventos do sistema
 * Lista de eventos predefinidos para documentação
 */
const GameEvents = {
  // Eventos de estado
  STATE_CHANGED: 'stateChanged',
  
  // Eventos de pesca
  FISHING_STARTED: 'fishingStarted',
  FISHING_STOPPED: 'fishingStopped',
  FISH_APPEARED: 'fishAppeared',
  FISH_BITE: 'fishBite',
  FISH_MISSED: 'fishMissed',
  FISH_CAUGHT: 'fishCaught',
  FISH_ESCAPED: 'fishEscaped',
  
  // Eventos de equipamento
  BAIT_SELECTED: 'baitSelected',
  BAIT_DEPLETED: 'baitDepleted',
  
  // Eventos de ambiente
  ENVIRONMENT_CHANGED: 'environmentChanged',
  DEPTH_CHANGED: 'depthChanged',
  
  // Eventos especiais
  RARE_EVENT: 'eventoRaro',
  LEVEL_UP: 'levelUp'
};
