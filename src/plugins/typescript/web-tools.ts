/**
 * Plugin de ferramentas web em TypeScript
 * @author: @Br3n0k | Brendown Ferreira
 */

import { format } from 'prettier';
import { ESLint } from 'eslint';
import chalk from 'chalk';

export const tools = {
  /**
   * Formata código TypeScript/JavaScript
   */
  async format_code(args: { code: string; options?: any }) {
    try {
      const { code, options = {} } = args;
      const formatted = await format(code, {
        parser: 'typescript',
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 80,
        ...options
      });

      return {
        success: true,
        data: formatted
      };
    } catch (error) {
      console.error(chalk.red('❌ Erro ao formatar código:'), error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  /**
   * Lint código TypeScript/JavaScript
   */
  async lint_code(args: { code: string; options?: any }) {
    try {
      const { code, options = {} } = args;
      const eslint = new ESLint({
        overrideConfig: {
          parser: '@typescript-eslint/parser',
          plugins: ['@typescript-eslint'],
          extends: [
            'eslint:recommended',
            'plugin:@typescript-eslint/recommended'
          ],
          ...options
        }
      });

      const results = await eslint.lintText(code);
      const formatter = await eslint.loadFormatter('stylish');
      const formatted = await formatter.format(results);

      return {
        success: true,
        data: {
          results,
          formatted,
          hasErrors: results.some(r => r.errorCount > 0),
          hasWarnings: results.some(r => r.warningCount > 0)
        }
      };
    } catch (error) {
      console.error(chalk.red('❌ Erro ao lintar código:'), error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}; 