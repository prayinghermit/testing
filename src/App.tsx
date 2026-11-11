import { useState, useCallback } from 'react';
import { useGameState } from './hooks/useGameState';
import { ResourceBar } from './components/ResourceBar';
import { BuildingMenu } from './components/BuildingMenu';
import { Grid } from './components/Grid';
import { ProductionMenu } from './components/ProductionMenu';
import { HelpPanel } from './components/HelpPanel';
import { WelcomeScreen, useWelcomeScreen } from './components/WelcomeScreen';
import { getBuildingConfig } from './data/buildings';

function App() {
  const {
    state,
    canPlace,
    placeBuilding,
    moveBuilding,
    startProduction,
    collectProduction,
    manualSave,
    resetGame,
  } = useGameState();

  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [activeProductionMenu, setActiveProductionMenu] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showMission, setShowMission] = useState(false);
  const { show: showWelcome, dismiss: dismissWelcome } = useWelcomeScreen();

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleSelectBuilding = useCallback((configId: string) => {
    setSelectedBuildingId(prev => prev === configId ? null : configId);
  }, []);

  const handleCancelPlacement = useCallback(() => {
    setSelectedBuildingId(null);
  }, []);

  const handlePlaceBuilding = useCallback((x: number, y: number) => {
    if (!selectedBuildingId) return;
    const config = getBuildingConfig(selectedBuildingId);
    if (!config) return;

    const success = placeBuilding(selectedBuildingId, x, y);
    if (success) {
      showNotification(`✅ ${config.name} строится...`);
      // Don't deselect - allow placing multiple
    } else {
      showNotification(`❌ Нельзя разместить здесь!`);
    }
  }, [selectedBuildingId, placeBuilding, showNotification]);

  const handleBuildingClick = useCallback((instanceId: string) => {
    const building = state.buildings.find(b => b.instanceId === instanceId);
    if (!building) return;
    const config = getBuildingConfig(building.configId);
    if (!config) return;

    if (config.category === 'production' || config.category === 'military') {
      if (building.state === 'idle' || building.state === 'producing' || building.state === 'ready') {
        setActiveProductionMenu(instanceId);
      }
    } else {
      showNotification(`${config.icon} ${config.name}: ${config.description}`);
    }
  }, [state.buildings, showNotification]);

  const handleMoveBuilding = useCallback((instanceId: string, x: number, y: number) => {
    const success = moveBuilding(instanceId, x, y);
    if (success) {
      const building = state.buildings.find(b => b.instanceId === instanceId);
      if (building) {
        const config = getBuildingConfig(building.configId);
        showNotification(`📍 ${config?.name || 'Здание'} перемещено`);
      }
    }
  }, [moveBuilding, state.buildings, showNotification]);

  const handleSelectTariff = useCallback((tariffIndex: number) => {
    if (!activeProductionMenu) return;
    const success = startProduction(activeProductionMenu, tariffIndex);
    if (success) {
      setActiveProductionMenu(null);
      showNotification('⏱️ Производство запущено!');
    }
  }, [activeProductionMenu, startProduction, showNotification]);

  const handleCollect = useCallback(() => {
    if (!activeProductionMenu) return;
    const success = collectProduction(activeProductionMenu);
    if (success) {
      setActiveProductionMenu(null);
      showNotification('📦 Ресурсы собраны!');
    }
  }, [activeProductionMenu, collectProduction, showNotification]);

  // Find the building for the production menu
  const productionBuilding = activeProductionMenu 
    ? state.buildings.find(b => b.instanceId === activeProductionMenu) 
    : null;

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSelectedBuildingId(null);
      setActiveProductionMenu(null);
    }
  }, []);

  return (
    <div 
      className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Resource Bar */}
      <ResourceBar state={state} onSave={manualSave} onReset={resetGame} />

      {/* Main Grid Area */}
      <Grid
        gridSize={state.gridSize}
        buildings={state.buildings}
        selectedBuildingId={selectedBuildingId}
        canPlace={canPlace}
        onPlaceBuilding={handlePlaceBuilding}
        onBuildingClick={handleBuildingClick}
        onMoveBuilding={handleMoveBuilding}
        onCancelPlacement={handleCancelPlacement}
      />

      {/* Building Menu */}
      <BuildingMenu
        state={state}
        onSelectBuilding={handleSelectBuilding}
        selectedBuildingId={selectedBuildingId}
        onCancel={handleCancelPlacement}
      />

      {/* Production Menu Modal */}
      {productionBuilding && (
        <ProductionMenu
          building={productionBuilding}
          onSelectTariff={handleSelectTariff}
          onCollect={handleCollect}
          onClose={() => setActiveProductionMenu(null)}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-gray-800 border border-amber-600 text-amber-200 px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce text-sm">
          {notification}
        </div>
      )}

      {/* Welcome Screen */}
      {showWelcome && <WelcomeScreen onDismiss={dismissWelcome} />}

      {/* Help Panel */}
      <HelpPanel isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Mission Panel (placeholder) */}
      {showMission && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowMission(false)}>
          <div className="bg-gray-900 border-2 border-red-700 rounded-lg p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-red-400 font-bold text-xl mb-3">⚔️ Миссия</h2>
            <p className="text-gray-300 text-sm mb-4">
              Система боёв в разработке. В будущем: выбор точки высадки → волны бойцов → автоматический бой → текстовый отчёт.
            </p>
            <div className="bg-gray-800 rounded p-3 mb-4">
              <div className="text-gray-400 text-xs mb-2">Доступные войска:</div>
              <div className="text-gray-500 text-sm italic">Нет доступных войск. Постройте Казарму и наберите новобранцев.</div>
            </div>
            <button
              onClick={() => setShowMission(false)}
              className="w-full bg-red-800 hover:bg-red-700 text-white py-2 rounded transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Floating buttons */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-2 z-40">
        <button
          onClick={() => setShowMission(true)}
          className="bg-red-800 hover:bg-red-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-red-600 transition-all hover:scale-110"
          title="Миссия"
        >
          ⚔️
        </button>
        <button
          onClick={() => setShowHelp(true)}
          className="bg-purple-800 hover:bg-purple-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-purple-600 transition-all hover:scale-110"
          title="Помощь"
        >
          📖
        </button>
      </div>
    </div>
  );
}

export default App;
