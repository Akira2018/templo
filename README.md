<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ca08508e-ebe9-43bf-b992-e4c35411e20e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy no GitHub Pages

Para o repositorio `templo`, publique sempre o build do Vite (`dist`) e nao os arquivos de desenvolvimento.

Importante: o GitHub Pages hospeda apenas frontend estatico. O banco SQLite (`church.db`) continua no backend (`server.ts`) e precisa estar rodando em um servidor separado.

1. Instale dependencias:
   `npm install`
2. Gere e publique:
   `npm run deploy`

Configuracao esperada no GitHub:

- Em `Settings > Pages`, use `Deploy from a branch`.
- Branch: `gh-pages`.
- Pasta: `/ (root)`.

Se o Pages estiver apontando para `main`, o navegador tentara carregar `src/main.tsx` e vai aparecer erro de MIME/404.

## Backend para dados SQLite

Para ver dados no site publicado, suba o backend Node/Express em um host (Render, Railway, VPS, etc.) e configure no frontend:

1. Crie o arquivo `.env.production` na raiz do projeto:
   `VITE_API_BASE_URL=https://SEU_BACKEND_PUBLICO`
2. Gere novo build/deploy do frontend.
3. No backend, opcionalmente defina `CORS_ORIGIN=https://akira2018.github.io` para restringir acesso.

Exemplo de chamadas no frontend:

- `https://SEU_BACKEND_PUBLICO/api/members`
- `https://SEU_BACKEND_PUBLICO/api/stats`

### Deploy rapido no Render (backend)

O repositorio ja inclui `render.yaml` para subir a API com SQLite persistente.

1. No Render, clique em `New +` -> `Blueprint` e conecte o repo `Akira2018/templo`.
2. O Render vai criar o servico `templo-api` com disco persistente.
3. Em `Environment`, ajuste:
   - `CORS_ORIGIN=https://akira2018.github.io`
   - (opcional) `PORT` nao precisa definir manualmente.
4. Aguarde deploy e teste:
   - `https://SEU_BACKEND_PUBLICO/api/health`
   - `https://SEU_BACKEND_PUBLICO/api/stats`

### Ligando frontend publicado ao backend

1. No GitHub: `Settings` -> `Secrets and variables` -> `Actions` -> `Variables`.
2. Crie `VITE_API_BASE_URL` com a URL publica do Render, por exemplo:
   `https://templo-api.onrender.com`
3. Rode o workflow `Deploy To GitHub Pages` novamente.

## Importar membros de outro SQLite

Se voce tem um arquivo SQLite legado (`.db`, `.sqlite`, `.sqlite3`) com tabela `members` ou `membros`, importe para o banco atual com:

`npm run import:sqlite-members -- caminho/para/legado.sqlite --db church.db`

Se omitir `--db`, o destino padrao sera `church.db`.

## Importar membros de arquivo SQL (.sql)

Para dump SQL (ex.: `membros.sql`):

`npm run import:sql-members -- caminho/para/membros.sql --db church.db`

Tambem aceita `-db` no lugar de `--db`.
