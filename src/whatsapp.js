const qrcode = require('qrcode');
const { Client, LocalAuth, Message, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const store = require('./store');

function bundledBrowserPath() {
  try {
    return require('puppeteer').executablePath();
  } catch (error) {
    return null;
  }
}

const failedBrowserPaths = new Set();

function browserPaths() {
  return [
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    bundledBrowserPath(),
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/opt/google/chrome/chrome',
    '/opt/google/chrome/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);
}

function filePrefix(filePath, maxBytes = 4096) {
  let descriptor;
  try {
    descriptor = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(maxBytes);
    const bytesRead = fs.readSync(descriptor, buffer, 0, maxBytes, 0);
    return buffer.subarray(0, bytesRead).toString('utf8');
  } catch (error) {
    return '';
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
}

function isSnapBrowser(browserPath) {
  if (process.platform !== 'linux' || !browserPath) return false;
  const normalized = String(browserPath).replace(/\\/g, '/').toLowerCase();
  if (normalized.includes('/snap/') || normalized.startsWith('/snap/bin/')) return true;
  const wrapper = filePrefix(browserPath).toLowerCase();
  return wrapper.includes('/snap/bin/chromium')
    || wrapper.includes('snap run chromium')
    || wrapper.includes('/usr/bin/snap');
}

function getBrowserPath() {
  for (const browserPath of browserPaths()) {
    if (failedBrowserPaths.has(browserPath) || !fs.existsSync(browserPath)) continue;
    if (isSnapBrowser(browserPath)) {
      failedBrowserPaths.add(browserPath);
      debugLog('Ignorando Chromium Snap incompatível com PM2/systemd', browserPath);
      continue;
    }
    return browserPath;
  }
  return null;
}

let io;
let client;
let status = 'disconnected';
let qrCodeDataUrl = null;
let cachedGroups = [];
let lastError = null;
let isInitializing = false;
let startPromise = null;
let healthTimer = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let manualDisconnectUntil = 0;
let isShuttingDown = false;
let recentIncomingMessages = [];
const avatarCache = new Map();
const avatarRequests = new Map();
const MEDIA_DOWNLOAD_LIMIT = 8;
const CHAT_SNAPSHOT_CACHE_MS = 2500;
let chatSnapshotCache = [];
let chatSnapshotCacheAt = 0;
let chatSnapshotPromise = null;
let fullChatReadDisabledUntil = 0;
let consecutiveChatReadFailures = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
}

function debugLog(message, details = '') {
  const line = `[${new Date().toISOString()}] ${message}${details ? ` ${details}` : ''}\n`;
  try {
    fs.appendFileSync(path.join(process.cwd(), 'whatsapp-debug.log'), line);
  } catch (error) {
    console.warn('Nao consegui escrever whatsapp-debug.log:', error.message);
  }
  console.log(message, details);
}

function authDir() {
  return path.join(process.cwd(), '.wwebjs_auth');
}

function sessionDir() {
  return path.join(authDir(), 'session');
}

function cacheDir() {
  return path.join(process.cwd(), '.wwebjs_cache');
}

function browserPidFile() {
  return path.join(authDir(), 'browser.pid');
}

async function removeDir(target) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
      if (!fs.existsSync(target)) return;
    } catch (error) {
      lastError = `Nao consegui limpar a sessao salva: ${error.message}`;
    }
    await delay(700);
  }

  if (fs.existsSync(target)) {
    const error = new Error(`Nao consegui limpar ${path.basename(target)}. Feche outros Chromes/WhatsApp Web e tente novamente.`);
    error.status = 409;
    throw error;
  }
}

async function removeAuthArtifacts() {
  await removeDir(authDir());
  await removeDir(cacheDir());
}

function readBrowserPid() {
  try {
    const value = fs.readFileSync(browserPidFile(), 'utf8').trim();
    const pid = Number(value);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch (error) {
    return null;
  }
}

function writeBrowserPid(instance) {
  try {
    const pid = instance?.pupBrowser?.process()?.pid;
    if (!pid) return;
    fs.mkdirSync(authDir(), { recursive: true });
    fs.writeFileSync(browserPidFile(), String(pid));
    debugLog('PID do navegador WhatsApp registrado', String(pid));
  } catch (error) {
    debugLog('Nao consegui registrar PID do navegador WhatsApp', error.message);
  }
}

function commandLineForPid(pid) {
  if (!pid) return '';
  try {
    return fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ');
  } catch (error) {
    return '';
  }
}

function processLooksLikeWhatsappBrowser(pid) {
  const commandLine = commandLineForPid(pid);
  if (!commandLine) return process.platform === 'win32';
  return commandLine.includes('.wwebjs_auth')
    || commandLine.includes(sessionDir())
    || commandLine.includes('whatsapp-web.js')
    || commandLine.includes('--remote-debugging');
}

function killProcess(pid, reason) {
  if (!pid || pid === process.pid) return false;
  try {
    if (!processLooksLikeWhatsappBrowser(pid)) {
      debugLog('Ignorando PID que nao parece ser navegador do WhatsApp', `${pid} ${reason}`);
      return false;
    }
    process.kill(pid, 'SIGTERM');
    debugLog('Encerrando navegador antigo do WhatsApp', `${pid} ${reason}`);
    return true;
  } catch (error) {
    if (error.code !== 'ESRCH') debugLog('Nao consegui encerrar navegador antigo', `${pid} ${error.message}`);
    return false;
  }
}

function cleanupChromiumLocks() {
  const dir = sessionDir();
  for (const name of ['SingletonLock', 'SingletonSocket', 'SingletonCookie', 'lockfile']) {
    const target = path.join(dir, name);
    try {
      if (fs.existsSync(target)) fs.rmSync(target, { force: true, recursive: true });
    } catch (error) {
      debugLog('Nao consegui limpar lock do Chromium', `${name} ${error.message}`);
    }
  }
}

async function recoverSessionLock(reason = 'recovery') {
  debugLog('Recuperando lock da sessao WhatsApp', reason);
  killProcess(readBrowserPid(), reason);
  try {
    if (fs.existsSync(browserPidFile())) fs.rmSync(browserPidFile(), { force: true });
  } catch (error) {
    debugLog('Nao consegui remover browser.pid antigo', error.message);
  }
  cleanupChromiumLocks();
  await delay(1200);
  cleanupChromiumLocks();
}

async function closeClientBrowser(instance) {
  const pid = instance?.pupBrowser?.process()?.pid;
  try {
    await instance?.pupBrowser?.close();
  } catch (error) {
    console.warn('Nao consegui fechar o navegador do WhatsApp:', error.message);
  }

  try {
    instance?.pupBrowser?.process()?.kill();
  } catch (error) {
    console.warn('Nao consegui encerrar o processo do navegador do WhatsApp:', error.message);
  }

  if (pid) {
    await delay(700);
    killProcess(pid, 'closeClientBrowser');
  }
}

function emitState() {
  if (!io) return;
  io.emit('whatsapp:state', {
    status,
    qrCodeDataUrl,
    groups: cachedGroups,
    connectedNumber: connectedNumber(),
    error: lastError
  });
}

function initWhatsApp(socketServer) {
  io = socketServer;
  startClient();
}

function isSessionAlreadyRunningError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('browser is already running')
    || message.includes('userdatadir')
    || message.includes('singletonlock')
    || message.includes('processsingleton');
}

