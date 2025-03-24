const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Inicializa o Firebase Admin
admin.initializeApp();

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// Middleware para verificar o token de autenticação
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Rota para rastrear tempo
app.post('/track-time', verifyToken, async (req, res) => {
  try {
    const { app: appName, seconds, timestamp, userEmail } = req.body;
    const userId = req.user.uid;

    // Salva os dados no Firestore
    await admin.firestore().collection('timeTracking').add({
      userId,
      userEmail,
      app: appName,
      seconds,
      timestamp,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar tempo:', error);
    res.status(500).json({ error: 'Erro ao salvar tempo' });
  }
});

// Exporta a função do Firebase
exports.api = functions.https.onRequest(app);
