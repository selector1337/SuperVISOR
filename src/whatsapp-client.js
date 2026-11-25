// A tela /login/ usa o QR nativo e não possui WAWebSocketModel.
// Após autenticar, a implementação oficial assume novamente a conexão.
function readLoginScreen() {
  if (!/^\/login\/?$/.test(location.pathname)) return { login: false };
  const candidates = document.querySelectorAll('[data-ref] canvas, canvas[aria-label*="QR" i], canvas');
  for (const canvas of candidates) {
    if (canvas.width < 128 || canvas.width !== canvas.height) continue;
    try {
      const image = canvas.toDataURL('image/png');
      if (image.length > 1000) return { login: true, image };
    } catch { /* O canvas pode estar sendo recriado durante atualização do QR. */ }
  }
  return { login: true };
}

function createLoginAwareClient(BaseClient) {
  return class LoginAwareClient extends BaseClient {
    stopLoginMonitor() {
      clearInterval(this.loginMonitorTimer);
      this.loginMonitorTimer = null;
      this.loginMonitorGeneration = (this.loginMonitorGeneration || 0) + 1;
    }

    async inject() {
      this.stopLoginMonitor();
      const generation = this.loginMonitorGeneration;
      const page = this.pupPage;
      const state = await page.evaluate(readLoginScreen);
      if (generation !== this.loginMonitorGeneration) return;
      if (!state.login) return super.inject();
      this._injectAbort?.abort();
      let lastImage;
      let polling = false;
      const update = async (snapshot) => {
        if (generation !== this.loginMonitorGeneration) return;
        if (!snapshot.login) {
          this.stopLoginMonitor();
          return super.inject();
        }
        if (snapshot.image && snapshot.image !== lastImage) {
          lastImage = snapshot.image;
          this.emit('qr:image', snapshot.image);
        }
      };
      this.loginMonitorTimer = setInterval(async () => {
        if (polling || generation !== this.loginMonitorGeneration) return;
        polling = true;
        try { await update(await page.evaluate(readLoginScreen)); }
        catch (error) {
          if (page.isClosed()) this.stopLoginMonitor();
          // A navegação destrói o contexto; o próximo inject/tick assume a página.
          else if (!/context.*destroyed|navigation|detached/i.test(error.message)) {
            this.stopLoginMonitor();
            this.emit('auth_failure', error.message);
          }
        } finally { polling = false; }
      }, 1000);
      this.loginMonitorTimer.unref?.();
      await update(state);
    }

    async destroy() {
      this.stopLoginMonitor();
      return super.destroy();
    }
  };
}

module.exports = { createLoginAwareClient, readLoginScreen };

