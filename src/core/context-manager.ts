/**
 * Context Manager - Gerenciador de Contextos MCP
 * 
 * Gerencia contextos universais e específicos por projeto
 * @author: @Br3n0k | Brendown Ferreira
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { 
  ContextConfig, 
  UniversalContext, 
  ProjectContext, 
  Plugin, 
  SupportedLanguage 
} from './types.js';

export class ContextManager {
  private config: ContextConfig;
  private activeProject?: ProjectContext;
  private configPath: string;
  private debug: boolean;

  constructor(options: { configPath: string; debug?: boolean }) {
    this.configPath = options.configPath;
    this.debug = options.debug || false;
    this.config = {
      universal: {
        contexts: {},
        plugins: []
      },
      projects: {}
    };
  }

  async loadConfig(): Promise<void> {
    if (this.debug) {
      console.log(chalk.blue('🔍 Carregando configuração de contextos...'));
    }

    try {
      const configContent = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(configContent) as ContextConfig;

      if (this.config.active_project) {
        await this.activateProject(this.config.active_project);
      }

      if (this.debug) {
        console.log(chalk.green('✅ Configuração de contextos carregada'));
        console.log(chalk.gray(`📋 Contextos universais: ${Object.keys(this.config.universal.contexts).length}`));
        console.log(chalk.gray(`📋 Projetos: ${Object.keys(this.config.projects).length}`));
      }
    } catch (error) {
      if (this.debug) {
        console.error(chalk.red('❌ Erro ao carregar configuração de contextos:'), error);
      }
      throw error;
    }
  }

  async activateProject(projectId: string): Promise<void> {
    const project = this.config.projects[projectId];
    if (!project) {
      throw new Error(`Projeto não encontrado: ${projectId}`);
    }

    this.activeProject = project;
    this.config.active_project = projectId;

    if (this.debug) {
      console.log(chalk.blue(`🔄 Ativando projeto: ${project.name}`));
      console.log(chalk.gray(`📚 Herdando contextos: ${project.inherits.join(', ')}`));
    }

    // Salvar configuração atualizada
    await this.saveConfig();
  }

  async createUniversalContext(context: UniversalContext): Promise<void> {
    if (this.config.universal.contexts[context.id]) {
      throw new Error(`Contexto universal já existe: ${context.id}`);
    }

    this.config.universal.contexts[context.id] = context;

    if (this.debug) {
      console.log(chalk.green(`✅ Contexto universal criado: ${context.name}`));
    }

    await this.saveConfig();
  }

  async createProjectContext(context: ProjectContext): Promise<void> {
    if (this.config.projects[context.id]) {
      throw new Error(`Projeto já existe: ${context.id}`);
    }

    // Validar contextos universais herdados
    for (const inheritId of context.inherits) {
      if (!this.config.universal.contexts[inheritId]) {
        throw new Error(`Contexto universal não encontrado: ${inheritId}`);
      }
    }

    this.config.projects[context.id] = context;

    if (this.debug) {
      console.log(chalk.green(`✅ Projeto criado: ${context.name}`));
    }

    await this.saveConfig();
  }

  async getActiveContext(): Promise<{
    universal: UniversalContext[];
    project?: ProjectContext;
  }> {
    const universalContexts = this.activeProject?.inherits.map(id => 
      this.config.universal.contexts[id]
    ).filter(Boolean) || [];

    return {
      universal: universalContexts,
      project: this.activeProject
    };
  }

  async getAvailablePlugins(): Promise<Plugin[]> {
    const { universal, project } = await this.getActiveContext();
    
    // Plugins universais dos contextos herdados
    const universalPlugins = universal.flatMap(ctx => 
      this.config.universal.plugins.filter(p => ctx.tools.includes(p.id))
    );

    // Plugins específicos do projeto
    const projectPlugins = project?.plugins
      .map(id => this.config.universal.plugins.find(p => p.id === id))
      .filter((p): p is Plugin => p !== undefined) || [];

    // Remover duplicatas
    const allPlugins = [...universalPlugins, ...projectPlugins];
    const uniquePlugins = Array.from(
      new Map(allPlugins.map(p => [p.id, p])).values()
    );

    if (this.debug) {
      console.log(chalk.blue(`📦 Plugins disponíveis: ${uniquePlugins.length}`));
    }

    return uniquePlugins;
  }

  async getTemplates(language: SupportedLanguage): Promise<string[]> {
    const { universal } = await this.getActiveContext();
    
    // Templates dos contextos universais para a linguagem
    const templates = universal
      .filter(ctx => ctx.language === language)
      .flatMap(ctx => ctx.templates);

    if (this.debug) {
      console.log(chalk.blue(`📝 Templates ${language}: ${templates.length}`));
    }

    return templates;
  }

  private async saveConfig(): Promise<void> {
    try {
      await fs.writeFile(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );
    } catch (error) {
      if (this.debug) {
        console.error(chalk.red('❌ Erro ao salvar configuração:'), error);
      }
      throw error;
    }
  }
} 