const app = document.querySelector('#app');

function readSessionJson(key, fallback) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

const dayLabels = {
  sun: 'Domingo',
  mon: 'Segunda',
  tue: 'Terça',
  wed: 'Quarta',
  thu: 'Quinta',
  fri: 'Sexta',
  sat: 'Sábado'
};

let state = {
  user: null,
  hasUsers: true,
  tab: 'schedules',
  theme: localStorage.getItem('theme') || 'dark',
  whatsapp: { status: 'disconnected', groups: [], qrCodeDataUrl: null, error: null },
  schedules: [],
  contacts: [],
  watchers: [],
  conversations: [],
  selectedConversationId: null,
  messages: [],
  replyBotName: localStorage.getItem('replyBotName') || '',
  replyDrafts: readSessionJson('replyDrafts', {}),
  shouldScrollMessages: false,
  unreadSnapshot: {},
  clearedUnread: {},
  readUnreadCounts: JSON.parse(localStorage.getItem('readUnreadCounts') || '{}'),
  conversationFilter: 'all',
  conversationListScroll: 0,
  pendingConversationAlerts: 0,
  pinnedConversations: JSON.parse(localStorage.getItem('pinnedConversations') || '[]'),
  stats: [],
  users: [],
  logs: [],
  editingId: null,
  scheduleDraft: null,
  scheduleFilterType: 'all',
  scheduleFilterId: '',
  scheduleFilterDay: 'all',
  scheduleFilterDate: '',
  scheduleGroupSearch: '',
  scheduleContactSearch: '',
  editingContactId: null,
  contactSearch: '',
  contactTagFilter: 'all',
  contactOrder: 'name',
  statsWatcherIds: [],
  statsDate: new Date().toLocaleDateString('en-CA'),
  statsPeriod: 'daily',
  statsCustomStart: new Date().toLocaleDateString('en-CA'),
  statsCustomEnd: new Date().toLocaleDateString('en-CA'),
  statsGroupId: '',
  statsParticipants: [],
  actionMessage: null,
  selectedDates: [],
  selectedDatesScheduleId: null
};

const changelog = [
  {
    version: '1.1',
    title: 'Expansão operacional e estabilidade',
    items: [
      'Novo menu Changelog para acompanhar as alterações entre as versões diretamente no painel.',
      'Envio de agendamentos expandido para contatos individuais, além dos grupos do WhatsApp.',
      'Separação visual nos agendamentos entre grupos e contatos cadastrados, facilitando conferir para quem cada mensagem será enviada.',
      'Filtro de agendamentos por grupo ou contato específico.',
      'Campo de nome do bot/supervisor opcional, permitindo enviar mensagens com ou sem assinatura.',
      'Cadastro de contatos com nome, telefone, observações e múltiplas tags separadas por vírgula.',
      'Lista de contatos redesenhada com busca, filtros por tags, ordenação, avatares e ações rápidas para conversar, editar ou apagar.',
      'Possibilidade de editar contatos já cadastrados.',
      'Menu Conversas criado para visualizar, iniciar e responder conversas pelo painel.',
      'Conversas separadas por filtros de todos, grupos, contatos e não lidas.',
      'Lista lateral de conversas redesenhada para ficar mais próxima do WhatsApp, com foto/avatar, nome, tipo e prévia da última mensagem.',
      'Conversas com atualização automática enquanto a aba está aberta, reduzindo a necessidade de clicar em Atualizar.',
      'Indicadores de mensagens não lidas no menu lateral e na lista de conversas.',
      'Correções no comportamento de mensagens não lidas para evitar que o alerta volte depois da conversa ser aberta.',
      'Melhoria no carregamento das conversas para evitar pulos de rolagem e travamentos durante a atualização automática.',
      'Otimização do carregamento de conversas pesadas, baixando mídia completa apenas das mensagens mais recentes.',
      'Abertura de conversa ajustada para ir para a última mensagem sem cortar o layout.',
      'Lista lateral de conversas com limite de altura e textos longos tratados para não quebrar a tela.',
      'Suporte a links clicáveis e formatação básica do WhatsApp, como negrito, itálico e texto riscado.',
      'Envio de anexos e emojis pela aba Conversas.',
      'Visualização ampliada de imagens recebidas, com opção de baixar e fechar o preview.',
      'Reprodução de áudios recebidos diretamente no painel.',
      'Gravação de áudios pelo painel com timer e visualizador de volume durante a captura.',
      'Conversão automática dos áudios gravados para OGG/Opus antes do envio, melhorando a reprodução no WhatsApp.',
      'Exibição de tiques de status nas mensagens enviadas: pendente, enviada, entregue, visualizada e falha.',
      'Opção de apagar mensagens com escolha entre apagar para si ou apagar para todos, quando permitido pelo WhatsApp Web.',
      'Opção de apagar conversas pelo painel.',
      'Possibilidade de fixar conversas para aparecerem primeiro.',
      'Cabeçalho de conversa adicionado, parecido com o WhatsApp Web, exibindo nome e tipo da conversa.',
      'Notificações de novas mensagens redesenhadas com visual mais moderno e prévia do remetente/conteúdo.',
      'Notificações agora tentam usar o nome e a foto de perfil do remetente quando o WhatsApp disponibiliza esses dados.',
      'Estatísticas de primeira e última mensagem por participante observado em grupo específico.',
      'Cadastro de observações estatísticas escolhendo grupo e participante específico.',
      'Filtro de estatísticas por data.',
      'Persistência das estatísticas registradas para consulta mesmo quando o WhatsApp estiver desconectado.',
      'Exportação de relatórios de estatísticas em Excel e PDF.',
      'Períodos de exportação diário, semanal, quinzenal, mensal e personalizado.',
      'Carregamento de participantes de grupos corrigido e com fallback para histórico recente quando necessário.',
      'Melhorias na estabilidade da conexão WhatsApp, incluindo recuperação de sessões travadas do Chromium.',
      'Correções para reduzir o erro de navegador já em execução na pasta de sessão do WhatsApp.',
      'Reiniciar conexão agora preserva a sessão salva do WhatsApp e evita logout desnecessário.',
      'Fallback automático para outro Chrome/Edge instalado quando o Chromium baixado pelo Puppeteer for bloqueado pelo sistema.',
      'Botões para desconectar, reiniciar conexão e gerar novo QR Code.',
      'Exibição do número conectado pelo QR Code na aba WhatsApp.',
      'Status de WhatsApp aprimorado, diferenciando desconectado, aguardando QR Code, sincronizando e conectado.',
      'Tema visual futurista aplicado ao painel, com modo dark e light.',
      'Ajustes de contraste no tema light.',
      'Relógio em tempo real no topo do painel.',
      'Exibição do usuário logado no canto superior direito.',
      'Menu de conta com avatar, alteração de dados, troca de senha e sair.',
      'Tela de login com logo, versão do aplicativo e identidade visual do SuperVISOR.',
      'Administração de usuários aprimorada para o usuário principal alterar senha e apagar usuários criados.',
      'Remoção da recuperação pública de senha para reduzir risco em ambiente online.',
      'Correções de acentuação, textos e traduções em telas como Histórico e status de envio.',
      'Histórico com botão de atualizar manualmente e status de falha destacado em vermelho.',
      'Busca de grupos e contatos nos agendamentos corrigida para filtrar as opções em tempo real enquanto o texto é digitado.',
      'Cards de agendamento refinados, com mensagem, metadados e botões mais espaçados e organizados.',
      'Carregamento inicial de mensagens otimizado para abrir conversas mais rapidamente.',
      'Diversos ajustes de layout, espaçamento, responsividade e desempenho ao trocar de abas.'
    ]
  },
  {
    version: '1.0',
    title: 'Lançamento inicial',
    items: [
      'Login administrativo e criação do usuário principal.',
      'Conexão com WhatsApp via QR Code.',
      'Agendamento de mensagens para grupos.',
      'Histórico de envios, tema claro/escuro e gerenciamento de administradores.'
    ]
  }
];

let renderQueued = false;
let conversationPollTimer = null;
let audioRecorder = null;
let audioRecorderChunks = [];
let audioRecorderStream = null;
let audioRecordingStartedAt = 0;
let audioRecordingTimer = null;
let audioRecordingContext = null;
let audioRecordingAnimation = null;
let conversationRequestId = 0;
let lastReplyInputAt = 0;
let replyCompositionActive = false;
let replyResizeFrame = null;
let replyDraftPersistTimer = null;

const socket = io();
socket.on('whatsapp:state', (payload) => {
  if (JSON.stringify(state.whatsapp) === JSON.stringify(payload)) return;
  state.whatsapp = payload;
  updateLiveStatus();
  if (state.tab === 'whatsapp' || state.tab === 'schedules') renderContentQueued();
});

socket.on('whatsapp:message', async (message) => {
  if (!state.user) return;
  const chatId = message.fromMe ? message.to : message.from;
  const preview = message.body || mediaPreviewLabel(message);
  const senderName = message.senderName || conversationName(chatId) || cleanWhatsAppId(message.from) || 'WhatsApp';
  const title = message.chatName && message.chatName !== senderName ? `${senderName} | ${message.chatName}` : senderName;
  const icon = senderName.trim().charAt(0).toUpperCase() || 'S';
  const notification = { title, body: preview, icon, avatarUrl: message.senderAvatarUrl };
  state.pendingConversationAlerts += state.tab === 'conversations' && state.selectedConversationId === chatId ? 0 : 1;
  if (state.tab === 'conversations') {
    const wasNearBottom = isMessagesNearBottom();
    await refreshConversations({ silent: true, preserveScroll: true, preserveDraft: true });
    if (state.selectedConversationId === chatId && !isReplyEditingActive()) {
      await openConversation(chatId, { scrollToBottom: wasNearBottom, preserveDraft: true });
    } else {
      toast(notification);
    }
  } else {
    updateNav();
    toast(notification);
  }
  if (state.tab === 'stats' && state.watchers.length) refreshStats({ silent: true });
});

socket.on('whatsapp:messageAck', (payload) => {
  updateMessageAck(payload.id, payload.ack);
});

setInterval(updateLiveClock, 1000);

function renderContentQueued() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderContent();
  });
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
}

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
  } catch (error) {
    throw new Error('Servidor local indisponível. Verifique se o terminal do app continua aberto.');
  }

  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (error) {
    data = { error: raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() };
  }
  if (!response.ok) throw new Error(data.error || `Erro ${response.status}: ${response.statusText || 'requisição falhou'}`);
  return data;
}

function toast(message) {
  const existing = [...document.querySelectorAll('.toast')];
  const element = document.createElement('div');
  element.className = 'toast';
  const title = typeof message === 'object' ? message.title : 'SuperVISOR';
  const body = typeof message === 'object' ? message.body : message;
  const icon = typeof message === 'object' && message.icon ? message.icon : 'S';
  const avatarUrl = typeof message === 'object' && message.avatarUrl ? message.avatarUrl : '';
  element.innerHTML = `
    <div class="toast-art">
      ${avatarUrl
        ? `<img class="toast-icon toast-avatar" src="${escapeHtml(avatarUrl)}" alt="">`
        : `<div class="toast-icon">${escapeHtml(icon)}</div>`}
    </div>
    <div class="toast-copy">
      <small>Nova mensagem</small>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(body)}</span>
    </div>
  `;
  element.style.setProperty('--toast-offset', `${18 + existing.length * 92}px`);
  document.body.appendChild(element);
  setTimeout(() => element.remove(), 5200);
}

