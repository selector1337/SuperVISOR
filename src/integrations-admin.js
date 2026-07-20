const express = require('express');

const ALLOWED_CONFIG_FIELDS = new Set([
  'enabled',
  'intervalSeconds',
  'graceMinutes',
  'expectedLoginTime',
  'defaultGroupIds',
  'groupIdsByUser',
  'groupIdsByDepartment',
  'groupIdsByEvent',
  'enabledEvents',
  'messageTemplates'
]);

function targetDefinitions() {
  return [
    {
      id: 'production',
      name: 'gUMperformance',
      baseUrl: process.env.GUM_PERFORMANCE_API_URL || process.env.GUM_PERFORMANCE_URL || 'http://127.0.0.1:4174'
    },
    {
      id: 'beta',
      name: 'gUMperformance beta',
      baseUrl: process.env.GUM_PERFORMANCE_BETA_API_URL || process.env.GUM_PERFORMANCE_BETA_URL || 'http://127.0.0.1:4175'
    }
  ].map((target) => ({ ...target, baseUrl: String(target.baseUrl).replace(/\/$/, '') }));
}

function integrationTarget(id) {
  return targetDefinitions().find((target) => target.id === id);
}

async function targetRequest(target, pathname, options = {}) {
  const integrationSecret = process.env.GUM_INTEGRATION_SECRET || '';
  const response = await fetch(`${target.baseUrl}${pathname}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(integrationSecret ? { 'x-gum-integration-key': integrationSecret } : {}),
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(12000)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `${target.name} respondeu HTTP ${response.status}.`);
    error.status = response.status >= 400 && response.status < 500 ? response.status : 502;
    throw error;
  }
  return payload;
}

function publicTarget(target, payload) {
  return {
    id: target.id,
    name: target.name,
    baseUrl: target.baseUrl,
    reachable: true,
    config: payload.config || {},
    status: payload.status || {},
    catalog: payload.catalog || { users: [], departments: [], events: [] },
    error: null
  };
}

function sanitizeConfigPatch(body = {}) {
  return Object.fromEntries(Object.entries(body).filter(([key]) => ALLOWED_CONFIG_FIELDS.has(key)));
}

function createIntegrationsAdminRouter({ whatsapp }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const targets = await Promise.all(targetDefinitions().map(async (target) => {
      try {
        const payload = await targetRequest(target, '/api/integrations/supervisor');
        return publicTarget(target, payload);
      } catch (error) {
        return {
          id: target.id,
          name: target.name,
          baseUrl: target.baseUrl,
          reachable: false,
          config: {},
          status: {},
          catalog: { users: [], departments: [], events: [] },
          error: error.message
        };
      }
    }));
    const whatsappState = whatsapp.getState();
    res.json({
      configuredSecret: Boolean(process.env.GUM_INTEGRATION_SECRET),
      whatsapp: {
        status: whatsappState.status,
        connectedNumber: whatsappState.connectedNumber || null,
        groups: whatsappState.groups || []
      },
      targets
    });
  });

  router.put('/:id', async (req, res, next) => {
    const target = integrationTarget(req.params.id);
    if (!target) return res.status(404).json({ error: 'Ambiente de integração não encontrado.' });
    try {
      const payload = await targetRequest(target, '/api/integrations/supervisor', {
        method: 'PUT',
        body: JSON.stringify(sanitizeConfigPatch(req.body))
      });
      return res.json(payload);
    } catch (error) {
      return next(error);
    }
  });

  router.post('/:id/test', async (req, res, next) => {
    const target = integrationTarget(req.params.id);
    if (!target) return res.status(404).json({ error: 'Ambiente de integração não encontrado.' });
    try {
      const payload = await targetRequest(target, '/api/integrations/supervisor/test', {
        method: 'POST',
        body: JSON.stringify({
          groupIds: Array.isArray(req.body.groupIds) ? req.body.groupIds : [],
          message: String(req.body.message || '')
        })
      });
      return res.json(payload);
    } catch (error) {
      return next(error);
    }
  });

  router.post('/:id/scan', async (req, res, next) => {
    const target = integrationTarget(req.params.id);
    if (!target) return res.status(404).json({ error: 'Ambiente de integração não encontrado.' });
    try {
      return res.json(await targetRequest(target, '/api/integrations/supervisor/scan', { method: 'POST' }));
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createIntegrationsAdminRouter };
