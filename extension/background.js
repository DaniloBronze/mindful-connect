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
    console.error('Erro ao analisar URL:', e);
    return null;
  }
}

// Função para extrair o domínio da URL
function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    console.error('Erro ao analisar URL:', e);
    return null;
  }
}

// Função para atualizar o tempo no servidor
async function updateTimeOnServer(app, seconds) {
  try {
    // Obtém as credenciais do usuário
    const { authToken, userEmail } = await chrome.storage.local.get(['authToken', 'userEmail']);
    
    if (!authToken || !userEmail) {
      console.log('Usuário não autenticado');
      return;
    }

    const response = await fetch('https://seu-projeto.glitch.me/api/track-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        app,
        seconds,
        timestamp: new Date().toISOString(),
        userEmail
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Atualiza o storage local com as horas atuais e a meta
    const todayStats = (await chrome.storage.local.get(['todayStats'])).todayStats || {};
    todayStats[app] = {
      currentHours: data.currentHours,
      targetHours: data.targetHours
    };
    await chrome.storage.local.set({ todayStats });
    
    console.log('Tempo atualizado com sucesso:', data);
  } catch (error) {
    console.error('Erro ao atualizar tempo:', error);
  }
}

// Variáveis para rastreamento
let currentApp = null;
let startTime = null;
let isTracking = false;

// Função para iniciar o rastreamento
function startTracking(app) {
  if (app !== currentApp) {
    if (currentApp) {
      stopTracking();
    }
    currentApp = app;
    startTime = Date.now();
    isTracking = true;
    chrome.runtime.sendMessage({ 
      type: 'statusUpdate', 
      active: true, 
      currentApp: app 
    });
  }
}

// Função para parar o rastreamento
async function stopTracking() {
  if (currentApp && startTime) {
    const endTime = Date.now();
    const seconds = Math.floor((endTime - startTime) / 1000);
    
    if (seconds > 0) {
      await updateTimeOnServer(currentApp, seconds);
    }
    
    currentApp = null;
    startTime = null;
    isTracking = false;
    chrome.runtime.sendMessage({ 
      type: 'statusUpdate', 
      active: false, 
      currentApp: null 
    });
  }
}

// Listener para mudanças de aba
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    const domain = getDomainFromUrl(tab.url);
    
    if (domain) {
      const socialMedias = {
        'instagram.com': 'Instagram',
        'facebook.com': 'Facebook',
        'twitter.com': 'Twitter',
        'tiktok.com': 'TikTok',
        'web.whatsapp.com': 'WhatsApp',
        'youtube.com': 'YouTube',
        'linkedin.com': 'LinkedIn'
      };

      const app = Object.entries(socialMedias).find(([key]) => domain.includes(key));
      if (app) {
        startTracking(app[1]);
      } else {
        stopTracking();
      }
    } else {
      stopTracking();
    }
  } catch (error) {
    console.error('Erro ao processar mudança de aba:', error);
  }
});

// Listener para atualizações de aba
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const domain = getDomainFromUrl(changeInfo.url);
    if (domain) {
      const socialMedias = {
        'instagram.com': 'Instagram',
        'facebook.com': 'Facebook',
        'twitter.com': 'Twitter',
        'tiktok.com': 'TikTok',
        'web.whatsapp.com': 'WhatsApp',
        'youtube.com': 'YouTube',
        'linkedin.com': 'LinkedIn'
      };

      const app = Object.entries(socialMedias).find(([key]) => domain.includes(key));
      if (app) {
        startTracking(app[1]);
      } else {
        stopTracking();
      }
    } else {
      stopTracking();
    }
  }
});

// Listener para mensagens
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getStatus') {
    sendResponse({ 
      active: isTracking, 
      currentApp: currentApp 
    });
  }
  return true;
});
