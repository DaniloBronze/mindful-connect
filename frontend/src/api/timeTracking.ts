import { auth, db } from '../config/firebase';
import { doc, updateDoc, increment, collection, getDocs, DocumentData, query, where } from 'firebase/firestore';

interface TimeUpdate {
  app: string;
  seconds: number;
  timestamp: string;
}

interface Goal extends DocumentData {
  id: string;
  app: string;
  currentHours: number;
}

export const updateAppTime = async (data: TimeUpdate) => {
  // Aguarda a inicialização do auth
  await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });

  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('Usuário não autenticado');
  }

  console.log('Atualizando tempo para:', data);

  // Busca a meta ativa para o app
  const goalsRef = collection(db, 'users', userId, 'goals');
  const goalsQuery = query(goalsRef, where('app', '==', data.app));
  const goalsSnapshot = await getDocs(goalsQuery);
  
  const goals = goalsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Goal));

  console.log('Metas encontradas:', goals);

  if (goals.length === 0) {
    console.log('Nenhuma meta encontrada para', data.app);
    return;
  }

  // Atualiza o tempo para cada meta do app
  for (const goal of goals) {
    console.log('Atualizando meta:', goal.id);
    const goalRef = doc(db, 'users', userId, 'goals', goal.id);
    const hoursToAdd = data.seconds / 3600; // Converte segundos para horas
    
    await updateDoc(goalRef, {
      currentHours: increment(hoursToAdd)
    });
    
    console.log('Meta atualizada com sucesso');
  }
};
