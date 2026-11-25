# SuperVISOR

SuperVISOR é um gestor de equipes com integração ao WhatsApp Web. A aplicação permite conectar um número por QR Code, gerenciar contatos, visualizar conversas, responder mensagens, agendar comunicados para grupos ou contatos individuais e acompanhar estatísticas de primeira e última mensagem de participantes observados.

## Aviso Importante

Esta aplicação usa `whatsapp-web.js`, que automatiza o WhatsApp Web. Use apenas em rotinas internas, com autorização da empresa e respeitando as regras do WhatsApp. Para campanhas comerciais oficiais com clientes, avalie a WhatsApp Business Platform.

## Funcionalidades

- Login administrativo, criação de usuários e gerenciamento de administradores.
- Usuário principal pode alterar senha de administradores e apagar usuários criados.
- Conexão com WhatsApp por QR Code, com opções de desconectar, reiniciar conexão e gerar novo QR Code.
- Exibição do número conectado na aba WhatsApp.
- Recuperação de sessão e tentativas de reconexão para reduzir falhas com Chromium/WhatsApp Web.
- Listagem e atualização de grupos do WhatsApp.
- Cadastro de contatos individuais com nome, telefone, observações e múltiplas tags separadas por vírgula.
- Agendamento de mensagens para grupos, contatos individuais ou ambos.
- Agendamentos por dias da semana ou datas específicas.
- Filtros para localizar agendamentos por grupo ou contato.
- Busca de grupos e contatos durante a criação/edição de agendamentos.
- Campo opcional para nome do bot/supervisor na mensagem.
- Histórico de envios com status traduzido e destaque para falhas.
- Aba Conversas para visualizar, iniciar e responder conversas.
- Filtros de conversas por todos, grupos, contatos e não lidas.
- Fixar conversas para aparecerem primeiro.
- Indicadores de mensagens não lidas.
- Envio de texto, anexos, emojis e áudios gravados pelo painel.
- Reprodução de áudios, visualização ampliada de imagens e suporte a vídeos recebidos.
- Tiques de status em mensagens enviadas, quando o WhatsApp Web disponibiliza essa informação.
- Apagar mensagens para si ou para todos, quando permitido pelo WhatsApp Web.
- Estatísticas por grupo e participante observado, registrando primeira e última mensagem do dia.
- Consulta de estatísticas por data, com persistência para consulta posterior.
- Exportação de relatórios de estatísticas em Excel e PDF.
- Changelog no painel para acompanhar mudanças entre versões.
- Tema dark/light com identidade visual SuperVISOR.
- Central de integrações para configurar separadamente gUMperformance e gUMperformance beta.
- Roteamento das automações por pessoa, tipo de evento, departamento ou grupos padrão.
- Modelos editáveis de mensagens com variáveis dinâmicas para tarefas, cards, acessos, metas, respostas e advertências.
- Status, teste controlado, verificação manual e histórico recente das integrações no painel.

## Integração com gUMperformance

O menu `Integrações` fica disponível para o usuário principal. Ele consulta os dois ambientes por rede interna e nunca envia o segredo compartilhado ao navegador.

No `.env` do SuperVISOR:

```text
GUM_INTEGRATION_SECRET=SEGREDO_COMPARTILHADO
GUM_PERFORMANCE_API_URL=http://127.0.0.1:4174
GUM_PERFORMANCE_BETA_API_URL=http://127.0.0.1:4175
```

Nos arquivos `.env` do gUMperformance e do beta, use o mesmo `GUM_INTEGRATION_SECRET` e configure `GUM_SUPERVISOR_URL=http://127.0.0.1:3000` quando os aplicativos estiverem no mesmo servidor.

A prioridade dos destinos é: pessoa, tipo de evento, departamento e grupos padrão. O botão de teste envia uma mensagem real e sempre pede confirmação antes do envio.

O nome do bot é opcional e, quando preenchido, é incluído automaticamente no início de cada alerta. A janela antirrepetição impede que a mesma cobrança seja reenviada em sequência; o padrão é de 360 minutos e pode ser ajustado entre 1 e 1440 minutos no painel.

## Requisitos

### Windows

- Windows 10 ou superior.
- Node.js LTS instalado pelo site oficial.
- Google Chrome instalado.
- Terminal PowerShell ou Prompt de Comando.

### Linux Ubuntu/Debian

- Ubuntu 22.04/24.04 ou Debian equivalente.
- Node.js LTS.
- Nginx, se for publicar com domínio.
- Chrome baixado pelo Puppeteer ou Google Chrome instalado sem Snap. O Chromium Snap não é recomendado sob PM2/systemd.
- Dependências de sistema para o Puppeteer/Chromium.

## Instalação no Windows

1. Instale o Node.js LTS em:

```text
https://nodejs.org/
```

2. Reinicie o terminal depois da instalação.

3. Abra o PowerShell na pasta do projeto.

