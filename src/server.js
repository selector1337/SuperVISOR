const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const { Server } = require('socket.io');

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && !process.env[key]) process.env[key] = value;
  });
}

loadEnvFile();

const store = require('./store');
const scheduler = require('./scheduler');
const whatsapp = require('./whatsapp');
const { createGumIntegration } = require('./gum-integration');
const { createIntegrationsAdminRouter } = require('./integrations-admin');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'troque-este-segredo-em-producao',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-store');
      return;
    }
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  }
}));
app.use('/api/integrations/gum', createGumIntegration({
  whatsapp,
  dataDir: path.join(__dirname, '..', 'data')
}));

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Login necessário.' });
  }

  return next();
}

async function attachSessionUser(req) {
  if (!req.session.user?.id) return null;
  const user = await store.getPublicUser(req.session.user.id);
  req.session.user = user;
  return user;
}

async function requireOwner(req, res, next) {
  try {
    const user = await attachSessionUser(req);
    if (!user?.isOwner) {
      return res.status(403).json({ error: 'Apenas o usuario principal pode fazer esta acao.' });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

app.use(
  '/api/admin/integrations',
  requireAuth,
  requireOwner,
  createIntegrationsAdminRouter({ whatsapp })
);

function validateSchedule(body) {
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const validDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const scheduleMode = body.scheduleMode || 'weekly';

  if (!body.title || body.title.trim().length < 2) {
    return 'Informe um titulo.';
  }

  if (!body.message || body.message.trim().length < 1) {
    return 'Informe a mensagem.';
  }

  const hasGroups = Array.isArray(body.groupIds) && body.groupIds.length > 0;
  const hasContacts = Array.isArray(body.contactIds) && body.contactIds.length > 0;
  if (!hasGroups && !hasContacts) {
    return 'Selecione pelo menos um grupo ou contato.';
  }

  if (!timePattern.test(body.time || '')) {
    return 'Informe um horário válido.';
  }

  if (!['weekly', 'dates'].includes(scheduleMode)) {
    return 'Escolha um tipo de agendamento válido.';
  }

  if (scheduleMode === 'weekly') {
    if (!Array.isArray(body.days) || body.days.length === 0) {
      return 'Selecione pelo menos um dia.';
    }

    if (body.days.some((day) => !validDays.includes(day))) {
      return 'Dias selecionados inválidos.';
    }
  }

  if (scheduleMode === 'dates') {
    if (!Array.isArray(body.specificDates) || body.specificDates.length === 0) {
      return 'Informe pelo menos uma data específica.';
    }

    if (body.specificDates.some((date) => !datePattern.test(date))) {
      return 'Informe as datas no formato AAAA-MM-DD.';
    }
  }

  return null;
}

app.get('/api/bootstrap', async (req, res, next) => {
  try {
    const user = req.session.user ? await attachSessionUser(req) : null;
    res.json({
      hasUsers: await store.hasUsers(),
      user
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/setup', async (req, res, next) => {
  try {
    if (await store.hasUsers()) {
      return res.status(403).json({ error: 'Configuração inicial já foi feita.' });
    }

    const created = await store.createUser(req.body);
    const user = await store.getPublicUser(created.id);
    req.session.user = user;
    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/login', async (req, res) => {
  const user = await store.verifyUser(req.body.email || '', req.body.password || '');

  if (!user) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  }

  const sessionUser = await store.getPublicUser(user.id);
  req.session.user = sessionUser;
  return res.json({ user: sessionUser });
});

app.post('/api/logout', requireAuth, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', requireAuth, async (req, res, next) => {
  try {
    res.json({ user: await attachSessionUser(req) });
  } catch (error) {
    next(error);
  }
});

app.put('/api/me', requireAuth, async (req, res, next) => {
  try {
    if (!req.body.name || !req.body.email) {
      return res.status(400).json({ error: 'Informe nome e e-mail.' });
    }

    if (req.body.password && req.body.password.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    if (req.body.avatar && !String(req.body.avatar).startsWith('data:image/')) {
      return res.status(400).json({ error: 'Avatar inválido.' });
    }

    await store.updateUserProfile(req.session.user.id, req.body);
    const user = await attachSessionUser(req);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

app.get('/api/users', requireAuth, async (req, res, next) => {
  try {
    res.json({ users: await store.listUsers() });
  } catch (error) {
    next(error);
  }
});

app.post('/api/users', requireAuth, async (req, res, next) => {
  try {
    const user = await store.createUser(req.body);
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/users/:id/password', requireAuth, requireOwner, async (req, res, next) => {
  try {
    const user = await store.updateUserPassword(req.params.id, req.body.password || '');
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/users/:id', requireAuth, requireOwner, async (req, res, next) => {
  try {
    if (req.params.id === req.session.user.id) {
      return res.status(403).json({ error: 'Voce nao pode apagar sua propria conta.' });
    }

    await store.deleteUser(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/whatsapp', requireAuth, (req, res) => {
  res.json(whatsapp.getState());
});

app.post('/api/whatsapp/groups/refresh', requireAuth, async (req, res, next) => {
  try {
    const groups = await whatsapp.refreshGroups();
    res.json({ groups });
  } catch (error) {
    next(error);
  }
});

app.post('/api/whatsapp/disconnect', requireAuth, async (req, res, next) => {
  try {
    await whatsapp.disconnectWhatsApp({ clearSession: Boolean(req.body.clearSession) });
    res.json(whatsapp.getState());
  } catch (error) {
    next(error);
  }
});

app.get('/api/contacts', requireAuth, async (req, res, next) => {
  try {
    res.json({ contacts: await store.listContacts() });
  } catch (error) {
    next(error);
  }
});

app.post('/api/contacts', requireAuth, async (req, res, next) => {
  try {
    const contact = await store.createContact(req.body);
    res.status(201).json({ contact });
  } catch (error) {
    next(error);
  }
});

app.put('/api/contacts/:id', requireAuth, async (req, res, next) => {
  try {
    const contact = await store.updateContact(req.params.id, req.body);
    res.json({ contact });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/contacts/:id', requireAuth, async (req, res, next) => {
  try {
    await store.deleteContact(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/conversations', requireAuth, async (req, res, next) => {
  try {
    res.json({ conversations: await whatsapp.listConversations() });
  } catch (error) {
    next(error);
  }
});

app.get('/api/conversations/:id/messages', requireAuth, async (req, res, next) => {
  try {
    res.json({ messages: await whatsapp.listMessages(req.params.id, req.query.limit || 24) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/conversations/:id/messages', requireAuth, async (req, res, next) => {
  try {
    if ((!req.body.message || !req.body.message.trim()) && !req.body.media) {
      return res.status(400).json({ error: 'Informe a mensagem ou anexo.' });
    }

    const result = req.body.media
      ? await whatsapp.sendMessageWithMedia(req.params.id, { message: (req.body.message || '').trim(), media: req.body.media })
      : await whatsapp.sendMessage(req.params.id, req.body.message.trim());
    res.json({ result });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/conversations/:id/messages/:messageId', requireAuth, async (req, res, next) => {
  try {
    await whatsapp.deleteMessage(req.params.id, req.params.messageId, {
      everyone: req.query.everyone !== 'false'
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post('/api/conversations/message-delete', requireAuth, async (req, res, next) => {
  try {
    await whatsapp.deleteMessage(req.body.chatId, req.body.messageId, {
      everyone: req.body.everyone !== false
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/conversations/:id/messages/:messageId', requireAuth, async (req, res, next) => {
  try {
    const body = String(req.body.message || '').trim();
    if (!body) return res.status(400).json({ error: 'Informe a nova mensagem.' });
    await whatsapp.editMessage(req.params.id, req.params.messageId, body);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/conversations/:id', requireAuth, async (req, res, next) => {
  try {
    await whatsapp.deleteConversation(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/whatsapp/groups/:id/participants', requireAuth, async (req, res, next) => {
  try {
    res.json({ participants: await whatsapp.listGroupParticipants(req.params.id) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/whatsapp/group-participants', requireAuth, async (req, res, next) => {
  try {
    res.json({ participants: await whatsapp.listGroupParticipants(req.body.groupId) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/whatsapp/participants', requireAuth, async (req, res, next) => {
  try {
    res.json({ participants: await whatsapp.listGroupParticipants(req.query.groupId) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/stats/participants', requireAuth, async (req, res, next) => {
  try {
    res.json({ participants: await whatsapp.listGroupParticipants(req.body.groupId) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/stats/attendance', requireAuth, async (req, res, next) => {
  try {
    const watcherIds = String(req.query.watcherIds || '').split(',').map((item) => item.trim()).filter(Boolean);
    const watchers = (await store.listWatchers()).filter((watcher) => !watcherIds.length || watcherIds.includes(watcher.id));
    try {
      res.json({ stats: await whatsapp.getWatcherStats(watchers, req.query.date) });
    } catch (error) {
      if (error.status !== 409) throw error;
      res.json({
        stats: await store.listAttendanceStats(watchers, req.query.date),
        offline: true
      });
    }
  } catch (error) {
    next(error);
  }
});

app.get('/api/watchers', requireAuth, async (req, res, next) => {
  try {
    res.json({ watchers: await store.listWatchers() });
  } catch (error) {
    next(error);
  }
});

app.post('/api/watchers', requireAuth, async (req, res, next) => {
  try {
    const watcher = await store.createWatcher(req.body);
    res.status(201).json({ watcher });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/watchers/:id', requireAuth, async (req, res, next) => {
  try {
    await store.deleteWatcher(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/schedules', requireAuth, async (req, res, next) => {
  try {
    res.json({ schedules: await store.listSchedules() });
  } catch (error) {
    next(error);
  }
});

app.post('/api/schedules', requireAuth, async (req, res, next) => {
  try {
    const validationError = validateSchedule(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const schedule = await store.createSchedule(req.body, req.session.user.id);
    return res.status(201).json({ schedule });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/schedules/:id', requireAuth, async (req, res, next) => {
  try {
    const validationError = validateSchedule(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const schedule = await store.updateSchedule(req.params.id, req.body);
    return res.json({ schedule });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/schedules/:id/toggle', requireAuth, async (req, res, next) => {
  try {
    const schedule = await store.getSchedule(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Agendamento não encontrado.' });

    const updated = await store.patchSchedule(req.params.id, { active: !schedule.active });
    return res.json({ schedule: updated });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/schedules/:id/send-now', requireAuth, async (req, res, next) => {
  try {
    const schedule = await store.getSchedule(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Agendamento não encontrado.' });

    const results = await whatsapp.sendMessageToTargets({
      groupIds: schedule.groupIds || [],
      contactIds: schedule.contactIds || []
    }, formatBotMessage(schedule));
    await store.addSendLog({
      scheduleId: schedule.id,
      scheduleTitle: schedule.title,
      results,
      status: results.every((result) => result.ok) ? 'sent' : 'partial',
      manual: true,
      sentBy: req.session.user.id
    });

    return res.json({ results });
  } catch (error) {
    return next(error);
  }
});

function formatBotMessage(schedule) {
  const botName = schedule.botName || 'SuperVISOR';
  return `*${botName}*:\n${schedule.message}`;
}

app.delete('/api/schedules/:id', requireAuth, async (req, res, next) => {
  try {
    await store.deleteSchedule(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/logs', requireAuth, async (req, res, next) => {
  try {
    res.json({ logs: await store.listSendLogs() });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || 'Erro inesperado.' });
});

io.on('connection', (socket) => {
  socket.emit('whatsapp:state', whatsapp.getState());
});

server.listen(PORT, () => {
  console.log(`Painel disponivel em http://localhost:${PORT}`);
  whatsapp.initWhatsApp(io);
  scheduler.startScheduler();
});

let shutdownStarted = false;

async function shutdown(signal) {
  if (shutdownStarted) return;
  shutdownStarted = true;
  console.log(`Recebido ${signal}. Encerrando o SuperVISOR com segurança...`);

  const forceExit = setTimeout(() => {
    console.error('Tempo limite de encerramento atingido. Finalizando processo.');
    process.exit(1);
  }, 18000);
  forceExit.unref();

  server.close();
  try {
    await whatsapp.shutdownWhatsApp();
    clearTimeout(forceExit);
    process.exit(0);
  } catch (error) {
    console.error('Erro durante encerramento do SuperVISOR:', error);
    clearTimeout(forceExit);
    process.exit(1);
  }
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
