import { NextApiRequest, NextApiResponse } from 'next';
import { updateAppTime } from '../../api/timeTracking';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { app, seconds, timestamp } = req.body;

    if (!app || !seconds || !timestamp) {
      return res.status(400).json({ message: 'Dados inválidos' });
    }

    await updateAppTime({ app, seconds, timestamp });
    res.status(200).json({ message: 'Tempo atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar tempo:', error);
    res.status(500).json({ message: 'Erro ao atualizar tempo' });
  }
}