function showChangelog() {
  const existing = document.querySelector('.modal-backdrop');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <section class="modal-panel">
      <div class="item-head">
        <div>
          <h2>Changelog</h2>
          <p class="muted">Mudanças por versão do SuperVISOR.</p>
        </div>
        <button class="secondary" id="closeChangelog" type="button">Fechar</button>
      </div>
      <div class="changelog-list">
        ${changelog.map((release) => `
          <article class="item">
            <div class="item-head">
              <p class="item-title">Versão ${release.version}</p>
              <span class="status">${escapeHtml(release.title)}</span>
            </div>
            <ul>
              ${release.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </article>
        `).join('')}
      </div>
    </section>
  `;
  document.body.appendChild(modal);
  document.querySelector('#closeChangelog').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (event) => {
    if (event.target === modal) modal.remove();
  });
}

async function bootstrap() {
  const data = await api('/api/bootstrap');
  state.hasUsers = data.hasUsers;
  state.user = data.user;
  if (state.user) await loadDashboardData();
  render();
}

async function loadDashboardData() {
  const [whatsapp, schedules, contacts, watchers, users, logs] = await Promise.all([
    api('/api/whatsapp'),
    api('/api/schedules'),
    api('/api/contacts'),
    api('/api/watchers'),
    api('/api/users'),
    api('/api/logs')
  ]);
  state.whatsapp = whatsapp;
  state.schedules = schedules.schedules;
  state.contacts = contacts.contacts;
  state.watchers = watchers.watchers;
  state.users = users.users;
  state.logs = logs.logs;
}

function render() {
  applyTheme();
  if (!state.user) {
    stopConversationPolling();
    renderAuth();
    return;
  }

  if (!document.querySelector('.app-shell')) {
    renderShell();
  }
  ensureConversationPolling();
  renderContent();
}

function logoMarkup(size = 'default') {
  return `
    <div class="app-logo ${size === 'large' ? 'app-logo-large' : ''}">
      <span>Super</span><strong>VISOR</strong>
    </div>
  `;
}

function renderAuth() {
  const isSetup = !state.hasUsers;
  app.innerHTML = `
    <section class="auth-shell">
      <button class="changelog-button" id="changelogButton" type="button">v1.1</button>
      <div class="auth-brand">
        <div class="logo-mark">✓</div>
        ${logoMarkup('large')}
        <span>versão 1.1</span>
      </div>
      <form class="auth-panel form" id="authForm">
        <div>
          <h1>${isSetup ? 'Criar administrador' : 'Entrar na sua conta'}</h1>
          <p class="muted">${isSetup ? 'Configure o primeiro acesso do painel.' : 'Acesse o dashboard do SuperVISOR'}</p>
        </div>
        ${isSetup ? '<label>Nome<input name="name" required minlength="2" autocomplete="name"></label>' : ''}
        <label>E-mail<input name="email" type="text" inputmode="email" required autocomplete="email" placeholder="seu@email.com"></label>
        <label>Senha<input name="password" type="password" required minlength="6" autocomplete="${isSetup ? 'new-password' : 'current-password'}" placeholder="********"></label>
        <button class="primary" type="submit">${isSetup ? 'Criar e entrar' : 'Entrar'}</button>
      </form>
    </section>
  `;

  document.querySelector('#changelogButton')?.addEventListener('click', showChangelog);
  document.querySelector('#authForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const endpoint = isSetup ? '/api/setup' : '/api/login';
      const data = await api(endpoint, { method: 'POST', body: JSON.stringify(body) });
      state.user = data.user;
      await loadDashboardData();
      render();
    } catch (error) {
      toast(error.message);
    }
  });
}

function renderShell() {
  app.innerHTML = `
    <section class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          ${logoMarkup()}
          <span>Gestor de Equipes</span>
        </div>
        <div class="theme-switch" aria-label="Alternar tema">
          <button class="${state.theme === 'dark' ? 'active' : ''}" data-theme="dark" type="button">dark</button>
          <button class="${state.theme === 'light' ? 'active' : ''}" data-theme="light" type="button">light</button>
        </div>
        <nav class="nav">
          ${navButton('schedules', 'Agendamentos')}
          ${navButton('whatsapp', 'WhatsApp')}
          ${navButton('contacts', 'Contatos')}
          ${navButton('conversations', 'Conversas')}
          ${navButton('stats', 'Estatísticas')}
          ${navButton('users', 'Administradores')}
          ${navButton('logs', 'Histórico')}
        </nav>
      </aside>
      <section class="main">
        <div class="live-strip">
          <span class="live-dot">AO VIVO</span>
          <span id="liveClock"></span>
          <span id="liveStatus" class="${statusClass()}">${whatsappStatusText()}</span>
          <div class="header-actions">
            <button class="link-button" id="changelogButton" type="button">Changelog v1.1</button>
            <div class="account">
              <button class="account-button" id="accountButton" type="button">
                ${avatarMarkup(state.user)}
                <span>${escapeHtml(state.user.name)}</span>
              </button>
              <div class="account-menu" id="accountMenu" hidden>
                <form class="form account-form" id="accountForm">
                  <label>Avatar<input name="avatar" type="file" accept="image/*"></label>
                  <label>Nome<input name="name" value="${escapeHtml(state.user.name)}" required></label>
                  <label>E-mail<input name="email" type="email" value="${escapeHtml(state.user.email)}" required></label>
                  <label>Nova senha<input name="password" type="password" minlength="6" placeholder="Deixe vazio para manter"></label>
                  <button class="primary" type="submit">Salvar conta</button>
                </form>
                <button class="danger full-button" id="logoutButton" type="button">Sair</button>
              </div>
            </div>
          </div>
        </div>
        <div id="mainContent"></div>
      </section>
    </section>
  `;

  bindShell();
  updateLiveClock();
}

function renderContent() {
  const target = document.querySelector('#mainContent');
  if (!target) return;
  if (state.tab !== 'conversations') replyCompositionActive = false;
  updateNav();
  updateLiveStatus();
  target.innerHTML = currentTab();
  bindContent();
  if (state.shouldScrollMessages) {
    state.shouldScrollMessages = false;
    requestAnimationFrame(scrollMessagesToBottom);
  }
  if (state.tab === 'conversations') {
    requestAnimationFrame(restoreConversationScroll);
    requestAnimationFrame(toggleScrollBottomButton);
  }
}

function scrollMessagesToBottom() {
  const messages = document.querySelector('.messages');
  if (messages) messages.scrollTop = messages.scrollHeight;
  toggleScrollBottomButton();
}

function isMessagesNearBottom() {
  const messages = document.querySelector('.messages');
  if (!messages) return true;
  return messages.scrollHeight - messages.scrollTop - messages.clientHeight < 120;
}

function toggleScrollBottomButton() {
  const button = document.querySelector('#scrollMessagesBottom');
  if (!button) return;
  button.classList.toggle('is-visible', !isMessagesNearBottom());
}

function restoreConversationScroll() {
  const list = document.querySelector('.chat-list');
  if (list) list.scrollTop = state.conversationListScroll;
}

function replyDraftKey(conversationId = state.selectedConversationId) {
  return String(conversationId || '');
}

function persistReplyDrafts() {
  clearTimeout(replyDraftPersistTimer);
  replyDraftPersistTimer = setTimeout(() => {
    try {
      sessionStorage.setItem('replyDrafts', JSON.stringify(state.replyDrafts));
    } catch {
      // The in-memory draft still protects typing when storage is unavailable.
    }
  }, 120);
}

function storedReplyDraft(conversationId = state.selectedConversationId) {
  const key = replyDraftKey(conversationId);
  return key ? state.replyDrafts[key] || null : null;
}

function saveReplyDraftFromInput(messageInput, { restoreFocus = false } = {}) {
  const conversationId = messageInput?.dataset.conversationId || state.selectedConversationId;
  const key = replyDraftKey(conversationId);
  if (!key || !messageInput) return null;

  const form = messageInput.form;
  const draft = {
    conversationId,
    message: messageInput.value,
    replyBotName: form?.elements.replyBotName?.value || state.replyBotName,
    selectionStart: messageInput.selectionStart,
    selectionEnd: messageInput.selectionEnd,
    wasFocused: restoreFocus || document.activeElement === messageInput
  };
  state.replyDrafts[key] = draft;
  persistReplyDrafts();

  // An update may replace the composer between keydown and input. Mirror the
  // completed keystroke into the newly mounted textarea instead of losing it.
  const mountedInput = state.selectedConversationId === conversationId
    ? document.querySelector('#replyForm textarea[name="message"]')
    : null;
  if (mountedInput && mountedInput !== messageInput && mountedInput.value !== draft.message) {
    mountedInput.value = draft.message;
    if (Number.isInteger(draft.selectionStart) && Number.isInteger(draft.selectionEnd)) {
      mountedInput.setSelectionRange(draft.selectionStart, draft.selectionEnd);
    }
    if (draft.wasFocused) mountedInput.focus({ preventScroll: true });
    autoResizeReplyTextarea(mountedInput);
  }
  return draft;
}

function clearReplyDraft(conversationId = state.selectedConversationId) {
  const key = replyDraftKey(conversationId);
  if (!key) return;
  delete state.replyDrafts[key];
  persistReplyDrafts();
}

function captureReplyDraft() {
  const form = document.querySelector('#replyForm');
  if (!form) return storedReplyDraft();
  const messageInput = form.elements.message;
  return saveReplyDraftFromInput(messageInput);
}

function restoreReplyDraft(draft) {
  if (!draft || draft.conversationId !== state.selectedConversationId) return;
  const form = document.querySelector('#replyForm');
  if (!form) return;
  if (form.elements.message) {
    form.elements.message.value = draft.message;
    if (Number.isInteger(draft.selectionStart) && Number.isInteger(draft.selectionEnd)) {
      form.elements.message.setSelectionRange(draft.selectionStart, draft.selectionEnd);
    }
    if (draft.wasFocused) form.elements.message.focus({ preventScroll: true });
  }
  if (form.elements.replyBotName) form.elements.replyBotName.value = draft.replyBotName;
  autoResizeReplyTextarea(form.elements.message);
}

function autoResizeReplyTextarea(textarea = document.querySelector('#replyForm textarea[name="message"]')) {
  if (!textarea) return;
  cancelAnimationFrame(replyResizeFrame);
  replyResizeFrame = requestAnimationFrame(() => {
    if (!textarea.isConnected) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 42), 160)}px`;
  });
}

function isReplyEditingActive() {
  const textarea = document.querySelector('#replyForm textarea[name="message"]');
  if (!textarea) return false;
  const recentlyTyped = Date.now() - lastReplyInputAt < 2500;
  const hasAttachment = Boolean(document.querySelector('#replyAttachment')?.files?.length);
  return replyCompositionActive
    || document.activeElement === textarea
    || Boolean(textarea.value)
    || hasAttachment
    || recentlyTyped;
}

function renderConversationMessagesOnly({ scrollToBottom = false } = {}) {
  const currentMessages = document.querySelector('.messages');
  if (!currentMessages || !state.selectedConversationId) return false;

  const previousTop = currentMessages.scrollTop;
  const previousHeight = currentMessages.scrollHeight;
  const template = document.createElement('template');
  template.innerHTML = conversationMessages().trim();
  const nextMessages = template.content.querySelector('.messages');
  if (!nextMessages) return false;

  currentMessages.replaceChildren(...nextMessages.childNodes);
  bindMessageContentActions();

  requestAnimationFrame(() => {
    if (scrollToBottom) {
      scrollMessagesToBottom();
      return;
    }
    currentMessages.scrollTop = previousTop + Math.max(0, currentMessages.scrollHeight - previousHeight);
    toggleScrollBottomButton();
  });
  return true;
}

function ensureConversationPolling() {
  if (conversationPollTimer || !state.user) return;
  conversationPollTimer = setInterval(pollConversations, 7000);
}

function stopConversationPolling() {
  if (!conversationPollTimer) return;
  clearInterval(conversationPollTimer);
  conversationPollTimer = null;
}

async function pollConversations() {
  if (!state.user || state.tab !== 'conversations') return;
  const selectedId = state.selectedConversationId;
  const selectedBefore = state.conversations.find((conversation) => conversation.id === selectedId);
  const previousTimestamp = Number(selectedBefore?.timestamp || 0);
  const shouldStickToBottom = isMessagesNearBottom();
  await refreshConversations({ silent: true, preserveScroll: true, preserveDraft: true });
  const selectedAfter = state.conversations.find((conversation) => conversation.id === selectedId);
  const nextTimestamp = Number(selectedAfter?.timestamp || 0);
  if (selectedId && state.selectedConversationId === selectedId && nextTimestamp > previousTimestamp && !isReplyEditingActive()) {
    await openConversation(selectedId, { scrollToBottom: shouldStickToBottom, preserveDraft: true });
  }
}

function navButton(tab, label) {
  const badge = tab === 'conversations' && state.pendingConversationAlerts
    ? `<span class="nav-badge">${state.pendingConversationAlerts}</span>`
    : '';
  return `<button class="${state.tab === tab ? 'active' : ''}" data-tab="${tab}"><span>${label}</span>${badge}</button>`;
}

function updateNav() {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === state.tab);
    const existingBadge = button.querySelector('.nav-badge');
    if (existingBadge) existingBadge.remove();
    if (button.dataset.tab === 'conversations' && state.pendingConversationAlerts > 0) {
      button.insertAdjacentHTML('beforeend', `<span class="nav-badge">${state.pendingConversationAlerts}</span>`);
      button.classList.add('has-alerts');
    } else {
      button.classList.remove('has-alerts');
    }
  });
}

function avatarMarkup(user) {
  if (user?.avatar) {
    return `<img class="avatar" src="${escapeHtml(user.avatar)}" alt="Avatar">`;
  }
  const initial = (user?.name || user?.email || 'S').trim().charAt(0).toUpperCase();
  return `<span class="avatar avatar-fallback">${escapeHtml(initial)}</span>`;
}

function bindShell() {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      if (state.tab === button.dataset.tab) return;
      state.tab = button.dataset.tab;
      state.editingId = null;
      if (state.tab === 'conversations') {
        state.pendingConversationAlerts = 0;
        renderContentQueued();
        setTimeout(() => refreshConversations({ silent: true, preserveScroll: true, preserveDraft: true }), 0);
        return;
      }
      renderContentQueued();
    });
  });

  document.querySelectorAll('[data-theme]').forEach((button) => {
    button.addEventListener('click', () => {
      state.theme = button.dataset.theme;
      localStorage.setItem('theme', state.theme);
      applyTheme();
      document.querySelectorAll('[data-theme]').forEach((item) => {
        item.classList.toggle('active', item.dataset.theme === state.theme);
      });
    });
  });

  document.querySelector('#accountButton')?.addEventListener('click', () => {
    const menu = document.querySelector('#accountMenu');
    menu.hidden = !menu.hidden;
  });

  document.querySelector('#changelogButton')?.addEventListener('click', showChangelog);
  document.querySelector('#logoutButton')?.addEventListener('click', async () => {
    await api('/api/logout', { method: 'POST' });
    state.user = null;
    stopConversationPolling();
    app.innerHTML = '';
    render();
  });

  document.querySelector('#accountForm')?.addEventListener('submit', saveAccount);
}

