/**
 * Gerenciador de plugins
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import chalk from 'chalk';
import { 
  Plugin, 
  PluginConfig, 
  PluginManagerConfig, 
  PluginExecutionResult,
  PluginTool,
  PluginResource 
} from './types.js';

export class PluginManager {
  private plugins = new Map<string, Plugin>();
  private processes = new Map<string, ChildProcess>();
  private config!: PluginConfig;
  private options: PluginManagerConfig;

  constructor(options: PluginManagerConfig) {
    this.options = options;
  }

  async loadAllPlugins(): Promise<void> {
    if (this.options.debug) {
      console.log(chalk.blue('🔌 Carregando configuração de plugins...'));
    }

    try {
      const configPath = path.resolve(this.options.configPath);
      const configContent = await fs.readFile(configPath, 'utf-8');
      this.config = JSON.parse(configContent) as PluginConfig;

      if (this.options.debug) {
        console.log(chalk.gray(`📋 Configuração carregada: ${this.config.plugins.length} plugins encontrados`));
      }

      for (const plugin of this.config.plugins) {
        if (plugin.enabled) {
          await this.loadPlugin(plugin);
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Erro ao carregar configuração de plugins:'), error);
      throw error;
    }
  }

  async loadPlugin(plugin: Plugin): Promise<void> {
    if (this.options.debug) {
      console.log(chalk.yellow(`⚙️  Carregando plugin: ${plugin.name} (${plugin.language})`));
    }

    try {
      switch (plugin.language) {
        case 'typescript':
          await this.loadTSPlugin(plugin);
          break;
        case 'python':
          await this.loadPythonPlugin(plugin);
          break;
        case 'php':
          await this.loadPHPPlugin(plugin);
          break;
        case 'go':
          await this.loadGoPlugin(plugin);
          break;
        default:
          throw new Error(`Linguagem não suportada: ${plugin.language}`);
      }

      this.plugins.set(plugin.id, plugin);
      
      if (this.options.debug) {
        console.log(chalk.green(`✅ Plugin ${plugin.name} carregado com sucesso`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Erro ao carregar plugin ${plugin.name}:`), error);
      throw error;
    }
  }

  private async loadTSPlugin(plugin: Plugin): Promise<void> {
    if (!plugin.module) {
      throw new Error(`Plugin TypeScript ${plugin.id} requer 'module'`);
    }

    try {
      const modulePath = path.resolve(plugin.module);
      // Convert Windows path to file URL for ES modules
      const moduleUrl = process.platform === 'win32' 
        ? `file:///${modulePath.replace(/\\/g, '/')}`
        : `file://${modulePath}`;
      const pluginModule = await import(moduleUrl);
      
      // Assumindo que o plugin exporta suas ferramentas
      if (pluginModule.tools) {
        plugin.tools = Object.entries(pluginModule.tools).map(([name, handler]) => ({
          name,
          description: `Ferramenta ${name} do plugin ${plugin.name}`,
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
          handler: handler as (args: any) => Promise<any>,
          plugin: plugin.id
        }));
      }
    } catch (error) {
      throw new Error(`Erro ao importar módulo TypeScript: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async loadPythonPlugin(plugin: Plugin): Promise<void> {
    if (!plugin.command) {
      throw new Error(`Plugin Python ${plugin.id} requer 'command'`);
    }

    // Para plugins Python, vamos iniciar o processo se autostart estiver habilitado
    if (plugin.autostart) {
      const process = spawn('python3', [plugin.command], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.processes.set(plugin.id, process);

      process.on('error', (error) => {
        console.error(chalk.red(`❌ Erro no processo Python ${plugin.id}:`), error);
      });
    }
  }

  private async loadPHPPlugin(plugin: Plugin): Promise<void> {
    if (!plugin.endpoint) {
      throw new Error(`Plugin PHP ${plugin.id} requer 'endpoint'`);
    }

    // Para PHP, apenas validamos se o endpoint está acessível
    try {
      const response = await fetch(plugin.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' })
      });

      if (!response.ok) {
        throw new Error(`Endpoint PHP não acessível: ${response.status}`);
      }
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Plugin PHP ${plugin.id} endpoint não acessível (será tentado novamente quando necessário)`));
    }
  }

  private async loadGoPlugin(plugin: Plugin): Promise<void> {
    if (!plugin.command) {
      throw new Error(`Plugin Go ${plugin.id} requer 'command'`);
    }

    // Para plugins Go, similar ao Python
    if (plugin.autostart) {
      const process = spawn(plugin.command, [], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.processes.set(plugin.id, process);

      process.on('error', (error) => {
        console.error(chalk.red(`❌ Erro no processo Go ${plugin.id}:`), error);
      });
    }
  }

  async callTool(pluginId: string, toolName: string, args: any): Promise<PluginExecutionResult> {
    const startTime = Date.now();
    
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        throw new Error(`Plugin não encontrado: ${pluginId}`);
      }

      const result = await this.executePluginTool(plugin, toolName, args);
      
      return {
        success: true,
        data: result,
        plugin: pluginId,
        tool: toolName,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        plugin: pluginId,
        tool: toolName,
        executionTime: Date.now() - startTime
      };
    }
  }

  private async executePluginTool(plugin: Plugin, toolName: string, args: any): Promise<any> {
    switch (plugin.language) {
      case 'typescript':
        return this.executeTSTool(plugin, toolName, args);
      case 'python':
        return this.executePythonTool(plugin, toolName, args);
      case 'php':
        return this.executePHPTool(plugin, toolName, args);
      case 'go':
        return this.executeGoTool(plugin, toolName, args);
      default:
        throw new Error(`Linguagem não suportada: ${plugin.language}`);
    }
  }

  private async executeTSTool(plugin: Plugin, toolName: string, args: any): Promise<any> {
    const tool = plugin.tools.find(t => t.name === toolName);
    if (!tool || !tool.handler) {
      throw new Error(`Ferramenta ${toolName} não encontrada no plugin ${plugin.id}`);
    }

    return await tool.handler(args);
  }

  private async executePythonTool(plugin: Plugin, toolName: string, args: any): Promise<any> {
    const process = this.processes.get(plugin.id);
    if (!process) {
      throw new Error(`Processo Python não encontrado para plugin ${plugin.id}`);
    }

    return new Promise((resolve, reject) => {
      const message = JSON.stringify({ tool: toolName, args });
      
      process.stdin?.write(message + '\n');
      
      process.stdout?.once('data', (data) => {
        try {
          const result = JSON.parse(data.toString());
          resolve(result);
        } catch (error) {
          reject(new Error(`Erro ao parsear resposta Python: ${error instanceof Error ? error.message : String(error)}`));
        }
      });

      setTimeout(() => {
        reject(new Error('Timeout na execução do tool Python'));
      }, this.config.settings.timeout);
    });
  }

  private async executePHPTool(plugin: Plugin, toolName: string, args: any): Promise<any> {
    const response = await fetch(plugin.endpoint!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolName, args })
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status} ao executar tool PHP`);
    }

    return await response.json();
  }

  private async executeGoTool(plugin: Plugin, toolName: string, args: any): Promise<any> {
    const process = this.processes.get(plugin.id);
    if (!process) {
      throw new Error(`Processo Go não encontrado para plugin ${plugin.id}`);
    }

    return new Promise((resolve, reject) => {
      const message = JSON.stringify({ tool: toolName, args });
      
      process.stdin?.write(message + '\n');
      
      process.stdout?.once('data', (data) => {
        try {
          const result = JSON.parse(data.toString());
          resolve(result);
        } catch (error) {
          reject(new Error(`Erro ao parsear resposta Go: ${error instanceof Error ? error.message : String(error)}`));
        }
      });

      setTimeout(() => {
        reject(new Error('Timeout na execução do tool Go'));
      }, this.config.settings.timeout);
    });
  }

  getLoadedPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  async unloadPlugin(id: string): Promise<void> {
    const process = this.processes.get(id);
    if (process) {
      process.kill();
      this.processes.delete(id);
    }
    
    this.plugins.delete(id);
    
    if (this.options.debug) {
      console.log(chalk.yellow(`🗑️  Plugin ${id} descarregado`));
    }
  }

  async shutdown(): Promise<void> {
    if (this.options.debug) {
      console.log(chalk.yellow('🛑 Encerrando gerenciador de plugins...'));
    }

    for (const [id, process] of this.processes) {
      process.kill();
    }
    
    this.processes.clear();
    this.plugins.clear();
  }
}