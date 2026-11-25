const app = document.querySelector('#app');
const APP_VERSION = '1.3';

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

const dayShortLabels = { sun: 'Dom', mon: 'Seg', tue: 'Ter', wed: 'Qua', thu: 'Qui', fri: 'Sex', sat: 'Sáb' };
const dayKeysByIndex = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const iconPaths = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.6c1.9.7 3.1 2.6 3.5 5.4"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  plug: '<path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0zM12 16v5"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.1-8 9-4.6-.9-8-4.5-8-9V6z"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3"/><path d="M4 4v4h4M20 20v-4h-4"/>',
  clip: '<path d="M20 11.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.4 8.4a1.7 1.7 0 0 1-2.4-2.4L15 7"/>',
  mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  pin: '<path d="M9 4h6l-1 6 4 3H6l4-3zM12 13v7"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  filter: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
  bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
  italic: '<path d="M10 5h8M6 19h8M14 5l-4 14"/>',
  strike: '<path d="M4 12h16M16 7a4 3 0 0 0-8 0c0 4 8 2.5 8 7a4 3 0 0 1-8 0"/>'
};

function icon(name, size = 18) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || ''}</svg>`;
}

function initialsOf(value, fallback = '?') {
  const parts = String(value || '').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

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
  scheduleView: 'all',
  scheduleStatusFilter: 'all',
  conversationSearch: '',
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
  integrations: null,
  integrationEnvironment: 'production',
  actionMessage: null,
  selectedDates: [],
  selectedDatesScheduleId: null
};

const changelog = [
  {
    version: '1.3',
    title: 'Nova interface',
    items: [
      'Menu lateral com ícones, seções e status do WhatsApp sempre visível.',
      'Agendamentos em linha do tempo, com indicadores do dia, próximo envio e taxa de sucesso.',
      'Formulário de agendamento em três passos, com dias da semana em botões e prévia da mensagem no WhatsApp.',
      'Filtros rápidos por status e visualização de hoje ou de todos os agendamentos.',
      'Datas específicas e trocas de filtro sem perder o texto já digitado no formulário.',
      'Conversas com busca, horário da última mensagem, divisores por dia e aviso do próximo envio agendado.',
      'Estatísticas com gráfico da janela de atividade (primeira e última mensagem) por participante.',
      'Tela de conexão do WhatsApp com instruções passo a passo.',
      'Passo a passo inicial para conectar, revisar contatos e criar o primeiro agendamento.',
      'Navegação inferior no celular e tema claro revisado.'
    ]
  },
  {
    version: '1.2',
    title: 'Central de integrações gUMperformance',
    items: [
      'Nome do bot opcional nas integrações, aplicado automaticamente antes das mensagens enviadas pelo gUMperformance.',
      'Janela antirrepetição configurável para impedir cobranças consecutivas sobre o mesmo evento.',
      'Confirmação de entrega ampliada para impedir reenvios quando o WhatsApp demora mais de 15 segundos para responder.',
      'Deduplicação persistente por evento, inclusive quando o horário dinâmico altera o texto da mensagem.',
      'Correção de concorrência no histórico para impedir que alertas simultâneos apaguem confirmações anteriores e sejam reenviados.',
      'Deduplicação compartilhada entre produção e beta para que o mesmo evento operacional gere apenas uma cobrança.',
      'Reconciliação antes de tentativas automáticas: o gUM consulta o receptor e bloqueia o reenvio enquanto o evento já estiver em processamento.',
      'Bloqueio preventivo dos disparos quando o histórico antirrepetição estiver ilegível ou indisponível.',
      'Trava atômica persistente criada antes do envio: cada ocorrência pode gerar no máximo uma mensagem, mesmo após reinícios ou perda do histórico principal.',
      'Repetição automática desativada por padrão e disponível somente por uma opção explícita no painel.',
      'Corte temporal de ativação para impedir o envio em massa de tarefas, cards e entradas atrasadas anteriores à integração.',
      'Identificação semântica de tarefas e cards para impedir duplicação quando identificadores internos forem regenerados.',
      'Tratamento mais natural dos colaboradores, utilizando apenas o primeiro nome e corrigindo nomes totalmente em maiúsculas.',
      'Variáveis de horário compatíveis com grafias acentuadas e não acentuadas, sempre preenchidas com o horário real.',
      'Assinatura opcional do bot aplicada tanto na origem quanto no receptor, sem risco de nome duplicado.',
      'Resolução ampliada de fotos de contatos, incluindo identificadores LID, número telefônico e miniatura local do WhatsApp.',
      'Compositor de respostas isolado do polling e das mensagens em tempo real para impedir perda de caracteres durante a digitação.',
      'Correção definitiva do campo de resposta para impedir perda de letras durante atualizações em tempo real.',
      'Leitura resiliente das mensagens para que um item incompatível não impeça a abertura da conversa.',
      'Carregamento de fotos de perfil aprimorado, com suporte aos identificadores atuais do WhatsApp e cache controlado.',
      'Correção de compatibilidade na leitura de grupos e conversas para impedir que um chat inconsistente bloqueie toda a sincronização.',
      'Novo menu Integrações exclusivo para o usuário principal.',
      'Monitoramento separado dos ambientes gUMperformance e gUMperformance beta.',
      'Indicadores de disponibilidade, execução, última verificação, eventos enviados e pendências.',
      'Configuração visual de intervalo de monitoramento, tolerância de atraso e horário padrão de entrada.',
      'Roteamento de mensagens por pessoa, tipo de evento, departamento ou grupos padrão.',
      'Prioridade de destino por pessoa para garantir que cada colaborador seja notificado no grupo correto.',
      'Modelos de mensagem personalizáveis com variáveis dinâmicas para cada funcionalidade do gUMperformance.',
      'Configuração individual dos eventos de tarefa atrasada, card pendente, login atrasado, meta atingida, resposta administrativa e advertência.',
      'Envio de mensagem de teste com confirmação e execução manual de verificação de eventos.',
      'Histórico recente e apresentação de falhas diretamente no painel.',
      'Chave secreta mantida exclusivamente no servidor, sem exposição no navegador.'
    ]
  },
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
  if (state.tab === 'whatsapp') renderContentQueued();
  if (state.tab === 'schedules') requestAnimationFrame(renderScheduleListPreservingForm);
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
    if (isReplyEditingActive()) {
      updateNav();
      toast(notification);
      return;
    }
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
      <small>${typeof message === 'object' ? 'Nova mensagem' : 'Aviso do painel'}</small>
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

function brandMarkup() {
  return `
    <div class="brand">
      <span class="brand-mark">${icon('check', 18)}</span>
      <div class="brand-copy">
        ${logoMarkup()}
        <span>Gestor de equipes</span>
      </div>
    </div>
  `;
}

function renderAuth() {
  const isSetup = !state.hasUsers;
  app.innerHTML = `
    <section class="auth-shell">
      <div class="auth-backdrop" aria-hidden="true"></div>
      <div class="auth-center">
        <div class="auth-brand">
          <span class="auth-mark">${icon('check', 28)}</span>
          ${logoMarkup('large')}
        </div>
        <form class="auth-panel form" id="authForm">
          <div class="auth-heading">
            <h1>${isSetup ? 'Criar administrador' : 'Bem-vindo de volta'}</h1>
            <p class="muted">${isSetup ? 'Configure o primeiro acesso do painel.' : 'Entre para gerenciar sua equipe.'}</p>
          </div>
          ${isSetup ? '<label>Nome<input name="name" required minlength="2" autocomplete="name"></label>' : ''}
          <label>E-mail<input name="email" type="text" inputmode="email" required autocomplete="email" placeholder="seu@email.com"></label>
          <label>
            <span class="label-row">Senha<button class="link-button" id="togglePassword" type="button" aria-pressed="false">Mostrar</button></span>
            <input name="password" type="password" required minlength="6" autocomplete="${isSetup ? 'new-password' : 'current-password'}" placeholder="Sua senha">
          </label>
          <button class="primary auth-submit" type="submit">${isSetup ? 'Criar e entrar' : 'Entrar'}</button>
          <p class="auth-secure">${icon('shield', 14)} Acesso restrito a administradores</p>
        </form>
        <p class="auth-foot">Gestor de equipes · Versão ${APP_VERSION} · <button class="link-button" id="changelogButton" type="button">Novidades</button></p>
      </div>
    </section>
  `;

  document.querySelector('#changelogButton')?.addEventListener('click', showChangelog);
  document.querySelector('#togglePassword')?.addEventListener('click', (event) => {
    event.preventDefault();
    const input = document.querySelector('#authForm input[name="password"]');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    event.currentTarget.textContent = show ? 'Ocultar' : 'Mostrar';
    event.currentTarget.setAttribute('aria-pressed', String(show));
  });
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

function navSections() {
  return [
    {
      label: 'Operação',
      items: [
        { tab: 'schedules', label: 'Agendamentos', icon: 'calendar' },
        { tab: 'conversations', label: 'Conversas', icon: 'chat' },
        { tab: 'contacts', label: 'Contatos', icon: 'users' },
        { tab: 'whatsapp', label: 'Conexão WhatsApp', icon: 'qr' }
      ]
    },
    {
      label: 'Análise',
      items: [
        { tab: 'stats', label: 'Estatísticas', icon: 'chart' },
        { tab: 'logs', label: 'Histórico de envios', icon: 'history' }
      ]
    },
    {
      label: 'Gestão',
      items: [
        ...(state.user?.isOwner ? [{ tab: 'integrations', label: 'Integrações', icon: 'plug' }] : []),
        { tab: 'users', label: 'Administradores', icon: 'shield' }
      ]
    }
  ];
}

function themeSwitchMarkup() {
  return `
    <div class="theme-switch" role="group" aria-label="Tema">
      <button class="${state.theme === 'dark' ? 'active' : ''}" data-theme="dark" type="button">${icon('moon', 15)}<span>Escuro</span></button>
      <button class="${state.theme === 'light' ? 'active' : ''}" data-theme="light" type="button">${icon('sun', 15)}<span>Claro</span></button>
    </div>
  `;
}

function renderShell() {
  const sections = navSections();
  const primaryMobile = ['schedules', 'conversations', 'contacts', 'stats'];
  const allItems = sections.flatMap((section) => section.items);
  app.innerHTML = `
    <section class="app-shell">
      <aside class="sidebar">
        ${brandMarkup()}
        <div class="wa-card" id="sidebarWaCard">
          <span class="wa-dot" id="sidebarWaDot"></span>
          <div class="wa-card-copy">
            <strong id="liveStatus" class="${statusClass()}">${whatsappStatusText()}</strong>
            <span id="sidebarWaNumber">${escapeHtml(sidebarWhatsAppDetail())}</span>
          </div>
        </div>
        <nav class="nav" aria-label="Principal">
          ${sections.map((section) => `
            <span class="nav-section">${section.label}</span>
            ${section.items.map((item) => navButton(item.tab, item.label, item.icon)).join('')}
          `).join('')}
        </nav>
        <div class="sidebar-footer">
          ${themeSwitchMarkup()}
          <button class="link-button sidebar-version" data-open-changelog type="button">Versão ${APP_VERSION} · Novidades</button>
        </div>
      </aside>
      <section class="main">
        <header class="live-strip">
          <span class="live-dot">Ao vivo · <span id="liveClock"></span></span>
          <div class="header-actions">
            <button class="link-button header-changelog" id="changelogButton" type="button">Novidades v${APP_VERSION}</button>
            <div class="account">
              <button class="account-button" id="accountButton" type="button" aria-haspopup="true">
                ${avatarMarkup(state.user)}
                <span>${escapeHtml(state.user.name)}</span>
                ${icon('down', 15)}
              </button>
              <div class="account-menu" id="accountMenu" hidden>
                <form class="form account-form" id="accountForm">
                  <strong class="account-menu-title">Minha conta</strong>
                  <label>Avatar<input name="avatar" type="file" accept="image/*"></label>
                  <label>Nome<input name="name" value="${escapeHtml(state.user.name)}" required></label>
                  <label>E-mail<input name="email" type="email" value="${escapeHtml(state.user.email)}" required></label>
                  <label>Nova senha<input name="password" type="password" minlength="6" placeholder="Deixe vazio para manter"></label>
                  <button class="primary" type="submit">Salvar conta</button>
                </form>
                <button class="danger full-button" id="logoutButton" type="button">${icon('logout', 16)} Sair</button>
              </div>
            </div>
          </div>
        </header>
        <div id="mainContent"></div>
      </section>
      <nav class="mobile-tabbar" aria-label="Navegação">
        ${allItems.filter((item) => primaryMobile.includes(item.tab)).map((item) => mobileTabButton(item)).join('')}
        <button class="mobile-tab" id="mobileMoreButton" type="button" aria-expanded="false">${icon('more', 22)}<span>Mais</span></button>
      </nav>
      <div class="mobile-more" id="mobileMore" hidden>
        <div class="mobile-more-panel">
          ${allItems.filter((item) => !primaryMobile.includes(item.tab)).map((item) => `
            <button class="mobile-more-item" data-tab="${item.tab}" type="button">${icon(item.icon, 20)}<span>${item.label}</span></button>
          `).join('')}
          ${themeSwitchMarkup()}
          <button class="link-button" data-open-changelog type="button">Versão ${APP_VERSION} · Novidades</button>
        </div>
      </div>
    </section>
  `;

  bindShell();
  updateLiveClock();
  updateLiveStatus();
}

function mobileTabButton(item) {
  const short = { schedules: 'Agenda', conversations: 'Conversas', contacts: 'Contatos', stats: 'Estatísticas' }[item.tab] || item.label;
  return `<button class="mobile-tab" data-tab="${item.tab}" type="button">${icon(item.icon, 22)}<span>${short}</span></button>`;
}

function sidebarWhatsAppDetail() {
  if (state.whatsapp.status === 'ready') {
    return state.whatsapp.connectedNumber ? formatPhone(state.whatsapp.connectedNumber) : `${state.whatsapp.groups?.length || 0} grupo(s) disponíveis`;
  }
  if (state.whatsapp.status === 'qr') return 'Leia o QR Code para conectar';
  if (state.whatsapp.status === 'authenticated') return 'Sincronizando conversas';
  if (state.whatsapp.status === 'loading') return 'Iniciando o navegador';
  return 'Abra Conexão WhatsApp';
}

function renderContent() {
  const target = document.querySelector('#mainContent');
  if (!target) return;
  if (state.tab !== 'conversations') replyCompositionActive = false;
  updateNav();
  updateLiveStatus();

  const activeReply = document.querySelector('#replyForm textarea[name="message"]');
  const composerBelongsToSelection = activeReply?.dataset.conversationId === state.selectedConversationId;
  if (state.tab === 'conversations' && composerBelongsToSelection && isReplyEditingActive()) {
    renderConversationListOnly();
    renderConversationMessagesOnly({ scrollToBottom: false });
    return;
  }

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
  const latestDraft = storedReplyDraft(draft.conversationId);
  if (latestDraft) draft = latestDraft;
  const form = document.querySelector('#replyForm');
  if (!form) return;
  if (form.elements.message) {
    const valueStillMatches = form.elements.message.value === draft.message;
    if (valueStillMatches && Number.isInteger(draft.selectionStart) && Number.isInteger(draft.selectionEnd)) {
      form.elements.message.setSelectionRange(draft.selectionStart, draft.selectionEnd);
    }
    if (valueStillMatches && draft.wasFocused) form.elements.message.focus({ preventScroll: true });
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
  if (isReplyEditingActive()) return;
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

function navButton(tab, label, iconName = 'calendar') {
  const badge = tab === 'conversations' && state.pendingConversationAlerts
    ? `<span class="nav-badge">${state.pendingConversationAlerts}</span>`
    : '';
  return `<button class="${state.tab === tab ? 'active' : ''}" data-tab="${tab}" type="button">${icon(iconName)}<span class="nav-label">${label}</span><span class="nav-count" data-nav-count="${tab}"></span>${badge}</button>`;
}

function navCountFor(tab) {
  if (tab === 'schedules') {
    const active = state.schedules.filter((schedule) => schedule.active).length;
    return active ? { text: String(active), tone: '' } : null;
  }
  if (tab === 'logs') {
    const failures = todaysLogs().filter((log) => log.status === 'failed').length;
    return failures ? { text: String(failures), tone: 'is-danger' } : null;
  }
  return null;
}

function updateNav() {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === state.tab);
    if (button.dataset.tab === state.tab) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
    const existingBadge = button.querySelector('.nav-badge');
    if (existingBadge) existingBadge.remove();
    if (button.dataset.tab === 'conversations' && state.pendingConversationAlerts > 0) {
      button.insertAdjacentHTML('beforeend', `<span class="nav-badge">${state.pendingConversationAlerts}</span>`);
      button.classList.add('has-alerts');
    } else {
      button.classList.remove('has-alerts');
    }
  });
  document.querySelectorAll('[data-nav-count]').forEach((element) => {
    const count = navCountFor(element.dataset.navCount);
    element.textContent = count?.text || '';
    element.className = `nav-count ${count?.tone || ''}`;
  });
  const moreButton = document.querySelector('#mobileMoreButton');
  if (moreButton) {
    const inMore = !['schedules', 'conversations', 'contacts', 'stats'].includes(state.tab);
    moreButton.classList.toggle('active', inMore);
  }
}

function setMobileMore(open) {
  const sheet = document.querySelector('#mobileMore');
  const button = document.querySelector('#mobileMoreButton');
  if (!sheet) return;
  sheet.hidden = !open;
  button?.setAttribute('aria-expanded', String(open));
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
      setMobileMore(false);
      if (state.tab === button.dataset.tab) return;
      state.tab = button.dataset.tab;
      state.editingId = null;
      window.scrollTo({ top: 0 });
      if (state.tab === 'conversations') {
        state.pendingConversationAlerts = 0;
        renderContentQueued();
        setTimeout(() => refreshConversations({ silent: true, preserveScroll: true, preserveDraft: true }), 0);
        return;
      }
      if (state.tab === 'integrations') {
        renderContentQueued();
        setTimeout(loadIntegrations, 0);
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

  document.querySelector('#mobileMoreButton')?.addEventListener('click', () => {
    setMobileMore(document.querySelector('#mobileMore')?.hidden ?? false);
  });
  document.querySelector('#mobileMore')?.addEventListener('click', (event) => {
    if (event.target.id === 'mobileMore') setMobileMore(false);
  });
  if (!document.body.dataset.shellListeners) {
    document.body.dataset.shellListeners = 'true';
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      setMobileMore(false);
      const menu = document.querySelector('#accountMenu');
      if (menu) menu.hidden = true;
    });
    document.addEventListener('click', (event) => {
      const menu = document.querySelector('#accountMenu');
      if (menu && !menu.hidden && !event.target.closest('.account')) menu.hidden = true;
    });
  }

  document.querySelector('#changelogButton')?.addEventListener('click', showChangelog);
  document.querySelectorAll('[data-open-changelog]').forEach((button) => {
    button.addEventListener('click', () => {
      setMobileMore(false);
      showChangelog();
    });
  });
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
    document.querySelector('.account-button').innerHTML = `${avatarMarkup(state.user)}<span>${escapeHtml(state.user.name)}</span>${icon('down', 15)}`;
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

function whatsappTone() {
  if (state.whatsapp.status === 'ready') return 'ok';
  if (state.whatsapp.status === 'disconnected' || state.whatsapp.status === 'error') return 'danger';
  return 'warn';
}

function updateLiveStatus() {
  const status = document.querySelector('#liveStatus');
  if (!status) return;
  status.textContent = whatsappStatusText();
  status.className = statusClass();
  const card = document.querySelector('#sidebarWaCard');
  if (card) card.dataset.tone = whatsappTone();
  const detail = document.querySelector('#sidebarWaNumber');
  if (detail) detail.textContent = sidebarWhatsAppDetail();
}

async function loadIntegrations({ silent = false } = {}) {
  try {
    state.integrations = await api('/api/admin/integrations');
    if (state.tab === 'integrations') renderContent();
    if (!silent) toast('Integrações atualizadas.');
  } catch (error) {
    if (!silent) toast(error.message);
  }
}

function selectedIntegrationTarget() {
  return state.integrations?.targets?.find((target) => target.id === state.integrationEnvironment) || null;
}

function integrationTimestamp(value) {
  if (!value) return 'Ainda não executado';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

function integrationGroupName(groupId) {
  return state.integrations?.whatsapp?.groups?.find((group) => group.id === groupId)?.name || groupId;
}

function integrationGroupCheckboxes(groups, selectedIds, attributes) {
  const selected = new Set(selectedIds || []);
  if (!groups.length) return '<div class="empty compact-empty">Nenhum grupo carregado no WhatsApp.</div>';
  return `<div class="integration-group-grid">${groups.map((group) => `
    <label class="integration-group-option">
      <input type="checkbox" value="${escapeHtml(group.id)}" ${selected.has(group.id) ? 'checked' : ''} ${attributes}>
      <span>${escapeHtml(group.name)}</span>
    </label>
  `).join('')}</div>`;
}

function integrationMappingList(mapping, labels, kind) {
  const rows = Object.entries(mapping || {}).filter(([, groupIds]) => groupIds?.length);
  if (!rows.length) return '<p class="muted integration-empty-mapping">Nenhum vínculo específico cadastrado.</p>';
  return `<div class="integration-mapping-list">${rows.map(([key, groupIds]) => `
    <div class="integration-mapping-row">
      <div>
        <strong>${escapeHtml(labels[key] || key)}</strong>
        <span>${groupIds.map((groupId) => escapeHtml(integrationGroupName(groupId))).join(' · ')}</span>
      </div>
      <button class="danger compact-button" type="button" data-remove-integration-mapping="${escapeHtml(kind)}" data-mapping-key="${escapeHtml(key)}">Remover</button>
    </div>
  `).join('')}</div>`;
}

function integrationsTab() {
  if (!state.user?.isOwner) return '<div class="empty">Apenas o usuário principal pode configurar integrações.</div>';
  if (!state.integrations) {
    return `<div class="integration-loading panel"><span class="status">Carregando ambientes de integração</span></div>`;
  }

  const target = selectedIntegrationTarget() || state.integrations.targets?.[0];
  const groups = state.integrations.whatsapp?.groups || [];
  const config = target?.config || {};
  const status = target?.status || {};
  const catalog = target?.catalog || { users: [], departments: [], events: [] };
  const userLabels = Object.fromEntries(catalog.users.map((user) => [user.id, `${user.name} · ${user.department}`]));
  const departmentLabels = Object.fromEntries(catalog.departments.map((department) => [department, department]));

  return `
    <div class="topbar integration-topbar">
      <div>
        <h1>Integrações</h1>
        <p>Configure automações do gUMperformance e do ambiente beta em um único painel.</p>
      </div>
      <button class="secondary" id="refreshIntegrations" type="button">Atualizar</button>
    </div>

    <section class="integration-summary-grid">
      <article class="panel integration-summary-card">
        <span class="integration-kicker">WhatsApp do SuperVISOR</span>
        <strong>${escapeHtml(state.integrations.whatsapp?.connectedNumber || 'Número não identificado')}</strong>
        <span class="status ${state.integrations.whatsapp?.status === 'ready' ? 'status-success' : 'status-danger'}">${state.integrations.whatsapp?.status === 'ready' ? 'Conectado' : 'Indisponível'}</span>
      </article>
      <article class="panel integration-summary-card">
        <span class="integration-kicker">Segredo compartilhado</span>
        <strong>${state.integrations.configuredSecret ? 'Configurado no servidor' : 'Configuração pendente'}</strong>
        <span class="status ${state.integrations.configuredSecret ? 'status-success' : 'status-danger'}">${state.integrations.configuredSecret ? 'Protegido' : 'Ausente'}</span>
      </article>
      <article class="panel integration-summary-card">
        <span class="integration-kicker">Grupos disponíveis</span>
        <strong>${groups.length}</strong>
        <span class="muted">Carregados pela sessão atual</span>
      </article>
    </section>

    <div class="integration-environments" role="tablist">
      ${state.integrations.targets.map((item) => `
        <button class="integration-environment ${item.id === target?.id ? 'active' : ''}" type="button" data-integration-environment="${item.id}">
          <span>${escapeHtml(item.name)}</span>
          <small class="${item.reachable ? 'online' : 'offline'}">${item.reachable ? (item.config?.enabled ? 'Ativa' : 'Disponível') : 'Fora do ar'}</small>
        </button>
      `).join('')}
    </div>

    ${!target?.reachable ? `
      <section class="panel integration-offline">
        <span class="status status-danger">Ambiente indisponível</span>
        <h2>${escapeHtml(target?.name || 'Ambiente')}</h2>
        <p>${escapeHtml(target?.error || 'Não foi possível consultar este ambiente.')}</p>
        <code>${escapeHtml(target?.baseUrl || '')}</code>
      </section>
    ` : `
      <section class="integration-health-grid">
        <article class="panel metric-card"><span>Monitor</span><strong>${status.running ? 'Executando' : 'Parado'}</strong></article>
        <article class="panel metric-card"><span>Última verificação</span><strong>${escapeHtml(integrationTimestamp(status.lastScanAt))}</strong></article>
        <article class="panel metric-card"><span>Eventos enviados</span><strong>${Number(status.sent || 0)}</strong></article>
        <article class="panel metric-card"><span>Pendências</span><strong class="${status.pending ? 'danger-text' : ''}">${Number(status.pending || 0)}</strong></article>
      </section>
      ${status.lastError ? `<div class="integration-error"><strong>Última falha:</strong> ${escapeHtml(status.lastError)}</div>` : ''}

      <form class="integration-config" id="integrationConfigForm">
        <section class="panel integration-section">
          <div class="panel-head integration-section-head">
            <div><span class="integration-kicker">Operação</span><h2>Ativação e frequência</h2></div>
            <label class="integration-switch"><input name="enabled" type="checkbox" ${config.enabled ? 'checked' : ''}><span></span><strong>Integração ativa</strong></label>
          </div>
          <div class="integration-fields">
            <label>Intervalo de verificação (segundos)<input name="intervalSeconds" type="number" min="15" max="300" value="${Number(config.intervalSeconds || 30)}"></label>
            <label>Tolerância para atrasos (minutos)<input name="graceMinutes" type="number" min="0" max="120" value="${Number(config.graceMinutes || 5)}"></label>
            <label>Horário padrão de entrada<input name="expectedLoginTime" type="time" value="${escapeHtml(config.expectedLoginTime || '09:00')}"></label>
            <label>Nome do bot (opcional)<input name="botName" maxlength="80" placeholder="SuperVISOR" value="${escapeHtml(config.botName || '')}"></label>
            <div class="integration-repeat-field">
              <span class="field-title">Repetição de cobranças</span>
              <label class="integration-switch"><input name="repeatEnabled" type="checkbox" ${config.repeatEnabled ? 'checked' : ''}><span></span><strong>Permitir repetição automática</strong></label>
            </div>
            <label>Intervalo entre repetições (minutos)<input name="repeatMinutes" type="number" min="1" max="1440" value="${Number(config.repeatMinutes || config.cooldownMinutes || 360)}" ${config.repeatEnabled ? '' : 'disabled'}></label>
          </div>
        </section>

        <section class="panel integration-section">
          <div class="integration-section-head"><div><span class="integration-kicker">Destino de segurança</span><h2>Grupos padrão</h2></div><p>Usados quando não existir vínculo mais específico.</p></div>
          ${integrationGroupCheckboxes(groups, config.defaultGroupIds, 'data-integration-default-group')}
        </section>

        <section class="panel integration-section">
          <div class="integration-section-head"><div><span class="integration-kicker">Roteamento individual</span><h2>Pessoas e grupos</h2></div><p>O vínculo por pessoa tem prioridade sobre todas as demais regras.</p></div>
          <div class="integration-mapping-builder">
            <select id="integrationPerson"><option value="">Selecionar pessoa</option>${catalog.users.map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} · ${escapeHtml(user.department)}</option>`).join('')}</select>
            <select id="integrationPersonGroup"><option value="">Selecionar grupo</option>${groups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`).join('')}</select>
            <button class="secondary" id="addPersonIntegrationGroup" type="button">Adicionar vínculo</button>
          </div>
          ${integrationMappingList(config.groupIdsByUser, userLabels, 'user')}
        </section>

        <section class="panel integration-section">
          <div class="integration-section-head"><div><span class="integration-kicker">Roteamento por equipe</span><h2>Departamentos e grupos</h2></div><p>Aplicado quando a pessoa não possuir um vínculo individual.</p></div>
          <div class="integration-mapping-builder">
            <select id="integrationDepartment"><option value="">Selecionar departamento</option>${catalog.departments.map((department) => `<option value="${escapeHtml(department)}">${escapeHtml(department)}</option>`).join('')}</select>
            <select id="integrationDepartmentGroup"><option value="">Selecionar grupo</option>${groups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`).join('')}</select>
            <button class="secondary" id="addDepartmentIntegrationGroup" type="button">Adicionar vínculo</button>
          </div>
          ${integrationMappingList(config.groupIdsByDepartment, departmentLabels, 'department')}
        </section>

        <section class="integration-events-section">
          <div class="integration-section-head"><div><span class="integration-kicker">Automações</span><h2>Eventos e mensagens</h2></div><p>Ative recursos, personalize o texto e escolha grupos exclusivos.</p></div>
          <div class="integration-event-list">
            ${catalog.events.map((eventDefinition) => {
              const eventGroups = config.groupIdsByEvent?.[eventDefinition.id] || [];
              return `
                <details class="panel integration-event-card" ${eventDefinition.id === 'task_late' ? 'open' : ''}>
                  <summary>
                    <div><strong>${escapeHtml(eventDefinition.label)}</strong><span>${escapeHtml(eventDefinition.description)}</span></div>
                    <label class="integration-switch" onclick="event.stopPropagation()"><input type="checkbox" data-integration-event-enabled="${escapeHtml(eventDefinition.id)}" ${config.enabledEvents?.[eventDefinition.id] !== false ? 'checked' : ''}><span></span></label>
                  </summary>
                  <div class="integration-event-body">
                    <label>Modelo da mensagem<textarea rows="5" data-integration-template="${escapeHtml(eventDefinition.id)}">${escapeHtml(config.messageTemplates?.[eventDefinition.id] || '')}</textarea></label>
                    <div class="integration-variables">${eventDefinition.variables.map((variable) => `<code>{{${escapeHtml(variable)}}}</code>`).join('')}</div>
                    <div><span class="field-title">Grupos exclusivos deste evento</span>${integrationGroupCheckboxes(groups, eventGroups, `data-integration-event-group="${escapeHtml(eventDefinition.id)}"`)}</div>
                  </div>
                </details>
              `;
            }).join('')}
          </div>
        </section>

        <div class="integration-savebar">
          <span>Alterações só entram em vigor depois de salvar.</span>
          <button class="primary" type="submit">Salvar configuração de ${escapeHtml(target.name)}</button>
        </div>
      </form>

      <section class="integration-bottom-grid">
        <article class="panel integration-test-panel">
          <div><span class="integration-kicker">Teste controlado</span><h2>Enviar mensagem de validação</h2></div>
          <label>Grupo<select id="integrationTestGroup"><option value="">Selecionar grupo</option>${groups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`).join('')}</select></label>
          <label>Mensagem<textarea id="integrationTestMessage" rows="4">*${escapeHtml(target.name)}*\nIntegração com o SuperVISOR validada com sucesso.</textarea></label>
          <button class="secondary" id="testIntegration" type="button">Enviar teste</button>
          <button class="secondary" id="scanIntegration" type="button">Verificar eventos agora</button>
        </article>
        <article class="panel integration-history-panel">
          <div><span class="integration-kicker">Atividade recente</span><h2>Últimos eventos</h2></div>
          <div class="integration-event-history">
            ${(status.recentEvents || []).slice(0, 10).map((event) => `
              <div title="${escapeHtml(event.lastError || '')}"><span class="status ${event.status === 'sent' ? 'status-success' : 'status-danger'}">${event.status === 'sent' ? 'Enviado' : event.status === 'failed' ? 'Falhou' : event.status === 'delivery_unknown' ? 'Revisar' : 'Pendente'}</span><strong>${escapeHtml(event.type || 'Evento')}</strong><small>${escapeHtml(integrationTimestamp(event.sentAt || event.createdAt || event.occurredAt))}</small></div>
            `).join('') || '<div class="empty compact-empty">Nenhum evento processado neste ambiente.</div>'}
          </div>
        </article>
      </section>
    `}
  `;
}

function currentTab() {
  if (state.tab === 'whatsapp') return whatsappTab();
  if (state.tab === 'contacts') return contactsTab();
  if (state.tab === 'conversations') return conversationsTab();
  if (state.tab === 'stats') return statsTab();
  if (state.tab === 'integrations') return integrationsTab();
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
  if (state.whatsapp.status === 'disconnected' || state.whatsapp.status === 'error') return 'status status-danger';
  return state.whatsapp.status === 'ready' ? 'status' : 'status status-partial';
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

function pageHeader(title, subtitle, actions = '') {
  return `
    <div class="topbar">
      <div class="topbar-copy">
        <h1>${title}</h1>
        ${subtitle ? `<p class="muted">${subtitle}</p>` : ''}
      </div>
      ${actions ? `<div class="topbar-actions">${actions}</div>` : ''}
    </div>
  `;
}

function emptyState(message, iconName = 'calendar', extra = '') {
  return `<div class="empty"><span class="empty-icon">${icon(iconName, 22)}</span><span class="empty-text">${message}</span>${extra}</div>`;
}

function whatsappTab() {
  const statusText = whatsappStatusText();
  const ready = whatsappIsReady();
  const tone = whatsappTone();
  return `
    ${pageHeader('Conexão WhatsApp', 'Conecte o número do bot e mantenha a lista de grupos atualizada.', `<span class="${statusClass()}">${statusText}</span>`)}
    <div class="wa-layout">
      <section class="panel wa-connect" data-tone="${tone}">
        <div class="wa-qr-frame ${state.whatsapp.qrCodeDataUrl ? 'has-qr' : ''}">
          ${
            state.whatsapp.qrCodeDataUrl
              ? `<img src="${state.whatsapp.qrCodeDataUrl}" alt="QR Code do WhatsApp">`
              : `<span class="wa-qr-placeholder">${icon(ready ? 'check' : 'qr', 40)}</span>`
          }
        </div>
        <div class="wa-connect-copy">
          <span class="wa-state"><span class="wa-dot"></span>${statusText}</span>
          ${ready
            ? `<h2>WhatsApp conectado</h2>
               ${state.whatsapp.connectedNumber ? `<p class="wa-number">${escapeHtml(formatPhone(state.whatsapp.connectedNumber))}</p>` : ''}
               <p class="muted">Os agendamentos serão enviados por este número. A sessão fica salva neste servidor.</p>`
            : `<h2>${state.whatsapp.qrCodeDataUrl ? 'Escaneie com o WhatsApp' : 'Aguardando o QR Code'}</h2>
               <ol class="wa-steps">
                 <li>Abra o WhatsApp no celular que vai enviar as mensagens</li>
                 <li>Toque em <strong>Mais opções › Aparelhos conectados</strong></li>
                 <li>Toque em <strong>Conectar um aparelho</strong> e aponte para o código</li>
               </ol>`}
          ${state.whatsapp.status === 'authenticated' ? '<p class="notice notice-warn">O QR Code foi aceito, mas o WhatsApp Web ainda está sincronizando. Os grupos aparecem quando o status mudar para Conectado.</p>' : ''}
          ${state.whatsapp.error ? `<p class="notice notice-danger"><strong>Erro técnico:</strong> ${escapeHtml(state.whatsapp.error)}</p>` : ''}
          <div class="row wa-actions">
            <button class="secondary" id="restartWhatsApp" type="button">${icon('refresh', 16)} Reiniciar conexão</button>
            <button class="secondary" id="newQrWhatsApp" type="button">${icon('qr', 16)} Gerar novo QR</button>
            <button class="danger" id="disconnectWhatsApp" type="button" ${state.whatsapp.status === 'disconnected' ? 'disabled' : ''}>Desconectar</button>
          </div>
          <p class="fine-print">Use apenas com autorização da empresa e respeitando as regras do WhatsApp.</p>
        </div>
      </section>
      <section class="panel whatsapp-groups-panel">
        <div class="row panel-head whatsapp-groups-head">
          <div>
            <h2>Grupos</h2>
            <p class="muted">${state.whatsapp.groups.length} grupo(s) disponíveis para agendamentos.</p>
          </div>
          <button class="secondary refresh-groups-button" id="refreshGroups" type="button" ${ready ? '' : 'disabled'}>${icon('refresh', 16)} Atualizar</button>
        </div>
        ${state.actionMessage ? `<p class="notice">${escapeHtml(state.actionMessage)}</p>` : ''}
        ${groupsList(false)}
      </section>
    </div>
  `;
}

function schedulesTab() {
  const editing = state.schedules.find((item) => item.id === state.editingId);
  const draft = state.scheduleDraft;
  const editDraft = editing && state.scheduleEditDraft?.id === editing.id ? state.scheduleEditDraft : null;
  const formSource = editing ? { ...editing, ...(editDraft || {}) } : draft;
  const schedules = filteredSchedules();
  const dateScope = editing?.id || 'new';
  if (state.selectedDatesScheduleId !== dateScope) {
    state.selectedDates = [...(formSource?.specificDates || [])];
    state.selectedDatesScheduleId = dateScope;
  }
  const selectedDates = getSelectedDates(formSource);
  const mode = formSource?.scheduleMode || 'weekly';
  const kpis = scheduleKpis();
  const nextId = kpis.next?.schedule.id || null;
  const today = new Date();
  const timeline = schedules
    .filter((schedule) => state.scheduleView !== 'today' || scheduleRunsOn(schedule, today))
    .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
  const advancedFilters = state.scheduleFilterType !== 'all' || state.scheduleFilterDay !== 'all' || Boolean(state.scheduleFilterDate);
  const statusCounts = {
    all: filteredSchedules({ ignoreStatus: true }).length,
    active: filteredSchedules({ ignoreStatus: true }).filter((item) => item.active).length,
    paused: filteredSchedules({ ignoreStatus: true }).filter((item) => !item.active).length
  };
  return `
    ${pageHeader('Agendamentos', 'Mensagens recorrentes para grupos e contatos.', `<a class="primary topbar-cta" href="#scheduleForm">${icon('plus', 16)} Novo agendamento</a>`)}
    ${onboardingCard()}
    <section class="kpi-grid" aria-label="Resumo">
      <article class="kpi">
        <span class="kpi-label">Próximo envio</span>
        <strong class="kpi-value ${kpis.next ? 'is-info' : ''}">${kpis.next ? escapeHtml(kpis.next.schedule.time) : '--:--'}</strong>
        <span class="kpi-sub">${kpis.next ? `${escapeHtml(kpis.next.schedule.title)} · ${escapeHtml(relativeRunLabel(kpis.next.date))}` : 'Nenhum envio ativo programado'}</span>
      </article>
      <article class="kpi">
        <span class="kpi-label">Agendamentos ativos</span>
        <strong class="kpi-value">${kpis.active}</strong>
        <span class="kpi-sub">${kpis.paused ? `${kpis.paused} pausado(s)` : 'Nenhum pausado'}</span>
      </article>
      <article class="kpi">
        <span class="kpi-label">Envios hoje</span>
        <strong class="kpi-value">${kpis.sentToday}</strong>
        <span class="kpi-sub ${kpis.failedToday ? 'is-danger' : ''}">${kpis.failedToday ? `${kpis.failedToday} falha(s) · veja o histórico` : 'Nenhuma falha hoje'}</span>
      </article>
      <article class="kpi">
        <span class="kpi-label">Sucesso nos últimos 7 dias</span>
        <strong class="kpi-value">${kpis.rate === null ? '—' : `${kpis.rate.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}</strong>
        ${kpis.rate === null ? '<span class="kpi-sub">Sem envios no período</span>' : `<span class="meter" aria-hidden="true"><span style="width:${kpis.rate}%"></span></span>`}
      </article>
    </section>
    <div class="schedules-layout">
      <section class="panel timeline-panel" aria-label="Agendamentos criados">
        <div class="timeline-head">
          <div>
            <h2>${state.scheduleView === 'today' ? `Hoje, ${escapeHtml(today.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }))}` : 'Todos os agendamentos'}</h2>
            <p class="muted">${timeline.length} de ${state.schedules.length} agendamento(s)</p>
          </div>
          <div class="seg" role="group" aria-label="Visualização">
            <button class="${state.scheduleView === 'today' ? 'active' : ''}" data-schedule-view="today" type="button">Hoje</button>
            <button class="${state.scheduleView !== 'today' ? 'active' : ''}" data-schedule-view="all" type="button">Todos</button>
          </div>
        </div>
        <div class="filter-chips" role="group" aria-label="Status">
          <button class="filter-chip ${state.scheduleStatusFilter === 'all' ? 'active' : ''}" data-schedule-status="all" type="button">Todos · ${statusCounts.all}</button>
          <button class="filter-chip ${state.scheduleStatusFilter === 'active' ? 'active' : ''}" data-schedule-status="active" type="button">Ativos · ${statusCounts.active}</button>
          <button class="filter-chip ${state.scheduleStatusFilter === 'paused' ? 'active' : ''}" data-schedule-status="paused" type="button">Pausados · ${statusCounts.paused}</button>
        </div>
        <details class="filters-details schedule-filter" ${advancedFilters ? 'open' : ''}>
          <summary>${icon('filter', 15)} Filtrar por destino ou data${advancedFilters ? ' <span class="dot-indicator"></span>' : ''}</summary>
          <div class="filters-grid">
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
        </details>
        <div class="timeline">
          ${timeline.length
            ? timeline.map((schedule) => scheduleItem(schedule, nextId)).join('')
            : emptyState(
              state.schedules.length
                ? (state.scheduleView === 'today' ? 'Nenhum agendamento para hoje com estes filtros.' : 'Nenhum agendamento encontrado para este filtro.')
                : 'Nenhum agendamento ainda. Crie o primeiro em Novo agendamento.',
              'calendar',
              state.scheduleView === 'today' && state.schedules.length ? '<button class="secondary" data-schedule-view="all" type="button">Ver todos</button>' : ''
            )}
        </div>
      </section>

      <section class="panel composer ${editing ? 'is-editing' : ''}" aria-label="${editing ? 'Editar agendamento' : 'Novo agendamento'}">
        <div class="composer-head">
          <h2>${editing ? 'Editar agendamento' : draft?.isCopy ? 'Novo agendamento (cópia)' : 'Novo agendamento'}</h2>
          ${editing ? '<span class="badge badge-info">Editando</span>' : ''}
        </div>
        <form class="form" id="scheduleForm" data-mode="${mode}">
          <fieldset class="composer-step">
            <legend><span class="step-num">1</span> Mensagem</legend>
            <label>Título interno<input name="title" required minlength="2" placeholder="Ex.: Bom dia, equipe" value="${escapeHtml(formSource?.title || '')}"></label>
            <label>Mensagem
              <textarea name="message" required rows="4" placeholder="Escreva a mensagem que será enviada">${escapeHtml(formSource?.message || '')}</textarea>
            </label>
            <div class="format-tools" role="group" aria-label="Formatação do WhatsApp">
              <span>Formatar:</span>
              <button class="tool-button" type="button" data-wrap="*" aria-label="Negrito" title="Negrito">${icon('bold', 16)}</button>
              <button class="tool-button" type="button" data-wrap="_" aria-label="Itálico" title="Itálico">${icon('italic', 16)}</button>
              <button class="tool-button" type="button" data-wrap="~" aria-label="Riscado" title="Riscado">${icon('strike', 16)}</button>
            </div>
            <label><span>Nome do bot <span class="label-hint">· opcional</span></span><input name="botName" minlength="2" placeholder="SuperVISOR" value="${escapeHtml(formSource?.botName || '')}"></label>
          </fieldset>

          <fieldset class="composer-step">
            <legend><span class="step-num">2</span> Quando</legend>
            <div class="split">
              <label>Horário<input name="time" type="time" required value="${formSource?.time || '08:00'}"></label>
              <label>Status
                <select name="active">
                  <option value="true" ${formSource?.active !== false ? 'selected' : ''}>Ativo</option>
                  <option value="false" ${formSource?.active === false ? 'selected' : ''}>Pausado</option>
                </select>
              </label>
            </div>
            <div class="seg seg-full" role="radiogroup" aria-label="Repetir">
              <label class="${mode === 'weekly' ? 'active' : ''}"><input type="radio" name="scheduleMode" value="weekly" ${mode === 'weekly' ? 'checked' : ''}><span>Dias da semana</span></label>
              <label class="${mode === 'dates' ? 'active' : ''}"><input type="radio" name="scheduleMode" value="dates" ${mode === 'dates' ? 'checked' : ''}><span>Datas específicas</span></label>
            </div>
            <div class="when-weekly">
              <div class="day-pills" role="group" aria-label="Dias da semana">${Object.entries(dayLabels).map(([key, label]) => dayCheckbox(key, label, formSource)).join('')}</div>
            </div>
            <div class="when-dates">
              <div class="date-picker-row">
                <input id="specificDatePicker" type="date" aria-label="Escolher data">
                <button class="secondary" id="addSpecificDate" type="button">${icon('plus', 16)} Adicionar</button>
              </div>
              <input type="hidden" name="specificDates" value="${escapeHtml(selectedDates.join(','))}">
              <div class="date-chip-list">${selectedDatesMarkup(selectedDates)}</div>
            </div>
          </fieldset>

          <fieldset class="composer-step">
            <legend><span class="step-num">3</span> Para quem</legend>
            <p class="target-summary" id="scheduleTargetSummary"></p>
            <span class="field-label">Grupos</span>
            <label class="search-field schedule-search">
              <span>${icon('search', 16)}</span>
              <input id="scheduleGroupSearch" placeholder="Buscar grupo pelo nome" aria-label="Buscar grupo" value="${escapeHtml(state.scheduleGroupSearch)}">
            </label>
            ${groupsList(true, formSource)}
            <span class="field-label">Contatos individuais</span>
            <label class="search-field schedule-search">
              <span>${icon('search', 16)}</span>
              <input id="scheduleContactSearch" placeholder="Buscar por nome, número ou tag" aria-label="Buscar contato" value="${escapeHtml(state.scheduleContactSearch)}">
            </label>
            ${contactsList(true, formSource)}
          </fieldset>

          <div class="wa-preview" aria-live="polite">
            <span class="wa-preview-label">Prévia no WhatsApp</span>
            <div class="wa-bubble" id="schedulePreview"></div>
          </div>

          <div class="composer-actions">
            ${editing || draft ? '<button class="secondary" type="button" id="cancelEdit">Cancelar</button>' : ''}
            <button class="primary" type="submit">${icon(editing ? 'check' : 'calendar', 16)} ${editing ? 'Salvar alterações' : 'Criar agendamento'}</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function selectedDatesMarkup(selectedDates) {
  return selectedDates.length
    ? selectedDates.map((date) => `<button class="date-chip" type="button" data-remove-date="${date}" aria-label="Remover ${formatDate(date)}">${formatDate(date)} <span aria-hidden="true">×</span></button>`).join('')
    : '<span class="muted">Nenhuma data selecionada.</span>';
}

function localDateKey(date = new Date()) {
  return date.toLocaleDateString('en-CA');
}

function todaysLogs() {
  const key = localDateKey();
  return (state.logs || []).filter((log) => log.createdAt && localDateKey(new Date(log.createdAt)) === key);
}

function scheduleRunsOn(schedule, date) {
  if ((schedule.scheduleMode || 'weekly') === 'dates') {
    return (schedule.specificDates || []).includes(localDateKey(date));
  }
  return (schedule.days || []).includes(dayKeysByIndex[date.getDay()]);
}

function scheduleDateAt(schedule, date) {
  const [hours, minutes] = String(schedule.time || '00:00').split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours || 0, minutes || 0, 0, 0);
  return result;
}

function nextRunFor(schedule, from = new Date()) {
  if (!schedule.active) return null;
  for (let offset = 0; offset < 400; offset += 1) {
    const day = new Date(from);
    day.setDate(day.getDate() + offset);
    if (!scheduleRunsOn(schedule, day)) continue;
    const at = scheduleDateAt(schedule, day);
    if (at > from) return at;
  }
  return null;
}

function relativeRunLabel(date) {
  const now = new Date();
  const dayDiff = Math.round((new Date(date).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86400000);
  const minutes = Math.round((date - now) / 60000);
  if (dayDiff === 0) {
    if (minutes < 60) return `em ${Math.max(1, minutes)} min`;
    return `em ${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;
  }
  if (dayDiff === 1) return 'amanhã';
  if (dayDiff < 7) return date.toLocaleDateString('pt-BR', { weekday: 'long' });
  return date.toLocaleDateString('pt-BR');
}

