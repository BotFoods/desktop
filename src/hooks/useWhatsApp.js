import { useState, useEffect, useCallback } from 'react';
import whatsappService from '../services/whatsappService';

/**
 * Hook para gerenciar estado do WhatsApp
 */
const useWhatsApp = () => {
    const [status, setStatus] = useState({
        state: 'disconnected',
        qrCode: null,
        isConnected: false,
        hasQRCode: false,
        timestamp: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [serviceAvailable, setServiceAvailable] = useState(false);

    // Função para verificar se o erro indica serviço offline
    const isServiceOfflineError = (error) => {
        const errorMessage = error?.message?.toLowerCase() || '';
        return errorMessage.includes('failed to fetch') || 
               errorMessage.includes('network error') ||
               errorMessage.includes('connection refused') ||
               errorMessage.includes('econnrefused') ||
               error?.code === 'NETWORK_ERROR';
    };

    // Função para verificar health do serviço
    const checkServiceHealth = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3000/api/health', {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }, []);

    // Função para tratar erros com verificação de serviço
    const handleErrorWithServiceCheck = useCallback(async (error) => {
        // Se o erro parece ser de conectividade, verificar se o serviço está rodando
        if (isServiceOfflineError(error)) {
            const isHealthy = await checkServiceHealth();
            if (!isHealthy) {
                setServiceAvailable(false);
                setError('Serviço WhatsApp está offline. Verifique se o serviço está rodando.');
                return false;
            }
        }
        
        // Se chegou até aqui, é um erro diferente
        setError(error.message);
        return true;
    }, [checkServiceHealth]);

    // Função para verificar status do service
    const checkService = useCallback(async () => {
        try {
            const serviceCheck = await whatsappService.checkServiceStatus();
            setServiceAvailable(serviceCheck.available);
            
            if (!serviceCheck.available) {
                setError('Serviço WhatsApp não disponível');
                return false;
            }
            
            setError(null);
            return true;
        } catch (error) {
            await handleErrorWithServiceCheck(error);
            setServiceAvailable(false);
            return false;
        }
    }, [handleErrorWithServiceCheck]);

    // Função para atualizar status
    const refreshStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const isServiceOk = await checkService();
            if (!isServiceOk) return;
            
            const result = await whatsappService.getStatus();
            if (result.success) {
                setStatus(result.status);
                
                // Inicia polling automaticamente se necessário
                if (['connecting', 'qr_ready', 'connected'].includes(result.status.state)) {
                    whatsappService.startPolling();
                } else {
                    whatsappService.stopPolling();
                }
            } else {
                setError(result.error);
                whatsappService.stopPolling();
            }
            
        } catch (error) {
            await handleErrorWithServiceCheck(error);
            whatsappService.stopPolling();
        } finally {
            setLoading(false);
        }
    }, [checkService, handleErrorWithServiceCheck]);

    // Conectar
    const connect = useCallback(async (lojaId) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await whatsappService.connect(lojaId);
            
            if (result.success) {
                if (result.status) {
                    setStatus(result.status);
                }
                return { success: true, message: result.message };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }
            
        } catch (error) {
            const shouldContinue = await handleErrorWithServiceCheck(error);
            if (!shouldContinue) {
                return { success: false, error: error.message };
            }
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, [handleErrorWithServiceCheck]);

    // Desconectar
    const disconnect = useCallback(async (lojaId) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await whatsappService.disconnect(lojaId);
            
            if (result.success) {
                setStatus({
                    state: 'disconnected',
                    qrCode: null,
                    isConnected: false,
                    hasQRCode: false,
                    timestamp: new Date()
                });
                return { success: true, message: result.message };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }
            
        } catch (error) {
            const shouldContinue = await handleErrorWithServiceCheck(error);
            if (!shouldContinue) {
                return { success: false, error: error.message };
            }
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, [handleErrorWithServiceCheck]);

    // Limpar sessão
    // Limpar sessão
    const clearSession = useCallback(async (lojaId) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await whatsappService.clearSession(lojaId);
            
            if (result.success) {
                setStatus({
                    state: 'disconnected',
                    qrCode: null,
                    isConnected: false,
                    hasQRCode: false,
                    timestamp: new Date()
                });
                return { success: true, message: result.message };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }
            
        } catch (error) {
            const shouldContinue = await handleErrorWithServiceCheck(error);
            if (!shouldContinue) {
                return { success: false, error: error.message };
            }
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, [handleErrorWithServiceCheck]);

    // Configurar auto-reply
    const configureAutoReply = useCallback(async (enabled, lojaId) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await whatsappService.configureAutoReply(enabled, lojaId);
            
            if (result.success) {
                return { success: true, message: result.message, settings: result.settings };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }
            
        } catch (error) {
            const shouldContinue = await handleErrorWithServiceCheck(error);
            if (!shouldContinue) {
                return { success: false, error: error.message };
            }
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, [handleErrorWithServiceCheck]);

    // Obter estatísticas
    const getAutoReplyStats = useCallback(async () => {
        try {
            const result = await whatsappService.getAutoReplyStats();
            return result;
        } catch (error) {
            await handleErrorWithServiceCheck(error);
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
    }, [handleErrorWithServiceCheck]);

    // Função para limpar erros
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Listener para mudanças de status via service
    useEffect(() => {
        const unsubscribe = whatsappService.addListener((newStatus) => {
            setStatus(newStatus);
        });

        // Verificar status inicial
        refreshStatus();

        return () => {
            unsubscribe();
            whatsappService.stopPolling();
        };
    }, [refreshStatus]);

    // Propriedades derivadas do status
    const isConnected = status?.isConnected || false;
    const hasQRCode = status?.hasQRCode || false;
    const qrCode = status?.qrCode || null;
    const state = status?.state || 'disconnected';

    return {
        // Estados
        status,
        loading,
        error,
        serviceAvailable,
        
        // Estados derivados
        isConnected,
        hasQRCode,
        qrCode,
        state,
        
        // Ações
        connect,
        disconnect,
        clearSession,
        configureAutoReply,
        getAutoReplyStats,
        refreshStatus,
        clearError
    };
};

export default useWhatsApp;
