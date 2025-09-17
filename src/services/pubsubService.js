// desktop/src/services/pubsubService.js
// Serviço para comunicação com o service via polling HTTP

class PubSubService {
  constructor() {
    this.isListening = false;
    this.messageHandlers = [];
    this.pollingInterval = null;
    this.pollingFrequency = 8000; // 8 segundos
    this.filaPedidos = null;
    this.serviceUrl = 'http://localhost:3000'; // URL do service
    this.userData = null; // Armazenar dados completos do usuário
    this.sessionId = null; // ID da sessão retornado pelo service
  }

  /**
   * Inicia a escuta da fila de pedidos via polling
   * @param {string} filaPedidos - Nome da fila (ex: pedidos-desktop-loja-123)
   * @param {Object} userData - Dados completos do usuário (incluindo permissões)
   */
  async startListening(filaPedidos, userData = null) {
    if (this.isListening && this.filaPedidos === filaPedidos) {
      console.log(`Já está fazendo polling da fila: ${filaPedidos}`);
      return;
    }

    try {
      // Para polling anterior se existir
      if (this.pollingInterval) {
        await this.stopListening();
      }

      this.filaPedidos = filaPedidos;
      this.userData = userData;

      // Inscrever o service na fila
      await this.subscribeServiceToQueue(filaPedidos, userData);

      // Iniciar polling
      this.startPolling();
      
      console.log(`Iniciado polling da fila: ${filaPedidos} a cada ${this.pollingFrequency}ms`);
      if (userData) {
        console.log(`Usuário configurado: ${userData.nome} (ID: ${userData.id}) da loja ${userData.loja_id}`);
        console.log(`Sessão: ${this.sessionId}`);
      }
    } catch (error) {
      console.error('Erro ao iniciar escuta:', error);
      throw error;
    }
  }

  /**
   * Inscreve o service na fila do Pub/Sub
   */
  async subscribeServiceToQueue(filaPedidos, userData) {
    try {
      const requestBody = {
        fila_pedidos: filaPedidos,
        user_data: userData // Enviar dados completos do usuário
      };

      const response = await fetch(`${this.serviceUrl}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erro ao inscrever service na fila: ${response.status} - ${errorData.message || 'Erro desconhecido'}`);
      }

      const data = await response.json();
      
      // Armazenar o session_id retornado
      this.sessionId = data.session_id;
      
      console.log('Service inscrito com sucesso:', data.message);
      console.log('Session ID:', this.sessionId);
    } catch (error) {
      console.error('Erro ao inscrever service:', error);
      throw error;
    }
  }

  /**
   * Inicia o polling para verificar notificações
   */
  startPolling() {
    this.isListening = true;
    
    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollForNotifications();
      } catch (error) {
        console.error('Erro no polling:', error);
        // Continua o polling mesmo com erro
      }
    }, this.pollingFrequency);

    // Fazer primeira consulta imediatamente
    this.pollForNotifications().catch(error => {
      console.error('Erro na primeira consulta:', error);
    });
  }

  /**
   * Consulta o service por notificações pendentes
   */
  async pollForNotifications() {
    try {
      // Usar session_id ao invés de parâmetros individuais
      let url = `${this.serviceUrl}/notifications/poll`;
      if (this.sessionId) {
        const params = new URLSearchParams({
          session_id: this.sessionId
        });
        url += `?${params}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        // Se a sessão expirou, parar o polling
        if (response.status === 401) {
          console.warn('Sessão expirada, parando polling');
          await this.stopListening();
          return;
        }
        throw new Error(`Erro no polling: ${response.status}`);
      }

      const data = await response.json();
      
      // Verificar se tem permissão negada
      if (data.permission_denied) {
        console.warn('Permissão negada para receber pedidos online:', data.message);
        // Continuar polling mas não processar notificações
        return;
      }
      
      if (data.success && data.notifications && data.notifications.length > 0) {
        console.log(`Recebidas ${data.notifications.length} notificações do service`);
        
        // Processar cada notificação
        data.notifications.forEach(notification => {
          this.processNotification(notification);
        });
      }

      // Log de debug ocasional (a cada 10 consultas)
      if (Math.random() < 0.1) {
        console.log('Polling status:', data.status);
        if (data.user_session) {
          console.log('User session:', data.user_session);
        }
      }
    } catch (error) {
      console.error('Erro ao consultar notificações:', error);
      // Não fazer throw para não parar o polling
    }
  }

  /**
   * Processa uma notificação recebida
   */
  processNotification(notification) {
    try {
      console.log('Processando notificação:', notification.pedido.id_venda);
      
      // Notificar todos os handlers registrados
      this.messageHandlers.forEach(handler => {
        try {
          handler(notification.pedido);
        } catch (error) {
          console.error('Erro no handler de notificação:', error);
        }
      });
    } catch (error) {
      console.error('Erro ao processar notificação:', error);
    }
  }

  /**
   * Para a escuta da fila
   */
  async stopListening() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.isListening = false;
    
    // Desconectar sessão específica no service
    if (this.sessionId) {
      try {
        await fetch(`${this.serviceUrl}/notifications/disconnect`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: this.sessionId
          })
        });
        console.log('Sessão desconectada do service');
      } catch (error) {
        console.error('Erro ao desconectar sessão do service:', error);
      }
    }

    this.filaPedidos = null;
    this.sessionId = null;
    this.userData = null;
    console.log('Polling interrompido');
  }

  /**
   * Registra um handler para processar mensagens recebidas
   * @param {Function} handler - Função que será chamada quando uma mensagem for recebida
   */
  addMessageHandler(handler) {
    if (typeof handler === 'function') {
      this.messageHandlers.push(handler);
    }
  }

  /**
   * Remove um handler
   * @param {Function} handler - Handler a ser removido
   */
  removeMessageHandler(handler) {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  /**
   * Verifica se está escutando
   */
  getIsListening() {
    return this.isListening;
  }

  /**
   * Obtém status do service
   */
  async getServiceStatus() {
    try {
      const response = await fetch(`${this.serviceUrl}/notifications/status`);
      if (response.ok) {
        const data = await response.json();
        return data.status;
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter status do service:', error);
      return null;
    }
  }
}

// Exportar uma instância singleton
export default new PubSubService();