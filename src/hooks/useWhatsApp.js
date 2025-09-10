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
            setError(error.message);
            setServiceAvailable(false);
            return false;
        }
    }, []);

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
            setError(error.message);
            whatsappService.stopPolling();
        } finally {
            setLoading(false);
        }
    }, [checkService]);

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
            setError(error.message);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

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
            setError(error.message);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

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
            setError(error.message);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

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
            setError(error.message);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    // Obter estatísticas
    const getAutoReplyStats = useCallback(async () => {
        try {
            const result = await whatsappService.getAutoReplyStats();
            return result;
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
        refreshStatus
    };
};

export default useWhatsApp;
