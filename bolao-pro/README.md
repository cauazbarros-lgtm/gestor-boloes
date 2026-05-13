# 🏆 BolãoPro

Sistema web completo para gestão de bolões do Campeonato Brasileiro.

- **Área pública** — apostadores acessam o link, escolhem palpites e recebem a cota com instruções de pagamento.
- **Dashboard administrativo** — você cria bolões, acompanha apostas, confirma pagamentos e apura o ganhador.

Stack: **Next.js 14** (App Router) + TypeScript + Tailwind + Supabase (PostgreSQL + Auth).

---

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta gratuita no [Supabase](https://supabase.com)
- Conta gratuita na [Vercel](https://vercel.com) para deploy (opcional)

---

## 🚀 Setup passo a passo

### 1) Criar projeto no Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard) e clique em **New project**.
2. Escolha um nome (ex: `bolao-pro`), uma senha forte para o banco e a região mais próxima.
3. Aguarde alguns minutos enquanto o projeto é provisionado.

### 2) Rodar o schema SQL

1. No painel do Supabase, abra **SQL Editor** (ícone de banco no menu lateral).
2. Clique em **+ New query**.
3. Copie todo o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e cole no editor.
4. Clique em **Run**. Você deve ver `Success. No rows returned`.

Pronto — todas as tabelas, índices, RLS e a função `gerar_proximo_numero_cota` foram criadas.

### 3) Criar o usuário admin

1. No menu lateral do Supabase: **Authentication → Users**.
2. Clique em **Add user → Create new user**.
3. Informe o seu **e-mail** e uma **senha** que você usará para entrar no painel administrativo.
4. Marque **Auto Confirm User** para pular a confirmação de e-mail.
5. Clique em **Create user**.

### 4) Pegar as chaves da API

1. No menu lateral: **Settings (⚙) → API**.
2. Copie:
   - **Project URL** → vai virar `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → vai virar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** (clique em "Reveal") → vai virar `SUPABASE_SERVICE_ROLE_KEY` ⚠️ NUNCA exponha esta chave no frontend.

### 5) Instalar e configurar o projeto

```bash
# Na pasta do projeto:
npm install

# Copie o exemplo de variáveis e edite:
cp .env.local.example .env.local
```

Abra `.env.local` no seu editor e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Pix do organizador (aparece nas instruções de pagamento para o apostador)
NEXT_PUBLIC_PIX_CHAVE=seu-pix@email.com
NEXT_PUBLIC_PIX_NOME=Seu Nome Completo
NEXT_PUBLIC_PIX_BANCO=Nome do Banco

# WhatsApp para contato (só números, com DDI)
NEXT_PUBLIC_WHATSAPP=5511999999999
```

### 6) Rodar localmente

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

- Página pública: [http://localhost:3000](http://localhost:3000)
- Painel admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

Faça login com o e-mail/senha que você criou no passo 3.

---

## 🌐 Deploy na Vercel

1. Suba o código para um repositório no GitHub (ou GitLab/Bitbucket).
2. Acesse [https://vercel.com/new](https://vercel.com/new) e importe o repositório.
3. Em **Environment Variables**, adicione TODAS as variáveis do seu `.env.local`.
4. Lembre de atualizar `NEXT_PUBLIC_BASE_URL` para o domínio final da Vercel (ex: `https://seu-bolao.vercel.app`).
5. Clique em **Deploy**.

Depois do deploy, em qualquer bolão criado, o link público será `https://seu-dominio/bolao/{slug}`.

---

## 📁 Estrutura do projeto

```
bolao-pro/
├── app/
│   ├── (public)/
│   │   ├── bolao/[slug]/   → Página pública do bolão
│   │   └── cota/[id]/      → Comprovante da cota
│   ├── admin/
│   │   ├── login/          → Login Supabase Auth
│   │   ├── dashboard/      → Visão geral com stats
│   │   ├── boloes/         → CRUD de bolões
│   │   └── apostadores/    → Lista de apostadores
│   ├── api/
│   │   ├── boloes/         → CRUD via API
│   │   ├── apostas/        → Registro/edição de apostas
│   │   ├── cotas/[id]/     → Geração de PDF
│   │   ├── jogos/resultados/ → Salvar resultados + recalcular acertos
│   │   └── webhooks/pagamento/ → Hook pronto para gateway externo
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── public/    → BolaoHero, JogoCard, FormularioPalpite, CotaComprovante
│   ├── admin/     → Sidebar, BolaoForm, JogosBuilder, ApostasTable, etc
│   └── ui/        → Button, Input, Modal, Toast, etc
├── lib/
│   ├── supabase/  → Clients (browser + server + service role)
│   ├── gerarCota.ts
│   ├── gerarSlug.ts
│   ├── gerarPDF.ts
│   └── utils.ts
├── types/index.ts → Interfaces TypeScript
├── supabase/schema.sql → Schema do banco
├── middleware.ts  → Protege rotas /admin
└── package.json
```

---

## 🎯 Fluxo de uso

### Para o admin:

1. **Criar bolão** em **Bolões → Novo bolão**. Informe título, rodada, prêmio, valor da cota, prazo e adicione os jogos da rodada.
2. **Compartilhar o link público** (botão "Copiar link" ou "WhatsApp").
3. À medida que apostadores fazem palpites, eles aparecem em **Bolões → [seu bolão] → Ver apostas**.
4. Apostador faz Pix usando as instruções do comprovante → você confirma o pagamento manualmente clicando no ✓ verde na tabela.
5. Após os jogos: clique em **Inserir resultados** e marque o resultado de cada partida. Os acertos são calculados automaticamente.
6. Mude o status do bolão para **Finalizado** (editar bolão) e use **Apurar ganhador** — o sistema mostra o ranking e permite sortear entre empatados.

### Para o apostador:

1. Acessa o link público do bolão.
2. Marca um palpite por jogo (Casa / Empate / Fora).
3. Preenche nome, e-mail e telefone.
4. Clica em **Registrar meu palpite** → recebe a cota com número único + instruções de pagamento.
5. Faz Pix e envia comprovante.
6. Pode consultar a cota a qualquer momento pelo link único `/cota/{id}`.

---

## 🔐 Segurança

- O **service_role key** só é usado em rotas do servidor (API Routes / Server Components). Nunca é exposto ao browser.
- **Row Level Security** está habilitado em todas as tabelas. Leituras públicas são permitidas, mas alterações exigem o service role (via API com autenticação).
- O middleware bloqueia qualquer acesso a `/admin/**` sem sessão válida.
- O webhook de pagamento (`/api/webhooks/pagamento`) tem suporte a validação de secret — descomente a verificação quando configurar um gateway real.

---

## 💳 Integrando um gateway de pagamento (opcional)

O endpoint `/api/webhooks/pagamento` já está pronto. Configure seu gateway (Mercado Pago, Pagar.me, Asaas etc) para enviar um POST com:

```json
{
  "numero_cota": "B15-00042",
  "status": "confirmado"
}
```

Adicione no `.env.local`:
```env
WEBHOOK_SECRET=alguma-string-aleatoria-forte
```

E descomente o bloco de validação em `app/api/webhooks/pagamento/route.ts`.

---

## 🛠 Comandos úteis

```bash
npm run dev    # Servidor de desenvolvimento
npm run build  # Build de produção
npm run start  # Servir o build de produção
npm run lint   # Linter
```

---

## ❓ Problemas comuns

**Erro de RLS ao inserir aposta:**
Confirme que rodou todo o `schema.sql` (incluindo as `CREATE POLICY`).

**Login não funciona:**
Confirme em **Authentication → Users** que o usuário existe e que **Auto Confirm User** estava marcado (ou clique em "Confirm email" no usuário).

**O número da cota não está sendo gerado:**
Confirme que a função `gerar_proximo_numero_cota` foi criada (rode novamente o `schema.sql`).

**Erro 401 em `/admin/...`:**
Verifique que `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão corretos no `.env.local`.

---

Feito com ❤️ para os bolões do Brasileirão.
