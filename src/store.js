const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const { v4: uuid } = require('uuid');

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'whatsapp_manager_bot';

const defaultStore = {
  users: [],
  schedules: [],
  sendLogs: [],
  contacts: [],
  watchers: [],
  attendanceStats: []
};

let mongoClient;
let mongoDb;

async function getDb() {
  if (!MONGODB_URI) return null;
  if (mongoDb) return mongoDb;

  mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  mongoDb = mongoClient.db(MONGODB_DB);
  await mongoDb.collection('users').createIndex({ email: 1 }, { unique: true });
  return mongoDb;
}

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(defaultStore, null, 2));
  }

}

function readFileStore() {
  ensureStore();
  const store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  return { ...defaultStore, ...store };
}

function writeFileStore(store) {
  ensureStore();
  fs.writeFileSync(STORE_FILE, JSON.stringify({ ...defaultStore, ...store }, null, 2));
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((tag) => String(tag || '').trim()).filter(Boolean))];
  }

  return [...new Set(String(value || '').split(',').map((tag) => tag.trim()).filter(Boolean))];
}

function normalizeContact(contact) {
  const tags = normalizeTags(contact.tags && contact.tags.length ? contact.tags : contact.tag);
  return {
    ...contact,
    tag: tags.join(', '),
    tags
  };
}

function whatsappContactId(phone) {
  const normalized = normalizePhone(phone);
  return normalized ? `${normalized}@c.us` : '';
}

function sortUsersByCreation(users) {
  return [...users].sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
}

function publicUser(user, isOwner = false) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || null,
    createdAt: user.createdAt,
    role: isOwner ? 'owner' : user.role || 'admin',
    isOwner
  };
}

async function getRawUsers() {
  const db = await getDb();
  return db ? await db.collection('users').find({}).sort({ createdAt: 1 }).toArray() : sortUsersByCreation(readFileStore().users);
}

function markPublicUsers(users) {
  const ownerId = users[0]?.id;
  return users.map((user) => publicUser(user, user.id === ownerId || user.role === 'owner'));
}

async function getPublicUser(id) {
  const users = await getRawUsers();
  return markPublicUsers(users).find((user) => user.id === id) || null;
}

async function isOwner(id) {
  const user = await getPublicUser(id);
  return Boolean(user?.isOwner);
}

