const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Inicializa o Firebase Admin
let serviceAccount;
try {
  // Tenta carregar as credenciais do arquivo
  serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
  // Se não encontrar o arquivo, usa as variáveis de ambiente do Glitch
  serviceAccount = {
    "type": process.env.FIREBASE_TYPE,
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": process.env.FIREBASE_AUTH_URI,
    "token_uri": process.env.FIREBASE_TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
  };
}

const app = express();
// Use a porta fornecida pelo Glitch ou 3000 localmente
const port = process.env.PORT || 3000;

// Inicializa o Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Obtém uma referência para o Firestore
const db = admin.firestore();

// Configuração do CORS para permitir requisições da extensão
app.use(cors({
  origin: ['chrome-extension://*', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware para verificar o token de autenticação
async function verifyToken(req, res, next) {
  console.log('Nova requisição recebida:', req.path);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Token não fornecido');
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    // Para testes, vamos aceitar o token mock
    if (token.startsWith('eyJhbGciOiJSUzI1NiIsImtpZCI6IjFiYjI2MzY3')) {
      console.log('Usando token mock para:', 'danilobronze33@gmail.com');
      req.user = {
        uid: '4GSZoGmtx9awJ1JYqsmhBSpED7v1',
        email: 'danilobronze33@gmail.com'
      };
      next();
      return;
    }

    console.log('Verificando token Firebase...');
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Token verificado para:', decodedToken.email);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Rota para verificar se o servidor está online
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'Mindful Connect API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota para rastrear tempo
app.post('/api/track-time', verifyToken, async (req, res) => {
  try {
    const { app: appName, seconds, timestamp, userEmail } = req.body;
    const userId = req.user.uid;

    console.log(`\nProcessando tempo para ${appName}:`);
    console.log('- Usuário:', userEmail);
    console.log('- ID:', userId);
    console.log('- Segundos:', seconds);

    // Referência para a coleção goals
    const goalsRef = db.collection('users').doc(userId).collection('goals');

    // Busca todos os documentos da coleção goals
    console.log('Buscando goals...');
    const snapshot = await goalsRef.get();
    
    // Procura o documento que tem o app correspondente
    let goalDoc = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.app === appName) {
        goalDoc = { id: doc.id, ...data };
        console.log('Goal encontrado:', doc.id);
      }
    });

    if (!goalDoc) {
      console.error(`Nenhum goal encontrado para o app ${appName}`);
      return res.status(404).json({ 
        error: `Nenhum goal encontrado para o app ${appName}`,
        details: {
          userId,
          app: appName,
          availableGoals: snapshot.docs.map(doc => ({
            id: doc.id,
            app: doc.data().app
          }))
        }
      });
    }

    // Atualiza as horas no documento encontrado
    const newHours = goalDoc.currentHours + (seconds / 3600);
    console.log(`Atualizando horas de ${goalDoc.currentHours} para ${newHours}`);
    
    await goalsRef.doc(goalDoc.id).update({
      currentHours: newHours
    });

    // Obtém os dados atualizados
    const updatedDoc = await goalsRef.doc(goalDoc.id).get();
    const updatedData = updatedDoc.data();

    console.log(`Sucesso! ${appName}: ${updatedData.currentHours.toFixed(2)} horas`);
    
    res.json({ 
      success: true, 
      currentHours: updatedData.currentHours,
      targetHours: updatedData.targetHours 
    });
  } catch (error) {
    console.error('Erro ao salvar tempo:', error);
    res.status(500).json({ 
      error: 'Erro ao salvar tempo',
      details: error.message
    });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`
╔══════════════════════════════════════════╗
║         Mindful Connect - Backend        ║
╠══════════════════════════════════════════╣
║ Status: Rodando                          ║
║ URL: ${process.env.PROJECT_DOMAIN ? 
  `https://${process.env.PROJECT_DOMAIN}.glitch.me` : 
  `http://localhost:${port}`}              ║
║ Ambiente: ${process.env.PROJECT_DOMAIN ? 'Glitch' : 'Local'}║
╚══════════════════════════════════════════╝
`);
});
