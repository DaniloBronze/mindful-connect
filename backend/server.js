const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

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
    "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": process.env.FIREBASE_AUTH_URI,
    "token_uri": process.env.FIREBASE_TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
  };
}

const app = express();
const port = process.env.PORT || 3000;

// Inicializa o Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Obtém uma referência para o Firestore
const db = admin.firestore();

// Configuração do CORS para permitir requisições da extensão
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Adiciona um handler específico para OPTIONS
app.options('*', cors());

// Middleware para processar JSON
app.use(express.json());

// Rota para verificar se o servidor está online
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'Mindful Connect API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

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

    // Tenta verificar como token do Firebase
    try {
      console.log('Verificando token Firebase...');
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('Token Firebase verificado para:', decodedToken.email);
      req.user = decodedToken;
      next();
      return;
    } catch (firebaseError) {
      console.log('Não é um token Firebase válido, tentando como token Google...');
      
      // Se não for um token Firebase, tenta verificar como token do Google
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`Google API error: ${response.status}`);
        }
        
        const userInfo = await response.json();
        console.log('Token Google verificado para:', userInfo.email);
        
        // Busca ou cria o usuário no Firebase
        let userRecord;
        try {
          userRecord = await admin.auth().getUserByEmail(userInfo.email);
        } catch (e) {
          // Se o usuário não existe, cria um novo
          userRecord = await admin.auth().createUser({
            email: userInfo.email,
            displayName: userInfo.name,
            photoURL: userInfo.picture
          });
        }
        
        req.user = {
          uid: userRecord.uid,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        };
        
        next();
        return;
      } catch (googleError) {
        console.error('Erro ao verificar token Google:', googleError);
        throw new Error('Token inválido: não é um token Firebase nem Google válido');
      }
    }
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Rota para obter estatísticas
app.get('/api/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log('Buscando estatísticas para usuário:', userId);

    // Referência para a coleção goals
    const goalsRef = db.collection('users').doc(userId).collection('goals');
    const snapshot = await goalsRef.get();
    
    // Cria um objeto com as estatísticas
    const stats = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      stats[data.app] = data.currentHours || 0;
    });

    console.log('Estatísticas:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Rota para rastrear tempo
app.post('/api/stats', verifyToken, async (req, res) => {
  try {
    const { app: appName, timeSpent } = req.body;
    const userId = req.user.uid;
    const seconds = timeSpent;

    console.log(`\nProcessando tempo para ${appName}:`);
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

    // Se não encontrar o goal, cria um novo
    if (!goalDoc) {
      console.log(`Criando novo goal para ${appName}`);
      const newGoalRef = await goalsRef.add({
        app: appName,
        currentHours: 0,
        targetHours: 2, // valor padrão de 2 horas
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      goalDoc = {
        id: newGoalRef.id,
        app: appName,
        currentHours: 0,
        targetHours: 2
      };
    }

    // Atualiza as horas no documento
    const newHours = (goalDoc.currentHours || 0) + (seconds / 3600);
    console.log(`Atualizando horas de ${goalDoc.currentHours} para ${newHours}`);
    
    await goalsRef.doc(goalDoc.id).update({
      currentHours: newHours,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
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