function isBrowserSpawnError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('spawn eperm')
    || message.includes('spawn eacces')
    || message.includes('permission denied')
    || message.includes('cannot start document portal')
    || message.includes('snap.chromium.chromium')
    || message.includes('/run/user/')
    || message.includes('failed to launch the browser process');
}

function startClient() {
  if (startPromise) return startPromise;
  startPromise = startClientInternal().finally(() => {
    startPromise = null;
  });
  return startPromise;
}

async function startClientInternal({ recovered = false } = {}) {
  if (isInitializing || isShuttingDown) return;
  isInitializing = true;
  clearChatSnapshotCache();
  fullChatReadDisabledUntil = 0;
  consecutiveChatReadFailures = 0;
  status = 'loading';
  qrCodeDataUrl = null;
  lastError = null;
  const browserPath = getBrowserPath();
  debugLog('Iniciando cliente WhatsApp', `browser=${browserPath || 'bundled'}`);
  emitState();

  if (!browserPath) {
    status = 'error';
    lastError = process.platform === 'linux'
      ? 'Chrome compatível não encontrado. O Chromium Snap não funciona de forma confiável sob PM2/systemd. Execute npm run browser:install na pasta da aplicação e reinicie o processo.'
      : 'Chrome compatível não encontrado. Execute npm run browser:install na pasta da aplicação e reinicie o processo.';
    debugLog('Nenhum navegador compatível disponível para o WhatsApp.');
    isInitializing = false;
    emitState();
    return;
  }

  if (!recovered && readBrowserPid()) {
    await recoverSessionLock('startup com PID antigo registrado');
  }

  client = new Client({
    authStrategy: new LocalAuth({ rmMaxRetries: 10 }),
    puppeteer: {
      headless: true,
      protocolTimeout: 120000,
      executablePath: browserPath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-background-networking',
        '--disable-component-update',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-first-run',
        '--disable-extensions'
      ]
    }
  });

  client.on('qr', async (qr) => {
    status = 'qr';
    lastError = null;
    qrCodeDataUrl = await qrcode.toDataURL(qr);
    debugLog('QR Code do WhatsApp gerado.');
    emitState();
  });

  client.on('loading_screen', (percent, message) => {
    debugLog('Tela de carregamento WhatsApp', `${percent || 0}% ${message || ''}`);
    if (status === 'ready' || status === 'authenticated') return;
    status = 'loading';
    lastError = null;
    emitState();
  });

  client.on('authenticated', () => {
    if (status === 'ready') return;
    status = 'authenticated';
    lastError = null;
    qrCodeDataUrl = null;
    debugLog('WhatsApp autenticado. Aguardando sincronização...');
    emitState();
  });

  client.on('auth_failure', (message) => {
    status = 'error';
    lastError = `Falha de autenticação: ${message}`;
    debugLog('Falha de autenticação do WhatsApp', message);
    emitState();
  });

  client.on('change_state', (stateName) => {
    debugLog('Estado interno do WhatsApp', stateName);
    if (stateName === 'CONNECTED' && status !== 'ready') {
      status = 'ready';
      lastError = null;
      qrCodeDataUrl = null;
      emitState();
    }
  });

  client.on('ready', async () => {
    status = 'ready';
    lastError = null;
    qrCodeDataUrl = null;
    clearChatSnapshotCache();
    debugLog('WhatsApp pronto. Carregando grupos...');
    emitState();
    try {
      await withTimeout(
        refreshGroups({ retries: 3, waitForConnection: true }),
        30000,
        'WhatsApp conectou, mas a lista de grupos demorou para sincronizar. Clique em Atualizar em alguns instantes.'
      );
    } catch (error) {
      lastError = `Conectado, mas não consegui carregar os grupos: ${error.message}`;
      debugLog('Erro ao carregar grupos', error.message);
    }
    emitState();
  });

  client.on('message', async (message) => {
    if (!io) return;
    try {
      clearChatSnapshotCache();
      const summary = await messageSummary(message);
      if (!message.fromMe) {
        const identities = await messageIdentity(message);
        const record = {
          chatId: message.from,
          timestamp: summary.timestamp,
          identities
        };
        recentIncomingMessages.push({
          ...record
        });
        recentIncomingMessages = recentIncomingMessages.slice(-2000);
        persistAttendanceRecord(record);
      }
      io.emit('whatsapp:message', summary);
    } catch (error) {
      io.emit('whatsapp:message', {
        id: message.id?._serialized,
        from: message.author || message.from,
        to: message.to,
        body: message.body || '',
        fromMe: Boolean(message.fromMe),
        ack: typeof message.ack === 'number' ? message.ack : null,
        timestamp: message.timestamp ? message.timestamp * 1000 : Date.now()
      });
    }
  });

  client.on('message_ack', (message, ack) => {
    if (!io) return;
    io.emit('whatsapp:messageAck', {
      id: message.id?._serialized,
      chatId: message.to || message.from,
      ack
    });
  });

  client.on('disconnected', () => {
    debugLog('WhatsApp desconectado.');
    status = 'disconnected';
    lastError = null;
    cachedGroups = [];
    clearChatSnapshotCache();
    emitState();
    if (Date.now() > manualDisconnectUntil) scheduleReconnect('evento disconnected');
  });

  client.initialize().then(() => {
    writeBrowserPid(client);
  }).catch(async (error) => {
    if (browserPath && isBrowserSpawnError(error) && !failedBrowserPaths.has(browserPath)) {
      failedBrowserPaths.add(browserPath);
      debugLog('Navegador bloqueado pelo sistema, tentando outro caminho', browserPath);
      await closeClientBrowser(client);
      client = null;
      isInitializing = false;
      return startClientInternal({ recovered });
    }

    if (!recovered && isSessionAlreadyRunningError(error)) {
      debugLog('Sessao WhatsApp travada detectada', error.message);
      await closeClientBrowser(client);
      await recoverSessionLock(error.message);
      client = null;
      isInitializing = false;
      return startClientInternal({ recovered: true });
    }
    status = 'error';
    lastError = error.message;
    debugLog('Erro ao iniciar WhatsApp', error.stack || error.message);
    emitState();
    if (Date.now() > manualDisconnectUntil) {
      setTimeout(() => scheduleReconnect('falha ao iniciar WhatsApp'), 1000);
    }
  }).finally(() => {
    isInitializing = false;
    debugLog('Inicializacao do cliente WhatsApp finalizada.');
  });

  setTimeout(() => {
    if (status === 'loading' && !qrCodeDataUrl) {
      lastError = 'WhatsApp Web demorou para gerar o QR Code. Clique em Gerar novo QR novamente.';
      debugLog('Timeout aguardando QR Code.');
      emitState();
    }
  }, 30000);

  if (healthTimer) clearInterval(healthTimer);
  healthTimer = setInterval(async () => {
    if (!client || status === 'qr' || status === 'error') return;
    const connectionState = await getClientState();
    if (connectionState === 'CONNECTED') {
      reconnectAttempts = 0;
      status = 'ready';
      lastError = null;
      qrCodeDataUrl = null;
      debugLog('Watchdog marcou WhatsApp como conectado.');
      emitState();
      return;
    }

    if (status === 'ready' && !connectionState && Date.now() > manualDisconnectUntil) {
      status = 'disconnected';
      lastError = 'WhatsApp perdeu a conexão. Tentando reconectar automaticamente.';
      debugLog('Watchdog detectou queda do WhatsApp.');
      emitState();
      scheduleReconnect('watchdog sem estado');
    }
  }, 15000);
}