async function createUser({ name, email, password }) {
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = {
    id: uuid(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: (await hasUsers()) ? 'admin' : 'owner',
    createdAt: new Date().toISOString()
  };

  if (db) {
    try {
      await db.collection('users').insertOne(user);
      return publicUser(user);
    } catch (error) {
      if (error.code === 11000) {
        const conflict = new Error('Este e-mail já está cadastrado.');
        conflict.status = 409;
        throw conflict;
      }

      throw error;
    }
  }

  const store = readFileStore();
  if (store.users.some((item) => item.email === normalizedEmail)) {
    const error = new Error('Este e-mail já está cadastrado.');
    error.status = 409;
    throw error;
  }

  store.users.push(user);
  writeFileStore(store);
  return publicUser(user);
}

async function verifyUser(email, password) {
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const user = db
    ? await db.collection('users').findOne({ email: normalizedEmail })
    : readFileStore().users.find((item) => item.email === normalizedEmail);

  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? publicUser(user) : null;
}

async function updateUserProfile(id, payload) {
  const db = await getDb();
  const existing = db
    ? await db.collection('users').findOne({ id })
    : readFileStore().users.find((item) => item.id === id);

  if (!existing) {
    const error = new Error('Usuário não encontrado.');
    error.status = 404;
    throw error;
  }

  const updatedFields = {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    avatar: payload.avatar || existing.avatar || null
  };

  if (payload.password) {
    updatedFields.passwordHash = await bcrypt.hash(payload.password, 12);
  }

  if (db) {
    await db.collection('users').updateOne({ id }, { $set: updatedFields });
    return publicUser({ ...existing, ...updatedFields });
  }

  const store = readFileStore();
  const index = store.users.findIndex((item) => item.id === id);
  store.users[index] = { ...store.users[index], ...updatedFields };
  writeFileStore(store);
  return publicUser(store.users[index]);
}

async function hasUsers() {
  const db = await getDb();
  return db ? (await db.collection('users').countDocuments()) > 0 : readFileStore().users.length > 0;
}

async function listUsers() {
  return markPublicUsers(await getRawUsers());
}

async function updateUserPassword(id, password) {
  if (!password || password.length < 6) {
    const error = new Error('A nova senha deve ter pelo menos 6 caracteres.');
    error.status = 400;
    throw error;
  }

  const db = await getDb();
  const passwordHash = await bcrypt.hash(password, 12);

  if (db) {
    const result = await db.collection('users').updateOne({ id }, { $set: { passwordHash } });
    if (!result.matchedCount) {
      const error = new Error('UsuÃ¡rio nÃ£o encontrado.');
      error.status = 404;
      throw error;
    }
    return getPublicUser(id);
  }

  const store = readFileStore();
  const index = store.users.findIndex((user) => user.id === id);
  if (index === -1) {
    const error = new Error('UsuÃ¡rio nÃ£o encontrado.');
    error.status = 404;
    throw error;
  }

  store.users[index].passwordHash = passwordHash;
  writeFileStore(store);
  return getPublicUser(id);
}

async function deleteUser(id) {
  const users = await getRawUsers();
  const target = users.find((user) => user.id === id);

  if (!target) {
    const error = new Error('UsuÃ¡rio nÃ£o encontrado.');
    error.status = 404;
    throw error;
  }

  if (await isOwner(id)) {
    const error = new Error('O usuÃ¡rio principal nÃ£o pode ser apagado.');
    error.status = 403;
    throw error;
  }

  const db = await getDb();
  if (db) {
    await db.collection('users').deleteOne({ id });
    return;
  }

  const store = readFileStore();
  store.users = store.users.filter((user) => user.id !== id);
  writeFileStore(store);
}

async function listContacts() {
  const db = await getDb();
  const contacts = db
    ? await db.collection('contacts').find({}).sort({ name: 1 }).toArray()
    : readFileStore().contacts.sort((a, b) => a.name.localeCompare(b.name));

  return contacts.map(normalizeContact);
}

async function createContact(payload) {
  const db = await getDb();
  const phone = normalizePhone(payload.phone);

  if (!payload.name || payload.name.trim().length < 2) {
    const error = new Error('Informe o nome do contato.');
    error.status = 400;
    throw error;
  }

  if (phone.length < 10) {
    const error = new Error('Informe um telefone valido com DDD.');
    error.status = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const tags = normalizeTags(payload.tags || payload.tag);
  const contact = {
    id: uuid(),
    name: payload.name.trim(),
    tag: tags.join(', '),
    tags,
    phone,
    whatsappId: whatsappContactId(phone),
    notes: (payload.notes || '').trim(),
    createdAt: now,
    updatedAt: now
  };

  if (db) {
    await db.collection('contacts').insertOne(contact);
    return contact;
  }

  const store = readFileStore();
  if (store.contacts.some((item) => item.phone === phone)) {
    const error = new Error('Este contato ja esta cadastrado.');
    error.status = 409;
    throw error;
  }

  store.contacts.push(contact);
  writeFileStore(store);
  return contact;
}

async function updateContact(id, payload) {
  const db = await getDb();
  const existing = db
    ? await db.collection('contacts').findOne({ id })
    : readFileStore().contacts.find((contact) => contact.id === id);

  if (!existing) {
    const error = new Error('Contato nao encontrado.');
    error.status = 404;
    throw error;
  }

  const phone = normalizePhone(payload.phone);
  const tags = normalizeTags(payload.tags || payload.tag);
  const updated = {
    ...existing,
    name: payload.name.trim(),
    tag: tags.join(', '),
    tags,
    phone,
    whatsappId: whatsappContactId(phone),
    notes: (payload.notes || '').trim(),
    updatedAt: new Date().toISOString()
  };
  delete updated._id;

  if (db) {
    await db.collection('contacts').updateOne({ id }, { $set: updated });
    return updated;
  }

  const store = readFileStore();
  const index = store.contacts.findIndex((contact) => contact.id === id);
  store.contacts[index] = updated;
  writeFileStore(store);
  return updated;
}

async function deleteContact(id) {
  const db = await getDb();

  if (db) {
    await db.collection('contacts').deleteOne({ id });
    await db.collection('watchers').deleteMany({ contactId: id });
    return;
  }

  const store = readFileStore();
  store.contacts = store.contacts.filter((contact) => contact.id !== id);
  store.watchers = store.watchers.filter((watcher) => watcher.contactId !== id);
  writeFileStore(store);
}

async function listWatchers() {
  const db = await getDb();
  const watchers = db
    ? await db.collection('watchers').find({}).sort({ createdAt: -1 }).toArray()
    : readFileStore().watchers;

  return watchers;
}

function statDateFromTimestamp(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function emptyAttendanceStat(watcher, date) {
  return {
    ...watcher,
    date,
    firstMessageAt: null,
    lastMessageAt: null,
    count: 0
  };
}

async function recordAttendanceMessage(watcher, timestamp = Date.now()) {
  if (!watcher?.id || !watcher?.groupId) return null;
  const db = await getDb();
  const date = statDateFromTimestamp(timestamp);
  const key = { watcherId: watcher.id, date };
  const base = {
    watcherId: watcher.id,
    contactId: watcher.contactId || null,
    contactName: watcher.contactName || 'Participante',
    contactPhone: watcher.contactPhone || '',
    contactTag: watcher.contactTag || '',
    participantId: watcher.participantId || null,
    groupId: watcher.groupId,
    groupName: watcher.groupName || 'Grupo',
    date
  };

  if (db) {
    const existing = await db.collection('attendanceStats').findOne(key);
    await db.collection('attendanceStats').updateOne(
      key,
      {
        $set: {
          ...base,
          firstMessageAt: existing?.firstMessageAt ? Math.min(existing.firstMessageAt, timestamp) : timestamp,
          lastMessageAt: existing?.lastMessageAt ? Math.max(existing.lastMessageAt, timestamp) : timestamp,
          updatedAt: new Date().toISOString()
        },
        $inc: { count: 1 },
        $setOnInsert: { id: uuid(), createdAt: new Date().toISOString() }
      },
      { upsert: true }
    );
    return db.collection('attendanceStats').findOne(key);
  }

  const store = readFileStore();
  const index = store.attendanceStats.findIndex((item) => item.watcherId === watcher.id && item.date === date);
  if (index === -1) {
    const stat = {
      id: uuid(),
      ...base,
      firstMessageAt: timestamp,
      lastMessageAt: timestamp,
      count: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.attendanceStats.push(stat);
    writeFileStore(store);
    return stat;
  }

  store.attendanceStats[index] = {
    ...store.attendanceStats[index],
    ...base,
    firstMessageAt: store.attendanceStats[index].firstMessageAt ? Math.min(store.attendanceStats[index].firstMessageAt, timestamp) : timestamp,
    lastMessageAt: store.attendanceStats[index].lastMessageAt ? Math.max(store.attendanceStats[index].lastMessageAt, timestamp) : timestamp,
    count: Number(store.attendanceStats[index].count || 0) + 1,
    updatedAt: new Date().toISOString()
  };
  writeFileStore(store);
  return store.attendanceStats[index];
}

async function listAttendanceStats(watchers = [], date = null) {
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))
    ? date
    : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const watcherIds = watchers.map((watcher) => watcher.id);
  const db = await getDb();
  const saved = db
    ? await db.collection('attendanceStats').find({ date: selectedDate, watcherId: { $in: watcherIds } }).toArray()
    : readFileStore().attendanceStats.filter((item) => item.date === selectedDate && watcherIds.includes(item.watcherId));
  const byWatcher = new Map(saved.map((item) => [item.watcherId, item]));

  return watchers.map((watcher) => ({
    ...emptyAttendanceStat(watcher, selectedDate),
    ...(byWatcher.get(watcher.id) || {})
  }));
}

async function createWatcher(payload) {
  const db = await getDb();

  if ((!payload.contactId && !payload.participantId) || !payload.groupId) {
    const error = new Error('Selecione um contato/participante e um grupo para observar.');
    error.status = 400;
    throw error;
  }

  const contacts = await listContacts();
  const contact = payload.contactId ? contacts.find((item) => item.id === payload.contactId) : null;

  const now = new Date().toISOString();
  const watcher = {
    id: uuid(),
    contactId: contact?.id || null,
    contactName: contact?.name || payload.participantName || 'Participante',
    contactPhone: contact?.phone || payload.participantPhone || '',
    contactTag: contact?.tag || '',
    participantId: payload.participantId || null,
    groupId: payload.groupId,
    groupName: payload.groupName || 'Grupo',
    createdAt: now
  };

  if (db) {
    const existing = await db.collection('watchers').findOne({
      groupId: watcher.groupId,
      $or: [
        { contactId: watcher.contactId },
        { participantId: watcher.participantId }
      ]
    });
    if (existing) {
      const error = new Error('Este contato/participante ja esta sendo observado neste grupo.');
      error.status = 409;
      throw error;
    }

    await db.collection('watchers').insertOne(watcher);
    return watcher;
  }

  const store = readFileStore();
  if (store.watchers.some((item) => item.groupId === watcher.groupId && (
    (watcher.contactId && item.contactId === watcher.contactId)
    || (watcher.participantId && item.participantId === watcher.participantId)
  ))) {
    const error = new Error('Este contato ja esta sendo observado neste grupo.');
    error.status = 409;
    throw error;
  }

  store.watchers.push(watcher);
  writeFileStore(store);
  return watcher;
}

async function deleteWatcher(id) {
  const db = await getDb();

  if (db) {
    await db.collection('watchers').deleteOne({ id });
    return;
  }

  const store = readFileStore();
  store.watchers = store.watchers.filter((watcher) => watcher.id !== id);
  writeFileStore(store);
}

async function listSchedules() {
  const db = await getDb();
  const schedules = db
    ? await db.collection('schedules').find({}).sort({ time: 1 }).toArray()
    : readFileStore().schedules.sort((a, b) => a.time.localeCompare(b.time));

  return schedules;
}

async function getSchedule(id) {
  const db = await getDb();
  return db
    ? await db.collection('schedules').findOne({ id })
    : readFileStore().schedules.find((schedule) => schedule.id === id);
}

async function createSchedule(payload, userId) {
  const db = await getDb();
  const store = db ? null : readFileStore();
  const now = new Date().toISOString();
  const schedule = {
    id: uuid(),
    title: payload.title.trim(),
    botName: (payload.botName || 'SuperVISOR').trim(),
    message: payload.message.trim(),
    groupIds: payload.groupIds || [],
    groupNames: payload.groupNames || [],
    contactIds: payload.contactIds || [],
    contactNames: payload.contactNames || [],
    time: payload.time,
    scheduleMode: payload.scheduleMode || 'weekly',
    days: payload.days || [],
    specificDates: payload.specificDates || [],
    active: Boolean(payload.active),
    lastRunKey: null,
    createdBy: userId,
    createdAt: now,
    updatedAt: now
  };

  if (db) {
    await db.collection('schedules').insertOne(schedule);
    return schedule;
  }

  store.schedules.push(schedule);
  writeFileStore(store);
  return schedule;
}

async function updateSchedule(id, payload) {
  const db = await getDb();
  const existing = await getSchedule(id);

  if (!existing) {
    const error = new Error('Agendamento não encontrado.');
    error.status = 404;
    throw error;
  }

  const updated = {
    ...existing,
    title: payload.title.trim(),
    botName: (payload.botName || 'SuperVISOR').trim(),
    message: payload.message.trim(),
    groupIds: payload.groupIds || [],
    groupNames: payload.groupNames || [],
    contactIds: payload.contactIds || [],
    contactNames: payload.contactNames || [],
    time: payload.time,
    scheduleMode: payload.scheduleMode || 'weekly',
    days: payload.days || [],
    specificDates: payload.specificDates || [],
    active: Boolean(payload.active),
    updatedAt: new Date().toISOString()
  };
  delete updated._id;

  if (db) {
    await db.collection('schedules').updateOne({ id }, { $set: updated });
    return updated;
  }

  const store = readFileStore();
  const index = store.schedules.findIndex((schedule) => schedule.id === id);
  store.schedules[index] = updated;
  writeFileStore(store);
  return updated;
}

async function patchSchedule(id, patch) {
  const db = await getDb();
  const existing = await getSchedule(id);

  if (!existing) {
    const error = new Error('Agendamento não encontrado.');
    error.status = 404;
    throw error;
  }

  const updated = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString()
  };
  delete updated._id;

  if (db) {
    await db.collection('schedules').updateOne({ id }, { $set: updated });
    return updated;
  }

  const store = readFileStore();
  const index = store.schedules.findIndex((schedule) => schedule.id === id);
  store.schedules[index] = updated;
  writeFileStore(store);
  return updated;
}

async function deleteSchedule(id) {
  const db = await getDb();

  if (db) {
    await db.collection('schedules').deleteOne({ id });
    return;
  }

  const store = readFileStore();
  store.schedules = store.schedules.filter((schedule) => schedule.id !== id);
  writeFileStore(store);
}

async function markScheduleRun(id, runKey) {
  await patchSchedule(id, { lastRunKey: runKey });
}

async function addSendLog(entry) {
  const db = await getDb();
  const log = {
    id: uuid(),
    ...entry,
    createdAt: new Date().toISOString()
  };

  if (db) {
    await db.collection('sendLogs').insertOne(log);
    const oldLogs = await db
      .collection('sendLogs')
      .find({})
      .sort({ createdAt: -1 })
      .skip(200)
      .project({ _id: 1 })
      .toArray();

    if (oldLogs.length) {
      await db.collection('sendLogs').deleteMany({ _id: { $in: oldLogs.map((item) => item._id) } });
    }

    return;
  }

  const store = readFileStore();
  store.sendLogs.unshift(log);
  store.sendLogs = store.sendLogs.slice(0, 200);
  writeFileStore(store);
}

async function listSendLogs() {
  const db = await getDb();
  return db
    ? await db.collection('sendLogs').find({}).sort({ createdAt: -1 }).limit(100).toArray()
    : readFileStore().sendLogs.slice(0, 100);
}

module.exports = {
  addSendLog,
  createSchedule,
  createContact,
  createWatcher,
  createUser,
  deleteContact,
  deleteSchedule,
  deleteWatcher,
  deleteUser,
  getPublicUser,
  getSchedule,
  hasUsers,
  isOwner,
  listAttendanceStats,
  listSchedules,
  listSendLogs,
  listContacts,
  listWatchers,
  listUsers,
  markScheduleRun,
  patchSchedule,
  recordAttendanceMessage,
  updateUserPassword,
  updateContact,
  updateUserProfile,
  updateSchedule,
  verifyUser
};
