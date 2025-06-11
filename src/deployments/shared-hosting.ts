export const sharedHostingConfig = {
  // Core MCP em Node.js (VPS simples)
  core: {
    host: 'seu-vps.com',
    port: 3000,
    transport: 'sse'
  },
  
  // Plugins PHP na hospedagem compartilhada do cliente
  phpPlugins: {
    host: 'cliente.hospedagem.com.br',
    endpoints: [
      '/mcp-cms.php',
      '/mcp-ecommerce.php',
      '/mcp-analytics.php'
    ]
  },
  
  // Cache/Performance em Go (container leve)
  goServices: {
    host: 'cache-service.com',
    docker: 'ghcr.io/seu-usuario/mcp-go-perf:latest'
  }
}; 