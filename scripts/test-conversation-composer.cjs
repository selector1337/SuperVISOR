const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const puppeteer = require('puppeteer');

(async () => {
  const appSource = readFileSync(path.join(__dirname, '..', 'public', 'app.js'));
  const html = `<!doctype html><html><body><main id="app"></main><script>
    window.__socketHandlers = {};
    window.io = () => ({ on: (name, callback) => { window.__socketHandlers[name] = callback; } });
    const jsonResponse = (data) => ({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(data) });
    window.fetch = async (url) => {
      const pathname = String(url);
      if (pathname === '/api/bootstrap') return jsonResponse({ hasUsers: true, user: { id: 'u1', name: 'Teste', email: 'teste@local', isOwner: true } });
      if (pathname === '/api/whatsapp') return jsonResponse({ status: 'ready', groups: [], qrCodeDataUrl: null, error: null });
      if (pathname === '/api/schedules') return jsonResponse({ schedules: [] });
      if (pathname === '/api/contacts') return jsonResponse({ contacts: [] });
      if (pathname === '/api/watchers') return jsonResponse({ watchers: [] });
      if (pathname === '/api/users') return jsonResponse({ users: [] });
      if (pathname === '/api/logs') return jsonResponse({ logs: [] });
      if (pathname === '/api/conversations') return jsonResponse({ conversations: [{ id: 'chat@c.us', name: 'Contato', isGroup: false, unreadCount: 0, timestamp: Date.now(), lastMessage: 'Oi' }] });
      if (pathname.includes('/api/conversations/chat%40c.us/messages')) {
        await new Promise((resolve) => setTimeout(resolve, 180));
        return jsonResponse({ messages: [{ id: 'm1', from: 'chat@c.us', to: 'me@c.us', body: 'Oi', fromMe: false, timestamp: Date.now(), ack: null }] });
      }
      return jsonResponse({});
    };
  </script><script src="/app.js"></script></body></html>`;
  const server = http.createServer((req, res) => {
    if (req.url === '/app.js') {
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
      res.end(appSource);
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(6000);
    page.on('pageerror', (error) => console.error('Erro na pagina de teste:', error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-tab="conversations"]');
    await page.evaluate(() => document.querySelector('[data-tab="conversations"]')?.click());
    await page.waitForSelector('[data-open-conversation="chat@c.us"]');
    await page.evaluate(() => document.querySelector('[data-open-conversation="chat@c.us"]')?.click());
    await page.waitForSelector('#replyForm textarea[name="message"]');

    const firstText = 'A digitação precisa permanecer completa durante a atualização.';
    await page.type('#replyForm textarea[name="message"]', firstText, { delay: 4 });
    await new Promise((resolve) => setTimeout(resolve, 250));
    assert.equal(await page.$eval('#replyForm textarea[name="message"]', (input) => input.value), firstText);

    const secondText = ' Nenhuma letra pode desaparecer com mensagem em tempo real.';
    await Promise.all([
      page.type('#replyForm textarea[name="message"]', secondText, { delay: 3 }),
      page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        await window.__socketHandlers['whatsapp:message']({ from: 'chat@c.us', to: 'me@c.us', body: 'Nova mensagem', fromMe: false, timestamp: Date.now() });
      })
    ]);
    assert.equal(await page.$eval('#replyForm textarea[name="message"]', (input) => input.value), firstText + secondText);

    console.log('Compositor validado: respostas atrasadas e mensagens em tempo real nao removem caracteres.');
  } finally {
    await browser.close().catch(() => {});
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
