import { GameState } from '../types';

interface ResourceBarProps {
  state: GameState;
  onSave: () => void;
  onReset: () => void;
}

export function ResourceBar({ state, onSave, onReset }: ResourceBarProps) {
  return (
    <div className="bg-gray-900 border-b-2 border-amber-700 px-4 py-2 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-xl">🏰</span>
        <span className="text-amber-400 font-bold text-lg">Yaga's Den</span>
      </div>
      
      <div className="h-6 w-px bg-gray-700" />
      
      <div className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1">
        <span className="text-sm">⚙️</span>
        <span className="text-blue-300 text-sm font-mono">{state.resources.metal}</span>
      </div>
      
      <div className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1">
        <span className="text-sm">🛢️</span>
        <span className="text-yellow-300 text-sm font-mono">{state.resources.fuel}</span>
      </div>
      
      <div className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1">
        <span className="text-sm">💎</span>
        <span className="text-green-300 text-sm font-mono">{state.resources.minerals}</span>
      </div>
      
      <div className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1">
        <span className="text-sm">🎖️</span>
        <span className="text-red-300 text-sm font-mono">{state.resources.recruits}</span>
      </div>
      
      <div className="h-6 w-px bg-gray-700" />
      
      <div className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1">
        <span className="text-sm">👥</span>
        <span className="text-purple-300 text-sm font-mono">{state.population}/{state.maxPopulation}</span>
      </div>
      
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onSave}
          className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1 rounded transition-colors"
        >
          💾 Сохранить
        </button>
        <button
          onClick={() => { if (confirm('Сбросить всю базу? Это необратимо!')) onReset(); }}
          className="bg-red-800 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors"
        >
          🗑️ Сброс
        </button>
      </div>
    </div>
  );
}
