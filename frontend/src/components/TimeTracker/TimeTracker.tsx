import React, { useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

interface TimeTrackerProps {
  app: string;
  goalId: string;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({ app, goalId }) => {
  useEffect(() => {
    let startTime: number | null = null;
    let timeSpent = 0;
    const storageKey = `timeTracker_${app}_${goalId}`;

    // Recupera o tempo já registrado hoje
    const loadTodayTime = () => {
      const today = new Date().toISOString().split('T')[0];
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const { date, time } = JSON.parse(stored);
        if (date === today) {
          timeSpent = time;
        } else {
          // Reseta o contador se for um novo dia
          localStorage.setItem(storageKey, JSON.stringify({ date: today, time: 0 }));
        }
      } else {
        localStorage.setItem(storageKey, JSON.stringify({ date: today, time: 0 }));
      }
    };

    // Salva o tempo no localStorage e Firestore
    const saveTime = async () => {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(storageKey, JSON.stringify({ date: today, time: timeSpent }));

      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
          const goalRef = doc(db, 'users', userId, 'goals', goalId);
          await updateDoc(goalRef, {
            currentHours: increment(timeSpent / 3600) // Converte segundos para horas
          });
        } catch (error) {
          console.error('Erro ao atualizar tempo:', error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Página não está visível, para o contador
        if (startTime !== null) {
          const endTime = Date.now();
          timeSpent += (endTime - startTime) / 1000; // Converte para segundos
          startTime = null;
          saveTime();
        }
      } else {
        // Página está visível, inicia o contador
        startTime = Date.now();
      }
    };

    // Carrega o tempo inicial
    loadTodayTime();

    // Configura os event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => {
      if (startTime !== null) {
        const endTime = Date.now();
        timeSpent += (endTime - startTime) / 1000;
        saveTime();
      }
    });

    // Inicia o contador se a página estiver visível
    if (!document.hidden) {
      startTime = Date.now();
    }

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (startTime !== null) {
        const endTime = Date.now();
        timeSpent += (endTime - startTime) / 1000;
        saveTime();
      }
    };
  }, [app, goalId]);

  return null; // Componente não renderiza nada visualmente
};

export default TimeTracker;