async function saveAccount(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const file = data.get('avatar');
  const body = {
    name: data.get('name'),
    email: data.get('email'),
    password: data.get('password') || ''
  };

  if (file && file.size) {
    body.avatar = await fileToDataUrl(file);
  }

  try {
    const result = await api('/api/me', { method: 'PUT', body: JSON.stringify(body) });
    state.user = result.user;
    document.querySelector('.account-button').innerHTML = `${avatarMarkup(state.user)}<span>${escapeHtml(state.user.name)}</span>`;
    toast('Conta atualizada.');
  } catch (error) {
    toast(error.message);
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function updateLiveClock() {
  const clock = document.querySelector('#liveClock');
  if (clock) clock.textContent = new Date().toLocaleTimeString('pt-BR');
}

function updateLiveStatus() {
  const status = document.querySelector('#liveStatus');
  if (!status) return;
  status.textContent = whatsappStatusText();
  status.className = statusClass();
}

function currentTab() {
  if (state.tab === 'whatsapp') return whatsappTab();
  if (state.tab === 'contacts') return contactsTab();
  if (state.tab === 'conversations') return conversationsTab();
  if (state.tab === 'stats') return statsTab();
  if (state.tab === 'users') return usersTab();
  if (state.tab === 'logs') return logsTab();
  return schedulesTab();
}

function whatsappStatusText() {
  return {
    disconnected: 'Desconectado',
    loading: 'Carregando',
    qr: 'Aguardando leitura do QR Code',
    authenticated: 'Autenticado, aguardando sincronização',
    ready: 'Conectado',
    error: 'Erro'
  }[state.whatsapp.status] || state.whatsapp.status;
}

function statusClass() {
  return `status ${state.whatsapp.status === 'disconnected' || state.whatsapp.status === 'error' ? 'status-danger' : ''}`;
}

function whatsappIsReady() {
  return state.whatsapp.status === 'ready';
}

function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+55 ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12 && digits.startsWith('55')) {
    return `+55 ${digits.slice(2, 4)} ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return value || 'Não identificado';
}

function whatsappTab() {
  const statusText = whatsappStatusText();
  return `
    <div class="topbar">
      <div>
        <h1>WhatsApp</h1>
        <p class="muted">Conecte o número do bot e atualize a lista de grupos.</p>
      </div>
      <span class="${statusClass()}">${statusText}</span>
    </div>
    <div class="grid">
      <section class="panel">
        <h2>QR Code</h2>
        ${state.whatsapp.connectedNumber ? `<div class="connected-number-card"><span class="connected-dot"></span><div><small>Número conectado</small><strong>${escapeHtml(formatPhone(state.whatsapp.connectedNumber))}</strong></div></div>` : ''}
        ${state.whatsapp.error ? `<p class="muted"><strong>Erro técnico:</strong> ${escapeHtml(state.whatsapp.error)}</p>` : ''}
        ${state.whatsapp.status === 'authenticated' ? '<p class="muted"><strong>Aguardando:</strong> o QR Code foi aceito, mas o WhatsApp Web ainda está sincronizando. Os grupos só aparecem quando mudar para Conectado.</p>' : ''}
        <div class="qr">
          ${
            state.whatsapp.qrCodeDataUrl
              ? `<img src="${state.whatsapp.qrCodeDataUrl}" alt="QR Code do WhatsApp">`
              : `<p class="muted">${state.whatsapp.status === 'ready' ? 'WhatsApp conectado neste computador.' : 'Quando o WhatsApp pedir autenticação, o QR Code aparece aqui.'}</p>`
          }
        </div>
        <div class="row" style="margin-top:14px">
          <button class="danger" id="disconnectWhatsApp" ${state.whatsapp.status === 'disconnected' ? 'disabled' : ''}>Desconectar</button>
          <button class="secondary" id="restartWhatsApp">Reiniciar conexão</button>
          <button class="secondary" id="newQrWhatsApp">Gerar novo QR</button>
        </div>
      </section>
      <section class="panel whatsapp-groups-panel">
        <div class="row panel-head whatsapp-groups-head">
          <h2 style="margin-right:auto">Grupos</h2>
          <button class="secondary refresh-groups-button" id="refreshGroups" ${whatsappIsReady() ? '' : 'disabled'}>Atualizar</button>
        </div>
        ${state.actionMessage ? `<p class="muted">${escapeHtml(state.actionMessage)}</p>` : ''}
        ${groupsList(false)}
      </section>
    </div>
  `;
}

function schedulesTab() {
  const editing = state.schedules.find((item) => item.id === state.editingId);
  const draft = state.scheduleDraft;
  const formSource = editing || draft;
  const schedules = filteredSchedules();
  const dateScope = editing?.id || 'new';
  if (state.selectedDatesScheduleId !== dateScope) {
    state.selectedDates = [...(formSource?.specificDates || [])];
    state.selectedDatesScheduleId = dateScope;
  }
  const selectedDates = getSelectedDates(formSource);
  return `
    <div class="topbar">
      <div>
        <h1>Agendamentos</h1>
        <p class="muted">Crie mensagens recorrentes para grupos específicos.</p>
      </div>
      <span class="${statusClass()}">${whatsappStatusText()}</span>
    </div>
    <div class="grid">
      <section class="panel">
        <h2>${editing ? 'Editar mensagem' : 'Nova mensagem'}</h2>
        <form class="form" id="scheduleForm">
          <label>Título<input name="title" required minlength="2" value="${escapeHtml(formSource?.title || '')}"></label>
          <label>Nome do bot<input name="botName" minlength="2" placeholder="SuperVISOR" value="${escapeHtml(formSource?.botName || '')}"></label>
          <label>Mensagem<textarea name="message" required>${escapeHtml(formSource?.message || '')}</textarea></label>
          <div class="split">
            <label>Horário<input name="time" type="time" required value="${formSource?.time || '08:00'}"></label>
            <label>Status
              <select name="active">
                <option value="true" ${formSource?.active !== false ? 'selected' : ''}>Ativo</option>
                <option value="false" ${formSource?.active === false ? 'selected' : ''}>Pausado</option>
              </select>
            </label>
          </div>
          <label>Tipo de agendamento
            <select name="scheduleMode">
              <option value="weekly" ${(formSource?.scheduleMode || 'weekly') === 'weekly' ? 'selected' : ''}>Dias da semana</option>
              <option value="dates" ${formSource?.scheduleMode === 'dates' ? 'selected' : ''}>Datas específicas</option>
            </select>
          </label>
          <label>Dias da semana</label>
          <div class="days">${Object.entries(dayLabels).map(([key, label]) => dayCheckbox(key, label, formSource)).join('')}</div>
          <label>Datas específicas</label>
          <div class="date-picker-row">
            <input id="specificDatePicker" type="date">
            <button class="secondary" id="addSpecificDate" type="button">Adicionar</button>
          </div>
          <input type="hidden" name="specificDates" value="${escapeHtml(selectedDates.join(','))}">
          <div class="date-chip-list">
            ${selectedDates.length ? selectedDates.map((date) => `<button class="date-chip" type="button" data-remove-date="${date}">${formatDate(date)} ×</button>`).join('') : '<span class="muted">Nenhuma data selecionada.</span>'}
          </div>
          <label>Grupos</label>
          <label class="search-field schedule-search">
            <span>⌕</span>
            <input id="scheduleGroupSearch" placeholder="Buscar grupo pelo nome" value="${escapeHtml(state.scheduleGroupSearch)}">
          </label>
          ${groupsList(true, formSource)}
          <label>Contatos individuais</label>
          <label class="search-field schedule-search">
            <span>⌕</span>
            <input id="scheduleContactSearch" placeholder="Buscar contato por nome, número ou tag" value="${escapeHtml(state.scheduleContactSearch)}">
          </label>
          ${contactsList(true, formSource)}
          <div class="row">
            <button class="primary" type="submit">${editing ? 'Salvar alterações' : 'Criar agendamento'}</button>
            ${editing || draft ? '<button class="secondary" type="button" id="cancelEdit">Cancelar</button>' : ''}
          </div>
        </form>
      </section>
      <section class="list">
        <section class="panel schedule-filter">
          <div>
            <h2>Agendamentos criados</h2>
            <p class="muted">${schedules.length} de ${state.schedules.length} agendamento(s)</p>
          </div>
          <div class="split">
            <label>Filtrar por
              <select id="scheduleFilterType">
                <option value="all" ${state.scheduleFilterType === 'all' ? 'selected' : ''}>Todos os destinos</option>
                <option value="group" ${state.scheduleFilterType === 'group' ? 'selected' : ''}>Grupo específico</option>
                <option value="contact" ${state.scheduleFilterType === 'contact' ? 'selected' : ''}>Contato específico</option>
              </select>
            </label>
            <label>Destino
              <select id="scheduleFilterId" ${state.scheduleFilterType === 'all' ? 'disabled' : ''}>
                <option value="">${state.scheduleFilterType === 'all' ? 'Todos' : 'Escolha um destino'}</option>
                ${scheduleFilterOptions()}
              </select>
            </label>
          </div>
          <div class="split">
            <label>Dia da semana
              <select id="scheduleFilterDay">
                <option value="all" ${state.scheduleFilterDay === 'all' ? 'selected' : ''}>Todos os dias</option>
                ${Object.entries(dayLabels).map(([key, label]) => `<option value="${key}" ${state.scheduleFilterDay === key ? 'selected' : ''}>${label}</option>`).join('')}
              </select>
            </label>
            <label>Data específica
              <input id="scheduleFilterDate" type="date" value="${escapeHtml(state.scheduleFilterDate)}">
            </label>
          </div>
        </section>
        ${schedules.length ? schedules.map(scheduleItem).join('') : '<div class="empty">Nenhum agendamento encontrado para este filtro.</div>'}
      </section>
    </div>
  `;
}

function scheduleFilterOptions() {
  if (state.scheduleFilterType === 'group') {
    return state.whatsapp.groups.map((group) => `
      <option value="${escapeHtml(group.id)}" ${state.scheduleFilterId === group.id ? 'selected' : ''}>${escapeHtml(group.name)}</option>
    `).join('');
  }

  if (state.scheduleFilterType === 'contact') {
    return state.contacts.map((contact) => `
      <option value="${escapeHtml(contact.whatsappId)}" ${state.scheduleFilterId === contact.whatsappId ? 'selected' : ''}>${escapeHtml(contact.name)} - ${escapeHtml(contact.phone)}</option>
    `).join('');
  }

  return '';
}

function filteredSchedules() {
  return state.schedules.filter((schedule) => {
    const matchesDestination = (
      state.scheduleFilterType === 'all'
      || !state.scheduleFilterId
      || (state.scheduleFilterType === 'group' && (schedule.groupIds || []).includes(state.scheduleFilterId))
      || (state.scheduleFilterType === 'contact' && (schedule.contactIds || []).includes(state.scheduleFilterId))
    );
    const hasDayFilter = state.scheduleFilterDay !== 'all';
    const hasDateFilter = Boolean(state.scheduleFilterDate);
    const matchesDay = hasDayFilter && (
      (schedule.scheduleMode || 'weekly') === 'weekly' && (schedule.days || []).includes(state.scheduleFilterDay)
    );
    const matchesDate = hasDateFilter && (
      schedule.scheduleMode === 'dates' && (schedule.specificDates || []).includes(state.scheduleFilterDate)
    );
    const matchesPeriod = (!hasDayFilter && !hasDateFilter) || matchesDay || matchesDate;
    return matchesDestination && matchesPeriod;
  });
}

function getSelectedDates(editing) {
  return [...new Set(state.selectedDates)].sort();
}

function usersTab() {
  const canManageUsers = Boolean(state.user?.isOwner);
  return `
    <div class="topbar">
      <div>
        <h1>Administradores</h1>
        <p class="muted">Cadastre pessoas autorizadas a programar envios.</p>
      </div>
    </div>
    <div class="grid">
      <section class="panel">
        <h2>Novo administrador</h2>
        <form class="form" id="userForm">
          <label>Nome<input name="name" required minlength="2"></label>
          <label>E-mail<input name="email" type="email" required></label>
          <label>Senha<input name="password" type="password" required minlength="6"></label>
          <button class="primary" type="submit">Criar usuário</button>
        </form>
      </section>
      <section class="list">
        ${state.users.map((user) => userItem(user, canManageUsers)).join('')}
      </section>
    </div>
  `;
}

function contactsTab() {
  const editing = state.contacts.find((contact) => contact.id === state.editingContactId);
  const contacts = filteredContacts();
  const tags = [...new Set(state.contacts.flatMap(contactTags))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  return `
    <div class="topbar">
      <div>
        <h1>Contatos</h1>
        <p class="muted">Cadastre colaboradores para envios individuais e estatísticas.</p>
      </div>
    </div>
    <div class="contacts-layout">
      <section class="panel contact-editor">
        <h2>${editing ? 'Editar contato' : 'Novo contato'}</h2>
        <form class="form" id="contactForm">
          <label>Nome<input name="name" required minlength="2" placeholder="Nome do colaborador" value="${escapeHtml(editing?.name || '')}"></label>
          <label>Tags<input name="tag" placeholder="Ex: comercial, portaria, lideranca" value="${escapeHtml(contactTags(editing || {}).join(', '))}"></label>
          <label>Telefone<input name="phone" required placeholder="5511999999999" value="${escapeHtml(editing?.phone || '')}"></label>
          <label>Observações<textarea name="notes" placeholder="Informações internas">${escapeHtml(editing?.notes || '')}</textarea></label>
          <div class="row">
            <button class="primary" type="submit">${editing ? 'Salvar contato' : 'Cadastrar contato'}</button>
            ${editing ? '<button class="secondary" id="cancelContactEdit" type="button">Cancelar</button>' : ''}
          </div>
        </form>
      </section>
      <section class="panel contact-directory">
        <div class="contact-toolbar">
          <label class="search-field">
            <span>⌕</span>
            <input id="contactSearch" value="${escapeHtml(state.contactSearch)}" placeholder="Buscar">
          </label>
          <select id="contactTagFilter">
            <option value="all">Todas as tags</option>
            ${tags.map((tag) => `<option value="${escapeHtml(tag)}" ${state.contactTagFilter === tag ? 'selected' : ''}>${escapeHtml(tag)}</option>`).join('')}
          </select>
          <select id="contactOrder">
            <option value="name" ${state.contactOrder === 'name' ? 'selected' : ''}>Ordenar por nome</option>
            <option value="tag" ${state.contactOrder === 'tag' ? 'selected' : ''}>Ordenar por tags</option>
            <option value="phone" ${state.contactOrder === 'phone' ? 'selected' : ''}>Ordenar por telefone</option>
          </select>
          <span class="contact-count">${contacts.length} contato(s)</span>
        </div>
        <div class="contact-table-head">
          <span></span>
          <strong>Contato</strong>
          <strong>Tags</strong>
          <strong>Ações</strong>
        </div>
        <div class="contacts-results">
          ${contacts.length ? contacts.map(contactItem).join('') : '<div class="empty">Nenhum contato encontrado.</div>'}
        </div>
      </section>
    </div>
  `;
}

function filteredContacts() {
  const query = state.contactSearch.trim().toLowerCase();
  const filtered = state.contacts.filter((contact) => {
    const tags = contactTags(contact);
    const haystack = `${contact.name} ${contact.phone} ${tags.join(' ')} ${contact.notes}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesTag = state.contactTagFilter === 'all' || tags.includes(state.contactTagFilter);
    return matchesQuery && matchesTag;
  });

  return filtered.sort((a, b) => {
    const key = state.contactOrder || 'name';
    if (key === 'tag') {
      return contactTags(a).join(', ').localeCompare(contactTags(b).join(', '), 'pt-BR');
    }
    return String(a[key] || '').localeCompare(String(b[key] || ''), 'pt-BR');
  });
}

