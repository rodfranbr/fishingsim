/**
 * engine.js - Motor principal do simulador de pesca
 * Implementa as mecânicas de jogo, cálculos de probabilidade e interações principais
 */

const FishingEngine = (() => {
    // Armazena referência para a simulação temporal
    let simulacao = null;
    // Estado interno do motor
    let motorAtivo = false;
    // Último tick em que houve verificação de peixe
    let ultimaVerificacao = 0;
    // Intervalo entre verificações de peixe (em segundos)
    const INTERVALO_VERIFICACAO = 3;

    /**
     * Sistema de Probabilidade
     */
    const ProbabilitySystem = (() => {
        // Cálculo de produto escalar para compatibilidade de sabores
        const calcProdutoEscalar = (v1, v2) => {
            return Object.keys(v1).reduce((sum, key) => sum + (v1[key] * v2[key]), 0);
        };
        
        // Cálculo de magnitude de vetor
        const calcMagnitudeVetor = (v) => {
            return Math.sqrt(Object.values(v).reduce((sum, val) => sum + val * val, 0));
        };
        
        // Compatibilidade normalizada entre isca e peixe (cosseno entre vetores)
        const calcCompatibilidade = memoize((isca, peixe) => {
            const produtoEscalar = calcProdutoEscalar(isca.sabor, peixe.preferenciaSabor);
            const magnitudeIsca = calcMagnitudeVetor(isca.sabor);
            const magnitudePeixe = calcMagnitudeVetor(peixe.preferenciaSabor);
            
            if (magnitudeIsca === 0 || magnitudePeixe === 0) return 0;
            return produtoEscalar / (magnitudeIsca * magnitudePeixe);
        });
        
        // Sistema geral de probabilidade
        const calcProbabilidade = (base, fatores = [], modificadores = []) => {
            let prob = base;
            // Aplicar fatores multiplicativos
            fatores.forEach(fator => prob *= fator);
            // Aplicar modificadores aditivos
            modificadores.forEach(mod => prob += mod);
            
            // Garantir intervalo [0,1]
            return Math.max(0, Math.min(1, prob));
        };
        
        return {
            calcCompatibilidade,
            calcProbabilidade
        };
    })();

    /**
     * Sistema de Regras
     */
    const RulesSystem = (() => {
        const regrasBase = {
            chanceEventoRaro: 0.02,
            bonusNivelBase: 0.05,
            maxBonusNivel: 0.15,
            modificadorClimaEnsolarado: 1.2,
            modificadorClimaNublado: 1.0,
            modificadorClimaChuvoso: 0.8,
            modificadorManha: 1.1,
            modificadorTarde: 1.0,
            modificadorNoite: 0.9,
            chancePeixeBase: 0.6,
            chanceMordidaBase: 0.5,
            chanceFugaBase: 0.3
        };
        
        let regras = {...regrasBase};
        let modificadoresTemporarios = [];
        
        // Limpar modificadores expirados
        const limparModificadoresExpirados = () => {
            const agora = Date.now();
            modificadoresTemporarios = modificadoresTemporarios.filter(mod => mod.expiraEm > agora);
        };
        
        return {
            getRegra: (nome) => {
                limparModificadoresExpirados();
                
                let valor = regras[nome];
                if (valor === undefined) return null;
                
                // Aplicar modificadores
                modificadoresTemporarios.forEach(mod => {
                    if (mod.regra === nome) {
                        valor = mod.modificador(valor);
                    }
                });
                
                return valor;
            },
            
            adicionarModificadorTemporario: (nome, modificador, duracao) => {
                modificadoresTemporarios.push({
                    regra: nome,
                    modificador,
                    expiraEm: Date.now() + duracao
                });
            },
            
            resetarRegras: () => {
                regras = {...regrasBase};
                modificadoresTemporarios = [];
            }
        };
    })();

    /**
     * Calcula o bônus baseado no nível do jogador
     */
    const calcularBonusNivel = (nivel) => {
        const bonusBase = RulesSystem.getRegra('bonusNivelBase');
        const maxBonus = RulesSystem.getRegra('maxBonusNivel');
        
        // Fórmula de progressão logarítmica (diminui retornos em níveis altos)
        return Math.min(maxBonus, bonusBase * Math.log10(nivel + 1));
    };

    /**
     * Calcula o nível do jogador com base nos peixes capturados
     */
    const calcularNivelJogador = (peixesCapturados) => {
        // Fórmula de progressão com aumento de dificuldade
        return Math.floor(Math.pow(peixesCapturados, 0.8) / 2) + 1;
    };

    /**
     * Processa possíveis eventos raros durante a pesca
     */
    const processarEventosRaros = () => {
        const chanceEvento = RulesSystem.getRegra('chanceEventoRaro');
        if (Math.random() > chanceEvento) return null;
        
        const eventos = [
            {
                id: 'cardume',
                nome: 'Cardume Inesperado!',
                descricao: 'Você encontrou um cardume! Sua próxima captura será duplicada.',
                efeito: (state) => {
                    if (state.ultimaCaptura) {
                        // Duplica o último peixe capturado
                        return {...state, peixesDuplicados: (state.peixesDuplicados || 0) + 1};
                    }
                    return state;
                }
            },
            {
                id: 'linhaMilagrosa',
                nome: 'Linha Milagrosa!',
                descricao: 'Sua linha está com uma resistência incrível por 30 segundos!',
                efeito: (state) => {
                    // Reduz chance de fuga temporariamente
                    RulesSystem.adicionarModificadorTemporario(
                        'chanceFuga', 
                        valor => valor * 0.2, 
                        30000 // 30 segundos
                    );
                    return state;
                }
            },
            {
                id: 'peixeFantasma',
                nome: 'Peixe Fantasma!',
                descricao: 'Um peixe fantasma assustou os outros! Sem mordidas por 15 segundos.',
                efeito: (state) => {
                    // Nenhuma mordida por 15 segundos
                    RulesSystem.adicionarModificadorTemporario(
                        'chanceMordida',
                        valor => valor * 0.1,
                        15000 // 15 segundos
                    );
                    return state;
                }
            },
            {
                id: 'aguaCristalina',
                nome: 'Água Cristalina!',
                descricao: 'A água está super clara! Chance de pesca aumentada por 45 segundos.',
                efeito: (state) => {
                    // Aumenta chance de peixe aparecer
                    RulesSystem.adicionarModificadorTemporario(
                        'chancePeixeBase',
                        valor => valor * 1.5,
                        45000 // 45 segundos
                    );
                    return state;
                }
            }
        ];
        
        // Escolha aleatória de evento
        const eventoEscolhido = eventos[Math.floor(Math.random() * eventos.length)];
        
        // Aplicar efeito ao estado do jogo
        const state = GameState.getState();
        const updatedState = eventoEscolhido.efeito(state);
        GameState.updateState(updatedState);
        
        // Disparar evento
        EventManager.trigger('eventoRaro', eventoEscolhido);
        
        return eventoEscolhido;
    };

    /**
     * Filtra peixes disponíveis com base na profundidade atual
     */
    const filtrarPeixesPorProfundidade = (profundidade) => {
        return GameData.peixes.filter(peixe => 
            profundidade >= peixe.profundidade.min && 
            profundidade <= peixe.profundidade.max
        );
    };

    /**
     * Seleciona um peixe aleatório considerando raridade e profundidade
     */
    const selecionarPeixeAleatorio = (profundidade) => {
        const peixesDisponiveis = filtrarPeixesPorProfundidade(profundidade);
        
        if (peixesDisponiveis.length === 0) {
            return null;
        }
        
        // Usar escolha ponderada pela raridade inversa (quanto mais raro, menos chance)
        return RandomSystem.escolhaPonderada(
            peixesDisponiveis, 
            peixe => 1 - peixe.raridade
        );
    };

    /**
     * Verifica se um peixe aparece baseado em condições ambientais e sorte
     */
    const verificarAparicaoPeixe = () => {
        const state = GameState.getState();
        const profundidade = state.ambiente.profundidade;
        
        // Chance base modificada por fatores ambientais e sorte
        const chancePeixeBase = RulesSystem.getRegra('chancePeixeBase');
        const fatorSorte = RandomSystem.fatorDeSorte();
        
        // Calcular chance final de aparição
        const chanceAparicao = ProbabilitySystem.calcProbabilidade(
            chancePeixeBase,
            [], // Fatores multiplicativos
            [fatorSorte] // Modificadores aditivos
        );
        
        // Verificar se aparece um peixe
        if (Math.random() <= chanceAparicao) {
            const peixe = selecionarPeixeAleatorio(profundidade);
            if (peixe) {
                return verificarMordida(peixe);
            }
        }
        
        return false;
    };

    /**
     * Verifica se o peixe morde a isca
     */
    const verificarMordida = (peixe) => {
        const state = GameState.getState();
        
        // Se não há isca, não há mordida
        if (!state.iscaAtual) {
            return false;
        }
        
        const isca = state.iscaAtual;
        
        // Calcular compatibilidade entre isca e peixe
        const compatibilidade = ProbabilitySystem.calcCompatibilidade(isca, peixe);
        
        // Fatores ambientais
        let fatorClima = 1.0;
        switch (state.ambiente.clima) {
            case 'Ensolarado': 
                fatorClima = RulesSystem.getRegra('modificadorClimaEnsolarado'); 
                break;
            case 'Nublado': 
                fatorClima = RulesSystem.getRegra('modificadorClimaNublado'); 
                break;
            case 'Chuvoso': 
                fatorClima = RulesSystem.getRegra('modificadorClimaChuvoso'); 
                break;
        }
        
        let fatorHora = 1.0;
        switch (state.ambiente.horaDoDia) {
            case 'Manhã': 
                fatorHora = RulesSystem.getRegra('modificadorManha'); 
                break;
            case 'Tarde': 
                fatorHora = RulesSystem.getRegra('modificadorTarde'); 
                break;
            case 'Noite': 
                fatorHora = RulesSystem.getRegra('modificadorNoite'); 
                break;
        }
        
        // Bônus de nível do jogador
        const bonusNivel = calcularBonusNivel(state.jogador.nivel);
        
        // Fator de sorte
        const fatorSorte = RandomSystem.fatorDeSorte();
        
        // Chance base de mordida
        const chanceMordidaBase = RulesSystem.getRegra('chanceMordidaBase');
        
        // Calcular chance final de mordida
        const chanceMordida = ProbabilitySystem.calcProbabilidade(
            chanceMordidaBase,
            [compatibilidade, fatorClima, fatorHora], // Fatores multiplicativos
            [bonusNivel, fatorSorte] // Modificadores aditivos
        );
        
        // Log para debug
        console.log('Tentativa de captura:', {
            peixe: peixe.nome,
            compatibilidade: compatibilidade.toFixed(2),
            fatorClima: fatorClima.toFixed(2),
            fatorHora: fatorHora.toFixed(2),
            bonusNivel: bonusNivel.toFixed(2),
            fatorSorte: fatorSorte.toFixed(2),
            chanceMordida: chanceMordida.toFixed(2)
        });
        
        // Verificar se o peixe mordeu
        if (Math.random() <= chanceMordida) {
            return verificarCaptura(peixe);
        }
        
        return false;
    };

    /**
     * Verifica se o peixe é capturado ou escapa
     */
    const verificarCaptura = (peixe) => {
        const state = GameState.getState();
        
        // Calcular chance de fuga baseado no peso do peixe vs capacidade do anzol
        const razaoPeso = peixe.peso / state.equipamento.anzol.capacidade;
        
        // Ajuste por timidez do peixe vs espessura da linha
        const ajusteTimidez = peixe.timidez * (1 / state.equipamento.linha.espessura);
        
        // Bônus de nível reduz chance de fuga
        const reducaoNivel = calcularBonusNivel(state.jogador.nivel) * 0.5;
        
        // Chance base de fuga
        const chanceFugaBase = RulesSystem.getRegra('chanceFugaBase');
        
        // Calcular chance final de fuga
        const chanceFuga = ProbabilitySystem.calcProbabilidade(
            chanceFugaBase,
            [razaoPeso, ajusteTimidez], // Fatores multiplicativos
            [-reducaoNivel, RandomSystem.fatorDeSorte()] // Modificadores aditivos (reduce é negativo)
        );
        
        // Atualizar estatísticas de tentativas
        const estatisticas = state.estatisticas || { tentativas: 0 };
        estatisticas.tentativas = (estatisticas.tentativas || 0) + 1;
        GameState.updateState({ estatisticas });
        
        // Verificar se o peixe escapa
        if (Math.random() <= chanceFuga) {
            // Peixe fugiu
            EventManager.trigger('peixeFugiu', { peixe });
            return false;
        }
        
        // Peixe capturado!
        const peixeCapturado = {
            ...peixe,
            // Variação no peso para cada captura (10% para cima ou para baixo)
            peso: Math.round(peixe.peso * (0.9 + 0.2 * Math.random()))
        };
        
        // Verificar recorde de maior peixe
        if (!estatisticas.maiorPeixe || peixeCapturado.peso > estatisticas.maiorPeixe.peso) {
            estatisticas.maiorPeixe = peixeCapturado;
            GameState.updateState({ estatisticas });
        }
        
        // Disparar evento de captura
        EventManager.trigger('fishCaught', { peixe: peixeCapturado });
        
        // Processar possível evento raro após captura
        setTimeout(() => processarEventosRaros(), 500);
        
        return true;
    };

    /**
     * Handler para cada tick da simulação
     */
    const onSimulacaoTick = (deltaTime, tempoTotal) => {
        if (!motorAtivo) return;
        
        // Verificar peixe a cada INTERVALO_VERIFICACAO segundos
        if (tempoTotal >= ultimaVerificacao + INTERVALO_VERIFICACAO) {
            ultimaVerificacao = tempoTotal;
            verificarAparicaoPeixe();
        }
        
        // Animar águas ou linha aqui, se necessário
        const fishZone = document.getElementById('fish-zone');
        if (Math.random() < 0.1) {
            // 10% de chance de criar um peixe animado na zona de pesca
            const fishElement = document.createElement('div');
            fishElement.className = 'fish-animation';
            fishElement.style.top = `${Math.random() * 70 + 15}%`;
            fishElement.style.left = `-50px`;
            fishElement.style.opacity = '0.6';
            fishZone.appendChild(fishElement);
            
            // Animar o peixe da esquerda para a direita
            setTimeout(() => {
                fishElement.style.left = '110%';
            }, 50);
            
            // Remover após animação
            setTimeout(() => {
                fishZone.removeChild(fishElement);
            }, 5000);
        }
    };

    /**
     * Inicia o processo de pesca
     */
    const startFishing = () => {
        if (motorAtivo) return;
        
        motorAtivo = true;
        ultimaVerificacao = 0;
        
        // Criar simulação temporal se não existir
        if (!simulacao) {
            simulacao = new SimulacaoTemporal(100); // 100ms por tick
            simulacao.addHandler(onSimulacaoTick);
        }
        
        // Iniciar simulação
        simulacao.start();
        
        // Evento de início de pesca
        EventManager.trigger('pescaIniciada', { 
            profundidade: GameState.getState().ambiente.profundidade,
            isca: GameState.getState().iscaAtual
        });
    };

    /**
     * Para o processo de pesca
     */
    const stopFishing = () => {
        if (!motorAtivo) return;
        
        motorAtivo = false;
        
        // Parar simulação
        if (simulacao) {
            simulacao.stop();
        }
        
        // Evento de fim de pesca
        EventManager.trigger('pescaEncerrada', { 
            duracao: simulacao ? simulacao.elapsedTime : 0
        });
    };

    /**
     * Reinicia o motor de pesca
     */
    const resetFishing = () => {
        stopFishing();
        
        // Reiniciar simulação
        if (simulacao) {
            simulacao.reset();
        }
        
        // Resetar regras
        RulesSystem.resetarRegras();
    };

    // API pública do motor
    return {
        startFishing,
        stopFishing,
        resetFishing,
        calcularNivelJogador,
        verificarAparicaoPeixe,
        ProbabilitySystem,
        RulesSystem
    };
})();

/**
 * Classe para simulação temporal
 */
class SimulacaoTemporal {
    constructor(tickRate = 1000) {
        this.tickRate = tickRate;
        this.handlers = [];
        this.intervalId = null;
        this.elapsedTime = 0;
    }
    
    addHandler(handler) {
        this.handlers.push(handler);
        return this; // Para encadeamento
    }
    
    start() {
        if (this.intervalId) return this;
        
        const deltaTime = this.tickRate / 1000; // Converter para segundos
        this.intervalId = setInterval(() => {
            this.elapsedTime += deltaTime;
            this.handlers.forEach(h => h(deltaTime, this.elapsedTime));
        }, this.tickRate);
        
        EventManager.trigger('simulacao:inicio', {tickRate: this.tickRate});
        return this;
    }
    
    stop() {
        if (!this.intervalId) return this;
        
        clearInterval(this.intervalId);
        this.intervalId = null;
        EventManager.trigger('simulacao:parada', {tempoTotal: this.elapsedTime});
        return this;
    }
    
    reset() {
        this.stop();
        this.elapsedTime = 0;
        EventManager.trigger('simulacao:reset');
        return this;
    }
}