function scheduleReconnect(reason = 'reconnect') {
  if (isShuttingDown || reconnectTimer || isInitializing || startPromise) return;
  reconnectAttempts += 1;
  const delayMs = Math.min(30000, 3000 * reconnectAttempts);
  debugLog('Agendando reconexão WhatsApp', `${reason} em ${delayMs}ms`);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    try {
      cleanupChromiumLocks();
      await closeClientBrowser(client);
      client = null;
      startClient();
    } catch (error) {
      debugLog('Falha ao tentar reconectar WhatsApp', error.message);
      scheduleReconnect('falha no reconnect');
    }
  }, delayMs);
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

function contactNumberFromId(id) {
  return String(id || '').replace(/@.*/, '');
}

function comparableNumber(value) {
  return String(value || '').replace(/\D/g, '');
}

function numbersMatch(left, right) {
  const a = comparableNumber(left);
  const b = comparableNumber(right);
  if (!a || !b) return false;
  return a === b || a.endsWith(b) || b.endsWith(a);
}

function identityParts(value) {
  if (!value) return [];
  if (typeof value === 'string' || typeof value === 'number') return [String(value)];
  if (typeof value !== 'object') return [];

  const parts = [
    value._serialized,
    value.serialized,
    value.user,
    value.server && value.user ? `${value.user}@${value.server}` : null
  ];

  return parts.filter(Boolean).map(String);
}

async function messageIdentity(message) {
  const identities = [
    ...identityParts(message.author),
    ...identityParts(message.from),
    ...identityParts(message.to),
    ...identityParts(message.id?.participant),
    ...identityParts(message.id?.remote),
    ...identityParts(message._data?.author),
    ...identityParts(message._data?.from),
    ...identityParts(message._data?.id?.participant),
    ...identityParts(message._data?.id?.remote),
    contactNumberFromId(message.author || message.from)
  ];

  try {
    const contact = await message.getContact();
    identities.push(
      ...identityParts(contact?.id),
      contact?.number,
      contact?.pushname,
      contact?.name,
      contact?.shortName
    );
  } catch (error) {
    // The raw message identifiers above are enough for most cases.
  }

  return [...new Set(identities.filter(Boolean).map(String))];
}

function watcherMatchesMessage(stat, messageRecord) {
  const identities = messageRecord.identities || [];
  const participantNumber = contactNumberFromId(stat.participantId);
  if (stat.participantId) {
    return identities.some((identity) => identity === stat.participantId || numbersMatch(identity, participantNumber));
  }

  return identities.some((identity) => numbersMatch(identity, stat.contactPhone));
}

async function persistAttendanceRecord(record) {
  try {
    const watchers = await store.listWatchers();
    const matching = watchers.filter((watcher) => watcher.groupId === record.chatId && watcherMatchesMessage(watcher, record));
    for (const watcher of matching) {
      await store.recordAttendanceMessage(watcher, record.timestamp);
      debugLog('Estatistica persistida', `${watcher.contactName} ${watcher.groupName}`);
    }
  } catch (error) {
    debugLog('Nao consegui persistir estatistica', error.message);
  }
}

async function getMessageSenderNumber(message) {
  try {
    const contact = await message.getContact();
    if (contact?.number) return contact.number;
    if (contact?.id?.user) return contact.id.user;
  } catch (error) {
    // Fallback below covers messages where WhatsApp does not expose contact details.
  }

  return contactNumberFromId(message.author || message.from);
}

