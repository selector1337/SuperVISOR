const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

const browserPaths = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean);

function getBrowserPath() {
  return browserPaths.find((browserPath) => fs.existsSync(browserPath));
}

let io;
let client;
let status = 'disconnected';
let qrCodeDataUrl = null;
let cachedGroups = [];
let lastError = null;
let isInitializing = false;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function authDir() {
  return path.join(process.cwd(), '.wwebjs_auth');
}

function emitState() {
  if (!io) return;
  io.emit('whatsapp:state', {
    status,
    qrCodeDataUrl,
    groups: cachedGroups,
    error: lastError
  });
}

function initWhatsApp(socketServer) {
  io = socketServer;
  startClient();
}

function startClient() {
  if (isInitializing) return;
  isInitializing = true;

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      executablePath: getBrowserPath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', async (qr) => {
    status = 'qr';
    lastError = null;
    qrCodeDataUrl = await qrcode.toDataURL(qr);
    emitState();
  });

  client.on('loading_screen', () => {
    status = 'loading';
    lastError = null;
    emitState();
  });

  client.on('authenticated', () => {
    status = 'authenticated';
    lastError = null;
    qrCodeDataUrl = null;
    console.log('WhatsApp autenticado. Aguardando sincronização...');
    emitState();
  });

  client.on('auth_failure', (message) => {
    status = 'error';
    lastError = `Falha de autenticação: ${message}`;
    console.error('Falha de autenticação do WhatsApp:', message);
    emitState();
  });

  client.on('change_state', (state) => {
    console.log('Estado interno do WhatsApp:', state);
  });

  client.on('ready', async () => {
    status = 'ready';
    lastError = null;
    qrCodeDataUrl = null;
    console.log('WhatsApp pronto. Carregando grupos...');
    try {
      await refreshGroups({ retries: 8, waitForConnection: true });
    } catch (error) {
      lastError = `Conectado, mas não consegui carregar os grupos: ${error.message}`;
      console.error('Erro ao carregar grupos:', error);
    }
    emitState();
  });

  client.on('disconnected', () => {
    status = 'disconnected';
    lastError = null;
    cachedGroups = [];
    emitState();
  });

  client.initialize().catch((error) => {
    status = 'error';
    lastError = error.message;
    console.error('Erro ao iniciar WhatsApp:', error);
    emitState();
  }).finally(() => {
    isInitializing = false;
  });
}

async function getClientState() {
  if (!client) return null;

  try {
    return await client.getState();
  } catch (error) {
    return null;
  }
}

async function waitForConnected(maxAttempts = 8) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const connectionState = await getClientState();
    if (connectionState === 'CONNECTED') return true;
    await delay(1500);
  }

  return false;
}

function isNotConnectedError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('not connected')
    || message.includes('nao esta conectado')
    || message.includes('não está conectado');
}

function isCurrentUserParticipant(chat) {
  const currentUserId = client?.info?.wid?._serialized;
  if (!currentUserId) return true;
  if (!Array.isArray(chat.participants)) return true;

  return chat.participants.some((participant) => {
    const participantId = participant?.id?._serialized || participant?.id?.user;
    return participantId === currentUserId || `${participantId}@c.us` === currentUserId;
  });
}

async function refreshGroups({ retries = 3, waitForConnection = false } = {}) {
  if (!client || status !== 'ready') {
    const error = new Error('WhatsApp ainda não está conectado.');
    error.status = 409;
    throw error;
  }

  if (waitForConnection) {
    const connected = await waitForConnected(Math.max(retries, 1));
    if (!connected) {
      const error = new Error('WhatsApp ainda esta sincronizando. Aguarde alguns segundos e tente atualizar novamente.');
      error.status = 409;
      throw error;
    }
  }

  try {
    let chats;
    let lastRefreshError;

    for (let attempt = 0; attempt < retries; attempt += 1) {
      try {
        chats = await client.getChats();
        break;
      } catch (error) {
        lastRefreshError = error;
        if (!isNotConnectedError(error) || attempt === retries - 1) throw error;
        await delay(1500);
      }
    }

    if (!chats) throw lastRefreshError || new Error('Nao consegui carregar os grupos.');

    cachedGroups = chats
      .filter((chat) => chat.isGroup && isCurrentUserParticipant(chat))
      .map((chat) => ({
        id: chat.id._serialized,
        name: chat.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    lastError = null;
    emitState();
    return cachedGroups;
  } catch (error) {
    lastError = `Não consegui carregar os grupos: ${error.message}`;
    emitState();
    throw error;
  }
}

function getState() {
  return {
    status,
    qrCodeDataUrl,
    groups: cachedGroups,
    error: lastError
  };
}

function requireReady() {
  if (!client || status !== 'ready') {
    const error = new Error('WhatsApp ainda não está conectado.');
    error.status = 409;
    throw error;
  }
}

async function sendMessageToGroups(groupIds, message) {
  requireReady();

  const results = [];

  for (const groupId of groupIds) {
    try {
      const response = await client.sendMessage(groupId, message);
      results.push({ groupId, ok: true, messageId: response.id._serialized });
    } catch (error) {
      results.push({ groupId, ok: false, error: error.message });
    }
  }

  return results;
}

async function disconnectWhatsApp({ clearSession = false } = {}) {
  const currentClient = client;
  client = null;
  cachedGroups = [];
  qrCodeDataUrl = null;
  status = 'disconnected';
  lastError = null;

  if (currentClient) {
    try {
      await currentClient.logout();
    } catch (error) {
      console.warn('Não consegui fazer logout pelo WhatsApp:', error.message);
    }

    try {
      await currentClient.destroy();
    } catch (error) {
      console.warn('Não consegui destruir o cliente WhatsApp:', error.message);
    }
  }

  if (clearSession && fs.existsSync(authDir())) {
    fs.rmSync(authDir(), { recursive: true, force: true });
  }

  emitState();
  startClient();
}

module.exports = {
  disconnectWhatsApp,
  getState,
  initWhatsApp,
  refreshGroups,
  sendMessageToGroups
};
