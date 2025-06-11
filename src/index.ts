#!/usr/bin/env node

/**
 * NOK MCP Server Universal
 * Servidor MCP generalista com sistema de plugins multi-linguagem
 */

import { MCPServer } from './core/server.js';
import { PluginManager } from './core/plugin-manager.js';
import { program } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function main() {
  program
    .name('nok-mcp-server')
    .description('Servidor MCP generalista com sistema de plugins')
    .version('1.0.0')
    .option('-p, --port <port>', 'Porta do servidor', process.env.MCP_PORT || '3000')
    .option('-t, --transport <type>', 'Tipo de transporte (stdio|sse|ws)', process.env.MCP_TRANSPORT || 'stdio')
    .option('-h, --host <host>', 'Host do servidor', process.env.MCP_HOST || 'localhost')
    .option('-c, --config <path>', 'Caminho do arquivo de configuração', './src/config/plugins.json')
    .option('-d, --debug', 'Modo debug', false);

  program.parse();
  const options = program.opts();

  if (options.debug) {
    console.log(chalk.yellow('🔧 Modo debug ativado'));
    console.log(chalk.gray('Opções:', JSON.stringify(options, null, 2)));
  }

  try {
    // Inicializar gerenciador de plugins
    const pluginManager = new PluginManager({
      configPath: options.config,
      debug: options.debug
    });

    // Inicializar servidor MCP
    const server = new MCPServer({
      name: 'nok-mcp-server',
      version: '1.0.0',
      transport: options.transport,
      host: options.host,
      port: parseInt(options.port),
      pluginManager,
      debug: options.debug
    });

    // Carregar plugins
    await pluginManager.loadAllPlugins();
    
    console.log(chalk.green('🚀 NOK MCP Server iniciando...'));
    console.log(chalk.blue(`📡 Transporte: ${options.transport}`));
    
    if (options.transport !== 'stdio') {
      console.log(chalk.blue(`🌐 Endereço: ${options.host}:${options.port}`));
    }

    // Iniciar servidor
    await server.start();
    
    console.log(chalk.green('✅ Servidor iniciado com sucesso!'));
    console.log(chalk.gray(`🔌 Plugins carregados: ${pluginManager.getLoadedPlugins().length}`));

  } catch (error) {
    console.error(chalk.red('❌ Erro ao iniciar servidor:'), error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n⏹️  Encerrando servidor...'));
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(chalk.yellow('\n⏹️  Encerrando servidor...'));
  process.exit(0);
});

// Iniciar aplicação
main().catch((error) => {
  console.error(chalk.red('💥 Erro crítico:'), error);
  process.exit(1);
}); 