function contactDisplayName(contact, fallback = '') {
  return contact?.pushname || contact?.name || contact?.shortName || contact?.number || fallback;
}

function bodyMentionTokens(body = '') {
  const tokens = [];
  String(body || '').replace(/@(\d{5,})(?:@(lid|c\.us))?/g, (match, value, suffix) => {
    tokens.push(suffix ? `${value}@${suffix}` : value);
    return match;
  });
  return [...new Set(tokens)];
}

async function resolveMentionToken(token) {
  const raw = String(token || '').replace(/^@/, '');
  if (!raw) return null;
  const rawNumber = raw.replace(/@.*/, '');
  try {
    const savedContacts = await store.listContacts();
    const saved = savedContacts.find((contact) => numbersMatch(contact.phone, rawNumber) || contact.whatsappId === raw);
    if (saved) {
      return {
        id: saved.whatsappId || raw,
        token: rawNumber,
        number: saved.phone,
        name: saved.name
      };
    }
  } catch (error) {
    // Stored contacts are just a nicer label fallback.
  }
  const candidates = raw.includes('@') ? [raw] : [`${raw}@c.us`, `${raw}@lid`];
  for (const id of candidates) {
    try {
      const contact = await client.getContactById(id);
      const fallback = contactNumberFromId(id);
      return {
        id,
        token: raw.replace(/@.*/, ''),
        number: contact?.number || contact?.id?.user || fallback,
        name: contactDisplayName(contact, fallback)
      };
    } catch (error) {
      // Try the next possible WhatsApp identifier shape.
    }
  }
  return { id: raw, token: raw.replace(/@.*/, ''), number: raw.replace(/@.*/, ''), name: raw.replace(/@.*/, '') };
}

async function profilePicUrlById(id) {
  if (!client || !id) return null;
  const cached = avatarCache.get(id);
  const now = Date.now();
  const cacheDuration = cached?.url ? 1000 * 60 * 30 : 1000 * 60 * 5;
  if (cached && now - cached.createdAt < cacheDuration) return cached.url;
  if (avatarRequests.has(id)) return avatarRequests.get(id);

  const request = (async () => {
    try {
      const candidates = [id];
      try {
        const contact = await withTimeout(client.getContactById(id), 2500, 'Contato demorou para carregar.');
        candidates.push(
          contact?.phoneNumber?._serialized,
          contact?.id?._serialized,
          contact?.number ? `${contact.number}@c.us` : null
        );
      } catch (error) {
        // The original identifier can still resolve the photo.
      }

      let url = null;
      for (const candidate of [...new Set(candidates.filter(Boolean))]) {
        try {
          url = await withTimeout(client.getProfilePicUrl(candidate), 3500, 'Foto demorou para carregar.');
          if (url) break;
        } catch (error) {
          // Try the phone-number identifier before using the cached thumbnail.
        }
      }

      if (!url && client?.pupPage) {
        try {
          const base64 = await withTimeout(client.pupPage.evaluate(async (contactId) => {
            const wid = window.require('WAWebWidFactory').createWid(contactId);
            return window.WWebJS.getProfilePicThumbToBase64(wid);
          }, id), 3500, 'Miniatura demorou para carregar.');
          if (base64) url = `data:image/jpeg;base64,${base64}`;
        } catch (error) {
          // Privacy settings may intentionally hide the profile picture.
        }
      }

      avatarCache.set(id, { url, createdAt: Date.now() });
      return url;
    } catch (error) {
      avatarCache.set(id, { url: null, createdAt: Date.now() });
      return null;
    } finally {
      avatarRequests.delete(id);
    }
  })();
  avatarRequests.set(id, request);
  return request;
}

function cachedProfilePicUrlById(id, { load = true } = {}) {
  if (!client || !id) return null;
  const cached = avatarCache.get(id);
  const now = Date.now();
  const cacheDuration = cached?.url ? 1000 * 60 * 30 : 1000 * 60 * 5;
  if (cached && now - cached.createdAt < cacheDuration) return cached.url;
  if (load) profilePicUrlById(id).catch(() => {});
  return null;
}

async function contactProfilePicUrl(contact) {
  return profilePicUrlById(contact?.id?._serialized);
}

function chatSummary(chat) {
  const id = chat.id?._serialized;
  const isGroup = Boolean(chat.isGroup);
  const lastMessage = chat.lastMessage;
  return {
    id,
    profilePicId: id,
    name: chat.name || chat.formattedTitle || contactNumberFromId(id),
    isGroup,
    isCurrentParticipant: !isGroup || isCurrentUserParticipant(chat),
    avatarUrl: cachedProfilePicUrlById(id, { load: false }),
    unreadCount: chat.unreadCount || 0,
    timestamp: chat.timestamp || null,
    lastMessage: lastMessage?.body || (lastMessage?.hasMedia ? '[mídia]' : '')
  };
}

function normalizeChatSnapshot(chat) {
  const id = String(chat?.id || '');
  if (!id) return null;
  return {
    id,
    profilePicId: chat.profilePicId || id,
    name: chat.name || contactNumberFromId(id),
    isGroup: Boolean(chat.isGroup),
    isCurrentParticipant: chat.isCurrentParticipant !== false,
    avatarUrl: cachedProfilePicUrlById(chat.profilePicId || id, { load: false }),
    unreadCount: Number(chat.unreadCount || 0),
    timestamp: Number(chat.timestamp || 0) || null,
    lastMessage: chat.lastMessage || ''
  };
}

