import { initializeApp } from './lib/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider } from './lib/firebase-auth.js';
import { firebaseConfig } from './lib/firebase-config.js';

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', function() {
  // Elementos do DOM
  const loginContainer = document.getElementById('login-container');
  const trackingContainer = document.getElementById('tracking-container');
  const loginButton = document.getElementById('login-button');
  const trackingStatus = document.getElementById('tracking-status');
  const currentApp = document.getElementById('current-app');

  // Função para atualizar a interface com base no status de autenticação
  async function updateUI(user) {
    if (user) {
      // Usuário está logado
      loginContainer.style.display = 'none';
      trackingContainer.style.display = 'block';
      
      // Salva as informações do usuário
      try {
        await chrome.storage.local.set({ 
          authToken: await user.getIdToken(),
          userEmail: user.email
        });
        console.log('Usuário autenticado:', user.email);
      } catch (error) {
        console.error('Erro ao salvar dados:', error);
      }
    } else {
      // Usuário não está logado
      loginContainer.style.display = 'block';
      trackingContainer.style.display = 'none';
      
      // Remove o token de autenticação
      try {
        await chrome.storage.local.remove(['authToken', 'userEmail']);
        console.log('Dados de autenticação removidos');
      } catch (error) {
        console.error('Erro ao remover dados:', error);
      }
    }
  }

  // Login com Google usando Firebase
  loginButton.addEventListener('click', async () => {
    try {
      console.log('Iniciando processo de login...');
      const result = await signInWithPopup(auth, provider);
      console.log('Login bem sucedido:', result.user.email);
      await updateUI(result.user);
    } catch (error) {
      console.error('Erro detalhado no login:', error.message || error);
      alert(`Erro ao fazer login: ${error.message || 'Tente novamente mais tarde'}`);
    }
  });

  // Atualiza os contadores de tempo
  function updateTimers() {
    chrome.storage.local.get(['todayStats'], function(result) {
      const stats = result.todayStats || {};
      
      Object.entries(stats).forEach(([app, seconds]) => {
        const minutes = Math.floor(seconds / 60);
        const element = document.getElementById(`${app.toLowerCase()}-time`);
        if (element) {
          element.textContent = `${minutes}min`;
        }
      });
    });
  }

  // Atualiza o status de rastreamento
  function updateTrackingStatus() {
    chrome.runtime.sendMessage({ type: 'getStatus' }, function(response) {
      if (response && trackingStatus) {
        trackingStatus.textContent = response.active ? 'Ativo' : 'Inativo';
        if (currentApp) {
          currentApp.textContent = response.currentApp || 'Nenhum';
        }
      }
    });
  }

  // Observa mudanças no estado de autenticação
  auth.onAuthStateChanged((user) => {
    updateUI(user);
  });

  // Atualiza a interface a cada segundo
  setInterval(() => {
    updateTimers();
    updateTrackingStatus();
  }, 1000);
});
