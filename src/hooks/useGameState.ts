import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, PlacedBuilding, ResourceType } from '../types';
import { getBuildingConfig } from '../data/buildings';

const GRID_SIZE = 30;
const SAVE_KEY = 'yaga_den_save';
const TICK_INTERVAL = 1000; // 1 секунда

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function getInitialState(): GameState {
  return {
    resources: { metal: 500, fuel: 200, minerals: 150, recruits: 0 },
    population: 0,
    maxPopulation: 10,
    buildings: [],
    gridSize: GRID_SIZE,
  };
}

function loadState(): GameState {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const state = JSON.parse(saved) as GameState;
      // Process offline production - update building states based on elapsed time
      const now = Date.now();
      state.buildings = state.buildings.map(b => {
        if (b.state === 'building') {
          // Calculate build progress based on time
          return b;
        }
        if (b.state === 'producing' && b.productionStartTime && b.productionDuration) {
          const elapsed = (now - b.productionStartTime) / 1000;
          const duration = b.productionDuration;
          if (elapsed >= duration) {
            return { ...b, state: 'ready' as const, productionProgress: 100 };
          } else {
            return { ...b, productionProgress: (elapsed / duration) * 100 };
          }
        }
        return b;
      });
      return state;
    }
  } catch (e) {
    console.error('Failed to load save:', e);
  }
  return getInitialState();
}

function saveState(state: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save:', e);
  }
}

export function useGameState() {
  const [state, setState] = useState<GameState>(loadState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveState(stateRef.current);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Save on page unload
  useEffect(() => {
    const handler = () => saveState(stateRef.current);
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Game tick - update production timers
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const now = Date.now();
        let changed = false;
        const buildings = prev.buildings.map(b => {
          if (b.state === 'building') {
            const config = getBuildingConfig(b.configId);
            if (!config) return b;
            const elapsed = (now - (b.productionStartTime || now)) / 1000;
            const progress = Math.min(100, (elapsed / config.buildTimeSeconds) * 100);
            if (progress >= 100) {
              changed = true;
              return { ...b, state: 'idle' as const, buildProgress: 100 };
            }
            if (progress !== b.buildProgress) {
              changed = true;
              return { ...b, buildProgress: progress };
            }
          }
          if (b.state === 'producing' && b.productionStartTime && b.productionDuration) {
            const elapsed = (now - b.productionStartTime) / 1000;
            const progress = Math.min(100, (elapsed / b.productionDuration) * 100);
            if (progress >= 100) {
              changed = true;
              return { ...b, state: 'ready' as const, productionProgress: 100 };
            }
            if (Math.abs(progress - b.productionProgress) > 0.5) {
              changed = true;
              return { ...b, productionProgress: progress };
            }
          }
          return b;
        });
        if (changed) return { ...prev, buildings };
        return prev;
      });
    }, TICK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const canPlace = useCallback((x: number, y: number, width: number, height: number, excludeId?: string): boolean => {
    if (x < 0 || y < 0 || x + width > GRID_SIZE || y + height > GRID_SIZE) return false;
    return !state.buildings.some(b => {
      if (excludeId && b.instanceId === excludeId) return false;
      const config = getBuildingConfig(b.configId);
      if (!config) return false;
      const bx = b.x, by = b.y, bw = config.width, bh = config.height;
      return !(x + width <= bx || x >= bx + bw || y + height <= by || y >= by + bh);
    });
  }, [state.buildings]);

  const placeBuilding = useCallback((configId: string, x: number, y: number) => {
    const config = getBuildingConfig(configId);
    if (!config) return false;

    // Check cost
    for (const [res, amount] of Object.entries(config.cost)) {
      if (state.resources[res as ResourceType] < (amount || 0)) return false;
    }

    // Check population requirement
    if (config.populationRequired && state.population < config.populationRequired) return false;

    // Check placement
    if (!canPlace(x, y, config.width, config.height)) return false;

    const newBuilding: PlacedBuilding = {
      instanceId: generateId(),
      configId,
      x, y,
      state: 'building',
      buildProgress: 0,
      currentTariffIndex: null,
      productionProgress: 0,
      productionStartTime: Date.now(),
      productionDuration: null,
    };

    setState(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        metal: prev.resources.metal - (config.cost.metal || 0),
        fuel: prev.resources.fuel - (config.cost.fuel || 0),
        minerals: prev.resources.minerals - (config.cost.minerals || 0),
        recruits: prev.resources.recruits - (config.cost.recruits || 0),
      },
      buildings: [...prev.buildings, newBuilding],
      population: config.populationBonus
        ? prev.population + config.populationBonus
        : prev.population,
      maxPopulation: config.populationBonus
        ? prev.maxPopulation + config.populationBonus
        : prev.maxPopulation,
    }));

    return true;
  }, [state.resources, state.population, canPlace]);

  const moveBuilding = useCallback((instanceId: string, newX: number, newY: number) => {
    const building = state.buildings.find(b => b.instanceId === instanceId);
    if (!building) return false;
    const config = getBuildingConfig(building.configId);
    if (!config) return false;

    if (!canPlace(newX, newY, config.width, config.height, instanceId)) return false;

    setState(prev => ({
      ...prev,
      buildings: prev.buildings.map(b =>
        b.instanceId === instanceId ? { ...b, x: newX, y: newY } : b
      ),
    }));
    return true;
  }, [state.buildings, canPlace]);

  const startProduction = useCallback((instanceId: string, tariffIndex: number) => {
    const building = state.buildings.find(b => b.instanceId === instanceId);
    if (!building || building.state !== 'idle') return false;
    const config = getBuildingConfig(building.configId);
    if (!config || !config.tariffs) return false;
    const tariff = config.tariffs[tariffIndex];
    if (!tariff) return false;

    setState(prev => ({
      ...prev,
      buildings: prev.buildings.map(b =>
        b.instanceId === instanceId
          ? {
              ...b,
              state: 'producing' as const,
              currentTariffIndex: tariffIndex,
              productionProgress: 0,
              productionStartTime: Date.now(),
              productionDuration: tariff.durationSeconds,
            }
          : b
      ),
    }));
    return true;
  }, [state.buildings]);

  const collectProduction = useCallback((instanceId: string) => {
    const building = state.buildings.find(b => b.instanceId === instanceId);
    if (!building || building.state !== 'ready') return false;
    const config = getBuildingConfig(building.configId);
    if (!config || !config.tariffs || building.currentTariffIndex === null) return false;
    const tariff = config.tariffs[building.currentTariffIndex];
    if (!tariff || !config.produces) return false;

    setState(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        [config.produces!]: prev.resources[config.produces!] + tariff.amount,
      },
      buildings: prev.buildings.map(b =>
        b.instanceId === instanceId
          ? {
              ...b,
              state: 'idle' as const,
              currentTariffIndex: null,
              productionProgress: 0,
              productionStartTime: null,
              productionDuration: null,
            }
          : b
      ),
    }));
    return true;
  }, [state.buildings]);

  const manualSave = useCallback(() => {
    saveState(stateRef.current);
  }, []);

  const resetGame = useCallback(() => {
    const initial = getInitialState();
    setState(initial);
    saveState(initial);
  }, []);

  return {
    state,
    canPlace,
    placeBuilding,
    moveBuilding,
    startProduction,
    collectProduction,
    manualSave,
    resetGame,
  };
}
