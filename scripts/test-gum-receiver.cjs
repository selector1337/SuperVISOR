const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const express = require('express');
const { createGumIntegration } = require('../src/gum-integration');

process.env.GUM_INTEGRATION_SECRET = 'receiver-test-secret';
const dataDir = mkdtempSync(join(tmpdir(), 'supervisor-gum-receiver-'));
const sentMessages = [];
const whatsapp = {
  getState: () => ({ status: 'ready', groups: [], connectedNumber: '5511999999999' }),
  refreshGroups: async () => [],
  sendMessageToTargets: async ({ groupIds, contactIds }, message) => {
    if (message.includes('Concorrente')) await new Promise((resolve) => setTimeout(resolve, 25));
    sentMessages.push(message);
    return [...groupIds, ...contactIds].map((targetId) => ({ targetId, ok: true, messageId: `message-${sentMessages.length}` }));
  }
};

(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/integrations/gum', createGumIntegration({ whatsapp, dataDir }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const endpoint = `http://127.0.0.1:${server.address().port}/api/integrations/gum/events`;
  const send = (eventId, message = 'Card pendente', dedupeKey = '') => fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-gum-integration-key': process.env.GUM_INTEGRATION_SECRET },
    body: JSON.stringify({ eventId, type: 'card_overdue', message, botName: 'SuperVISOR', cooldownMinutes: 360, dedupeKey, groupIds: ['group@test'] })
  });

  assert.equal((await send('event-1')).status, 200);
  const repeated = await send('event-2');
  assert.equal(repeated.status, 200);
  assert.equal((await repeated.json()).locked, true);
  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0], '*SuperVISOR*:\nCard pendente');
  assert.equal((await send('event-3', 'Outro card pendente')).status, 200);
  assert.equal(sentMessages.length, 2);
  assert.equal((await send('event-4', '*SuperVISOR*:\nMensagem ja assinada')).status, 200);
  assert.equal(sentMessages[2], '*SuperVISOR*:\nMensagem ja assinada');
  assert.equal((await send('event-5', 'Atrasado desde 17:20', 'task:2026-07-20:123')).status, 200);
  const dynamicRepeat = await send('event-6', 'Atrasado desde 17:22', 'task:2026-07-20:123');
  assert.equal((await dynamicRepeat.json()).locked, true);
  assert.equal(sentMessages.length, 4);

  const concurrent = await Promise.all([
    send('concurrent-1', 'Concorrente A'),
    send('concurrent-2', 'Concorrente B')
  ]);
  assert(concurrent.every((response) => response.status === 200));
  const historyResponse = await fetch(`${endpoint}?limit=50`, {
    headers: { 'x-gum-integration-key': process.env.GUM_INTEGRATION_SECRET }
  });
  const history = (await historyResponse.json()).events;
  assert.equal(history.find((event) => event.eventId === 'concurrent-1')?.status, 'sent');
  assert.equal(history.find((event) => event.eventId === 'concurrent-2')?.status, 'sent');
  const lookup = await fetch(`${endpoint}/concurrent-1`, {
    headers: { 'x-gum-integration-key': process.env.GUM_INTEGRATION_SECRET }
  });
  assert.equal(lookup.status, 200);

  const sentBeforeHistoryRemoval = sentMessages.length;
  rmSync(join(dataDir, 'gum-integration-events.json'));
  const replayWithoutHistory = await send('event-7', 'Atrasado desde 17:30', 'task:2026-07-20:123');
  assert.equal((await replayWithoutHistory.json()).locked, true);
  assert.equal(sentMessages.length, sentBeforeHistoryRemoval, 'a trava persistente deve sobreviver mesmo sem o historico principal');

  const sentBeforeCorruption = sentMessages.length;
  writeFileSync(join(dataDir, 'gum-integration-events.json'), '{invalido', 'utf8');
  assert.equal((await send('blocked-without-history', 'Nao pode ser enviada')).status, 503);
  assert.equal(sentMessages.length, sentBeforeCorruption, 'o envio deve falhar fechado sem historico confiavel');

  await new Promise((resolve) => server.close(resolve));
  rmSync(dataDir, { recursive: true, force: true });
  console.log('Receptor gUM validado: assinatura opcional e janela antirrepeticao ativas.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