async function readMinimalChatSnapshots() {
  if (!client?.pupPage) throw new Error('WhatsApp Web ainda nao terminou de carregar.');

  return withTimeout(client.pupPage.evaluate(() => {
    const collections = window.require('WAWebCollections');
    const chats = collections?.Chat?.getModelsArray?.() || [];
    const messages = collections?.Msg;

    return chats.map((chat) => {
      try {
        const id = chat?.id?._serialized || chat?.id?.toString?.() || '';
        if (!id) return null;

        let lastMessage = chat?.lastMessage || null;
        if (!lastMessage && chat?.lastReceivedKey?._serialized && messages?.get) {
          lastMessage = messages.get(chat.lastReceivedKey._serialized);
        }

        const body = lastMessage?.body || lastMessage?.caption || '';
        const type = String(lastMessage?.type || '');
        const hasMedia = Boolean(lastMessage?.mediaData || (type && !['chat', 'revoked'].includes(type)));
        const timestamp = Number(chat?.timestamp || chat?.t || lastMessage?.timestamp || lastMessage?.t || 0);

        const contact = chat?.contact || collections?.Contact?.get?.(chat?.id);
        const profilePicId = contact?.phoneNumber?._serialized || contact?.id?._serialized || id;

        return {
          id,
          profilePicId,
          name: chat?.name || chat?.formattedTitle || chat?.contact?.pushname || id.replace(/@.*/, ''),
          isGroup: Boolean(chat?.isGroup || chat?.groupMetadata || id.endsWith('@g.us')),
          unreadCount: Number(chat?.unreadCount || 0),
          timestamp,
          lastMessage: body || (hasMedia ? '[midia]' : '')
        };
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
  }), 20000, 'A lista de conversas demorou para sincronizar.');
}

async function getChatSnapshots({ force = false } = {}) {
  const now = Date.now();
  if (!force && chatSnapshotCache.length && now - chatSnapshotCacheAt < CHAT_SNAPSHOT_CACHE_MS) {
    return chatSnapshotCache;
  }
  if (chatSnapshotPromise) return chatSnapshotPromise;

  chatSnapshotPromise = (async () => {
    let snapshots;
    try {
      if (Date.now() >= fullChatReadDisabledUntil) {
        try {
          const chats = await withTimeout(client.getChats(), 30000, 'A lista de conversas demorou para sincronizar.');
          snapshots = chats.map(chatSummary);
          fullChatReadDisabledUntil = 0;
        } catch (error) {
          fullChatReadDisabledUntil = Date.now() + 5 * 60 * 1000;
          debugLog('Leitura completa de conversas falhou; usando leitura resiliente', error.stack || error.message);
        }
      }

      if (!snapshots) {
        snapshots = (await readMinimalChatSnapshots()).map(normalizeChatSnapshot).filter(Boolean);
      }
      consecutiveChatReadFailures = 0;
    } catch (error) {
      consecutiveChatReadFailures += 1;
      debugLog('Leitura resiliente de conversas falhou', error.stack || error.message);
      if (consecutiveChatReadFailures >= 3 && Date.now() > manualDisconnectUntil) {
        scheduleReconnect('falhas consecutivas ao ler conversas');
      }
      const friendlyError = new Error('O WhatsApp Web ainda esta sincronizando as conversas. A conexao sera recuperada automaticamente; tente novamente em alguns segundos.');
      friendlyError.status = 503;
      throw friendlyError;
    }

    chatSnapshotCache = snapshots;
    chatSnapshotCacheAt = Date.now();
    return snapshots;
  })().finally(() => {
    chatSnapshotPromise = null;
  });

  return chatSnapshotPromise;
}

function clearChatSnapshotCache() {
  chatSnapshotCache = [];
  chatSnapshotCacheAt = 0;
  chatSnapshotPromise = null;
}

async function messageSummary(message, { includeMedia = true, includeAvatar = true, includeChatName = true } = {}) {
  const from = message.author || message.from;
  const summary = {
    id: message.id?._serialized,
    from,
    to: message.to,
    body: message.body || '',
    fromMe: Boolean(message.fromMe),
    timestamp: message.timestamp ? message.timestamp * 1000 : Date.now(),
    ack: typeof message.ack === 'number' ? message.ack : null,
    hasMedia: Boolean(message.hasMedia),
    media: null,
    senderName: contactNumberFromId(from),
    senderNumber: contactNumberFromId(from),
    senderAvatarUrl: null,
    mentions: [],
    chatName: ''
  };

  try {
    const contact = await message.getContact();
    summary.senderName = contactDisplayName(contact, summary.senderName);
    summary.senderNumber = contact?.number || contact?.id?.user || summary.senderNumber;
    summary.senderAvatarUrl = includeAvatar ? await contactProfilePicUrl(contact) : null;
  } catch (error) {
    // Keep the ID fallback when WhatsApp Web does not expose contact details yet.
  }

  if (includeChatName) {
    try {
      const chat = await message.getChat();
      summary.chatName = chat?.name || chat?.formattedTitle || '';
    } catch (error) {
      // Chat name is just a notification enhancement.
    }
  }

  const mentionedIds = [
    ...(Array.isArray(message.mentionedIds) ? message.mentionedIds : []),
    ...(Array.isArray(message._data?.mentionedJidList) ? message._data.mentionedJidList : []),
    ...bodyMentionTokens(message.body)
  ];
  if (mentionedIds.length) {
    const mentions = await Promise.all([...new Set(mentionedIds)].map(resolveMentionToken));
    summary.mentions = mentions.filter(Boolean);
  }

  if (message.hasMedia && includeMedia) {
    try {
      const media = await message.downloadMedia();
      if (media) {
        summary.media = {
          mimetype: media.mimetype,
          filename: media.filename || message.body || 'arquivo',
          dataUrl: `data:${media.mimetype};base64,${media.data}`
        };
      }
    } catch (error) {
      summary.mediaError = error.message;
    }
  }

  return summary;
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
        chats = await getChatSnapshots({ force: true });
        break;
      } catch (error) {
        lastRefreshError = error;
        if (!isNotConnectedError(error) || attempt === retries - 1) throw error;
        await delay(1500);
      }
    }

    if (!chats) throw lastRefreshError || new Error('Nao consegui carregar os grupos.');

    cachedGroups = chats
      .filter((chat) => chat.isGroup && chat.isCurrentParticipant !== false)
      .map((chat) => ({
        id: chat.id?._serialized || chat.id,
        name: chat.name || chat.formattedTitle || chat.id?._serialized || chat.id || 'Grupo sem nome'
      }))
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

    lastError = null;
    emitState();
    return cachedGroups;
  } catch (error) {
    lastError = `Não consegui carregar os grupos: ${error.message}`;
    emitState();
    throw error;
  }
}

