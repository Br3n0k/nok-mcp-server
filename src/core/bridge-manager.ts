/**
 * Bridge Manager - Ponte para comunicação entre plugins
 */

import { spawn, ChildProcess } from 'child_process';
import chalk from 'chalk';
import { Plugin } from './types.js';

export class PluginBridge {
  private processes = new Map<string, ChildProcess>();

  async executeRemotePlugin(plugin: Plugin, tool: string, args: any): Promise<any> {
    switch (plugin.language) {
      case 'php':
        return this.callPHPEndpoint(plugin.endpoint!, tool, args);
      case 'python':
        return this.callPythonProcess(plugin.command!, tool, args);
      case 'go':
        return this.callGoProcess(plugin.command!, tool, args);
      default:
        throw new Error(`Linguagem não suportada para execução remota: ${plugin.language}`);
    }
  }
  
  private async callPHPEndpoint(endpoint: string, tool: string, args: any): Promise<any> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ tool, args })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(chalk.red(`❌ Erro ao chamar endpoint PHP ${endpoint}:`), error);
      throw error;
    }
  }
  
  private async callPythonProcess(command: string, tool: string, args: any): Promise<any> {
    return this.executeChildProcess('python3', [command], { tool, args });
  }

  private async callGoProcess(command: string, tool: string, args: any): Promise<any> {
    return this.executeChildProcess(command, [], { tool, args });
  }

  private async executeChildProcess(
    command: string, 
    commandArgs: string[], 
    payload: { tool: string; args: any }
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, commandArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      process.stdout?.on('data', (data) => {
        output += data.toString();
      });

      process.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (error) {
            reject(new Error(`Erro ao parsear saída JSON: ${error.message}\nSaída: ${output}`));
          }
        } else {
          reject(new Error(`Processo terminou com código ${code}\nErro: ${errorOutput}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Erro ao executar processo: ${error.message}`));
      });

      // Enviar payload para o processo
      if (process.stdin) {
        process.stdin.write(JSON.stringify(payload) + '\n');
        process.stdin.end();
      }

      // Timeout para evitar processos travados
      setTimeout(() => {
        if (!process.killed) {
          process.kill();
          reject(new Error('Timeout na execução do processo'));
        }
      }, 30000); // 30 segundos
    });
  }

  async ping(plugin: Plugin): Promise<boolean> {
    try {
      switch (plugin.language) {
        case 'php':
          if (!plugin.endpoint) return false;
          const response = await fetch(plugin.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ping' })
          });
          return response.ok;

        case 'python':
        case 'go':
          if (!plugin.command) return false;
          // Para simplificar, consideramos que sempre está disponível
          // Em uma implementação real, você poderia tentar executar um comando de teste
          return true;

        default:
          return false;
      }
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Ping falhou para plugin ${plugin.id}:`), error);
      return false;
    }
  }

  async shutdown(): Promise<void> {
    console.log(chalk.yellow('🛑 Encerrando bridge manager...'));
    
    for (const [id, process] of this.processes) {
      if (!process.killed) {
        process.kill();
        console.log(chalk.gray(`🗑️  Processo ${id} terminado`));
      }
    }
    
    this.processes.clear();
  }
} 