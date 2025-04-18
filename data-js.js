/**
 * data.js - Dados do jogo (peixes, iscas, etc.)
 */

const GameData = (() => {
  // Peixes
  const peixes = [
    {
      id: "lambari",
      nome: "Lambari",
      preferenciaSabor: {
        doce: 0.7,
        salgado: 0.3,
        azedo: 0.4,
        amargo: 0.1,
        umami: 0.2
      },
      profundidade: {
        min: 1,
        max: 15
      },
      peso: 150,  // em gramas
      timidez: 0.2,  // 0 a 1
      raridade: 0.1  // 0 a 1
    },
    {
      id: "tilapia",
      nome: "Tilápia",
      preferenciaSabor: {
        doce: 0.3,
        salgado: 0.5,
        azedo: 0.2,
        amargo: 0.3,
        umami: 0.5
      },
      profundidade: {
        min: 3,
        max: 25
      },
      peso: 500,
      timidez: 0.3,
      raridade: 0.2
    },
    {
      id: "traira",
      nome: "Traíra",
      preferenciaSabor: {
        doce: 0.1,
        salgado: 0.6,
        azedo: 0.1,
        amargo: 0.2,
        umami: 0.8
      },
      profundidade: {
        min: 5,
        max: 30
      },
      peso: 800,
      timidez: 0.5,
      raridade: 0.3
    },
    {
      id: "tucunare",
      nome: "Tucunaré",
      preferenciaSabor: {
        doce: 0.2,
        salgado: 0.4,
        azedo: 0.2,
        amargo: 0.1,
        umami: 0.9
      },
      profundidade: {
        min: 8,
        max: 35
      },
      peso: 1200,
      timidez: 0.6,
      raridade: 0.4
    },
    {
      id: "dourado",
      nome: "Dourado",
      preferenciaSabor: {
        doce: 0.3,
        salgado: 0.7,
        azedo: 0.1,
        amargo: 0.3,
        umami: 0.7
      },
      profundidade: {
        min: 10,
        max: 40
      },
      peso: 3000,
      timidez: 0.7,
      raridade: 0.6
    },
    {
      id: "pintado",
      nome: "Pintado",
      preferenciaSabor: {
        doce: 0.1,
        salgado: 0.8,
        azedo: 0.2,
        amargo: 0.1,
        umami: 0.9
      },
      profundidade: {
        min: 15,
        max: 45
      },
      peso: 5000,
      timidez: 0.8,
      raridade: 0.7
    },
    {
      id: "pirarucu",
      nome: "Pirarucu",
      preferenciaSabor: {
        doce: 0.1,
        salgado: 0.9,
        azedo: 0.1,
        amargo: 0.2,
        umami: 1.0
      },
      profundidade: {
        min: 20,
        max: 50
      },
      peso: 10000,
      timidez: 0.9,
      raridade: 0.9
    },
    {
      id: "peixeGloria",
      nome: "Peixe Glória",
      preferenciaSabor: {
        doce: 0.5,
        salgado: 0.5,
        azedo: 0.5,
        amargo: 0.5,
        umami: 0.5
      },
      profundidade: {
        min: 25,
        max: 50
      },
      peso: 15000,
      timidez: 1.0,
      raridade: 0.99
    }
  ];

  // Iscas
  const iscas = [
    {
      id: "minhoca",
      nome: "Minhoca",
      sabor: {
        doce: 0.2,
        salgado: 0.1,
        azedo: 0.4,
        amargo: 0.3,
        umami: 0.3
      },
      durabilidade: 5  // Usos restantes
    },
    {
      id: "milho",
      nome: "Milho",
      sabor: {
        doce: 0.8,
        salgado: 0.1,
        azedo: 0.1,
        amargo: 0.0,
        umami: 0.2
      },
      durabilidade: 3
    },
    {
      id: "massaPao",
      nome: "Massa de Pão",
      sabor: {
        doce: 0.6,
        salgado: 0.3,
        azedo: 0.0,
        amargo: 0.1,
        umami: 0.2
      },
      durabilidade: 2
    },
    {
      id: "camarao",
      nome: "Camarão",
      sabor: {
        doce: 0.1,
        salgado: 0.8,
        azedo: 0.1,
        amargo: 0.0,
        umami: 0.9
      },
      durabilidade: 4
    },
    {
      id: "iscaArtificial",
      nome: "Isca Artificial",
      sabor: {
        doce: 0.3,
        salgado: 0.5,
        azedo: 0.2,
        amargo: 0.2,
        umami: 0.5
      },
      durabilidade: 10
    },
    {
      id: "fruta",
      nome: "Fruta",
      sabor: {
        doce: 0.9,
        salgado: 0.0,
        azedo: 0.3,
        amargo: 0.2,
        umami: 0.1
      },
      durabilidade: 3
    }
  ];

  // Eventos raros
  const eventosRaros = [
    {
      id: 'cardume',
      nome: 'Cardume Inesperado!',
      descricao: 'Um cardume apareceu! Chance de capturar múltiplos peixes.',
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
      descricao: 'Sua linha está temporariamente reforçada. Nenhum peixe escapa!',
      efeito: (state) => {
        return state;
        // Lógica implementada no RulesSystem
      }
    },
    {
      id: 'peixeFantasma',
      nome: 'Peixe Fantasma!',
      descricao: 'Um peixe parece estar assustando os outros. Redução de mordidas temporariamente.',
      efeito: (state) => {
        return state;
        // Lógica implementada no RulesSystem
      }
    },
    {
      id: 'aguaCristalina',
      nome: 'Água Cristalina!',
      descricao: 'A visibilidade melhorou! Aumento na chance de captura.',
      efeito: (state) => {
        return state;
        // Lógica implementada no RulesSystem
      }
    }
  ];

  // Indexação de peixes por faixa de profundidade para pesquisa eficiente
  const indexarPeixesPorProfundidade = (peixes) => {
    const index = {};
    const maxProf = Math.max(...peixes.map(p => p.profundidade.max));
    
    for (let prof = 1; prof <= maxProf; prof++) {
      index[prof] = peixes.filter(p => 
        prof >= p.profundidade.min && prof <= p.profundidade.max
      );
    }
    
    return index;
  };

  // Cria o índice na inicialização
  const peixesPorProfundidade = indexarPeixesPorProfundidade(peixes);

  // Retorna todos os peixes disponíveis em uma determinada profundidade
  const getPeixesNaProfundidade = (profundidade) => {
    return peixesPorProfundidade[Math.min(profundidade, 50)] || [];
  };

  // API pública
  return {
    peixes,
    iscas,
    eventosRaros,
    getPeixesNaProfundidade
  };
})();
