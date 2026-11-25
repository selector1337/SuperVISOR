#!/usr/bin/env node
// Gera o front-end da demo (demo/public/app.js e ui.css) a partir do app tradicional (public/).
// A demo é o mesmo painel sem Integrações, com armazenamento por cliente, prazo de teste e socket sob demanda.
// Uso: node scripts/build-demo-frontend.cjs
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceJs = path.join(root, 'public', 'app.js');
const targetJs = path.join(root, 'demo', 'public', 'app.js');
const sourceCss = path.join(root, 'public', 'ui.css');
const targetCss = path.join(root, 'demo', 'public', 'ui.css');

const read = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
let js = read(sourceJs);
const previousDemo = fs.existsSync(targetJs) ? read(targetJs) : '';

function replaceOnce(from, to, label) {
  const index = js.indexOf(from);
  if (index === -1) throw new Error(`Trecho não encontrado: ${label}`);
  if (js.indexOf(from, index + from.length) !== -1) throw new Error(`Trecho repetido: ${label}`);
  js = js.slice(0, index) + to + js.slice(index + from.length);
}

function removeBetween(startMarker, endMarker, label) {
  const start = js.indexOf(startMarker);
  const end = js.indexOf(endMarker, start);
  if (start === -1 || end === -1) throw new Error(`Bloco não encontrado: ${label}`);
  js = js.slice(0, start) + js.slice(end);
}

// 1. Changelog: mantém o histórico próprio da demo e acrescenta a entrada da nova interface.
const changelogStart = js.indexOf('const changelog = [');
const changelogEnd = js.indexOf('\n];\n', changelogStart) + 4;
const demoStart = previousDemo.indexOf('const changelog = [');
const demoEnd = previousDemo.indexOf('\n];\n', demoStart) + 4;
if (changelogStart === -1 || demoStart === -1) throw new Error('Changelog não encontrado.');
let demoChangelog = previousDemo.slice(demoStart, demoEnd);
if (!demoChangelog.includes("version: '1.3-demo'")) {
  const uiEntryStart = js.indexOf("  {\n    version: '1.3',", changelogStart);
  const uiEntryEnd = js.indexOf("\n  },\n", uiEntryStart) + 5;
  const uiEntry = js.slice(uiEntryStart, uiEntryEnd).replace("version: '1.3'", "version: '1.3-demo'");
  demoChangelog = demoChangelog.replace('const changelog = [\n', `const changelog = [\n${uiEntry}\n`);
}
js = js.slice(0, changelogStart) + demoChangelog + js.slice(changelogEnd);

// 2. Remove a central de Integrações.
replaceOnce("  integrations: null,\n  integrationEnvironment: 'production',\n", '  trial: null,\n', 'estado de integrações');
replaceOnce("        ...(state.user?.isOwner ? [{ tab: 'integrations', label: 'Integrações', icon: 'plug' }] : []),\n", '', 'item de menu');
replaceOnce("      if (state.tab === 'integrations') {\n        renderContentQueued();\n        setTimeout(loadIntegrations, 0);\n        return;\n      }\n", '', 'troca de aba');
removeBetween('async function loadIntegrations(', 'function currentTab()', 'funções de integração (1)');
replaceOnce("  if (state.tab === 'integrations') return integrationsTab();\n", '', 'rota da aba');
removeBetween('function captureIntegrationConfig()', 'function bindContent()', 'funções de integração (2)');
replaceOnce('  bindIntegrationsContent();\n', '', 'bind de integrações');

// 3. Armazenamento isolado por cliente.
js = js.replace(/\blocalStorage\./g, 'demoLocal.').replace(/\bsessionStorage\./g, 'demoSession.');

// 4. Socket sob demanda e expiração do teste.
replaceOnce('const socket = io();\n', "const socket = io({ autoConnect: false });\nsocket.on('demo:expired', () => location.reload());\n", 'socket');
replaceOnce("  if (!response.ok) throw new Error(", "  if (data.code === 'DEMO_EXPIRED') { socket.disconnect(); location.reload(); }\n  if (!response.ok) throw new Error(", 'api expirada');
replaceOnce("  const data = await api('/api/bootstrap');\n  state.hasUsers = data.hasUsers;\n  state.user = data.user;\n  if (state.user) await loadDashboardData();",
  "  const data = await api('/api/bootstrap');\n  state.trial = data.trial;\n  state.hasUsers = data.hasUsers;\n  state.user = data.user;\n  if (state.user) { socket.connect(); await loadDashboardData(); }", 'bootstrap');
replaceOnce("      state.user = data.user;\n      await loadDashboardData();\n      render();",
  "      state.user = data.user;\n      state.trial = data.trial;\n      socket.connect();\n      await loadDashboardData();\n      render();", 'login');
replaceOnce("    await api('/api/logout', { method: 'POST' });\n    state.user = null;",
  "    await api('/api/logout', { method: 'POST' });\n    socket.disconnect();\n    state.user = null;", 'logout');

// 5. Tela de login da demo.
replaceOnce("        <div class=\"auth-brand\">\n          ${brandMarkup()}\n        </div>",
  "        <div class=\"auth-brand\">\n          ${brandMarkup()}\n          <span class=\"auth-trial-badge\">${icon('clock', 14)} Demo • ${trialDaysLabel()}</span>\n        </div>", 'marca do login');
