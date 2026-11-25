const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const flush = () => new Promise(resolve => setImmediate(resolve));

test('reconexão ignora falha e eventos do cliente anterior; ações simultâneas são serializadas', async () => {
  const instances = [];
  class FakeClient extends EventEmitter {
    constructor(options) { super(); this.options = options; instances.push(this); }
    initialize() { return new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject; }); }
    async destroy() {}
    async logout() {}
  }
  const mockFs = {
    existsSync: file => String(file) === '/chrome',
    readFileSync() { throw new Error('Não existe'); },
    appendFileSync() {}, mkdirSync() {}, writeFileSync() {}, rmSync() {}
  };
  const mockRequire = name => {
    if (name === './store') return {};
    if (name === './whatsapp-client') return require('../src/whatsapp-client');
    if (name === 'qrcode') return { toDataURL: async value => `data:${value}` };
    if (name === 'whatsapp-web.js') return { Client: FakeClient, LocalAuth: class {} };
    if (name === 'whatsapp-web.js/package.json') return { version: '1.34.8' };
    if (name === 'puppeteer/package.json') return { version: '24.38.0' };
    if (name === 'puppeteer') return { executablePath: () => '/chrome' };
    if (name === 'fs') return mockFs;
    return require(name);
  };
  const context = {
    require: mockRequire, module: { exports: {} },
    process: { env: {}, platform: 'linux', cwd: () => '/demo/instances/test', pid: 123 },
    console: { log() {}, warn() {}, error() {} }, Buffer,
    setTimeout: (callback, ms) => { if (ms === 700) queueMicrotask(callback); return { unref() {} }; },
    clearTimeout() {}, setInterval: () => ({}), clearInterval() {}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/whatsapp.js'), 'utf8'), context);
  const whatsapp = context.module.exports;
  whatsapp.initWhatsApp({ emit() {} });
  await flush();
  assert.equal(instances[0].options.webVersionCache.type, 'none');
  await whatsapp.disconnectWhatsApp();
  await flush();
  assert.equal(instances.length, 2);
  instances[1].emit('qr', 'atual');
  await flush();
  assert.equal(whatsapp.getState().qrCodeDataUrl, 'data:atual');
  instances[0].reject(new Error("Cannot read properties of null (reading 'Socket')"));
  instances[0].emit('loading_screen', 10, 'antigo');
  instances[0].emit('disconnected');
  instances[0].emit('qr', 'antigo');
  await flush();
  assert.equal(whatsapp.getState().status, 'qr');
  assert.equal(whatsapp.getState().error, null);
  assert.equal(whatsapp.getState().qrCodeDataUrl, 'data:atual');
  await Promise.all([
    whatsapp.disconnectWhatsApp({ clearSession: false }),
    whatsapp.disconnectWhatsApp({ clearSession: true })
  ]);
  await flush();
  assert.equal(instances.length, 4);
  instances[3].emit('qr', 'final');
  await flush();
  assert.equal(whatsapp.getState().qrCodeDataUrl, 'data:final');
  await whatsapp.shutdownWhatsApp();
});
