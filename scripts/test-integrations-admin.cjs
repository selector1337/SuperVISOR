const assert = require('assert/strict');
const http = require('http');
const express = require('express');
const { createIntegrationsAdminRouter } = require('../src/integrations-admin');

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

function mockTarget(name) {
  const received = [];
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
    assert.equal(req.headers['x-gum-integration-key'], 'configured');
    received.push({ method: req.method, url: req.url, body });
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'GET') {
      return res.end(JSON.stringify({
        config: { enabled: true, defaultGroupIds: ['group-1'] },
        status: { running: true, sent: 3, pending: 0 },
        catalog: { users: [{ id: `${name}-user`, name: name, department: 'comercial' }], departments: ['comercial'], events: [] }
      }));
    }
    return res.end(JSON.stringify({ ok: true, config: body }));
  });
  return { server, received };
}

(async () => {
  const production = mockTarget('Produção');
  const beta = mockTarget('Beta');
  await listen(production.server);
  await listen(beta.server);
  process.env.GUM_PERFORMANCE_API_URL = `http://127.0.0.1:${production.server.address().port}`;
  process.env.GUM_PERFORMANCE_BETA_API_URL = `http://127.0.0.1:${beta.server.address().port}`;
  process.env.GUM_INTEGRATION_SECRET = 'configured';

  const app = express();
  app.use(express.json());
  app.use('/api/admin/integrations', createIntegrationsAdminRouter({
    whatsapp: { getState: () => ({ status: 'ready', connectedNumber: '5521999999999', groups: [{ id: 'group-1', name: 'Gestão' }] }) }
  }));
  const server = http.createServer(app);
  await listen(server);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const dashboard = await fetch(`${baseUrl}/api/admin/integrations`).then((response) => response.json());
  assert.equal(dashboard.targets.length, 2);
  assert(dashboard.targets.every((target) => target.reachable));
  assert.equal(dashboard.targets[1].catalog.users[0].name, 'Beta');
  assert.equal(dashboard.configuredSecret, true);

  const saved = await fetch(`${baseUrl}/api/admin/integrations/production`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: false, botName: 'SuperVISOR', repeatEnabled: false, repeatMinutes: 360, cooldownMinutes: 360, groupIdsByUser: { user: ['group-1'] }, forbidden: 'ignored' })
  }).then((response) => response.json());
  assert.equal(saved.config.enabled, false);
  assert.equal(saved.config.forbidden, undefined);
  assert.equal(saved.config.botName, 'SuperVISOR');
  assert.equal(saved.config.cooldownMinutes, 360);
  assert.equal(saved.config.repeatEnabled, false);
  assert.equal(saved.config.repeatMinutes, 360);
  assert.deepEqual(saved.config.groupIdsByUser, { user: ['group-1'] });

  await close(server);
  await close(production.server);
  await close(beta.server);
  console.log('Painel de integrações validado para produção, beta e salvamento seguro.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
