// Gera um QR em sessão temporária, sem usar a autenticação ou o banco da produção.
const fs = require('fs');
const os = require('os');
const path = require('path');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'supervisor-wa-check-'));
process.chdir(tempRoot);
delete process.env.MONGODB_URI;
delete process.env.MONGODB_DB;
const whatsapp = require('../src/whatsapp');
let finished = false;
async function finish(error) {
  if (finished) return;
  finished = true;
  clearTimeout(timeout);
  console.log(error ? `Falha: ${error}` : 'QR Code gerado com sucesso. Nenhuma conta foi conectada.');
  await whatsapp.shutdownWhatsApp();
  process.chdir(os.tmpdir());
  // Remove exclusivamente a pasta criada por mkdtemp nesta execução.
  try { fs.rmSync(tempRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 }); }
  catch (cleanupError) { console.error('Não foi possível remover o diretório temporário:', cleanupError.message); }
  process.exit(error ? 1 : 0);
}
const timeout = setTimeout(() => finish('Tempo esgotado (150 segundos) ao gerar QR Code.'), 150000);
console.log(`Node ${process.version}; whatsapp-web.js ${require('whatsapp-web.js/package.json').version}; Puppeteer ${require('puppeteer/package.json').version}`);
whatsapp.initWhatsApp({ emit(event, state) {
  if (event !== 'whatsapp:state' || finished) return;
  console.log(`Estado: ${state.status}`);
  if (state.qrCodeDataUrl) finish();
  else if (state.status === 'error') finish(state.error);
} });
process.once('SIGINT', () => finish('Diagnóstico interrompido.'));
process.once('SIGTERM', () => finish('Diagnóstico interrompido.'));
