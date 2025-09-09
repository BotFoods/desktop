/**
 * Hook para escutar eventos WhatsApp v2 em tempo real via Socket.IO
 */

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const useWhatsAppEvents = (user, onEvent = null) => {
    const [socket, setSocket] = useState(null);
    const [lastEvent, setLastEvent] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user?.loja_id) return;

        // Conectar ao Socket.IO
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const socketInstance = io(API_BASE_URL, {
            transports: ['websocket', 'polling']
        });

        setSocket(socketInstance);

        // Listener para conexão
        socketInstance.on('connect', () => {
            console.log('Socket conectado para WhatsApp events');
            setIsConnected(true);
        });

        // Listener para desconexão
        socketInstance.on('disconnect', () => {
            console.log('Socket desconectado');
            setIsConnected(false);
        });

        // Listener principal para eventos WhatsApp
        socketInstance.on('whatsapp_event', (eventData) => {
            console.log('Evento WhatsApp recebido:', eventData);

            // Verificar se o evento é para a loja atual
            if (eventData.loja_id && eventData.loja_id !== user.loja_id) {
                return; // Ignorar eventos de outras lojas
            }

            setLastEvent(eventData);
            onEvent?.(eventData);

            // Processar tipos específicos de eventos
            switch (eventData.type) {
                case 'whatsapp_qr_ready':
                    setQrCode(eventData.qr_code);
                    setConnectionStatus('qr_ready');
                    break;

                case 'whatsapp_connected':
                    setQrCode(null);
                    setConnectionStatus('connected');
                    break;

                case 'whatsapp_disconnected':
                    setQrCode(null);
                    setConnectionStatus('disconnected');
                    break;

                case 'whatsapp_connecting':
                    setConnectionStatus('connecting');
                    break;

                case 'whatsapp_authenticated':
                    setQrCode(null);
                    setConnectionStatus('authenticated');
                    break;

                case 'whatsapp_provisioned':
                    setConnectionStatus('provisioned');
                    break;

                case 'whatsapp_provision_failed':
                case 'whatsapp_auth_failed':
                    setConnectionStatus('error');
                    break;

                default:
                    setConnectionStatus(eventData.type);
            }
        });

        // Cleanup na desmontagem
        return () => {
            socketInstance.disconnect();
        };
    }, [user?.loja_id]);

    // Função para limpar o QR Code manualmente
    const clearQrCode = () => {
        setQrCode(null);
    };

    // Função para limpar todos os estados
    const clearAll = () => {
        setLastEvent(null);
        setQrCode(null);
        setConnectionStatus(null);
    };

    // Retornar dados e funções úteis
    return {
        socket,
        isConnected,
        lastEvent,
        qrCode,
        connectionStatus,
        clearQrCode,
        clearAll,
        
        // Estados derivados para facilitar o uso
        isWaitingForQr: connectionStatus === 'connecting' || connectionStatus === 'qr_ready',
        isConnectedToWhatsApp: connectionStatus === 'connected',
        hasError: connectionStatus === 'error',
        isProvisioned: connectionStatus === 'provisioned'
    };
};

export default useWhatsAppEvents;
