const app = document.querySelector('#app');
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
  users: [],
  logs: [],
  editingId: null,
  actionMessage: null,
  selectedDates: [],
  selectedDatesScheduleId: null
};

let renderQueued = false;

const socket = io();
socket.on('whatsapp:state', (payload) => {
  if (JSON.stringify(state.whatsapp) === JSON.stringify(payload)) return;
  state.whatsapp = payload;
  updateLiveStatus();
  if (state.tab === 'whatsapp' || state.tab === 'schedules') renderContentQueued();
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

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Erro na requisição.');
  return data;
}

function toast(message) {
  const element = document.createElement('div');
  element.className = 'toast';
  element.textContent = message;
  document.body.appendChild(element);
  setTimeout(() => element.remove(), 3200);
}

async function bootstrap() {
  const data = await api('/api/bootstrap');
  state.hasUsers = data.hasUsers;
  state.user = data.user;
  if (state.user) await loadDashboardData();
  render();
}

async function loadDashboardData() {
  const [whatsapp, schedules, users, logs] = await Promise.all([
    api('/api/whatsapp'),
    api('/api/schedules'),
    api('/api/users'),
    api('/api/logs')
  ]);
  state.whatsapp = whatsapp;
  state.schedules = schedules.schedules;
  state.users = users.users;
  state.logs = logs.logs;
}

function render() {
  applyTheme();
  if (!state.user) {
    renderAuth();
    return;
  }

  if (!document.querySelector('.app-shell')) {
    renderShell();
  }
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
      <div class="auth-brand">
        <div class="logo-mark">✓</div>
        ${logoMarkup('large')}
        <span>versão 1.0</span>
      </div>
      <form class="auth-panel form" id="authForm">
        <div>
          <h1>${isSetup ? 'Criar administrador' : 'Entrar na sua conta'}</h1>
          <p class="muted">${isSetup ? 'Configure o primeiro acesso do painel.' : 'Acesse o dashboard do SuperVISOR'}</p>
        </div>
        ${isSetup ? '<label>Nome<input name="name" required minlength="2" autocomplete="name"></label>' : ''}
        <label>E-mail<input name="email" type="email" required autocomplete="email" placeholder="seu@email.com"></label>
        <label>Senha<input name="password" type="password" required minlength="6" autocomplete="${isSetup ? 'new-password' : 'current-password'}" placeholder="********"></label>
        <button class="primary" type="submit">${isSetup ? 'Criar e entrar' : 'Entrar'}</button>
      </form>
    </section>
  `;

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
          ${navButton('users', 'Administradores')}
          ${navButton('logs', 'Histórico')}
        </nav>
      </aside>
      <section class="main">
        <div class="live-strip">
          <span class="live-dot">AO VIVO</span>
          <span id="liveClock"></span>
          <span id="liveStatus" class="${statusClass()}">${whatsappStatusText()}</span>
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
  updateNav();
  updateLiveStatus();
  target.innerHTML = currentTab();
  bindContent();
}

function navButton(tab, label) {
  return `<button class="${state.tab === tab ? 'active' : ''}" data-tab="${tab}">${label}</button>`;
}

function updateNav() {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === state.tab);
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

  document.querySelector('#logoutButton')?.addEventListener('click', async () => {
    await api('/api/logout', { method: 'POST' });
    state.user = null;
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
        </div>
      </section>
      <section class="panel">
        <div class="row">
          <h2 style="margin-right:auto">Grupos</h2>
          <button class="secondary" id="refreshGroups" ${whatsappIsReady() ? '' : 'disabled'}>Atualizar</button>
        </div>
        ${state.actionMessage ? `<p class="muted">${escapeHtml(state.actionMessage)}</p>` : ''}
        ${groupsList(false)}
      </section>
    </div>
  `;
}

function schedulesTab() {
  const editing = state.schedules.find((item) => item.id === state.editingId);
  const dateScope = editing?.id || 'new';
  if (state.selectedDatesScheduleId !== dateScope) {
    state.selectedDates = [...(editing?.specificDates || [])];
    state.selectedDatesScheduleId = dateScope;
  }
  const selectedDates = getSelectedDates(editing);
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
          <label>Título<input name="title" required minlength="2" value="${escapeHtml(editing?.title || '')}"></label>
          <label>Nome do bot<input name="botName" required minlength="2" value="${escapeHtml(editing?.botName || 'SuperVISOR')}"></label>
          <label>Mensagem<textarea name="message" required>${escapeHtml(editing?.message || '')}</textarea></label>
          <div class="split">
            <label>Horário<input name="time" type="time" required value="${editing?.time || '08:00'}"></label>
            <label>Status
              <select name="active">
                <option value="true" ${editing?.active !== false ? 'selected' : ''}>Ativo</option>
                <option value="false" ${editing?.active === false ? 'selected' : ''}>Pausado</option>
              </select>
            </label>
          </div>
          <label>Tipo de agendamento
            <select name="scheduleMode">
              <option value="weekly" ${(editing?.scheduleMode || 'weekly') === 'weekly' ? 'selected' : ''}>Dias da semana</option>
              <option value="dates" ${editing?.scheduleMode === 'dates' ? 'selected' : ''}>Datas específicas</option>
            </select>
          </label>
          <label>Dias da semana</label>
          <div class="days">${Object.entries(dayLabels).map(([key, label]) => dayCheckbox(key, label, editing)).join('')}</div>
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
          ${groupsList(true, editing)}
          <div class="row">
            <button class="primary" type="submit">${editing ? 'Salvar alterações' : 'Criar agendamento'}</button>
            ${editing ? '<button class="secondary" type="button" id="cancelEdit">Cancelar</button>' : ''}
          </div>
        </form>
      </section>
      <section class="list">
        ${state.schedules.length ? state.schedules.map(scheduleItem).join('') : '<div class="empty">Nenhum agendamento criado ainda.</div>'}
      </section>
    </div>
  `;
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
          <label class="group-option">
            ${selectable ? `<input type="checkbox" name="groupIds" value="${group.id}" data-name="${escapeHtml(group.name)}" ${checked ? 'checked' : ''}>` : ''}
            ${escapeHtml(group.name)}
          </label>`;
      }).join('')}
    </div>
  `;
}

function scheduleItem(schedule) {
  return `
    <article class="item">
      <div class="item-head">
        <div>
          <p class="item-title">${escapeHtml(schedule.title)}</p>
          <p class="muted">${schedule.time} | ${scheduleWhen(schedule)}</p>
        </div>
        <span class="status">${schedule.active ? 'Ativo' : 'Pausado'}</span>
      </div>
      <p class="muted">${schedule.groupNames.map(escapeHtml).join(', ') || `${schedule.groupIds.length} grupo(s)`}</p>
      <p class="muted">Bot: ${escapeHtml(schedule.botName || 'SuperVISOR')}</p>
      <p class="message-preview">${escapeHtml(schedule.message)}</p>
      <div class="row">
        <button class="secondary" data-edit="${schedule.id}">Editar</button>
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
  document.querySelector('#scheduleForm')?.addEventListener('submit', saveSchedule);
  document.querySelector('#addSpecificDate')?.addEventListener('click', addSpecificDate);
  document.querySelector('#refreshLogs')?.addEventListener('click', refreshLogs);
  document.querySelectorAll('[data-remove-date]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedDates = state.selectedDates.filter((date) => date !== button.dataset.removeDate);
      renderContent();
    });
  });
  document.querySelector('#cancelEdit')?.addEventListener('click', () => {
    state.editingId = null;
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
      const editing = state.schedules.find((item) => item.id === state.editingId);
      state.selectedDates = [...(editing?.specificDates || [])];
      renderContent();
    });
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

async function saveSchedule(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const selectedGroups = [...form.querySelectorAll('input[name="groupIds"]:checked')];
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
    groupNames: selectedGroups.map((input) => input.dataset.name)
  };
  try {
    const path = state.editingId ? `/api/schedules/${state.editingId}` : '/api/schedules';
    const method = state.editingId ? 'PUT' : 'POST';
    await api(path, { method, body: JSON.stringify(body) });
    state.editingId = null;
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

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

bootstrap().catch((error) => toast(error.message));