replaceOnce("<span class=\"auth-badge\">${icon('shield', 14)} Acesso administrativo</span>",
  "<span class=\"auth-badge\">${icon('clock', 14)} Demonstração${state.trial?.days === null ? ' sem prazo' : ` · ${state.trial?.days ?? 7} dias de teste`}</span>", 'selo do login');
replaceOnce("${isSetup ? 'Configure o primeiro acesso do painel.' : 'Acesse o dashboard do SuperVISOR.'}",
  "${isSetup ? 'Configure o primeiro acesso do painel.' : state.trial?.days === null ? 'Entre com as credenciais do convite. Este ambiente não possui data de expiração.' : 'Entre com as credenciais do convite. Seu teste de ' + (state.trial?.days ?? 7) + ' dias começa no primeiro login.'}", 'texto do login');
replaceOnce("          <button class=\"primary auth-submit\" type=\"submit\">${isSetup ? 'Criar e entrar' : 'Entrar'}</button>",
  "          <button class=\"primary auth-submit\" type=\"submit\">${isSetup ? 'Criar e entrar' : 'Entrar e começar o teste'}</button>\n          <div class=\"auth-perks\">\n            <strong>No teste você pode</strong>\n            <span>${icon('check', 16)} Conectar um número de WhatsApp</span>\n            <span>${icon('check', 16)} Criar agendamentos para grupos e contatos</span>\n            <span>${icon('check', 16)} Acompanhar conversas e estatísticas da equipe</span>\n          </div>", 'botão do login');

// 6. Prazo do teste no menu lateral e faixa no topo.
replaceOnce("        <nav class=\"nav\" aria-label=\"Principal\">",
  "        <div class=\"trial-card\" id=\"trialCard\">\n          <div class=\"trial-card-head\"><span>Teste gratuito</span><strong id=\"trialDays\"></strong></div>\n          <span class=\"meter\" aria-hidden=\"true\"><span id=\"trialMeter\"></span></span>\n          <span class=\"trial-until\" id=\"trialUntil\"></span>\n        </div>\n        <nav class=\"nav\" aria-label=\"Principal\">", 'cartão do teste');
replaceOnce("        <div id=\"mainContent\"></div>", "        <div class=\"demo-banner\" role=\"status\" id=\"demoBanner\"></div>\n        <div id=\"mainContent\"></div>", 'faixa da demo');
replaceOnce("function updateLiveClock() {\n", `function trialDaysLabel() {
  if (state.trial?.days === null) return 'sem expiração';
  return (state.trial?.days ?? 7) + ' dias para testar';
}

function updateTrialUi() {
  const banner = document.querySelector('#demoBanner');
  const card = document.querySelector('#trialCard');
  if (state.trial?.days === null) {
    if (banner) banner.textContent = 'Demo • sem prazo de expiração';
    if (card) {
      card.dataset.state = 'unlimited';
      card.querySelector('#trialDays').textContent = 'Sem prazo';
      card.querySelector('#trialMeter').style.width = '100%';
      card.querySelector('#trialUntil').textContent = 'Este ambiente não expira';
    }
    return true;
  }
  if (!state.trial?.expiresAt) return true;
  const remaining = Date.parse(state.trial.expiresAt) - Date.now();
  if (remaining <= 0) { socket.disconnect(); location.reload(); return false; }
  const hours = Math.ceil(remaining / 3600000);
  const until = new Date(state.trial.expiresAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const left = hours >= 24 ? Math.ceil(hours / 24) + ' dia(s)' : hours + ' hora(s)';
  if (banner) banner.textContent = 'Demo • ' + left + ' restantes • termina em ' + until + ' (Brasília)';
  if (card) {
    const total = (Date.parse(state.trial.expiresAt) - Date.parse(state.trial.startedAt || state.trial.expiresAt)) || 1;
    const used = Math.min(100, Math.max(0, ((total - remaining) / total) * 100));
    card.dataset.state = hours <= 48 ? 'ending' : 'active';
    card.querySelector('#trialDays').textContent = left;
    card.querySelector('#trialMeter').style.width = Math.max(4, 100 - used) + '%';
    card.querySelector('#trialUntil').textContent = 'Termina em ' + new Date(state.trial.expiresAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  }
  return true;
}

function updateLiveClock() {
  if (!updateTrialUi()) return;
`, 'relógio e prazo');

// 7. Conferências finais.
for (const forbidden of [/gUMperformance/, /integrationsTab/, /Integrações/, /\blocalStorage\./, /\bsessionStorage\./]) {
  if (forbidden.test(js)) throw new Error(`A demo ainda contém ${forbidden}.`);
}

const header = [
  "const clientKey = 'demo:' + window.DEMO_CLIENT_ID + ':';",
  'const demoLocal = { getItem: key => localStorage.getItem(clientKey + key), setItem: (key, value) => localStorage.setItem(clientKey + key, value), removeItem: key => localStorage.removeItem(clientKey + key) };',
  'const demoSession = { getItem: key => sessionStorage.getItem(clientKey + key), setItem: (key, value) => sessionStorage.setItem(clientKey + key, value), removeItem: key => sessionStorage.removeItem(clientKey + key) };',
  '// Arquivo gerado por scripts/build-demo-frontend.cjs a partir de public/app.js. Edite o original e gere novamente.'
].join('\n');

fs.writeFileSync(targetJs, `${header}\n${js}`, 'utf8');
fs.copyFileSync(sourceCss, targetCss);
console.log('Demo atualizada: demo/public/app.js e demo/public/ui.css');
