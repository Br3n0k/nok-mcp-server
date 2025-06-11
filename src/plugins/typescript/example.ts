/**
 * Plugin de exemplo em TypeScript
 * Demonstra o funcionamento básico do sistema de plugins
 */

export const tools = {
  hello_world: async (args: { name?: string } = {}) => {
    const name = args.name || 'Mundo';
    return {
      content: [{
        type: 'text',
        text: `Olá, ${name}! 👋 Este é um exemplo de plugin TypeScript funcionando!`
      }]
    };
  },

  calculate: async (args: { operation: string; a: number; b: number }) => {
    const { operation, a, b } = args;
    
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Os argumentos "a" e "b" devem ser números');
    }

    let result: number;
    let operationSymbol: string;

    switch (operation) {
      case 'add':
        result = a + b;
        operationSymbol = '+';
        break;
      case 'subtract':
        result = a - b;
        operationSymbol = '-';
        break;
      case 'multiply':
        result = a * b;
        operationSymbol = '*';
        break;
      case 'divide':
        if (b === 0) {
          throw new Error('Divisão por zero não é permitida');
        }
        result = a / b;
        operationSymbol = '/';
        break;
      default:
        throw new Error(`Operação não suportada: ${operation}. Use: add, subtract, multiply, divide`);
    }

    return {
      content: [{
        type: 'text',
        text: `Cálculo realizado: ${a} ${operationSymbol} ${b} = ${result}`
      }]
    };
  },

  get_system_info: async () => {
    const info = {
      platform: process.platform,
      nodeVersion: process.version,
      architecture: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    return {
      content: [{
        type: 'text',
        text: `📊 Informações do Sistema:\n${JSON.stringify(info, null, 2)}`
      }]
    };
  },

  generate_uuid: async () => {
    // Gerar UUID simples
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    return {
      content: [{
        type: 'text',
        text: `🆔 UUID gerado: ${uuid}`
      }]
    };
  },

  current_time: async (args: { timezone?: string; format?: string } = {}) => {
    const { timezone = 'America/Sao_Paulo', format = 'iso' } = args;
    
    try {
      const now = new Date();
      let timeString: string;

      if (format === 'iso') {
        timeString = now.toISOString();
      } else if (format === 'locale') {
        timeString = now.toLocaleString('pt-BR', { 
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } else {
        timeString = now.toString();
      }

      return {
        content: [{
          type: 'text',
          text: `🕒 Hora atual (${timezone}): ${timeString}`
        }]
      };
    } catch (error) {
      throw new Error(`Erro ao obter hora atual: ${error.message}`);
    }
  }
};

export const plugin = {
  id: 'example-typescript',
  name: 'Exemplo TypeScript',
  description: 'Plugin de demonstração com ferramentas básicas em TypeScript',
  version: '1.0.0',
  tools
}; 