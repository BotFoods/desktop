// desktop/src/services/notificationPollingService.js
// Serviço simples para polling de notificações do BotFood Service

class NotificationPollingService {
  constructor() {
    this.isListening = false;
    this.messageHandlers = [];
    this.pollingInterval = null;
    this.pollingFrequency = 8000; // 8 segundos
    this.serviceUrl = 'http://localhost:3000';
    this.sessionId = null;
    this.processedNotifications = new Set();
  }

  /**
   * Inicia polling de notificações
   * @param {string} filaPedidos - Nome da fila
   * @param {Object} userData - Dados do usuário
   */
  async startListening(filaPedidos, userData) {
    if (this.isListening) {
      return;
    }

    try {
      // Registrar sessão no service
      const response = await fetch(`${this.serviceUrl}/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fila_pedidos: filaPedidos,
          user_data: userData  // ✅ Enviar como user_data (objeto completo)
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao registrar sessão no service');
      }

      const data = await response.json();
      this.sessionId = data.session_id;

      if (!this.sessionId) {
        throw new Error('Service não retornou session_id');
      }

      this.isListening = true;
      this.startPolling();
    } catch (error) {
      console.error('[Polling] Erro ao iniciar:', error.message);
      this.isListening = false;
      throw error;
    }
  }

  startPolling() {
    if (!this.sessionId) {
      console.error('[Polling] session_id não definido');
      return;
    }

    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollForNotifications();
      } catch (error) {
        console.error('[Polling] Erro no polling:', error.message);
      }
    }, this.pollingFrequency);

    // Primeira consulta imediata
    this.pollForNotifications().catch(error => {
      console.error('[Polling] Erro na primeira consulta:', error.message);
    });
  }

  async pollForNotifications() {
    if (!this.sessionId) {
      return;
    }

    try {
      const url = `${this.serviceUrl}/notifications/poll?session_id=${this.sessionId}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401) {
          console.error('[Polling] Sessão expirada');
          await this.stopListening();
          return;
        }
        return;
      }

      const data = await response.json();

      if (data.success && data.notifications && data.notifications.length > 0) {
        data.notifications.forEach(notification => {
          this.processNotification(notification);
        });
      }
    } catch (error) {
      console.error('[Polling] Erro ao consultar:', error.message);
    }
  }

  processNotification(notification) {
    try {
      console.log('[🔔 Polling] Nova notificação recebida:', {
        id_venda: notification.pedido?.id_venda,
        timestamp: notification.timestamp,
        source: 'notificationPollingService'
      });
      
      const notificationKey = `${notification.pedido?.id_venda}_${notification.timestamp}`;
      
      if (this.processedNotifications.has(notificationKey)) {
        console.log('[⚠️ Polling] Notificação duplicada detectada:', notificationKey);
        return;
      }
      
      this.processedNotifications.add(notificationKey);
      console.log('[✅ Polling] Processando notificação:', notificationKey);
      
      // Adicionar à fila de delivery (passando notification completo)
      this.addToDeliveryQueue(notification.pedido, notification);
      
      // Notificar handlers
      console.log(`[📢 Polling] Despachando para ${this.messageHandlers.length} handler(s)`);
      this.messageHandlers.forEach(handler => {
        try {
          handler(notification.pedido);
        } catch (error) {
          console.error('[Polling] Erro no handler:', error.message);
        }
      });
      
      // Limpar cache antigo
      if (this.processedNotifications.size > 100) {
        const notificationsArray = Array.from(this.processedNotifications);
        const toKeep = notificationsArray.slice(-50);
        this.processedNotifications.clear();
        toKeep.forEach(key => this.processedNotifications.add(key));
      }
    } catch (error) {
      console.error('[Polling] Erro ao processar notificação:', error.message);
    }
  }

  addToDeliveryQueue(pedido, notification) {
    (async () => {
      try {
        const STORAGE_KEY = 'pdv_delivery_aguardando';
        const existingOrders = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        if (existingOrders.some(order => order.id === pedido.id_venda)) {
          return;
        }

        const processedItems = (pedido.produtos || []).map(item => ({
          id: item.produto_id || item.id || Math.random().toString(36).substr(2, 9),
          nome: item.nome || 'Produto sem nome',
          name: item.nome || 'Produto sem nome',
          quantidade: parseInt(item.quantidade || 1),
          quantity: parseInt(item.quantidade || 1),
          preco: parseFloat(item.preco_unitario || 0),
          price: parseFloat(item.preco_unitario || 0),
          subtotal: parseFloat(item.preco_unitario || 0) * parseInt(item.quantidade || 1),
          observacoes: item.observacoes || '',
          categoria: item.categoria || ''
        }));
        
        const enderecoCompleto = pedido.dados_cliente?.endereco ? 
          `${pedido.dados_cliente.endereco.rua}, ${pedido.dados_cliente.endereco.numero} - ${pedido.dados_cliente.endereco.bairro}, ${pedido.dados_cliente.endereco.cidade}/${pedido.dados_cliente.endereco.estado}` :
          'Endereço não informado';
      
      const deliveryOrder = {
        id: pedido.id_venda?.toString() || `pedido_${Date.now()}`,
        comando_id: pedido.comando_id || null,
        customer: {
          nome: pedido.dados_cliente?.nome || 'Cliente',
          name: pedido.dados_cliente?.nome || 'Cliente',
          telefone: pedido.dados_cliente?.telefone || '',
          phone: pedido.dados_cliente?.telefone || '',
          endereco: enderecoCompleto,
          address: enderecoCompleto
        },
        items: processedItems,
        produtos: processedItems,
        itemCount: processedItems.length,
        total: parseFloat(pedido.total_venda || 0),
        totalAmount: parseFloat(pedido.total_venda || 0),
        observacoes: pedido.observacoes || '',
        notes: pedido.observacoes || '',
        timestamp: pedido.data_pedido || new Date().toISOString(),
        status: 'aguardando_confirmacao',  // ✅ SEMPRE começar com aguardando_confirmacao
        source: 'cardapio',
        tipo: pedido.tipo || 'ONLINE_CARDAPIO',
        status_venda: pedido.status_venda || 'PENDENTE'
      };

      const updatedOrders = [...existingOrders, deliveryOrder];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      
      // ✅ Confirmar salvamento ao service (ACK)
      await this.acknowledgeNotification(pedido.id_venda, notification?.id);
      
      const event = new Event('delivery-orders-updated');
      window.dispatchEvent(event);
      } catch (error) {
        console.error('[Polling] Erro ao adicionar pedido:', error.message);
      }
    })();
  }

  /**
   * Envia confirmação (ACK) ao service que o pedido foi salvo com sucesso
   */
  async acknowledgeNotification(pedidoId, messageId) {
    if (!this.sessionId) return;

    try {
      await fetch(`${this.serviceUrl}/notifications/ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          pedido_id: pedidoId,
          message_id: messageId
        })
      });
    } catch (error) {
      console.error('[Polling] Erro ao enviar ACK:', error.message);
      // Não fazer throw - ACK é opcional
    }
  }

  async stopListening() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.isListening = false;
    
    if (this.sessionId) {
      try {
        await fetch(`${this.serviceUrl}/notifications/disconnect`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: this.sessionId })
        });
      } catch (error) {
        console.error('[Polling] Erro ao desconectar:', error.message);
      }
    }

    this.sessionId = null;
  }

  addMessageHandler(handler) {
    if (typeof handler === 'function') {
      console.log('[📝 Polling] Novo handler registrado. Total:', this.messageHandlers.length + 1);
      this.messageHandlers.push(handler);
    }
  }

  removeMessageHandler(handler) {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      console.log('[🗑️ Polling] Handler removido. Total restante:', this.messageHandlers.length - 1);
      this.messageHandlers.splice(index, 1);
    }
  }

  clearMessageHandlers() {
    console.log('[🧹 Polling] Limpando todos os handlers. Total antes da limpeza:', this.messageHandlers.length);
    this.messageHandlers = [];
  }

  getIsListening() {
    return this.isListening;
  }
}

// Exportar instância singleton
const notificationPollingService = new NotificationPollingService();
export default notificationPollingService;