async function listConversations() {
  requireReady();
  const chats = await getChatSnapshots();
  const topChats = [...chats].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 80);
  await Promise.allSettled(topChats.slice(0, 12).map(async (chat) => {
    if (chat.avatarUrl) return;
    chat.avatarUrl = await profilePicUrlById(chat.profilePicId || chat.id);
  }));
  topChats.slice(12, 40).forEach((chat) => {
    if (!chat.avatarUrl) profilePicUrlById(chat.profilePicId || chat.id).catch(() => {});
  });
  return topChats;
}

async function readResilientMessages(chatId, limit) {
  const models = await withTimeout(client.pupPage.evaluate(async (targetChatId, requestedLimit) => {
    const chat = await window.WWebJS.getChat(targetChatId, { getAsModel: false });
    if (!chat?.msgs) return [];
    const validMessage = (message) => !message?.isNotification;
    let messages = (chat.msgs.getModelsArray?.() || []).filter(validMessage);

    while (messages.length < requestedLimit) {
      try {
        const loaded = await window.require('WAWebChatLoadMessages').loadEarlierMsgs({ chat });
        if (!loaded?.length) break;
        messages = [...loaded.filter(validMessage), ...messages];
      } catch (error) {
        break;
      }
    }

    messages.sort((left, right) => Number(left?.t || 0) - Number(right?.t || 0));
    messages = messages.slice(-requestedLimit);

    return messages.map((message) => {
      try {
        return window.WWebJS.getMessageModel(message);
      } catch (error) {
        const rawId = message?.id || {};
        const remote = rawId?.remote?._serialized || rawId?.remote || targetChatId;
        const serialized = rawId?._serialized || `${Boolean(rawId?.fromMe)}_${remote}_${rawId?.id || message?.t || Date.now()}`;
        const fromMe = Boolean(rawId?.fromMe);
        const id = { _serialized: serialized, fromMe, remote, id: rawId?.id || serialized };
        const serializeId = (value) => value?._serialized || value || null;
        return {
          id,
          ack: typeof message?.ack === 'number' ? message.ack : null,
          body: message?.body || message?.caption || '',
          caption: message?.caption || '',
          type: message?.type || 'chat',
          t: Number(message?.t || message?.timestamp || 0),
          from: serializeId(message?.from) || (fromMe ? null : targetChatId),
          to: serializeId(message?.to) || (fromMe ? targetChatId : null),
          author: serializeId(message?.author),
          directPath: message?.directPath || message?.mediaData?.directPath || null,
          mimetype: message?.mimetype || message?.mediaData?.mimetype || null,
          filename: message?.filename || null,
          mentionedJidList: message?.mentionedJidList || [],
          isStatusV3: false
        };
      }
    });
  }, chatId, limit), 30000, 'As mensagens demoraram para sincronizar.');

  return models.map((model) => new Message(client, model));
}

async function listMessages(chatId, limit = 24) {
  requireReady();
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 100);
  let messages;
  try {
    const chat = await client.getChatById(chatId);
    messages = await chat.fetchMessages({ limit: safeLimit });
  } catch (error) {
    debugLog('Leitura completa de mensagens falhou; usando leitura resiliente', error.stack || error.message);
    try {
      messages = await readResilientMessages(chatId, safeLimit);
    } catch (fallbackError) {
      debugLog('Leitura resiliente de mensagens falhou', fallbackError.stack || fallbackError.message);
      const friendlyError = new Error('O WhatsApp Web ainda esta sincronizando esta conversa. Tente abri-la novamente em alguns segundos.');
      friendlyError.status = 503;
      throw friendlyError;
    }
  }
  const mediaStart = Math.max(0, messages.length - MEDIA_DOWNLOAD_LIMIT);
  const summaries = await Promise.all(messages.map(async (message, index) => {
    try {
      return await messageSummary(message, { includeMedia: index >= mediaStart, includeAvatar: false, includeChatName: false });
    } catch (error) {
      debugLog('Mensagem individual ignorou metadados inconsistentes', error.message);
      return {
        id: message.id?._serialized || '',
        from: message.author || message.from || '',
        to: message.to || '',
        body: message.body || '',
        fromMe: Boolean(message.fromMe || message.id?.fromMe),
        timestamp: message.timestamp ? message.timestamp * 1000 : Date.now(),
        ack: typeof message.ack === 'number' ? message.ack : null,
        hasMedia: false,
        media: null,
        senderName: contactNumberFromId(message.author || message.from),
        senderNumber: contactNumberFromId(message.author || message.from),
        senderAvatarUrl: null,
        mentions: [],
        chatName: ''
      };
    }
  }));
  return summaries.sort((a, b) => a.timestamp - b.timestamp);
}

async function sendMessage(chatId, message) {
  requireReady();
  const response = await client.sendMessage(chatId, message);
  return { ok: true, messageId: response.id._serialized };
}

async function sendMessageWithMedia(chatId, { message = '', media }) {
  requireReady();
  if (!media?.data || !media?.mimetype) return sendMessage(chatId, message);
  let preparedMedia = media;
  const originalMimetype = String(media.mimetype).split(';')[0].trim() || media.mimetype;
  if (originalMimetype.startsWith('audio/')) {
    preparedMedia = await convertAudioForWhatsApp(media).catch((error) => {
      debugLog('Nao consegui converter audio para ogg/opus', error.message);
      return media;
    });
  }

  const mimetype = String(preparedMedia.mimetype).split(';')[0].trim() || preparedMedia.mimetype;
  const isAudio = mimetype.startsWith('audio/');
  const payload = new MessageMedia(mimetype, preparedMedia.data, preparedMedia.filename || mediaFilename(mimetype));
  const attempts = isAudio
    ? [
        { caption: message, sendAudioAsVoice: true },
        { caption: message },
        { caption: message, sendMediaAsDocument: true }
      ]
    : [{ caption: message }];

  let lastError;
  for (const options of attempts) {
    try {
      const response = await client.sendMessage(chatId, payload, options);
      return { ok: true, messageId: response.id._serialized };
    } catch (error) {
      lastError = error;
      debugLog('Falha ao enviar midia, tentando fallback', `${mimetype} ${error.message}`);
    }
  }

  throw lastError || new Error('Nao consegui enviar a midia.');
}

