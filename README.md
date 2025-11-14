# Aplicação Web Learnny (Front-End)

Este repositório contém o código-fonte do front-end da plataforma **Learnny**. É uma aplicação web estática (HTML, CSS, JS) pura que consome a [API do Learnny](https://github.com/VictorNBatista/learnny-backend) para fornecer uma interface interativa para alunos, professores e administradores.

## Funcionalidades Principais

* **Dashboards Responsivos:** Painéis de controle dedicados para Alunos e Professores.
* **Fluxo de Agendamento:** Interface completa para buscar professores (`study.html`), ver horários (`schedule.html`) e agendar aulas.
* **Gerenciamento de Aulas:** Listagem e filtragem de agendamentos (pendentes, confirmados, etc.) com ações contextuais (confirmar, cancelar).
* **Edição de Perfil:** Formulários para Alunos e Professores atualizarem seus dados.
* **Gestão de Disponibilidade:** Interface para Professores definirem seus horários de trabalho semanais.
* **Feedback de UX:** Componente de modal reutilizável para alertas, confirmações e mensagens de erro, substituindo os pop-ups nativos do navegador.

## Stack de Tecnologias

* **HTML5**
* **CSS3** (com Variáveis Globais, Flexbox e Grid)
* **JavaScript (Vanilla JS)** (ES6+, Async/Await, Fetch API)
* **Deploy de Produção:** [**Vercel**](https://vercel.com/)

## 1. Configuração do Ambiente Local (Laragon)

Este front-end é uma aplicação estática, mas depende que a **API do Back-End esteja rodando** para funcionar.

### 1.1. Configurar o Front-End

1.  **Servidor Web Local (Laragon):**
    * Certifique-se de que seu Laragon (ou outro servidor Apache/Nginx) esteja rodando.
    * Este projeto foi projetado para rodar em um VirtualHost (ex: `http://learnny.test`). Você pode acessar os arquivos diretamente, mas o `VirtualHost` é recomendado.

2.  **Configurar a URL da API (Crucial):**
    * O front-end precisa saber onde a API está.
    * Abra o arquivo: `public/scripts/config.js`
    * Certifique-se de que a variável `API_BASE_URL` esteja apontando para sua API local (que geralmente roda com `php artisan serve`):
      ```javascript
      const API_BASE_URL = "http://localhost:8000";
      ```

### 1.2. Rodar o Projeto

1.  Garanta que o **servidor da API (Back-end)** esteja rodando:
    ```bash
    # No terminal do back-end
    php artisan serve
    ```
2.  Garanta que o **Laragon (Apache)** esteja rodando.
3.  Acesse seu site no navegador (ex: `http://learnny.test/login.html` ou o HTML correspondente).

## 2. Deploy em Produção (Vercel)

O deploy na Vercel é ideal para sites estáticos.

1.  **Vincular Repositório:**
    * Crie um projeto na Vercel e importe este repositório do GitHub.
    * A Vercel detectará automaticamente que é um projeto estático (sem framework).

2.  **Configurar a API de Produção (Crucial):**
    * **Antes de fazer o push** para a Vercel, você **deve** alterar o arquivo `public/scripts/config.js` para apontar para a sua API em produção (a URL que o Railway gerou):
      ```javascript
      // const API_BASE_URL = "http://localhost:8000"; // Comente esta linha
      const API_BASE_URL = "[https://sua-api-no-railway.up.railway.app](https://sua-api-no-railway.up.railway.app)";
      ```
    * Faça o `commit` e `push` desta alteração. A Vercel fará o deploy automaticamente.

3.  **Configurar o CORS no Back-End:**
    * Não se esqueça de ir ao seu dashboard do **Railway** e adicionar a URL da Vercel (ex: `https://learnny-frontend.vercel.app`) à sua variável de ambiente `CORS_ALLOWED_ORIGINS` para que a API aceite as requisições do front-end.