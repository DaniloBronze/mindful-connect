/******/ (() => { // webpackBootstrap
// Lista de domínios a serem rastreados
const TRACKED_DOMAINS = {
  'instagram.com': 'Instagram',
  'facebook.com': 'Facebook',
  'twitter.com': 'Twitter',
  'tiktok.com': 'TikTok',
  'whatsapp.com': 'WhatsApp',
  'youtube.com': 'YouTube',
  'linkedin.com': 'LinkedIn'
};

// Função para obter o nome do app a partir da URL
function getAppFromUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return Object.entries(TRACKED_DOMAINS).find(([domain]) => hostname.includes(domain))?.[1];
  } catch (e) {
    console.error('Error analyzing URL:', e);
    return null;
  }
}

// Função para extrair o domínio da URL
function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    console.error('Error analyzing URL:', e);
    return null;
  }
}

// Função para atualizar o tempo no servidor
async function updateTimeOnServer(app, seconds) {
  try {
    const {
      authToken
    } = await chrome.storage.local.get('authToken');
    if (!authToken) {
      console.log('User not authenticated');
      return;
    }
    const response = await fetch('https://mewing-bevel-battery.glitch.me/api/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        app,
        timeSpent: seconds
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Time updated successfully:', data);
  } catch (error) {
    console.error('Error updating time:', error);
    // Se houver erro, armazena localmente para tentar enviar depois
    try {
      const {
        pendingUpdates = []
      } = await chrome.storage.local.get('pendingUpdates');
      pendingUpdates.push({
        app,
        seconds,
        timestamp: Date.now()
      });
      await chrome.storage.local.set({
        pendingUpdates
      });
    } catch (e) {
      console.error('Error storing pending update:', e);
    }
  }
}

// Variáveis para rastreamento
let currentApp = null;
let startTime = null;
let isTracking = false;
let updateInterval = null;

// Função para iniciar o rastreamento
function startTracking(app) {
  if (isTracking && app === currentApp) return;
  if (isTracking) {
    stopTracking();
  }
  currentApp = app;
  startTime = Date.now();
  isTracking = true;
  console.log(`Started tracking: ${app}`);

  // Envia atualização a cada 30 segundos
  updateInterval = setInterval(() => {
    const currentTime = Date.now();
    const timeSpent = Math.floor((currentTime - startTime) / 1000);
    if (timeSpent >= 1) {
      updateTimeOnServer(currentApp, timeSpent);
      // Reseta o tempo inicial após enviar
      startTime = currentTime;
    }
  }, 30000); // 30 segundos
}

// Função para parar o rastreamento
function stopTracking() {
  if (!isTracking || !currentApp || !startTime) return;

  // Limpa o intervalo de atualização
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  const endTime = Date.now();
  const timeSpent = Math.floor((endTime - startTime) / 1000);
  if (timeSpent >= 1) {
    updateTimeOnServer(currentApp, timeSpent);
  }
  currentApp = null;
  startTime = null;
  isTracking = false;
}

// Listener para mudanças de aba
chrome.tabs.onActivated.addListener(async activeInfo => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    const app = getAppFromUrl(tab.url);
    if (app) {
      startTracking(app);
    } else {
      stopTracking();
    }
  } catch (e) {
    console.error('Error handling tab activation:', e);
  }
});

// Listener para atualizações de aba
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const app = getAppFromUrl(changeInfo.url);
    if (app) {
      startTracking(app);
    } else {
      stopTracking();
    }
  }
});

// Listener para quando a aba fica inativa
chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopTracking();
  } else {
    // Quando a janela voltar a ficar ativa, verifica a aba atual
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, tabs => {
      if (tabs[0]) {
        const app = getAppFromUrl(tabs[0].url);
        if (app) {
          startTracking(app);
        }
      }
    });
  }
});

// Listener para quando a extensão é suspensa
chrome.runtime.onSuspend.addListener(() => {
  stopTracking();
});

// Tentar enviar atualizações pendentes a cada minuto
setInterval(async () => {
  try {
    const {
      pendingUpdates = []
    } = await chrome.storage.local.get('pendingUpdates');
    if (pendingUpdates.length === 0) return;
    console.log('Trying to send pending updates:', pendingUpdates.length);
    const successfulUpdates = [];
    for (const update of pendingUpdates) {
      try {
        await updateTimeOnServer(update.app, update.seconds);
        successfulUpdates.push(update);
      } catch (e) {
        console.error('Failed to send update:', e);
      }
    }

    // Remove successful updates from pending list
    if (successfulUpdates.length > 0) {
      const remainingUpdates = pendingUpdates.filter(update => !successfulUpdates.find(success => success.app === update.app && success.seconds === update.seconds && success.timestamp === update.timestamp));
      await chrome.storage.local.set({
        pendingUpdates: remainingUpdates
      });
    }
  } catch (e) {
    console.error('Error processing pending updates:', e);
  }
}, 60000);
/******/ })()
;