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
    const connect = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await whatsappService.connect();
            
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
    const disconnect = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await whatsappService.disconnect();
            
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

    // Pausar
    const pause = useCallback(async () => {
        return await disconnect(); // Por enquanto, pausar = desconectar
    }, [disconnect]);

    // Retomar
    const resume = useCallback(async () => {
        return await connect(); // Por enquanto, retomar = conectar
    }, [connect]);

    // Limpar sessão
    const clearSession = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await whatsappService.clearSession();
            
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

    // Enviar mensagem
    const sendMessage = useCallback(async (number, message) => {
        try {
            const result = await whatsappService.sendMessage(number, message);
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, []);

    // Listener para mudanças de status
    useEffect(() => {
        const removeListener = whatsappService.addListener((newStatus) => {
            // Force update by creating new object
            setStatus({
                ...newStatus,
                timestamp: newStatus.timestamp || new Date().toISOString()
            });
            setError(null);
        });

        // Inicialização
        refreshStatus();

        // Cleanup
        return () => {
            removeListener();
            whatsappService.stopPolling();
        };
    }, [refreshStatus]);

    return {
        // Estado
        status,
        loading,
        error,
        serviceAvailable,
        
        // Ações
        connect,
        disconnect,
        pause,
        resume,
        clearSession,
        sendMessage,
        refreshStatus,
        checkService,
        
        // Informações derivadas
        isConnected: status.isConnected,
        hasQRCode: status.hasQRCode,
        qrCode: status.qrCode,
        state: status.state
    };
};

export default useWhatsApp;
