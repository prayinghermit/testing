import { useState, useRef, useCallback, useEffect } from 'react';
import { PlacedBuilding } from '../types';
import { getBuildingConfig } from '../data/buildings';

interface GridProps {
  gridSize: number;
  buildings: PlacedBuilding[];
  selectedBuildingId: string | null;
  canPlace: (x: number, y: number, w: number, h: number, excludeId?: string) => boolean;
  onPlaceBuilding: (x: number, y: number) => void;
  onBuildingClick: (instanceId: string) => void;
  onMoveBuilding: (instanceId: string, x: number, y: number) => void;
  onCancelPlacement: () => void;
}

const CELL_SIZE = 24; // pixels per cell

export function Grid({ 
  gridSize, buildings, selectedBuildingId, canPlace, 
  onPlaceBuilding, onBuildingClick, onMoveBuilding, onCancelPlacement
}: GridProps) {
  const [zoom, setZoom] = useState(1);
  const [hoverCell, setHoverCell] = useState<{x: number, y: number} | null>(null);
  const [dragging, setDragging] = useState<{instanceId: string, offsetX: number, offsetY: number} | null>(null);
  const [dragPos, setDragPos] = useState<{x: number, y: number} | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const selectedConfig = selectedBuildingId ? getBuildingConfig(selectedBuildingId) : null;

  const getCellFromEvent = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) return { x, y };
    return null;
  }, [gridSize]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const cell = getCellFromEvent(e);
    setHoverCell(cell);
    
    if (dragging) {
      setDragPos({ x: e.clientX, y: e.clientY });
    }
  }, [getCellFromEvent, dragging]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (dragging) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;
    
    if (selectedBuildingId && selectedConfig) {
      onPlaceBuilding(cell.x, cell.y);
    }
  }, [getCellFromEvent, selectedBuildingId, selectedConfig, onPlaceBuilding]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedBuildingId) {
      onCancelPlacement();
    }
  }, [selectedBuildingId, onCancelPlacement]);

  // Drag handlers for moving buildings
  const handleBuildingMouseDown = useCallback((e: React.MouseEvent, instanceId: string) => {
    if (selectedBuildingId) return; // Don't drag while placing
    e.stopPropagation();
    const building = buildings.find(b => b.instanceId === instanceId);
    if (!building || building.state === 'building') return;
    
    const config = getBuildingConfig(building.configId);
    if (!config) return;

    setDragging({ instanceId, offsetX: 0, offsetY: 0 });
    setDragPos({ x: e.clientX, y: e.clientY });
  }, [selectedBuildingId, buildings]);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseUp = (e: MouseEvent) => {
      const cell = getCellFromEvent(e);
      if (cell) {
        const building = buildings.find(b => b.instanceId === dragging.instanceId);
        if (building) {
          const config = getBuildingConfig(building.configId);
          if (config) {
            // Center the building on the cell
            const newX = Math.max(0, Math.min(gridSize - config.width, cell.x - Math.floor(config.width / 2)));
            const newY = Math.max(0, Math.min(gridSize - config.height, cell.y - Math.floor(config.height / 2)));
            onMoveBuilding(dragging.instanceId, newX, newY);
          }
        }
      }
      setDragging(null);
      setDragPos(null);
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [dragging, buildings, gridSize, getCellFromEvent, onMoveBuilding]);

  // Check if a cell is valid for placement preview
  const isValidPlacement = (x: number, y: number): boolean => {
    if (!selectedConfig) return false;
    return canPlace(x, y, selectedConfig.width, selectedConfig.height);
  };

  // Check if cell is occupied by a building
  const getBuildingAt = (x: number, y: number): PlacedBuilding | undefined => {
    return buildings.find(b => {
      const config = getBuildingConfig(b.configId);
      if (!config) return false;
      return x >= b.x && x < b.x + config.width && y >= b.y && y < b.y + config.height;
    });
  };

  const gridPixelSize = gridSize * CELL_SIZE;

  return (
    <div className="flex-1 overflow-auto bg-gray-950 flex flex-col items-center justify-center p-4">
      {/* Zoom controls */}
      <div className="flex items-center gap-2 mb-2">
        <button 
          onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
          className="bg-gray-800 hover:bg-gray-700 text-white w-8 h-8 rounded flex items-center justify-center text-lg"
        >−</button>
        <span className="text-gray-400 text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button 
          onClick={() => setZoom(z => Math.min(2, z + 0.1))}
          className="bg-gray-800 hover:bg-gray-700 text-white w-8 h-8 rounded flex items-center justify-center text-lg"
        >+</button>
        <button 
          onClick={() => setZoom(1)}
          className="bg-gray-800 hover:bg-gray-700 text-white px-2 h-8 rounded flex items-center justify-center text-xs ml-2"
        >Сброс</button>
      </div>
      
      <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
        {/* Grid background */}
        <div
          ref={gridRef}
          className="relative border-2 border-gray-700 cursor-crosshair"
          style={{ 
            width: gridPixelSize, 
            height: gridPixelSize,
            backgroundImage: `
              linear-gradient(to right, rgba(75, 85, 99, 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(75, 85, 99, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
            backgroundColor: '#1a1a2e',
          }}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onMouseLeave={() => setHoverCell(null)}
        >
          {/* Placed buildings */}
          {buildings.map(building => {
            const config = getBuildingConfig(building.configId);
            if (!config) return null;

            const isBeingDragged = dragging?.instanceId === building.instanceId;
            
            return (
              <div
                key={building.instanceId}
                className={`absolute flex flex-col items-center justify-center rounded-sm border-2 transition-opacity select-none
                  ${isBeingDragged ? 'opacity-30' : 'opacity-100'}
                  ${building.state === 'building' ? 'border-dashed border-gray-500' : 'cursor-grab active:cursor-grabbing'}
                  ${!isBeingDragged && building.state !== 'building' ? 'hover:brightness-125' : ''}
                `}
                style={{
                  left: building.x * CELL_SIZE,
                  top: building.y * CELL_SIZE,
                  width: config.width * CELL_SIZE,
                  height: config.height * CELL_SIZE,
                  backgroundColor: config.color + (building.state === 'building' ? '80' : 'CC'),
                }}
                onMouseDown={(e) => handleBuildingMouseDown(e, building.instanceId)}
                onClick={(e) => {
                  if (!dragging && building.state !== 'building') {
                    e.stopPropagation();
                    onBuildingClick(building.instanceId);
                  }
                }}
              >
                <span style={{ fontSize: Math.min(config.width, config.height) * 8 }}>
                  {config.icon}
                </span>
                {building.state === 'building' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-1000"
                      style={{ width: `${building.buildProgress}%` }}
                    />
                  </div>
                )}
                {building.state === 'producing' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800">
                    <div 
                      className="h-full bg-green-400 transition-all duration-1000"
                      style={{ width: `${building.productionProgress}%` }}
                    />
                  </div>
                )}
                {building.state === 'ready' && (
                  <div className="absolute top-0 right-0 animate-pulse">
                    <span className="text-xs">📦</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Placement preview */}
          {selectedConfig && hoverCell && (
            <div
              className={`absolute border-2 border-dashed pointer-events-none rounded-sm
                ${isValidPlacement(hoverCell.x, hoverCell.y) 
                  ? 'border-green-400 bg-green-400/20' 
                  : 'border-red-400 bg-red-400/20'
                }
              `}
              style={{
                left: hoverCell.x * CELL_SIZE,
                top: hoverCell.y * CELL_SIZE,
                width: selectedConfig.width * CELL_SIZE,
                height: selectedConfig.height * CELL_SIZE,
              }}
            >
              <div className="flex items-center justify-center h-full text-lg opacity-60">
                {selectedConfig.icon}
              </div>
            </div>
          )}

          {/* Drag preview */}
          {dragging && dragPos && gridRef.current && (() => {
            const building = buildings.find(b => b.instanceId === dragging.instanceId);
            if (!building) return null;
            const config = getBuildingConfig(building.configId);
            if (!config) return null;
            
            const rect = gridRef.current.getBoundingClientRect();
            const cellX = Math.floor((dragPos.x - rect.left) / CELL_SIZE) - Math.floor(config.width / 2);
            const cellY = Math.floor((dragPos.y - rect.top) / CELL_SIZE) - Math.floor(config.height / 2);
            const valid = canPlace(
              Math.max(0, Math.min(gridSize - config.width, cellX)),
              Math.max(0, Math.min(gridSize - config.height, cellY)),
              config.width, config.height, dragging.instanceId
            );

            return (
              <div
                className={`absolute border-2 border-dashed pointer-events-none rounded-sm
                  ${valid ? 'border-blue-400 bg-blue-400/20' : 'border-red-400 bg-red-400/20'}
                `}
                style={{
                  left: Math.max(0, Math.min(gridSize - config.width, cellX)) * CELL_SIZE,
                  top: Math.max(0, Math.min(gridSize - config.height, cellY)) * CELL_SIZE,
                  width: config.width * CELL_SIZE,
                  height: config.height * CELL_SIZE,
                }}
              >
                <div className="flex items-center justify-center h-full text-lg opacity-60">
                  {config.icon}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Grid coordinates */}
        <div className="absolute -top-5 left-0 text-gray-500 text-xs">
          0
        </div>
        <div className="absolute -top-5 right-0 text-gray-500 text-xs">
          {gridSize}
        </div>
        <div className="absolute top-0 -left-5 text-gray-500 text-xs">
          0
        </div>
        <div className="absolute bottom-0 -left-5 text-gray-500 text-xs">
          {gridSize}
        </div>
      </div>
    </div>
  );
}
