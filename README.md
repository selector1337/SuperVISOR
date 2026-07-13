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

Versão atual: `1.1.0`.
