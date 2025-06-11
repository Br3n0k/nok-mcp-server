/**
 * Servidor MCP base
 * 
 * @author: @Br3n0k | Brendown Ferreira
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fastify, { FastifyInstance } from 'fastify';
import chalk from 'chalk';
import { ServerConfig } from './types.js';
import { PluginManager } from './plugin-manager.js';

export class MCPServer {
  private server: Server;
  private fastifyServer?: FastifyInstance;
  private config: ServerConfig;
  private pluginManager: PluginManager;

  constructor(config: ServerConfig) {
    this.config = config;
    this.pluginManager = config.pluginManager;
    
    // Inicializar servidor MCP
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
          logging: {}
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handler para listar ferramentas
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const plugins = this.pluginManager.getLoadedPlugins();
      const tools = plugins.flatMap(plugin => 
        plugin.tools.map(tool => ({
          name: `${plugin.id}.${tool.name}`,
          description: tool.description || `Ferramenta ${tool.name} do plugin ${plugin.name}`,
          inputSchema: tool.inputSchema || {
            type: 'object',
            properties: {},
            required: []
          }
        }))
      );

      if (this.config.debug) {
        console.log(chalk.blue(`📋 Listando ${tools.length} ferramentas disponíveis`));
      }

      return { tools };
    });

    // Handler para executar ferramentas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      if (this.config.debug) {
        console.log(chalk.yellow(`🔧 Executando ferramenta: ${name}`));
        console.log(chalk.gray(`📥 Argumentos:`, JSON.stringify(args, null, 2)));
      }

      try {
        // Extrair pluginId e toolName do nome da ferramenta
        const [pluginId, toolName] = name.split('.', 2);
        
        if (!pluginId || !toolName) {
          throw new Error(`Nome de ferramenta inválido: ${name}. Use o formato: pluginId.toolName`);
        }

        const result = await this.pluginManager.callTool(pluginId, toolName, args);
        
        if (!result.success) {
          throw new Error(result.error || 'Erro desconhecido na execução da ferramenta');
        }

        if (this.config.debug) {
          console.log(chalk.green(`✅ Ferramenta ${name} executada com sucesso em ${result.executionTime}ms`));
        }

        return {
          content: [
            {
              type: 'text',
              text: typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error(chalk.red(`❌ Erro ao executar ferramenta ${name}:`), error);
        
        return {
          content: [
            {
              type: 'text',
              text: `Erro: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async start(): Promise<void> {
    switch (this.config.transport) {
      case 'stdio':
        await this.startStdio();
        break;
      case 'sse':
        await this.startSSE();
        break;
      case 'ws':
        await this.startWebSocket();
        break;
      default:
        throw new Error(`Transporte não suportado: ${this.config.transport}`);
    }
  }

  private async startStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    if (this.config.debug) {
      console.log(chalk.green('📡 Servidor MCP conectado via STDIO'));
    }
  }

  private async startSSE(): Promise<void> {
    this.fastifyServer = fastify({
      logger: this.config.debug ? true : false
    });

    // Registrar CORS
    await this.fastifyServer.register(import('@fastify/cors'), {
      origin: true
    });

    // Endpoint de saúde
    this.fastifyServer.get('/health', async () => {
      const plugins = this.pluginManager.getLoadedPlugins();
      return {
        status: 'ok',
        server: this.config.name,
        version: this.config.version,
        plugins: plugins.length,
        uptime: process.uptime()
      };
    });

    // Endpoint para listar plugins
    this.fastifyServer.get('/plugins', async () => {
      const plugins = this.pluginManager.getLoadedPlugins();
      return {
        plugins: plugins.map(plugin => ({
          id: plugin.id,
          name: plugin.name,
          language: plugin.language,
          enabled: plugin.enabled,
          tools: plugin.tools.map(tool => ({
            name: tool.name,
            description: tool.description
          }))
        }))
      };
    });

    // Endpoint SSE para MCP
    this.fastifyServer.get('/sse', async (request, reply) => {
      const transport = new SSEServerTransport('/sse', reply.raw);
      await this.server.connect(transport);
      
      if (this.config.debug) {
        console.log(chalk.blue('🔗 Nova conexão SSE estabelecida'));
      }
    });

    // Iniciar servidor HTTP
    await this.fastifyServer.listen({
      host: this.config.host,
      port: this.config.port
    });

    if (this.config.debug) {
      console.log(chalk.green(`📡 Servidor MCP SSE iniciado em http://${this.config.host}:${this.config.port}/sse`));
    }
  }

  private async startWebSocket(): Promise<void> {
    // WebSocket transport não está implementado no SDK oficial ainda
    // Esta é uma implementação placeholder
    throw new Error('WebSocket transport ainda não implementado');
  }

  async stop(): Promise<void> {
    if (this.config.debug) {
      console.log(chalk.yellow('🛑 Parando servidor MCP...'));
    }

    if (this.fastifyServer) {
      await this.fastifyServer.close();
    }

    await this.pluginManager.shutdown();
    
    if (this.config.debug) {
      console.log(chalk.green('✅ Servidor MCP parado com sucesso'));
    }
  }

  getLoadedPlugins() {
    return this.pluginManager.getLoadedPlugins();
  }

  async getServerInfo() {
    const plugins = this.pluginManager.getLoadedPlugins();
    
    return {
      name: this.config.name,
      version: this.config.version,
      transport: this.config.transport,
      host: this.config.host,
      port: this.config.port,
      plugins: {
        total: plugins.length,
        loaded: plugins.filter(p => p.enabled).length,
        languages: [...new Set(plugins.map(p => p.language))]
      },
      uptime: process.uptime()
    };
  }
}