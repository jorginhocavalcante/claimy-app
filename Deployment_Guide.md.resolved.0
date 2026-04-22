# CLAIMY - Guia de Lançamento (Deploy)

Siga estes passos para colocar sua startup online hoje mesmo.

## Passo 1: Subir para o GitHub (Obrigatório)
1.  Crie um repositório privado ou público no [GitHub](https://github.com).
2.  Suba todos os arquivos da pasta para este repositório.
    *   *Dica:* Use o app "GitHub Desktop" se não quiser usar o terminal.

## Passo 2: Hospedar o Frontend (Landing Page)
1.  Acesse [vercel.com](https://vercel.com) e conecte sua conta do GitHub.
2.  Clique em **"Add New" > "Project"**.
3.  Importe o repositório da CLAIMY.
4.  No campo "Build and Output Settings", certifique-se de que não há comandos de build (é apenas HTML estático).
5.  Clique em **Deploy**.
6.  **Resultado:** Você terá um link como `https://claimy.vercel.app`.

## Passo 3: Hospedar o Backend (Servidor)
1.  Acesse [render.com](https://render.com) e conecte seu GitHub.
2.  Crie um novo **"Web Service"**.
3.  Selecione o repositório da CLAIMY.
4.  No "Root Directory", coloque `claimy-backend`.
5.  Em "Start Command", coloque `npm start`.
6.  Vá em **"Environment"** e adicione as chaves que estão no seu arquivo `.env`.
7.  Clique em **Create Web Service**.

## Passo 4: Conectar as Pontas
Assim que o backend estiver rodando no Render, ele te dará uma URL (ex: `https://claimy-api.onrender.com`).
1.  Abra o arquivo `Claimy_Landing.html`.
2.  Mude o `fetch('http://localhost:3000/v1/scan')` para `fetch('https://sua-api-do-render.com/v1/scan')`.
3.  Faça o "Push" dessa mudança para o GitHub. A Vercel vai atualizar o site sozinha.

---

### 🎉 Parabéns! Sua startup está no ar.
Agora você pode mandar o link da Vercel para sua irmã e para os primeiros clientes.