4. Instale as dependências:

```powershell
npm install
```

5. Inicie a aplicação:

```powershell
npm start
```

6. Acesse no navegador:

```text
http://localhost:3000
```

7. No primeiro acesso, crie o usuário administrador principal.

8. Entre na aba WhatsApp e leia o QR Code pelo celular.

9. Depois que o status mudar para `Conectado`, clique em `Atualizar` para carregar grupos.

## Instalação no Linux

1. Atualize o servidor:

```bash
sudo apt update
sudo apt upgrade -y
```

2. Instale Node.js LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

3. Instale dependências do Chromium/Puppeteer:

```bash
sudo apt install -y ca-certificates fonts-liberation libasound2t64 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 xdg-utils
```

4. Instale Nginx e ferramentas úteis:

```bash
sudo apt install -y nginx git
```

5. Clone o repositório:

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git supervisor
cd supervisor
```

6. Instale as dependências:

```bash
npm install
```

7. Crie o arquivo de ambiente:

```bash
nano .env
```

Exemplo:

```text
PORT=3000
SESSION_SECRET=troque-por-uma-frase-grande-e-secreta
```

Se usar MongoDB:

```text
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=supervisor
```

8. Teste a aplicação:

```bash
npm start
```

Em outro terminal:

```bash
curl http://127.0.0.1:3000/api/bootstrap
```

Se responder JSON, o app subiu corretamente.

## Rodar Em Segundo Plano Com PM2

1. Instale o PM2:

```bash
sudo npm install -g pm2
```

2. Instale o Chrome gerenciado pelo projeto:

```bash
cd /var/www/supervisor
npm run browser:install
```

3. Inicie o SuperVISOR com a configuração de instância única:

```bash
cd /var/www/supervisor
pm2 delete supervisor 2>/dev/null || true
pm2 start ecosystem.config.cjs --update-env
pm2 save
pm2 startup
```

O arquivo `ecosystem.config.cjs` força modo `fork` com uma única instância. Não use modo cluster ou mais de uma instância, pois dois Chromes não podem compartilhar a mesma sessão `.wwebjs_auth`.

4. Veja logs:

```bash
pm2 logs supervisor
```

5. Recarregue depois de atualizações:

```bash
cd /var/www/supervisor
git pull
npm ci
npm run browser:install
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
```

## Configurar Nginx Com Domínio

Crie o arquivo:

```bash
sudo nano /etc/nginx/sites-available/supervisor
```

Conteúdo:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name supervisor.seudominio.com.br;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative o site:

```bash
sudo ln -s /etc/nginx/sites-available/supervisor /etc/nginx/sites-enabled/supervisor
sudo nginx -t
sudo systemctl reload nginx
```

No DNS, crie um registro `A` apontando o subdomínio para o IP público do servidor.

## HTTPS Com Certbot

Depois que o domínio estiver apontando para o servidor:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d supervisor.seudominio.com.br
```

Renovação automática:

```bash
sudo certbot renew --dry-run
```

## Dados Salvos

Sem MongoDB, os dados ficam no próprio servidor:

- `data/store.json`: usuários, contatos, agendamentos, histórico e estatísticas.
- `.wwebjs_auth/`: sessão local do WhatsApp Web.
- `.wwebjs_cache/`: cache usado pelo WhatsApp Web.
- `whatsapp-debug.log`: logs de conexão e diagnóstico.

Em produção, é recomendado usar MongoDB para reduzir perda de dados em reinstalações ou troca de servidor. Também é importante proteger o servidor, pois a pasta `.wwebjs_auth/` contém a sessão autenticada do WhatsApp.

## Operação Do WhatsApp

- `Reiniciar conexão`: reinicia o navegador do WhatsApp Web tentando preservar a sessão salva. Em situação normal, não exige leitura de QR Code novamente.
- `Desconectar`: remove a sessão local e exige nova leitura do QR Code.
- `Gerar novo QR`: limpa a sessão salva e prepara uma nova autenticação.

A aplicação possui algumas proteções para manter a conexão mais estável:

- watchdog periódico para confirmar se o WhatsApp continua conectado;
- tentativa automática de reconexão quando o WhatsApp Web cai;
- limpeza de locks antigos do Chromium quando a sessão fica travada;
- registro do PID do navegador para encerrar instâncias antigas com mais segurança;
- uso preferencial do Chrome baixado pelo Puppeteer e rejeição explícita do Chromium Snap em servidores PM2/systemd;
- fallback para outro Chrome/Edge compatível instalado quando o navegador baixado pelo Puppeteer é bloqueado;
- encerramento gracioso do navegador antes de reinícios do PM2, reduzindo locks e processos órfãos;
- configuração PM2 em modo `fork` com uma única instância para impedir duas sessões concorrentes;
- reinício sem `logout()` quando a intenção é apenas recuperar a conexão;
- nova tentativa automática quando a inicialização do WhatsApp falha por erro temporário.

