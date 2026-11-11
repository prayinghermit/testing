import { PlacedBuilding } from '../types';
import { getBuildingConfig } from '../data/buildings';

interface ProductionMenuProps {
  building: PlacedBuilding;
  onSelectTariff: (tariffIndex: number) => void;
  onCollect: () => void;
  onClose: () => void;
}

export function ProductionMenu({ building, onSelectTariff, onCollect, onClose }: ProductionMenuProps) {
  const config = getBuildingConfig(building.configId);
  if (!config || !config.tariffs) return null;

  const resourceIcons: Record<string, string> = {
    metal: '⚙️',
    fuel: '🛢️',
    minerals: '💎',
    recruits: '🎖️',
  };

  const icon = config.produces ? resourceIcons[config.produces] || '📦' : '📦';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-900 border-2 border-amber-700 rounded-lg p-4 max-w-sm w-full mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-amber-400 font-bold flex items-center gap-2">
            <span className="text-xl">{config.icon}</span>
            {config.name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        {building.state === 'producing' && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Производство...</span>
              <span>{Math.round(building.productionProgress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-amber-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${building.productionProgress}%` }}
              />
            </div>
            {building.currentTariffIndex !== null && config.tariffs[building.currentTariffIndex] && (
              <div className="text-xs text-gray-400 mt-1">
                {icon} {config.tariffs[building.currentTariffIndex].label}
              </div>
            )}
          </div>
        )}

        {building.state === 'ready' && (
          <div className="mb-3">
            <div className="bg-green-900/40 border border-green-600 rounded p-3 text-center">
              <div className="text-green-400 text-lg mb-1">✅ Готово!</div>
              <div className="text-green-300 text-sm mb-2">
                {icon} {config.tariffs[building.currentTariffIndex!]?.amount} {config.produces === 'metal' ? 'металла' : config.produces === 'fuel' ? 'топлива' : config.produces === 'minerals' ? 'минералов' : 'новобранцев'}
              </div>
              <button
                onClick={onCollect}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold transition-colors"
              >
                📥 Забрать
              </button>
            </div>
          </div>
        )}

        {building.state === 'idle' && (
          <div>
            <p className="text-gray-400 text-xs mb-2">Выберите тариф производства:</p>
            <div className="grid grid-cols-2 gap-2">
              {config.tariffs.map((tariff, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectTariff(idx)}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-amber-600 rounded p-2 text-left transition-all"
                >
                  <div className="text-amber-300 text-sm font-bold">
                    {icon} {tariff.amount}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {tariff.durationSeconds < 60 
                      ? `${tariff.durationSeconds} сек` 
                      : `${Math.floor(tariff.durationSeconds / 60)} мин`
                    }
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