function contactTags(contact) {
  if (!contact) return [];
  if (Array.isArray(contact.tags) && contact.tags.length) {
    return [...new Set(contact.tags.map((tag) => String(tag || '').trim()).filter(Boolean))];
  }
  return [...new Set(String(contact.tag || '').split(',').map((tag) => tag.trim()).filter(Boolean))];
}

function contactItem(contact) {
  const initials = contact.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const tags = contactTags(contact);
  return `
    <article class="contact-row">
      <label class="contact-check"><input type="checkbox" aria-label="Selecionar contato"></label>
      <div class="contact-identity">
        <span class="contact-avatar">${escapeHtml(initials || 'C')}</span>
        <div>
          <p class="item-title">${escapeHtml(contact.name)}</p>
          <p class="muted">${escapeHtml(contact.phone)}</p>
          ${contact.notes ? `<p class="message-preview">${escapeHtml(contact.notes)}</p>` : ''}
        </div>
      </div>
      <div class="contact-tags">${tags.length ? tags.map((tag) => `<span class="contact-tag">${escapeHtml(tag)}</span>`).join('') : '<span class="muted">Sem tag</span>'}</div>
      <div class="contact-actions">
        <button class="icon-button" title="Conversar" data-start-contact-chat="${contact.whatsappId}" type="button">↗</button>
        <button class="icon-button" title="Editar" data-edit-contact="${contact.id}" type="button">✎</button>
        <button class="icon-button danger-icon" title="Apagar" data-delete-contact="${contact.id}" type="button">×</button>
      </div>
    </article>
  `;
}