function scheduleKpis() {
  const now = new Date();
  let next = null;
  state.schedules.forEach((schedule) => {
    const date = nextRunFor(schedule, now);
    if (date && (!next || date < next.date)) next = { schedule, date };
  });
  const logsToday = todaysLogs();
  const weekAgo = Date.now() - 7 * 86400000;
  const weekLogs = (state.logs || []).filter((log) => Date.parse(log.createdAt) >= weekAgo);
  const okWeek = weekLogs.filter((log) => log.status === 'sent').length;
  return {
    next,
    active: state.schedules.filter((schedule) => schedule.active).length,
    paused: state.schedules.filter((schedule) => !schedule.active).length,
    sentToday: logsToday.filter((log) => log.status === 'sent' || log.status === 'partial').length,
    failedToday: logsToday.filter((log) => log.status === 'failed').length,
    rate: weekLogs.length ? (okWeek / weekLogs.length) * 100 : null
  };
}

function scheduleTodayStatus(schedule, nextId) {
  if (!schedule.active) return { tone: 'neutral', label: 'Pausado' };
  const lastToday = todaysLogs().find((log) => log.scheduleId === schedule.id);
  if (lastToday?.status === 'failed') return { tone: 'danger', label: 'Falhou hoje' };
  if (lastToday?.status === 'partial') return { tone: 'warn', label: 'Envio parcial' };
  if (lastToday?.status === 'sent') return { tone: 'success', label: 'Enviado hoje' };
  if (schedule.id === nextId) return { tone: 'info', label: 'Próximo' };
  const now = new Date();
  if (scheduleRunsOn(schedule, now) && scheduleDateAt(schedule, now) > now) return { tone: 'neutral', label: 'Hoje' };
  return { tone: 'success-soft', label: 'Ativo' };
}

function uiStoreGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function uiStoreSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* armazenamento indisponível */ }
}

function onboardingCard() {
  if (uiStoreGet('onboardingDismissed') === 'true') return '';
  const steps = [
    { done: whatsappIsReady(), title: 'Conectar o WhatsApp', text: 'Leia o QR Code com o celular que vai enviar as mensagens.', tab: 'whatsapp', action: 'Conectar' },
    { done: state.contacts.length > 0 || state.whatsapp.groups.length > 0, title: 'Revisar grupos e contatos', text: 'Os grupos aparecem sozinhos. Cadastre contatos individuais com tags.', tab: 'contacts', action: 'Abrir contatos' },
    { done: state.schedules.length > 0, title: 'Criar o primeiro agendamento', text: 'Use o formulário desta página para programar o primeiro envio.', href: '#scheduleForm', action: 'Criar agora' }
  ];
  const doneCount = steps.filter((step) => step.done).length;
  if (doneCount === steps.length) return '';
  return `
    <section class="panel onboarding" aria-label="Primeiros passos">
      <div class="onboarding-head">
        <div>
          <h2>Vamos deixar tudo pronto em ${steps.length} passos</h2>
          <p class="muted">${doneCount} de ${steps.length} concluídos. Você pode pular e voltar quando quiser.</p>
        </div>
        <button class="link-button" id="dismissOnboarding" type="button">Ocultar</button>
      </div>
      <span class="meter" aria-hidden="true"><span style="width:${Math.max(6, (doneCount / steps.length) * 100)}%"></span></span>
      <ol class="onboarding-steps">
        ${steps.map((step, index) => `
          <li class="onboarding-step ${step.done ? 'is-done' : ''}">
            <span class="step-num">${step.done ? icon('check', 15) : index + 1}</span>
            <div><strong>${step.title}</strong><span>${step.text}</span></div>
            ${step.done ? '<span class="badge badge-success">Feito</span>' : step.tab
              ? `<button class="secondary btn-sm" data-goto-tab="${step.tab}" type="button">${step.action}</button>`
              : `<a class="secondary btn-sm" href="${step.href}">${step.action}</a>`}
          </li>
        `).join('')}
      </ol>
    </section>
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

function filteredSchedules({ ignoreStatus = false } = {}) {
  return state.schedules.filter((schedule) => {
    if (!ignoreStatus && state.scheduleStatusFilter === 'active' && !schedule.active) return false;
    if (!ignoreStatus && state.scheduleStatusFilter === 'paused' && schedule.active) return false;
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
    ${pageHeader('Administradores', 'Pessoas autorizadas a programar envios.', `<span class="topbar-meta">${state.users.length} usuário(s)</span>`)}
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
    ${pageHeader('Contatos', 'Colaboradores para envios individuais e estatísticas.', `<span class="topbar-meta">${state.contacts.length} cadastrado(s) · ${tags.length} tag(s)</span>`)}
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
            <span>${icon('search', 16)}</span>
            <input id="contactSearch" value="${escapeHtml(state.contactSearch)}" placeholder="Buscar nome, telefone ou tag" aria-label="Buscar contato">
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
          ${contacts.length ? contacts.map(contactItem).join('') : emptyState(state.contacts.length ? 'Nenhum contato encontrado.' : 'Nenhum contato cadastrado ainda. Use o formulário ao lado.', 'users')}
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
        <button class="icon-button" title="Conversar" aria-label="Conversar com ${escapeHtml(contact.name)}" data-start-contact-chat="${contact.whatsappId}" type="button">${icon('chat', 17)}</button>
        <button class="icon-button" title="Editar" aria-label="Editar ${escapeHtml(contact.name)}" data-edit-contact="${contact.id}" type="button">${icon('edit', 17)}</button>
        <button class="icon-button danger-icon" title="Apagar" aria-label="Apagar ${escapeHtml(contact.name)}" data-delete-contact="${contact.id}" type="button">${icon('trash', 17)}</button>
      </div>
    </article>
  `;
}

