#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

program
  .name('install-plugin')
  .description('Instala um plugin MCP')
  .argument('[plugin-name]', 'Nome do plugin')
  .option('-l, --language <lang>', 'Linguagem do plugin (ts|py|php|go)')
  .option('-s, --source <source>', 'Fonte do plugin (local|git|npm)')
  .action(async (pluginName, options) => {
    const spinner = ora('Instalando plugin...').start();
    
    try {
      if (!pluginName) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Nome do plugin:',
            validate: (input) => input.length > 0
          },
          {
            type: 'list',
            name: 'language',
            message: 'Linguagem:',
            choices: ['typescript', 'python', 'php', 'go']
          },
          {
            type: 'list',
            name: 'source',
            message: 'Fonte:',
            choices: ['template', 'git', 'npm']
          }
        ]);
        
        pluginName = answers.name;
        options.language = answers.language;
        options.source = answers.source;
      }
      
      await installPlugin(pluginName, options);
      spinner.succeed(chalk.green(`Plugin ${pluginName} instalado com sucesso!`));
      
    } catch (error) {
      spinner.fail(chalk.red(`Erro ao instalar plugin: ${error.message}`));
      process.exit(1);
    }
  });

async function installPlugin(name, options) {
  const pluginsDir = path.join(process.cwd(), 'plugins', options.language);
  await fs.mkdir(pluginsDir, { recursive: true });
  
  const pluginPath = path.join(pluginsDir, name);
  
  if (options.source === 'template') {
    await createFromTemplate(name, options.language, pluginPath);
  }
  
  // Atualizar registro de plugins
  await updatePluginRegistry(name, options.language);
}

async function createFromTemplate(name, language, pluginPath) {
  const templatePath = path.join(process.cwd(), 'plugins', 'templates', language);
  // Copiar template e substituir placeholders
  // Implementação da criação do template
}

async function updatePluginRegistry(name, language) {
  const registryPath = path.join(process.cwd(), 'src', 'config', 'plugins.json');
  const registry = JSON.parse(await fs.readFile(registryPath, 'utf-8'));
  
  registry.plugins.push({
    id: name,
    language: language,
    enabled: true,
    autostart: false
  });
  
  await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));
}

program.parse();