function conversationsTab() {
  const conversations = visibleConversations();
  return `
    <div class="topbar">
      <div>
        <h1>Conversas</h1>
        <p class="muted">Visualize e responda conversas do WhatsApp conectado.</p>
      </div>
      <button class="secondary" id="refreshConversations" type="button">Atualizar</button>
    </div>
    <section class="panel compose-panel">
      <h2>Iniciar conversa</h2>
      <form class="compose-form" id="startConversationForm">
        <select name="targetId" required>
          <option value="">Escolha um grupo ou contato</option>
          <optgroup label="Grupos">
            ${state.whatsapp.groups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`).join('')}
          </optgroup>
          <optgroup label="Contatos cadastrados">
            ${state.contacts.map((contact) => `<option value="${escapeHtml(contact.whatsappId)}">${escapeHtml(contact.name)} - ${escapeHtml(contact.phone)}</option>`).join('')}
          </optgroup>
        </select>
        <input name="message" placeholder="Mensagem inicial" required>
        <button class="primary" type="submit">Enviar</button>
      </form>
    </section>
    <div class="conversation-filters">
      <button class="${state.conversationFilter === 'all' ? 'active' : ''}" data-conversation-filter="all" type="button">Todos</button>
      <button class="${state.conversationFilter === 'groups' ? 'active' : ''}" data-conversation-filter="groups" type="button">Grupos</button>
      <button class="${state.conversationFilter === 'contacts' ? 'active' : ''}" data-conversation-filter="contacts" type="button">Contatos</button>
      <button class="${state.conversationFilter === 'unread' ? 'active' : ''}" data-conversation-filter="unread" type="button">Não lidas</button>
    </div>
    <section class="chat-shell ${state.selectedConversationId ? 'has-selected-conversation' : ''}">
      <aside class="chat-list">
        ${conversations.length ? conversations.map(conversationItem).join('') : '<div class="empty">Nenhuma conversa neste filtro.</div>'}
      </aside>
      <div class="chat-window">
        ${state.selectedConversationId ? conversationMessages() : '<div class="empty">Selecione uma conversa.</div>'}
      </div>
    </section>
  `;
}

function visibleConversations() {
  return state.conversations.filter((conversation) => {
    if (state.conversationFilter === 'groups') return conversation.isGroup;
    if (state.conversationFilter === 'contacts') return !conversation.isGroup;
    if (state.conversationFilter === 'unread') return conversationUnreadCount(conversation) > 0;
    return true;
  }).sort((a, b) => {
    const aPinned = state.pinnedConversations.includes(a.id) ? 1 : 0;
    const bPinned = state.pinnedConversations.includes(b.id) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    return (b.timestamp || 0) - (a.timestamp || 0);
  });
}

function renderConversationListOnly() {
  const list = document.querySelector('.chat-list');
  if (!list) return false;
  const conversations = visibleConversations();
  list.innerHTML = conversations.length
    ? conversations.map(conversationItem).join('')
    : '<div class="empty">Nenhuma conversa neste filtro.</div>';
  bindConversationListActions();
  restoreConversationScroll();
  updateNav();
  return true;
}

function conversationItem(conversation) {
  const active = conversation.id === state.selectedConversationId ? 'active' : '';
  const unread = conversationUnreadCount(conversation);
  const pinned = state.pinnedConversations.includes(conversation.id);
  const avatar = conversation.avatarUrl
    ? `<img class="chat-avatar" src="${escapeHtml(conversation.avatarUrl)}" alt="">`
    : `<span class="chat-avatar chat-avatar-fallback">${conversation.isGroup ? 'G' : 'C'}</span>`;
  return `
    <button class="chat-row ${active} ${unread ? 'has-unread' : ''}" data-open-conversation="${escapeHtml(conversation.id)}" type="button">
      ${avatar}
      <div class="chat-row-content">
        <div class="chat-row-head">
          <strong>${escapeHtml(conversation.name)}</strong>
          <span class="chat-row-actions">
            ${pinned ? '<span class="pin-badge">Fixado</span>' : ''}
            ${unread ? `<span class="unread-badge">${unread}</span>` : ''}
            <span class="pin-button" data-pin-conversation="${escapeHtml(conversation.id)}">${pinned ? 'Desfixar' : 'Fixar'}</span>
          </span>
        </div>
        <div class="chat-row-meta">
          <span>${conversation.isGroup ? 'Grupo' : 'Contato'}</span>
          <small>${escapeHtml(conversation.lastMessage || '')}</small>
        </div>
      </div>
    </button>
  `;
}

function conversationUnreadCount(conversation) {
  if (!conversation?.id) return 0;
  if (conversation.id === state.selectedConversationId) return 0;
  const current = Number(conversation.unreadCount || 0);
  const acknowledged = Number(state.readUnreadCounts[conversation.id] || 0);
  return Math.max(0, current - acknowledged);
}

function persistReadUnreadCounts() {
  localStorage.setItem('readUnreadCounts', JSON.stringify(state.readUnreadCounts || {}));
}

function selectedConversation() {
  return state.conversations.find((conversation) => conversation.id === state.selectedConversationId);
}

function conversationMessages() {
  const conversation = selectedConversation();
  const replyDraft = storedReplyDraft();
  const avatar = conversation?.avatarUrl
    ? `<img class="conversation-avatar" src="${escapeHtml(conversation.avatarUrl)}" alt="">`
    : `<div class="conversation-avatar">${conversation?.isGroup ? 'G' : 'C'}</div>`;
  return `
    <div class="conversation-header">
      <button class="chat-back-button" id="mobileBackToChats" type="button">←</button>
      ${avatar}
      <div>
        <strong>${escapeHtml(conversation?.name || 'Conversa')}</strong>
        <span>${conversation?.isGroup ? 'Grupo' : 'Contato'}</span>
      </div>
      <button class="danger" id="deleteConversation" type="button">Apagar conversa</button>
    </div>
    <div class="messages">
      ${state.messages.length ? state.messages.map((message) => `
        <div class="bubble ${message.fromMe ? 'mine' : ''}" data-message-id="${escapeHtml(message.id || '')}">
          ${conversation?.isGroup && !message.fromMe ? `<strong class="message-sender">${escapeHtml(message.senderName || cleanWhatsAppId(message.from) || 'Participante')}</strong>` : ''}
          ${messageMediaMarkup(message)}
          <p>${formatWhatsAppText(message.body, message)}</p>
          <span class="message-meta">${new Date(message.timestamp).toLocaleString('pt-BR')}${message.fromMe ? messageAckMarkup(message.ack) : ''}</span>
          ${message.fromMe ? `<div class="message-actions">
            <button class="link-button message-action" data-delete-message="${escapeHtml(message.id)}" type="button">Apagar</button>
          </div>` : ''}
        </div>
      `).join('') : '<div class="empty">Nenhuma mensagem carregada.</div>'}
    </div>
    <button class="scroll-bottom-button" id="scrollMessagesBottom" type="button" title="Ir para as mensagens mais recentes">↓</button>
    <form class="reply-box" id="replyForm">
      <input class="reply-name" name="replyBotName" placeholder="Nome na resposta" value="${escapeHtml(state.replyBotName)}" autocomplete="off">
      <button class="secondary emoji-button" type="button" data-emoji="🙂">🙂</button>
      <button class="secondary emoji-button" type="button" data-emoji="👍">👍</button>
      <button class="secondary emoji-button" type="button" data-emoji="✅">✅</button>
      <input name="attachment" type="file" hidden id="replyAttachment">
      <button class="secondary" id="attachButton" type="button">Anexo</button>
      <button class="secondary" id="recordAudioButton" type="button">Gravar</button>
      <div class="recording-panel" id="recordingPanel" hidden>
        <span id="recordingTimer">00:00</span>
        <div class="recording-bars" id="recordingBars">
          ${Array.from({ length: 18 }, (_, index) => `<i style="--level:${(index % 5) + 2}"></i>`).join('')}
        </div>
      </div>
      <textarea class="reply-message" name="message" data-conversation-id="${escapeHtml(state.selectedConversationId || '')}" placeholder="Digite uma resposta" rows="1" autocomplete="off" autocapitalize="sentences" spellcheck="true">${escapeHtml(replyDraft?.message || '')}</textarea>
      <button class="primary" type="submit">Enviar</button>
    </form>
  `;
}

function messageAckMarkup(ack) {
  const status = messageAckStatus(ack);
  return ` <span class="message-ack ${status.className}" title="${escapeHtml(status.label)}">${status.icon}</span>`;
}

function messageAckStatus(ack) {
  const value = Number(ack);
  if (value >= 3) return { icon: '&#10003;&#10003;', label: 'Visualizada', className: 'read' };
  if (value === 2) return { icon: '&#10003;&#10003;', label: 'Entregue', className: 'delivered' };
  if (value === 1) return { icon: '&#10003;', label: 'Enviada, aguardando entrega', className: 'sent' };
  if (value === 0) return { icon: '&#9201;', label: 'Pendente', className: 'pending' };
  if (value < 0) return { icon: '!', label: 'Falha no envio', className: 'failed' };
  return { icon: '&#9201;', label: 'Aguardando status', className: 'pending' };
}

function updateMessageAck(messageId, ack) {
  if (!messageId) return;
  state.messages = state.messages.map((message) => (
    message.id === messageId ? { ...message, ack } : message
  ));
  const status = messageAckStatus(ack);
  const bubble = [...document.querySelectorAll('.bubble[data-message-id]')]
    .find((item) => item.dataset.messageId === messageId);
  const target = bubble?.querySelector('.message-ack');
  if (!target) return;
  target.className = `message-ack ${status.className}`;
  target.title = status.label;
  target.innerHTML = status.icon;
}

function conversationName(chatId) {
  return state.conversations.find((conversation) => conversation.id === chatId)?.name || '';
}

function cleanWhatsAppId(value) {
  return String(value || '')
    .replace(/@c\.us|@g\.us|@lid/g, '')
    .replace(/[^\d+]/g, '');
}

function mediaPreviewLabel(message) {
  const mimetype = String(message.media?.mimetype || '');
  if (mimetype.startsWith('image/')) return 'Imagem recebida';
  if (mimetype.startsWith('video/')) return 'Vídeo recebido';
  if (mimetype.startsWith('audio/')) return 'Áudio recebido';
  return message.media?.filename ? `[${message.media.filename}]` : 'Mídia recebida';
}

function messageMediaMarkup(message) {
  if (!message.media) return '';
  const { mimetype, dataUrl, filename } = message.media;
  const safeName = escapeHtml(filename || 'arquivo');
  if (String(mimetype).startsWith('image/')) {
    return `<button class="message-image-button" type="button" data-open-image="${escapeHtml(dataUrl)}" data-image-name="${escapeHtml(filename || 'Imagem enviada')}"><img class="message-image" src="${escapeHtml(dataUrl)}" alt="${escapeHtml(filename || 'Imagem enviada')}"></button>`;
  }

  if (String(mimetype).startsWith('audio/')) {
    return `<audio class="message-audio" controls preload="metadata" src="${escapeHtml(dataUrl)}"></audio>`;
  }

  if (String(mimetype).startsWith('video/')) {
    return `<video class="message-video" controls preload="metadata" src="${escapeHtml(dataUrl)}"></video>`;
  }

  if (String(mimetype).includes('pdf')) {
    return `
      <button class="message-pdf" type="button" data-open-pdf="${escapeHtml(dataUrl)}" data-pdf-name="${safeName}">
        <div class="message-pdf-head">
          <strong>${safeName}</strong>
          <span>Abrir</span>
        </div>
        <div class="message-pdf-static">
          <span>PDF</span>
          <small>Toque para visualizar em tela cheia</small>
        </div>
      </button>`;
  }

  return `<a class="message-file" href="${escapeHtml(dataUrl)}" download="${safeName}">${safeName}</a>`;
}

function openImagePreview(src, filename = 'Imagem enviada') {
  const existing = document.querySelector('.image-preview-backdrop');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'image-preview-backdrop';
  modal.innerHTML = `
    <section class="image-preview-panel">
      <div class="image-preview-head">
        <strong>${escapeHtml(filename)}</strong>
        <div class="row">
          <a class="secondary" href="${escapeHtml(src)}" download="${escapeHtml(filename)}">Baixar</a>
          <button class="secondary" id="closeImagePreview" type="button">Fechar</button>
        </div>
      </div>
      <img src="${escapeHtml(src)}" alt="${escapeHtml(filename)}">
    </section>
  `;
  document.body.appendChild(modal);
  document.querySelector('#closeImagePreview')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (event) => {
    if (event.target === modal) modal.remove();
  });
}

function openPdfPreview(src, filename = 'Documento PDF') {
  const existing = document.querySelector('.image-preview-backdrop');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'image-preview-backdrop pdf-preview-backdrop';
  modal.innerHTML = `
    <section class="image-preview-panel pdf-preview-panel">
      <div class="image-preview-head">
        <strong>${escapeHtml(filename)}</strong>
        <div class="row">
          <a class="secondary" href="${escapeHtml(src)}" download="${escapeHtml(filename)}">Baixar</a>
          <button class="secondary" id="closePdfPreview" type="button">Fechar</button>
        </div>
      </div>
      <iframe src="${escapeHtml(src)}" title="${escapeHtml(filename)}"></iframe>
    </section>
  `;
  document.body.appendChild(modal);
  document.querySelector('#closePdfPreview')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (event) => {
    if (event.target === modal) modal.remove();
  });
}

function statsTab() {
  const selectedWatchers = state.statsWatcherIds.length ? state.statsWatcherIds : state.watchers.map((watcher) => watcher.id);
  return `
    <div class="topbar">
      <div>
        <h1>Estatísticas</h1>
        <p class="muted">Primeira e última mensagem dos participantes observados.</p>
      </div>
      <div class="row">
        <button class="secondary" id="exportStatsExcel" type="button">Excel</button>
        <button class="secondary" id="exportStatsPdf" type="button">PDF</button>
        <button class="secondary" id="refreshStats" type="button">Atualizar</button>
      </div>
    </div>
    <section class="panel stats-filter">
      <form class="compose-form" id="watcherForm">
        <select name="groupId" required>
          <option value="">Grupo observado</option>
          ${state.whatsapp.groups.map((group) => `<option value="${escapeHtml(group.id)}" data-name="${escapeHtml(group.name)}" ${state.statsGroupId === group.id ? 'selected' : ''}>${escapeHtml(group.name)}</option>`).join('')}
        </select>
        <button class="secondary" id="loadParticipants" type="button">Carregar participantes</button>
        <select name="participantId" required>
          <option value="">Participante observado</option>
          ${state.statsParticipants.map((participant) => `<option value="${escapeHtml(participant.id)}" data-name="${escapeHtml(participant.name)}" data-phone="${escapeHtml(participant.number)}">${escapeHtml(participant.name)} - ${escapeHtml(participant.number)}</option>`).join('')}
        </select>
        <button class="primary" type="submit">Adicionar observação</button>
      </form>
      <div class="split">
        <label>Data
          <input id="statsDate" type="date" value="${escapeHtml(state.statsDate)}">
        </label>
        <label>Período para exportação
          <select id="statsPeriod">
            <option value="daily" ${state.statsPeriod === 'daily' ? 'selected' : ''}>Diário</option>
            <option value="weekly" ${state.statsPeriod === 'weekly' ? 'selected' : ''}>Semanal</option>
            <option value="biweekly" ${state.statsPeriod === 'biweekly' ? 'selected' : ''}>Quinzenal</option>
            <option value="monthly" ${state.statsPeriod === 'monthly' ? 'selected' : ''}>Mensal</option>
            <option value="custom" ${state.statsPeriod === 'custom' ? 'selected' : ''}>Personalizado</option>
          </select>
        </label>
        <label class="${state.statsPeriod === 'custom' ? '' : 'is-hidden'}">Início
          <input id="statsCustomStart" type="date" value="${escapeHtml(state.statsCustomStart)}">
        </label>
        <label class="${state.statsPeriod === 'custom' ? '' : 'is-hidden'}">Fim
          <input id="statsCustomEnd" type="date" value="${escapeHtml(state.statsCustomEnd)}">
        </label>
      </div>
      <p class="muted">Selecione abaixo quais observações entram no cálculo.</p>
      <label>Observações cadastradas</label>
      <div class="groups">
        ${state.watchers.length ? state.watchers.map((watcher) => `
          <label class="group-option">
            <input type="checkbox" name="statsWatcherIds" value="${watcher.id}" ${selectedWatchers.includes(watcher.id) ? 'checked' : ''}>
            <span>${escapeHtml(watcher.contactName)} <small>${escapeHtml(watcher.groupName)}</small></span>
            <button class="danger mini-button" data-delete-watcher="${watcher.id}" type="button">Remover</button>
          </label>
        `).join('') : '<div class="empty">Carregue os participantes de um grupo e adicione uma observação.</div>'}
      </div>
    </section>
    <section class="list">
      ${state.stats.length ? state.stats.map((item) => `
        <article class="item">
          <div class="item-head">
            <div>
              <p class="item-title">${escapeHtml(item.contactName || item.name)}</p>
              <p class="muted">${escapeHtml(item.groupName || item.tag || 'Sem grupo')} | ${escapeHtml(item.contactPhone || item.phone)}</p>
            </div>
            <span class="status ${item.count ? '' : 'status-partial'}">${item.count || 0} msg</span>
          </div>
          <div class="stats-grid">
            <div><span>Primeira mensagem</span><strong>${item.firstMessageAt ? new Date(item.firstMessageAt).toLocaleTimeString('pt-BR') : '--:--'}</strong></div>
            <div><span>Última mensagem</span><strong>${item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString('pt-BR') : '--:--'}</strong></div>
          </div>
        </article>
      `).join('') : '<div class="empty">Clique em Atualizar para calcular as estatísticas de hoje.</div>'}
    </section>
  `;
}

function userItem(user, canManageUsers) {
  const isSelf = user.id === state.user?.id;
  const canEditThisUser = canManageUsers && !isSelf && !user.isOwner;
  return `
    <article class="item user-item">
      <div class="item-head">
        <div>
          <p class="item-title">${escapeHtml(user.name)}</p>
          <p class="muted">${escapeHtml(user.email)}</p>
        </div>
        <span class="status ${user.isOwner ? '' : 'status-partial'}">${user.isOwner ? 'Principal' : 'Admin'}</span>
      </div>
      ${
        canEditThisUser
          ? `<div class="user-actions">
              <label>Nova senha
                <input data-user-password="${user.id}" type="password" minlength="6" placeholder="Mínimo 6 caracteres">
              </label>
              <div class="row">
                <button class="secondary" data-reset-user-password="${user.id}" type="button">Alterar senha</button>
                <button class="danger" data-delete-user="${user.id}" type="button">Apagar usuário</button>
              </div>
            </div>`
          : `<p class="muted">${isSelf ? 'Conta em uso agora.' : 'Somente o usuário principal pode gerenciar esta conta.'}</p>`
      }
    </article>
  `;
}

function logsTab() {
  return `
    <div class="topbar">
      <div>
        <h1>Histórico</h1>
        <p class="muted">Últimos envios processados pelo agendador.</p>
      </div>
      <button class="secondary" id="refreshLogs" type="button">Atualizar</button>
    </div>
    <section class="list">
      ${
        state.logs.length
          ? state.logs.map((log) => `
            <article class="item">
              <div class="item-head">
                <p class="item-title">${escapeHtml(log.scheduleTitle || 'Agendamento')}</p>
                <span class="${logStatusClass(log.status)}">${escapeHtml(logStatusLabel(log.status))}</span>
              </div>
              <p class="muted">${new Date(log.createdAt).toLocaleString('pt-BR')}</p>
              ${log.error ? `<p class="message-preview">${escapeHtml(log.error)}</p>` : ''}
            </article>`).join('')
          : '<div class="empty">Nenhum envio registrado.</div>'
      }
    </section>
  `;
}

function logStatusLabel(status) {
  return { sent: 'Enviado', failed: 'Falha', partial: 'Parcial' }[status] || status || 'Registro';
}

function logStatusClass(status) {
  const tone = { sent: 'status-success', failed: 'status-failed', partial: 'status-partial' }[status] || '';
  return `status ${tone}`;
}

function dayCheckbox(key, label, editing) {
  const checked = editing ? (editing.days || []).includes(key) : ['mon', 'tue', 'wed', 'thu', 'fri'].includes(key);
  return `<label class="chip day-chip"><input type="checkbox" name="days" value="${key}" ${checked ? 'checked' : ''}><span>${label}</span></label>`;
}

function groupsList(selectable, editing) {
  if (!state.whatsapp.groups.length) {
    if (state.whatsapp.status === 'authenticated') return '<div class="empty">WhatsApp autenticado, mas ainda sincronizando. Aguarde mudar para Conectado.</div>';
    if (state.whatsapp.status !== 'ready') return '<div class="empty">Conecte o WhatsApp para carregar os grupos.</div>';
    return '<div class="empty">Nenhum grupo encontrado para este número. Verifique se o bot participa dos grupos e clique em atualizar.</div>';
  }

  return `
    <div class="groups">
      ${state.whatsapp.groups.map((group) => {
        const checked = editing?.groupIds.includes(group.id);
        return `
          <label class="group-option" data-schedule-group="${escapeHtml(group.name.toLowerCase())}">
            ${selectable ? `<input type="checkbox" name="groupIds" value="${group.id}" data-name="${escapeHtml(group.name)}" ${checked ? 'checked' : ''}>` : ''}
            ${escapeHtml(group.name)}
          </label>`;
      }).join('')}
    </div>
  `;
}

function contactsList(selectable, editing) {
  if (!state.contacts.length) {
    return '<div class="empty">Nenhum contato individual cadastrado. Use o menu Contatos para adicionar colaboradores.</div>';
  }

  return `
    <div class="groups contact-targets">
      ${state.contacts.map((contact) => {
        const checked = (editing?.contactIds || []).includes(contact.whatsappId);
        const tags = contactTags(contact).join(' ');
        const search = `${contact.name} ${contact.phone} ${tags}`.toLowerCase();
        return `
          <label class="group-option" data-schedule-contact="${escapeHtml(search)}">
            ${selectable ? `<input type="checkbox" name="contactIds" value="${contact.whatsappId}" data-name="${escapeHtml(contact.name)}" ${checked ? 'checked' : ''}>` : ''}
            <span>${escapeHtml(contact.name)} <small>${escapeHtml(tags || contact.phone)}</small></span>
          </label>`;
      }).join('')}
    </div>
  `;
}

function scheduleItem(schedule) {
  const groupText = (schedule.groupNames || []).map(escapeHtml).join(', ');
  const contactText = (schedule.contactNames || []).map(escapeHtml).join(', ');
  const botName = schedule.botName || 'SuperVISOR';
  return `
    <article class="item schedule-card">
      <div class="item-head">
        <div>
          <p class="item-title">${escapeHtml(schedule.title)}</p>
          <p class="muted">${schedule.time} | ${scheduleWhen(schedule)}</p>
        </div>
        <span class="status">${schedule.active ? 'Ativo' : 'Pausado'}</span>
      </div>
      <div class="schedule-meta">
        <div><span>Título</span><strong>${escapeHtml(schedule.title)}</strong></div>
        <div><span>Bot</span><strong>${escapeHtml(botName)}</strong></div>
        ${groupText ? `<div><span>Grupos</span><strong>${groupText}</strong></div>` : ''}
        ${contactText ? `<div><span>Contatos</span><strong>${contactText}</strong></div>` : ''}
      </div>
      <div class="schedule-message">
        <span>Mensagem</span>
        <p>${escapeHtml(schedule.message)}</p>
      </div>
      <div class="row schedule-actions">
        <button class="secondary" data-edit="${schedule.id}">Editar</button>
        <button class="secondary" data-reuse="${schedule.id}">Reaproveitar</button>
        <button class="secondary" data-toggle="${schedule.id}">${schedule.active ? 'Pausar' : 'Ativar'}</button>
        <button class="secondary" data-send="${schedule.id}">Enviar agora</button>
        <button class="danger" data-delete="${schedule.id}">Remover</button>
      </div>
    </article>
  `;
}

function bindContent() {
  document.querySelector('#refreshGroups')?.addEventListener('click', refreshGroups);
  document.querySelector('#disconnectWhatsApp')?.addEventListener('click', disconnectWhatsApp);
  document.querySelector('#restartWhatsApp')?.addEventListener('click', restartWhatsApp);
  document.querySelector('#newQrWhatsApp')?.addEventListener('click', generateNewQr);
  document.querySelector('#scheduleForm')?.addEventListener('submit', saveSchedule);
  document.querySelector('#scheduleFilterType')?.addEventListener('change', (event) => {
    state.scheduleFilterType = event.target.value;
    state.scheduleFilterId = '';
    renderContent();
  });
  document.querySelector('#scheduleFilterId')?.addEventListener('change', (event) => {
    state.scheduleFilterId = event.target.value;
    renderContent();
  });
  document.querySelector('#scheduleFilterDay')?.addEventListener('change', (event) => {
    state.scheduleFilterDay = event.target.value;
    renderContent();
  });
  document.querySelector('#scheduleFilterDate')?.addEventListener('change', (event) => {
    state.scheduleFilterDate = event.target.value;
    renderContent();
  });
  document.querySelector('#contactForm')?.addEventListener('submit', saveContact);
  document.querySelector('#cancelContactEdit')?.addEventListener('click', () => {
    state.editingContactId = null;
    renderContent();
  });
  document.querySelector('#contactSearch')?.addEventListener('input', (event) => {
    state.contactSearch = event.target.value;
    updateContactResults();
  });
  document.querySelector('#contactTagFilter')?.addEventListener('change', (event) => {
    state.contactTagFilter = event.target.value;
    updateContactResults();
  });
  document.querySelector('#contactOrder')?.addEventListener('change', (event) => {
    state.contactOrder = event.target.value;
    updateContactResults();
  });
  document.querySelector('#scheduleGroupSearch')?.addEventListener('input', (event) => {
    state.scheduleGroupSearch = event.target.value;
    filterScheduleTargets();
  });
  document.querySelector('#scheduleContactSearch')?.addEventListener('input', (event) => {
    state.scheduleContactSearch = event.target.value;
    filterScheduleTargets();
  });
  document.querySelector('#addSpecificDate')?.addEventListener('click', addSpecificDate);
  document.querySelector('#refreshLogs')?.addEventListener('click', refreshLogs);
  document.querySelector('#refreshConversations')?.addEventListener('click', refreshConversations);
  document.querySelector('.chat-list')?.addEventListener('scroll', (event) => {
    state.conversationListScroll = event.currentTarget.scrollTop;
  });
  document.querySelector('.messages')?.addEventListener('scroll', toggleScrollBottomButton);
  document.querySelector('#scrollMessagesBottom')?.addEventListener('click', scrollMessagesToBottom);
  document.querySelector('#mobileBackToChats')?.addEventListener('click', () => {
    state.selectedConversationId = null;
    state.messages = [];
    renderContent();
  });
  document.querySelectorAll('[data-conversation-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      state.conversationFilter = button.dataset.conversationFilter;
      state.conversationListScroll = 0;
      renderContent();
    });
  });
  document.querySelector('#refreshStats')?.addEventListener('click', refreshStats);
  document.querySelector('#exportStatsExcel')?.addEventListener('click', exportStatsExcel);
  document.querySelector('#exportStatsPdf')?.addEventListener('click', exportStatsPdf);
  document.querySelector('#loadParticipants')?.addEventListener('click', loadStatsParticipants);
  document.querySelector('#watcherForm select[name="groupId"]')?.addEventListener('change', (event) => {
    state.statsGroupId = event.target.value;
    state.statsParticipants = [];
  });
  document.querySelector('#statsPeriod')?.addEventListener('change', (event) => {
    state.statsPeriod = event.target.value;
    renderContent();
  });
  document.querySelector('#statsCustomStart')?.addEventListener('change', (event) => {
    state.statsCustomStart = event.target.value;
  });
  document.querySelector('#statsCustomEnd')?.addEventListener('change', (event) => {
    state.statsCustomEnd = event.target.value;
  });
  document.querySelector('#replyForm')?.addEventListener('submit', sendConversationReply);
  document.querySelector('#replyForm input[name="replyBotName"]')?.addEventListener('input', (event) => {
    state.replyBotName = event.target.value;
    localStorage.setItem('replyBotName', state.replyBotName);
  });
  const replyMessageInput = document.querySelector('#replyForm textarea[name="message"]');
  replyMessageInput?.addEventListener('beforeinput', () => {
    lastReplyInputAt = Date.now();
  });
  replyMessageInput?.addEventListener('input', (event) => {
    lastReplyInputAt = Date.now();
    saveReplyDraftFromInput(event.currentTarget, { restoreFocus: true });
    autoResizeReplyTextarea(event.currentTarget);
  });
  replyMessageInput?.addEventListener('keydown', (event) => {
    lastReplyInputAt = Date.now();
    const sourceInput = event.currentTarget;
    setTimeout(() => saveReplyDraftFromInput(sourceInput, { restoreFocus: true }), 0);
  });
  replyMessageInput?.addEventListener('compositionstart', () => {
    replyCompositionActive = true;
  });
  replyMessageInput?.addEventListener('compositionend', (event) => {
    replyCompositionActive = false;
    lastReplyInputAt = Date.now();
    saveReplyDraftFromInput(event.currentTarget, { restoreFocus: true });
    autoResizeReplyTextarea(event.currentTarget);
  });
  requestAnimationFrame(autoResizeReplyTextarea);
  document.querySelector('#attachButton')?.addEventListener('click', () => document.querySelector('#replyAttachment')?.click());
  document.querySelector('#recordAudioButton')?.addEventListener('click', toggleAudioRecording);
  document.querySelectorAll('[data-emoji]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.querySelector('#replyForm textarea[name="message"]');
      if (input) {
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        input.value = `${input.value.slice(0, start)}${button.dataset.emoji}${input.value.slice(end)}`;
        input.selectionStart = input.selectionEnd = start + button.dataset.emoji.length;
        lastReplyInputAt = Date.now();
        saveReplyDraftFromInput(input, { restoreFocus: true });
        autoResizeReplyTextarea(input);
        input.focus();
      }
    });
  });
  bindMessageContentActions();
  document.querySelector('#deleteConversation')?.addEventListener('click', deleteSelectedConversation);
  document.querySelector('#startConversationForm')?.addEventListener('submit', startConversation);
  document.querySelector('#watcherForm')?.addEventListener('submit', saveWatcher);
  document.querySelector('#statsDate')?.addEventListener('change', (event) => {
    state.statsDate = event.target.value;
  });
  document.querySelectorAll('input[name="statsWatcherIds"]').forEach((input) => {
    input.addEventListener('change', () => {
      state.statsWatcherIds = [...document.querySelectorAll('input[name="statsWatcherIds"]:checked')].map((item) => item.value);
    });
  });
  document.querySelectorAll('[data-delete-watcher]').forEach((button) => {
    button.addEventListener('click', () => deleteWatcher(button.dataset.deleteWatcher));
  });
  bindConversationListActions();
  document.querySelectorAll('[data-delete-contact]').forEach((button) => {
    button.addEventListener('click', () => deleteContact(button.dataset.deleteContact));
  });
  document.querySelectorAll('[data-edit-contact]').forEach((button) => {
    button.addEventListener('click', () => {
      state.editingContactId = button.dataset.editContact;
      renderContent();
    });
  });
  document.querySelectorAll('[data-start-contact-chat]').forEach((button) => {
    button.addEventListener('click', () => {
      state.tab = 'conversations';
      state.selectedConversationId = button.dataset.startContactChat;
      state.messages = [];
      renderContent();
    });
  });
  document.querySelectorAll('[data-remove-date]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedDates = state.selectedDates.filter((date) => date !== button.dataset.removeDate);
      renderContent();
    });
  });
  document.querySelector('#cancelEdit')?.addEventListener('click', () => {
    state.editingId = null;
    state.scheduleDraft = null;
    state.selectedDates = [];
    state.selectedDatesScheduleId = null;
    renderContent();
  });
  document.querySelector('#userForm')?.addEventListener('submit', saveUser);
  document.querySelectorAll('[data-reset-user-password]').forEach((button) => {
    button.addEventListener('click', () => resetUserPassword(button.dataset.resetUserPassword));
  });
  document.querySelectorAll('[data-delete-user]').forEach((button) => {
    button.addEventListener('click', () => deleteUser(button.dataset.deleteUser));
  });
  document.querySelectorAll('[data-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      state.editingId = button.dataset.edit;
      state.scheduleDraft = null;
      const editing = state.schedules.find((item) => item.id === state.editingId);
      state.selectedDates = [...(editing?.specificDates || [])];
      renderContent();
    });
  });
  document.querySelectorAll('[data-reuse]').forEach((button) => {
    button.addEventListener('click', () => reuseSchedule(button.dataset.reuse));
  });
  document.querySelectorAll('[data-toggle]').forEach((button) => {
    button.addEventListener('click', () => actionSchedule(`/api/schedules/${button.dataset.toggle}/toggle`, 'PATCH'));
  });
  document.querySelectorAll('[data-send]').forEach((button) => {
    button.addEventListener('click', () => actionSchedule(`/api/schedules/${button.dataset.send}/send-now`, 'POST'));
  });
  document.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Remover este agendamento?')) return;
      await actionSchedule(`/api/schedules/${button.dataset.delete}`, 'DELETE');
    });
  });
  filterScheduleTargets();
}

function bindMessageContentActions() {
  document.querySelectorAll('[data-delete-message]').forEach((button) => {
    button.addEventListener('click', () => deleteMessage(button.dataset.deleteMessage));
  });
  document.querySelectorAll('[data-open-image]').forEach((button) => {
    button.addEventListener('click', () => openImagePreview(button.dataset.openImage, button.dataset.imageName));
  });
  document.querySelectorAll('[data-open-pdf]').forEach((button) => {
    button.addEventListener('click', () => openPdfPreview(button.dataset.openPdf, button.dataset.pdfName));
  });
}

function filterScheduleTargets() {
  const groupQuery = state.scheduleGroupSearch.trim().toLowerCase();
  document.querySelectorAll('[data-schedule-group]').forEach((item) => {
    item.hidden = Boolean(groupQuery) && !item.dataset.scheduleGroup.includes(groupQuery);
  });

  const contactQuery = state.scheduleContactSearch.trim().toLowerCase();
  document.querySelectorAll('[data-schedule-contact]').forEach((item) => {
    item.hidden = Boolean(contactQuery) && !item.dataset.scheduleContact.includes(contactQuery);
  });
}

function reuseSchedule(scheduleId) {
  const schedule = state.schedules.find((item) => item.id === scheduleId);
  if (!schedule) return;
  state.editingId = null;
  state.scheduleDraft = {
    ...schedule,
    title: `${schedule.title || 'Agendamento'} (cópia)`,
    active: true,
    days: [...(schedule.days || [])],
    specificDates: [...(schedule.specificDates || [])],
    groupIds: [...(schedule.groupIds || [])],
    contactIds: [...(schedule.contactIds || [])]
  };
  state.selectedDates = [...(state.scheduleDraft.specificDates || [])];
  state.selectedDatesScheduleId = 'new';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderContent();
}

function addSpecificDate() {
  const input = document.querySelector('#specificDatePicker');
  if (!input?.value) {
    toast('Escolha uma data no calendário.');
    return;
  }
    state.selectedDates = [...new Set([...state.selectedDates, input.value])].sort();
  state.selectedDatesScheduleId = state.editingId || 'new';
  renderContent();
}

function updateContactResults() {
  const target = document.querySelector('.contacts-results');
  if (!target) return;
  const contacts = filteredContacts();
  target.innerHTML = contacts.length ? contacts.map(contactItem).join('') : '<div class="empty">Nenhum contato encontrado.</div>';
  const count = document.querySelector('.contact-count');
  if (count) count.textContent = `${contacts.length} contato(s)`;
  bindContactActionButtons();
}

function bindContactActionButtons() {
  document.querySelectorAll('[data-delete-contact]').forEach((button) => {
    button.addEventListener('click', () => deleteContact(button.dataset.deleteContact));
  });
  document.querySelectorAll('[data-edit-contact]').forEach((button) => {
    button.addEventListener('click', () => {
      state.editingContactId = button.dataset.editContact;
      renderContent();
    });
  });
  document.querySelectorAll('[data-start-contact-chat]').forEach((button) => {
    button.addEventListener('click', () => {
      state.tab = 'conversations';
      state.selectedConversationId = button.dataset.startContactChat;
      state.messages = [];
      renderContent();
    });
  });
}

function bindConversationListActions() {
  document.querySelectorAll('[data-open-conversation]').forEach((button) => {
    button.addEventListener('click', () => {
      state.conversationListScroll = document.querySelector('.chat-list')?.scrollTop || 0;
      openConversation(button.dataset.openConversation);
    });
  });
  document.querySelectorAll('[data-pin-conversation]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      togglePinnedConversation(button.dataset.pinConversation);
    });
  });
}

function togglePinnedConversation(conversationId) {
  const pinned = new Set(state.pinnedConversations);
  if (pinned.has(conversationId)) {
    pinned.delete(conversationId);
  } else {
    pinned.add(conversationId);
  }
  state.pinnedConversations = [...pinned];
  localStorage.setItem('pinnedConversations', JSON.stringify(state.pinnedConversations));
  renderContent();
}

async function refreshGroups() {
  if (!whatsappIsReady()) {
    toast('Aguarde o status mudar para Conectado antes de carregar os grupos.');
    return;
  }
  try {
    state.actionMessage = 'Carregando grupos...';
    renderContent();
    const data = await api('/api/whatsapp/groups/refresh', { method: 'POST' });
    state.whatsapp.groups = data.groups;
    state.actionMessage = data.groups.length ? `${data.groups.length} grupo(s) carregado(s).` : 'Nenhum grupo encontrado para este número.';
    renderContent();
  } catch (error) {
    state.actionMessage = error.message;
    renderContent();
    toast(error.message);
  }
}

async function disconnectWhatsApp() {
  if (!confirm('Desconectar este número do WhatsApp e apagar a sessão salva neste computador?')) return;
  try {
    const data = await api('/api/whatsapp/disconnect', { method: 'POST', body: JSON.stringify({ clearSession: true }) });
    state.whatsapp = data;
    state.actionMessage = null;
    renderContent();
    toast('WhatsApp desconectado.');
  } catch (error) {
    if (!silent) toast(error.message);
  }
}

async function restartWhatsApp() {
  try {
    const data = await api('/api/whatsapp/disconnect', { method: 'POST', body: JSON.stringify({ clearSession: false }) });
    state.whatsapp = data;
    state.actionMessage = 'Reiniciando. Aguarde o status mudar para Conectado.';
    renderContent();
    toast('Conexão reiniciada.');
  } catch (error) {
    toast(error.message);
  }
}

async function generateNewQr() {
  if (!confirm('Apagar a sessão salva e gerar um QR Code novo para este computador?')) return;
  try {
    const data = await api('/api/whatsapp/disconnect', { method: 'POST', body: JSON.stringify({ clearSession: true }) });
    state.whatsapp = data;
    state.actionMessage = 'Sessão limpa. Aguarde alguns segundos para o QR Code aparecer.';
    renderContent();
    toast('Gerando novo QR Code.');
  } catch (error) {
    toast(error.message);
  }
}

async function saveSchedule(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const selectedGroups = [...form.querySelectorAll('input[name="groupIds"]:checked')];
  const selectedContacts = [...form.querySelectorAll('input[name="contactIds"]:checked')];
  const body = {
    title: data.get('title'),
    botName: data.get('botName'),
    message: data.get('message'),
    time: data.get('time'),
    active: data.get('active') === 'true',
    scheduleMode: data.get('scheduleMode'),
    days: data.getAll('days'),
    specificDates: parseSpecificDates(data.get('specificDates')),
    groupIds: selectedGroups.map((input) => input.value),
    groupNames: selectedGroups.map((input) => input.dataset.name),
    contactIds: selectedContacts.map((input) => input.value),
    contactNames: selectedContacts.map((input) => input.dataset.name)
  };
  try {
    const path = state.editingId ? `/api/schedules/${state.editingId}` : '/api/schedules';
    const method = state.editingId ? 'PUT' : 'POST';
    await api(path, { method, body: JSON.stringify(body) });
    state.editingId = null;
    state.scheduleDraft = null;
    state.selectedDates = [];
    state.selectedDatesScheduleId = null;
    await loadDashboardData();
    renderContent();
    toast('Agendamento salvo.');
  } catch (error) {
    toast(error.message);
  }
}

async function saveUser(event) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget));
  try {
    await api('/api/users', { method: 'POST', body: JSON.stringify(body) });
    await loadDashboardData();
    renderContent();
    toast('Usuário criado.');
  } catch (error) {
    toast(error.message);
  }
}

async function refreshLogs() {
  try {
    const data = await api('/api/logs');
    state.logs = data.logs;
    renderContent();
    toast('Histórico atualizado.');
  } catch (error) {
    toast(error.message);
  }
}

async function saveContact(event) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget));
  try {
    const path = state.editingContactId ? `/api/contacts/${state.editingContactId}` : '/api/contacts';
    const method = state.editingContactId ? 'PUT' : 'POST';
    await api(path, { method, body: JSON.stringify(body) });
    state.editingContactId = null;
    await loadDashboardData();
    renderContent();
    toast('Contato salvo.');
  } catch (error) {
    toast(error.message);
  }
}

async function deleteContact(contactId) {
  const contact = state.contacts.find((item) => item.id === contactId);
  if (!contact || !confirm(`Apagar o contato ${contact.name}?`)) return;

  try {
    await api(`/api/contacts/${contactId}`, { method: 'DELETE' });
    await loadDashboardData();
    renderContent();
    toast('Contato apagado.');
  } catch (error) {
    toast(error.message);
  }
}

async function refreshConversations({ silent = false, preserveScroll = false, preserveDraft = false } = {}) {
  try {
    const draft = preserveDraft ? captureReplyDraft() : null;
    if (preserveScroll) state.conversationListScroll = document.querySelector('.chat-list')?.scrollTop || state.conversationListScroll;
    const previousUnread = state.unreadSnapshot || {};
    const hadConversations = state.conversations.length > 0;
    const data = await api('/api/conversations');
    state.conversations = data.conversations;
    const validIds = new Set(state.conversations.map((conversation) => conversation.id));
    state.readUnreadCounts = Object.fromEntries(
      Object.entries(state.readUnreadCounts || {}).filter(([id]) => validIds.has(id))
    );
    persistReadUnreadCounts();
    state.unreadSnapshot = Object.fromEntries(
      state.conversations.map((conversation) => [conversation.id, Number(conversation.unreadCount || 0)])
    );
    const newUnread = state.conversations.reduce((total, conversation) => {
      const current = Number(conversation.unreadCount || 0);
      const previous = Number(previousUnread[conversation.id] || 0);
      const acknowledged = Number(state.readUnreadCounts[conversation.id] || 0);
      return total + Math.max(0, current - Math.max(previous, acknowledged));
    }, 0);
    if (state.tab === 'conversations' && (preserveScroll || isReplyEditingActive()) && renderConversationListOnly()) {
      // Keep the open chat stable; only the left list needs polling updates.
    } else {
      renderContent();
    }
    if (draft) requestAnimationFrame(() => restoreReplyDraft(draft));
    if (!silent) toast(newUnread && hadConversations ? `${newUnread} mensagem(ns) nova(s) recebida(s).` : 'Conversas atualizadas.');
  } catch (error) {
    toast(error.message);
  }
}

async function startConversation(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const targetId = data.get('targetId');
  const message = data.get('message');

  try {
    await api(`/api/conversations/${encodeURIComponent(targetId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    state.selectedConversationId = targetId;
    await openConversation(targetId);
    await refreshConversations();
    toast('Conversa iniciada.');
  } catch (error) {
    toast(error.message);
  }
}

