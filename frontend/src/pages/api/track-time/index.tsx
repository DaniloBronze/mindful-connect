import { NextApiRequest, NextApiResponse } from 'next';
import { updateAppTime } from '../../../api/timeTracking';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';

// Inicializa o Firebase Admin se ainda não estiver inicializado
if (!getApps().length) {
  initializeApp({
    credential: process.env.FIREBASE_ADMIN_CREDENTIALS
      ? JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS)
      : undefined,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Habilita CORS para a extensão
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Responde ao preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verifica o token de autenticação
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Verifica se o token corresponde ao usuário
    const { app, seconds, timestamp, userEmail } = req.body;

    if (!app || !seconds || !timestamp || !userEmail) {
      return res.status(400).json({ message: 'Dados inválidos' });
    }

    // Verifica se o token corresponde ao usuário usando o Firebase Admin
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    if (decodedToken.email !== userEmail) {
      return res.status(403).json({ message: 'Token não corresponde ao usuário' });
    }

    await updateAppTime({ app, seconds, timestamp });
    res.status(200).json({ message: 'Tempo atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar tempo:', error);
    res.status(500).json({ message: 'Erro ao atualizar tempo' });
  }
}
