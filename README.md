# WhatsApp Manager Bot

Aplicacao local para administradores conectarem um numero de WhatsApp por QR Code, escolherem grupos e agendarem mensagens recorrentes.

## Aviso importante

Esta versao usa `whatsapp-web.js`, que automatiza o WhatsApp Web. Use apenas em grupos internos, com autorizacao da empresa e respeitando as regras do WhatsApp. Para campanhas oficiais com clientes, avalie a WhatsApp Business Platform.

## Requisitos

- Node.js 18 ou superior
- npm disponivel no terminal
- Google Chrome ou Chromium instalado

## Instalar

```bash
npm install
```

## Rodar

```bash
npm start
```

Depois acesse:

```text
http://localhost:3000
```

No primeiro acesso, crie o usuario administrador inicial. Em seguida, conecte o WhatsApp pelo QR Code e carregue os grupos.

## Usar online no Render

O Render gratuito nao preserva arquivos locais depois de reinicios ou redeploys. Para nao perder usuarios, agendamentos e historico, configure um banco MongoDB Atlas gratuito e adicione a variavel `MONGODB_URI` no Render.

Variaveis recomendadas no Render:

```text
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=whatsapp_manager_bot
SESSION_SECRET=crie-uma-frase-secreta-grande
```

Sem `MONGODB_URI`, o app salva em `data/store.json`, o que e adequado apenas para rodar localmente.

## Recursos

- Login e sessao de administradores.
- Criacao de novos usuarios administradores.
- QR Code para conectar um numero de WhatsApp.
- Listagem de grupos disponiveis no WhatsApp conectado.
- Cadastro de mensagens com grupos, horario e dias da semana.
- Ativar, pausar, editar e remover agendamentos.
- Envio manual de teste para os grupos escolhidos.

## Dados locais

Os dados ficam na pasta `data/`:

- `data/store.json`: usuarios, agendamentos e registros de envio.
- `.wwebjs_auth/`: sessao local do WhatsApp Web.

Para trocar o numero conectado, pare o servidor e apague a pasta `.wwebjs_auth/`.
