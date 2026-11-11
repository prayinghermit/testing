import { useState } from 'react';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpPanel({ isOpen, onClose }: HelpPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-900 border-2 border-amber-700 rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-amber-400 font-bold text-xl">📖 Как играть</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-4 text-sm text-gray-300">
          <section>
            <h3 className="text-amber-300 font-bold mb-1">🏗️ Строительство</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Выберите здание в нижней панели</li>
              <li>Кликните на сетку для размещения</li>
              <li>Зелёная рамка = можно ставить, красная = нельзя</li>
              <li>ПКМ или Escape — отмена размещения</li>
              <li>Здание строится 10 секунд (прототип)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-amber-300 font-bold mb-1">⚙️ Производство</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Кликните на построенное здание</li>
              <li>Выберите один из 6 тарифов</li>
              <li>Дождитесь окончания таймера</li>
              <li>Нажмите "Забрать" для сбора ресурсов</li>
              <li>Здание снова станет доступным для нового заказа</li>
            </ul>
          </section>

          <section>
            <h3 className="text-amber-300 font-bold mb-1">📍 Перемещение</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Зажмите ЛКМ на здании и перетащите</li>
              <li>Производство НЕ прерывается при перемещении</li>
              <li>Нельзя поставить на другое здание</li>
            </ul>
          </section>

          <section>
            <h3 className="text-amber-300 font-bold mb-1">👥 Популяция</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Декоративные здания увеличивают популяцию</li>
              <li>Некоторые здания требуют минимум популяции</li>
              <li>Популяция — порог, а не расходник</li>
            </ul>
          </section>

          <section>
            <h3 className="text-amber-300 font-bold mb-1">💾 Сохранение</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Автосохранение каждые 10 секунд</li>
              <li>Кнопка "Сохранить" — ручное сохранение</li>
              <li>Данные хранятся в браузере (localStorage)</li>
            </ul>
          </section>

          <section className="border-t border-gray-700 pt-3">
            <h3 className="text-purple-300 font-bold mb-1">🔮 В разработке</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Казарма → найм войск за новобранцев</li>
              <li>Кнопка "Миссия" → выбор высадки → автобой</li>
              <li>PvP: атака баз других игроков</li>
              <li>Изометрический вид</li>
              <li>Спрайты и анимации</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