Mesmo com essas proteções, a conexão não é totalmente à prova de desconexões, porque depende do WhatsApp Web, do celular vinculado, da rede, do Chromium e das regras do próprio WhatsApp. A meta da aplicação é evitar ao máximo intervenção manual e reduzir a necessidade de acessar o servidor.

Se o status ficar em erro após reiniciar, consulte:

```bash
tail -n 100 whatsapp-debug.log
```

No Windows, antivírus ou permissões do sistema podem bloquear o Chromium baixado pelo Puppeteer. Nesse caso, a aplicação tenta usar outro Chrome/Edge instalado quando isso acontece.

## Atualizar Pelo GitHub

No computador:

```bash
git add .
git commit -m "Atualiza SuperVISOR"
git push
```

No servidor:

```bash
cd /var/www/supervisor
git pull
npm ci
npm run browser:install
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
```

## Versão

Versão atual: `1.3.1`.

## Correção do QR Code na aplicação principal

A versão `1.3.1` adapta a conexão à tela `/login/` do WhatsApp Web, que mostra o QR mas não oferece o módulo Socket usado pelo fluxo antigo. Esse comportamento foi [relatado no projeto oficial da biblioteca](https://github.com/wwebjs/whatsapp-web.js/issues/201988). Só clicar em reiniciar ou aumentar o timeout não resolve a incompatibilidade.

O adaptador `src/whatsapp-client.js` captura o QR nativo, acompanha sua atualização e retoma a biblioteca oficial quando a página autenticada é carregada. As dependências desta correção são fixadas em `whatsapp-web.js` `1.34.8` e Puppeteer `24.38.0`. As reinicializações são serializadas e os eventos de clientes encerrados são ignorados.

### Atualizar a produção pelo GitHub

Envie os arquivos atualizados da aplicação principal para seu repositório, incluindo `src/whatsapp.js`, o novo `src/whatsapp-client.js`, os scripts de diagnóstico/teste, `package.json`, `package-lock.json` e este README. Preserve seus arquivos de configuração e dados. A instalação e as integrações da aplicação principal continuam independentes da demo.

No servidor, entre como o usuário que já executa o processo `supervisor`. Os comandos consideram `/var/www/supervisor`; ajuste para sua pasta real. Execute cada etapa somente se a anterior terminar com sucesso:

```bash
cd /var/www/supervisor
pm2 stop supervisor
```

Faça backup dos arquivos locais existentes (Bash):

```bash
supervisor_backup_items=()
for item in .env data .wwebjs_auth; do
    if [ -e "$item" ]; then
        supervisor_backup_items+=("$item")
    fi
done
if [ "${#supervisor_backup_items[@]}" -gt 0 ]; then
    tar -czf "$HOME/supervisor-backup-$(date +%Y%m%d-%H%M%S).tar.gz" "${supervisor_backup_items[@]}"
fi
```

Se usar MongoDB, mantenha também o backup habitual do banco; o arquivo acima cobre somente os arquivos locais. Depois atualize:

```bash
git pull --ff-only
export PUPPETEER_CACHE_DIR="$PWD/.cache/puppeteer"
npm ci
npm run check:whatsapp
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
```

O diagnóstico deve informar `QR Code gerado com sucesso. Nenhuma conta foi conectada.` Ele usa uma sessão temporária, não imprime o QR, não lê a autenticação de produção, não abre o banco MongoDB e não envia mensagens. O `npm ci` instala também o Chrome compatível; verifique possíveis erros antes de prosseguir. A atualização exige uma breve parada do processo principal; não precisa parar `supervisor-demo` ou os processos do gUMperformance.

Abra a aplicação novamente e confira a aba WhatsApp. Se a sessão salva ainda for válida, ela poderá conectar sem QR; se precisar vincular, leia o QR no celular. Usar "Gerar novo QR" remove a autenticação local e exige nova vinculação. Não apague `data`, `.env` ou toda a pasta da aplicação para corrigir esse erro.

Se continuar falhando, colete:

```bash
pm2 logs supervisor --lines 100 --nostream
tail -n 100 whatsapp-debug.log
```

### Verificação da correção

```bash
npm run test:whatsapp
npm run test:integrations
npm run test:gum-receiver
```

Os testes cobrem atualização do QR, transição da tela de login, reconexão e as integrações com serviços fictícios. O teste real confirmou geração do QR em sessão temporária; leitura pelo celular e operações com a conta vinculada precisam ser conferidas no servidor após a atualização.

## Interface

O visual fica em `public/ui.css` (os estilos antigos continuam em `public/styles.css` como camada base). O front-end da demo é gerado a partir do app tradicional:

```powershell
npm run build:demo-ui
```

Edite sempre `public/app.js` e `public/ui.css` e rode o comando acima para atualizar `demo/public`.
