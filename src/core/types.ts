/**
 * Tipos e interfaces do sistema MCP
 */

import { Tool, Resource, Prompt } from '@modelcontextprotocol/sdk/types.js';

export interface PluginTool extends Tool {
  handler: (args: any) => Promise<any>;
  plugin?: string;
}

export interface PluginResource extends Resource {
  handler: (uri: string) => Promise<any>;
  plugin?: string;
}

export interface PluginPrompt extends Prompt {
  handler: (args: any) => Promise<any>;
  plugin?: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  language: 'typescript' | 'python' | 'php' | 'go';
  enabled: boolean;
  autostart: boolean;
  endpoint?: string;  // Para plugins remotos (PHP)
  command?: string;   // Para plugins locais (Python, Go)
  module?: string;    // Para plugins TypeScript
  tools: PluginTool[];
  resources?: PluginResource[];
  prompts?: PluginPrompt[];
  config?: Record<string, any>;
}

export interface PluginConfig {
  version: string;
  plugins: Plugin[];
  settings: {
    autoload: boolean;
    timeout: number;
    maxConcurrent: number;
    retryAttempts: number;
  };
}

export interface ServerConfig {
  name: string;
  version: string;
  transport: 'stdio' | 'sse' | 'ws';
  host: string;
  port: number;
  pluginManager: any; // PluginManager
  debug: boolean;
}

export interface PluginManagerConfig {
  configPath: string;
  debug: boolean;
}

export interface PluginExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  plugin: string;
  tool: string;
  executionTime: number;
}

export interface TransportType {
  start(): Promise<void>;
  stop(): Promise<void>;
  send(message: any): Promise<void>;
}

export type SupportedLanguage = 'typescript' | 'python' | 'php' | 'go';
export type TransportProtocol = 'stdio' | 'sse' | 'ws'; 