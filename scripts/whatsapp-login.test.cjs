const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

test('login: publica QR, acompanha rotação e retoma biblioteca oficial após autenticar', async () => {
  let tick;
  let snapshot = { login: true, image: 'data:image/png;base64,qr1' };
  let evaluationError;
  class Base extends EventEmitter {
    constructor() { super(); this.injections = 0; this.pupPage = { evaluate: async () => {
      if (evaluationError) { const error = evaluationError; evaluationError = null; throw error; }
      return snapshot;
    }, isClosed: () => false }; }
    async inject() { this.injections++; }
    async destroy() { this.destroyed = true; }
  }
  const context = {
    module: { exports: {} },
    setInterval: callback => { tick = callback; return { unref() {} }; },
    clearInterval: () => { tick = null; }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/whatsapp-client.js'), 'utf8'), context);
  const Client = context.module.exports.createLoginAwareClient(Base);
  const client = new Client();
  const images = [];
  client.on('qr:image', image => images.push(image));
  await client.inject();
  assert.equal(client.injections, 0);
  assert.deepEqual(images, ['data:image/png;base64,qr1']);
  await tick();
  assert.equal(images.length, 1);
  snapshot = { login: true, image: 'data:image/png;base64,qr2' };
  await tick();
  assert.equal(images[1], snapshot.image);
  evaluationError = new Error('Execution context was destroyed, most likely because of a navigation.');
  await tick();
  assert.equal(client.injections, 0);
  const oldTick = tick;
  snapshot = { login: false };
  await tick();
  assert.equal(client.injections, 1);
  assert.equal(tick, null);
  await oldTick();
  assert.equal(client.injections, 1);
  await client.inject();
  assert.equal(client.injections, 2);
  snapshot = { login: true, image: 'data:image/png;base64,qr3' };
  await client.inject();
  assert.notEqual(tick, null);
  await client.destroy();
  assert.equal(tick, null);
  assert.equal(client.destroyed, true);
});
