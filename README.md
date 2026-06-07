# IEQ Paraíso - Sistema de Gestão ⛪

Sistema moderno para gestão de membros, visitantes, cultos, presenças e permissões da **Igreja do Evangelho Quadrangular - Bairro Paraíso**.

Desenvolvido com **React**, **Vite**, **TypeScript**, **TailwindCSS** e integrado ao **Supabase** (Banco de Dados, Autenticação e Segurança via Row Level Security - RLS).

---

## 🚀 Como Executar Localmente

### Pré-requisitos
* Node.js (v18 ou superior recomendado)
* Gerenciador de pacotes npm (incluso com o Node.js)

### Passos
1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Execute o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   O aplicativo estará disponível em `http://localhost:3000`.

---

## ☁️ Como Implantar na Cloudflare Pages

O projeto já está totalmente preparado para ser implantado na **Cloudflare Pages**. A configuração de SPA (Single Page Application) foi implementada no arquivo `public/_redirects` para que rotas como `/membros`, `/dashboard` e `/cultos` funcionem corretamente em recarregamentos de página (evitando erro 404).

### Passo a Passo de Configuração:

1. **Acesse o Painel da Cloudflare:**
   * Vá para **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.

2. **Selecione o Repositório:**
   * Escolha o repositório `IEQParaiso` da sua conta GitHub.

3. **Configurações de Build (Build settings):**
   * **Framework preset:** `Vite`
   * **Build command:** `npm run build`
   * **Build output directory:** `dist`

4. **Variáveis de Ambiente (Opcional):**
   * Por padrão, o projeto possui chaves de desenvolvimento/produção pré-configuradas no cliente Supabase. Se desejar alterar ou customizar os ambientes, configure as seguintes variáveis no painel da Cloudflare em **Settings > Environment variables**:
     * `VITE_SUPABASE_URL` (URL do seu projeto no Supabase)
     * `VITE_SUPABASE_ANON_KEY` (Chave anônima pública do Supabase)

5. **Clique em "Save and Deploy"**
   * A Cloudflare criará uma URL exclusiva para o seu projeto e recompilará o projeto automaticamente a cada novo commit enviado ao repositório GitHub!

---

## 🛠️ Tecnologias Utilizadas

* **React 19** com TypeScript
* **Vite** para build super rápido
* **TailwindCSS** para estilização utilitária moderna
* **Lucide React** para ícones limpos e profissionais
* **Framer Motion** para animações e transições fluidas
* **Supabase Client** para integração em tempo real com backend seguro (PostgreSQL + RLS)