function mediaFilename(mimetype) {
  if (mimetype === 'audio/ogg') return `audio-${Date.now()}.ogg`;
  if (mimetype === 'audio/webm') return `audio-${Date.now()}.webm`;
  if (mimetype === 'audio/wav') return `audio-${Date.now()}.wav`;
  if (mimetype === 'audio/mpeg') return `audio-${Date.now()}.mp3`;
  return `arquivo-${Date.now()}`;
}

async function convertAudioForWhatsApp(media) {
  const ffmpegPath = require('ffmpeg-static');
  if (!ffmpegPath) throw new Error('ffmpeg-static nao esta disponivel.');

  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const input = path.join(os.tmpdir(), `supervisor-audio-${id}.webm`);
  const output = path.join(os.tmpdir(), `supervisor-audio-${id}.ogg`);

  try {
    await fs.promises.writeFile(input, Buffer.from(media.data, 'base64'));
    await execFileAsync(ffmpegPath, [
      '-y',
      '-i', input,
      '-vn',
      '-ac', '1',
      '-ar', '48000',
      '-c:a', 'libopus',
      '-b:a', '32k',
      output
    ]);
    const converted = await fs.promises.readFile(output);
    return {
      ...media,
      mimetype: 'audio/ogg',
      filename: `audio-${Date.now()}.ogg`,
      data: converted.toString('base64'),
      asVoice: true
    };
  } finally {
    await fs.promises.unlink(input).catch(() => {});
    await fs.promises.unlink(output).catch(() => {});
  }
}

function execFileAsync(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        error.message = stderr || error.message;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function deleteMessage(chatId, messageId, { everyone = true } = {}) {
  requireReady();
  const chat = await client.getChatById(chatId);
  const messages = await chat.fetchMessages({ limit: 80 });
  const message = messages.find((item) => item.id?._serialized === messageId);
  if (!message) {
    const error = new Error('Mensagem nao encontrada entre as mensagens recentes.');
    error.status = 404;
    throw error;
  }
  await message.delete(Boolean(everyone));
}

async function editMessage(chatId, messageId, body) {
  requireReady();
  const chat = await client.getChatById(chatId);
  const messages = await chat.fetchMessages({ limit: 80 });
  const message = messages.find((item) => item.id?._serialized === messageId);
  if (!message) {
    const error = new Error('Mensagem nao encontrada entre as mensagens recentes.');
    error.status = 404;
    throw error;
  }
  if (!message.fromMe || typeof message.edit !== 'function') {
    const error = new Error('Este WhatsApp Web nao permite editar esta mensagem pelo painel.');
    error.status = 409;
    throw error;
  }
  await message.edit(body);
}

async function deleteConversation(chatId) {
  requireReady();
  const chat = await client.getChatById(chatId);
  await chat.delete();
}

async function listGroupParticipants(groupId) {
  requireReady();
  if (!groupId) {
    const error = new Error('Selecione um grupo para carregar os participantes.');
    error.status = 400;
    throw error;
  }

  let chat;
  try {
    chat = await client.getChatById(groupId);
  } catch (error) {
    const chats = await client.getChats();
    chat = chats.find((item) => item.id?._serialized === groupId);
  }

  if (!chat?.isGroup) {
    const error = new Error('Selecione um grupo valido para carregar os participantes.');
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(chat.participants) || !chat.participants.length) {
    try {
      const freshChat = await client.getChatById(chat.id?._serialized || groupId);
      chat = freshChat || chat;
    } catch (error) {
      // Keep the original chat and use the message fallback below.
    }
  }

  const participants = Array.isArray(chat.participants) ? chat.participants : [];
  const mapped = await Promise.all(participants.map(async (participant) => {
    const id = participant.id?._serialized || '';
    if (!id) return null;
    let name = participant.id?.user || contactNumberFromId(id);
    let number = participant.id?.user || contactNumberFromId(id);
    try {
      const contact = await client.getContactById(id);
      name = contact.pushname || contact.name || contact.shortName || name;
      number = contact.number || number;
    } catch (error) {
      // Keep fallback fields.
    }
    return { id, name, number };
  }));

  const byParticipants = mapped
    .filter(Boolean)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  if (byParticipants.length) return byParticipants;

  const messages = await chat.fetchMessages({ limit: 500 });
  const senders = new Map();
  for (const message of messages) {
    const id = message.author || (!message.fromMe ? message.from : null);
    if (!id || senders.has(id)) continue;
    const number = contactNumberFromId(id);
    senders.set(id, { id, name: number, number });
  }

  return [...senders.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

function getState() {
  return {
    status,
    qrCodeDataUrl,
    groups: cachedGroups,
    connectedNumber: connectedNumber(),
    error: lastError
  };
}

function connectedNumber() {
  const wid = client?.info?.wid;
  const number = client?.info?.me?.user || wid?.user || contactNumberFromId(wid?._serialized);
  return number || null;
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

async function sendMessageToTargets({ groupIds = [], contactIds = [] }, message) {
  requireReady();

  const results = [];
  const targets = [
    ...groupIds.map((id) => ({ id, type: 'group' })),
    ...contactIds.map((id) => ({ id, type: 'contact' }))
  ];

  for (const target of targets) {
    try {
      const response = await client.sendMessage(target.id, message);
      results.push({ targetId: target.id, type: target.type, ok: true, messageId: response.id._serialized });
    } catch (error) {
      results.push({ targetId: target.id, type: target.type, ok: false, error: error.message });
    }
  }

  return results;
}

async function getContactStats(contacts = [], groupIds = [], date = null) {
  requireReady();
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))
    ? date
    : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const start = new Date(`${selectedDate}T00:00:00-03:00`).getTime();
  const end = start + 24 * 60 * 60 * 1000;
  const stats = contacts.map((contact) => ({ ...contact, date: selectedDate, firstMessageAt: null, lastMessageAt: null, count: 0 }));
  const byNumber = new Map(stats.map((contact) => [contact.phone, contact]));
  const chats = groupIds.length ? await Promise.all(groupIds.map((id) => client.getChatById(id))) : (await client.getChats()).filter((chat) => chat.isGroup);

  for (const chat of chats) {
    const messages = await chat.fetchMessages({ limit: 300 });
    for (const message of messages) {
      if (message.fromMe) continue;
      const timestamp = message.timestamp * 1000;
      if (timestamp < start || timestamp >= end) continue;
      const number = await getMessageSenderNumber(message);
      const stat = byNumber.get(number);
      if (!stat) continue;
      stat.count += 1;
      stat.firstMessageAt = stat.firstMessageAt ? Math.min(stat.firstMessageAt, timestamp) : timestamp;
      stat.lastMessageAt = stat.lastMessageAt ? Math.max(stat.lastMessageAt, timestamp) : timestamp;
    }
  }

  return stats;
}

async function getWatcherStats(watchers = [], date = null) {
  requireReady();
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))
    ? date
    : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const start = new Date(`${selectedDate}T00:00:00-03:00`).getTime();
  const end = start + 24 * 60 * 60 * 1000;
  const savedStats = await store.listAttendanceStats(watchers, selectedDate);
  const stats = watchers.map((watcher) => ({ ...watcher, date: selectedDate, firstMessageAt: null, lastMessageAt: null, count: 0 }));

  for (const stat of stats) {
    const chat = await client.getChatById(stat.groupId);
    const messages = await chat.fetchMessages({ limit: 2000 });
    let scannedToday = 0;
    const sampleIdentities = [];
    for (const message of messages) {
      if (message.fromMe) continue;
      const timestamp = message.timestamp * 1000;
      if (timestamp < start || timestamp >= end) continue;
      scannedToday += 1;
      const number = await getMessageSenderNumber(message);
      const record = {
        chatId: chat.id?._serialized || stat.groupId,
        timestamp,
        identities: [...new Set([...(await messageIdentity(message)), number])]
      };
      if (sampleIdentities.length < 3) sampleIdentities.push(record.identities.slice(0, 8).join('|'));
      if (!watcherMatchesMessage(stat, record)) continue;
      stat.count += 1;
      stat.firstMessageAt = stat.firstMessageAt ? Math.min(stat.firstMessageAt, timestamp) : timestamp;
      stat.lastMessageAt = stat.lastMessageAt ? Math.max(stat.lastMessageAt, timestamp) : timestamp;
    }

    for (const record of recentIncomingMessages) {
      if (record.chatId !== stat.groupId) continue;
      if (record.timestamp < start || record.timestamp >= end) continue;
      if (!watcherMatchesMessage(stat, record)) continue;
      stat.count += 1;
      stat.firstMessageAt = stat.firstMessageAt ? Math.min(stat.firstMessageAt, record.timestamp) : record.timestamp;
      stat.lastMessageAt = stat.lastMessageAt ? Math.max(stat.lastMessageAt, record.timestamp) : record.timestamp;
    }

    if (!stat.count) {
      debugLog('Estatistica sem correspondencia', JSON.stringify({
        watcher: stat.contactName,
        phone: stat.contactPhone,
        participantId: stat.participantId,
        groupName: stat.groupName,
        scannedToday,
        recentCache: recentIncomingMessages.filter((record) => record.chatId === stat.groupId && record.timestamp >= start && record.timestamp < end).length,
        sampleIdentities
      }));
    }
  }

  return mergeAttendanceStats(stats, savedStats);
}

