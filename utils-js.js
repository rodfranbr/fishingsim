/**
 * utils.js - Funções utilitárias para o Simulador de Pesca
 */

// Configuração de debugging
const DEBUG_MODE = false;

/**
 * Implementação de memoização para otimizar cálculos repetitivos
 */
function memoize(fn) {
  const cache = {};
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache[key] === undefined) {
      cache[key] = fn(...args);
    }
    return cache[key];
  };
}

/**
 * Sistema de Aleatoriedade Otimizado
 */
const RandomSystem = (() => {
  // Implementação Box-Muller para distribuição normal
  const randomNormal = (mean = 0, stdDev = 1) => {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  };
  
  // Fator de sorte com distribuição normal limitada
  const fatorDeSorte = () => {
    return Math.max(-0.2, Math.min(0.2, randomNormal(0, 0.1)));
  };
  
  // Sistema de ponderação para seleção de peixes com base em raridade
  const escolhaPonderada = (items, getWeight) => {
    const totalWeight = items.reduce((sum, item) => sum + getWeight(item), 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
      random -= getWeight(item);
      if (random <= 0) return item;
    }
    
    return items[items.length - 1]; // Fallback
  };
  
  return {
    randomNormal,
    fatorDeSorte,
    escolhaPonderada
  };
})();

/**
 * Cálculos vetoriais para compatibilidade de sabores
 */
const VectorMath = (() => {
  // Cálculo de produto escalar para compatibilidade de sabores
  const calcProdutoEscalar = (v1, v2) => {
    return Object.keys(v1).reduce((sum, key) => sum + (v1[key] * (v2[key] || 0)), 0);
  };
  
  // Cálculo de magnitude de vetor
  const calcMagnitudeVetor = (v) => {
    return Math.sqrt(Object.values(v).reduce((sum, val) => sum + val * val, 0));
  };
  
  // Compatibilidade normalizada entre isca e peixe (cosseno entre vetores)
  const calcCompatibilidade = (isca, peixe) => {
    const produtoEscalar = calcProdutoEscalar(isca.sabor, peixe.preferenciaSabor);
    const magnitudeIsca = calcMagnitudeVetor(isca.sabor);
    const magnitudePeixe = calcMagnitudeVetor(peixe.preferenciaSabor);
    
    if (magnitudeIsca === 0 || magnitudePeixe === 0) return 0;
    return produtoEscalar / (magnitudeIsca * magnitudePeixe);
  };
  
  // Memoize para otimização
  const memoizedCalcCompatibilidade = memoize(calcCompatibilidade);
  
  return {
    calcProdutoEscalar,
    calcMagnitudeVetor,
    calcCompatibilidade: memoizedCalcCompatibilidade
  };
})();

/**
 * Formatação de números e valores
 */
const Formatter = (() => {
  const formatPercentage = (value) => {
    return (value * 100).toFixed(1) + '%';
  };
  
  const formatWeight = (value) => {
    return value + 'g';
  };
  
  return {
    formatPercentage,
    formatWeight
  };
})();

/**
 * Funções para animações
 */
const Animation = (() => {
  const animateFishZone = (fishElement, initialY, finalY, duration = 2000) => {
    const startTime = Date.now();
    const animationFrame = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Função easeInOutQuad para movimento mais natural
      const easeValue = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      const currentY = initialY + (finalY - initialY) * easeValue;
      fishElement.style.top = currentY + 'px';
      
      if (progress < 1) {
        requestAnimationFrame(animationFrame);
      }
    };
    
    requestAnimationFrame(animationFrame);
  };
  
  const createFishElement = (fish, container) => {
    const fishElement = document.createElement('div');
    fishElement.className = 'fish';
    fishElement.dataset.id = fish.id;
    
    // Ajusta o tamanho com base no peso do peixe (normalizado)
    const size = 30 + (fish.peso / 5000) * 50;
    fishElement.style.width = size + 'px';
    fishElement.style.height = (size / 2) + 'px';
    
    // Cores baseadas na raridade
    const hue = 200 - (fish.raridade * 180); // 200 (azul) para comum, 20 (laranja/vermelho) para raro
    fishElement.style.backgroundColor = `hsl(${hue}, 80%, 50%)`;
    
    // Posicionamento aleatório horizontal
    const containerWidth = container.offsetWidth;
    const randomX = Math.random() * (containerWidth - size);
    fishElement.style.left = randomX + 'px';
    
    // Começar fora da área visível (abaixo)
    const initialY = container.offsetHeight + 50;
    fishElement.style.top = initialY + 'px';
    
    container.appendChild(fishElement);
    
    // Animar entrada do peixe
    const finalY = 50 + Math.random() * (container.offsetHeight - 100);
    animateFishZone(fishElement, initialY, finalY);
    
    return fishElement;
  };
  
  return {
    animateFishZone,
    createFishElement
  };
})();
