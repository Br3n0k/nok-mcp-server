# NOK MCP Server

Servidor MCP (Model Context Protocol) generalista com sistema de plugins multi-linguagem, pronto para integração com o Cursor e uso em projetos de IA, automação, desenvolvimento web, ciência de dados e muito mais.

---

## Índice
- [Visão Geral](#visão-geral)
- [Principais Funcionalidades](#principais-funcionalidades)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Arquitetura de Contextos](#arquitetura-de-contextos)
- [Sistema de Plugins](#sistema-de-plugins)
- [Endpoints da API](#endpoints-da-api)
- [Como Rodar Localmente](#como-rodar-localmente)
- [Exemplos de Uso](#exemplos-de-uso)
- [Integração com Cursor](#integração-com-cursor)
- [Como criar Plugins](#como-criar-plugins)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

---

## Visão Geral

O **NOK MCP Server** é um servidor universal para orquestração de contextos, ferramentas e plugins, seguindo o padrão MCP (Model Context Protocol). Ele permite a extensão de funcionalidades via plugins em múltiplas linguagens (TypeScript, Python, Go, PHP), facilitando a integração com editores como o Cursor e automação de fluxos de trabalho de IA e desenvolvimento.

---

## Principais Funcionalidades
- **Gerenciamento de Contextos**: Contextos universais e por projeto, configuráveis via JSON.
- **Sistema de Plugins Multi-Linguagem**: Plugins internos (TS) e externos (Python, Go, PHP) executados em processos separados.
- **API RESTful**: Endpoints para consulta de contextos, plugins, saúde do servidor e execução de ferramentas.
- **Pronto para o Cursor**: Integração nativa com o editor Cursor, permitindo uso de contextos e ferramentas diretamente do editor.
- **Extensível e Modular**: Fácil de adicionar novos contextos, ferramentas e plugins.

---

## Estrutura do Projeto

```
MCP-Server/
├── config/                  # Configurações gerais e templates
├── plugins/                 # Plugins externos (Go, PHP, Python, TypeScript)
│   ├── go/
│   ├── php/
│   ├── python/
│   └── typescript/
├── scripts/                 # Scripts utilitários para plugins e setup
├── src/
│   ├── config/              # Configurações internas (contexts.json, plugins.json)
│   ├── core/                # Núcleo do servidor (server, context-manager, plugin-manager, bridge-manager, types)
│   ├── deployments/         # (Reservado para automações de deploy)
│   └── plugins/             # Plugins internos (ex: typescript/web-tools.ts)
│       ├── go/
│       ├── php/
│       ├── python/
│       └── typescript/
├── docker-compose.yml       # Configuração Docker opcional
├── package.json             # Dependências e scripts NPM
├── tsconfig.json            # Configuração TypeScript
└── README.md                # Documentação principal
```

### Descrição das Pastas Principais
- **config/**: Arquivos de configuração global e templates de plugins.
- **plugins/**: Plugins externos, organizados por linguagem. São executados em processos separados.
- **scripts/**: Scripts utilitários para instalação, criação e manutenção de plugins.
- **src/config/**: Configurações internas do servidor, como `contexts.json` (contextos e projetos) e `plugins.json` (plugins disponíveis).
- **src/core/**: Código-fonte do núcleo do servidor MCP:
  - `server.ts`: Inicialização do servidor, endpoints e integração dos gerenciadores.
  - `context-manager.ts`: Gerencia contextos universais e de projetos.
  - `plugin-manager.ts`: Carrega, inicializa e gerencia plugins.
  - `bridge-manager.ts`: Gerencia comunicação com plugins externos.
  - `types.ts`: Tipos e interfaces globais.
- **src/plugins/**: Plugins internos escritos em TypeScript, carregados diretamente pelo servidor.

---

## Arquitetura de Contextos

O MCP Server suporta dois tipos de contextos:
- **Contextos Universais**: Disponíveis para todos os projetos, definidos em `src/config/contexts.json`.
- **Contextos de Projeto**: Específicos para cada projeto, podendo herdar de contextos universais e customizar ferramentas/plugins.

Exemplo de configuração (`src/config/contexts.json`):
```json
{
  "universal": {
    "contexts": [
      {
        "id": "ts-web",
        "name": "TypeScript Web",
        "description": "Contexto para desenvolvimento web com TypeScript e React.",
        "templates": ["react-component", "api-endpoint"],
        "tools": ["format_code", "lint_code"]
      }
    ],
    "plugins": [
      {
        "id": "ts-web-tools",
        "name": "TypeScript Web Tools",
        "description": "Ferramentas para desenvolvimento web em TypeScript.",
        "tools": ["format_code", "lint_code"]
      }
    ]
  },
  "projects": [
    {
      "id": "web-app",
      "name": "Aplicação Web",
      "context": "ts-web",
      "plugins": ["ts-web-tools"]
    }
  ],
  "activeProject": "web-app"
}
```

---

## Sistema de Plugins

### Plugins Internos
- Escrito em TypeScript, localizado em `src/plugins/`.
- Carregado diretamente pelo servidor.
- Exemplo: `src/plugins/typescript/web-tools.ts` (ferramentas de formatação e lint para TS/JS).

### Plugins Externos
- Localizados em `plugins/` (fora do `src/`).
- Podem ser escritos em Python, Go, PHP, etc.
- Executados em processos separados, comunicação via MCP Protocol.
- Exemplo: `plugins/python/example.py`.

### Como funciona
- Plugins expõem ferramentas ("tools") que podem ser chamadas via API ou pelo Cursor.
- Plugins podem ser ativados/desativados por contexto ou projeto.

---

## Endpoints da API

- `GET /health` — Status do servidor, plugins carregados, projeto ativo, uptime.
- `GET /plugins` — Lista de plugins carregados, com detalhes e ferramentas disponíveis.
- `GET /contexts` — Lista de contextos universais, de projeto e projeto ativo.

Exemplo de resposta `/contexts`:
```json
{
  "universal": [ ... ],
  "projects": [ ... ],
  "activeProject": { ... }
}
```

---

## Como Rodar Localmente

1. **Pré-requisitos:**
   - Node.js >= 20
   - npm >= 9

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Compile o projeto:**
   ```bash
   npm run build
   ```

4. **Inicie o servidor:**
   - **Via SSE (HTTP):**
     ```bash
     npm run start:sse
     ```
     O servidor estará disponível em `http://localhost:3000`.
   - **Via stdio (para integração com ferramentas que usam stdin/stdout):**
     ```bash
     npm run start:stdio
     ```
   - **Comando padrão (sem transporte explícito):**
     ```bash
     npm run start
     ```

5. **Comandos Principais da Aplicação:**
   - **Iniciar o servidor (sem transporte explícito):**
     ```bash
     npm run start
     ```
   - **Iniciar o servidor via SSE (HTTP):**
     ```bash
     npm run start:sse
     ```
   - **Iniciar o servidor via stdio (para integração com ferramentas que usam stdin/stdout):**
     ```bash
     npm run start:stdio
     ```
   - **Instalar um plugin externo (ex: via script de instalação):**
     ```bash
     npm run plugin:install
     ```
   - **Criar um novo plugin (ex: via script de criação):**
     ```bash
     npm run plugin:create
     ```
   - **Executar testes:**
     ```bash
     npm run test
     ```
   - **Executar lint (verificação de estilo):**
     ```bash
     npm run lint
     ```
   - **Executar lint com correção automática:**
     ```bash
     npm run lint:fix
     ```
   - **Executar typecheck (verificação de tipos):**
     ```bash
     npm run typecheck
     ```
   - **Limpar a pasta de build (dist):**
     ```bash
     npm run clean
     ```
   - **Construir a imagem Docker (se disponível):**
     ```bash
     npm run docker:build
     ```
   - **Executar o servidor via Docker (se disponível):**
     ```bash
     npm run docker:run
     ```

---

## Exemplos de Uso

### Listar contextos (via SSE)
```bash
curl -s http://localhost:3000/contexts | python -m json.tool
```

### Listar plugins (via SSE)
```bash
curl -s http://localhost:3000/plugins | python -m json.tool
```

### Verificar saúde do servidor (via SSE)
```bash
curl -s http://localhost:3000/health | python -m json.tool
```

### Exemplo de uso via stdio (para integração com ferramentas que usam stdin/stdout)
Se você estiver rodando o servidor com "npm run start:stdio", a comunicação ocorre via stdin/stdout. Por exemplo, você pode enviar comandos (como "/contexts" ou "/plugins") via stdin e receber a resposta via stdout. (Exemplo fictício: "echo '/contexts' | npm run start:stdio".)

---

## Integração com Cursor

O MCP Server foi projetado para integração nativa com o Cursor. Basta configurar o endpoint do servidor no Cursor (ex: `http://localhost:3000`). O Cursor irá detectar automaticamente os contextos, plugins e ferramentas disponíveis, permitindo criar, editar e executar comandos/contextos diretamente do editor.

- **Contextos e ferramentas** ficam disponíveis para seleção e execução no painel do Cursor.
- **Plugins** podem ser chamados para formatação, lint, geração de código, etc.

---

## Como criar Plugins

### Plugins Internos (TypeScript)
1. Crie um novo arquivo em `src/plugins/typescript/`.
2. Exporte um objeto `tools` com as funções desejadas.
3. Exemplo:
```ts
export const tools = {
  async minha_ferramenta(args: { code: string }) {
    // lógica aqui
    return { success: true, data: ... };
  }
};
```

### Plugins Externos (Python, Go, PHP, etc.)
1. Crie um novo diretório em `plugins/<linguagem>/`.
2. Siga o protocolo MCP para comunicação (veja exemplos em `plugins/python/example.py`).
3. Registre o plugin em `src/config/contexts.json` se desejar ativá-lo por contexto/projeto.

---

## Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues, pull requests ou sugerir melhorias.

1. Fork este repositório
2. Crie uma branch para sua feature/fix
3. Envie um PR detalhado

---

## Licença

MIT © Brendown Ferreira
