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

function integrationMessage(message, botName) {
  const name = String(botName || '').trim();
  const text = String(message || '').trim();
  return name && !text.startsWith(`*${name}*:`) ? `*${name}*:\n${text}` : text;
}

function eventFingerprint(body, groupIds, contactIds) {
  const supplied = String(body.dedupeKey || '').trim();
  if (supplied) return supplied.slice(0, 300);
  const normalizedMessage = String(body.message || '').replace(/\s+/g, ' ').trim().toLowerCase();
  return crypto.createHash('sha256').update(JSON.stringify({
    source: String(body.source || 'gUMperformance'),
    type: String(body.type || 'notification'),
    message: normalizedMessage,
    targets: [...groupIds, ...contactIds].sort()
  })).digest('hex');
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
      const historyError = new Error('O historico antirrepeticao da integracao esta indisponivel. O envio foi bloqueado para evitar mensagens duplicadas.');
      historyError.status = 503;
      throw historyError;
    }
  }

  function writeHistory(history) {
    fs.mkdirSync(dataDir, { recursive: true });
    const temporaryFile = `${historyFile}.${process.pid}.${crypto.randomUUID()}.tmp`;
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

  router.get('/events/:eventId', (req, res) => {
    const eventId = String(req.params.eventId || '').trim();
    const event = readHistory().events.find((item) => item.eventId === eventId);
    if (!event) return res.status(404).json({ error: 'Evento ainda nao recebido pelo SuperVISOR.' });
    return res.json({ event });
  });

  router.post('/events', async (req, res, next) => {
    const eventId = String(req.body.eventId || '').trim();
    if (!eventId || eventId.length > 240) return res.status(400).json({ error: 'eventId invalido.' });
    const requestedGroupIds = uniqueStrings(req.body.groupIds);
    const requestedContactIds = uniqueStrings(req.body.contactIds);
    const requestedFingerprint = eventFingerprint(req.body, requestedGroupIds, requestedContactIds);
    const fingerprintProcessingKey = `fingerprint:${requestedFingerprint}`;

    if (processing.has(eventId)) {
      try {
        return res.json(await processing.get(eventId));
      } catch (error) {
        return next(error);
      }
    }
    if (processing.has(fingerprintProcessingKey)) {
      try {
        return res.json(await processing.get(fingerprintProcessingKey));
      } catch (error) {
        return next(error);
      }
    }

    const job = (async () => {
      const message = String(req.body.message || '').trim();
      const botName = String(req.body.botName || '').trim().slice(0, 80);
      const groupIds = requestedGroupIds;
      const contactIds = requestedContactIds;
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
      const fingerprint = requestedFingerprint;
      const cooldownMinutes = Math.max(1, Math.min(1440, Number(req.body.cooldownMinutes || 360)));
      const cooldownStart = Date.now() - cooldownMinutes * 60 * 1000;
      const recentEquivalent = history.events.find((item) => (
        item.eventId !== eventId
        && (item.fingerprint || eventFingerprint(item, item.groupIds, item.contactIds)) === fingerprint
        && item.status === 'sent'
        && Date.parse(item.updatedAt || item.receivedAt || 0) >= cooldownStart
      ));

      if (!previous && recentEquivalent) {
        return {
          ok: true,
          duplicate: true,
          suppressedByCooldown: true,
          eventId,
          previousEventId: recentEquivalent.eventId,
          results: recentEquivalent.results || []
        };
      }

      if (!previous) {
        history.events.push({
          eventId,
          type: String(req.body.type || 'notification'),
          source: String(req.body.source || 'gUMperformance'),
          occurredAt: req.body.occurredAt || new Date().toISOString(),
          receivedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'processing',
          message,
          botName,
          fingerprint,
          cooldownMinutes,
          groupIds,
          contactIds,
          results: []
        });
        writeHistory(history);
      }
      const successfulTargets = new Set((previous?.results || []).filter((item) => item.ok).map((item) => item.targetId));
      const pendingGroupIds = groupIds.filter((id) => !successfulTargets.has(id));
      const pendingContactIds = contactIds.filter((id) => !successfulTargets.has(id));

      if (!pendingGroupIds.length && !pendingContactIds.length) {
        return { ok: true, duplicate: true, eventId, results: previous.results || [] };
      }

      const results = await whatsapp.sendMessageToTargets({
        groupIds: pendingGroupIds,
        contactIds: pendingContactIds
      }, integrationMessage(message, botName));
      const latestHistory = readHistory();
      const latestPrevious = latestHistory.events.find((item) => item.eventId === eventId);
      const mergedResults = [
        ...(latestPrevious?.results || []),
        ...results.filter((result) => !successfulTargets.has(result.targetId))
      ];
      const allSent = [...groupIds, ...contactIds].every((id) => mergedResults.some((result) => result.targetId === id && result.ok));
      const record = {
        eventId,
        type: String(req.body.type || 'notification'),
        source: String(req.body.source || 'gUMperformance'),
        occurredAt: req.body.occurredAt || new Date().toISOString(),
        receivedAt: latestPrevious?.receivedAt || previous?.receivedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: allSent ? 'sent' : 'partial',
        message,
        botName,
        fingerprint,
        cooldownMinutes,
        groupIds,
        contactIds,
        results: mergedResults
      };
      latestHistory.events = latestHistory.events.filter((item) => item.eventId !== eventId);
      latestHistory.events.push(record);
      writeHistory(latestHistory);
      return { ok: allSent, duplicate: false, eventId, results: mergedResults };
    })();

    processing.set(eventId, job);
    processing.set(fingerprintProcessingKey, job);
    try {
      const result = await job;
      return res.status(result.ok ? 200 : 502).json(result);
    } catch (error) {
      return next(error);
    } finally {
      processing.delete(eventId);
      processing.delete(fingerprintProcessingKey);
    }
  });

  return router;
}

module.exports = { createGumIntegration };