function conversationsTab() {
  const conversations = visibleConversations();
  const unreadTotal = state.conversations.filter((conversation) => conversationUnreadCount(conversation) > 0).length;
  return `
    ${pageHeader('Conversas', 'Visualize e responda conversas do WhatsApp conectado.', `<button class="secondary" id="refreshConversations" type="button">${icon('refresh', 16)} Atualizar</button>`)}
    <details class="panel compose-panel">
      <summary>${icon('plus', 16)} Iniciar nova conversa</summary>
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
        <button class="primary" type="submit">${icon('send', 16)} Enviar</button>
      </form>
    </details>
    <section class="chat-shell ${state.selectedConversationId ? 'has-selected-conversation' : ''}">
      <aside class="chat-sidebar">
        <div class="chat-sidebar-head">
          <label class="search-field">
            <span>${icon('search', 16)}</span>
            <input id="conversationSearch" placeholder="Buscar conversa" aria-label="Buscar conversa" value="${escapeHtml(state.conversationSearch)}" autocomplete="off">
          </label>
          <div class="conversation-filters" role="group" aria-label="Filtrar conversas">
            <button class="${state.conversationFilter === 'all' ? 'active' : ''}" data-conversation-filter="all" type="button">Todas</button>
            <button class="${state.conversationFilter === 'unread' ? 'active' : ''}" data-conversation-filter="unread" type="button">Não lidas${unreadTotal ? ` · ${unreadTotal}` : ''}</button>
            <button class="${state.conversationFilter === 'groups' ? 'active' : ''}" data-conversation-filter="groups" type="button">Grupos</button>
            <button class="${state.conversationFilter === 'contacts' ? 'active' : ''}" data-conversation-filter="contacts" type="button">Contatos</button>
          </div>
        </div>
        <div class="chat-list">
          ${conversations.length ? conversations.map(conversationItem).join('') : emptyState('Nenhuma conversa neste filtro.', 'chat')}
        </div>
      </aside>
      <div class="chat-window">
        ${state.selectedConversationId ? conversationMessages() : emptyState('Selecione uma conversa para ler e responder.', 'chat')}
      </div>
    </section>
  `;
}

