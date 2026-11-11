import { BuildingConfig } from '../types';
import { BUILDING_CONFIGS } from '../data/buildings';
import { GameState } from '../types';

interface BuildingMenuProps {
  state: GameState;
  onSelectBuilding: (configId: string) => void;
  selectedBuildingId: string | null;
  onCancel: () => void;
}

export function BuildingMenu({ state, onSelectBuilding, selectedBuildingId, onCancel }: BuildingMenuProps) {
  const categories = [
    { key: 'production', label: 'Производство', icon: '🏭' },
    { key: 'military', label: 'Военное', icon: '⚔️' },
    { key: 'decoration', label: 'Декор', icon: '✨' },
  ];

  const canAfford = (config: BuildingConfig): boolean => {
    for (const [res, amount] of Object.entries(config.cost)) {
      if (state.resources[res as keyof typeof state.resources] < (amount || 0)) return false;
    }
    return true;
  };

  const meetsPopulation = (config: BuildingConfig): boolean => {
    if (!config.populationRequired) return true;
    return state.population >= config.populationRequired;
  };

  return (
    <div className="bg-gray-900 border-t-2 border-amber-700 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-amber-400 font-bold text-sm">📋 Строительство</h3>
        {selectedBuildingId && (
          <button
            onClick={onCancel}
            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 border border-red-700 rounded"
          >
            ✕ Отмена
          </button>
        )}
      </div>
      
      {selectedBuildingId && (
        <div className="bg-amber-900/30 border border-amber-700 rounded p-2 mb-2 text-xs text-amber-200">
          📍 Кликните на сетку, чтобы разместить здание. ПКМ — отмена.
        </div>
      )}
      
      <div className="flex gap-4 overflow-x-auto pb-1">
        {categories.map(cat => (
          <div key={cat.key} className="flex-shrink-0">
            <div className="text-gray-400 text-xs mb-1">{cat.icon} {cat.label}</div>
            <div className="flex gap-1 flex-wrap">
              {BUILDING_CONFIGS
                .filter(b => b.category === cat.key)
                .map(config => {
                  const affordable = canAfford(config);
                  const popOk = meetsPopulation(config);
                  const available = affordable && popOk;
                  const isSelected = selectedBuildingId === config.id;
                  
                  return (
                    <button
                      key={config.id}
                      onClick={() => available && onSelectBuilding(config.id)}
                      disabled={!available}
                      className={`
                        relative flex flex-col items-center justify-center
                        w-16 h-16 rounded border-2 transition-all text-xs
                        ${isSelected 
                          ? 'border-amber-400 bg-amber-900/50 scale-105' 
                          : available 
                            ? 'border-gray-600 bg-gray-800 hover:border-amber-600 hover:bg-gray-700 cursor-pointer' 
                            : 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed'
                        }
                      `}
                      title={`${config.name}\n${config.description}\n${!popOk ? `⚠️ Нужно ${config.populationRequired} популяции` : ''}\n${!affordable ? '⚠️ Не хватает ресурсов' : ''}`}
                    >
                      <span className="text-lg">{config.icon}</span>
                      <span className="text-gray-300 truncate w-full text-center leading-tight mt-0.5" style={{fontSize: '9px'}}>
                        {config.name}
                      </span>
                      {!popOk && (
                        <span className="absolute top-0 right-0 text-xs">🔒</span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