function mergeAttendanceStats(liveStats = [], savedStats = []) {
  const savedByWatcher = new Map(savedStats.map((item) => [item.watcherId || item.id, item]));
  return liveStats.map((stat) => {
    const saved = savedByWatcher.get(stat.id);
    if (!saved) return stat;
    const firstValues = [stat.firstMessageAt, saved.firstMessageAt].filter(Boolean);
    const lastValues = [stat.lastMessageAt, saved.lastMessageAt].filter(Boolean);
    return {
      ...stat,
      ...saved,
      firstMessageAt: firstValues.length ? Math.min(...firstValues) : null,
      lastMessageAt: lastValues.length ? Math.max(...lastValues) : null,
      count: Math.max(Number(stat.count || 0), Number(saved.count || 0))
    };
  });
}

async function disconnectWhatsApp({ clearSession = false } = {}) {
  debugLog('Solicitado reinicio/desconexao WhatsApp', `clearSession=${clearSession}`);
  manualDisconnectUntil = Date.now() + 15000;
  reconnectAttempts = 0;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  const currentClient = client;
  client = null;
  cachedGroups = [];
  qrCodeDataUrl = null;
  status = 'disconnected';
  lastError = null;
  isInitializing = false;

  if (currentClient) {
    if (clearSession) {
      try {
        await currentClient.logout();
      } catch (error) {
        console.warn('Não consegui fazer logout pelo WhatsApp:', error.message);
      }
    }

    await closeClientBrowser(currentClient);

    try {
      await currentClient.destroy();
    } catch (error) {
      console.warn('Não consegui destruir o cliente WhatsApp:', error.message);
    }
  }

  cleanupChromiumLocks();
  await delay(700);
  if (clearSession) await removeAuthArtifacts();

  emitState();
  manualDisconnectUntil = 0;
  startClient();
}

async function shutdownWhatsApp() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  manualDisconnectUntil = Number.POSITIVE_INFINITY;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }

  const currentClient = client;
  client = null;
  status = 'disconnected';
  qrCodeDataUrl = null;

  if (currentClient) {
    try {
      await withTimeout(currentClient.destroy(), 8000, 'Tempo esgotado ao encerrar o cliente WhatsApp.');
    } catch (error) {
      debugLog('Encerramento normal do WhatsApp falhou', error.message);
    }
    await closeClientBrowser(currentClient);
  }

  cleanupChromiumLocks();
  debugLog('Cliente WhatsApp encerrado para desligamento do processo.');
}

module.exports = {
  disconnectWhatsApp,
  deleteConversation,
  deleteMessage,
  editMessage,
  getContactStats,
  getWatcherStats,
  getState,
  initWhatsApp,
  listConversations,
  listGroupParticipants,
  listMessages,
  refreshGroups,
  sendMessage,
  sendMessageWithMedia,
  sendMessageToTargets,
  sendMessageToGroups,
  shutdownWhatsApp
};