async function openConversation(conversationId, { scrollToBottom = true, preserveDraft = false } = {}) {
  try {
    const requestId = ++conversationRequestId;
    const draft = preserveDraft ? captureReplyDraft() : null;
    if (state.selectedConversationId !== conversationId) replyCompositionActive = false;
    const currentConversation = state.conversations.find((conversation) => conversation.id === conversationId);
    const currentUnread = Number(currentConversation?.unreadCount || 0);
    state.selectedConversationId = conversationId;
    state.clearedUnread[conversationId] = true;
    state.readUnreadCounts[conversationId] = Math.max(Number(state.readUnreadCounts[conversationId] || 0), currentUnread);
    persistReadUnreadCounts();
    state.unreadSnapshot[conversationId] = currentUnread;
    state.conversations = state.conversations.map((conversation) => (
      conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
    ));
    if (!preserveDraft) {
      state.messages = [];
      state.shouldScrollMessages = false;
      renderContent();
    }
    const data = await api(`/api/conversations/${encodeURIComponent(conversationId)}/messages?limit=24`);
    if (requestId !== conversationRequestId || state.selectedConversationId !== conversationId) return;
    const liveDraft = captureReplyDraft();
    const keepComposer = liveDraft?.conversationId === conversationId && isReplyEditingActive();
    state.messages = data.messages;
    state.shouldScrollMessages = scrollToBottom;
    if (keepComposer && renderConversationMessagesOnly({ scrollToBottom })) {
      state.shouldScrollMessages = false;
      return;
    }
    renderContent();
    const draftToRestore = liveDraft || draft;
    if (draftToRestore) requestAnimationFrame(() => restoreReplyDraft(draftToRestore));
  } catch (error) {
    toast(error.message);
  }
}

