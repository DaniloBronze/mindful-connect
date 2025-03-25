import { signInWithGoogle, signOut, getCurrentUser } from './lib/firebase-auth.js';

document.addEventListener('DOMContentLoaded', async function() {
  // Elementos do DOM
  const loginSection = document.getElementById('loginSection');
  const userSection = document.getElementById('userSection');
  const loginButton = document.getElementById('loginButton');
  const logoutButton = document.getElementById('logoutButton');
  const userPhoto = document.getElementById('userPhoto');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const statsContent = document.getElementById('statsContent');

  // Função para atualizar a interface com base no status de autenticação
  async function updateUI(user) {
    if (user) {
      // Usuário está logado
      loginSection.style.display = 'none';
      userSection.style.display = 'block';
      
      // Atualiza informações do usuário
      userPhoto.src = user.photoURL || 'https://www.gravatar.com/avatar/?d=mp';
      userName.textContent = user.displayName || 'Usuário';
      userEmail.textContent = user.email;
      
      // Carrega as estatísticas do usuário
      await loadUserStats();
    } else {
      // Usuário não está logado
      loginSection.style.display = 'block';
      userSection.style.display = 'none';
      
      // Limpa informações do usuário
      userPhoto.src = '';
      userName.textContent = '';
      userEmail.textContent = '';
      statsContent.innerHTML = '';
    }
  }

  // Função para carregar as estatísticas do usuário
  async function loadUserStats() {
    try {
      const { authToken } = await chrome.storage.local.get('authToken');
      if (!authToken) return;

      const response = await fetch('https://mewing-bevel-battery.glitch.me/api/stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const stats = await response.json();
        statsContent.innerHTML = '';
        
        // Renderiza as estatísticas
        Object.entries(stats).forEach(([app, time]) => {
          // O tempo já vem em horas do servidor
          const hours = Math.floor(time);
          const minutes = Math.floor((time - hours) * 60);
          
          const statItem = document.createElement('div');
          statItem.className = 'stat-item';
          statItem.innerHTML = `
            <span>${app}</span>
            <span>${hours}h ${minutes}m</span>
          `;
          
          statsContent.appendChild(statItem);
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      statsContent.innerHTML = '<p>Erro ao carregar estatísticas</p>';
    }
  }

  // Atualiza as estatísticas a cada 10 segundos
  setInterval(loadUserStats, 10000);

  // Event Listeners
  loginButton.addEventListener('click', async () => {
    try {
      const user = await signInWithGoogle();
      await updateUI(user);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
    }
  });

  logoutButton.addEventListener('click', async () => {
    try {
      await signOut();
      await updateUI(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  });

  // Verifica o estado inicial de autenticação
  const user = await getCurrentUser();
  await updateUI(user);
});
