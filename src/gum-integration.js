const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');

const MAX_EVENT_HISTORY = 5000;

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || '').trim()).filter(Boolean))];
}

function createGumIntegration({ whatsapp, dataDir }) {
  const router = express.Router();
  const historyFile = path.join(dataDir, 'gum-integration-events.json');
  const processing = new Map();

  function readHistory() {
    try {
      if (!fs.existsSync(historyFile)) return { events: [] };
      const parsed = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      return { events: Array.isArray(parsed.events) ? parsed.events : [] };
    } catch (error) {
      console.error('Nao foi possivel ler o historico da integracao gUMperformance:', error);
      return { events: [] };
    }
  }

  function writeHistory(history) {
    fs.mkdirSync(dataDir, { recursive: true });
    const temporaryFile = `${historyFile}.tmp`;
    const events = (history.events || []).slice(-MAX_EVENT_HISTORY);
    fs.writeFileSync(temporaryFile, JSON.stringify({ events }, null, 2));
    fs.renameSync(temporaryFile, historyFile);
  }

  function requireIntegrationSecret(req, res, next) {
    const configured = process.env.GUM_INTEGRATION_SECRET;
    const received = req.get('x-gum-integration-key');
    if (!configured) {
      return res.status(503).json({ error: 'GUM_INTEGRATION_SECRET nao foi configurado no SuperVISOR.' });
    }
    if (!safeEqual(configured, received)) {
      return res.status(401).json({ error: 'Credencial da integracao invalida.' });
    }
    return next();
  }

  router.use(requireIntegrationSecret);

  router.get('/health', (req, res) => {
    const state = whatsapp.getState();
    res.json({
      ok: true,
      whatsappStatus: state.status,
      connectedNumber: state.connectedNumber || null,
      groupsCached: (state.groups || []).length
    });
  });

  router.get('/groups', async (req, res, next) => {
    try {
      const current = whatsapp.getState();
      const groups = req.query.refresh === 'true' || !(current.groups || []).length
        ? await whatsapp.refreshGroups()
        : current.groups;
      res.json({ groups: groups || [] });
    } catch (error) {
      next(error);
    }
  });

  router.get('/events', (req, res) => {
    const limit = Math.max(1, Math.min(250, Number(req.query.limit || 50)));
    res.json({ events: readHistory().events.slice(-limit).reverse() });
  });

  router.post('/events', async (req, res, next) => {
    const eventId = String(req.body.eventId || '').trim();
    if (!eventId || eventId.length > 240) return res.status(400).json({ error: 'eventId invalido.' });

    if (processing.has(eventId)) {
      try {
        return res.json(await processing.get(eventId));
      } catch (error) {
        return next(error);
      }
    }

    const job = (async () => {
      const message = String(req.body.message || '').trim();
      const groupIds = uniqueStrings(req.body.groupIds);
      const contactIds = uniqueStrings(req.body.contactIds);
      if (!message) {
        const error = new Error('A mensagem do evento esta vazia.');
        error.status = 400;
        throw error;
      }
      if (!groupIds.length && !contactIds.length) {
        const error = new Error('O evento nao possui grupos ou contatos de destino.');
        error.status = 400;
        throw error;
      }

      const history = readHistory();
      const previous = history.events.find((item) => item.eventId === eventId);
      const successfulTargets = new Set((previous?.results || []).filter((item) => item.ok).map((item) => item.targetId));
      const pendingGroupIds = groupIds.filter((id) => !successfulTargets.has(id));
      const pendingContactIds = contactIds.filter((id) => !successfulTargets.has(id));

      if (!pendingGroupIds.length && !pendingContactIds.length) {
        return { ok: true, duplicate: true, eventId, results: previous.results || [] };
      }

      const results = await whatsapp.sendMessageToTargets({
        groupIds: pendingGroupIds,
        contactIds: pendingContactIds
      }, message);
      const mergedResults = [
        ...(previous?.results || []),
        ...results.filter((result) => !successfulTargets.has(result.targetId))
      ];
      const allSent = [...groupIds, ...contactIds].every((id) => mergedResults.some((result) => result.targetId === id && result.ok));
      const record = {
        eventId,
        type: String(req.body.type || 'notification'),
        source: String(req.body.source || 'gUMperformance'),
        occurredAt: req.body.occurredAt || new Date().toISOString(),
        receivedAt: previous?.receivedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: allSent ? 'sent' : 'partial',
        message,
        groupIds,
        contactIds,
        results: mergedResults
      };
      history.events = history.events.filter((item) => item.eventId !== eventId);
      history.events.push(record);
      writeHistory(history);
      return { ok: allSent, duplicate: false, eventId, results: mergedResults };
    })();

    processing.set(eventId, job);
    try {
      const result = await job;
      return res.status(result.ok ? 200 : 502).json(result);
    } catch (error) {
      return next(error);
    } finally {
      processing.delete(eventId);
    }
  });

  return router;
}

module.exports = { createGumIntegration };