async function deleteSelectedConversation() {
  if (!state.selectedConversationId || !confirm('Apagar esta conversa do WhatsApp Web?')) return;

  try {
    await api(`/api/conversations/${encodeURIComponent(state.selectedConversationId)}`, { method: 'DELETE' });
    state.conversations = state.conversations.filter((conversation) => conversation.id !== state.selectedConversationId);
    state.selectedConversationId = null;
    state.messages = [];
    renderContent();
    toast('Conversa apagada.');
  } catch (error) {
    toast(error.message);
  }
}

async function sendConversationReply(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const file = data.get('attachment');
  const replyBotName = String(data.get('replyBotName') || '').trim();
  const rawMessage = String(data.get('message') || '');
  state.replyBotName = replyBotName;
  localStorage.setItem('replyBotName', replyBotName);
  const body = {
    message: replyBotName && rawMessage.trim()
      ? `*${replyBotName}*:\n${rawMessage}`
      : rawMessage
  };
  if (file && file.size) {
    const dataUrl = await fileToDataUrl(file);
    body.media = {
      mimetype: file.type,
      filename: file.name,
      data: dataUrl.split(',')[1]
    };
  }
  try {
    await api(`/api/conversations/${encodeURIComponent(state.selectedConversationId)}/messages`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    if (form.elements.message) form.elements.message.value = '';
    clearReplyDraft(state.selectedConversationId);
    await openConversation(state.selectedConversationId);
    toast('Mensagem enviada.');
  } catch (error) {
    toast(error.message);
  }
}

async function toggleAudioRecording() {
  const button = document.querySelector('#recordAudioButton');
  if (audioRecorder && audioRecorder.state === 'recording') {
    audioRecorder.stop();
    button.textContent = 'Processando...';
    button.disabled = true;
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    toast('Este navegador não permite gravação de áudio nesta página.');
    return;
  }

  try {
    audioRecorderStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioRecorderChunks = [];
    const mimeType = supportedAudioMimeType();
    audioRecorder = mimeType
      ? new MediaRecorder(audioRecorderStream, { mimeType })
      : new MediaRecorder(audioRecorderStream);
    audioRecorder.addEventListener('dataavailable', (event) => {
      if (event.data?.size) audioRecorderChunks.push(event.data);
    });
    audioRecorder.addEventListener('stop', sendRecordedAudio);
    audioRecorder.start();
    startRecordingUi(audioRecorderStream);
    button.textContent = 'Parar';
    button.classList.add('recording');
  } catch (error) {
    toast(`Não consegui acessar o microfone: ${error.message}`);
  }
}

function supportedAudioMimeType() {
  const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
  return options.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

async function sendRecordedAudio() {
  const button = document.querySelector('#recordAudioButton');
  const stream = audioRecorderStream;
  audioRecorder = null;
  audioRecorderStream = null;
  stopRecordingUi();
  stream?.getTracks().forEach((track) => track.stop());

  try {
    const type = audioRecorderChunks[0]?.type || 'audio/webm';
    const mimetype = type.split(';')[0] || 'audio/webm';
    const blob = new Blob(audioRecorderChunks, { type });
    audioRecorderChunks = [];
    if (!blob.size) throw new Error('Áudio vazio.');
    const dataUrl = await fileToDataUrl(blob);
    await api(`/api/conversations/${encodeURIComponent(state.selectedConversationId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        message: '',
        media: {
          mimetype,
          filename: `audio-${Date.now()}.${mimetype.includes('ogg') ? 'ogg' : 'webm'}`,
          data: dataUrl.split(',')[1]
        }
      })
    });
    await openConversation(state.selectedConversationId);
    toast('Áudio enviado.');
  } catch (error) {
    toast(`Não consegui enviar o áudio: ${error.message || error}`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Gravar';
      button.classList.remove('recording');
    }
  }
}

function startRecordingUi(stream) {
  const panel = document.querySelector('#recordingPanel');
  const timer = document.querySelector('#recordingTimer');
  const bars = [...document.querySelectorAll('#recordingBars i')];
  if (panel) panel.hidden = false;
  audioRecordingStartedAt = Date.now();
  audioRecordingTimer = setInterval(() => {
    if (timer) timer.textContent = formatDuration(Date.now() - audioRecordingStartedAt);
  }, 250);

  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) throw new Error('AudioContext indisponível.');
    audioRecordingContext = new AudioContextCtor();
    const analyser = audioRecordingContext.createAnalyser();
    analyser.fftSize = 64;
    audioRecordingContext.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      analyser.getByteFrequencyData(data);
      bars.forEach((bar, index) => {
        const value = data[index % data.length] || 0;
        bar.style.transform = `scaleY(${Math.max(0.18, value / 95)})`;
        bar.style.opacity = String(Math.max(0.35, value / 180));
      });
      audioRecordingAnimation = requestAnimationFrame(draw);
    };
    draw();
  } catch (error) {
    bars.forEach((bar) => {
      bar.style.transform = 'scaleY(0.5)';
    });
  }
}

function stopRecordingUi() {
  const panel = document.querySelector('#recordingPanel');
  if (panel) panel.hidden = true;
  if (audioRecordingTimer) clearInterval(audioRecordingTimer);
  if (audioRecordingAnimation) cancelAnimationFrame(audioRecordingAnimation);
  audioRecordingTimer = null;
  audioRecordingAnimation = null;
  audioRecordingContext?.close?.();
  audioRecordingContext = null;
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

async function deleteMessage(messageId) {
  if (!state.selectedConversationId || !messageId) return;
  const choice = prompt('Como deseja apagar?\n1 - Apagar para mim\n2 - Apagar para todos', '2');
  if (!choice) return;
  const everyone = choice.trim() !== '1';
  try {
    await api('/api/conversations/message-delete', {
      method: 'POST',
      body: JSON.stringify({
        chatId: state.selectedConversationId,
        messageId,
        everyone
      })
    });
    await openConversation(state.selectedConversationId, { scrollToBottom: false });
    toast(everyone ? 'Mensagem apagada para todos.' : 'Mensagem apagada para você.');
  } catch (error) {
    toast(error.message);
  }
}

async function loadStatsParticipants() {
  const groupId = document.querySelector('#watcherForm select[name="groupId"]')?.value;
  if (!groupId) {
    toast('Escolha um grupo para carregar os participantes.');
    return;
  }
  try {
    state.statsGroupId = groupId;
    const data = await api('/api/stats/participants', {
      method: 'POST',
      body: JSON.stringify({ groupId })
    });
    state.statsParticipants = data.participants || [];
    renderContent();
    toast({
      title: 'Participantes carregados',
      body: `${state.statsParticipants.length} participante(s) encontrados.`
    });
  } catch (error) {
    toast(error.message);
  }
}

async function saveWatcher(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const groupSelect = form.querySelector('select[name="groupId"]');
  const groupName = groupSelect?.selectedOptions?.[0]?.dataset?.name || '';
  const participantSelect = form.querySelector('select[name="participantId"]');
  const participant = participantSelect?.selectedOptions?.[0];

  try {
    await api('/api/watchers', {
      method: 'POST',
      body: JSON.stringify({
        groupId: data.get('groupId'),
        groupName,
        participantId: data.get('participantId'),
        participantName: participant?.dataset?.name || participant?.textContent || 'Participante',
        participantPhone: participant?.dataset?.phone || ''
      })
    });
    await loadDashboardData();
    renderContent();
    toast('Observação cadastrada.');
  } catch (error) {
    toast(error.message);
  }
}

async function deleteWatcher(watcherId) {
  try {
    await api(`/api/watchers/${watcherId}`, { method: 'DELETE' });
    state.statsWatcherIds = state.statsWatcherIds.filter((id) => id !== watcherId);
    await loadDashboardData();
    renderContent();
    toast('Observação removida.');
  } catch (error) {
    toast(error.message);
  }
}

async function refreshStats({ silent = false } = {}) {
  try {
    state.statsDate = document.querySelector('#statsDate')?.value || state.statsDate;
    state.statsWatcherIds = [...document.querySelectorAll('input[name="statsWatcherIds"]:checked')].map((item) => item.value);
    const params = new URLSearchParams();
    if (state.statsWatcherIds.length) params.set('watcherIds', state.statsWatcherIds.join(','));
    if (state.statsDate) params.set('date', state.statsDate);
    const data = await api(`/api/stats/attendance?${params.toString()}`);
    state.stats = data.stats;
    renderContent();
    if (!silent) toast('Estatísticas atualizadas.');
  } catch (error) {
    if (!silent) toast(error.message);
  }
}

function statsRows(items = state.stats) {
  return items.map((item) => ({
    contato: item.contactName || item.name || '',
    grupo: item.groupName || '',
    telefone: item.contactPhone || item.phone || '',
    data: item.date || state.statsDate,
    primeira: item.firstMessageAt ? new Date(item.firstMessageAt).toLocaleString('pt-BR') : '',
    ultima: item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleString('pt-BR') : '',
    mensagens: item.count || 0
  }));
}

function addDays(date, days) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toLocaleDateString('en-CA');
}

function getStatsDateRange() {
  const base = document.querySelector('#statsDate')?.value || state.statsDate;
  state.statsPeriod = document.querySelector('#statsPeriod')?.value || state.statsPeriod;
  state.statsCustomStart = document.querySelector('#statsCustomStart')?.value || state.statsCustomStart;
  state.statsCustomEnd = document.querySelector('#statsCustomEnd')?.value || state.statsCustomEnd;

  if (state.statsPeriod === 'custom') {
    const start = state.statsCustomStart || base;
    const end = state.statsCustomEnd || start;
    return { start: start <= end ? start : end, end: start <= end ? end : start };
  }

  const days = {
    daily: 1,
    weekly: 7,
    biweekly: 15,
    monthly: 30
  }[state.statsPeriod] || 1;

  return { start: addDays(base, -(days - 1)), end: base };
}

async function fetchStatsForRange() {
  state.statsWatcherIds = [...document.querySelectorAll('input[name="statsWatcherIds"]:checked')].map((item) => item.value);
  const paramsBase = new URLSearchParams();
  if (state.statsWatcherIds.length) paramsBase.set('watcherIds', state.statsWatcherIds.join(','));
  const { start, end } = getStatsDateRange();
  const rows = [];
  for (let date = start; date <= end; date = addDays(date, 1)) {
    const params = new URLSearchParams(paramsBase);
    params.set('date', date);
    const data = await api(`/api/stats/attendance?${params.toString()}`);
    rows.push(...(data.stats || []));
  }
  return rows;
}

async function exportStatsExcel() {
  try {
    const rows = statsRows(await fetchStatsForRange());
    if (!rows.length) {
      toast('Atualize as estatísticas antes de exportar.');
      return;
    }

    const header = Object.keys(rows[0]);
    const html = `<table><thead><tr>${header.map((key) => `<th>${escapeHtml(key)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${header.map((key) => `<td>${escapeHtml(row[key])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const { start, end } = getStatsDateRange();
    downloadBlob(`estatisticas-${start}-${end}.xls`, 'application/vnd.ms-excel', html);
  } catch (error) {
    toast(error.message);
  }
}

async function exportStatsPdf() {
  const report = window.open('', '_blank');
  if (!report) {
    toast('O navegador bloqueou a janela do PDF. Permita pop-ups para exportar.');
    return;
  }
  report.document.write('<p style="font-family:Arial,sans-serif;padding:24px">Gerando relatório...</p>');
  try {
    const rows = statsRows(await fetchStatsForRange());
    if (!rows.length) {
      report.close();
      toast('Atualize as estatísticas antes de exportar.');
      return;
    }

    const { start, end } = getStatsDateRange();
    report.document.open();
    report.document.write(`
      <html><head><title>Relatório SuperVISOR</title>
      <style>body{font-family:Arial,sans-serif;padding:24px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:8px;text-align:left}</style>
      </head><body><h1>Relatório de Estatísticas</h1><p>Período: ${escapeHtml(start)} até ${escapeHtml(end)}</p>
      <table><thead><tr><th>Contato</th><th>Grupo</th><th>Primeira</th><th>Última</th><th>Mensagens</th></tr></thead><tbody>
      ${rows.map((row) => `<tr><td>${escapeHtml(row.contato)}</td><td>${escapeHtml(row.grupo)}</td><td>${escapeHtml(row.primeira)}</td><td>${escapeHtml(row.ultima)}</td><td>${escapeHtml(row.mensagens)}</td></tr>`).join('')}
      </tbody></table></body></html>
    `);
    report.document.close();
    report.print();
  } catch (error) {
    toast(error.message);
  }
}

function downloadBlob(filename, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function resetUserPassword(userId) {
  const input = document.querySelector(`[data-user-password="${userId}"]`);
  const password = input?.value || '';

  if (password.length < 6) {
    toast('A nova senha deve ter pelo menos 6 caracteres.');
    return;
  }

  try {
    await api(`/api/users/${userId}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password })
    });
    input.value = '';
    toast('Senha do usuário alterada.');
  } catch (error) {
    toast(error.message);
  }
}

async function deleteUser(userId) {
  const user = state.users.find((item) => item.id === userId);
  if (!user || !confirm(`Apagar o usuário ${user.name}? Esta ação não desfaz.`)) return;

  try {
    await api(`/api/users/${userId}`, { method: 'DELETE' });
    await loadDashboardData();
    renderContent();
    toast('Usuário apagado.');
  } catch (error) {
    toast(error.message);
  }
}

async function actionSchedule(path, method) {
  try {
    await api(path, { method });
    await loadDashboardData();
    renderContent();
    toast('Ação concluída.');
  } catch (error) {
    toast(error.message);
  }
}

function parseSpecificDates(value) {
  return String(value || '').split(/[\n,; ]+/).map((item) => item.trim()).filter(Boolean);
}

function scheduleWhen(schedule) {
  if (schedule.scheduleMode === 'dates') return (schedule.specificDates || []).map(formatDate).join(', ') || 'Datas específicas';
  return (schedule.days || []).map((day) => dayLabels[day]).join(', ');
}

function formatDate(value) {
  const [year, month, day] = String(value).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function mentionLabelForToken(token, message) {
  const mentionToken = String(token || '').replace(/^@/, '');
  const mentions = Array.isArray(message?.mentions) ? message.mentions : [];
  const match = mentions.find((mention) => {
    const keys = [mention.id, mention.token, mention.number, cleanWhatsAppId(mention.id), cleanWhatsAppId(mention.number)].filter(Boolean);
    return keys.some((key) => String(key).includes(mentionToken) || mentionToken.includes(String(key)));
  });
  if (!match?.name) return token;
  return `<span class="mention">@${escapeHtml(match.name)}</span>`;
}

function formatWhatsAppText(value, message = null) {
  let text = escapeHtml(value);
  if (Array.isArray(message?.mentions) && message.mentions.length) {
    text = text.replace(/@\d{5,}(?:@lid|@c\.us)?/g, (token) => mentionLabelForToken(token, message));
  }
  text = text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  text = text.replace(/```([\s\S]*?)```/g, '<code>$1</code>');
  text = text.replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,!?:;])/g, '$1<strong>$2</strong>');
  text = text.replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s).,!?:;])/g, '$1<em>$2</em>');
  text = text.replace(/(^|[\s(])~([^~\n]+)~(?=$|[\s).,!?:;])/g, '$1<s>$2</s>');
  return text.replace(/\n/g, '<br>');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

bootstrap().catch((error) => toast(error.message));