function conversationTimeLabel(timestamp) {
  const value = Number(timestamp || 0);
  if (!value) return '';
  const date = new Date(value < 1e12 ? value * 1000 : value);
  const now = new Date();
  if (localDateKey(date) === localDateKey(now)) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (localDateKey(date) === localDateKey(yesterday)) return 'Ontem';
  if (now - date < 6 * 86400000) return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function visibleConversations() {
  const query = state.conversationSearch.trim().toLowerCase();
  return state.conversations.filter((conversation) => {
    if (query && !`${conversation.name || ''} ${conversation.lastMessage || ''} ${cleanWhatsAppId(conversation.id)}`.toLowerCase().includes(query)) return false;
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
    : emptyState('Nenhuma conversa neste filtro.', 'chat');
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
    : `<span class="chat-avatar chat-avatar-fallback ${conversation.isGroup ? 'is-group' : ''}">${escapeHtml(initialsOf(conversation.name, conversation.isGroup ? 'G' : 'C'))}</span>`;
  return `
    <button class="chat-row ${active} ${unread ? 'has-unread' : ''} ${pinned ? 'is-pinned' : ''}" data-open-conversation="${escapeHtml(conversation.id)}" type="button">
      ${avatar}
      <div class="chat-row-content">
        <div class="chat-row-head">
          <strong>${escapeHtml(conversation.name)}</strong>
          <small class="chat-row-time">${escapeHtml(conversationTimeLabel(conversation.timestamp))}</small>
        </div>
        <div class="chat-row-meta">
          <small>${conversation.isGroup ? '<span class="chat-kind">Grupo · </span>' : ''}${escapeHtml(conversation.lastMessage || '')}</small>
          <span class="chat-row-actions">
            ${pinned ? `<span class="pin-badge" title="Fixada">${icon('pin', 13)}</span>` : ''}
            ${unread ? `<span class="unread-badge">${unread}</span>` : ''}
            <span class="pin-button" title="${pinned ? 'Desfixar' : 'Fixar'}" aria-label="${pinned ? 'Desfixar conversa' : 'Fixar conversa'}" data-pin-conversation="${escapeHtml(conversation.id)}">${pinned ? 'Desfixar' : 'Fixar'}</span>
          </span>
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
    : `<div class="conversation-avatar ${conversation?.isGroup ? 'is-group' : ''}">${escapeHtml(initialsOf(conversation?.name, conversation?.isGroup ? 'G' : 'C'))}</div>`;
  const relatedSchedules = state.schedules.filter((schedule) => (
    (schedule.groupIds || []).includes(state.selectedConversationId) || (schedule.contactIds || []).includes(state.selectedConversationId)
  ));
  const nextRelated = relatedSchedules
    .map((schedule) => ({ schedule, date: nextRunFor(schedule) }))
    .filter((item) => item.date)
    .sort((a, b) => a.date - b.date)[0];
  return `
    <div class="conversation-header">
      <button class="chat-back-button" id="mobileBackToChats" type="button" aria-label="Voltar para a lista">${icon('back', 18)}</button>
      ${avatar}
      <div>
        <strong>${escapeHtml(conversation?.name || 'Conversa')}</strong>
        <span>${conversation?.isGroup ? 'Grupo' : 'Contato'}${relatedSchedules.length ? ` · ${relatedSchedules.length} agendamento(s)` : ''}</span>
      </div>
      <button class="icon-button danger-icon" id="deleteConversation" type="button" title="Apagar conversa" aria-label="Apagar conversa">${icon('trash', 17)}</button>
    </div>
    ${nextRelated ? `<div class="chat-next-schedule">${icon('clock', 15)} Próxima mensagem agendada: <strong>${escapeHtml(nextRelated.schedule.title)}</strong> · ${escapeHtml(nextRelated.schedule.time)} (${escapeHtml(relativeRunLabel(nextRelated.date))})</div>` : ''}
    <div class="messages">
      ${state.messages.length ? state.messages.map((message, index) => `
        ${messageDayDivider(message, state.messages[index - 1])}
        <div class="bubble ${message.fromMe ? 'mine' : ''}" data-message-id="${escapeHtml(message.id || '')}">
          ${conversation?.isGroup && !message.fromMe ? `<strong class="message-sender">${escapeHtml(message.senderName || cleanWhatsAppId(message.from) || 'Participante')}</strong>` : ''}
          ${messageMediaMarkup(message)}
          <p>${formatWhatsAppText(message.body, message)}</p>
          <span class="message-meta" title="${escapeHtml(new Date(message.timestamp).toLocaleString('pt-BR'))}">${new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}${message.fromMe ? messageAckMarkup(message.ack) : ''}</span>
          ${message.fromMe ? `<div class="message-actions">
            <button class="link-button message-action" data-delete-message="${escapeHtml(message.id)}" type="button">Apagar</button>
          </div>` : ''}
        </div>
      `).join('') : emptyState('Nenhuma mensagem carregada.', 'chat')}
    </div>
    <button class="scroll-bottom-button" id="scrollMessagesBottom" type="button" title="Ir para as mensagens mais recentes" aria-label="Ir para as mensagens mais recentes">${icon('down', 20)}</button>
    <form class="reply-box" id="replyForm">
      <label class="reply-as">Responder como
        <input class="reply-name" name="replyBotName" placeholder="sem assinatura" value="${escapeHtml(state.replyBotName)}" autocomplete="off" aria-label="Nome na resposta">
      </label>
      <div class="reply-tools">
        <input name="attachment" type="file" hidden id="replyAttachment">
        <button class="icon-button" id="attachButton" type="button" title="Anexar arquivo" aria-label="Anexar arquivo">${icon('clip', 18)}</button>
        <button class="icon-button emoji-button" type="button" data-emoji="🙂" aria-label="Inserir 🙂">🙂</button>
        <button class="icon-button emoji-button" type="button" data-emoji="👍" aria-label="Inserir 👍">👍</button>
        <button class="icon-button emoji-button" type="button" data-emoji="✅" aria-label="Inserir ✅">✅</button>
      </div>
      <div class="recording-panel" id="recordingPanel" hidden>
        <span id="recordingTimer">00:00</span>
        <div class="recording-bars" id="recordingBars">
          ${Array.from({ length: 18 }, (_, index) => `<i style="--level:${(index % 5) + 2}"></i>`).join('')}
        </div>
      </div>
      <div class="reply-row">
        <textarea class="reply-message" name="message" data-conversation-id="${escapeHtml(state.selectedConversationId || '')}" placeholder="Escreva uma mensagem" rows="1" autocomplete="off" autocapitalize="sentences" spellcheck="true" aria-label="Mensagem">${escapeHtml(replyDraft?.message || '')}</textarea>
        <button class="icon-button record-button" id="recordAudioButton" type="button" title="Gravar áudio" aria-label="Gravar áudio">${recordButtonContent('idle')}</button>
        <button class="primary reply-send" type="submit">${icon('send', 16)}<span>Enviar</span></button>
      </div>
    </form>
  `;
}

function recordButtonContent(mode) {
  if (mode === 'recording') return `${icon('stop', 18)}<span class="sr-only">Parar</span>`;
  if (mode === 'processing') return `<span class="spinner" aria-hidden="true"></span><span class="sr-only">Processando...</span>`;
  return `${icon('mic', 18)}<span class="sr-only">Gravar</span>`;
}

function messageDayDivider(message, previous) {
  if (!message?.timestamp) return '';
  const key = localDateKey(new Date(message.timestamp));
  if (previous?.timestamp && localDateKey(new Date(previous.timestamp)) === key) return '';
  const today = localDateKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const label = key === today ? 'Hoje' : key === localDateKey(yesterday) ? 'Ontem' : new Date(message.timestamp).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  return `<div class="day-divider"><span>${escapeHtml(label)}</span></div>`;
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
    ${pageHeader('Estatísticas', 'Primeira e última mensagem do dia dos participantes observados.', `
      <button class="secondary" id="exportStatsExcel" type="button">${icon('download', 16)} Excel</button>
      <button class="secondary" id="exportStatsPdf" type="button">${icon('download', 16)} PDF</button>
      <button class="primary" id="refreshStats" type="button">${icon('refresh', 16)} Atualizar</button>
    `)}
    ${statsSummaryMarkup()}
    <section class="panel stats-filter">
      <div class="stats-filter-head">
        <h2>Observações e período</h2>
        <p class="muted">Escolha um grupo, carregue os participantes e adicione quem deve ser acompanhado.</p>
      </div>
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
      <span class="field-label">Observações que entram no cálculo</span>
      <div class="groups watcher-list">
        ${state.watchers.length ? state.watchers.map((watcher) => `
          <label class="group-option watcher-option">
            <input type="checkbox" name="statsWatcherIds" value="${watcher.id}" ${selectedWatchers.includes(watcher.id) ? 'checked' : ''}>
            <span class="group-name">${escapeHtml(watcher.contactName)} <small>${escapeHtml(watcher.groupName)}</small></span>
            <button class="icon-button danger-icon" data-delete-watcher="${watcher.id}" type="button" title="Remover observação" aria-label="Remover observação de ${escapeHtml(watcher.contactName)}">${icon('trash', 15)}</button>
          </label>
        `).join('') : emptyState('Carregue os participantes de um grupo e adicione uma observação.', 'users')}
      </div>
    </section>
  `;
}

function statsMinutes(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getHours() * 60 + date.getMinutes();
}

function minutesLabel(minutes) {
  if (minutes === null || minutes === undefined) return '--:--';
  const rounded = Math.round(minutes);
  return `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`;
}

function statsSummaryMarkup() {
  if (!state.stats.length) {
    return `<section class="panel activity-panel">${emptyState('Clique em Atualizar para calcular as estatísticas da data escolhida.', 'chart')}</section>`;
  }
  const rows = state.stats.map((item) => ({
    name: item.contactName || item.name || 'Participante',
    group: item.groupName || item.tag || 'Sem grupo',
    phone: item.contactPhone || item.phone || '',
    count: Number(item.count || 0),
    first: statsMinutes(item.firstMessageAt),
    last: statsMinutes(item.lastMessageAt)
  }));
  const active = rows.filter((row) => row.first !== null);
  const average = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
  const avgFirst = average(active.map((row) => row.first));
  const avgLast = average(active.map((row) => row.last ?? row.first));
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const startHour = Math.min(6, ...active.map((row) => Math.floor(row.first / 60)));
  const endHour = Math.max(22, ...active.map((row) => Math.ceil((row.last ?? row.first) / 60)));
  const span = Math.max(60, (endHour - startHour) * 60);
  const pos = (minutes) => ((minutes - startHour * 60) / span) * 100;
  const ticks = [];
  for (let hour = startHour; hour <= endHour; hour += 4) ticks.push(hour);
  const dateLabel = state.statsDate ? formatDate(state.statsDate) : 'hoje';
  return `
    <section class="kpi-grid" aria-label="Indicadores">
      <article class="kpi"><span class="kpi-label">Primeira mensagem média</span><strong class="kpi-value is-accent">${minutesLabel(avgFirst)}</strong><span class="kpi-sub">${escapeHtml(dateLabel)}</span></article>
      <article class="kpi"><span class="kpi-label">Última mensagem média</span><strong class="kpi-value is-info">${minutesLabel(avgLast)}</strong><span class="kpi-sub">${escapeHtml(dateLabel)}</span></article>
      <article class="kpi"><span class="kpi-label">Participantes ativos</span><strong class="kpi-value">${active.length} de ${rows.length}</strong><span class="kpi-sub ${rows.length - active.length ? 'is-warn' : ''}">${rows.length - active.length ? `${rows.length - active.length} sem mensagens` : 'Todos enviaram mensagem'}</span></article>
      <article class="kpi"><span class="kpi-label">Mensagens registradas</span><strong class="kpi-value">${total}</strong><span class="kpi-sub">Somando os observados</span></article>
    </section>
    <section class="panel activity-panel" aria-label="Janela de atividade">
      <div class="activity-head">
        <h2>Janela de atividade por participante</h2>
        <div class="legend">
          <span><i class="legend-dot is-first"></i>Primeira</span>
          <span><i class="legend-dot is-last"></i>Última</span>
        </div>
      </div>
      <div class="activity-chart">
        <div class="act-row act-axis" aria-hidden="true">
          <span></span>
          <div class="act-track">${ticks.map((hour) => `<span style="left:${pos(hour * 60)}%">${String(hour).padStart(2, '0')}h</span>`).join('')}</div>
          <span></span>
        </div>
        ${rows.map((row) => `
          <div class="act-row" title="${escapeHtml(`${row.name} · ${row.group}${row.phone ? ` · ${row.phone}` : ''}`)}">
            <span class="act-name"><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.group)}</small></span>
            <div class="act-track">
              ${ticks.map((hour) => `<i class="act-grid" style="left:${pos(hour * 60)}%"></i>`).join('')}
              ${row.first !== null ? `
                <span class="act-bar" style="left:${pos(row.first)}%;width:${Math.max(0.6, pos(row.last ?? row.first) - pos(row.first))}%"></span>
                <span class="act-dot is-first" style="left:${pos(row.first)}%"></span>
                ${row.last !== null && row.last !== row.first ? `<span class="act-dot is-last" style="left:${pos(row.last)}%"></span>` : ''}
              ` : '<span class="act-none">Sem mensagens</span>'}
            </div>
            <span class="act-value">${row.first !== null ? `${minutesLabel(row.first)}–${minutesLabel(row.last ?? row.first)}` : '--'} · ${row.count} msg</span>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function userItem(user, canManageUsers) {
  const isSelf = user.id === state.user?.id;
  const canEditThisUser = canManageUsers && !isSelf && !user.isOwner;
  return `
    <article class="item user-item">
      <div class="item-head">
        <div class="user-identity">
          ${avatarMarkup(user)}
          <div>
          <p class="item-title">${escapeHtml(user.name)}</p>
          <p class="muted">${escapeHtml(user.email)}</p>
          </div>
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
  const failures = state.logs.filter((log) => log.status === 'failed').length;
  return `
    ${pageHeader('Histórico de envios', 'Últimos envios processados pelo agendador.', `${failures ? `<span class="status status-failed">${failures} falha(s)</span>` : ''}<button class="secondary" id="refreshLogs" type="button">${icon('refresh', 16)} Atualizar</button>`)}
    <section class="panel log-panel">
      ${
        state.logs.length
          ? state.logs.map((log) => `
            <article class="log-row ${log.status === 'failed' ? 'is-failed' : ''}">
              <span class="log-time">${new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}<small>${new Date(log.createdAt).toLocaleDateString('pt-BR')}</small></span>
              <div class="log-copy">
                <p class="item-title">${escapeHtml(log.scheduleTitle || 'Agendamento')}${log.manual ? ' <small class="muted">· envio manual</small>' : ''}</p>
                ${log.error ? `<p class="message-preview">${escapeHtml(log.error)}</p>` : ''}
              </div>
              <span class="${logStatusClass(log.status)}">${escapeHtml(logStatusLabel(log.status))}</span>
            </article>`).join('')
          : emptyState('Nenhum envio registrado ainda.', 'history')
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
  return `<label class="day-pill" title="${label}"><input type="checkbox" name="days" value="${key}" aria-label="${label}" ${checked ? 'checked' : ''}><span>${dayShortLabels[key]}</span></label>`;
}

function groupsList(selectable, editing) {
  if (!state.whatsapp.groups.length) {
    if (state.whatsapp.status === 'authenticated') return emptyState('WhatsApp autenticado, mas ainda sincronizando. Aguarde mudar para Conectado.', 'refresh');
    if (state.whatsapp.status !== 'ready') return emptyState('Conecte o WhatsApp para carregar os grupos.', 'qr', selectable ? '<button class="secondary btn-sm" data-goto-tab="whatsapp" type="button">Conectar WhatsApp</button>' : '');
    return emptyState('Nenhum grupo encontrado para este número. Verifique se o bot participa dos grupos e clique em atualizar.', 'users');
  }

  return `
    <div class="groups ${selectable ? 'is-selectable' : ''}">
      ${state.whatsapp.groups.map((group) => {
        const checked = (editing?.groupIds || []).includes(group.id);
        return `
          <label class="group-option" data-schedule-group="${escapeHtml(group.name.toLowerCase())}">
            ${selectable ? `<input type="checkbox" name="groupIds" value="${group.id}" data-name="${escapeHtml(group.name)}" ${checked ? 'checked' : ''}>` : `<span class="group-avatar">${escapeHtml(initialsOf(group.name, 'G'))}</span>`}
            <span class="group-name">${escapeHtml(group.name)}</span>
          </label>`;
      }).join('')}
    </div>
  `;
}

function contactsList(selectable, editing) {
  if (!state.contacts.length) {
    return emptyState('Nenhum contato individual cadastrado. Use o menu Contatos para adicionar colaboradores.', 'users');
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

function scheduleRecurrenceLabel(schedule) {
  if (schedule.scheduleMode === 'dates') {
    const dates = schedule.specificDates || [];
    if (!dates.length) return 'Datas específicas';
    return dates.length > 3 ? `${dates.slice(0, 3).map(formatDate).join(', ')} +${dates.length - 3}` : dates.map(formatDate).join(', ');
  }
  const days = schedule.days || [];
  const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri'];
  if (days.length === 7) return 'Todos os dias';
  if (days.length === 5 && weekdays.every((day) => days.includes(day))) return 'Seg a sex';
  if (days.length === 2 && days.includes('sat') && days.includes('sun')) return 'Fins de semana';
  return dayKeysByIndex.filter((day) => days.includes(day)).map((day) => dayShortLabels[day]).join(', ') || 'Sem dias';
}

function scheduleItem(schedule, nextId = null) {
  const groups = schedule.groupNames || [];
  const contacts = schedule.contactNames || [];
  const botName = schedule.botName || 'SuperVISOR';
  const status = scheduleTodayStatus(schedule, nextId);
  const targetLabel = [
    groups.length ? `${groups.length} grupo${groups.length > 1 ? 's' : ''}` : '',
    contacts.length ? `${contacts.length} contato${contacts.length > 1 ? 's' : ''}` : ''
  ].filter(Boolean).join(' · ') || 'Sem destino';
  const targetTitle = [...groups, ...contacts].join(', ');
  return `
    <article class="tl-item tone-${status.tone} ${schedule.active ? '' : 'is-paused'}">
      <div class="tl-time"><span>${escapeHtml(schedule.time)}</span></div>
      <div class="tl-rail" aria-hidden="true"><span class="tl-dot"></span></div>
      <div class="tl-card">
        <div class="tl-head">
          <h3>${escapeHtml(schedule.title)}</h3>
          <span class="badge badge-${status.tone}">${status.label}</span>
        </div>
        <p class="tl-message" title="${escapeHtml(schedule.message)}">${escapeHtml(schedule.message)}</p>
        <div class="tl-meta">
          <span class="tag" title="${escapeHtml(targetTitle)}">${icon('users', 14)} ${escapeHtml(targetLabel)}</span>
          <span class="tag">${icon('calendar', 14)} ${escapeHtml(scheduleRecurrenceLabel(schedule))}</span>
          <span class="tag tag-quiet">Bot: ${escapeHtml(botName)}</span>
        </div>
        ${targetTitle ? `<p class="tl-targets">${escapeHtml(targetTitle)}</p>` : ''}
        <div class="tl-actions">
          <button class="ghost-button" type="button" data-edit="${schedule.id}">${icon('edit', 15)} Editar</button>
          <button class="ghost-button" type="button" data-reuse="${schedule.id}">${icon('copy', 15)} Reaproveitar</button>
          <button class="ghost-button" type="button" data-toggle="${schedule.id}">${icon(schedule.active ? 'pause' : 'play', 15)} ${schedule.active ? 'Pausar' : 'Ativar'}</button>
          <button class="ghost-button" type="button" data-send="${schedule.id}">${icon('send', 15)} Enviar agora</button>
          <button class="ghost-button is-danger" type="button" data-delete="${schedule.id}">${icon('trash', 15)} Remover</button>
        </div>
      </div>
    </article>
  `;
}

function captureIntegrationConfig() {
  const form = document.querySelector('#integrationConfigForm');
  const target = selectedIntegrationTarget();
  if (!form || !target?.reachable) return target?.config || {};
  const config = target.config;
  config.enabled = Boolean(form.elements.enabled?.checked);
  config.intervalSeconds = Number(form.elements.intervalSeconds?.value || 30);
  config.graceMinutes = Number(form.elements.graceMinutes?.value || 0);
  config.expectedLoginTime = form.elements.expectedLoginTime?.value || '09:00';
  config.botName = String(form.elements.botName?.value || '').trim();
  config.repeatEnabled = Boolean(form.elements.repeatEnabled?.checked);
  config.repeatMinutes = Number(form.elements.repeatMinutes?.value || 360);
  config.cooldownMinutes = config.repeatMinutes;
  config.defaultGroupIds = [...form.querySelectorAll('[data-integration-default-group]:checked')].map((input) => input.value);
  config.enabledEvents = Object.fromEntries(
    [...form.querySelectorAll('[data-integration-event-enabled]')].map((input) => [input.dataset.integrationEventEnabled, input.checked])
  );
  config.messageTemplates = Object.fromEntries(
    [...form.querySelectorAll('[data-integration-template]')].map((input) => [input.dataset.integrationTemplate, input.value])
  );
  config.groupIdsByEvent = Object.fromEntries(
    (target.catalog?.events || []).map((eventDefinition) => [
      eventDefinition.id,
      [...form.querySelectorAll(`[data-integration-event-group="${CSS.escape(eventDefinition.id)}"]:checked`)].map((input) => input.value)
    ])
  );
  return config;
}

function addIntegrationMapping(kind) {
  const target = selectedIntegrationTarget();
  if (!target?.reachable) return;
  captureIntegrationConfig();
  const isUser = kind === 'user';
  const key = document.querySelector(isUser ? '#integrationPerson' : '#integrationDepartment')?.value;
  const groupId = document.querySelector(isUser ? '#integrationPersonGroup' : '#integrationDepartmentGroup')?.value;
  if (!key || !groupId) {
    toast('Selecione a origem e o grupo do vínculo.');
    return;
  }
  const field = isUser ? 'groupIdsByUser' : 'groupIdsByDepartment';
  target.config[field] ||= {};
  target.config[field][key] = [...new Set([...(target.config[field][key] || []), groupId])];
  renderContent();
}

function removeIntegrationMapping(kind, key) {
  const target = selectedIntegrationTarget();
  if (!target?.reachable) return;
  captureIntegrationConfig();
  const field = kind === 'user' ? 'groupIdsByUser' : 'groupIdsByDepartment';
  delete target.config[field]?.[key];
  renderContent();
}

async function saveIntegrationConfig(event) {
  event.preventDefault();
  const target = selectedIntegrationTarget();
  if (!target) return;
  try {
    const config = captureIntegrationConfig();
    await api(`/api/admin/integrations/${target.id}`, { method: 'PUT', body: JSON.stringify(config) });
    await loadIntegrations({ silent: true });
    toast(`Configuração de ${target.name} salva.`);
  } catch (error) {
    toast(error.message);
  }
}

async function testIntegration() {
  const target = selectedIntegrationTarget();
  const groupId = document.querySelector('#integrationTestGroup')?.value;
  const message = document.querySelector('#integrationTestMessage')?.value || '';
  if (!target || !groupId || !message.trim()) {
    toast('Selecione um grupo e informe a mensagem de teste.');
    return;
  }
  if (!confirm(`Enviar agora uma mensagem real no grupo ${integrationGroupName(groupId)}?`)) return;
  try {
    await api(`/api/admin/integrations/${target.id}/test`, {
      method: 'POST',
      body: JSON.stringify({ groupIds: [groupId], message })
    });
    await loadIntegrations({ silent: true });
    toast('Mensagem de teste enviada.');
  } catch (error) {
    toast(error.message);
  }
}

async function scanIntegration() {
  const target = selectedIntegrationTarget();
  if (!target || !confirm(`Executar agora a verificação de ${target.name}? Eventos pendentes poderão ser enviados.`)) return;
  try {
    await api(`/api/admin/integrations/${target.id}/scan`, { method: 'POST' });
    await loadIntegrations({ silent: true });
    toast('Verificação concluída.');
  } catch (error) {
    toast(error.message);
  }
}

function bindIntegrationsContent() {
  document.querySelector('#refreshIntegrations')?.addEventListener('click', () => loadIntegrations());
  document.querySelectorAll('[data-integration-environment]').forEach((button) => {
    button.addEventListener('click', () => {
      captureIntegrationConfig();
      state.integrationEnvironment = button.dataset.integrationEnvironment;
      renderContent();
    });
  });
  document.querySelector('#integrationConfigForm')?.addEventListener('submit', saveIntegrationConfig);
  document.querySelector('[name="repeatEnabled"]')?.addEventListener('change', (event) => {
    const repeatMinutes = document.querySelector('[name="repeatMinutes"]');
    if (repeatMinutes) repeatMinutes.disabled = !event.target.checked;
  });
  document.querySelector('#addPersonIntegrationGroup')?.addEventListener('click', () => addIntegrationMapping('user'));
  document.querySelector('#addDepartmentIntegrationGroup')?.addEventListener('click', () => addIntegrationMapping('department'));
  document.querySelectorAll('[data-remove-integration-mapping]').forEach((button) => {
    button.addEventListener('click', () => removeIntegrationMapping(button.dataset.removeIntegrationMapping, button.dataset.mappingKey));
  });
  document.querySelector('#testIntegration')?.addEventListener('click', testIntegration);
  document.querySelector('#scanIntegration')?.addEventListener('click', scanIntegration);
}

function bindContent() {
  bindIntegrationsContent();
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
  bindSelectedDateChips();
  bindScheduleComposer();
  document.querySelectorAll('[data-schedule-view]').forEach((button) => {
    button.addEventListener('click', () => {
      state.scheduleView = button.dataset.scheduleView;
      renderScheduleListPreservingForm();
    });
  });
  document.querySelectorAll('[data-schedule-status]').forEach((button) => {
    button.addEventListener('click', () => {
      state.scheduleStatusFilter = button.dataset.scheduleStatus;
      renderScheduleListPreservingForm();
    });
  });
  document.querySelectorAll('[data-goto-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelector(`.nav [data-tab="${button.dataset.gotoTab}"]`)?.click();
    });
  });
  document.querySelector('#dismissOnboarding')?.addEventListener('click', () => {
    uiStoreSet('onboardingDismissed', 'true');
    document.querySelector('.onboarding')?.remove();
  });
  document.querySelector('#conversationSearch')?.addEventListener('input', (event) => {
    state.conversationSearch = event.target.value;
    state.conversationListScroll = 0;
    renderConversationListOnly();
  });
  document.querySelector('#cancelEdit')?.addEventListener('click', () => {
    state.editingId = null;
    state.scheduleDraft = null;
    state.scheduleEditDraft = null;
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
      state.scheduleEditDraft = null;
      const editing = state.schedules.find((item) => item.id === state.editingId);
      state.selectedDates = [...(editing?.specificDates || [])];
      renderContent();
      scrollToScheduleForm();
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
    isCopy: true,
    active: true,
    days: [...(schedule.days || [])],
    specificDates: [...(schedule.specificDates || [])],
    groupIds: [...(schedule.groupIds || [])],
    contactIds: [...(schedule.contactIds || [])]
  };
  state.selectedDates = [...(state.scheduleDraft.specificDates || [])];
  state.selectedDatesScheduleId = 'new';
  state.scheduleEditDraft = null;
  renderContent();
  scrollToScheduleForm();
}

function scrollToScheduleForm() {
  requestAnimationFrame(() => {
    const composer = document.querySelector('.composer');
    if (!composer) return;
    composer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    composer.querySelector('input[name="title"]')?.focus({ preventScroll: true });
  });
}

function addSpecificDate() {
  const input = document.querySelector('#specificDatePicker');
  if (!input?.value) {
    toast('Escolha uma data no calendário.');
    return;
  }
  state.selectedDates = [...new Set([...state.selectedDates, input.value])].sort();
  state.selectedDatesScheduleId = state.editingId || 'new';
  input.value = '';
  updateSelectedDatesUi();
}

function updateSelectedDatesUi() {
  const dates = getSelectedDates();
  const hidden = document.querySelector('#scheduleForm input[name="specificDates"]');
  if (hidden) hidden.value = dates.join(',');
  const list = document.querySelector('.date-chip-list');
  if (list) list.innerHTML = selectedDatesMarkup(dates);
  bindSelectedDateChips();
}

function bindSelectedDateChips() {
  document.querySelectorAll('[data-remove-date]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedDates = state.selectedDates.filter((date) => date !== button.dataset.removeDate);
      updateSelectedDatesUi();
    });
  });
}

