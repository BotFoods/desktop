/**
 * WhatsApp Service - Interface para controlar WhatsApp via service
 */
class WhatsAppService {
    constructor() {
        this.serviceUrl = 'http://localhost:3000';
        this.isServiceRunning = false;
        this.currentStatus = {
            state: 'disconnected',
            qrCode: null,
            isConnected: false,
            hasQRCode: false,
            timestamp: null
        };
        this.pollInterval = null;
        this.listeners = new Set();
    }

    /**
     * Adiciona listener para mudanças de estado
     */
    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notifica todos os listeners sobre mudança de estado
     */
    notifyListeners(status) {
        this.listeners.forEach(listener => {
            try {
                listener(status);
            } catch (error) {
                // Ignora erros em listeners
            }
        });
    }

    /**
     * Verifica se o service está rodando
     */
    async checkServiceStatus() {
        try {
            const response = await fetch(`${this.serviceUrl}/api/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                this.isServiceRunning = true;
                return { available: true };
            }
            
            this.isServiceRunning = false;
            return { available: false, error: 'Service não respondeu' };
            
        } catch (error) {
            this.isServiceRunning = false;
            return { available: false, error: error.message };
        }
    }

    /**
     * Obtém status atual do WhatsApp
     */
    async getStatus() {
        try {
            if (!this.isServiceRunning) {
                const serviceCheck = await this.checkServiceStatus();
                if (!serviceCheck.available) {
                    return {
                        success: false,
                        error: 'Serviço não disponível',
                        status: { state: 'service_offline', isConnected: false }
                    };
                }
            }

            const response = await fetch(`${this.serviceUrl}/api/whatsapp/status`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(8000)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.currentStatus = data.status || data;
            
            return {
                success: true,
                status: this.currentStatus
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: { state: 'error', isConnected: false }
            };
        }
    }

    /**
     * Conecta ao WhatsApp
     */
    async connect(lojaId) {
        try {
            const body = {};
            if (lojaId) {
                body.loja_id = lojaId;
            }

            const response = await fetch(`${this.serviceUrl}/api/whatsapp/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(15000)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Inicia polling para acompanhar status
            this.startPolling();
            
            return {
                success: true,
                message: data.message || 'Conexão iniciada',
                status: data.status
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Desconecta do WhatsApp
     */
    async disconnect(lojaId) {
        try {
            // Para polling primeiro
            this.stopPolling();
            
            const body = {};
            if (lojaId) {
                body.loja_id = lojaId;
            }
            
            const response = await fetch(`${this.serviceUrl}/api/whatsapp/disconnect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            this.currentStatus = {
                state: 'disconnected',
                qrCode: null,
                isConnected: false,
                hasQRCode: false,
                timestamp: new Date()
            };
            
            this.notifyListeners(this.currentStatus);
            
            return {
                success: true,
                message: data.message || 'Desconectado com sucesso'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Limpa sessão (logout)
     */
    async clearSession(lojaId) {
        try {
            this.stopPolling();
            
            const body = {};
            if (lojaId) {
                body.loja_id = lojaId;
            }
            
            const response = await fetch(`${this.serviceUrl}/api/whatsapp/clear-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            this.currentStatus = {
                state: 'disconnected',
                qrCode: null,
                isConnected: false,
                hasQRCode: false,
                timestamp: new Date()
            };
            
            this.notifyListeners(this.currentStatus);
            
            return {
                success: true,
                message: data.message || 'Sessão limpa com sucesso'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Pausa/resume a conexão (simulado via disconnect/connect)
     */
    async pause() {
        return await this.disconnect();
    }

    async resume() {
        return await this.connect();
    }

    /**
     * Inicia polling para monitorar status
     */
    startPolling(interval = 3000) {
        if (this.pollInterval) {
            return; // Já está rodando
        }
        
        this.pollInterval = setInterval(async () => {
            try {
                const result = await this.getStatus();
                if (result.success && result.status) {
                    // Sempre atualiza para garantir sincronização perfeita
                    this.currentStatus = result.status;
                    this.notifyListeners(this.currentStatus);
                    
                    // Reset consecutive errors on successful update
                    this.consecutiveErrors = 0;
                    
                    // Para o polling se desconectado
                    if (result.status.state === 'disconnected') {
                        this.stopPolling();
                    }
                } else {
                    // Em caso de erro no polling, tenta mais uma vez
                    // Se erro persistir, para para evitar spam
                    if (this.consecutiveErrors >= 3) {
                        this.stopPolling();
                        this.consecutiveErrors = 0;
                    } else {
                        this.consecutiveErrors = (this.consecutiveErrors || 0) + 1;
                    }
                }
            } catch (error) {
                this.consecutiveErrors = (this.consecutiveErrors || 0) + 1;
                if (this.consecutiveErrors >= 3) {
                    this.stopPolling();
                    this.consecutiveErrors = 0;
                }
            }
        }, interval);
    }

    /**
     * Para polling
     */
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    /**
     * Envia mensagem (para expansão futura)
     */
    async sendMessage(number, message, lojaId) {
        try {
            const body = { number, message };
            if (lojaId) {
                body.loja_id = lojaId;
            }

            const response = await fetch(`${this.serviceUrl}/api/whatsapp/send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                message: data.message || 'Mensagem enviada'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Configura auto-reply
     */
    async configureAutoReply(enabled, lojaId) {
        try {
            const body = { 
                enabled,
                storeId: lojaId,
                linkPreviewEnabled: true
            };
            if (lojaId) {
                body.loja_id = lojaId;
            }

            const response = await fetch(`${this.serviceUrl}/api/whatsapp/auto-reply/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                message: data.message || 'Configuração atualizada',
                settings: data.settings
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtém estatísticas do auto-reply
     */
    async getAutoReplyStats() {
        try {
            const response = await fetch(`${this.serviceUrl}/api/whatsapp/auto-reply/stats`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                stats: data.stats
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                stats: {
                    autoReplyEnabled: false,
                    messagesSent: 0,
                    lastMessageTime: null,
                    loja_id: null,
                    isConnected: false
                }
            };
        }
    }

    /**
     * Limpa recursos ao destruir
     */
    destroy() {
        this.stopPolling();
        this.listeners.clear();
    }
}

// Instância singleton
const whatsappService = new WhatsAppService();

export default whatsappService;
