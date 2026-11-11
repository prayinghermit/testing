import { useState, useEffect } from 'react';

interface WelcomeScreenProps {
  onDismiss: () => void;
}

export function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: '🏰 Добро пожаловать в Yaga\'s Den!',
      content: 'Стратегия в сеттинге архаичной мистики, стимпанка и киберпанка. Стройте базу, производите ресурсы, набирайте войска и отправляйтесь в бой!',
      icon: '🏰',
    },
    {
      title: '🏗️ Строительство',
      content: 'Выберите здание в нижней панели → кликните на сетку. Здание начнёт строиться (10 сек в прототипе). Следите за прогресс-баром!',
      icon: '🔨',
    },
    {
      title: '⚙️ Производство',
      content: 'После постройки кликните на здание → выберите тариф из 6 вариантов → дождитесь → заберите ресурсы. Здание снова готово к работе!',
      icon: '⚙️',
    },
    {
      title: '📍 Перемещение',
      content: 'Зажмите ЛКМ на здании и перетащите. Производство не прерывается! Можно двигать даже работающие здания.',
      icon: '🔄',
    },
    {
      title: '🎯 Начните строить!',
      content: 'У вас есть стартовые ресурсы. Постройте завод металла, затем топливный цех и шахту. Декор поднимет популяцию для разблокировки военных зданий.',
      icon: '🚀',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 border-2 border-amber-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center mb-4">
          <span className="text-5xl mb-2 block">{steps[step].icon}</span>
          <h2 className="text-amber-400 font-bold text-lg">{steps[step].title}</h2>
        </div>
        
        <p className="text-gray-300 text-sm text-center mb-6 leading-relaxed">
          {steps[step].content}
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-amber-400 w-4' : i < step ? 'bg-amber-700' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors"
            >
              ← Назад
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 bg-amber-700 hover:bg-amber-600 text-white py-2 rounded font-bold transition-colors"
            >
              Далее →
            </button>
          ) : (
            <button
              onClick={onDismiss}
              className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 rounded font-bold transition-colors"
            >
              🎮 Начать игру!
            </button>
          )}
          <button
            onClick={onDismiss}
            className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-2 rounded text-sm transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export function useWelcomeScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('yaga_welcome_seen');
    if (!seen) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('yaga_welcome_seen', 'true');
    setShow(false);
  };

  return { show, dismiss };
}