function captureScheduleFormDraft() {
  const form = document.querySelector('#scheduleForm');
  if (!form) return null;
  const data = new FormData(form);
  return {
    title: data.get('title') || '',
    botName: data.get('botName') || '',
    message: data.get('message') || '',
    time: data.get('time') || '08:00',
    active: data.get('active') !== 'false',
    scheduleMode: data.get('scheduleMode') || 'weekly',
    days: data.getAll('days'),
    specificDates: getSelectedDates(),
    groupIds: data.getAll('groupIds'),
    contactIds: data.getAll('contactIds')
  };
}

function renderScheduleListPreservingForm() {
  const form = document.querySelector('#scheduleForm');
  const dirty = form && [...form.elements].some((element) => element.name && (
    (element.type === 'checkbox' || element.type === 'radio') ? element.checked !== element.defaultChecked
      : element.tagName === 'SELECT' ? [...element.options].some((option) => option.selected !== option.defaultSelected)
      : element.value !== element.defaultValue
  ));
  if (dirty && !state.editingId) {
    state.scheduleDraft = { ...(state.scheduleDraft || {}), ...captureScheduleFormDraft() };
  } else if (dirty && state.editingId) {
    state.scheduleEditDraft = { ...captureScheduleFormDraft(), id: state.editingId };
  }
  const scrollY = window.scrollY;
  renderContent();
  window.scrollTo({ top: scrollY });
}

