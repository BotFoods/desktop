/**
 * WhatsApp Orchestrator Service v2
 * 
 * Service para comunicação com a nova arquitetura isolada do WhatsApp
 * API: /api/whatsapp/v2/*
 */

import { apiCall } from './ApiService';

const WHATSAPP_V2_BASE = '/api/whatsapp/v2';

class WhatsAppOrchestratorService {
    /**
     * Lista status de WhatsApp de todas as lojas
     */
    async listAllStatus(token) {
        return await apiCall(`${WHATSAPP_V2_BASE}/list-status`, {
            method: 'GET'
        }, token);
    }

    /**
     * Busca status específico de uma loja
     */
    async getLojaStatus(lojaId, token) {
        return await apiCall(`${WHATSAPP_V2_BASE}/status/${lojaId}`, {
            method: 'GET'
        }, token);
    }

    /**
     * Provisiona infraestrutura WhatsApp para uma loja
     */
    async provisionWhatsApp(lojaId, token) {
        return await apiCall(`${WHATSAPP_V2_BASE}/provision`, {
            method: 'POST',
            body: JSON.stringify({ loja_id: lojaId })
        }, token);
    }

    /**
     * Inicia conexão WhatsApp para uma loja já provisionada
     */
    async startConnection(lojaId, token) {
        return await apiCall(`${WHATSAPP_V2_BASE}/start-connection`, {
            method: 'POST',
            body: JSON.stringify({ loja_id: lojaId })
        }, token);
    }

    /**
     * Verifica se a loja atual do usuário tem WhatsApp provisionado
     */
    async checkCurrentLojaStatus(user, token) {
        if (!user?.loja_id) {
            return {
                success: false,
                message: 'Usuário não possui loja associada'
            };
        }

        return await this.getLojaStatus(user.loja_id, token);
    }

    /**
     * Fluxo completo: provisionar se necessário e iniciar conexão
     */
    async setupWhatsApp(user, token, onProgress = null) {
        try {
            if (!user?.loja_id) {
                throw new Error('Usuário não possui loja associada');
            }

            // 1. Verificar status atual
            onProgress?.('Verificando status atual...');
            const statusResult = await this.getLojaStatus(user.loja_id, token);
            
            if (!statusResult.success) {
                throw new Error(statusResult.message || 'Erro ao verificar status');
            }

            const { status, provisioned } = statusResult.data;

            // 2. Provisionar se necessário
            if (!provisioned || status === 'not_provisioned') {
                onProgress?.('Provisionando infraestrutura WhatsApp...');
                const provisionResult = await this.provisionWhatsApp(user.loja_id, token);
                
                if (!provisionResult.success) {
                    throw new Error(provisionResult.message || 'Erro ao provisionar WhatsApp');
                }

                // Aguardar um pouco para o provisionamento completar
                onProgress?.('Aguardando provisionamento...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            // 3. Iniciar conexão
            onProgress?.('Iniciando conexão WhatsApp...');
            const connectionResult = await this.startConnection(user.loja_id, token);
            
            if (!connectionResult.success) {
                throw new Error(connectionResult.message || 'Erro ao iniciar conexão');
            }

            onProgress?.('Conexão iniciada! Aguarde o QR Code...');
            return connectionResult;

        } catch (error) {
            console.error('Erro no setup do WhatsApp:', error);
            throw error;
        }
    }

    /**
     * Interpreta os status retornados pela API
     */
    getStatusInfo(status) {
        const statusMap = {
            // Status de provisionamento
            'not_provisioned': {
                text: 'Não Provisionado',
                color: 'gray',
                canProvision: true,
                canConnect: false
            },
            'whatsapp_provisioning': {
                text: 'Provisionando...',
                color: 'yellow',
                canProvision: false,
                canConnect: false
            },
            'whatsapp_provisioned': {
                text: 'Provisionado',
                color: 'blue',
                canProvision: false,
                canConnect: true
            },
            'whatsapp_provision_failed': {
                text: 'Falha no Provisionamento',
                color: 'red',
                canProvision: true,
                canConnect: false
            },
            
            // Status de conexão
            'whatsapp_connecting': {
                text: 'Conectando...',
                color: 'yellow',
                canProvision: false,
                canConnect: false
            },
            'whatsapp_qr_ready': {
                text: 'QR Code Pronto',
                color: 'orange',
                canProvision: false,
                canConnect: false
            },
            'whatsapp_authenticated': {
                text: 'Autenticado',
                color: 'green',
                canProvision: false,
                canConnect: false
            },
            'whatsapp_connected': {
                text: 'Conectado',
                color: 'green',
                canProvision: false,
                canConnect: false
            },
            'whatsapp_disconnected': {
                text: 'Desconectado',
                color: 'red',
                canProvision: false,
                canConnect: true
            },
            'whatsapp_auth_failed': {
                text: 'Falha na Autenticação',
                color: 'red',
                canProvision: false,
                canConnect: true
            },
            
            // Status de serviço
            'service_unavailable': {
                text: 'Serviço Indisponível',
                color: 'gray',
                canProvision: true,
                canConnect: false
            }
        };

        return statusMap[status] || {
            text: status || 'Status Desconhecido',
            color: 'gray',
            canProvision: false,
            canConnect: false
        };
    }

    /**
     * Gera cor CSS baseada no status
     */
    getStatusColor(status) {
        const info = this.getStatusInfo(status);
        const colorMap = {
            'gray': '#6b7280',
            'yellow': '#f59e0b',
            'blue': '#3b82f6',
            'red': '#ef4444',
            'green': '#10b981',
            'orange': '#f97316'
        };
        return colorMap[info.color] || colorMap.gray;
    }

    /**
     * Verifica se pode executar uma ação
     */
    canExecuteAction(status, action) {
        const info = this.getStatusInfo(status);
        switch (action) {
            case 'provision':
                return info.canProvision;
            case 'connect':
                return info.canConnect;
            default:
                return false;
        }
    }
}

// Exportar instância singleton
export const whatsappOrchestratorService = new WhatsAppOrchestratorService();
export default whatsappOrchestratorService;
