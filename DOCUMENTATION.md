# Documentação Técnica - FinControl Pro

O **FinControl Pro** é um ecossistema completo de gestão financeira pessoal e empresarial, projetado para oferecer uma experiência de usuário premium com foco em clareza de dados, automação e inteligência preditiva.

---

## 🚀 1. Visão Geral
O sistema permite que os usuários gerenciem suas finanças (entradas, saídas, recorrências, parcelamentos) e monitorem seus investimentos (Ações, FIIs, Criptomoedas) em uma única plataforma integrada.

### Objetivos Principais:
- Centralizar o controle financeiro de múltiplas fontes.
- Fornecer análises visuais avançadas via dashboards dinâmicos.
- Automatizar o monitoramento de mercado com dados em tempo real.
- Garantir segurança e privacidade dos dados financeiros.

---

## 🛠 2. Stack Tecnológica

### Frontend
- **Framework:** [React](https://reactjs.org/) (v18.2) + [Vite](https://vitejs.dev/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (Design Utilitário)
- **Componentes UI:** [Radix UI](https://www.radix-ui.com/) (Acessibilidade) + [Lucide React](https://lucide.dev/) (Ícones)
- **Animações:** [Framer Motion](https://www.framer.com/motion/)
- **Estado Global:** [Zustand](https://docs.pmnd.rs/zustand/)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Gerenciamento de Dados:** [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Notificações:** [Sonner](https://sonner.stevenly.com/)

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **ORM:** [SQLAlchemy](https://www.sqlalchemy.org/)
- **Segurança:** [JWT](https://jwt.io/) (JSON Web Tokens) + Passlib (Bcrypt)
- **Validação:** [Pydantic](https://docs.pydantic.dev/)
- **Servidor:** Uvicorn

### Banco de Dados
- **Desenvolvimento:** SQLite (`fincontrol.db`)
- **Produção:** PostgreSQL (Suporte via SQLAlchemy)

---

## 🏗 3. Arquitetura do Sistema

O projeto adota uma arquitetura **SaaS moderna** com separação clara entre cliente e servidor.

### Fluxo de Dados:
1. O **Frontend** interage com o **Backend** via chamadas RESTful protegidas por JWT.
2. O **Backend** processa a lógica de negócio, integra com proxies de mercado e persiste dados no banco.
3. Rotas de **Proxy** (Brapi/CoinGecko) são utilizadas para contornar problemas de CORS e implementar cache de dados de mercado.

### Estrutura de Diretórios:
- `/frontend`: Aplicação SPA React.
  - `/src/pages`: Telas principais (Dashboard, Investimentos, Login).
  - `/src/components`: Componentes reutilizáveis (UI, Gráficos, Modais).
  - `/src/store`: Gerenciamento de estado global.
  - `/src/lib/api`: Configuração do Axios.
- `/backend`: Servidor FastAPI.
  - `/routers`: Definição de endpoints por módulo (auth, transactions, investments).
  - `/services`: Lógica de integração externa (Market Data).
  - `/models.py`: Esquemas do banco de dados (Tabelas).
  - `/crud.py`: Funções de manipulação de dados (Create, Read, Update, Delete).

---

## ✨ 4. Funcionalidades Principais

### 🔒 Autenticação e Onboarding
- Sistema de login/cadastro com validação em tempo real.
- Tela de entrada imersiva com animações interativas e hotspots informativos.
- Fluxo de onboarding para configuração inicial de espaços de trabalho (Workspaces).

### 📊 Dashboard Inteligente
- Resumo financeiro (Saldo, Receitas, Despesas).
- Gráficos de fluxo de caixa e distribuição por categorias.
- Monitoramento de metas mensais de economia.

### 💸 Gestão de Transações
- Cadastro de transações únicas, recorrentes e parceladas.
- Categorização inteligente para análise de gastos.
- Visualização consolidada de ganhos e despesas.

### 💰 Investimentos e Watchlist
- Suporte a Ações Brasileiras, FIIs e Criptomoedas.
- Busca em tempo real e adição automática à carteira.
- Gráficos de histórico de preços sincronizados com a moeda global do sistema.
- Proxy customizado para Brapi e CoinGecko para estabilidade e performance.

---

## 🎨 5. Design e UX (Experiência do Usuário)

- **Aesthetics:** Design premium com paletas de cores balanceadas (Slate/Blue/Teal).
- **Dark/Light Mode:** Suporte a temas claro e escuro.
- **Micro-interações:** Hover effects dinâmicos, pulsing dots para atenção e transações suaves.
- **Responsividade:** Layout totalmente adaptável para Mobile, Tablet e Desktop.

---

## 🛠 6. Configuração do Ambiente

### Requisitos:
- Node.js (v18+)
- Python (v3.10+)
- Pip (Gerenciador de pacotes Python)

### Rodando o Backend:
1. Acesse o diretório `backend`.
2. Instale as dependências: `pip install -r requirements.txt`.
3. Inicie o servidor: `uvicorn backend.main:app --reload`.

### Rodando o Frontend:
1. Acesse o diretório `frontend`.
2. Instale as dependências: `npm install`.
3. Inicie o projeto: `npm run dev`.

---

## 🌐 7. Integrações de APIs de Mercado
O sistema utiliza proxies dedicados no backend para garantir que as chaves de API fiquem protegidas e para gerenciar limites de requisição:
- **Brapi Proxy:** Consulta de tickers B3 e dados de FIIs.
- **Market Proxy (CoinGecko):** Dados precisos de criptoativos.

---

© 2026 FinControl Pro - Sistema de Gestão Inteligente.