function bindScheduleComposer() {
  const form = document.querySelector('#scheduleForm');
  if (!form) return;
  const syncMode = () => {
    const mode = form.querySelector('input[name="scheduleMode"]:checked')?.value || 'weekly';
    form.dataset.mode = mode;
    form.querySelectorAll('.seg label').forEach((label) => {
      label.classList.toggle('active', Boolean(label.querySelector('input:checked')));
    });
  };
  const syncPreview = () => {
    const preview = document.querySelector('#schedulePreview');
    if (!preview) return;
    const bot = String(form.elements.botName?.value || '').trim() || 'SuperVISOR';
    const message = String(form.elements.message?.value || '');
    const time = form.elements.time?.value || '--:--';
    preview.innerHTML = `
      <strong class="wa-bot">${escapeHtml(bot)}:</strong>
      <span class="wa-text">${message.trim() ? formatWhatsAppText(message) : '<em class="wa-placeholder">A mensagem aparece aqui enquanto você digita.</em>'}</span>
      <span class="wa-time">${escapeHtml(time)} ✓✓</span>
    `;
  };
  const syncTargets = () => {
    const summary = document.querySelector('#scheduleTargetSummary');
    if (!summary) return;
    const groups = form.querySelectorAll('input[name="groupIds"]:checked').length;
    const contacts = form.querySelectorAll('input[name="contactIds"]:checked').length;
    summary.classList.toggle('is-empty', !groups && !contacts);
    summary.textContent = !groups && !contacts
      ? 'Nenhum destino selecionado ainda.'
      : `Selecionado: ${groups} grupo(s) e ${contacts} contato(s).`;
  };
  form.querySelectorAll('input[name="scheduleMode"]').forEach((input) => input.addEventListener('change', syncMode));
  form.addEventListener('input', (event) => {
    if (['message', 'botName', 'time'].includes(event.target.name)) syncPreview();
  });
  form.addEventListener('change', (event) => {
    if (event.target.name === 'groupIds' || event.target.name === 'contactIds') syncTargets();
  });
  form.querySelectorAll('[data-wrap]').forEach((button) => {
    button.addEventListener('click', () => {
      const textarea = form.elements.message;
      const marker = button.dataset.wrap;
      const start = textarea.selectionStart ?? textarea.value.length;
      const end = textarea.selectionEnd ?? textarea.value.length;
      const selected = textarea.value.slice(start, end) || 'texto';
      textarea.value = `${textarea.value.slice(0, start)}${marker}${selected}${marker}${textarea.value.slice(end)}`;
      textarea.focus();
      textarea.setSelectionRange(start + 1, start + 1 + selected.length);
      syncPreview();
    });
  });
  syncMode();
  syncPreview();
  syncTargets();
}

function updateContactResults() {
  const target = document.querySelector('.contacts-results');
  if (!target) return;
  const contacts = filteredContacts();
  target.innerHTML = contacts.length ? contacts.map(contactItem).join('') : emptyState('Nenhum contato encontrado.', 'users');
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
    toast(error.message);
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
    state.scheduleEditDraft = null;
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
    if (!silent) toast(error.message);
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
    button.innerHTML = recordButtonContent('processing');
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
    button.innerHTML = recordButtonContent('recording');
    button.title = 'Parar e enviar áudio';
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
      button.innerHTML = recordButtonContent('idle');
      button.title = 'Gravar áudio';
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
