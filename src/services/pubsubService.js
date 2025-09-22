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
    this.processedNotifications = new Set(); // Cache para evitar duplicatas
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
        // Processar cada notificação
        data.notifications.forEach(notification => {
          this.processNotification(notification);
        });
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
      // Criar chave única para a notificação
      const notificationKey = `${notification.pedido?.id_venda}_${notification.timestamp}`;
      
      // Verificar se já foi processada
      if (this.processedNotifications.has(notificationKey)) {
        console.log(`Notificação ${notificationKey} já foi processada, ignorando`);
        return;
      }
      
      // Marcar como processada
      this.processedNotifications.add(notificationKey);
      
      // Log temporário para debug da notificação
      console.log('Notificação recebida:', notification);
      
      // Adicionar pedido à fila de delivery automaticamente
      this.addToDeliveryQueue(notification.pedido);
      
      // Notificar todos os handlers registrados
      console.log(`Notificando ${this.messageHandlers.length} handlers registrados`);
      this.messageHandlers.forEach((handler, index) => {
        try {
          console.log(`Executando handler ${index + 1}`);
          handler(notification.pedido);
        } catch (error) {
          console.error(`Erro no handler ${index + 1}:`, error);
        }
      });
      
      // Limpar notificações antigas do cache (manter apenas 100 mais recentes)
      if (this.processedNotifications.size > 100) {
        const notificationsArray = Array.from(this.processedNotifications);
        const toKeep = notificationsArray.slice(-50); // Manter as 50 mais recentes
        this.processedNotifications.clear();
        toKeep.forEach(key => this.processedNotifications.add(key));
      }
    } catch (error) {
      console.error('Erro ao processar notificação:', error);
    }
  }

  /**
   * Adiciona o pedido recebido à fila de delivery
   */
  addToDeliveryQueue(pedido) {
    try {
      // Log temporário para debug
      console.log('Dados do pedido recebido:', pedido);
      console.log('dados_cliente:', pedido.dados_cliente);
      console.log('produtos:', pedido.produtos);
      
      const DELIVERY_ORDERS_STORAGE_KEY = 'pdv_delivery_aguardando';
      
      // Buscar pedidos existentes
      const existingOrders = JSON.parse(localStorage.getItem(DELIVERY_ORDERS_STORAGE_KEY) || '[]');
      
      // Verificar se o pedido já existe (evitar duplicatas)
      const pedidoExiste = existingOrders.some(order => order.id === pedido.id_venda);
      if (pedidoExiste) {
        console.log(`Pedido ${pedido.id_venda} já existe na fila de delivery`);
        return;
      }

      // Processar itens para garantir estrutura correta
      let processedItems = [];
      const rawItems = pedido.produtos || [];
      
      if (Array.isArray(rawItems)) {
        processedItems = rawItems.map((item) => ({
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
      }
      
      // Construir endereço completo
      const enderecoCompleto = pedido.dados_cliente?.endereco ? 
        `${pedido.dados_cliente.endereco.rua}, ${pedido.dados_cliente.endereco.numero} - ${pedido.dados_cliente.endereco.bairro}, ${pedido.dados_cliente.endereco.cidade}/${pedido.dados_cliente.endereco.estado}` :
        'Endereço não informado';
      
      const deliveryOrder = {
        id: pedido.id_venda?.toString() || `pedido_${Date.now()}`,
        customer: {
          nome: pedido.dados_cliente?.nome || 'Cliente não identificado',
          name: pedido.dados_cliente?.nome || 'Cliente não identificado',
          telefone: pedido.dados_cliente?.telefone || '',
          phone: pedido.dados_cliente?.telefone || '',
          endereco: enderecoCompleto,
          address: enderecoCompleto
        },
        items: processedItems,
        itemCount: processedItems.length,
        total: parseFloat(pedido.total_venda || 0),
        totalAmount: parseFloat(pedido.total_venda || 0),
        status: 'aguardando_confirmacao',
        source: 'cardapio',
        created_at: pedido.timestamp || new Date().toISOString(),
        timestamp: pedido.timestamp || new Date().toISOString(),
        payment_method: pedido.pagamento?.tipo || 'N/A',
        description: pedido.observacoes || 'Pedido via cardápio online',
        observacoes: pedido.observacoes || '',
        // Campos adicionais para compatibilidade
        delivery_fee: 0,
        estimated_time: '30-45 min',
        loja_id: pedido.loja_id,
        tipo: pedido.tipo || 'ONLINE_CARDAPIO',
        status_venda: pedido.status_venda || 'PENDENTE'
      };

      // Adicionar o novo pedido
      const updatedOrders = [...existingOrders, deliveryOrder];
      
      // Salvar no localStorage
      localStorage.setItem(DELIVERY_ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
      
      // Disparar evento para atualizar a interface
      const event = new Event('delivery-orders-updated');
      window.dispatchEvent(event);
      
      console.log(`Pedido ${pedido.id_venda} adicionado à fila de delivery`);
      
    } catch (error) {
      console.error('Erro ao adicionar pedido à fila de delivery:', error);
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
   * Remove todos os handlers
   */
  clearMessageHandlers() {
    console.log(`Limpando ${this.messageHandlers.length} handlers existentes`);
    this.messageHandlers = [];
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