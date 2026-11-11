// === ТИПЫ ДАННЫХ ===
// Все здания, войска и сценарии — данные, а не код.
// Это аналог ScriptableObject из Unity.

export type ResourceType = 'metal' | 'fuel' | 'minerals' | 'recruits';

export interface ProductionTariff {
  amount: number;
  durationSeconds: number;
  label: string;
}

export interface BuildingConfig {
  id: string;
  name: string;
  description: string;
  category: 'headquarters' | 'production' | 'military' | 'decoration';
  width: number;
  height: number;
  buildTimeSeconds: number;
  cost: Partial<Record<ResourceType, number>>;
  produces?: ResourceType;
  tariffs?: ProductionTariff[];
  populationBonus?: number;
  populationRequired?: number;
  color: string;
  icon: string;
}

export interface PlacedBuilding {
  instanceId: string;
  configId: string;
  x: number;
  y: number;
  state: 'building' | 'idle' | 'producing' | 'ready';
  buildProgress: number; // 0-100
  currentTariffIndex: number | null;
  productionProgress: number; // 0-100
  productionStartTime: number | null;
  productionDuration: number | null;
}

export interface GameState {
  resources: Record<ResourceType, number>;
  population: number;
  maxPopulation: number;
  buildings: PlacedBuilding[];
  gridSize: number;
}

export interface GameAction {
  type: string;
  payload?: any;
}
